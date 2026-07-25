/**
 * theme.js — Legacy re-export shim
 *
 * All new code should import from `designSystem.js` directly.
 * This file re-exports from the design system so existing screens
 * that import { COLORS, SPACING, SHADOWS } from './theme' continue to work.
 */

import DS, {
    DESIGN_COLORS,
    DESIGN_SPACING,
    DESIGN_SHADOWS,
    DESIGN_RADIUS,
    DESIGN_TYPOGRAPHY,
    DESIGN_GRADIENTS,
} from './designSystem';

// ── Backward-compatible COLORS (merges old keys + new tokens) ──
export const COLORS = {
    // ─── New Design System Tokens ───
    ...DESIGN_COLORS,

    // ─── Legacy Aliases (kept so old screens don't break) ───
    roseGold:           DESIGN_COLORS.primary,
    roseGoldLight:      DESIGN_COLORS.primaryFixed,
    roseGoldDark:       DESIGN_COLORS.inversePrimary,
    roseGoldMuted:      DESIGN_COLORS.primaryContainer,
    roseGoldGradient:   DESIGN_GRADIENTS.primaryAccent,

    technicianPrimary:  DESIGN_COLORS.primary,
    technicianAccent:   DESIGN_COLORS.primaryContainer,
    technicianDark:     DESIGN_COLORS.onPrimary,
    technicianLight:    DESIGN_COLORS.primaryFixed,
    technicianBg:       DESIGN_COLORS.surfaceContainerLow,

    gold:               DESIGN_COLORS.primaryFixed,
    copper:             DESIGN_COLORS.primary,

    navy:               '#1A237E',
    white:              DESIGN_COLORS.onSurface,
    black:              DESIGN_COLORS.background,
    grey:               DESIGN_COLORS.outline,
    greyLight:          DESIGN_COLORS.surfaceContainerHighest,
    greyMedium:         DESIGN_COLORS.outlineVariant,

    success:            DESIGN_COLORS.success,
    earningsGreen:      DESIGN_COLORS.success,
    error:              DESIGN_COLORS.error,
    warning:            DESIGN_COLORS.warning,
    warningAmber:       DESIGN_COLORS.warning,
    info:               DESIGN_COLORS.info,

    background:         DESIGN_COLORS.background,
    card:               DESIGN_COLORS.surfaceContainerLow,
    primaryBg:          DESIGN_COLORS.surfaceContainerLowest,
    secondaryBg:        DESIGN_COLORS.surfaceContainer,
    overlay:            DESIGN_COLORS.overlay,

    // Kept but redirected
    slate:              DESIGN_COLORS.surfaceContainerHighest,
    slateLight:         DESIGN_COLORS.surfaceContainerHigh,
    indigo:             '#4f46e5',
    violet:             '#7c3aed',
    premiumBg:          DESIGN_COLORS.surfaceContainerLow,
    textMain:           DESIGN_COLORS.onSurface,
    textMuted:          DESIGN_COLORS.onSurfaceVariant,
    borderLight:        DESIGN_COLORS.outlineVariant,

    bw_black:           DESIGN_COLORS.background,
    bw_white:           DESIGN_COLORS.onSurface,
    bw_grey:            DESIGN_COLORS.surfaceContainerHigh,
    bw_greyLight:       DESIGN_COLORS.surfaceContainerHighest,
    bw_greyMedium:      DESIGN_COLORS.outlineVariant,
    bw_border:          DESIGN_COLORS.outline,
};

export const SPACING = DESIGN_SPACING;
export const FONTS   = {
    regular: 'Outfit_300Light',
    medium:  'Outfit_500Medium',
    bold:    'Outfit_600SemiBold',
    heavy:   'Outfit_600SemiBold',
};
export const SHADOWS    = DESIGN_SHADOWS;
export const RADIUS     = DESIGN_RADIUS;
export const TYPOGRAPHY = DESIGN_TYPOGRAPHY;
export const GRADIENTS  = DESIGN_GRADIENTS;

export default {
    COLORS,
    SPACING,
    FONTS,
    SHADOWS,
    RADIUS,
    TYPOGRAPHY,
    GRADIENTS,
};
