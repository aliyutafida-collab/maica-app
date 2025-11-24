import { useState } from "react";
import { View, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/contexts/LanguageContext";
import { Spacing, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

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
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  formContainer: {
    marginTop: Spacing.xl,
  },
  linkText: {
    ...Typography.body,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
