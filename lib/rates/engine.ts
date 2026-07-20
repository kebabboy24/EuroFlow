import {
  rateConfig,
  isP2PLocalCurrency,
  isSupportedCurrency,
  type P2PLocalCurrency,
} from "@/lib/rates/config";
import { applyHiddenMargin, calculateEstimatedProfit } from "@/lib/rates/margin";
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
  finalRate: number;
  receiveAmount: number;
  baseRate: number;
  baseReceiveAmount: number;
  marginPercent: number;
  estimatedProfit: number;
  source: "binance_p2p" | "bybit_p2p" | "manual_fallback";
  sampledAds: number;
  providerErrors: string[];
  updatedAt: string;
};

type P2PConfig = (typeof rateConfig.p2p)[P2PLocalCurrency];

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

function filteredAds(
  ads: P2PAd[],
  amount: number,
  fallbackFiatPerAsset: number,
  cfg: P2PConfig
) {
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

function pickSample(ads: P2PAd[], tradeType: P2PTradeType, cfg: P2PConfig) {
  const sorted = [...ads].sort((a, b) =>
    tradeType === "SELL" ? a.price - b.price : b.price - a.price
  );
  const sample = sorted.slice(cfg.sampleStartIndex, cfg.sampleEndIndex + 1);
  return sample.length ? sample : sorted.slice(0, 3);
}

function convertEurAmountToTarget(eurAmount: number, target: string) {
  if (target === "EUR") return eurAmount;
  if (!isSupportedCurrency(target)) {
    throw new Error(`Unsupported receive currency: ${target}`);
  }

  return eurAmount / rateConfig.manualRatesToEur[target];
}

function isRateCurrency(value: string) {
  return value === "EUR" || isSupportedCurrency(value);
}

function manualBaseRate(from: string, to: string) {
  if (!isRateCurrency(from) || !isRateCurrency(to)) {
    throw new Error(`Unsupported rate pair: ${from}/${to}`);
  }

  if (from === to) return 1;
  if (isSupportedCurrency(from) && to === "EUR") return rateConfig.manualRatesToEur[from];
  if (from === "EUR" && isSupportedCurrency(to)) return 1 / rateConfig.manualRatesToEur[to];
  if (isSupportedCurrency(from) && isSupportedCurrency(to)) {
    return rateConfig.manualRatesToEur[from] / rateConfig.manualRatesToEur[to];
  }

  throw new Error(`Unsupported rate pair: ${from}/${to}`);
}

function buildRateResult({
  from,
  to,
  amount,
  direction,
  baseRate,
  source,
  sampledAds,
  providerErrors,
}: {
  from: string;
  to: string;
  amount: number;
  direction: RateDirection;
  baseRate: number;
  source: RateResult["source"];
  sampledAds: number;
  providerErrors: string[];
}): RateResult {
  const marginPercent = rateConfig.margin * 100;
  const finalRate = applyHiddenMargin(baseRate, direction, marginPercent);
  const { baseReceiveAmount, finalReceiveAmount, estimatedProfit } =
    calculateEstimatedProfit(amount, baseRate, finalRate);

  return {
    from,
    to,
    amount,
    direction,
    rate: finalRate,
    finalRate,
    receiveAmount: finalReceiveAmount,
    baseRate,
    baseReceiveAmount,
    marginPercent,
    estimatedProfit,
    source,
    sampledAds,
    providerErrors,
    updatedAt: new Date().toISOString(),
  };
}

async function p2pLocalRate(
  currency: P2PLocalCurrency,
  amount: number,
  direction: RateDirection
) {
  const cfg = rateConfig.p2p[currency];
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
      const cleanAds = filteredAds(ads, amount, fallbackFiatPerAsset, cfg);
      const sample = pickSample(cleanAds, tradeType, cfg);

      if (sample.length) {
        const prices = sample.map((ad) => ad.price);
        const fiatPerAsset = prices.length === 3 ? median(prices) : average(prices);
        return {
          fiatPerAsset,
          assetToEurRate: cfg.assetToEurRate,
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
    fiatPerAsset: cfg.fallbackFiatPerEur * cfg.assetToEurRate,
    assetToEurRate: cfg.assetToEurRate,
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

  if (isP2PLocalCurrency(normalizedFrom)) {
    const p2p = await p2pLocalRate(normalizedFrom, safeAmount, "buy_eur");
    const eurPerLocalCurrency = p2p.assetToEurRate / p2p.fiatPerAsset;
    const baseRate =
      normalizedTo === "EUR"
        ? eurPerLocalCurrency
        : convertEurAmountToTarget(eurPerLocalCurrency, normalizedTo);

    return buildRateResult({
      from: normalizedFrom,
      to: normalizedTo,
      amount: safeAmount,
      direction: "buy_eur",
      baseRate,
      source: p2p.source,
      sampledAds: p2p.sampledAds,
      providerErrors: p2p.providerErrors,
    });
  }

  if (normalizedFrom === "EUR" && normalizedTo === "RUB") {
    const p2p = await p2pLocalRate("RUB", safeAmount, "sell_eur");

    return buildRateResult({
      from: normalizedFrom,
      to: normalizedTo,
      amount: safeAmount,
      direction: "sell_eur",
      baseRate: p2p.fiatPerAsset / p2p.assetToEurRate,
      source: p2p.source,
      sampledAds: p2p.sampledAds,
      providerErrors: p2p.providerErrors,
    });
  }

  if (!isRateCurrency(normalizedFrom) || !isRateCurrency(normalizedTo)) {
    throw new Error(`Unsupported rate pair: ${normalizedFrom}/${normalizedTo}`);
  }

  return buildRateResult({
    from: normalizedFrom,
    to: normalizedTo,
    amount: safeAmount,
    direction: resolvedDirection,
    baseRate: manualBaseRate(normalizedFrom, normalizedTo),
    source: "manual_fallback",
    sampledAds: 0,
    providerErrors: [],
  });
}
