import { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import {
  isBiometricEnabled,
  setBiometricEnabled,
  saveBiometricUser,
} from "@/services/biometric";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "fr", name: "Français" },
];

const THEME_MODES = [
  { value: "light" as const, key: "themeLight" },
  { value: "dark" as const, key: "themeDark" },
  { value: "system" as const, key: "themeSystem" },
];

export default function MoreScreen() {
  const { user, logout, biometricAvailable } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    loadBiometricSetting();
  }, []);

  async function loadBiometricSetting() {
    const enabled = await isBiometricEnabled();
    setBiometricEnabledState(enabled);
  }

  function handleLogout() {
    Alert.alert(
      t("auth.logout"),
      t("auth.logoutConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.logout"),
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }

  function handleLanguageChange() {
    const buttons: any[] = LANGUAGES.map((lang) => ({
      text: lang.name,
      onPress: async () => {
        await setLanguage(lang.code as any);
      },
    }));
    buttons.push({ text: t("common.cancel"), style: "cancel" });
    Alert.alert(t("more.language"), t("more.selectLanguage"), buttons);
  }

  function handleThemeChange() {
    const buttons: any[] = THEME_MODES.map((mode) => ({
      text: t(`more.${mode.key}`),
      onPress: async () => {
        await setThemeMode(mode.value);
      },
    }));
    buttons.push({ text: t("common.cancel"), style: "cancel" });
    Alert.alert(t("more.theme"), t("more.selectTheme"), buttons);
  }

  async function handleBiometricToggle(value: boolean) {
    setBiometricEnabledState(value);
    await setBiometricEnabled(value);
    
    if (value && user) {
      await saveBiometricUser(user);
    }
  }

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {t("more.title")}
        </ThemedText>
      </View>

      <ThemedView
        style={[
          styles.profileCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.avatar}>
          <Feather name="user" size={32} color={theme.primary} />
        </View>
        <View style={styles.profileInfo}>
          <ThemedText style={[styles.name, { color: theme.text }]}>
            {user?.name}
          </ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {user?.email}
          </ThemedText>
        </View>
      </ThemedView>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t("more.features")}
        </ThemedText>

        <Pressable
          onPress={() => navigation.navigate("AIAdvisor")}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="zap" size={24} color={theme.accent} />
            <ThemedText style={[styles.menuItemText, { color: theme.text }]}>
              {t("more.aiAdvisor")}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Subscription")}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="star" size={24} color={theme.accent} />
            <ThemedText style={[styles.menuItemText, { color: theme.text }]}>
              {t("more.subscription")}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("FinancialLearning")}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="book" size={24} color={theme.accent} />
            <ThemedText style={[styles.menuItemText, { color: theme.text }]}>
              {t("more.financial")}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t("more.preferences")}
        </ThemedText>

        <Pressable
          onPress={handleThemeChange}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="sun" size={24} color={theme.accent} />
            <ThemedText style={[styles.menuItemText, { color: theme.text }]}>
              {t("more.theme")}
            </ThemedText>
          </View>
          <View style={styles.menuItemRight}>
            <ThemedText style={[styles.menuItemValue, { color: theme.textSecondary }]}>
              {t(`more.${THEME_MODES.find((m) => m.value === themeMode)?.key || "themeSystem"}`)}
            </ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
        </Pressable>

        <Pressable
          onPress={handleLanguageChange}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="globe" size={24} color={theme.accent} />
            <ThemedText style={[styles.menuItemText, { color: theme.text }]}>
              {t("more.language")}
            </ThemedText>
          </View>
          <View style={styles.menuItemRight}>
            <ThemedText style={[styles.menuItemValue, { color: theme.textSecondary }]}>
              {LANGUAGES.find((l) => l.code === language)?.name || "English"}
            </ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
        </Pressable>

        {biometricAvailable ? (
          <View
            style={[
              styles.menuItem,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.menuItemLeft}>
              <Feather name="shield" size={24} color={theme.accent} />
              <ThemedText style={[styles.menuItemText, { color: theme.text }]}>
                {t("more.enableBiometric")}
              </ThemedText>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t("more.account")}
        </ThemedText>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="log-out" size={24} color={theme.error} />
            <ThemedText style={[styles.menuItemText, { color: theme.error }]}>
              {t("auth.logout")}
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
  } as any,
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5F1F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: "600" as const,
    marginBottom: Spacing.xs,
  } as any,
  email: {
    ...Typography.bodyXs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.body,
  } as any,
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  menuItemValue: {
    ...Typography.body,
  } as any,
});
