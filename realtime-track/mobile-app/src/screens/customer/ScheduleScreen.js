import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from 'react-native-vector-icons/Ionicons';
// Mapbox Geocoding used for address selection

import config from "../../constants/config";

const { width } = Dimensions.get("window");

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

const getNext7Days = () => {
  const days = [];
  const date = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() + i);
    days.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.getDate().toString(),
      fullDate: d.toDateString(),
      isToday: i === 0,
    });
  }
  return days;
};

const DATES = getNext7Days();
const TIMES = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];

export default function ScheduleScreen({ route, navigation }) {
  const { service } = route.params;
  const [selectedDate, setSelectedDate] = useState(DATES[0].date);
  const [selectedTime, setSelectedTime] = useState("02:00 PM");
  const [address, setAddress] = useState(null);

  const googleRef = useRef(null);

  const handlePlaceSelect = (data, details = null) => {
    if (!data) return;
    const newAddress = {
      description:
        data.description || data.formatted_address || "Unnamed Location",
      location: details?.geometry?.location || { lat: 0, lng: 0 },
    };
    setAddress(newAddress);
    Keyboard.dismiss();
  };

  const isButtonEnabled =
    address && address.description && selectedDate && selectedTime;

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
          <Text style={styles.headerTitle}>Schedule Service</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Summary */}
        <View style={styles.serviceSummary}>
          <View style={styles.serviceIcon}>
            <Ionicons name="construct-outline" size={24} color={COLORS.black} />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceLabel}>Selected Service</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
          </View>
          <Text style={styles.servicePrice}>₹{service.price}</Text>
        </View>

        {/* Location Section */}
        <Text style={styles.sectionTitle}>Service Location</Text>

        {address ? (
          <View style={styles.selectedAddress}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={20} color={COLORS.black} />
            </View>
            <View style={styles.addressDetails}>
              <Text style={styles.addressLabel}>Selected address</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {address.description}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setAddress(null)}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Select on Map Button */}
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                navigation.navigate("MapPicker", {
                  onSelect: (selectedAddress) => {
                    setAddress(selectedAddress);
                  },
                });
              }}
            >
              <View style={styles.mapIcon}>
                <Ionicons name="map" size={20} color={COLORS.black} />
              </View>
              <Text style={styles.mapButtonText}>Select on Map</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>

            {/* Search feature commented out as per user request */}
            {/* 
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.searchContainer}>
                            <GooglePlacesAutocomplete
                                ref={googleRef}
                                placeholder="Enter your service address"
                                minLength={2}
                                onPress={handlePlaceSelect}
                                onFail={(error) => console.error("Google Places Error: ", error)}
                                query={{
                                    key: config.GOOGLE_MAPS_API_KEY,
                                    language: 'en',
                                    components: 'country:in',
                                }}
                                styles={{
                                    textInputContainer: styles.googleInputContainer,
                                    textInput: styles.googleInput,
                                    listView: styles.googleListView,
                                    row: styles.googleRow,
                                    separator: styles.googleSeparator,
                                    description: { color: COLORS.textPrimary, fontWeight: '500' },
                                    poweredContainer: { display: 'none' }
                                }}
                                fetchDetails={true}
                                enablePoweredByContainer={false}
                                nearbyPlacesAPI="GooglePlacesSearch"
                                debounce={400}
                                listEmptyComponent={() => (
                                    <View style={{ padding: 15, alignItems: 'center' }}>
                                        <Text style={{ color: COLORS.textTertiary, fontSize: 13 }}>
                                            No matching locations found
                                        </Text>
                                    </View>
                                )}
                                renderDescription={row => row.description || row.vicinity}
                                renderLeftButton={() => (
                                    <View style={styles.searchIconContainer}>
                                        <Ionicons name="search" size={20} color={COLORS.textTertiary} />
                                    </View>
                                )}
                            />
                        </View>
                        */}
          </>
        )}

        {/* Date Selection */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {DATES.map((item, index) => {
            const isSelected = selectedDate === item.date;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDate(item.date)}
              >
                <Text
                  style={[styles.dayText, isSelected && styles.dayTextActive]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[styles.dateText, isSelected && styles.dateTextActive]}
                >
                  {item.date}
                </Text>
                {item.isToday && (
                  <View
                    style={[
                      styles.todayDot,
                      isSelected && styles.todayDotActive,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Selection */}
        <Text style={styles.sectionTitle}>Select Time Slot</Text>
        <View style={styles.timeGrid}>
          {TIMES.map((time, index) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={[styles.timeSlot, isSelected && styles.timeSlotActive]}
                onPress={() => setSelectedTime(time)}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={isSelected ? COLORS.white : COLORS.textSecondary}
                />
                <Text
                  style={[styles.timeText, isSelected && styles.timeTextActive]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isButtonEnabled && styles.continueButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={!isButtonEnabled}
          onPress={() => {
            navigation.navigate("BookingSummary", {
              service,
              date: selectedDate,
              time: selectedTime,
              address,
            });
          }}
        >
          <Text
            style={[
              styles.continueButtonText,
              !isButtonEnabled && styles.continueButtonTextDisabled,
            ]}
          >
            {isButtonEnabled ? "Continue to Summary" : "Fill all details"}
          </Text>
          {isButtonEnabled && (
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  serviceSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.black,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 16,
    marginTop: 8,
  },
  selectedAddress: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    lineHeight: 18,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.black,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mapButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.black,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: "500",
  },
  searchContainer: {
    zIndex: 1000,
    marginBottom: 24,
  },
  googleInputContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  googleInput: {
    height: 48,
    fontSize: 15,
    color: COLORS.black,
    fontWeight: "500",
  },
  searchIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  googleListView: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleRow: {
    padding: 14,
  },
  googleSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateScroll: {
    paddingBottom: 4,
    gap: 12,
    marginBottom: 24,
  },
  dateCard: {
    width: 70,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateCardActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dayTextActive: {
    color: "rgba(255,255,255,0.7)",
  },
  dateText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  dateTextActive: {
    color: COLORS.white,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.black,
    marginTop: 6,
  },
  todayDotActive: {
    backgroundColor: COLORS.white,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    minWidth: (width - 52) / 3,
  },
  timeSlotActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  timeTextActive: {
    color: COLORS.white,
  },
  footer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  continueButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.background,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  continueButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});
