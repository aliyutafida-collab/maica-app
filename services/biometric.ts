import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_ENABLED_KEY = "@maica_biometric_enabled";
const BIOMETRIC_USER_KEY = "@maica_biometric_user";

export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometric(
  promptMessage: string = "Authenticate to continue"
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Password",
      cancelLabel: "Cancel",
    });

    return result.success;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return enabled === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
  if (!enabled) {
    await clearBiometricUser();
  }
}

export async function getSupportedBiometricTypes(): Promise<string[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return types.map((type) => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return "Fingerprint";
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return "Face ID";
      case LocalAuthentication.AuthenticationType.IRIS:
        return "Iris";
      default:
        return "Biometric";
    }
  });
}

export async function saveBiometricUser(user: any): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_USER_KEY, JSON.stringify(user));
}

export async function getBiometricUser(): Promise<any | null> {
  const userData = await AsyncStorage.getItem(BIOMETRIC_USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

export async function clearBiometricUser(): Promise<void> {
  await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
}
