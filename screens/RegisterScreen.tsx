import { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Image } from "react-native";
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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  async function handleRegister() {
    const newErrors: any = {};

    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (password && password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await register(name, email, password);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
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
            label={t("auth.fullName")}
            value={name}
            onChangeText={setName}
            placeholder={t("auth.fullName")}
            error={errors.name}
          />

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

          <TextInput
            label={t("auth.confirmPassword")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t("auth.confirmPassword")}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <PrimaryButton
            title={t("auth.register")}
            onPress={handleRegister}
            loading={loading}
          />

          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <ThemedText style={[styles.linkText, { color: theme.accent }]}>
              {t("auth.alreadyHaveAccount")}
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
    marginBottom: Spacing.xl,
    textAlign: "center",
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
