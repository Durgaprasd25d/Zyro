/**
 * Technician Socket Service
 * 
 * WebSocket client for technician to receive job notifications and updates
 */

import io from 'socket.io-client';
import config from '../constants/config';
import { Alert } from 'react-native';

class TechnicianSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.onJobRequest = null;
        this.onJobCancelled = null;
        this.onJobCompleted = null;
        this.onConnectionChange = null;
    }

    /**
     * Connect to WebSocket server
     * @param {string} userId - User identifier for private room
     * @param {function} onJobRequest - Callback when new job is requested
     * @param {function} onJobCancelled - Callback when a job is cancelled
     * @param {function} onConnectionChange - Callback for connection status
     * @param {function} onJobCompleted - Callback when a job is completed
     */
    connect(userId, onJobRequest, onJobCancelled, onConnectionChange, onJobCompleted) {
        if (this.socket) {
            this.disconnect();
        }

        this.userId = userId;
        this.onJobRequest = onJobRequest;
        this.onJobCancelled = onJobCancelled;
        this.onConnectionChange = onConnectionChange;
        this.onJobCompleted = onJobCompleted;

        console.log('Technician connecting to socket:', config.SOCKET_URL);

        this.socket = io(config.SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 10000,
        });

        this.socket.on('connect', () => {
            console.log('Technician socket connected');
            this.isConnected = true;

            // Identify user to join private room
            if (userId) {
                this.socket.emit('identify', { userId });
                console.log('Technician identified:', userId);
            }

            if (this.onConnectionChange) {
                this.onConnectionChange('connected');
            }
        });

        this.setupEventListeners();
        return this.socket;
    }

    /**
     * Setup socket event listeners
     */
    setupEventListeners() {
        if (!this.socket) return;

        // Note: connect/disconnect/error are handled in the connect() method or defaults

        // Listen for new job requests
        this.socket.on('ride:requested', (data) => {
            console.log('🔔 New job request received:', data);
            if (this.onJobRequest) {
                this.onJobRequest(data);
            }
        });

        // Listen for job cancellations (sent to ride room)
        this.socket.on('ride:cancelled', (data) => {
            console.log('❌ Ride cancelled (ride room):', data);
            if (this.onJobCancelled) {
                this.onJobCancelled(data);
            }
        });

        // Listen for job cancellations (sent to private user room)
        this.socket.on('job:cancelled', (data) => {
            console.log('❌ Job cancelled (user room):', data);
            if (this.onJobCancelled) {
                this.onJobCancelled(data);
            }
        });

        // Listen for job completion
        this.socket.on('ride:completed', (data) => {
            console.log('✅ Ride completed received:', data);
            if (this.onJobCompleted) {
                this.onJobCompleted(data);
            }
        });
    }

    /**
     * Emit technician location update
     * @param {string|null} rideId - Ride ID (optional)
     * @param {object} location - { lat, lng, bearing, etc. }
     * @param {string|null} explicitUserId - User ID (optional)
     */
    sendLocation(rideId, location, explicitUserId) {
        if (this.socket && this.isConnected) {
            const payload = {
                rideId: rideId || null,
                userId: explicitUserId || this.userId,
                technicianId: explicitUserId || this.userId,
                ...location
            };
            this.socket.emit('technician:location:update', payload);
            this.socket.emit('driver:location:update', payload);
        }
    }

    /**
     * Update job status via socket
     * @param {string} rideId - Ride ID
     * @param {string} status - New status (arrived, started, completed)
     */
    updateStatus(rideId, status, extraData = {}) {
        if (!this.socket || !this.isConnected || !rideId) return;

        console.log(`📤 Emitting status update: ${status} for ride ${rideId}`);

        // Map internal status to socket events expected by customer/backend
        const eventMap = {
            'arrived': 'ride:arrived',
            'started': 'ride:in_progress',
            'completed': 'ride:completed',
            'cancelled': 'ride:cancelled',
            'service_ended': 'ride:service_ended'
        };

        const event = eventMap[status];
        if (event) {
            this.socket.emit(event, { rideId, status, ...extraData });
        }
    }

    /**
     * Get socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            console.log('Disconnecting technician socket');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
}

export default new TechnicianSocketService();
