/**
 * ZYRO AC — Design System
 * Single source of truth for all colors, typography, spacing, and radii.
 * ALL UI must reference this file exclusively.
 * ⚠️  Do NOT hardcode any color, font size, or spacing value in screens.
 */

// ─────────────────────────────────────────
// COLOR TOKENS
// ─────────────────────────────────────────
export const DESIGN_COLORS = {
    // Surfaces
    surface:                   '#131313',
    surfaceDim:                '#131313',
    surfaceBright:             '#3a3939',
    surfaceContainerLowest:    '#0e0e0e',
    surfaceContainerLow:       '#1c1b1b',
    surfaceContainer:          '#201f1f',
    surfaceContainerHigh:      '#2a2a2a',
    surfaceContainerHighest:   '#353534',

    // On-Surface
    onSurface:                 '#e5e2e1',
    onSurfaceVariant:          '#d4c3bc',

    // Inverse
    inverseSurface:            '#e5e2e1',
    inverseOnSurface:          '#313030',

    // Outline
    outline:                   '#9c8e87',
    outlineVariant:            '#50443f',

    // Primary (Warm Terracotta / Nude)
    surfaceTint:               '#e6beab',
    primary:                   '#e6beab',
    onPrimary:                 '#432b1e',
    primaryContainer:          '#c5a08e',
    onPrimaryContainer:        '#513729',
    inversePrimary:            '#765848',

    // Secondary (Neutral Gray)
    secondary:                 '#c9c6c4',
    onSecondary:               '#31302f',
    secondaryContainer:        '#4a4948',
    onSecondaryContainer:      '#bbb8b6',

    // Tertiary (Cool Gray)
    tertiary:                  '#c8c6c5',
    onTertiary:                '#313030',
    tertiaryContainer:         '#a9a7a7',
    onTertiaryContainer:       '#3d3d3c',

    // Error
    error:                     '#ffb4ab',
    onError:                   '#690005',
    errorContainer:            '#93000a',
    onErrorContainer:          '#ffdad6',

    // Primary Fixed
    primaryFixed:              '#ffdbca',
    primaryFixedDim:           '#e6beab',
    onPrimaryFixed:            '#2b160b',
    onPrimaryFixedVariant:     '#5c4132',

    // Secondary Fixed
    secondaryFixed:            '#e5e2e0',
    secondaryFixedDim:         '#c9c6c4',
    onSecondaryFixed:          '#1c1b1b',
    onSecondaryFixedVariant:   '#484645',

    // Tertiary Fixed
    tertiaryFixed:             '#e5e2e1',
    tertiaryFixedDim:          '#c8c6c5',
    onTertiaryFixed:           '#1c1b1b',
    onTertiaryFixedVariant:    '#474746',

    // Background
    background:                '#131313',
    onBackground:              '#e5e2e1',
    surfaceVariant:            '#353534',

    // ── Semantic Aliases (convenient shortcuts) ──
    white:                     '#e5e2e1',   // on-surface
    black:                     '#131313',   // surface / background
    grey:                      '#9c8e87',   // outline
    greyLight:                 '#353534',   // surface-container-highest
    greyMedium:                '#50443f',   // outline-variant

    success:                   '#4CAF50',
    warning:                   '#FFC107',
    info:                      '#2196F3',

    overlay:                   'rgba(0, 0, 0, 0.55)',
};

// ─────────────────────────────────────────
// TYPOGRAPHY TOKENS
// (font families need expo-google-fonts or bundled font)
// ─────────────────────────────────────────
export const DESIGN_TYPOGRAPHY = {
    displayLg: {
        fontFamily:     'Outfit_600SemiBold',
        fontSize:       64,
        fontWeight:     '600',
        lineHeight:     70,       // ~1.1 × 64
        letterSpacing:  -0.02 * 64,
    },
    headlineLg: {
        fontFamily:     'Outfit_500Medium',
        fontSize:       32,
        fontWeight:     '500',
        lineHeight:     38,       // ~1.2 × 32
        letterSpacing:  -0.01 * 32,
    },
    headlineLgMobile: {
        fontFamily:     'Outfit_500Medium',
        fontSize:       28,
        fontWeight:     '500',
        lineHeight:     34,       // ~1.2 × 28
        letterSpacing:  0,
    },
    titleMd: {
        fontFamily:     'Outfit_500Medium',
        fontSize:       20,
        fontWeight:     '500',
        lineHeight:     28,       // ~1.4 × 20
        letterSpacing:  0,
    },
    bodyLg: {
        fontFamily:     'Outfit_300Light',
        fontSize:       18,
        fontWeight:     '300',
        lineHeight:     29,       // ~1.6 × 18
        letterSpacing:  0,
    },
    bodyMd: {
        fontFamily:     'Outfit_300Light',
        fontSize:       16,
        fontWeight:     '300',
        lineHeight:     26,       // ~1.6 × 16
        letterSpacing:  0,
    },
    labelCaps: {
        fontFamily:     'Outfit_600SemiBold',
        fontSize:       12,
        fontWeight:     '600',
        lineHeight:     12,       // 1 × 12
        letterSpacing:  0.1 * 12,
        textTransform:  'uppercase',
    },
};

// ─────────────────────────────────────────
// BORDER RADIUS TOKENS
// ─────────────────────────────────────────
export const DESIGN_RADIUS = {
    sm:   4,
    md:   6,
    DEFAULT: 8,
    base: 12,
    lg:   16,
    xl:   24,
    full: 9999,
};

// ─────────────────────────────────────────
// SPACING TOKENS
// ─────────────────────────────────────────
export const DESIGN_SPACING = {
    unit:                    8,
    containerPaddingMobile:  20,
    containerPaddingDesktop: 80,
    gutter:                  24,
    sectionGap:              120,

    // Shorthand multiples of unit (8px)
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    xxl:  40,
    xxxl: 64,
};

// ─────────────────────────────────────────
// SHADOW TOKENS
// ─────────────────────────────────────────
export const DESIGN_SHADOWS = {
    none: {
        elevation: 0,
        shadowOpacity: 0,
    },
    sm: {
        shadowColor: DESIGN_COLORS.onPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: DESIGN_COLORS.onPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
};

// ─────────────────────────────────────────
// Gradient Presets (for LinearGradient)
// ─────────────────────────────────────────
export const DESIGN_GRADIENTS = {
    // Exact gradient from splash screen design image:
    // dark #131313 on top → warm terracotta #e6beab at bottom
    splashMain:   ['#131313', '#1c1518', '#432b1e', '#c5a08e'],
    splashStart:  ['#131313', '#2b160b', '#e6beab'],
    splashEnd:    ['#131313', '#3a2218', '#e6beab'],
    primaryAccent: [DESIGN_COLORS.primary, DESIGN_COLORS.onPrimary],
};

// ─────────────────────────────────────────
// DEFAULT EXPORT — everything in one object
// ─────────────────────────────────────────
export default {
    colors:     DESIGN_COLORS,
    typography: DESIGN_TYPOGRAPHY,
    radius:     DESIGN_RADIUS,
    spacing:    DESIGN_SPACING,
    shadows:    DESIGN_SHADOWS,
    gradients:  DESIGN_GRADIENTS,
};
