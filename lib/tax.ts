export const DEFAULT_TAX_RATE = 7.5;

export function calcTax(
  amount: number,
  taxRate: number,
  isInclusive: boolean = false
): number {
  if (isInclusive) {
    return (amount * taxRate) / (100 + taxRate);
  }
  return (amount * taxRate) / 100;
}

export function calcTotal(
  amount: number,
  taxRate: number,
  discount: number = 0
): number {
  const discountedAmount = amount - discount;
  const tax = calcTax(discountedAmount, taxRate, false);
  return discountedAmount + tax;
}

export function calcSubtotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}
