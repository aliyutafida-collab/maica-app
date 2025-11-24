import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { getSales, getExpenses } from "@/services/storage";
import { formatCurrency } from "@/lib/formatters";

export default function ReportsScreen() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const { user } = useAuth();
  const { theme } = useTheme();

  async function loadReports() {
    if (!user) return;

    const sales = await getSales(user.id);
    const expenses = await getExpenses(user.id);

    const salesTotal = sales.reduce((sum, s) => sum + s.total, 0);
    const taxTotal = sales.reduce((sum, s) => sum + s.taxAmount, 0);
    const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    setTotalSales(salesTotal);
    setTotalTax(taxTotal);
    setTotalExpenses(expensesTotal);
  }

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [user])
  );

  const netProfit = totalSales - totalExpenses;

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          Business Reports
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          All Time Summary
        </ThemedText>
      </View>

      <ThemedView
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Total Sales
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.success }]}>
            {formatCurrency(totalSales)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Total Tax Collected
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.text }]}>
            {formatCurrency(totalTax)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Total Expenses
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.error }]}>
            {formatCurrency(totalExpenses)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Net Profit
          </ThemedText>
          <ThemedText
            style={[
              styles.value,
              { color: netProfit >= 0 ? theme.success : theme.error },
            ]}
          >
            {formatCurrency(netProfit)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
          Tax Breakdown
        </ThemedText>
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Tax Rate (Default)
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.text }]}>
            7.5%
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Total Tax Liability
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.text }]}>
            ₦{totalTax.toFixed(2)}
          </ThemedText>
        </View>
      </ThemedView>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
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
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  label: {
    ...Typography.body,
  },
  value: {
    ...Typography.body,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
});
