const brandPrimary = '#0B234A';  // Navy blue
const brandAccent = '#17AEBF';   // Teal

export const Colors = {
  light: {
    primary: brandPrimary,
    accent: brandAccent,
    background: '#FFFFFF',
    backgroundRoot: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceHigh: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: brandAccent,
    tabBackground: '#FFFFFF',
  },
  dark: {
    primary: brandPrimary,
    accent: brandAccent,
    background: '#111827',
    backgroundRoot: '#0F172A',
    surface: '#1E293B',
    surfaceHigh: '#334155',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    border: '#334155',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    tabIconDefault: '#64748B',
    tabIconSelected: brandAccent,
    tabBackground: '#0F172A',
  },
  primary: brandPrimary,
  accent: brandAccent,
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 20,
  },
  bodyXs: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 16,
  },
};

export const Shadows = {
  fab: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  } as const,
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  } as const,
};

export const Fonts = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  mono: 'Menlo',
};
