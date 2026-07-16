"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderForm({ initialCurrency, initialAmount, userEmail }:
  { initialCurrency:string; initialAmount:string; userEmail:string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
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
      <input name="full_name" placeholder="Имя и фамилия" required/>
      <input name="email" type="email" defaultValue={userEmail} required/>
      <input name="telegram" placeholder="Telegram: @username" required/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 150px",gap:10}}>
        <input name="send_amount" type="number" min="1" defaultValue={initialAmount} required/>
        <select name="send_currency" defaultValue={initialCurrency}>
          <option>RUB</option><option>UAH</option><option>KZT</option><option>GEL</option><option>USDT</option>
        </select>
      </div>
      <input name="receive_amount" type="number" min="1" step="0.01" placeholder="Ожидаемая сумма в EUR" required/>
      <input name="bank_name" placeholder="Банк получателя" required/>
      <input name="iban" placeholder="IBAN или реквизиты получения" required/>
      <textarea name="comment" placeholder="Комментарий" rows={4}/>
      {error && <div className="error">{error}</div>}
      <button className="btn btn-primary" disabled={loading}>{loading ? "Отправляем…" : "Отправить заявку"}</button>
      <p className="small">Не вводите PIN, CVV, пароли банка и одноразовые SMS-коды.</p>
    </form>
  );
}
