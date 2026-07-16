"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderForm({
  initialCurrency,
  initialAmount,
  initialReceive,
  userEmail,
}: {
  initialCurrency: string;
  initialAmount: string;
  initialReceive: string;
  userEmail: string;
}) {
  const [error, setError] = useState("");
  const [rateError, setRateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [sendCurrency, setSendCurrency] = useState(initialCurrency);
  const [sendAmount, setSendAmount] = useState(Number(initialAmount) || 0);
  const [receiveAmount, setReceiveAmount] = useState(initialReceive);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingRate(true);
      setRateError("");

      try {
        const params = new URLSearchParams({
          from: sendCurrency,
          to: "EUR",
          amount: String(sendAmount || 0),
          direction: "buy_eur",
        });
        const response = await fetch(`/api/rates?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Не удалось обновить курс.");
        }

        setReceiveAmount(Number(result.receiveAmount || 0).toFixed(2));
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
  }, [sendAmount, sendCurrency]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setError(result.error || "Не удалось отправить заявку.");
    router.push("/dashboard?created=1");
    router.refresh();
  }

  return (
    <form className="card form" onSubmit={submit}>
      <input name="full_name" placeholder="Имя и фамилия" required />
      <input name="email" type="email" defaultValue={userEmail} required />
      <input name="telegram" placeholder="Telegram: @username" required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 10 }}>
        <input
          name="send_amount"
          type="number"
          min="1"
          value={sendAmount}
          onChange={(event) => setSendAmount(Number(event.target.value) || 0)}
          required
        />
        <select
          name="send_currency"
          value={sendCurrency}
          onChange={(event) => setSendCurrency(event.target.value)}
        >
          <option>RUB</option>
          <option>UAH</option>
          <option>KZT</option>
          <option>GEL</option>
          <option>TRY</option>
          <option>USD</option>
          <option>GBP</option>
          <option>CHF</option>
          <option>PLN</option>
          <option>CZK</option>
          <option>HUF</option>
          <option>USDT</option>
        </select>
      </div>
      <input
        name="receive_amount"
        type="number"
        min="1"
        step="0.01"
        value={receiveAmount}
        readOnly
        aria-label="Сумма получения в EUR"
        required
      />
      <input name="bank_name" placeholder="Банк получателя" required />
      <input name="iban" placeholder="IBAN или реквизиты получения" required />
      <textarea name="comment" placeholder="Комментарий" rows={4} />
      {rateError && <div className="error">{rateError}</div>}
      {error && <div className="error">{error}</div>}
      <button className="btn btn-primary" disabled={loading || loadingRate}>
        {loading ? "Отправляем…" : loadingRate ? "Обновляем курс…" : "Отправить заявку"}
      </button>
      <p className="small">
        Курс рассчитывается на сервере. Не вводите PIN, CVV, пароли банка и одноразовые SMS-коды.
      </p>
    </form>
  );
}
