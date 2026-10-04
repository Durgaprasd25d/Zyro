import subprocess
import time
import os

RAW_DIR = "/Users/mindbrain/Desktop/ss-zyro/raw_screens"
os.makedirs(RAW_DIR, exist_ok=True)

def adb(cmd):
    p = subprocess.run(f"adb {cmd}", shell=True, capture_output=True, text=True)
    return p.stdout.strip()

def cap(filename):
    time.sleep(1.2)
    adb(f"shell screencap -p /sdcard/{filename}")
    adb(f"pull /sdcard/{filename} {RAW_DIR}/{filename}")
    print(f" [+] Successfully captured: {filename}")

print("=== STARTING COMPLETE 9-SCREEN CAPTURE PIPELINE ===")

# Reset back to Home
for _ in range(4):
    adb("shell input keyevent 4")
    time.sleep(0.3)

# -------------------------------------------------------------
# STEP 1: LOGIN / ONBOARDING SCREEN
# -------------------------------------------------------------
print("\n--- Capturing Step 1: Login / Auth Screen ---")
# Go to Profile tab
adb("shell input tap 930 2248")
time.sleep(1.5)
# Scroll down to Log Out
adb("shell input swipe 500 1800 500 400 300")
time.sleep(1.2)
# Tap Log Out button (around y=1900)
adb("shell input tap 500 1900")
time.sleep(2.5)
cap("screen_01_login.png")

# Now Log back in
print("\n--- Logging back in ---")
# Check if login button or fields are visible
# Tap Phone field (or Google login / Durga login)
adb("shell input tap 500 1080")
time.sleep(0.8)
adb("shell input text 9876543210")
time.sleep(0.8)
adb("shell input tap 500 1280")
time.sleep(0.8)
adb("shell input text password123")
time.sleep(0.8)
# Hide keyboard
adb("shell input keyevent 111")
time.sleep(0.5)
# Tap Sign In button (y=1500 or y=1600)
adb("shell input tap 500 1550")
time.sleep(3)

# If still on login or modal, try tapping continue or google
# -------------------------------------------------------------
# STEP 2: HOME DASHBOARD
# -------------------------------------------------------------
print("\n--- Capturing Step 2: Home Dashboard ---")
# Ensure Home tab
adb("shell input tap 150 2248")
time.sleep(1.5)
cap("screen_02_home.png")

# -------------------------------------------------------------
# STEP 3: SERVICES CATALOG
# -------------------------------------------------------------
print("\n--- Capturing Step 3: All Services Catalog ---")
# Tap Services tab
adb("shell input tap 410 2248")
time.sleep(1.5)
cap("screen_03_services.png")

# -------------------------------------------------------------
# STEP 4: SERVICE DETAILS
# -------------------------------------------------------------
print("\n--- Capturing Step 4: Service Details Screen ---")
# Tap on first service: AC Deep Power Jet Cleaning
adb("shell input tap 500 600")
time.sleep(2)
cap("screen_04_detail.png")

# -------------------------------------------------------------
# STEP 5: SCHEDULE CALENDAR & TIME SLOTS
# -------------------------------------------------------------
print("\n--- Capturing Step 5: Schedule & Slot Selection ---")
# Tap BOOK SERVICE button at bottom right
adb("shell input tap 750 2230")
time.sleep(2)
# Select a date and slot
adb("shell input tap 400 1200") # day cell
time.sleep(0.5)
adb("shell input tap 200 2360") # time slot
time.sleep(0.8)
cap("screen_05_schedule.png")

# -------------------------------------------------------------
# STEP 6: BOOKING REVIEW & SUMMARY
# -------------------------------------------------------------
print("\n--- Capturing Step 6: Booking Summary & Checkout ---")
# Tap PROCEED TO SUMMARY button
adb("shell input tap 500 2230")
time.sleep(2)
cap("screen_06_summary.png")

# -------------------------------------------------------------
# STEP 7: LIVE GPS TRACKING & OTP
# -------------------------------------------------------------
print("\n--- Capturing Step 7: Live GPS Tracking ---")
# Go back to Home
adb("shell input keyevent 4")
time.sleep(0.8)
adb("shell input keyevent 4")
time.sleep(0.8)
adb("shell input tap 150 2248")
time.sleep(1.5)
# Tap Active Booking banner on Home screen
adb("shell input tap 500 1500")
time.sleep(2)
cap("screen_07_tracking.png")

# -------------------------------------------------------------
# STEP 8: ORDER HISTORY & INVOICES
# -------------------------------------------------------------
print("\n--- Capturing Step 8: Order History ---")
# Go back if in tracking
adb("shell input keyevent 4")
time.sleep(0.8)
# Tap History tab
adb("shell input tap 670 2248")
time.sleep(2)
cap("screen_08_history.png")

# -------------------------------------------------------------
# STEP 9: HELP & 24/7 SUPPORT
# -------------------------------------------------------------
print("\n--- Capturing Step 9: Help & Live Support ---")
# Tap Profile tab
adb("shell input tap 930 2248")
time.sleep(1.5)
# Scroll to Help Center
adb("shell input swipe 500 1800 500 1000 300")
time.sleep(1.2)
# Tap Help Center (around y=1300)
adb("shell input tap 500 1320")
time.sleep(2)
cap("screen_09_support.png")

print("\n=== COMPLETE PIPELINE FINISHED ===")
