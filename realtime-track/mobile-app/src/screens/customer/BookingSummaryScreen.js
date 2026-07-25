import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapboxGL from "@rnmapbox/maps";
import config from "../../constants/config";
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from "../../constants/designSystem";

const { width } = Dimensions.get("window");

// Set Mapbox Access Token
MapboxGL.setAccessToken(config.MAPBOX_ACCESS_TOKEN);

// Dynamic Service Image Mapping matching the exact backend seeded services
const SERVICE_IMAGES = {
  "gas leak fix": require("../../../assets/gas_leak_fix.png"),
  "cooling issue": require("../../../assets/cooling_issue.png"),
  "deep cleaning": require("../../../assets/deep_cleaning.png"),
  "standard checkup": require("../../../assets/standard_checkup.png"),
  "unit installation": require("../../../assets/unit_installation.png"),
  "fast repair": require("../../../assets/fast_repair.png"),
};

const getServiceImage = (name) => {
  if (!name) return SERVICE_IMAGES["standard checkup"];
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("gas") || normalized.includes("leak")) return SERVICE_IMAGES["gas leak fix"];
  if (normalized.includes("cooling") || normalized.includes("issue") || normalized.includes("cool")) return SERVICE_IMAGES["cooling issue"];
  if (normalized.includes("deep") || normalized.includes("clean") || normalized.includes("chemical")) return SERVICE_IMAGES["deep cleaning"];
  if (normalized.includes("checkup") || normalized.includes("standard") || normalized.includes("maintenance")) return SERVICE_IMAGES["standard checkup"];
  if (normalized.includes("installation") || normalized.includes("unit") || normalized.includes("install")) return SERVICE_IMAGES["unit installation"];
  if (normalized.includes("fast") || normalized.includes("emergency") || normalized.includes("repair")) return SERVICE_IMAGES["fast repair"];
  return SERVICE_IMAGES["standard checkup"];
};

