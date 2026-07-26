/**
 * Zyro Admin Portal - Centralized Color Code Config & Design System Tokens
 * Standardized palette matching Zyro's luxury dark aesthetic.
 */

export const ADMIN_COLORS = {
  // Brand & Accent Colors
  primary: '#E6BEAB',         // Warm Copper Gold Accent
  primaryHover: '#D8AB95',    // Slightly darker gold for hover states
  primaryDark: '#B8866E',     // Deep copper accent
  primaryGlow: 'rgba(230, 190, 171, 0.15)', // Soft glow aura

  // Surface & Background Colors
  bg: '#0D0D0D',              // Pure dark background
  surface: '#141414',         // Main card container surface
  surfaceHover: '#1A1A1A',    // Elevated hover state for cards/rows
  surfaceElevated: '#1C1C1C', // Sub-containers & input fields
  sidebarBg: '#111111',       // Dark sidebar background

  // Borders & Dividers
  border: '#222222',          // Subtle border line
  borderLight: '#2D2D2D',     // Focused input border
  borderGold: 'rgba(230, 190, 171, 0.3)', // Gold highlight border

  // Text Hierarchy
  textPrimary: '#FFFFFF',     // Bright white headings & main text
  textSecondary: '#A0A0A0',   // Muted labels & subtitles
  textMuted: '#666666',       // Disabled/placeholder text
  textGold: '#E6BEAB',        // Accent highlighted text

  // Status & Feedback Colors
  success: '#4ADE80',         // Soft emerald green
  successBg: 'rgba(74, 222, 128, 0.12)',
  warning: '#FBBF24',         // Warm amber yellow
  warningBg: 'rgba(251, 191, 36, 0.12)',
  error: '#F87171',           // Coral rose red
  errorBg: 'rgba(248, 113, 113, 0.12)',
  info: '#60A5FA',            // Electric sky blue
  infoBg: 'rgba(96, 165, 250, 0.12)',
};

export default ADMIN_COLORS;
