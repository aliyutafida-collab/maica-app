import { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation, useRTL } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { getSales, getExpenses } from "@/services/storage";
import { downloadReport, ReportType } from "@/services/reportsService";
import { formatCurrency } from "@/lib/formatters";

export default function ReportsScreen() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState<ReportType | null>(null);

  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL, language } = useRTL();
  const { theme } = useTheme();
  const { hasFeature } = useSubscription();

  const isPremium = hasFeature("advancedPdfExports");
  const rtlStyle = isRTL ? { flexDirection: "row-reverse" as const } : {};
  const rtlTextAlign = isRTL ? { textAlign: "right" as const } : {};

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

  async function handleDownloadReport(reportType: ReportType) {
    if (!isPremium) {
      Alert.alert(
        t("subscription.premiumRequired") || "Premium Required",
        t("subscription.pdfExportPremium") || "PDF exports are available for premium subscribers. Upgrade to access this feature.",
        [{ text: t("common.ok") || "OK" }]
      );
      return;
    }

    setLoading(reportType);

    try {
      const result = await downloadReport(reportType, { language, isRTL });

      if (!result.success) {
        if (result.code === "PREMIUM_REQUIRED") {
          Alert.alert(
            t("subscription.premiumRequired") || "Premium Required",
            result.error || "Please upgrade to premium to access PDF reports."
          );
        } else {
          Alert.alert(
            t("common.error") || "Error",
            result.error || "Failed to generate report"
          );
        }
      }
    } catch (error: any) {
      Alert.alert(t("common.error") || "Error", error.message || "An error occurred");
    } finally {
      setLoading(null);
    }
  }

  const netProfit = totalSales - totalExpenses;

  const reportButtons: { type: ReportType; icon: keyof typeof Feather.glyphMap; label: string }[] = [
    { type: "monthly", icon: "calendar", label: t("reports.monthlyReport") || "Monthly Report" },
    { type: "quarterly", icon: "bar-chart-2", label: t("reports.quarterlyReport") || "Quarterly Report" },
    { type: "yearly", icon: "trending-up", label: t("reports.yearlyReport") || "Annual Report" },
  ];

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }, rtlTextAlign]}>
          {t("reports.title") || "Business Reports"}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }, rtlTextAlign]}>
          {t("reports.allTimeSummary") || "All Time Summary"}
        </ThemedText>
      </View>

      <ThemedView
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={[styles.row, rtlStyle]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {t("reports.totalSales") || "Total Sales"}
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.success }]}>
            {formatCurrency(totalSales)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={[styles.row, rtlStyle]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {t("reports.taxCollected") || "Total Tax Collected"}
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.text }]}>
            {formatCurrency(totalTax)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={[styles.row, rtlStyle]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {t("reports.totalExpenses") || "Total Expenses"}
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.error }]}>
            {formatCurrency(totalExpenses)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={[styles.row, rtlStyle]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {t("reports.netProfit") || "Net Profit"}
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
        <ThemedText style={[styles.cardTitle, { color: theme.text }, rtlTextAlign]}>
          {t("reports.taxBreakdown") || "Tax Breakdown"}
        </ThemedText>
        <View style={[styles.row, rtlStyle]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {t("reports.taxRate") || "Tax Rate (Default)"}
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.text }]}>
            7.5%
          </ThemedText>
        </View>
        <View style={[styles.row, rtlStyle]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {t("reports.taxLiability") || "Total Tax Liability"}
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.text }]}>
            {formatCurrency(totalTax)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={[styles.exportHeader, rtlStyle]}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
            {t("reports.exportPdf") || "Export PDF Reports"}
          </ThemedText>
          {!isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: theme.warning }]}>
              <Feather name="lock" size={12} color="#FFFFFF" />
              <ThemedText style={styles.premiumBadgeText}>Premium</ThemedText>
            </View>
          ) : null}
        </View>

        {reportButtons.map((btn) => (
          <Pressable
            key={btn.type}
            onPress={() => handleDownloadReport(btn.type)}
            disabled={loading !== null}
            style={({ pressed }) => [
              styles.exportButton,
              rtlStyle,
              {
                backgroundColor: isPremium ? theme.accent : theme.surfaceHigh,
                opacity: pressed ? 0.8 : loading === btn.type ? 0.6 : 1,
              },
            ]}
          >
            {loading === btn.type ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather
                name={btn.icon}
                size={20}
                color={isPremium ? "#FFFFFF" : theme.textSecondary}
              />
            )}
            <ThemedText
              style={[
                styles.exportButtonText,
                { color: isPremium ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              {btn.label}
            </ThemedText>
            <Feather
              name="download"
              size={18}
              color={isPremium ? "#FFFFFF" : theme.textSecondary}
            />
          </Pressable>
        ))}

        {!isPremium ? (
          <ThemedText style={[styles.premiumHint, { color: theme.textSecondary }, rtlTextAlign]}>
            {t("reports.upgradeToPremium") || "Upgrade to Premium to export detailed PDF reports with graphs and analysis."}
          </ThemedText>
        ) : null}
      </ThemedView>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: Spacing.lg,
  },
  exportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  divider: {
    height: 1,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  exportButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  premiumHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
