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
import { useTranslation, useRTL } from "@/contexts/LanguageContext";
import { Spacing, Colors } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { isBiometricEnabled, getBiometricUser } from "@/services/biometric";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, loginWithBiometric, biometricAvailable } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const navigation = useNavigation<NavigationProp>();

  const rtlTextAlign = isRTL ? { textAlign: "right" as const } : {};

  useEffect(() => {
    checkBiometricButton();
  }, []);

  async function checkBiometricButton() {
    const enabled = await isBiometricEnabled();
    const savedUser = await getBiometricUser();
    setHasSavedCredentials(!!savedUser);
    setShowBiometricButton(biometricAvailable && enabled && !!savedUser);
  }

  async function handleLogin() {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = t("auth.emailRequired") || "Email is required";
    if (!password) newErrors.password = t("auth.passwordRequired") || "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(t("auth.loginFailed") || "Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    if (!hasSavedCredentials) {
      Alert.alert(
        t("auth.biometricNotSetup") || "Biometric Not Set Up",
        t("auth.pleaseLoginFirst") || "Please login with your email and password first to enable biometric login."
      );
      return;
    }

    setLoading(true);
    try {
      const success = await loginWithBiometric();
      if (!success) {
        Alert.alert(
          t("common.error") || "Error",
          t("auth.biometricFailed") || "Biometric authentication failed. Please try again or login with your password."
        );
      }
    } catch (error: any) {
      Alert.alert(t("common.error") || "Error", error.message || t("auth.biometricFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.rootContainer}>
      <ScreenKeyboardAwareScrollView>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/maica-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={[styles.subtitle, rtlTextAlign]}>
              {t("auth.tagline") || "Business Management Made Simple"}
            </ThemedText>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label={t("auth.email") || "Email"}
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.email") || "Email"}
              keyboardType="email-address"
              error={errors.email}
            />

            <TextInput
              label={t("auth.password") || "Password"}
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.password") || "Password"}
              secureTextEntry
              error={errors.password}
            />

            <PrimaryButton
              title={t("auth.login") || "Login"}
              onPress={handleLogin}
              loading={loading}
            />

            {showBiometricButton ? (
              <Pressable
                onPress={handleBiometricLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.biometricButton,
                  { opacity: pressed ? 0.7 : loading ? 0.5 : 1 },
                ]}
              >
                <Feather name="unlock" size={18} color={Colors.primary} />
                <ThemedText style={styles.biometricText}>
                  {t("auth.useBiometric") || "Use Biometric Login"}
                </ThemedText>
              </Pressable>
            ) : biometricAvailable && !hasSavedCredentials ? (
              <ThemedText style={[styles.biometricHint, rtlTextAlign]}>
                {t("auth.biometricHint") || "Login once to enable biometric authentication"}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={() => navigation.navigate("Register")}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <ThemedText style={[styles.linkText, rtlTextAlign]}>
                {t("auth.noAccount") || "Don't have an account? Register"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 16,
    opacity: 1,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  formContainer: {
    gap: 16,
    width: "100%",
  },
  linkText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: Colors.primary,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 16,
    backgroundColor: "#F5F5F5",
  },
  biometricText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary,
  },
  biometricHint: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 12,
    color: "#666666",
  },
});
