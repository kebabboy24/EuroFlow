"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type OperatorOrder = {
  id: string;
  status: string | null;
  created_at: string;
  full_name: string | null;
  email: string | null;
  telegram: string | null;
  send_amount: number;
  send_currency: string;
  receive_amount: number;
  receive_currency: string;
  send_bank?: string | null;
  send_method?: string | null;
  receive_bank?: string | null;
  receive_method?: string | null;
  payout_details?: string | null;
  payment_reference?: string | null;
};

type RequisitesForm = {
  method: string;
  bankName: string;
  recipientName: string;
  cardNumber: string;
  phoneNumber: string;
  iban: string;
  walletAddress: string;
  comment: string;
  expiresAt: string;
};

const emptyForm: RequisitesForm = {
  method: "",
  bankName: "",
  recipientName: "",
  cardNumber: "",
  phoneNumber: "",
  iban: "",
  walletAddress: "",
  comment: "",
  expiresAt: "",
};

function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: currency === "USDT" ? 4 : 2,
  })} ${currency}`;
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    awaiting_requisites: "Ждёт реквизиты",
    awaiting_payment: "Реквизиты отправлены",
    paid: "Клиент оплатил",
    processing: "В обработке",
  };
  return labels[String(status || "")] || "Новый";
}

function methodLabel(order: OperatorOrder) {
  return order.send_bank || order.send_method || "Не указан";
}

function receiveLabel(order: OperatorOrder) {
  return order.receive_bank || order.receive_method || "Не указан";
}

export default function OperatorOrdersPanel() {
  const [secret, setSecret] = useState("");
  const [orders, setOrders] = useState<OperatorOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<RequisitesForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) || orders[0],
    [orders, selectedId]
  );

  useEffect(() => {
    const saved = window.sessionStorage.getItem("euroflow_operator_secret") || "";
    if (saved) setSecret(saved);
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    setSelectedId(selectedOrder.id);
    setForm((current) => ({
      ...current,
      method: current.method || methodLabel(selectedOrder),
      bankName: current.bankName || methodLabel(selectedOrder),
      comment: current.comment || selectedOrder.payment_reference || `EF-${selectedOrder.id.slice(0, 8)}`,
    }));
  }, [selectedOrder]);

  async function loadOrders(nextSecret = secret) {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/operator/orders", {
        headers: { "x-operator-api-secret": nextSecret },
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Не удалось загрузить обмены.");
      setOrders(result.orders || []);
      window.sessionStorage.setItem("euroflow_operator_secret", nextSecret);
      setMessage("Обмены обновлены.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить обмены.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRequisites(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder) return;

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(`/api/operator/orders/${selectedOrder.id}/requisites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-api-secret": secret,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Не удалось отправить реквизиты.");
      setMessage("Реквизиты отправлены клиенту.");
      setForm(emptyForm);
      await loadOrders(secret);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось отправить реквизиты.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(key: keyof RequisitesForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="operator-grid">
      <section className="dashboard-card operator-secret-card">
        <h2>Доступ оператора</h2>
        <p>Введите `OPERATOR_API_SECRET` из Vercel. Он не сохраняется в коде и используется только в этой вкладке.</p>
        <div className="operator-secret-row">
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="OPERATOR_API_SECRET"
          />
          <button className="btn btn-primary" type="button" onClick={() => loadOrders()} disabled={!secret || loading}>
            {loading ? "Загружаем…" : "Загрузить"}
          </button>
        </div>
        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </section>

      <section className="dashboard-card operator-orders-card">
        <div className="card-heading">
          <div>
            <span className="dashboard-kicker">Очередь</span>
            <h2>Активные обмены</h2>
          </div>
          <button className="btn" type="button" onClick={() => loadOrders()} disabled={!secret || loading}>Обновить</button>
        </div>

        {!orders.length ? (
          <div className="empty-state compact-empty">
            <h3>Пока нет обменов</h3>
            <p>После загрузки здесь появятся обмены, которые ждут реквизиты или оплату.</p>
          </div>
        ) : (
          <div className="operator-order-list">
            {orders.map((order) => (
              <button
                type="button"
                key={order.id}
                className={order.id === selectedOrder?.id ? "operator-order active" : "operator-order"}
                onClick={() => {
                  setSelectedId(order.id);
                  setForm({
                    ...emptyForm,
                    method: methodLabel(order),
                    bankName: methodLabel(order),
                    comment: order.payment_reference || `EF-${order.id.slice(0, 8)}`,
                  });
                }}
              >
                <span>
                  <strong>#EF-{order.id.slice(0, 8).toUpperCase()}</strong>
                  <small>{statusLabel(order.status)}</small>
                </span>
                <b>{formatMoney(order.send_amount, order.send_currency)}</b>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-card operator-form-card">
        {selectedOrder ? (
          <>
            <div className="operator-selected-summary">
              <span className="status-pill status-waiting">{statusLabel(selectedOrder.status)}</span>
              <h2>#EF-{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              <div className="operator-summary-grid">
                <div><span>Клиент</span><strong>{selectedOrder.full_name || "—"}</strong></div>
                <div><span>Telegram</span><strong>{selectedOrder.telegram || "—"}</strong></div>
                <div><span>Отдаёт</span><strong>{formatMoney(selectedOrder.send_amount, selectedOrder.send_currency)}</strong></div>
                <div><span>Получает</span><strong>{formatMoney(selectedOrder.receive_amount, selectedOrder.receive_currency)}</strong></div>
                <div><span>Оплата клиента</span><strong>{methodLabel(selectedOrder)}</strong></div>
                <div><span>Получение</span><strong>{receiveLabel(selectedOrder)}</strong></div>
                <div className="wide"><span>Реквизиты получения клиента</span><strong>{selectedOrder.payout_details || "—"}</strong></div>
              </div>
            </div>

            <form className="operator-requisites-form" onSubmit={saveRequisites}>
              <label>Способ оплаты<input value={form.method} onChange={(event) => updateField("method", event.target.value)} placeholder="card / SBP / IBAN" /></label>
              <label>Банк<input value={form.bankName} onChange={(event) => updateField("bankName", event.target.value)} placeholder="Сбербанк" /></label>
              <label>Получатель<input value={form.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} placeholder="Имя получателя" /></label>
              <label>Номер карты<input value={form.cardNumber} onChange={(event) => updateField("cardNumber", event.target.value)} placeholder="Только если нужно" /></label>
              <label>Телефон<input value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} placeholder="Для СБП, если нужно" /></label>
              <label>IBAN<input value={form.iban} onChange={(event) => updateField("iban", event.target.value)} placeholder="Если оплата на IBAN" /></label>
              <label>Кошелёк<input value={form.walletAddress} onChange={(event) => updateField("walletAddress", event.target.value)} placeholder="USDT / crypto wallet" /></label>
              <label>Комментарий<input value={form.comment} onChange={(event) => updateField("comment", event.target.value)} placeholder="Комментарий к переводу" /></label>
              <label>Действует до<input value={form.expiresAt} onChange={(event) => updateField("expiresAt", event.target.value)} placeholder="Например: сегодня до 18:00" /></label>

              <div className="security-warning wide">
                Не вводите CVV, PIN, пароли банка и SMS-коды. Только реквизиты для оплаты клиентом.
              </div>

              <button className="btn btn-primary wide" disabled={saving || !secret}>
                {saving ? "Отправляем…" : "Отправить реквизиты клиенту"}
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state compact-empty">
            <h3>Выберите обмен</h3>
            <p>Загрузите очередь и выберите обмен, чтобы отправить реквизиты клиенту.</p>
          </div>
        )}
      </section>
    </div>
  );
}
