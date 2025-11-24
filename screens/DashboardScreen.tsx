import { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { getSales, getExpenses } from "@/services/storage";
import { formatCurrency } from "@/lib/formatters";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const [todaySales, setTodaySales] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [weeklySales, setWeeklySales] = useState(0);
  const [weeklyExpenses, setWeeklyExpenses] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const { user } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  function getDateRange(periodType: "day" | "week" | "month") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (periodType === "day") {
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    } else if (periodType === "week") {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const start = new Date(today.setDate(diff));
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { start, end };
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
  }

  async function loadData() {
    if (!user) return;

    const sales = await getSales(user.id);
    const expenses = await getExpenses(user.id);

    // Calculate for all periods
    const periods = ["day", "week", "month"] as const;

    for (const p of periods) {
      const { start, end } = getDateRange(p);
      const salesTotals = sales
        .filter((s) => {
          const d = new Date(s.createdAt);
          return d >= start && d < end;
        })
        .reduce((sum, s) => sum + s.total, 0);
      const expensesTotals = expenses
        .filter((e) => {
          const d = new Date(e.createdAt);
          return d >= start && d < end;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      if (p === "day") {
        setTodaySales(salesTotals);
        setTodayExpenses(expensesTotals);
      } else if (p === "week") {
        setWeeklySales(salesTotals);
        setWeeklyExpenses(expensesTotals);
      } else {
        setMonthlySales(salesTotals);
        setMonthlyExpenses(expensesTotals);
      }
    }
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
          {t("dashboard.welcome")}, {user?.name}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("dashboard.todaySummary")}
        </ThemedText>
      </View>

      <View style={styles.periodSelector}>
        {(["day", "week", "month"] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.periodButton,
              {
                backgroundColor:
                  period === p ? theme.accent : theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                { color: period === p ? "#FFFFFF" : theme.text },
              ]}
            >
              {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedView
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              {t("dashboard.sales")}
            </ThemedText>
            <ThemedText style={[styles.value, { color: theme.success }]}>
              {formatCurrency(
                period === "day"
                  ? todaySales
                  : period === "week"
                    ? weeklySales
                    : monthlySales
              )}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              {t("dashboard.expenses")}
            </ThemedText>
            <ThemedText style={[styles.value, { color: theme.error }]}>
              {formatCurrency(
                period === "day"
                  ? todayExpenses
                  : period === "week"
                    ? weeklyExpenses
                    : monthlyExpenses
              )}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              {t("dashboard.net")}
            </ThemedText>
            <ThemedText
              style={[
                styles.value,
                {
                  color:
                    (period === "day"
                      ? todaySales - todayExpenses
                      : period === "week"
                        ? weeklySales - weeklyExpenses
                        : monthlySales - monthlyExpenses) >= 0
                      ? theme.success
                      : theme.error,
                },
              ]}
            >
              {formatCurrency(
                period === "day"
                  ? todaySales - todayExpenses
                  : period === "week"
                    ? weeklySales - weeklyExpenses
                    : monthlySales - monthlyExpenses
              )}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <View style={styles.actionsContainer}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          {t("dashboard.quickActions")}
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
            <ThemedText style={styles.actionLabel}>{t("dashboard.addSale")}</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("AddExpense")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="credit-card" size={32} color={theme.accent} />
            <ThemedText style={styles.actionLabel}>{t("dashboard.addExpense")}</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("AddProduct")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="package" size={32} color={theme.accent} />
            <ThemedText style={styles.actionLabel}>{t("dashboard.addProduct")}</ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.h1.fontSize,
    fontWeight: "700" as const,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "400" as const,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  periodButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: Typography.bodySm.fontSize,
    fontWeight: "600" as const,
  },
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: Typography.bodySm.fontSize,
    fontWeight: "500" as const,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600" as const,
  },
  actionsContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: "600" as const,
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
    fontSize: Typography.bodySm.fontSize,
    fontWeight: "500" as const,
    marginTop: Spacing.sm,
    textAlign: "center" as const,
  },
});
