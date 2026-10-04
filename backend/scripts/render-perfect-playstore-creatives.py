import os
import math
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

DESKTOP_DIR = "/Users/mindbrain/Desktop/ss-zyro"
RAW_SRC_DIR = "/Users/mindbrain/Desktop/ss-zyro/raw_screens"
RAW_DEST_DIR = os.path.join(DESKTOP_DIR, "raw_screenshots")

os.makedirs(DESKTOP_DIR, exist_ok=True)
os.makedirs(RAW_DEST_DIR, exist_ok=True)

# Standard High-Res Google Play Store Promotional Dimensions (9:16 vertical)
CANVAS_W = 1242
CANVAS_H = 2208

# Creative Definitions for all 9 Slides in the Customer Journey
SLIDES_CONFIG = [
    {
        "raw_file": "screen_01_login.png",
        "raw_out": "01_raw_login_screen.png",
        "creative_out": "01_playstore_login_onboarding.jpg",
        "badge": "QUICK ONBOARDING",
        "title": "Instant 1-Tap Google Access",
        "subtitle": "Book certified AC technicians to your doorstep in 30 seconds",
        "pill": "★ 4.9 Rated • 100% Background Verified",
        "glow_color": (230, 190, 171) # Copper Gold
    },
    {
        "raw_file": "screen_02_home.png",
        "raw_out": "02_raw_home_dashboard.png",
        "creative_out": "02_playstore_home_dashboard.jpg",
        "badge": "SMART CLIMATE HUB",
        "title": "All AC Services At Your Fingertips",
        "subtitle": "Deep jet cleaning, gas recharge, repairs & master diagnostics",
        "pill": "⚡ 30-Minute Express Arrival Guarantee",
        "glow_color": (120, 170, 255) # Ice Blue
    },
    {
        "raw_file": "screen_03_services.png",
        "raw_out": "03_raw_service_catalog.png",
        "creative_out": "03_playstore_service_catalog.jpg",
        "badge": "SERVICE CATALOG",
        "title": "Comprehensive AC Solutions",
        "subtitle": "Standardized rate cards with transparent upfront pricing",
        "pill": "🛡️ 30-Day Hassle-Free Revisit Warranty",
        "glow_color": (230, 190, 171) # Copper Gold
    },
    {
        "raw_file": "screen_04_detail.png",
        "raw_out": "04_raw_service_details.png",
        "creative_out": "04_playstore_service_details.jpg",
        "badge": "DEEP INSPECTION",
        "title": "Transparent Service Inclusions",
        "subtitle": "High-pressure foam jet wash, coil sanitation & diagnostic checks",
        "pill": "✅ Genuine OEM Spare Parts Only",
        "glow_color": (120, 170, 255) # Ice Blue
    },
    {
        "raw_file": "screen_05_schedule.png",
        "raw_out": "05_raw_schedule_booking.png",
        "creative_out": "05_playstore_schedule_booking.jpg",
        "badge": "EASY SCHEDULING",
        "title": "Flexible Slots That Suit You",
        "subtitle": "Choose morning, afternoon, or evening same-day appointment slots",
        "pill": "📅 Instant Live Technician Assignment",
        "glow_color": (230, 190, 171) # Copper Gold
    },
    {
        "raw_file": "screen_06_summary.png",
        "raw_out": "06_raw_checkout_summary.png",
        "creative_out": "06_playstore_checkout_summary.jpg",
        "badge": "SECURE CHECKOUT",
        "title": "100% Transparent Price Summary",
        "subtitle": "Itemized tax invoice, zero hidden charges & secure UPI payments",
        "pill": "🔒 256-Bit SSL Encrypted Transactions",
        "glow_color": (120, 170, 255) # Ice Blue
    },
    {
        "raw_file": "screen_07_tracking.png",
        "raw_out": "07_raw_live_gps_tracking.png",
        "creative_out": "07_playstore_live_gps_tracking.jpg",
        "badge": "REAL-TIME GPS",
        "title": "Live Technician Radar & 4-Digit OTP",
        "subtitle": "Track your technician on live map with ETA and safety verification",
        "pill": "📍 Pinpoint Accurate Navigation",
        "glow_color": (230, 190, 171) # Copper Gold
    },
    {
        "raw_file": "screen_08_history.png",
        "raw_out": "08_raw_service_history.png",
        "creative_out": "08_playstore_service_history.jpg",
        "badge": "ORDER LEDGER",
        "title": "Digital Invoices & Service History",
        "subtitle": "Access previous job reports, download tax invoices & rebook in 1 tap",
        "pill": "🧾 Automated GST Tax Invoices",
        "glow_color": (120, 170, 255) # Ice Blue
    },
    {
        "raw_file": "screen_09_support.png",
        "raw_out": "09_raw_support_and_help.png",
        "creative_out": "09_playstore_support_and_help.jpg",
        "badge": "24/7 ASSISTANCE",
        "title": "Dedicated Live Customer Support",
        "subtitle": "Connect directly with support via WhatsApp, live chat, or phone helpline",
        "pill": "💬 Average Response Time < 2 Mins",
        "glow_color": (230, 190, 171) # Copper Gold
    }
]

