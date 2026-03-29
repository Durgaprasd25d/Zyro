import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import config from '../../constants/config';
import driverLocationService from '../../services/driverLocationService';
import technicianSocketService from '../../services/technicianSocketService';
import rideService from '../../services/rideService';
import { COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

// Set Access Token
MapboxGL.setAccessToken(config.MAPBOX_ACCESS_TOKEN);

const TechnicianNavigationScreen = ({ route, navigation }) => {
  const { job: initialJob, rideId: initialRideId } = route?.params || {};
  const [job, setJob] = useState(initialJob);
  const rideId = initialRideId || job?.id || job?.rideId;
  const destination = job?.pickup;
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [status, setStatus] = useState(job?.status?.toLowerCase() || 'accepted');
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(!destination?.lat);
  const [otp, setOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const mapRef = useRef(null);

  // Fetch job details if missing coordinates
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!destination?.lat && rideId) {
        setLoading(true);
        try {
          const response = await rideService.getRideDetails(rideId);
          if (response.success) {
            setJob(response.data);
            setStatus(response.data.status?.toLowerCase() || 'accepted');
          }
        } catch (err) {
          console.error("Fetch job error:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchJobDetails();
  }, [rideId]);

  useEffect(() => {
    const initTracking = async () => {
      try {
        await driverLocationService.startTracking((loc) => {
          const newPos = { latitude: loc.lat, longitude: loc.lng };
          setCurrentLocation(newPos);
          
          // Broadcast location to customer via socket
          technicianSocketService.sendLocation(rideId, loc);
        });
        setIsReady(true);
      } catch (error) {
        console.error('Tracking Error:', error);
        Alert.alert('Error', 'Failed to start location tracking');
      }
    };

    initTracking();

    return () => {
      driverLocationService.stopTracking();
    };
  }, [rideId]);

  const handleLaunchGoogleMaps = () => {
    const lat = destination?.lat || destination?.latitude;
    const lng = destination?.lng || destination?.longitude;
    
    if (!lat || !lng) {
      Alert.alert('Error', 'Destination coordinates are missing');
      return;
    }

    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to browser/web maps if app not installed
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'arrived') {
      setOtpModalVisible(true);
      return;
    }

    if (newStatus === 'started') {
      try {
        const result = await rideService.startService(rideId);
        if (result.success) {
          setStatus('started');
          technicianSocketService.updateStatus(rideId, 'started');
        } else {
          Alert.alert('Error', result.error || 'Failed to start service');
        }
      } catch (error) {
        Alert.alert('Error', 'Connection failed');
      }
      return;
    }

    if (newStatus === 'completed') {
      try {
        const result = await rideService.endService(rideId);
        if (result.success) {
          // Emit service_ended to trigger customer payment
          technicianSocketService.updateStatus(rideId, 'service_ended', result.data);
          // Navigate to COD Collection with updated price/data
          navigation.navigate('CODCollection', { job: { ...job, ...result.data } });
        } else {
          Alert.alert('Error', result.error || 'Failed to end service');
        }
      } catch (error) {
        Alert.alert('Error', 'Connection failed');
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) return;
    
    setVerifying(true);
    try {
      const result = await rideService.verifyArrival(rideId, otp);
      if (result.success) {
        setOtpModalVisible(false);
        setStatus('arrived');
        setOtp('');
        // Broadcast arrival to customer
        technicianSocketService.updateStatus(rideId, 'arrived');
        Alert.alert('Success', 'Arrival verified! You can now start the service.');
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const renderMap = () => {
    const destLat = Number(destination?.lat || destination?.latitude);
    const destLng = Number(destination?.lng || destination?.longitude);

    if (isNaN(destLat) || isNaN(destLng)) {
      return (
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={COLORS.roseGold} />
          <Text style={styles.errorText}>Loading service coordinates...</Text>
        </View>
      );
    }

    return (
      <MapboxGL.MapView 
        style={styles.map} 
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={currentLocation ? [currentLocation.longitude, currentLocation.latitude] : [destLng, destLat]}
          followUserLocation={true}
          followUserMode="course"
        />

        {/* Current Location Marker */}
        {currentLocation && (
          <MapboxGL.PointAnnotation
            id="currentLocation"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Destination Marker */}
        <MapboxGL.PointAnnotation
          id="destination"
          coordinate={[destLng, destLat]}
        >
          <View style={styles.destMarkerContainer}>
            <MaterialCommunityIcons name="map-marker-check" size={32} color={COLORS.roseGold} />
          </View>
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>
    );
  };

  const renderOTPModal = () => (
    <Modal
      visible={otpModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setOtpModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Verify Arrival</Text>
          <Text style={styles.modalSubtitle}>Enter the 4-digit OTP provided by the customer</Text>
          
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor="#666"
            autoFocus={true}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => {
                setOtpModalVisible(false);
                setOtp('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.verifyButton, otp.length !== 4 && styles.disabledButton]} 
              onPress={handleVerifyOTP}
              disabled={otp.length !== 4 || verifying}
            >
              {verifying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderOTPModal()}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        {renderMap()}
        
        {/* Quick Launch Floating Button */}
        <TouchableOpacity 
          style={styles.launchButton}
          onPress={handleLaunchGoogleMaps}
        >
          <MaterialCommunityIcons name="google-maps" size={24} color="white" />
          <Text style={styles.launchButtonText}>Launch Google Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.jobInfo}>
          <Text style={styles.destLabel}>Destination</Text>
          <Text style={styles.destAddress} numberOfLines={1}>
            {destination?.address || 'Service Location'}
          </Text>
        </View>

        {status === 'accepted' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleStatusUpdate('arrived')}
          >
            <Text style={styles.actionButtonText}>Verify Arrival</Text>
          </TouchableOpacity>
        )}

        {status === 'arrived' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleStatusUpdate('started')}
          >
            <Text style={styles.actionButtonText}>Start Service</Text>
          </TouchableOpacity>
        )}

        {status === 'started' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => handleStatusUpdate('completed')}
          >
            <Text style={styles.actionButtonText}>End Service</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    padding: 5,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  launchButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#4285F4', // Google Blue
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  launchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomBar: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  jobInfo: {
    marginBottom: 15,
  },
  destLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  destAddress: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: COLORS.roseGold || '#B76E79',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userMarkerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: 'white',
  },
  destMarkerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  verifyButton: {
    backgroundColor: COLORS.roseGold || '#B76E79',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    color: '#888',
    marginTop: 10,
    fontSize: 14,
  }
});

export default TechnicianNavigationScreen;
