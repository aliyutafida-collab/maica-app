import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { User } from "@/lib/types";

const BIOMETRIC_ENABLED_KEY = "@maica_biometric_enabled";
const BIOMETRIC_USER_KEY = "@maica_biometric_user";

export async function isBiometricSupported(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Biometric support check failed:", error);
    return false;
  }
}

export async function authenticateWithBiometric(
  promptMessage: string = "Authenticate to continue"
): Promise<boolean> {
  if (Platform.OS === "web") {
    console.log("Biometric not available on web");
    return false;
  }

  try {
    const supported = await isBiometricSupported();
    if (!supported) {
      console.log("Biometric not supported on this device");
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Password",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === "true";
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
    if (!enabled) {
      await clearBiometricUser();
    }
  } catch (error) {
    console.error("Failed to set biometric enabled:", error);
  }
}

export async function getSupportedBiometricTypes(): Promise<string[]> {
  if (Platform.OS === "web") return [];

  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return "fingerprint";
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return "face";
        case LocalAuthentication.AuthenticationType.IRIS:
          return "iris";
        default:
          return "unknown";
      }
    });
  } catch {
    return [];
  }
}

export async function saveBiometricUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, JSON.stringify(user));
    await setBiometricEnabled(true);
  } catch (error) {
    console.error("Failed to save biometric user:", error);
  }
}

export async function getBiometricUser(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(BIOMETRIC_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

export async function clearBiometricUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
  } catch (error) {
    console.error("Failed to clear biometric user:", error);
  }
}
