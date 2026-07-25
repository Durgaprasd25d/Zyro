import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapboxGL from "@rnmapbox/maps";
import config from "../../constants/config";
import customerSocketService from "../../services/customerSocketService";
import customerLocationService from "../../services/customerLocationService";

MapboxGL.setAccessToken(config.MAPBOX_ACCESS_TOKEN);

const { width, height } = Dimensions.get("window");

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
  red: "#e11d48",
};

export default function ServiceStatusScreen({ route, navigation }) {
  const { rideId, otp, pricing, paymentTiming } = route?.params || {};
  const [step, setStep] = useState(route.params?.initialStep || "in_progress"); // in_progress, service_ended, completed, rating
  const [liveStatus, setLiveStatus] = useState(null);
  const [currentOtp, setCurrentOtp] = useState(otp || null);
  const [showPayButton, setShowPayButton] = useState(false);
  const [serviceAmount, setServiceAmount] = useState(pricing?.price || 0);
  const [billing, setBilling] = useState(pricing || null);
  const [technicianLocation, setTechnicianLocation] = useState(null);
  const [technicianHeading, setTechnicianHeading] = useState(0);
  const [animatedMarker, setAnimatedMarker] = useState(null);
  const [etaData, setEtaData] = useState({ distance: "--", duration: "--" });
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const getDisplayOtp = () => {
    if (!liveStatus) return currentOtp || otp;

    if (liveStatus.status === "ACCEPTED" || liveStatus.status === "ARRIVED") {
      return liveStatus.arrivalOtp || currentOtp || otp || "----";
    }

    // For completion OTP, prioritize what the backend sent (could be null/masked)
    return (
      liveStatus.completionOtp ||
      (liveStatus.paymentStatus === "PAID" ? currentOtp : null) ||
      "-----"
    );
  };

  useEffect(() => {
    fetchLatestStatus();

    const socket = customerSocketService.getSocket();
    if (socket) {
      socket.on("ride:service_ended", (data) => {
        if (data.price) {
          setServiceAmount(data.price);
          setBilling({
            basePrice: data.basePrice || 0,
            platformFee: data.platformFee || 0,
            gst: data.gst || 0,
            price: data.price,
          });
        }
        if (data.paymentTiming === "POSTPAID") {
          // For Postpaid, always show "Pay Now" first at end of service
          setStep("service_ended");
          setShowPayButton(true);
        } else {
          // Prepaid or already paid: move to verification step
          setStep("verification");
        }
      });

      socket.on("payment:success", (data) => {
        setShowPayButton(false);
        if (data.completionOtp) {
          setCurrentOtp(data.completionOtp);
        }
        // Only move to verification step if service has already started or ended
        // For prepaid, we stay in 'in_progress' to show arrival code if technician hasn't arrived/started
        setLiveStatus((prev) => {
          if (
            prev &&
            (prev.status === "IN_PROGRESS" || prev.status === "SERVICE_ENDED")
          ) {
            setStep("verification");
          }
          return prev;
        });
      });

      socket.on("ride:completed", () => {
        setStep("completed");
      });

      socket.on("ride:arrived", () => {
        fetchLatestStatus();
      });

      socket.on("ride:in_progress", () => {
        fetchLatestStatus();
      });

      socket.on("ride:accepted", (data) => {
        console.log("✅ Ride accepted in StatusScreen:", data);
        fetchLatestStatus(); // Refresh to get technician data
      });

      if (rideId) {
        customerLocationService.startTracking(
          socket,
          rideId,
          handleTechnicianLocationUpdate,
        );
      }
    }

    return () => {
      if (socket) {
        socket.off("ride:service_ended");
        socket.off("payment:success");
        socket.off("ride:completed");
      }
      customerLocationService.stopTracking();
    };
  }, [rideId]);

  const handleTechnicianLocationUpdate = (location) => {
    const { lat, lng, bearing } = location;
    setTechnicianLocation({ latitude: lat, longitude: lng });
    setTechnicianHeading(bearing || 0);

    // Fetch route whenever technician location updates
    if (liveStatus?.pickup) {
      fetchRoute(lng, lat, liveStatus.pickup);
    }
  };

  const fetchRoute = async (techLng, techLat, pickup) => {
    try {
      if (!techLng || !techLat || !pickup) return;

      const destLng = pickup.lng || pickup.longitude;
      const destLat = pickup.lat || pickup.latitude;

      if (!destLng || !destLat) {
        console.warn("📍 [Route] Missing destination coordinates", pickup);
        return;
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${techLng},${techLat};${destLng},${destLat}?access_token=${config.MAPBOX_ACCESS_TOKEN}&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes?.[0]) {
        setRouteGeoJSON(data.routes[0].geometry);
        const route = data.routes[0];
        console.log("✅ [Route] Fetched successfully:", route.distance, "m");
        setEtaData({
          distance:
            route.distance < 1000
              ? `${Math.round(route.distance)} m`
              : `${(route.distance / 1000).toFixed(1)} km`,
          duration:
            route.duration < 60
              ? `${Math.round(route.duration)} s`
              : `${Math.round(route.duration / 60)} min`,
        });
      } else {
        console.warn("📍 [Route] No routes found:", data);
      }
    } catch (error) {
      console.error("❌ [Route] Error fetching route:", error);
    }
  };

  const fetchLatestStatus = async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/ride/${rideId}`);
      const result = await res.json();
      if (result.success) {
        const data = result.data;
        setLiveStatus(data);

        if (data.status === "COMPLETED") {
          setStep("completed");
        } else if (
          data.status === "IN_PROGRESS" ||
          data.status === "ARRIVED" ||
          data.status === "ACCEPTED" ||
          data.status === "SERVICE_ENDED"
        ) {
          if (data.price) {
            setServiceAmount(data.price);
            setBilling({
              basePrice: data.basePrice || 0,
              platformFee: data.platformFee || 0,
              gst: data.gst || 0,
              price: data.price,
            });
          }

          // Initial route fetch if we have both locations
          if (data.pickup && technicianLocation) {
            const tLng = technicianLocation.longitude || technicianLocation.lng;
            const tLat = technicianLocation.latitude || technicianLocation.lat;
            fetchRoute(tLng, tLat, data.pickup);
          }

          if (
            data.status === "SERVICE_ENDED" &&
            data.paymentStatus !== "PAID" &&
            data.paymentTiming === "POSTPAID"
          ) {
            setStep("service_ended");
            setShowPayButton(true);
          } else if (
            data.status === "IN_PROGRESS" ||
            (data.status === "SERVICE_ENDED" && data.paymentStatus === "PAID")
          ) {
            // For Prepaid, show verification (OTP) screen immediately when in progress
            // For Postpaid, only show verification AFTER payment is done
            if (
              data.paymentTiming === "PREPAID" ||
              data.paymentStatus === "PAID"
            ) {
              setStep("verification");
              if (data.completionOtp) setCurrentOtp(data.completionOtp);
            } else {
              // Postpaid + Unpaid + In Progress -> Stay in 'in_progress' step
              setStep("in_progress");
            }
          } else {
            // Still in ACCEPTED/ARRIVED phase
            setStep("in_progress");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching latest status:", error);
    }
  };

  const renderInProgress = () => (
    <View style={styles.content}>
      {(liveStatus?.status === "ACCEPTED" ||
        liveStatus?.status === "ARRIVED" ||
        liveStatus?.status === "IN_PROGRESS") && (
        <View
          style={[
            styles.mapSection,
            { height: step === "in_progress" ? height * 0.45 : 300 },
          ]}
        >
          <MapboxGL.MapView style={styles.map}>
            <MapboxGL.Camera
              ref={cameraRef}
              zoomLevel={14}
              centerCoordinate={[
                liveStatus?.pickup?.lng || 77.209,
                liveStatus?.pickup?.lat || 28.6139,
              ]}
            />

            {liveStatus?.pickup && (
              <MapboxGL.PointAnnotation
                id="customer-pickup"
                coordinate={[liveStatus.pickup.lng, liveStatus.pickup.lat]}
              >
                <View style={styles.customerMarker}>
                  <Ionicons name="home" size={20} color={COLORS.white} />
                </View>
              </MapboxGL.PointAnnotation>
            )}

            {technicianLocation && (
              <MapboxGL.PointAnnotation
                id="tech-location"
                coordinate={[
                  technicianLocation.longitude,
                  technicianLocation.latitude,
                ]}
              >
                <View
                  style={[
                    styles.techMarker,
                    { transform: [{ rotate: `${technicianHeading}deg` }] },
                  ]}
                >
                  <Ionicons name="navigate" size={26} color={COLORS.black} />
                </View>
              </MapboxGL.PointAnnotation>
            )}

            {routeGeoJSON?.coordinates && (
              <MapboxGL.ShapeSource id="route-source" shape={routeGeoJSON}>
                <MapboxGL.LineLayer
                  id="route-layer"
                  style={{
                    lineColor: COLORS.blue,
                    lineCap: "round",
                    lineJoin: "round",
                    lineWidth: 6,
                    lineOpacity: 0.8,
                  }}
                />
              </MapboxGL.ShapeSource>
            )}
          </MapboxGL.MapView>

          {technicianLocation && (
            <View style={styles.etaContainer}>
              <Text style={styles.etaText}>
                Arriving in{" "}
                <Text style={styles.etaHighlight}>{etaData.duration}</Text> •{" "}
                {etaData.distance}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.bottomCard}>
        {liveStatus?.paymentTiming === "PREPAID" ||
        liveStatus?.paymentStatus === "PAID" ||
        liveStatus?.status === "ACCEPTED" ||
        liveStatus?.status === "ARRIVED" ? (
          <View style={styles.otpSection}>
            <Text style={styles.cardLabel}>
              {liveStatus?.status === "ACCEPTED" ||
              liveStatus?.status === "ARRIVED"
                ? "Arrival Code"
                : "Completion Code"}
            </Text>
            <View style={styles.otpRow}>
              {getDisplayOtp()
                ?.toString()
                .split("")
                .map((char, i) => (
                  <View key={i} style={styles.otpBox}>
                    <Text style={styles.otpText}>{char}</Text>
                  </View>
                ))}
            </View>
            <Text style={styles.cardSubLabel}>
              {liveStatus?.status === "ACCEPTED" ||
              liveStatus?.status === "ARRIVED"
                ? "Share this with your technician on arrival"
                : "Share this with your technician to end service"}
            </Text>
          </View>
        ) : (
          <View style={styles.otpSection}>
            <View style={styles.lockIconBox}>
              <Ionicons
                name="lock-closed"
                size={32}
                color={COLORS.textTertiary}
              />
            </View>
            <Text style={[styles.cardLabel, { marginTop: 12 }]}>
              Verification Code Locked
            </Text>
            <Text
              style={[
                styles.cardSubLabel,
                { textAlign: "center", paddingHorizontal: 20 },
              ]}
            >
              The completion code will be revealed after service is finished and
              payment is verified.
            </Text>
          </View>
        )}

        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulse} />
              <View style={styles.dot} />
            </View>
            <Text style={styles.statusTitle}>
              {liveStatus?.status === "ACCEPTED"
                ? "Expert is on the way"
                : liveStatus?.status === "ARRIVED"
                  ? "Expert has arrived"
                  : "Service in progress"}
            </Text>
          </View>
          <Text style={styles.statusDesc}>
            {liveStatus?.status === "ACCEPTED"
              ? "Your cooling expert has been assigned and is heading to your location."
              : liveStatus?.status === "ARRIVED"
                ? "Your technician is at your doorstep. Please provide the arrival code."
                : "The service is currently being performed. You can relax now."}
          </Text>

          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call" size={20} color={COLORS.black} />
            <Text style={styles.contactButtonText}>Call Technician</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderServiceEnded = () => (
    <View style={styles.content}>
      <View style={styles.successHeader}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-done" size={60} color={COLORS.white} />
        </View>
        <Text style={styles.finalTitle}>Service Completed</Text>
        <Text style={styles.finalSubtitle}>
          Your AC unit has been serviced. Final payment is pending.
        </Text>
      </View>

      <View style={styles.paymentCard}>
        <Text style={styles.cardLabel}>Final Amount Due</Text>
        <Text style={styles.finalAmount}>₹{serviceAmount.toFixed(2)}</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
          <Text style={styles.badgeText}>Verified Secure</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate("CustomerRazorpayCheckout", {
            rideId: rideId,
            amount: serviceAmount,
            paymentTiming: "POSTPAID",
          });
        }}
      >
        <Text style={styles.actionButtonText}>Proceed to Final Payment</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const renderCompleted = () => (
    <View style={styles.content}>
      <View style={styles.successHeader}>
        <View style={styles.completedIconBox}>
          <Ionicons name="sparkles" size={60} color={COLORS.black} />
        </View>
        <Text style={styles.finalTitle}>Mission Accomplished!</Text>
        <Text style={styles.finalSubtitle}>
          Your AC unit is refreshed and ready to go.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={() => setStep("rating")}
      >
        <Text style={styles.actionButtonText}>Rate Your Experience</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerification = () => (
    <View style={styles.content}>
      <View style={styles.successHeader}>
        <View style={[styles.successIconBox, { backgroundColor: COLORS.blue }]}>
          <Ionicons name="key" size={60} color={COLORS.white} />
        </View>
        <Text style={styles.finalTitle}>Payment Verified!</Text>
        <Text style={styles.finalSubtitle}>
          Share the completion code with your technician to finalize the
          service.
        </Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.otpSection}>
          <Text style={styles.cardLabel}>Completion Code</Text>
          <View style={styles.otpRow}>
            {currentOtp
              ?.toString()
              .split("")
              .map((char, i) => (
                <View key={i} style={styles.otpBox}>
                  <Text style={styles.otpText}>{char}</Text>
                </View>
              ))}
          </View>
          <Text style={styles.cardSubLabel}>
            Waiting for technician to verify...
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.blue} />
          <Text style={styles.infoBoxText}>
            This 5-digit code ensures the job is completed to your satisfaction.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRating = () => (
    <View style={styles.content}>
      <View style={styles.ratingHeader}>
        <Text style={styles.finalTitle}>Rate Your Service</Text>
        <Text style={styles.finalSubtitle}>How was your expert today?</Text>
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} style={styles.star}>
            <Ionicons
              name="star"
              size={48}
              color={i <= 4 ? "#000" : "#E0E0E0"}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.commentBox}>
        <Text style={styles.commentLabel}>Any feedback? (Optional)</Text>
        <View style={styles.textInputMock} />
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={() => navigation.replace("Home")}
      >
        <Text style={styles.actionButtonText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Activity</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={COLORS.black}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.main}>
        {step === "in_progress" && renderInProgress()}
        {step === "service_ended" && renderServiceEnded()}
        {step === "verification" && renderVerification()}
        {step === "completed" && renderCompleted()}
        {step === "rating" && renderRating()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  mapSection: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  techMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.black,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  customerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  etaContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  etaText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  totalPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalPaymentLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  finalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.blue,
  },
  etaHighlight: {
    fontWeight: "700",
    color: COLORS.black,
  },
  bottomCard: {
    flex: 1,
    padding: 24,
    backgroundColor: COLORS.white,
  },
  otpSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.black,
  },
  cardSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusSection: {
    marginTop: 8,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pulseContainer: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  pulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  statusDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 10,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.black,
  },
  successHeader: {
    alignItems: "center",
    marginTop: 64,
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  completedIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  finalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 12,
  },
  finalSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  paymentCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  finalAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: COLORS.black,
    marginVertical: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accent,
  },
  actionButton: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: COLORS.black,
    height: 56,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  ratingHeader: {
    marginTop: 64,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  otpBox: {
    marginBottom: 48,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 48,
    marginBottom: 48,
  },
  star: {
    padding: 4,
  },
  commentBox: {
    paddingHorizontal: 24,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  textInputMock: {
    height: 100,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
