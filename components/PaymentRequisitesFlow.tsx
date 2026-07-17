"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type PaymentRequisites = {
  method?: string | null;
  bankName?: string | null;
  recipientName?: string | null;
  cardNumber?: string | null;
  phoneNumber?: string | null;
  iban?: string | null;
  walletAddress?: string | null;
  comment?: string | null;
  expiresAt?: string | null;
};

export type PaymentOrder = {
  id: string;
  status?: string | null;
  send_amount: number;
  send_currency: string;
  receive_amount: number;
  receive_currency: string;
  send_bank?: string | null;
  send_method?: string | null;
  receive_bank?: string | null;
  receive_method?: string | null;
  payment_reference?: string | null;
  payment_requisites?: PaymentRequisites | null;
};

const terminalStatuses = new Set(["paid", "processing", "completed", "cancelled"]);

function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: currency === "USDT" ? 4 : 2,
  })} ${currency}`;
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    awaiting_requisites: "Ожидает реквизиты",
    awaiting_payment: "Ожидает оплату",
    paid: "Оплачено",
    processing: "В обработке",
    completed: "Выполнено",
    cancelled: "Отменено",
  };

  return labels[String(status || "awaiting_requisites")] || "Ожидает реквизиты";
}

function hasRequisites(requisites?: PaymentRequisites | null) {
  if (!requisites) return false;
  return Boolean(
    requisites.cardNumber ||
      requisites.phoneNumber ||
      requisites.iban ||
      requisites.walletAddress
  );
}

function displayMethod(order: PaymentOrder) {
  return order.payment_requisites?.bankName || order.payment_requisites?.method || order.send_bank || order.send_method || "—";
}

function displayReceiveMethod(order: PaymentOrder) {
  return order.receive_bank || order.receive_method || "—";
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" className="copy-button" onClick={copy}>
      {copied ? "Скопировано" : "Копировать"}
    </button>
  );
}

function DetailCard({
  label,
  value,
  copy,
}: {
  label: string;
  value?: string | null;
  copy?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="requisites-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {copy && <CopyButton value={value} />}
    </div>
  );
}

export default function PaymentRequisitesFlow({ initialOrder }: { initialOrder: PaymentOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [pollError, setPollError] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const router = useRouter();

  const requisites = order.payment_requisites;
  const readyForPayment = order.status === "awaiting_payment" && hasRequisites(requisites);
  const shouldPoll = !readyForPayment && !terminalStatuses.has(String(order.status || ""));
  const comment = requisites?.comment || order.payment_reference || `EF-${order.id.slice(0, 8)}`;

  const summary = useMemo(
    () => [
      { label: "Номер обмена", value: `#EF-${order.id.slice(0, 8).toUpperCase()}` },
      { label: "Вы отправляете", value: formatMoney(order.send_amount, order.send_currency) },
      { label: "Вы получаете", value: formatMoney(order.receive_amount, order.receive_currency) },
      { label: "Способ оплаты", value: displayMethod(order) },
      { label: "Способ получения", value: displayReceiveMethod(order) },
    ],
    [order]
  );

  useEffect(() => {
    if (!shouldPoll) return undefined;

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Не удалось обновить статус.");
        if (!cancelled) {
          setOrder(result.order);
          setPollError("");
        }
      } catch {
        if (!cancelled) setPollError("Не удалось обновить статус. Попробуем ещё раз.");
      }
    }, 7000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [order.id, shouldPoll]);

  async function markPaid() {
    setMarkingPaid(true);
    setPollError("");

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Не удалось отметить оплату.");
      setOrder(result.order);
    } catch (error) {
      setPollError(error instanceof Error ? error.message : "Не удалось отметить оплату.");
    } finally {
      setMarkingPaid(false);
    }
  }

  if (!readyForPayment) {
    return (
      <section className="flow-panel requisites-screen waiting-requisites">
        <div className="waiting-orb" aria-hidden="true"><span /></div>
        <span className="status-pill status-waiting">{statusLabel(order.status)}</span>
        <h3>Получаем реквизиты</h3>
        <p>
          Оператор проверяет заявку и готовит реквизиты для оплаты. Обычно это занимает несколько минут.
        </p>

        <div className="requisites-summary-grid">
          {summary.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <p className="requisites-note">
          Не закрывайте страницу. Как только реквизиты будут готовы, они появятся здесь автоматически.
        </p>
        <p className="small">Вы также можете открыть этот обмен позже в разделе «Мои обмены».</p>
        {pollError && <div className="error">{pollError}</div>}

        <div className="flow-actions visible-actions">
          <button type="button" className="btn" onClick={() => router.push("/dashboard")}>Мои обмены</button>
          <a className="btn" href="https://t.me/" target="_blank" rel="noreferrer">Поддержка</a>
        </div>
      </section>
    );
  }

  return (
    <section className="flow-panel requisites-screen">
      <span className="status-pill status-waiting">{statusLabel(order.status)}</span>
      <h3>Реквизиты готовы</h3>
      <p>Переведите точную сумму по указанным реквизитам.</p>

      <div className="requisites-grid">
        <DetailCard label="Сумма к оплате" value={formatMoney(order.send_amount, order.send_currency)} copy />
        <DetailCard label="Банк / способ" value={requisites?.bankName || requisites?.method} />
        <DetailCard label="Получатель" value={requisites?.recipientName} copy />
        <DetailCard label="Номер карты" value={requisites?.cardNumber} copy />
        <DetailCard label="Телефон" value={requisites?.phoneNumber} copy />
        <DetailCard label="IBAN" value={requisites?.iban} copy />
        <DetailCard label="Кошелек" value={requisites?.walletAddress} copy />
        <DetailCard label="Комментарий к переводу" value={comment} copy />
        <DetailCard label="Реквизиты действуют до" value={requisites?.expiresAt} />
      </div>

      <div className="security-warning">
        EuroFlow не запрашивает CVV, PIN, пароли банка и одноразовые SMS-коды.
      </div>
      {pollError && <div className="error">{pollError}</div>}

      <div className="flow-actions visible-actions">
        <button type="button" className="btn btn-primary" onClick={markPaid} disabled={markingPaid || order.status === "paid"}>
          {order.status === "paid" ? "Оплата отмечена" : markingPaid ? "Отмечаем…" : "Я оплатил"}
        </button>
        <a className="btn" href="https://t.me/" target="_blank" rel="noreferrer">Связаться с поддержкой</a>
      </div>
    </section>
  );
}
