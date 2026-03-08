/**
 * lib/fonts.ts
 * Single source of truth for all font family names used in the app.
 * Import these instead of hardcoding strings in StyleSheets.
 *
 * Pairing:
 *   Jakarta → display / headers / labels / buttons
 *   Inter   → body / inputs / lists / muted text
 */

export const Fonts = {
    // Plus Jakarta Sans
    display: 'PlusJakartaSans_700Bold',    // 700 — main headings, hero numbers
    brand: 'PlusJakartaSans_500Medium',  // 500 — sub-headers, labels, buttons

    // Inter
    sans: 'Inter_400Regular',   // 400 — body, lists, inputs
    sansBold: 'Inter_600SemiBold',  // 600 — emphasis, prices, badges
} as const;
