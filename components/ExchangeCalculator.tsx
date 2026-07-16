"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const rates: Record<string, number> = {
  RUB: 0.00945,
  UAH: 0.0208,
  KZT: 0.00178,
  GEL: 0.318,
  USDT: 0.91,
};

export default function ExchangeCalculator() {
  const router = useRouter();
  const [currency, setCurrency] = useState("RUB");
  const [amount, setAmount] = useState(100000);
  const receive = useMemo(() => Math.max(0, amount * rates[currency] * 0.988), [amount, currency]);

  return (
    <section id="exchange" className="card">
      <div className="exchange-head">
        <div>
          <div className="small">Калькулятор</div>
          <h2 style={{margin:"5px 0 0"}}>Рассчитать обмен</h2>
        </div>
        <span className="online">● Bybit online</span>
      </div>

      <div className="label">Вы отправляете</div>
      <div className="field">
        <div className="field-row">
          <input type="number" min="0" value={amount} onChange={e => setAmount(Number(e.target.value))}/>
          <select value={currency} onChange={e => setCurrency(e.target.value)}>
            {Object.keys(rates).map(code => <option key={code}>{code}</option>)}
          </select>
        </div>
      </div>

      <div style={{height:16}} />
      <div className="label">Вы получаете</div>
      <div className="field">
        <div className="field-row">
          <input value={receive.toFixed(2)} readOnly />
          <select value="EUR" disabled><option>EUR</option></select>
        </div>
      </div>

      <div className="ratebox">
        <div><span>Курс</span><b>1 {currency} = {rates[currency]} EUR</b></div>
        <div><span>Комиссия</span><b>1.2%</b></div>
        <div><span>Ориентировочно</span><b>{receive.toFixed(2)} EUR</b></div>
      </div>

      <button className="btn btn-primary" style={{width:"100%"}} onClick={() => router.push(`/exchange?currency=${currency}&amount=${amount}`)}>
        Создать заявку
      </button>
      <p className="small" style={{textAlign:"center"}}>Финальный курс фиксируется оператором при подтверждении.</p>
    </section>
  );
}
