import { useState, useEffect } from "react";
import { View, StyleSheet, Image, Pressable, Alert, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Spacing, Colors } from "@/constants/theme";
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
    <View style={styles.rootContainer}>
      <ScreenKeyboardAwareScrollView>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/maica-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={styles.subtitle}>
              Business Management Made Simple
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
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="unlock" size={18} color="#003366" />
                <ThemedText style={styles.biometricText}>
                  {t("auth.useBiometric")}
                </ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => navigation.navigate("Register")}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <ThemedText style={styles.linkText}>
                {t("auth.noAccount")}
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
    textAlign: "center" as const,
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#333333",
  },
  formContainer: {
    gap: 16,
    width: "100%",
  },
  linkText: {
    textAlign: "center" as const,
    marginTop: 24,
    fontSize: 14,
    color: "#003366",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#003366",
    marginTop: 16,
    backgroundColor: "#F5F5F5",
  },
  biometricText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#003366",
  },
});
