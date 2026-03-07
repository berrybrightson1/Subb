export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentMuted: string;
  danger: string;
  dangerMuted: string;
  success: string;
  tabBar: string;
  tabBorder: string;
}

export const dark: ThemeColors = {
  bg: '#0F0F13',
  card: '#1C1C23',
  cardAlt: '#16161C',
  border: '#2A2A35',
  text: '#FFFFFF',
  muted: '#A1A1AA',
  accent: '#A855F7',
  accentMuted: 'rgba(168,85,247,0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.12)',
  success: '#10B981',
  tabBar: '#0F0F13',
  tabBorder: '#1C1C23',
};

export const light: ThemeColors = {
  bg: '#FFFFFF',
  card: '#F3F4F6',
  cardAlt: '#E5E7EB',
  border: '#E5E7EB',
  text: '#111111',
  muted: '#6B7280',
  accent: '#A855F7',
  accentMuted: 'rgba(168,85,247,0.08)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.08)',
  success: '#10B981',
  tabBar: '#FFFFFF',
  tabBorder: '#E5E7EB',
};
