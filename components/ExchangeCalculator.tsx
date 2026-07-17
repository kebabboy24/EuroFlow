"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CurrencySelect, {
  type CurrencyOption,
} from "@/components/CurrencySelect";

const currencies: CurrencyOption[] = [
  { code: "RUB", name: "Российский рубль" },
  { code: "UAH", name: "Украинская гривна" },
  { code: "KZT", name: "Казахстанский тенге" },
  { code: "GEL", name: "Грузинский лари" },
  { code: "TRY", name: "Турецкая лира" },
  { code: "USD", name: "Доллар США" },
  { code: "GBP", name: "Британский фунт" },
  { code: "CHF", name: "Швейцарский франк" },
  { code: "PLN", name: "Польский злотый" },
  { code: "CZK", name: "Чешская крона" },
  { code: "HUF", name: "Венгерский форинт" },
  { code: "USDT", name: "Tether" },
];

const euroOption: CurrencyOption[] = [{ code: "EUR", name: "Евро" }];

type RateResponse = {
  rate: number;
  finalRate: number;
  receiveAmount: number;
  source: "binance_p2p" | "bybit_p2p" | "manual_fallback";
  sampledAds: number;
};

const sourceLabel: Record<RateResponse["source"], string> = {
  binance_p2p: "P2P market",
  bybit_p2p: "Bybit P2P",
  manual_fallback: "Manual rate",
};

export default function ExchangeCalculator() {
  const router = useRouter();
  const [currency, setCurrency] = useState("RUB");
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState<RateResponse | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateError, setRateError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingRate(true);
      setRateError("");

      try {
        const params = new URLSearchParams({
          from: currency,
          to: "EUR",
          amount: String(amount || 0),
          direction: "buy_eur",
        });
        const response = await fetch(`/api/rates?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Не удалось обновить курс.");
        }

        setRate(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          setRateError(error instanceof Error ? error.message : "Курс недоступен.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingRate(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [amount, currency]);

  const result = rate?.receiveAmount || 0;
  const quickValues =
    currency === "RUB"
      ? [25000, 50000, 100000, 250000]
      : currency === "KZT" || currency === "HUF"
        ? [50000, 100000, 250000, 500000]
        : [100, 500, 1000, 5000];

  return (
    <section className="exchange-panel">
      <div className="exchange-head">
        <div>
          <small>Новый обмен</small>
          <h2>Создать обмен</h2>
        </div>
        <span>{loadingRate ? "Обновляем курс" : "Курс EuroFlow"}</span>
      </div>

      <div className="exchange-field">
        <label>Откуда отправляете</label>

        <div className="currency-money-row">
          <CurrencySelect
            value={currency}
            options={currencies}
            onChange={setCurrency}
          />

          <div className="amount-input-wrap">
            <input
              type="number"
              value={amount}
              min="0"
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
              aria-label="Сумма отправления"
            />
            <span>{currency}</span>
          </div>
        </div>

        <div className="quick-values">
          {quickValues.map((value) => (
            <button
              type="button"
              key={value}
              className={amount === value ? "active" : ""}
              onClick={() => setAmount(value)}
            >
              {value.toLocaleString("ru-RU")}
            </button>
          ))}
        </div>
      </div>

      <div className="swap">⇅</div>

      <div className="exchange-field">
        <label>Куда получить</label>

        <div className="currency-money-row">
          <CurrencySelect
            value="EUR"
            options={euroOption}
            onChange={() => undefined}
            disabled
          />

          <div className="amount-input-wrap">
            <input
              value={loadingRate ? "..." : result.toFixed(2)}
              readOnly
              aria-label="Сумма получения"
            />
            <span>EUR</span>
          </div>
        </div>
      </div>

      <div className="summary">
        <div>
          <span>Курс EuroFlow</span>
          <b>
            1 {currency} = {rate ? rate.rate.toFixed(6) : "..."} EUR
          </b>
        </div>
        <div>
          <span>Источник</span>
          <b>{rate ? sourceLabel[rate.source] : "..."}</b>
        </div>
      </div>

      {rateError && <div className="error">{rateError}</div>}

      <button
        className="btn btn-primary submit"
        disabled={!rate || loadingRate}
        onClick={() =>
          router.push(
            `/exchange?currency=${currency}&amount=${amount}&receive=${result.toFixed(2)}`
          )
        }
      >
        Продолжить →
      </button>

      <p className="secure">
        Выберите сумму, затем продолжите оформление обмена по шагам.
      </p>
    </section>
  );
}
