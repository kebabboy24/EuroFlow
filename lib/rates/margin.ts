export type MarginDirection = "buy_eur" | "sell_eur";

export function applyHiddenMargin(
  baseRate: number,
  _direction: MarginDirection,
  marginPercent: number
) {
  const safeRate = Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 0;
  const safeMargin = Number.isFinite(marginPercent) ? marginPercent : 0;
  const multiplier = Math.max(0, 1 - safeMargin / 100);

  return safeRate * multiplier;
}

export function calculateEstimatedProfit(
  amount: number,
  baseRate: number,
  finalRate: number
) {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const baseReceiveAmount = safeAmount * baseRate;
  const finalReceiveAmount = safeAmount * finalRate;

  return {
    baseReceiveAmount,
    finalReceiveAmount,
    estimatedProfit: Math.max(0, baseReceiveAmount - finalReceiveAmount),
  };
}