def get_font(size, bold=False):
    font_paths = [
        "/System/Library/Fonts/SFProText-Bold.otf" if bold else "/System/Library/Fonts/SFProText-Regular.otf",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Geneva.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

font_badge = get_font(32, bold=True)
font_title = get_font(60, bold=True)
font_subtitle = get_font(34, bold=False)
font_pill = get_font(30, bold=True)
font_brand = get_font(28, bold=True)

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def render_slide(config):
    raw_path = os.path.join(RAW_SRC_DIR, config["raw_file"])
    if not os.path.exists(raw_path):
        print(f"Warning: {raw_path} not found!")
        return

    # Copy raw screenshot to clean name
    shutil.copy(raw_path, os.path.join(RAW_DEST_DIR, config["raw_out"]))
    
    # 1. Base Canvas (Ultra Deep Onyx #0A0D14)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (10, 13, 20, 255))
    
    # 2. Luxury Ambient Glow
    glow_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_layer)
    gr, gg, gb = config["glow_color"]
    
    # Ambient radial light top-center
    for rad in range(600, 50, -50):
        alpha = int(12 * (1 - rad / 600.0))
        gdraw.ellipse([CANVAS_W//2 - rad, 250 - rad//2, CANVAS_W//2 + rad, 250 + rad//2], fill=(gr, gg, gb, alpha))
        
    # Ambient radial light behind phone
    for rad in range(800, 100, -60):
        alpha = int(14 * (1 - rad / 800.0))
        gdraw.ellipse([CANVAS_W//2 - rad, 1500 - rad, CANVAS_W//2 + rad, 1500 + rad], fill=(gr, gg, gb, alpha))

    canvas = Image.alpha_composite(canvas, glow_layer)
    draw = ImageDraw.Draw(canvas)
    
    # 3. Top Branding Header (ZYRO Logo + Category)
    draw.text((80, 75), "ZYRO", font=font_brand, fill=(230, 190, 171, 255))
    draw.text((185, 75), "•  CLIMATE & HOME CARE", font=font_brand, fill=(140, 155, 175, 200))
    
    # Divider line
    draw.line([(80, 125), (CANVAS_W - 80, 125)], fill=(35, 45, 60, 180), width=2)
    
    # 4. Marketing Badge Pill
    badge_text = config["badge"]
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox[2] - bbox[0] + 48
    bh = 54
    badge_x = 80
    badge_y = 160
    draw_rounded_rect(draw, [badge_x, badge_y, badge_x + bw, badge_y + bh], radius=27, fill=(28, 36, 50, 240), outline=(230, 190, 171, 160), width=2)
    draw.text((badge_x + 24, badge_y + 10), badge_text, font=font_badge, fill=(230, 190, 171, 255))
    
    # 5. Marketing Title (White, High Contrast)
    title_text = config["title"]
    draw.text((80, 240), title_text, font=font_title, fill=(255, 255, 255, 255))
    
    # 6. Marketing Subtitle (Subtle Slate)
    sub_text = config["subtitle"]
    draw.text((80, 325), sub_text, font=font_subtitle, fill=(185, 198, 215, 240))
    
    # 7. Trust Value Feature Pill
    pill_text = config["pill"]
    bbox_p = draw.textbbox((0, 0), pill_text, font=font_pill)
    pw = bbox_p[2] - bbox_p[0] + 44
    ph = 52
    pill_x = 80
    pill_y = 405
    draw_rounded_rect(draw, [pill_x, pill_y, pill_x + pw, pill_y + ph], radius=26, fill=(20, 28, 42, 230), outline=(45, 60, 85, 255), width=2)
    draw.text((pill_x + 22, pill_y + 10), pill_text, font=font_pill, fill=(120, 220, 180, 255))

    # 8. Render Phone Mockup Framing
    raw_img = Image.open(raw_path).convert("RGBA")
    
    # Target phone screen dimensions on 1242x2208 canvas
    screen_target_w = 980
    # Phone screenshot aspect ratio is 1080x2376 (~1:2.2)
    screen_target_h = int(screen_target_w * (raw_img.height / raw_img.width))
    raw_resized = raw_img.resize((screen_target_w, screen_target_h), Image.Resampling.LANCZOS)
    
    # Phone Chassis Bezels
    border_radius = 64
    chassis_padding = 18
    chassis_w = screen_target_w + (chassis_padding * 2)
    chassis_h = screen_target_h + (chassis_padding * 2)
    
    phone_pos_x = (CANVAS_W - chassis_w) // 2
    phone_pos_y = 500  # Starts nicely below typography, extends slightly off bottom
    
    # Realistic Deep Drop Shadow for phone
    shadow_img = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_img)
    draw_rounded_rect(sdraw, [phone_pos_x - 10, phone_pos_y + 15, phone_pos_x + chassis_w + 10, phone_pos_y + chassis_h + 30], radius=border_radius + 10, fill=(0, 0, 0, 180))
    shadow_blurred = shadow_img.filter(ImageFilter.GaussianBlur(35))
    canvas = Image.alpha_composite(canvas, shadow_blurred)
    draw = ImageDraw.Draw(canvas)
    
    # Chassis Outer Body (Titanium Gunmetal with subtle highlight)
    draw_rounded_rect(draw, [phone_pos_x, phone_pos_y, phone_pos_x + chassis_w, phone_pos_y + chassis_h], radius=border_radius, fill=(24, 28, 36, 255), outline=(60, 70, 88, 255), width=3)
    
    # Rounded Mask for Screen
    screen_mask = Image.new("L", (screen_target_w, screen_target_h), 0)
    smask_draw = ImageDraw.Draw(screen_mask)
    smask_draw.rounded_rectangle([0, 0, screen_target_w, screen_target_h], radius=border_radius - 12, fill=255)
    
    # Composite Screen inside chassis
    screen_x = phone_pos_x + chassis_padding
    screen_y = phone_pos_y + chassis_padding
    canvas.paste(raw_resized, (screen_x, screen_y), screen_mask)
    
    # Top Speaker Notch
    notch_w = 160
    notch_h = 10
    notch_x = CANVAS_W // 2 - notch_w // 2
    notch_y = phone_pos_y + 8
    draw_rounded_rect(draw, [notch_x, notch_y, notch_x + notch_w, notch_y + notch_h], radius=5, fill=(12, 14, 18, 255))
    
    # Save High Quality Play Store Creative
    out_file = os.path.join(DESKTOP_DIR, config["creative_out"])
    rgb_final = canvas.convert("RGB")
    rgb_final.save(out_file, "JPEG", quality=96, optimize=True)
    print(f" [✓] Created Play Store Creative: {config['creative_out']} ({CANVAS_W}x{CANVAS_H})")

print("Rendering all 9 Play Store marketing creatives...")
for item in SLIDES_CONFIG:
    render_slide(item)

print("\n=== ALL CREATIVES GENERATED SUCCESSFULLY ON DESKTOP ===")
