/**
 * Technician Location Service
 * 
 * Manages location tracking for technicians with high accuracy,
 * background updates, and distance-based throttling.
 * Replaces legacy driverLocationService.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert } from 'react-native';
import { calculateBearing } from '../utils/mapUtils';
import config from '../constants/config';

const BACKGROUND_TASK = config.BACKGROUND_TASK_NAME;

class TechnicianLocationService {
    constructor() {
        this.isTracking = false;
        this.locationSubscription = null;
        this.lastLocation = null;
        this.onLocationUpdate = null;
        this.lastSentLocation = null;
        this.heartbeatInterval = null;
    }

    /**
     * Request location permissions
     * @returns {Promise<boolean>} True if granted
     */
    async requestPermissions() {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                console.warn('Foreground location permission denied');
                return false;
            }

            // PROMINENT DISCLOSURE FOR BACKGROUND LOCATION
            const disclosureAccepted = await new Promise((resolve) => {
                Alert.alert(
                    "Background Location Access",
                    "Zyro AC collects location data to enable service dispatch and live tracking even when the app is closed or not in use. This allows us to dispatch the nearest technician to customers and provide them with accurate arrival times.\n\nPlease select 'Allow all the time' in the next screen to enable this feature.",
                    [
                        { text: "Decline", style: "cancel", onPress: () => resolve(false) },
                        { text: "Accept", onPress: () => resolve(true) }
                    ],
                    { cancelable: false }
                );
            });

            if (!disclosureAccepted) {
                console.warn('User declined background location disclosure');
                return true; // Still return true as foreground is sufficient for basic tracking
            }

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            if (backgroundStatus !== 'granted') {
                console.warn('Background location permission denied');
            }

            return true;
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return false;
        }
    }

    /**
     * Check if location services are enabled
     * @returns {Promise<boolean>}
     */
    async isLocationEnabled() {
        try {
            return await Location.hasServicesEnabledAsync();
        } catch (error) {
            console.error('Error checking location services:', error);
            return false;
        }
    }

    /**
     * Start tracking technician location (foreground)
     * @param {function} callback - Called with location updates
     */
    async startTracking(callback) {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            const isEnabled = await this.isLocationEnabled();
            if (!isEnabled) {
                throw new Error('Location services disabled');
            }

            this.onLocationUpdate = callback;

            // Configure high-accuracy tracking
            this.locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Highest,
                    timeInterval: 1000,
                    distanceInterval: 0,
                    mayShowUserSettingsDialog: true,
                },
                (location) => {
                    this.handleLocationUpdate(location);
                }
            );

            // Manual heartbeat to poke GPS if watcher stalls (every 5s)
            this.heartbeatInterval = setInterval(async () => {
                if (this.isTracking) {
                    try {
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                        this.handleLocationUpdate(loc);
                    } catch (e) {
                        console.warn('GPS Heartbeat failed:', e.message);
                    }
                }
            }, 5000);

            this.isTracking = true;
            console.log('Technician location tracking started (foreground)');

            return true;
        } catch (error) {
            console.error('Error starting location tracking:', error);
            throw error;
        }
    }

    /**
     * Start background location tracking
     */
    async startBackgroundTracking() {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
            if (isRegistered) {
                console.log('Background task already registered');
                return true;
            }

            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            // Start background location task with optimized settings
            await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
                foregroundService: {
                    notificationTitle: 'Technician Online',
                    notificationBody: 'Your location is being tracked for active service dispatch.',
                    notificationColor: '#B76E79',
                },
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
            });

            console.log('Technician background tracking started');
            return true;
        } catch (error) {
            console.warn('Background tracking start failed:', error.message);
            return false;
        }
    }

    /**
     * Stop tracking
     */
    async stopTracking() {
        try {
            if (this.locationSubscription) {
                this.locationSubscription.remove();
                this.locationSubscription = null;
            }

            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }

            // Stop background tracking
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
            if (isTaskRegistered) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
            }

            this.isTracking = false;
            this.lastLocation = null;
            this.lastSentLocation = null;
            this.onLocationUpdate = null;

            console.log('Technician location tracking stopped');
        } catch (error) {
            console.error('Error stopping location tracking:', error);
        }
    }

    /**
     * Handle location update
     * @param {object} location - Expo location object
     */
    handleLocationUpdate(location) {
        const { latitude, longitude, speed, heading, accuracy } = location.coords;

        // Reject updates with poor accuracy (> 100m)
        if (accuracy > 100) {
            return;
        }

        let bearing = heading;

        if (bearing === -1 || bearing === null) {
            if (this.lastLocation) {
                bearing = calculateBearing(
                    { latitude: this.lastLocation.latitude, longitude: this.lastLocation.longitude },
                    { latitude, longitude }
                );
            } else {
                bearing = 0;
            }
        }

        const currentSpeed = speed || 0;

        const locationData = {
            lat: latitude,
            lng: longitude,
            bearing,
            speed: currentSpeed,
            timestamp: Date.now(),
            accuracy,
        };

        this.lastLocation = { latitude, longitude };
        this.lastSentLocation = { latitude, longitude };

        // Notify callback
        if (this.onLocationUpdate) {
            this.onLocationUpdate(locationData);
        }
    }

    /**
     * Get current location (one-time)
     * @returns {Promise<object>} Location data
     */
    async getCurrentLocation() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });

            return {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                bearing: location.coords.heading || 0,
                speed: location.coords.speed || 0,
                timestamp: Date.now(),
                accuracy: location.coords.accuracy,
            };
        } catch (error) {
            console.error('Error getting current location:', error);
            throw error;
        }
    }
}

// Define background task (must be defined at top level for Expo)
if (BACKGROUND_TASK) {
    try {
        TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }) => {
            if (error) {
                console.error('Technician background location error:', error);
                return;
            }

            if (data && data.locations && data.locations.length > 0) {
                const location = data.locations[0];
                const { latitude, longitude, heading, speed } = location.coords;

                try {
                    const technicianSocketService = (await import('./technicianSocketService')).default;

                    if (technicianSocketService && technicianSocketService.isConnected) {
                        technicianSocketService.sendLocation(null, {
                            lat: latitude,
                            lng: longitude,
                            bearing: heading || 0,
                            speed: speed || 0,
                            timestamp: Date.now(),
                            accuracy: location.coords.accuracy,
                        });
                    }
                } catch (err) {
                    console.error('Failed to emit background location via technicianSocketService:', err);
                }
            }
        });
    } catch (e) {
        console.warn('TaskManager defineTask warning:', e.message);
    }
}

export default new TechnicianLocationService();
