import { rateConfig, isSupportedCurrency } from "@/lib/rates/config";
import {
  fetchBinanceP2P,
  fetchBybitP2P,
  type P2PAd,
  type P2PTradeType,
} from "@/lib/rates/providers";

export type RateDirection = "buy_eur" | "sell_eur";

export type RateResult = {
  from: string;
  to: string;
  amount: number;
  direction: RateDirection;
  rate: number;
  receiveAmount: number;
  marginPercent: number;
  source: "binance_p2p" | "bybit_p2p" | "manual_fallback";
  baseRate: number;
  baseUnit: "fiat_per_eur" | "eur_per_unit";
  sampledAds: number;
  providerErrors: string[];
  updatedAt: string;
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeCompletionRate(value?: number) {
  if (!value) return undefined;
  return value > 1 ? value / 100 : value;
}

function filteredAds(ads: P2PAd[], amount: number, fallbackFiatPerAsset: number) {
  const cfg = rateConfig.p2p.RUB;
  const prices = ads.map((ad) => ad.price).filter((price) => price > 0);
  const marketMedian = prices.length ? median(prices) : fallbackFiatPerAsset;
  const minPrice = fallbackFiatPerAsset * 0.65;
  const maxPrice = fallbackFiatPerAsset * 1.45;
  const requiredLimit = Math.max(amount || 0, cfg.minFiatLimit);

  return ads.filter((ad) => {
    const completionRate = normalizeCompletionRate(ad.completionRate);
    const farFromMedian =
      Math.abs(ad.price - marketMedian) / marketMedian > cfg.maxMedianDeviation;

    if (!Number.isFinite(ad.price) || ad.price <= 0) return false;
    if (ad.price < minPrice || ad.price > maxPrice) return false;
    if (farFromMedian) return false;
    if (ad.minLimit && amount && ad.minLimit > amount) return false;
    if (ad.maxLimit && ad.maxLimit < requiredLimit) return false;
    if (completionRate !== undefined && completionRate < cfg.minCompletionRate) {
      return false;
    }
    if (ad.orderCount !== undefined && ad.orderCount < cfg.minOrders) return false;

    return true;
  });
}

function pickSample(ads: P2PAd[], tradeType: P2PTradeType) {
  const cfg = rateConfig.p2p.RUB;
  const sorted = [...ads].sort((a, b) =>
    tradeType === "SELL" ? a.price - b.price : b.price - a.price
  );
  const sample = sorted.slice(cfg.sampleStartIndex, cfg.sampleEndIndex + 1);
  return sample.length ? sample : sorted.slice(0, 3);
}

function clientRateFromFiatPerEur(
  fiatPerEur: number,
  direction: RateDirection,
  margin: number
) {
  if (direction === "buy_eur") {
    return 1 / (fiatPerEur * (1 + margin));
  }

  return fiatPerEur * (1 - margin);
}

async function p2pRubRate(amount: number, direction: RateDirection) {
  const cfg = rateConfig.p2p.RUB;
  const tradeType: P2PTradeType = direction === "buy_eur" ? "SELL" : "BUY";
  const providerErrors: string[] = [];

  for (const provider of [fetchBinanceP2P, fetchBybitP2P]) {
    try {
      const ads = await provider({
        asset: cfg.asset,
        fiat: cfg.fiat,
        tradeType,
        rows: cfg.rows,
        amount,
      });
      const fallbackFiatPerAsset = cfg.fallbackFiatPerEur * cfg.assetToEurRate;
      const cleanAds = filteredAds(ads, amount, fallbackFiatPerAsset);
      const sample = pickSample(cleanAds, tradeType);

      if (sample.length) {
        const prices = sample.map((ad) => ad.price);
        const fiatPerAsset = prices.length === 3 ? median(prices) : average(prices);
        return {
          fiatPerEur: fiatPerAsset / cfg.assetToEurRate,
          sampledAds: sample.length,
          source: provider === fetchBinanceP2P ? "binance_p2p" : "bybit_p2p",
          providerErrors,
        } as const;
      }

      providerErrors.push(`${provider.name}: no quality ads after filters`);
    } catch (error) {
      providerErrors.push(
        `${provider.name}: ${error instanceof Error ? error.message : "failed"}`
      );
    }
  }

  return {
    fiatPerEur: cfg.fallbackFiatPerEur,
    sampledAds: 0,
    source: "manual_fallback" as const,
    providerErrors,
  };
}

export async function calculateRate({
  from,
  to,
  amount,
  direction,
}: {
  from: string;
  to: string;
  amount: number;
  direction?: RateDirection;
}): Promise<RateResult> {
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const resolvedDirection: RateDirection =
    direction || (normalizedFrom === "EUR" ? "sell_eur" : "buy_eur");
  const margin = rateConfig.margin;

  if (normalizedFrom === "RUB" && normalizedTo === "EUR") {
    const p2p = await p2pRubRate(safeAmount, "buy_eur");
    const rate = clientRateFromFiatPerEur(p2p.fiatPerEur, "buy_eur", margin);

    return {
      from: normalizedFrom,
      to: normalizedTo,
      amount: safeAmount,
      direction: "buy_eur",
      rate,
      receiveAmount: safeAmount * rate,
      marginPercent: margin * 100,
      source: p2p.source,
      baseRate: p2p.fiatPerEur,
      baseUnit: "fiat_per_eur",
      sampledAds: p2p.sampledAds,
      providerErrors: p2p.providerErrors,
      updatedAt: new Date().toISOString(),
    };
  }

  if (normalizedFrom === "EUR" && normalizedTo === "RUB") {
    const p2p = await p2pRubRate(safeAmount, "sell_eur");
    const rate = clientRateFromFiatPerEur(p2p.fiatPerEur, "sell_eur", margin);

    return {
      from: normalizedFrom,
      to: normalizedTo,
      amount: safeAmount,
      direction: "sell_eur",
      rate,
      receiveAmount: safeAmount * rate,
      marginPercent: margin * 100,
      source: p2p.source,
      baseRate: p2p.fiatPerEur,
      baseUnit: "fiat_per_eur",
      sampledAds: p2p.sampledAds,
      providerErrors: p2p.providerErrors,
      updatedAt: new Date().toISOString(),
    };
  }

  if (normalizedTo !== "EUR" || !isSupportedCurrency(normalizedFrom)) {
    throw new Error(`Unsupported rate pair: ${normalizedFrom}/${normalizedTo}`);
  }

  const baseRate = rateConfig.manualRatesToEur[normalizedFrom];
  const rate = baseRate / (1 + margin);

  return {
    from: normalizedFrom,
    to: normalizedTo,
    amount: safeAmount,
    direction: resolvedDirection,
    rate,
    receiveAmount: safeAmount * rate,
    marginPercent: margin * 100,
    source: "manual_fallback",
    baseRate,
    baseUnit: "eur_per_unit",
    sampledAds: 0,
    providerErrors: [],
    updatedAt: new Date().toISOString(),
  };
}
