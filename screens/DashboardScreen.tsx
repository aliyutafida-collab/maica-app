import { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { getSales, getExpenses } from "@/services/storage";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const [todaySales, setTodaySales] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  async function loadData() {
    if (!user) return;

    const sales = await getSales(user.id);
    const expenses = await getExpenses(user.id);

    const today = new Date().toDateString();
    const salesToday = sales
      .filter((s) => new Date(s.createdAt).toDateString() === today)
      .reduce((sum, s) => sum + s.total, 0);
    const expensesToday = expenses
      .filter((e) => new Date(e.createdAt).toDateString() === today)
      .reduce((sum, e) => sum + e.amount, 0);

    setTodaySales(salesToday);
    setTodayExpenses(expensesToday);
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const netIncome = todaySales - todayExpenses;

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <ThemedText style={[styles.greeting, { color: theme.text }]}>
          Welcome, {user?.name}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Today's Summary
        </ThemedText>
      </View>

      <ThemedView
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Sales
            </ThemedText>
            <ThemedText style={[styles.value, { color: theme.success }]}>
              ₦{todaySales.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Expenses
            </ThemedText>
            <ThemedText style={[styles.value, { color: theme.error }]}>
              ₦{todayExpenses.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Net
            </ThemedText>
            <ThemedText
              style={[
                styles.value,
                { color: netIncome >= 0 ? theme.success : theme.error },
              ]}
            >
              ₦{netIncome.toFixed(2)}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <View style={styles.actionsContainer}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionsGrid}>
          <Pressable
            onPress={() => navigation.navigate("AddSale")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="shopping-cart" size={32} color={theme.accent} />
            <ThemedText style={styles.actionLabel}>Add Sale</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("AddExpense")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="credit-card" size={32} color={theme.accent} />
            <ThemedText style={styles.actionLabel}>Add Expense</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("AddProduct")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="package" size={32} color={theme.accent} />
            <ThemedText style={styles.actionLabel}>Add Product</ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.h2,
  },
  actionsContainer: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    minWidth: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  actionLabel: {
    ...Typography.small,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
