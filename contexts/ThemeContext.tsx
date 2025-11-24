import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from "@react-navigation/native";
import { Colors } from "@/constants/theme";
import { useColorScheme as useSystemColorScheme } from "@/hooks/useColorScheme";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: typeof Colors.light;
  isDark: boolean;
  themeMode: ThemeMode;
  navigationTheme: NavigationTheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "@maica_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    loadThemeMode();
  }, []);

  async function loadThemeMode() {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_KEY);
      if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "system")) {
        setThemeModeState(savedMode);
      }
    } catch (error) {
      console.error("Failed to load theme mode:", error);
    }
  }

  async function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  }

  const effectiveColorScheme = themeMode === "system" ? systemColorScheme : themeMode;
  const isDark = effectiveColorScheme === "dark";
  const theme = Colors[effectiveColorScheme ?? "light"];

  const navigationTheme: NavigationTheme = {
    dark: isDark,
    colors: isDark
      ? {
          ...NavigationDarkTheme.colors,
          primary: theme.primary,
          background: theme.backgroundRoot,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.accent,
        }
      : {
          ...NavigationDefaultTheme.colors,
          primary: theme.primary,
          background: theme.backgroundRoot,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.accent,
        },
    fonts: isDark
      ? NavigationDarkTheme.fonts
      : NavigationDefaultTheme.fonts,
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, navigationTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
