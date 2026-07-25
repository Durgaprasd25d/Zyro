import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from "../../constants/designSystem";

const { width } = Dimensions.get("window");

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

// Timing slot rows mapping: 3 rows (periods) vertically, displaying multiple time slots in each row
const TIME_SLOT_ROWS = [
  {
    period: "Morning Slot",
    icon: "sunny-outline",
    slots: ["08:00 AM", "09:30 AM", "11:00 AM"],
  },
  {
    period: "Afternoon Slot",
    icon: "sunny",
    slots: ["01:30 PM", "03:00 PM", "04:30 PM"],
  },
  {
    period: "Evening Slot",
    icon: "moon-outline",
    slots: ["06:00 PM", "07:30 PM"],
  },
];

// Helper to generate dynamic days for the current month
const getDaysInMonthGrid = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // First day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startDayOfWeek = firstDayOfMonth.getDay();
  // Adjust so Monday is 0, Sunday is 6
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Total days in current month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysGrid = [];

  // Padding cells from the previous month
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthTotalDays - i);
    daysGrid.push({
      dateObj: d,
      dayNum: d.getDate(),
      isCurrentMonth: false,
      isPast: true,
      isToday: false,
      fullDate: d.toDateString(),
    });
  }

  // Days of the current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(currentYear, currentMonth, i);
    const isPast = d.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0);
    daysGrid.push({
      dateObj: d,
      dayNum: i,
      isCurrentMonth: true,
      isPast,
      isToday: d.toDateString() === today.toDateString(),
      fullDate: d.toDateString(),
    });
  }

  // Padding cells for the next month to complete the row
  const remaining = daysGrid.length % 7;
  if (remaining > 0) {
    const paddingNeeded = 7 - remaining;
    for (let i = 1; i <= paddingNeeded; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      daysGrid.push({
        dateObj: d,
        dayNum: i,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        fullDate: d.toDateString(),
      });
    }
  }

  return daysGrid;
};

