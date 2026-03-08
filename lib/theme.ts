export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Semantic colour tokens for the Subb / Catlog design system.
 */
export interface ThemeColors {
  bg: string;          // bg-main
  card: string;        // bg-surface
  cardAlt: string;
  modal: string;       // elevated sheet/modal bg
  border: string;
  text: string;        // text-primary
  muted: string;
  accent: string;      // brand-violet
  accentMuted: string;
  danger: string;      // brand-red
  dangerMuted: string;
  warning: string;     // brand-orange
  warningMuted: string;
  success: string;
  tabBar: string;
  tabBorder: string;
  glassOverlay: string;
  input: string;       // input field background
}

export const dark: ThemeColors = {
  // Deep blue-black base — premium, not flat grey
  bg:           '#0C0C14',   // deep navy-black
  card:         '#14141F',   // elevated surface
  cardAlt:      '#1C1C2A',   // secondary surface
  modal:        '#1A1A28',   // sheet/modal — clearly above card
  border:       '#2A2A40',   // subtle cool-toned border
  text:         '#EEEEF5',   // off-white — easy on the eyes, not harsh
  muted:        '#8A8AA8',   // cool grey-lavender muted
  accent:       '#A78BFA',   // softer violet — glows on dark
  accentMuted:  'rgba(167,139,250,0.14)',
  danger:       '#F87171',   // soft red
  dangerMuted:  'rgba(248,113,113,0.14)',
  warning:      '#FBBF24',   // amber — pops on dark
  warningMuted: 'rgba(251,191,36,0.14)',
  success:      '#34D399',   // mint green
  tabBar:       '#0C0C14',
  tabBorder:    '#1C1C2A',
  glassOverlay: 'rgba(255,255,255,0.07)',
  input:        '#1C1C2A',   // slightly lighter than card
};

export const light: ThemeColors = {
  // Warm white base — clean, airy, premium
  bg:           '#FAFAFA',   // off-white — softer than pure white
  card:         '#F2F2F7',   // iOS-style light surface
  cardAlt:      '#E8E8F0',   // secondary surface
  modal:        '#FFFFFF',   // pure white sheet lifts above card
  border:       '#E0E0EC',   // soft lavender-tinted border
  text:         '#0D0D18',   // near-black with blue tint — premium, not harsh
  muted:        '#6B6B80',   // warm grey-purple muted
  accent:       '#6D28D9',   // deep violet — punchy on light
  accentMuted:  'rgba(109,40,217,0.09)',
  danger:       '#E5173F',   // vivid red
  dangerMuted:  'rgba(229,23,63,0.09)',
  warning:      '#D97706',   // amber
  warningMuted: 'rgba(217,119,6,0.09)',
  success:      '#059669',   // emerald
  tabBar:       '#FFFFFF',
  tabBorder:    '#E0E0EC',
  glassOverlay: 'rgba(0,0,0,0.03)',
  input:        '#FFFFFF',   // pure white input on light card bg
};
