// F1 Dark Theme
export const Colors = {
  // Core
  background: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1E1E1E',
  surfaceCard: '#1A1A1A',

  // F1 Brand
  primary: '#E8002D',       // F1 red
  primaryDark: '#B8001F',
  primaryLight: '#FF1744',

  // Text  (textMuted bumped from #555 → #8A8A8A for WCAG AA contrast on #0A0A0A)
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#8A8A8A',
  textFaint: '#555555', // decorative only — empty dots, dashed borders (not text)
  textOnPrimary: '#FFFFFF',

  // Accents
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',

  // Pomodoro phase accents
  focusAccent: '#E8002D',
  shortBreakAccent: '#00D4FF',
  longBreakAccent: '#7B2FBE',

  // Semantic — error is distinct from primary so users can tell them apart
  success: '#00C853',
  warning: '#FFD600',
  error: '#FF4C2B',     // orange-red, clearly different from F1 brand red
  errorLight: '#2A0A00',

  // Borders / dividers
  border: '#2A2A2A',
  divider: '#1E1E1E',

  // Focus broken
  brokenBg: '#1A0004',
  brokenAccent: '#E8002D',

  // Overlays
  overlay: 'rgba(0,0,0,0.85)',
  overlayLight: 'rgba(0,0,0,0.5)',
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
  sm: 6,
  md: 10,
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
  xxxl: 40,
  timer: 68,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#E8002D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#E8002D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#E8002D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
};
