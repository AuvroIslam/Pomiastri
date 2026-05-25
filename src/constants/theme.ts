export const Colors = {
  // Primary palette — calm blue
  primary: '#4A90D9',
  primaryLight: '#7BB3E8',
  primaryDark: '#2D6FAF',

  // Surface colors
  background: '#F0F7FF',
  surface: '#FFFFFF',
  surfaceElevated: '#EAF3FD',

  // Text
  textPrimary: '#1A2A3A',
  textSecondary: '#5A7080',
  textMuted: '#9AAFBF',
  textOnPrimary: '#FFFFFF',

  // Phase accent colors
  focusAccent: '#4A90D9',    // blue
  shortBreakAccent: '#4ABFA0', // teal
  longBreakAccent: '#7B8FC0',  // soft indigo

  // Semantic
  success: '#4CAF7C',
  warning: '#F5A623',
  error: '#E85D5D',
  errorLight: '#FFF0F0',

  // Border / divider
  border: '#D8E8F5',
  divider: '#EAF0F7',

  // Focus broken state
  brokenBg: '#FFF4F4',
  brokenAccent: '#E85D5D',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 48,
  timer: 72,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#1A2A3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A2A3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
