import { Alert } from "react-native";

export function handleBiometricFlow(
  token: string | null,
  runBiometric: () => Promise<boolean>
): Promise<boolean> {
  if (!token) {
    Alert.alert("Please login first", "Biometric authentication requires a logged-in session.");
    return Promise.resolve(false);
  }
  return runBiometric().catch((err) => {
    console.warn("biometric failed:", err);
    return false;
  });
}

export default handleBiometricFlow;
