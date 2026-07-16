"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const rates: Record<string, number> = {
  RUB: 0.01007, UAH: 0.0215, KZT: 0.00182, GEL: 0.319, USDT: 0.912
};

export default function ExchangeCalculator() {
  const router = useRouter();
  const [currency, setCurrency] = useState("RUB");
  const [amount, setAmount] = useState(100000);
  const result = useMemo(() => amount * rates[currency] * 0.988, [amount, currency]);

  return (
    <section className="exchange-panel">
      <div className="exchange-head">
        <div><small>Калькулятор</small><h2>Рассчитайте обмен</h2></div>
        <span>↻ Live rate</span>
      </div>

      <div className="exchange-field">
        <label>Вы отправляете</label>
        <div className="money-row">
          <select value={currency} onChange={e => setCurrency(e.target.value)}>
            {Object.keys(rates).map(code => <option key={code}>{code}</option>)}
          </select>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}/>
        </div>
        <div className="quick-values">
          {[25000,50000,100000,250000].map(v => (
            <button key={v} className={amount === v ? "active" : ""} onClick={() => setAmount(v)}>
              {v.toLocaleString("ru-RU")}
            </button>
          ))}
        </div>
      </div>

      <div className="swap">⇅</div>

      <div className="exchange-field">
        <label>Вы получаете</label>
        <div className="money-row">
          <select disabled><option>EUR</option></select>
          <input value={result.toFixed(2)} readOnly />
        </div>
      </div>

      <div className="summary">
        <div><span>Курс</span><b>1 {currency} = {rates[currency]} EUR</b></div>
        <div><span>Комиссия</span><b>1.2%</b></div>
      </div>

      <button className="btn btn-primary submit" onClick={() => router.push(`/exchange?currency=${currency}&amount=${amount}`)}>
        Создать заявку →
      </button>
      <p className="secure">Ваши данные защищены.</p>
    </section>
  );
}