export default function ScheduleScreen({ route, navigation }) {
  const { service } = route.params;
  const todayString = new Date().toDateString();
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [selectedTime, setSelectedTime] = useState("01:30 PM");
  const [address, setAddress] = useState(null);

  const calendarDays = getDaysInMonthGrid();

  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const formatSelectedDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isButtonEnabled = address && address.description && selectedDate && selectedTime;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Service</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Summary Card */}
        <View style={styles.serviceSummary}>
          <Image
            source={getServiceImage(service?.name)}
            style={styles.serviceImage}
            resizeMode="cover"
          />
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceLabel}>SERVICE</Text>
            <Text style={styles.serviceName} numberOfLines={2}>
              {service?.name}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>EST. PRICE</Text>
              <Text style={styles.servicePrice}>₹{service?.price}</Text>
            </View>
          </View>
        </View>

        {/* Date Selection Section (Premium Calendar) */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <View style={styles.calendarCard}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarHeaderTitle}>Service Calendar</Text>
            <View style={styles.calendarMonthRow}>
              <Text style={styles.calendarMonthText}>{currentMonthName}</Text>
              <Ionicons name="calendar-outline" size={16} color={C.primary} style={styles.calendarIcon} />
            </View>
          </View>

          {/* Weekday columns: M T W T F S S */}
          <View style={styles.weekdayRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Grid of days */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              const isSelected = selectedDate === item.fullDate;
              const isSelectable = item.isCurrentMonth && !item.isPast;

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  disabled={!isSelectable}
                  onPress={() => setSelectedDate(item.fullDate)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellActive,
                    !item.isCurrentMonth && styles.dayCellOutside,
                    item.isPast && styles.dayCellPast,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberTextActive,
                      !item.isCurrentMonth && styles.dayNumberTextOutside,
                      item.isPast && styles.dayNumberTextPast,
                      item.isToday && !isSelected && styles.dayNumberTextToday,
                    ]}
                  >
                    {item.dayNum}
                  </Text>
                  {item.isToday && !isSelected && (
                    <View style={styles.todayIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Large centered Selected Date Header */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateLabel}>Selected Date</Text>
          <Text style={styles.selectedDateHeader}>
            {formatSelectedDate(selectedDate)}
          </Text>
        </View>

        {/* Time Selection Section (3 Rows vertically, displaying multiple time slots in each row) */}
        <Text style={styles.sectionTitle}>Choose Time Slot</Text>
        <View style={styles.timeSectionContainer}>
          {TIME_SLOT_ROWS.map((periodObj, pIdx) => (
            <View key={pIdx} style={styles.periodRowContainer}>
              {/* Row Header (Period label & icon) */}
              <View style={styles.periodHeader}>
                <View style={styles.periodIconBg}>
                  <Ionicons name={periodObj.icon} size={16} color={C.primary} />
                </View>
                <Text style={styles.periodLabel}>{periodObj.period}</Text>
              </View>

              {/* Multiple Time Slots Display */}
              <View style={styles.timeSlotsWrapper}>
                {periodObj.slots.map((time, tIdx) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={tIdx}
                      activeOpacity={0.75}
                      style={[
                        styles.timeSlotCell,
                        isSelected && styles.timeSlotCellActive,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotCellText,
                          isSelected && styles.timeSlotCellTextActive,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Service Location Section */}
        <Text style={styles.sectionTitle}>Service Location</Text>
        <View style={styles.locationContainer}>
          {address ? (
            <View style={styles.addressCard}>
              <View style={styles.addressDetailsContainer}>
                <View style={styles.addressIconContainer}>
                  <Ionicons name="location" size={20} color={C.primary} />
                </View>
                <View style={styles.addressTextColumn}>
                  <Text style={styles.addressLabelText}>CONFIRMED ADDRESS</Text>
                  <Text style={styles.addressValueText} numberOfLines={2}>
                    {address?.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changeAddressBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate("MapPicker", {
                      onSelect: (selectedAddress) => {
                        setAddress(selectedAddress);
                      },
                    });
                  }}
                >
                  <Text style={styles.changeAddressBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enterLocationBtn}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate("MapPicker", {
                  onSelect: (selectedAddress) => {
                    setAddress(selectedAddress);
                  },
                });
              }}
            >
              <View style={styles.enterLocationBtnIconBg}>
                <Ionicons name="location-outline" size={20} color={C.primary} />
              </View>
              <Text style={styles.enterLocationBtnText}>Enter the location</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={C.onSurfaceVariant}
                style={styles.enterLocationChevron}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom CTA Footer */}
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
              date: formatSelectedDate(selectedDate),
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
            {isButtonEnabled ? "Continue to Summary" : "Set Location to Continue"}
          </Text>
          {isButtonEnabled && (
            <Ionicons name="arrow-forward" size={18} color="#131313" />
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  serviceSummary: {
    flexDirection: "row",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222222",
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "#1C1C1C",
  },
  serviceDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  serviceLabel: {
    fontSize: 10,
    fontFamily: TY.labelCaps.fontFamily,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 1.5,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: C.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: TY.labelCaps.fontFamily,
    fontWeight: "700",
    color: C.onSurface,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
    textTransform: "uppercase",
  },
  calendarCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    paddingBottom: 12,
  },
  calendarHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurface,
  },
  calendarMonthRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202020",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  calendarMonthText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.primary,
    marginRight: 6,
  },
  calendarIcon: {
    marginTop: -1,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  weekdayText: {
    width: (width - 64) / 7,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: (width - 64) / 7,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderRadius: 20,
  },
  dayCellActive: {
    backgroundColor: C.primary,
  },
  dayCellOutside: {
    opacity: 0.15,
  },
  dayCellPast: {
    opacity: 0.25,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurface,
  },
  dayNumberTextActive: {
    color: "#131313",
    fontWeight: "700",
  },
  dayNumberTextOutside: {
    color: C.onSurfaceVariant,
  },
  dayNumberTextPast: {
    color: C.onSurfaceVariant,
    textDecorationLine: "line-through",
  },
  dayNumberTextToday: {
    color: C.primary,
    fontWeight: "700",
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
    position: "absolute",
    bottom: 4,
  },
  selectedDateContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#141414",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222222",
  },
  selectedDateLabel: {
    fontSize: 10,
    fontFamily: TY.labelCaps.fontFamily,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  selectedDateHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: C.primary,
    textAlign: "center",
  },
  timeSectionContainer: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#222222",
    gap: 16,
  },
  periodRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingBottom: 16,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  periodIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurface,
  },
  timeSlotsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlotCell: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1C1C1C",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    minWidth: (width - 72) / 3,
    alignItems: "center",
    justifyContent: "center",
  },
  timeSlotCellActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  timeSlotCellText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.onSurface,
  },
  timeSlotCellTextActive: {
    color: "#131313",
    fontWeight: "700",
  },
  locationContainer: {
    marginBottom: 24,
  },
  addressCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222222",
  },
  addressDetailsContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
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
  addressTextColumn: {
    flex: 1,
  },
  addressLabelText: {
    fontSize: 9,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 2,
  },
  addressValueText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurface,
    lineHeight: 18,
  },
  changeAddressBtn: {
    backgroundColor: "#202020",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginLeft: 8,
  },
  changeAddressBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.primary,
  },
  enterLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222222",
  },
  enterLocationBtnIconBg: {
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
  enterLocationBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurface,
  },
  enterLocationChevron: {
    marginLeft: 8,
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
  continueButton: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#131313",
  },
  continueButtonTextDisabled: {
    color: C.onSurfaceVariant,
    opacity: 0.6,
  },
});
