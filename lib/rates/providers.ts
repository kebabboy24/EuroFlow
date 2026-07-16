export type P2PTradeType = "BUY" | "SELL";

export type P2PAd = {
  source: "binance" | "bybit";
  price: number;
  minLimit?: number;
  maxLimit?: number;
  completionRate?: number;
  orderCount?: number;
};

type P2PProviderParams = {
  asset: string;
  fiat: string;
  tradeType: P2PTradeType;
  rows: number;
  amount?: number;
};

function numeric(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function fetchJson(url: string, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`P2P provider responded with ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBinanceP2P({
  asset,
  fiat,
  tradeType,
  rows,
}: P2PProviderParams): Promise<P2PAd[]> {
  const json = await fetchJson(
    "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
    {
      page: 1,
      rows,
      asset,
      fiat,
      tradeType,
      payTypes: [],
      publisherType: null,
    }
  );

  const rowsData = Array.isArray(json?.data) ? json.data : [];
  return rowsData
    .map((item: Record<string, any>) => {
      const adv = item.adv || {};
      const advertiser = item.advertiser || {};
      const price = numeric(adv.price);
      if (!price) return null;

      return {
        source: "binance" as const,
        price,
        minLimit: numeric(adv.minSingleTransAmount),
        maxLimit: numeric(
          adv.dynamicMaxSingleTransAmount || adv.maxSingleTransAmount
        ),
        completionRate: numeric(
          advertiser.monthFinishRate || advertiser.finishRate
        ),
        orderCount: numeric(
          advertiser.monthOrderCount || advertiser.orderCount
        ),
      };
    })
    .filter(Boolean) as P2PAd[];
}

export async function fetchBybitP2P({
  asset,
  fiat,
  tradeType,
  rows,
  amount,
}: P2PProviderParams): Promise<P2PAd[]> {
  const side = tradeType === "SELL" ? "1" : "0";
  const json = await fetchJson("https://api2.bybit.com/fiat/otc/item/online", {
    userId: "",
    tokenId: asset,
    currencyId: fiat,
    payment: [],
    side,
    size: String(rows),
    page: "1",
    amount: amount ? String(amount) : "",
  });

  const items = json?.result?.items || json?.result?.list || json?.items || [];
  const rowsData = Array.isArray(items) ? items : [];

  return rowsData
    .map((item: Record<string, any>) => {
      const price = numeric(item.price);
      if (!price) return null;

      return {
        source: "bybit" as const,
        price,
        minLimit: numeric(item.minAmount || item.minLimit),
        maxLimit: numeric(item.maxAmount || item.maxLimit),
        completionRate: numeric(
          item.recentExecuteRate || item.completionRate || item.finishRate
        ),
        orderCount: numeric(item.recentOrderNum || item.orderNum || item.orders),
      };
    })
    .filter(Boolean) as P2PAd[];
}
