import { useState, useEffect } from "react";
import { View, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/contexts/LanguageContext";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { isBiometricEnabled } from "@/services/biometric";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login, loginWithBiometric, biometricAvailable } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    checkBiometricButton();
  }, []);

  async function checkBiometricButton() {
    const enabled = await isBiometricEnabled();
    setShowBiometricButton(biometricAvailable && enabled);
  }

  async function handleLogin() {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    setLoading(true);
    try {
      const success = await loginWithBiometric();
      if (!success) {
        Alert.alert(t("common.error"), t("auth.biometricFailed"));
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || t("auth.biometricFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/maica-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {t("auth.tagline")}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.email")}
            keyboardType="email-address"
            error={errors.email}
          />

          <TextInput
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.password")}
            secureTextEntry
            error={errors.password}
          />

          <PrimaryButton
            title={t("auth.login")}
            onPress={handleLogin}
            loading={loading}
          />

          {showBiometricButton ? (
            <Pressable
              onPress={handleBiometricLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.biometricButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="unlock" size={20} color={theme.accent} />
              <ThemedText
                style={[styles.biometricText, { color: theme.accent }]}
              >
                {t("auth.useBiometric")}
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <ThemedText
              style={[styles.linkText, { color: theme.accent }]}
            >
              {t("auth.noAccount")}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Spacing["3xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing["2xl"],
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: Typography.h1.fontSize,
    fontWeight: "700" as const,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "400" as const,
  },
  formContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  linkText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "400" as const,
    textAlign: "center" as const,
    marginTop: Spacing.xl,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  biometricText: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600" as const,
  },
});
