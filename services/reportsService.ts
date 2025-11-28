import { api } from "./httpClient";
import * as WebBrowser from "expo-web-browser";

export type ReportType = "monthly" | "quarterly" | "yearly" | "investor-summary";

interface ReportResponse {
  ok: boolean;
  url?: string;
  reportType?: string;
  period?: {
    start: string;
    end: string;
  };
  error?: string;
  code?: string;
}

interface ReportHistoryItem {
  id: string;
  user_id: string;
  report_type: string;
  pdf_url: string;
  metadata: any;
  created_at: string;
}

export async function generateReport(
  reportType: ReportType,
  options: { language?: string; isRTL?: boolean } = {}
): Promise<ReportResponse> {
  const { language = "en", isRTL = false } = options;

  const response = await api.post<ReportResponse>(`/reports/${reportType}`, {
    language,
    isRTL,
  });

  if (!response.ok) {
    return {
      ok: false,
      error: response.data?.error || response.error || "Failed to generate report",
      code: response.data?.code,
    };
  }

  return {
    ok: true,
    url: response.data?.url,
    reportType: response.data?.reportType,
    period: response.data?.period,
  };
}

export async function downloadReport(
  reportType: ReportType,
  options: { language?: string; isRTL?: boolean } = {}
): Promise<{ success: boolean; error?: string; code?: string }> {
  const result = await generateReport(reportType, options);

  if (!result.ok || !result.url) {
    return {
      success: false,
      error: result.error,
      code: result.code,
    };
  }

  try {
    await WebBrowser.openBrowserAsync(result.url);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to open PDF",
    };
  }
}

export async function getReportHistory(
  limit: number = 10
): Promise<{ reports: ReportHistoryItem[]; error?: string }> {
  const response = await api.get<{ reports: ReportHistoryItem[] }>(
    `/reports/history?limit=${limit}`
  );

  if (!response.ok) {
    return {
      reports: [],
      error: response.error || "Failed to fetch report history",
    };
  }

  return { reports: response.data?.reports || [] };
}

export function formatReportType(type: ReportType): string {
  const typeNames: Record<ReportType, string> = {
    monthly: "Monthly Report",
    quarterly: "Quarterly Report",
    yearly: "Annual Report",
    "investor-summary": "Investor Summary",
  };
  return typeNames[type] || type;
}
