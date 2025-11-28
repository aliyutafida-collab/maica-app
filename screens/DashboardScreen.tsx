import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation, useRTL } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { getSales, getExpenses } from "@/services/storage";
import { formatCurrency } from "@/lib/formatters";
import { debounce } from "@/services/httpClient";
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
  const [companyName, setCompanyName] = useState<string>("");

  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL, language } = useRTL();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const rtlStyle = isRTL ? { flexDirection: "row-reverse" as const } : {};
  const rtlTextAlign = isRTL ? { textAlign: "right" as const } : {};

  useEffect(() => {
    async function loadCompanyName() {
      if (!user) return;
      const storedName = await AsyncStorage.getItem(`@maica_business_name_${user.id}`);
      setCompanyName(storedName || user.name || "");
    }
    loadCompanyName();
  }, [user]);

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

    try {
      const sales = await getSales(user.id);
      const expenses = await getExpenses(user.id);

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
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }

  const debouncedLoad = useCallback(
    debounce(() => loadData(), 300),
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      debouncedLoad();
    }, [user])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const displayName = companyName || user?.name || t("dashboard.yourBusiness") || "Your Business";

  const periodLabels = {
    day: t("dashboard.today") || "Today",
    week: t("dashboard.week") || "Week",
    month: t("dashboard.month") || "Month",
  };

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <ThemedText style={[styles.greeting, { color: theme.text }, rtlTextAlign]}>
          {t("dashboard.welcome") || "Welcome"}, {displayName}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }, rtlTextAlign]}>
          {t("dashboard.todaySummary") || "Today's Summary"}
        </ThemedText>
      </View>

      <View style={[styles.periodSelector, rtlStyle]}>
        {(["day", "week", "month"] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.periodButton,
              {
                backgroundColor: period === p ? theme.accent : theme.surface,
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
              {periodLabels[p]}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedView
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={[styles.summaryRow, rtlStyle]}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              {t("dashboard.sales") || "Sales"}
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
              {t("dashboard.expenses") || "Expenses"}
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
              {t("dashboard.net") || "Net"}
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
        <ThemedText style={[styles.sectionTitle, { color: theme.text }, rtlTextAlign]}>
          {t("dashboard.quickActions") || "Quick Actions"}
        </ThemedText>
        <View style={[styles.actionsGrid, rtlStyle]}>
          <Pressable
            onPress={() => navigation.navigate("AddSale")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="shopping-cart" size={32} color={theme.accent} />
            <ThemedText style={[styles.actionLabel, { color: theme.text }]}>
              {t("dashboard.addSale") || "Add Sale"}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("AddExpense")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="credit-card" size={32} color={theme.accent} />
            <ThemedText style={[styles.actionLabel, { color: theme.text }]}>
              {t("dashboard.addExpense") || "Add Expense"}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("AddProduct")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="package" size={32} color={theme.accent} />
            <ThemedText style={[styles.actionLabel, { color: theme.text }]}>
              {t("dashboard.addProduct") || "Add Product"}
            </ThemedText>
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
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
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
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
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
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  actionsContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
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
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
