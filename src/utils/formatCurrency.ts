export function formatCurrencyNumber(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export function formatNaira(value: number | string | null | undefined): string {
  return `₦${formatCurrencyNumber(value)}`;
}

export default formatCurrencyNumber;
