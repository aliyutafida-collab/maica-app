import { useState } from "react";
import { TextInput as RNTextInput, StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

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
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.inputWrapper}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#555"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: error ? theme.error : theme.border,
              color: theme.text,
              paddingRight: secureTextEntry ? Spacing["4xl"] : Spacing.md,
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
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    width: "100%",
  },
  label: {
    fontSize: Typography.bodyXs.fontSize,
    fontWeight: "600" as const,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    fontSize: Typography.body.fontSize,
    fontWeight: "400" as const,
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  eyeIcon: {
    position: "absolute",
    right: Spacing.md,
    top: "50%",
    transform: [{ translateY: -20 }],
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  error: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500" as const,
    marginTop: Spacing.xs,
  },
});
