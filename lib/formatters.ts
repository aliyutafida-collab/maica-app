/**
 * Currency and number formatting utilities with thousands separators
 * No decimals - only whole numbers with thousand separators
 */

export function formatCurrency(
  amount: number | null | undefined,
  currencySymbol: string = "₦"
): string {
  if (amount == null || isNaN(amount)) return `${currencySymbol}0`;
  const num = Math.round(Number(amount));
  return `${currencySymbol}${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return Math.floor(Number(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatDecimal(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return "0." + "0".repeat(decimals);
  return Number(value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return "0%";
  return Number(value).toFixed(decimals) + "%";
}
