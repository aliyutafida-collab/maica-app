/**
 * Central design tokens for MaiCa mobile
 * Exports: Spacing, Typography, BorderRadius, Shadows, Colors (light/dark)
 */
export const Spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 36,
  "4xl": 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
};

export const Typography = {
  h1: { fontSize: 28, lineHeight: 34 },
  h2: { fontSize: 24, lineHeight: 30 },
  h3: { fontSize: 20, lineHeight: 26 },
  heading: { fontSize: 22, lineHeight: 28 },
  subheading: { fontSize: 16, lineHeight: 22 },
  bodySm: { fontSize: 13, lineHeight: 19 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 11, lineHeight: 14 },
};

export const Shadows = {
  fab: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
};

export const Colors = {
  light: {
    backgroundRoot: "#F7FAFC",
    surface: "#FFFFFF",
    text: "#0B132A",
    textSecondary: "#7B7F87",
    border: "#E6E9EE",
    primary: "#0B234A",
    accent: "#17AEBF",
  },
  dark: {
    backgroundRoot: "#0E1520",
    surface: "#17212A",
    text: "#E6EEF3",
    textSecondary: "#95A1B0",
    border: "#222831",
    primary: "#17AEBF",
    accent: "#17AEBF",
  },
};
