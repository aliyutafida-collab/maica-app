import { useState } from "react";
import { TextInput as RNTextInput, StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";

interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.inputWrapper}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8C8C8C"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            {
              color: "#222222",
              paddingRight: secureTextEntry ? 50 : 16,
            },
            multiline && { height: numberOfLines ? numberOfLines * 40 : 80 },
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#8C8C8C"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText style={[styles.error]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    color: "#222222",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    fontSize: 16,
    fontWeight: "400" as const,
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    borderColor: "#D9D9D9",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -20 }],
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  error: {
    fontSize: 12,
    fontWeight: "500" as const,
    marginTop: 6,
    color: "#D32F2F",
  },
});
