import { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation, useRTL } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/formatters";
import { api } from "@/services/httpClient";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TaxResult {
  summary: {
    revenue: number;
    expenses: number;
    salaries: number;
    profit: number;
  };
  taxes: {
    companyIncomeTax: { tax: number; rate: number; category: string };
    vat: { vat: number; applicable: boolean; rate?: number };
    paye: { estimatedPAYE: number; note: string } | null;
    educationTax: { amount: number; rate: number; note: string };
    nitdaLevy: { amount: number; applicable: boolean; rate: number; note: string };
  };
  totalEstimatedTax: number;
  vatCollectable: number;
  disclaimer: string;
}

export default function TaxCalculatorScreen() {
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [salaries, setSalaries] = useState("");
  const [companySize, setCompanySize] = useState("auto");
  const [isVATRegistered, setIsVATRegistered] = useState(true);
  const [calculatePAYE, setCalculatePAYE] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxResult | null>(null);
  const [exporting, setExporting] = useState(false);

  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { hasFeature } = useSubscription();

  const isPremium = hasFeature("pdfExport");
  const rtlTextAlign = isRTL ? { textAlign: "right" as const } : {};
  const rtlStyle = isRTL ? { flexDirection: "row-reverse" as const } : {};

  async function handleCalculate() {
    if (!revenue) {
      Alert.alert(t("common.error") || "Error", t("tax.revenueRequired") || "Please enter your revenue");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<TaxResult>("/tax/calculate", {
        revenue: Number(revenue.replace(/,/g, "")) || 0,
        expenses: Number(expenses.replace(/,/g, "")) || 0,
        salaries: Number(salaries.replace(/,/g, "")) || 0,
        companySize,
        isVATRegistered,
        calculatePAYE,
      });

      if (response.ok && response.data) {
        setResult(response.data);
      } else {
        throw new Error(response.error || "Calculation failed");
      }
    } catch (error: any) {
      Alert.alert(t("common.error") || "Error", error.message || "Failed to calculate taxes");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPDF() {
    if (!isPremium) {
      Alert.alert(
        t("subscription.premiumRequired") || "Premium Required",
        t("tax.exportPremiumMessage") || "PDF export is available for Premium subscribers."
      );
      return;
    }

    setExporting(true);
    try {
      const response = await api.post<{ url: string }>("/reports/tax-summary", {
        revenue: Number(revenue.replace(/,/g, "")) || 0,
        expenses: Number(expenses.replace(/,/g, "")) || 0,
        salaries: Number(salaries.replace(/,/g, "")) || 0,
        result,
      });

      if (response.ok && response.data?.url) {
        Alert.alert(
          t("reports.success") || "Success",
          t("reports.pdfReady") || "Your tax report is ready for download."
        );
      }
    } catch (error: any) {
      Alert.alert(t("common.error") || "Error", error.message || "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }

  function formatInputNumber(value: string): string {
    const numbers = value.replace(/[^0-9]/g, "");
    return numbers ? Number(numbers).toLocaleString() : "";
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }, rtlTextAlign]}>
          {t("tax.calculator") || "Tax Calculator"}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }, rtlTextAlign]}>
          {t("tax.subtitle") || "Nigerian Tax Estimation Tool"}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextInput
          label={t("tax.annualRevenue") || "Annual Revenue (₦)"}
          value={revenue}
          onChangeText={(v) => setRevenue(formatInputNumber(v))}
          placeholder="0"
          keyboardType="numeric"
        />

        <TextInput
          label={t("tax.annualExpenses") || "Annual Expenses (₦)"}
          value={expenses}
          onChangeText={(v) => setExpenses(formatInputNumber(v))}
          placeholder="0"
          keyboardType="numeric"
        />

        <TextInput
          label={t("tax.totalSalaries") || "Total Salaries (₦)"}
          value={salaries}
          onChangeText={(v) => setSalaries(formatInputNumber(v))}
          placeholder="0"
          keyboardType="numeric"
        />

        <View style={styles.inputContainer}>
          <ThemedText style={[styles.label, { color: theme.text }, rtlTextAlign]}>
            {t("tax.companySize") || "Company Size"}
          </ThemedText>
          <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Picker
              selectedValue={companySize}
              onValueChange={setCompanySize}
              style={{ color: theme.text }}
            >
              <Picker.Item label={t("tax.autoDetect") || "Auto-detect from turnover"} value="auto" />
              <Picker.Item label={t("tax.small") || "Small (< ₦25M turnover)"} value="small" />
              <Picker.Item label={t("tax.medium") || "Medium (₦25M - ₦100M)"} value="medium" />
              <Picker.Item label={t("tax.large") || "Large (> ₦100M)"} value="large" />
            </Picker>
          </View>
        </View>

        <View style={[styles.checkboxRow, rtlStyle]}>
          <Pressable
            onPress={() => setIsVATRegistered(!isVATRegistered)}
            style={[styles.checkbox, { borderColor: theme.border, backgroundColor: isVATRegistered ? theme.accent : "transparent" }]}
          >
            {isVATRegistered ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
          </Pressable>
          <ThemedText style={[styles.checkboxLabel, { color: theme.text }]}>
            {t("tax.vatRegistered") || "VAT Registered"}
          </ThemedText>
        </View>

        <View style={[styles.checkboxRow, rtlStyle]}>
          <Pressable
            onPress={() => setCalculatePAYE(!calculatePAYE)}
            style={[styles.checkbox, { borderColor: theme.border, backgroundColor: calculatePAYE ? theme.accent : "transparent" }]}
          >
            {calculatePAYE ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
          </Pressable>
          <ThemedText style={[styles.checkboxLabel, { color: theme.text }]}>
            {t("tax.includePAYE") || "Include PAYE Estimate"}
          </ThemedText>
        </View>

        <PrimaryButton
          title={loading ? (t("common.loading") || "Calculating...") : (t("tax.calculate") || "Calculate Taxes")}
          onPress={handleCalculate}
          loading={loading}
        />
      </View>

      {result ? (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={[styles.resultTitle, { color: theme.text }, rtlTextAlign]}>
            {t("tax.results") || "Tax Estimation Results"}
          </ThemedText>

          <View style={[styles.summaryRow, rtlStyle]}>
            <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {t("tax.profit") || "Taxable Profit"}
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
              {formatCurrency(result.summary.profit)}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={[styles.taxRow, rtlStyle]}>
            <View style={styles.taxInfo}>
              <ThemedText style={[styles.taxName, { color: theme.text }, rtlTextAlign]}>
                {t("tax.companyIncomeTax") || "Company Income Tax (CIT)"}
              </ThemedText>
              <ThemedText style={[styles.taxRate, { color: theme.textSecondary }, rtlTextAlign]}>
                {result.taxes.companyIncomeTax.category === "loss" 
                  ? t("tax.noTaxOnLoss") || "No tax on loss"
                  : `${result.taxes.companyIncomeTax.rate}% (${result.taxes.companyIncomeTax.category})`}
              </ThemedText>
            </View>
            <ThemedText style={[styles.taxAmount, { color: theme.text }]}>
              {formatCurrency(result.taxes.companyIncomeTax.tax)}
            </ThemedText>
          </View>

          <View style={[styles.taxRow, rtlStyle]}>
            <View style={styles.taxInfo}>
              <ThemedText style={[styles.taxName, { color: theme.text }, rtlTextAlign]}>
                {t("tax.vatCollectable") || "VAT Collectable"}
              </ThemedText>
              <ThemedText style={[styles.taxRate, { color: theme.textSecondary }, rtlTextAlign]}>
                {result.taxes.vat.applicable ? "7.5%" : t("tax.notApplicable") || "Not applicable"}
              </ThemedText>
            </View>
            <ThemedText style={[styles.taxAmount, { color: theme.text }]}>
              {formatCurrency(result.taxes.vat.vat)}
            </ThemedText>
          </View>

          <View style={[styles.taxRow, rtlStyle]}>
            <View style={styles.taxInfo}>
              <ThemedText style={[styles.taxName, { color: theme.text }, rtlTextAlign]}>
                {t("tax.educationTax") || "Education Tax"}
              </ThemedText>
              <ThemedText style={[styles.taxRate, { color: theme.textSecondary }, rtlTextAlign]}>
                2%
              </ThemedText>
            </View>
            <ThemedText style={[styles.taxAmount, { color: theme.text }]}>
              {formatCurrency(result.taxes.educationTax.amount)}
            </ThemedText>
          </View>

          {result.taxes.nitdaLevy.applicable ? (
            <View style={[styles.taxRow, rtlStyle]}>
              <View style={styles.taxInfo}>
                <ThemedText style={[styles.taxName, { color: theme.text }, rtlTextAlign]}>
                  {t("tax.nitdaLevy") || "NITDA Levy"}
                </ThemedText>
                <ThemedText style={[styles.taxRate, { color: theme.textSecondary }, rtlTextAlign]}>
                  1%
                </ThemedText>
              </View>
              <ThemedText style={[styles.taxAmount, { color: theme.text }]}>
                {formatCurrency(result.taxes.nitdaLevy.amount)}
              </ThemedText>
            </View>
          ) : null}

          {result.taxes.paye ? (
            <View style={[styles.taxRow, rtlStyle]}>
              <View style={styles.taxInfo}>
                <ThemedText style={[styles.taxName, { color: theme.text }, rtlTextAlign]}>
                  {t("tax.payeEstimate") || "PAYE Estimate"}
                </ThemedText>
                <ThemedText style={[styles.taxRate, { color: theme.textSecondary }, rtlTextAlign]}>
                  {t("tax.payeNote") || "Based on total salaries"}
                </ThemedText>
              </View>
              <ThemedText style={[styles.taxAmount, { color: theme.text }]}>
                {formatCurrency(result.taxes.paye.estimatedPAYE)}
              </ThemedText>
            </View>
          ) : null}

          <View style={[styles.totalDivider, { backgroundColor: theme.border }]} />

          <View style={[styles.taxRow, rtlStyle]}>
            <ThemedText style={[styles.totalLabel, { color: theme.text }]}>
              {t("tax.totalEstimated") || "Total Estimated Tax"}
            </ThemedText>
            <ThemedText style={[styles.totalAmount, { color: theme.primary }]}>
              {formatCurrency(result.totalEstimatedTax)}
            </ThemedText>
          </View>

          <View style={[styles.disclaimerBox, { backgroundColor: theme.backgroundRoot }]}>
            <Feather name="alert-circle" size={16} color={Colors.warning} />
            <ThemedText style={[styles.disclaimerText, { color: theme.textSecondary }]}>
              {result.disclaimer}
            </ThemedText>
          </View>

          <View style={styles.exportButtons}>
            <Pressable
              onPress={handleExportPDF}
              disabled={exporting}
              style={({ pressed }) => [
                styles.exportButton,
                { backgroundColor: isPremium ? theme.accent : theme.border, opacity: pressed || exporting ? 0.7 : 1 },
              ]}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="download" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.exportButtonText}>
                    {t("tax.exportPDF") || "Export PDF"}
                  </ThemedText>
                  {!isPremium ? (
                    <Feather name="lock" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  ) : null}
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.infoSection}>
        <ThemedText style={[styles.infoTitle, { color: theme.text }, rtlTextAlign]}>
          {t("tax.taxRatesTitle") || "Nigerian Tax Rates (2024)"}
        </ThemedText>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={[styles.infoCardTitle, { color: theme.text }, rtlTextAlign]}>
            {t("tax.companyIncomeTax") || "Company Income Tax (CIT)"}
          </ThemedText>
          <ThemedText style={[styles.infoCardText, { color: theme.textSecondary }, rtlTextAlign]}>
            {`\u2022 ${t("tax.smallCompany") || "Small (< ₦25M): 0%"}\n\u2022 ${t("tax.mediumCompany") || "Medium (₦25M - ₦100M): 20%"}\n\u2022 ${t("tax.largeCompany") || "Large (> ₦100M): 30%"}`}
          </ThemedText>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={[styles.infoCardTitle, { color: theme.text }, rtlTextAlign]}>
            {t("tax.vatTitle") || "Value Added Tax (VAT)"}
          </ThemedText>
          <ThemedText style={[styles.infoCardText, { color: theme.textSecondary }, rtlTextAlign]}>
            {t("tax.vatDescription") || "7.5% on taxable goods and services. Threshold: ₦25M annual turnover."}
          </ThemedText>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={[styles.infoCardTitle, { color: theme.text }, rtlTextAlign]}>
            {t("tax.pitTitle") || "Personal Income Tax (PAYE)"}
          </ThemedText>
          <ThemedText style={[styles.infoCardText, { color: theme.textSecondary }, rtlTextAlign]}>
            {t("tax.pitDescription") || "Progressive rates from 7% to 24% based on income brackets."}
          </ThemedText>
        </View>
      </View>
    </ScreenKeyboardAwareScrollView>
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
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 14,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: Spacing.md,
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  taxInfo: {
    flex: 1,
  },
  taxName: {
    fontSize: 14,
    fontWeight: "500",
  },
  taxRate: {
    fontSize: 12,
    marginTop: 2,
  },
  taxAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalDivider: {
    height: 2,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  exportButtons: {
    marginTop: Spacing.lg,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
