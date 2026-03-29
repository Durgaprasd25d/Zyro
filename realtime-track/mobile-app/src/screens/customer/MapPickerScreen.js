import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Keyboard,
  Animated,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";

import config from "../../constants/config";

// Set Mapbox Access Token
MapboxGL.setAccessToken(config.MAPBOX_ACCESS_TOKEN);

// Uber-Inspired Clean Palette
const COLORS = {
  black: "#000000",
  white: "#ffffff",
  background: "#f7f7f7",
  textPrimary: "#000000",
  textSecondary: "#545454",
  textTertiary: "#8a8a8a",
  border: "#e0e0e0",
  accent: "#06c167",
  blue: "#276ef1",
  card: "#ffffff",
};

export default function MapPickerScreen({ navigation, route }) {
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [initialLocationLoaded, setInitialLocationLoaded] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchKey, setSearchKey] = useState(0); // Key to force component reset
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const searchTimeout = useRef(null);

  // Animation for marker bounce
  const markerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setInitialLocationLoaded(true);

      // Animate to current location if map is ready
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [newRegion.longitude, newRegion.latitude],
          zoomLevel: 14,
          animationDuration: 500,
        });
      }

      await getAddressFromCoords(
        location.coords.latitude,
        location.coords.longitude,
      );
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${config.MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setSearchResults(data.features || []);
      } catch (error) {
        console.error("Mapbox Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const selectSearchResult = (item) => {
    const [lng, lat] = item.center;
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    setAddress(item.place_name);
    setSearchText(item.text || item.place_name);
    setSearchResults([]);

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }

    Keyboard.dismiss();
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${config.MAPBOX_ACCESS_TOKEN}&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Mapbox Geocoding error:", error);
    }
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    getAddressFromCoords(newRegion.latitude, newRegion.longitude);

    // Animate marker bounce
    Animated.sequence([
      Animated.timing(markerAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(markerAnimation, {
        toValue: 0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlaceSelect = (data, details = null) => {
    if (!details || !details.geometry) return;

    const newRegion = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    setAddress(data.description);
    setSearchText(data.description);

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [newRegion.longitude, newRegion.latitude],
        zoomLevel: 14,
        animationDuration: 500,
      });
    }

    Keyboard.dismiss();

    setTimeout(() => {
      if (googlePlacesRef.current) {
        googlePlacesRef.current.blur();
      }
      // Increment key to reset component for next search
      setSearchKey((prev) => prev + 1);
    }, 100);
  };

  const handleConfirm = () => {
    if (route.params?.onSelect) {
      route.params.onSelect({
        description: address,
        location: {
          lat: region.latitude,
          lng: region.longitude,
        },
      });
    }
    navigation.goBack();
  };

  const handleMyLocation = async () => {
    await loadCurrentLocation();
  };

  const handleClearLocation = () => {
    setSearchText("");
    setSearchResults([]);
    setSearchKey((prev) => prev + 1);
    loadCurrentLocation();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.googleInputContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={COLORS.textTertiary} />
            </View>
            <TextInput
              style={styles.googleInput}
              placeholder="Search for location"
              value={searchText}
              onChangeText={handleSearch}
              placeholderTextColor={COLORS.textTertiary}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={COLORS.black} style={{ marginRight: 8 }} />
            )}
            {searchText.length > 0 && !isSearching && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearLocation}
              >
                <Ionicons
                  name="close-circle" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Overlay */}
          {searchResults.length > 0 && (
            <View style={styles.googleListView}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.googleRow}
                    onPress={() => selectSearchResult(item)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, color: COLORS.black, fontWeight: '500' }} numberOfLines={1}>
                          {item.text}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }} numberOfLines={1}>
                          {item.place_name}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.googleSeparator} />}
                keyboardShouldPersistTaps="always"
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          onRegionDidChange={(e) => {
            const center = e.geometry.coordinates;
            handleRegionChangeComplete({
              latitude: center[1],
              longitude: center[0],
            });
          }}
        >
          <MapboxGL.UserLocation visible={true} />
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={14}
            centerCoordinate={[region.longitude, region.latitude]}
          />
        </MapboxGL.MapView>

        {/* Center Marker */}
        <Animated.View
          style={[
            styles.markerFixed,
            {
              transform: [{ translateY: markerAnimation }],
            },
          ]}
        >
          <View style={styles.markerPin}>
            <Ionicons name="location" size={40} color={COLORS.black} />
          </View>
          <View style={styles.markerShadow} />
        </Animated.View>

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocation}
        >
          <Ionicons name="locate" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Bottom Address Card */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomCard}>
        <View style={styles.addressSection}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={20} color={COLORS.black} />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLabel}>Selected Location</Text>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.black}
                style={{ marginTop: 4 }}
              />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {address || "Move map to select location"}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            !address && styles.confirmButtonDisabled,
          ]}
          disabled={!address || loading}
          onPress={handleConfirm}
        >
          <Text
            style={[
              styles.confirmButtonText,
              !address && styles.confirmButtonTextDisabled,
            ]}
          >
            Confirm Location
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.black,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 1000,
  },
  googleContainer: {
    flex: 0,
  },
  googleInputContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
  },
  googleInput: {
    height: 44,
    fontSize: 15,
    color: COLORS.black,
    fontWeight: "500",
    flex: 1,
  },
  searchIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
  },
  googleListView: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    elevation: 10,
    zIndex: 2000,
    maxHeight: 250,
  },
  googleRow: {
    padding: 14,
  },
  googleSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -20,
    marginTop: -48,
    alignItems: "center",
  },
  markerPin: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  markerShadow: {
    width: 20,
    height: 4,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 4,
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  addressText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: "500",
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.background,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  confirmButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});
