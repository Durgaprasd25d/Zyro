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
  TextInput,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from "../../constants/designSystem";

const { width } = Dimensions.get("window");

// Set Mapbox Access Token
MapboxGL.setAccessToken(config.MAPBOX_ACCESS_TOKEN);

import config from "../../constants/config";

export default function MapPickerScreen({ navigation, route }) {
  // Separated camera state to avoid cyclical jumpiness during drags
  const [cameraCenter, setCameraCenter] = useState([77.209, 28.6139]); // [lng, lat]
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  const cameraRef = useRef(null);
  const searchTimeout = useRef(null);

  // Animation for marker bounce
  const markerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Automatically load current customer location or initial selected location on open
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async (forceGps = false) => {
    try {
      setLoading(true);
      
      // If a previously selected location is passed, load that directly unless forceGps is requested
      if (!forceGps && route.params?.initialLocation) {
        const { lat, lng, description } = route.params.initialLocation;
        setCameraCenter([lng, lat]);
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setAddress(description || "");
        setLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to center the map on your current location."
        );
        setLoading(false);
        return;
      }

      // Fetch precise high-accuracy GPS coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLng = location.coords.longitude;
      const newLat = location.coords.latitude;

      // Smoothly animate camera directly to high-accuracy GPS coordinates
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [newLng, newLat],
          zoomLevel: 15,
          animationDuration: 800,
          animationMode: "flyTo",
        });
      } else {
        setCameraCenter([newLng, newLat]);
      }

      setRegion({
        latitude: newLat,
        longitude: newLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      await getAddressFromCoords(newLat, newLng);
    } catch (error) {
      console.error("Error getting current location:", error);
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

  const isSelectingFromSearch = useRef(false);

  const selectSearchResult = (item) => {
    const [lng, lat] = item.center;
    
    // Set lock flag so camera flight doesn't trigger reverse geocoding to overwrite the chosen name
    isSelectingFromSearch.current = true;
    
    // Instantly update address name in 0ms!
    const selectedAddressName = item.place_name || item.text || "";
    setAddress(selectedAddressName);
    setSearchText(item.text || item.place_name);
    setSearchResults([]);

    setRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 15,
        animationDuration: 800,
        animationMode: "flyTo",
      });
    } else {
      setCameraCenter([lng, lat]);
    }

    Keyboard.dismiss();

    // Release selection lock after camera finishes gliding
    setTimeout(() => {
      isSelectingFromSearch.current = false;
    }, 1000);
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${config.MAPBOX_ACCESS_TOKEN}&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0 && !isSelectingFromSearch.current) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Mapbox Geocoding error:", error);
    }
  };

  const geocodeDebounceTimer = useRef(null);

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);

    if (isSelectingFromSearch.current) return;

    if (geocodeDebounceTimer.current) {
      clearTimeout(geocodeDebounceTimer.current);
    }

    // Debounce reverse geocoding until camera comes to a steady stop
    geocodeDebounceTimer.current = setTimeout(() => {
      if (!isSelectingFromSearch.current) {
        getAddressFromCoords(newRegion.latitude, newRegion.longitude);
      }

      // Bounce center marker once camera rests
      Animated.sequence([
        Animated.timing(markerAnimation, {
          toValue: -12,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(markerAnimation, {
          toValue: 0,
          friction: 3.5,
          tension: 45,
          useNativeDriver: true,
        }),
      ]).start();
    }, 350);
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
    await loadCurrentLocation(true);
  };

  const handleClearLocation = () => {
    setSearchText("");
    setSearchResults([]);
    setSearchKey((prev) => prev + 1);
    loadCurrentLocation();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* Header with Dark UI */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Premium Dark Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={C.onSurfaceVariant} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Search for location"
              value={searchText}
              onChangeText={handleSearch}
              placeholderTextColor={C.onSurfaceVariant}
              keyboardAppearance="dark"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 8 }} />
            )}
            {searchText.length > 0 && !isSearching && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Dropdown Results Overlay */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsDropdown}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchRow}
                    onPress={() => selectSearchResult(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={styles.rowIconBg}>
                        <Ionicons name="location-outline" size={16} color={C.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowMainText} numberOfLines={1}>
                          {item.text}
                        </Text>
                        <Text style={styles.rowSubText} numberOfLines={2}>
                          {item.place_name}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 250 }}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Mapbox Map Styled with Luxury Dark theme */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Dark} // Styled in matching premium dark mode theme color!
          onRegionDidChange={(e) => {
            const coords = e?.geometry?.coordinates || e?.properties?.center;
            if (coords && Array.isArray(coords) && coords.length >= 2) {
              handleRegionChangeComplete({
                latitude: coords[1],
                longitude: coords[0],
              });
            }
          }}
          onDidFinishLoadingMap={() => setIsMapReady(true)}
        >
          <MapboxGL.UserLocation visible={true} animated={true} />
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={15}
            centerCoordinate={cameraCenter}
            animationMode="flyTo"
            animationDuration={1000}
          />
        </MapboxGL.MapView>

        {/* Theme-matching Center Marker Pin */}
        <Animated.View
          style={[
            styles.markerFixed,
            {
              transform: [{ translateY: markerAnimation }],
            },
          ]}
        >
          <View style={styles.markerPin}>
            <Ionicons name="location" size={40} color={C.primary} />
          </View>
          <View style={styles.markerShadow} />
        </Animated.View>

        {/* Floating Custom Theme My Location Button */}
        <TouchableOpacity
          style={styles.myLocationFloatingButton}
          onPress={handleMyLocation}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={24} color="#131313" />
        </TouchableOpacity>
      </View>

      {/* Bottom Address Confirmation Card */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomCard}>
        <View style={styles.addressSection}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="navigate" size={18} color={C.primary} />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLabel}>SELECTED SERVICE LOCATION</Text>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={C.primary}
                style={{ marginTop: 4, alignSelf: "flex-start" }}
              />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {address || "Drag map to position pin at address"}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!address || loading) && styles.confirmButtonDisabled,
          ]}
          disabled={!address || loading}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.confirmButtonText,
              (!address || loading) && styles.confirmButtonTextDisabled,
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
    backgroundColor: "#0D0D0D",
  },
  header: {
    backgroundColor: "#0D0D0D",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1C",
    zIndex: 999,
    elevation: 10,
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
    borderRadius: 20,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#262626",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TY.titleMd.fontFamily,
    fontWeight: "600",
    color: C.onSurface,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: "relative",
    zIndex: 9999,
    elevation: 15,
  },
  searchInputContainer: {
    backgroundColor: "#161616",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
  },
  textInput: {
    height: 44,
    fontSize: 14,
    color: C.onSurface,
    flex: 1,
  },
  searchIconContainer: {
    marginRight: 8,
  },
  clearButton: {
    padding: 8,
  },
  searchResultsDropdown: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#333333",
    position: "absolute",
    top: 52,
    left: 16,
    right: 16,
    maxHeight: 260,
    elevation: 25,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    overflow: "hidden",
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  rowMainText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurface,
  },
  rowSubText: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: "#222222",
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
    marginTop: -40,
    alignItems: "center",
  },
  markerPin: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  markerShadow: {
    width: 16,
    height: 3,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    marginTop: -2,
  },
  myLocationFloatingButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomCard: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#222222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    fontFamily: TY.labelCaps.fontFamily,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: C.onSurface,
    fontWeight: "500",
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#131313",
  },
  confirmButtonTextDisabled: {
    color: C.onSurfaceVariant,
    opacity: 0.6,
  },
});
