export type SupportedCurrency =
  | "RUB"
  | "UAH"
  | "KZT"
  | "GEL"
  | "TRY"
  | "USD"
  | "GBP"
  | "CHF"
  | "PLN"
  | "CZK"
  | "HUF"
  | "USDT";

const DEFAULT_MARGIN = 0.06;
const MIN_MARGIN = 0.05;
const MAX_MARGIN = 0.07;

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function configuredMargin() {
  const raw = Number(process.env.EUROFLOW_RATE_MARGIN_PERCENT);
  const margin = Number.isFinite(raw) ? raw / 100 : DEFAULT_MARGIN;
  return Math.min(MAX_MARGIN, Math.max(MIN_MARGIN, margin));
}

export const rateConfig = {
  margin: configuredMargin(),
  manualRatesToEur: {
    RUB: 1 / numberFromEnv("EUROFLOW_RUB_PER_EUR_FALLBACK", 100),
    UAH: numberFromEnv("EUROFLOW_UAH_TO_EUR_FALLBACK", 0.0215),
    KZT: numberFromEnv("EUROFLOW_KZT_TO_EUR_FALLBACK", 0.00182),
    GEL: numberFromEnv("EUROFLOW_GEL_TO_EUR_FALLBACK", 0.319),
    TRY: numberFromEnv("EUROFLOW_TRY_TO_EUR_FALLBACK", 0.0275),
    USD: numberFromEnv("EUROFLOW_USD_TO_EUR_FALLBACK", 0.918),
    GBP: numberFromEnv("EUROFLOW_GBP_TO_EUR_FALLBACK", 1.164),
    CHF: numberFromEnv("EUROFLOW_CHF_TO_EUR_FALLBACK", 1.043),
    PLN: numberFromEnv("EUROFLOW_PLN_TO_EUR_FALLBACK", 0.232),
    CZK: numberFromEnv("EUROFLOW_CZK_TO_EUR_FALLBACK", 0.0402),
    HUF: numberFromEnv("EUROFLOW_HUF_TO_EUR_FALLBACK", 0.00255),
    USDT: numberFromEnv("EUROFLOW_USDT_TO_EUR_FALLBACK", 0.912),
  } satisfies Record<SupportedCurrency, number>,
  p2p: {
    RUB: {
      fiat: "RUB",
      asset: process.env.EUROFLOW_P2P_RUB_ASSET || "USDT",
      assetToEurRate: numberFromEnv("EUROFLOW_P2P_RUB_ASSET_TO_EUR", numberFromEnv("EUROFLOW_USDT_TO_EUR_FALLBACK", 0.912)),
      fallbackFiatPerEur: numberFromEnv("EUROFLOW_RUB_PER_EUR_FALLBACK", 100),
      minFiatLimit: numberFromEnv("EUROFLOW_P2P_MIN_RUB_LIMIT", 50000),
      minOrders: numberFromEnv("EUROFLOW_P2P_MIN_ORDERS", 20),
      minCompletionRate: numberFromEnv("EUROFLOW_P2P_MIN_COMPLETION_RATE", 0.8),
      maxMedianDeviation: numberFromEnv("EUROFLOW_P2P_MAX_MEDIAN_DEVIATION", 0.18),
      sampleStartIndex: 4,
      sampleEndIndex: 6,
      rows: 20,
    },
  },
};

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return value in rateConfig.manualRatesToEur;
}
