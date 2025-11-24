import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { addExpense } from "@/services/storage";
import type { ExpenseCategory } from "@/lib/types";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Inventory",
  "Utilities",
  "Salaries",
  "Rent",
  "Marketing",
  "Other",
];

export default function AddExpenseScreen() {
  const [category, setCategory] = useState<ExpenseCategory>("Inventory");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  async function handleSave() {
    const newErrors: any = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = "Valid amount is required";
    if (!description) newErrors.description = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (!user) return;
      await addExpense({
        category,
        amount: Number(amount),
        description,
        userId: user.id,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          Add Expense
        </ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={[styles.label, { color: theme.text }]}>
          Category
        </ThemedText>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Picker
            selectedValue={category}
            onValueChange={(value) => setCategory(value as ExpenseCategory)}
            style={{ color: theme.text }}
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="numeric"
        error={errors.amount}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Enter expense details"
        multiline
        numberOfLines={4}
        error={errors.description}
      />

      <View style={styles.buttons}>
        <PrimaryButton
          title="Save Expense"
          onPress={handleSave}
          loading={loading}
        />
        <SecondaryButton title="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  buttons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