export default function BookingSummaryScreen({ route, navigation }) {
  const { service, date, time, address } = route.params;
  const [currentAddress, setCurrentAddress] = useState(address);
  const [fees, setFees] = useState({ platformFee: 0, gst: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/services/settings`);
        const result = await response.json();
        if (result.success) {
          setFees(result.settings);
        }
      } catch (error) {
        console.error("Error fetching fees:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  const basePrice = Math.round(parseFloat(service.price));
  const platformFeeVal = Math.round(parseFloat(fees.platformFee || 49));
  const taxPercent = fees.gst || 18;
  const taxVal = Math.round(basePrice * (taxPercent / 100));
  const total = Math.round(basePrice + platformFeeVal + taxVal);

  const pricing = {
    basePrice,
    platformFee: platformFeeVal,
    gst: taxVal,
    gstRate: taxPercent,
    price: total,
  };

  // Split address description for premium dual-line subtitle presentation
  const formatAddressText = (desc) => {
    if (!desc) return { main: "No location selected", sub: "Please specify your address" };
    const parts = desc.split(",");
    const main = parts[0].trim();
    const sub = parts.slice(1).join(",").trim();
    return {
      main: main,
      sub: sub || "Confirmed Service Area",
    };
  };

  const addressDetails = formatAddressText(currentAddress?.description);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* Header matching exact layout */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Summary</Text>
          {/* Spacer to keep Title Centered */}
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Details Card with AC Photo & Rating */}
        <View style={styles.serviceCard}>
          <Image
            source={getServiceImage(service?.name)}
            style={styles.serviceImage}
            resizeMode="cover"
          />
          <View style={styles.serviceInfo}>
            <View style={styles.premiumTagContainer}>
              <View style={styles.premiumTag}>
                <Text style={styles.premiumTagText}>PREMIUM SERVICE</Text>
              </View>
            </View>
            <Text style={styles.serviceName} numberOfLines={2}>
              {service?.name}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={C.primary} style={{ marginRight: 4 }} />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.reviewsText}>(120+ Reviews)</Text>
            </View>
          </View>
        </View>

        {/* Date & Time details card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <View style={styles.detailsIconBg}>
              <Ionicons name="calendar-outline" size={20} color={C.primary} />
            </View>
            <View style={styles.detailsTextContainer}>
              <Text style={styles.detailsLabel}>DATE & TIME</Text>
              <Text style={styles.detailsValue}>{date} • {time}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.detailsRow}>
            <View style={styles.detailsIconBg}>
              <Ionicons name="time-outline" size={20} color={C.primary} />
            </View>
            <View style={styles.detailsTextContainer}>
              <Text style={styles.detailsLabel}>ESTIMATED DURATION</Text>
              <Text style={styles.detailsValue}>45 - 60 mins</Text>
            </View>
          </View>
        </View>

        {/* Service Location Card with Embedded Static Non-Editable Mapbox map */}
        <View style={styles.locationCard}>
          <View style={styles.mapWrapper}>
            <MapboxGL.MapView
              style={styles.previewMap}
              styleURL={MapboxGL.StyleURL.Dark}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <MapboxGL.Camera
                zoomLevel={14.5}
                centerCoordinate={[
                  currentAddress?.location?.lng || 77.209,
                  currentAddress?.location?.lat || 28.6139,
                ]}
              />
              {currentAddress?.location && (
                <MapboxGL.PointAnnotation
                  id="static-address-pin"
                  coordinate={[currentAddress.location.lng, currentAddress.location.lat]}
                >
                  <View style={styles.mapPinBg}>
                    <Ionicons name="location" size={24} color={C.primary} />
                  </View>
                </MapboxGL.PointAnnotation>
              )}
            </MapboxGL.MapView>

            {/* Static Map overlay details */}
            <View style={styles.mapOverlayHeader}>
              <Ionicons name="location" size={16} color={C.primary} style={{ marginRight: 6 }} />
              <Text style={styles.mapOverlayTitle}>Service Location</Text>
            </View>
          </View>

          {/* Address descriptions and dynamic Change button */}
          <View style={styles.addressSection}>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressMainText} numberOfLines={1}>
                {addressDetails.main}
              </Text>
              <Text style={styles.addressSubText} numberOfLines={2}>
                {addressDetails.sub}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate("MapPicker", {
                  initialLocation: currentAddress ? {
                    lat: currentAddress.location.lat,
                    lng: currentAddress.location.lng,
                    description: currentAddress.description,
                  } : null,
                  onSelect: (newAddress) => {
                    setCurrentAddress(newAddress);
                  },
                });
              }}
            >
              <Text style={styles.changeBtnText}>CHANGE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing breakdown section header */}
        <Text style={styles.sectionHeader}>Payment Details</Text>
        <View style={styles.pricingCard}>
          {loading ? (
            <ActivityIndicator size="small" color={C.primary} style={{ padding: 24 }} />
          ) : (
            <View style={{ gap: 12 }}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Base Charge</Text>
                <Text style={styles.pricingValue}>₹{basePrice}</Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Platform Fee</Text>
                <Text style={styles.pricingValue}>₹{platformFeeVal}</Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>GST ({taxPercent}%)</Text>
                <Text style={styles.pricingValue}>₹{taxVal}</Text>
              </View>

              <View style={styles.pricingDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Secure Transaction badge */}
        <View style={styles.secureBadgeRow}>
          <Ionicons name="lock-closed" size={14} color={C.onSurfaceVariant} style={{ marginRight: 6 }} />
          <Text style={styles.secureBadgeText}>SECURE SSL ENCRYPTED PAYMENT</Text>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Modern High-End Sticky Bottom CTA */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.payableContainer}>
            <Text style={styles.payableLabel}>TOTAL PAYABLE</Text>
            <Text style={styles.payableAmount}>₹{total}</Text>
          </View>
          <TouchableOpacity
            style={styles.proceedButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("PaymentMethod", {
                total,
                service,
                address: currentAddress,
                time,
                date,
                pricing,
              })
            }
          >
            <Text style={styles.proceedButtonText}>PROCEED TO PAYMENT</Text>
            <Ionicons name="chevron-forward" size={18} color="#131313" />
          </TouchableOpacity>
        </View>
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.primary,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  serviceImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "#1C1C1C",
  },
  serviceInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  premiumTagContainer: {
    flexDirection: "row",
  },
  premiumTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(230, 190, 171, 0.25)",
    backgroundColor: "rgba(230, 190, 171, 0.06)",
  },
  premiumTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 1.2,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    marginTop: 4,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.onSurface,
  },
  reviewsText: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  detailsTextContainer: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 9,
    fontFamily: TY.labelCaps.fontFamily,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  detailsValue: {
    fontSize: 15,
    fontWeight: "600",
    color: C.onSurface,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#222222",
    marginVertical: 16,
  },
  locationCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222222",
  },
  mapWrapper: {
    height: 140,
    width: "100%",
    position: "relative",
  },
  previewMap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPinBg: {
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayHeader: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 13, 13, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  mapOverlayTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: C.onSurface,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  addressTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  addressMainText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.onSurface,
  },
  addressSubText: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  changeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 1.2,
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: TY.labelCaps.fontFamily,
    fontWeight: "700",
    color: C.onSurface,
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  pricingCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricingLabel: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    fontWeight: "500",
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurface,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: "#222222",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: C.primary,
  },
  secureBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    opacity: 0.6,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0D0D0D",
    borderTopWidth: 1,
    borderTopColor: "#1C1C1C",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 0 : 12,
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payableContainer: {
    flex: 1,
  },
  payableLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 1,
  },
  payableAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: C.onSurface,
  },
  proceedButton: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    elevation: 3,
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#131313",
    letterSpacing: 0.5,
  },
});
