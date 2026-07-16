"use client";

import { useMemo, useState } from "react";
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

const euroOption: CurrencyOption[] = [
  { code: "EUR", name: "Евро" },
];

const rates: Record<string, number> = {
  RUB: 0.01007,
  UAH: 0.0215,
  KZT: 0.00182,
  GEL: 0.319,
  TRY: 0.0275,
  USD: 0.918,
  GBP: 1.164,
  CHF: 1.043,
  PLN: 0.232,
  CZK: 0.0402,
  HUF: 0.00255,
  USDT: 0.912,
};

export default function ExchangeCalculator() {
  const router = useRouter();
  const [currency, setCurrency] = useState("RUB");
  const [amount, setAmount] = useState(100000);

  const result = useMemo(
    () => Math.max(0, amount * rates[currency] * 0.988),
    [amount, currency]
  );

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
          <small>Калькулятор</small>
          <h2>Рассчитайте обмен</h2>
        </div>
        <span>↻ Live rate</span>
      </div>

      <div className="exchange-field">
        <label>Вы отправляете</label>

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
              onChange={(event) => setAmount(Number(event.target.value))}
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
        <label>Вы получаете</label>

        <div className="currency-money-row">
          <CurrencySelect
            value="EUR"
            options={euroOption}
            onChange={() => undefined}
            disabled
          />

          <div className="amount-input-wrap">
            <input value={result.toFixed(2)} readOnly aria-label="Сумма получения" />
            <span>EUR</span>
          </div>
        </div>
      </div>

      <div className="summary">
        <div>
          <span>Курс</span>
          <b>
            1 {currency} = {rates[currency]} EUR
          </b>
        </div>
        <div>
          <span>Комиссия</span>
          <b>1.2%</b>
        </div>
      </div>

      <button
        className="btn btn-primary submit"
        onClick={() =>
          router.push(`/exchange?currency=${currency}&amount=${amount}`)
        }
      >
        Создать заявку →
      </button>

      <p className="secure">Ваши данные защищены.</p>
    </section>
  );
}
