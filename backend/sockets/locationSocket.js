/**
 * Socket.IO Location Event Handlers
 * 
 * Manages real-time WebSocket communication for technician location updates,
 * admin live tracking dashboard, and customer tracking subscriptions
 */

const locationStore = require('../services/locationStore');
const Technician = require('../models/Technician');

/**
 * Initialize Socket.IO event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function initializeLocationSocket(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        /**
         * User or Admin identifies themselves
         * Event: 'identify' or 'admin:join'
         */
        socket.on('identify', (data) => {
            const { userId, role } = data;
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`User ${userId} identified and joined room user:${userId}`);
            }
            if (role === 'admin') {
                socket.join('admin:live_tracking');
                console.log(`Admin ${socket.id} joined global tracking room`);
            }
        });

        socket.on('admin:join', () => {
            socket.join('admin:live_tracking');
            console.log(`Admin ${socket.id} explicitly joined admin:live_tracking`);
        });

        /**
         * Driver/Technician joins a ride room
         */
        socket.on('driver:join', (data) => {
            const { rideId } = data;
            if (!rideId) {
                socket.emit('error', { message: 'Missing rideId' });
                return;
            }
            socket.join(`ride:${rideId}`);
            socket.rideId = rideId;
            socket.role = 'driver';
            console.log(`Driver ${socket.id} joined ride ${rideId}`);
        });

        /**
         * Driver/Technician sends location update (handles both driver and technician events)
         */
        const handleLocationUpdate = async (data) => {
            try {
                const { rideId, technicianId, userId, lat, lng, bearing, speed, timestamp, address } = data;
                const techUserId = userId || technicianId || data.driverId;

                if (lat === undefined || lng === undefined) {
                    socket.emit('error', { message: 'Invalid location data' });
                    return;
                }

                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    socket.emit('error', { message: 'Invalid coordinates' });
                    return;
                }

                const locationData = {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    bearing: bearing !== undefined ? parseFloat(bearing) : 0,
                    speed: speed !== undefined ? parseFloat(speed) : 0,
                    address: address || 'Live Location',
                    timestamp: timestamp || Date.now(),
                };

                // Store in memory cache for rides
                if (rideId) {
                    await locationStore.setLocation(rideId, locationData);
                }

                // Persist latest location to MongoDB Technician & User documents
                if (techUserId) {
                    try {
                        await Technician.findOneAndUpdate(
                            { userId: techUserId },
                            {
                                'currentLocation.lat': locationData.lat,
                                'currentLocation.lng': locationData.lng,
                                'currentLocation.address': locationData.address,
                                'currentLocation.lastUpdated': new Date(locationData.timestamp)
                            },
                            { upsert: false }
                        );

                        await User.findByIdAndUpdate(techUserId, {
                            'lastLocation.lat': locationData.lat,
                            'lastLocation.lng': locationData.lng,
                            'lastLocation.address': locationData.address,
                            'lastLocation.lastUpdated': new Date(locationData.timestamp)
                        });
                    } catch (e) {
                        console.error('Error saving technician location to DB:', e.message);
                    }
                }

                // Broadcast to ride room if in active ride
                if (rideId) {
                    io.to(`ride:${rideId}`).emit('customer:location:update', {
                        rideId,
                        location: locationData,
                    });
                }

                // BROADCAST REALTIME TO ADMIN LIVE TRACKING MAP
                io.to('admin:live_tracking').emit('admin:location:update', {
                    technicianId: techUserId,
                    rideId: rideId || null,
                    location: locationData,
                    isOnline: true,
                    updatedAt: locationData.timestamp
                });

            } catch (error) {
                console.error('Error processing location update:', error);
            }
        };

        socket.on('driver:location:update', handleLocationUpdate);
        socket.on('technician:location:update', handleLocationUpdate);

        /**
         * Customer joins a ride room to track driver
         */
        socket.on('customer:join', async (data) => {
            const { rideId } = data;
            if (!rideId) return;

            socket.join(`ride:${rideId}`);
            socket.rideId = rideId;
            socket.role = 'customer';

            const location = await locationStore.getLocation(rideId);
            socket.emit('customer:joined', {
                success: true,
                rideId,
                location: location || null,
            });
        });

        socket.on('disconnect', () => {
            if (socket.rideId) {
                socket.leave(`ride:${socket.rideId}`);
            }
        });
    });

    console.log('Socket.IO location handlers initialized');
}

module.exports = initializeLocationSocket;
