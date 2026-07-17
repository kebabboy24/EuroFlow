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
  completed_at?: string | null;
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

const terminalStatuses = new Set(["completed", "cancelled"]);

const paidTimeline = [
  { title: "Заявка создана", state: "done" },
  { title: "Реквизиты выданы", state: "done" },
  { title: "Оплата отмечена", state: "done" },
  { title: "Оператор проверяет перевод", state: "current" },
  { title: "Евро отправлены", state: "pending" },
] as const;

const completedTimeline = [
  { title: "Заявка создана", state: "done" },
  { title: "Реквизиты выданы", state: "done" },
  { title: "Оплата отмечена", state: "done" },
  { title: "Оператор проверил перевод", state: "done" },
  { title: "Средства отправлены", state: "featured" },
] as const;

function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: currency === "USDT" ? 4 : 2,
  })} ${currency}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      {copied ? "Готово" : "Копировать"}
    </button>
  );
}

function DetailRow({
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
    <div className="requisites-row">
      <span>{label}</span>
      <strong>{value}</strong>
      {copy && <CopyButton value={value} />}
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="paid-success-svg">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.2 2.4 2.4 5.3-5.5" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="paid-success-svg">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function PaidConfirmation({ order, pollError }: { order: PaymentOrder; pollError?: string }) {
  const processing = order.status === "processing";
  const summary = [
    { label: "Номер обмена", value: `#EF-${order.id.slice(0, 8).toUpperCase()}` },
    { label: "Вы отправили", value: formatMoney(order.send_amount, order.send_currency) },
    { label: "Вы получите", value: formatMoney(order.receive_amount, order.receive_currency) },
    { label: "Банк / способ оплаты", value: displayMethod(order) },
    { label: "Статус", value: processing ? "В обработке" : "Оплачено" },
    { label: "Следующий шаг", value: processing ? "Отправка средств" : "Проверка оператором" },
  ];

  return (
    <section className="flow-panel paid-confirmation-screen">
      <div className="paid-confirmation-visual" aria-hidden="true">
        <CheckCircleIcon />
      </div>
      <span className={`status-pill ${processing ? "status-processing" : "status-completed"}`}>
        {processing ? "В обработке" : "Оплачено"}
      </span>
      <h3>{processing ? "Обмен в обработке" : "Оплата отмечена"}</h3>
      <p>
        {processing
          ? "Оператор проверяет перевод и готовит отправку средств по вашим реквизитам."
          : "Мы получили ваше подтверждение. Оператор проверит перевод и начнёт обработку обмена."}
      </p>

      <div className="paid-summary-grid">
        {summary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="paid-timeline" aria-label="Статус обмена">
        {paidTimeline.map((item, index) => {
          const state = processing && index === 3 ? "current" : item.state;
          return (
            <div key={item.title} className={`paid-timeline-step ${state}`}>
              <span />
              <strong>{processing && index === 3 ? "Оператор обрабатывает обмен" : item.title}</strong>
            </div>
          );
        })}
      </div>

      <p className="small paid-confirmation-note">Статус обновится автоматически. Обычно обработка занимает 10–30 минут.</p>
      {pollError && <div className="error">{pollError}</div>}
      <div className="security-warning">
        EuroFlow не запрашивает CVV, PIN, пароли банка и одноразовые SMS-коды.
      </div>

      <div className="flow-actions visible-actions paid-confirmation-actions">
        <button type="button" className="btn btn-primary" onClick={() => window.location.assign("/dashboard")}>Мои обмены</button>
        <a className="btn" href="https://t.me/" target="_blank" rel="noreferrer">Связаться с поддержкой</a>
      </div>
    </section>
  );
}

function CompletedConfirmation({ order }: { order: PaymentOrder }) {
  const completedAt = formatDateTime(order.completed_at);
  const summary = [
    { label: "Номер обмена", value: `#EF-${order.id.slice(0, 8).toUpperCase()}` },
    { label: "Вы отправили", value: formatMoney(order.send_amount, order.send_currency) },
    { label: "Вы получили", value: formatMoney(order.receive_amount, order.receive_currency) },
    { label: "Способ получения", value: displayReceiveMethod(order) },
    ...(completedAt ? [{ label: "Дата завершения", value: completedAt }] : []),
  ];

  return (
    <section className="flow-panel paid-confirmation-screen completed-exchange-screen">
      <div className="paid-confirmation-visual completed-confirmation-visual" aria-hidden="true">
        <CheckCircleIcon />
      </div>
      <span className="status-pill status-completed">Выполнено</span>
      <h3>Обмен выполнен</h3>
      <p>Мы отправили средства по вашим реквизитам. Спасибо, что выбрали EuroFlow.</p>

      <div className="paid-summary-grid completed-summary-grid">
        {summary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="paid-timeline completed-timeline" aria-label="Обмен выполнен">
        {completedTimeline.map((item) => (
          <div key={item.title} className={`paid-timeline-step ${item.state}`}>
            <span />
            <strong>{item.title}</strong>
          </div>
        ))}
      </div>

      <div className="flow-actions visible-actions paid-confirmation-actions completed-actions">
        <button type="button" className="btn btn-primary" onClick={() => window.location.assign("/dashboard")}>Мои обмены</button>
        <button type="button" className="btn" onClick={() => window.location.assign("/exchange")}>Создать новый обмен</button>
        <a className="btn btn-ghost" href="https://t.me/" target="_blank" rel="noreferrer">Связаться с поддержкой</a>
      </div>
    </section>
  );
}

function CancelledConfirmation({ order }: { order: PaymentOrder }) {
  return (
    <section className="flow-panel paid-confirmation-screen cancelled-exchange-screen">
      <div className="paid-confirmation-visual cancelled-confirmation-visual" aria-hidden="true">
        <XCircleIcon />
      </div>
      <span className="status-pill status-cancelled">Отменено</span>
      <h3>Обмен отменён</h3>
      <p>Операция остановлена. Если вы уже отправили средства, пожалуйста, свяжитесь с поддержкой.</p>

      <div className="paid-summary-grid cancelled-summary-grid">
        <div>
          <span>Номер обмена</span>
          <strong>#EF-{order.id.slice(0, 8).toUpperCase()}</strong>
        </div>
        <div>
          <span>Направление</span>
          <strong>{order.send_currency} → {order.receive_currency}</strong>
        </div>
      </div>

      <div className="flow-actions visible-actions paid-confirmation-actions">
        <a className="btn btn-primary" href="https://t.me/" target="_blank" rel="noreferrer">Связаться с поддержкой</a>
        <button type="button" className="btn" onClick={() => window.location.assign("/dashboard")}>Мои обмены</button>
      </div>
    </section>
  );
}

export default function PaymentRequisitesFlow({ initialOrder }: { initialOrder: PaymentOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [pollError, setPollError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const router = useRouter();

  const requisites = order.payment_requisites;
  const readyForPayment = order.status === "awaiting_payment" && hasRequisites(requisites);
  const shouldPoll = !terminalStatuses.has(String(order.status || ""));
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

    async function refreshOrder() {
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
    }

    void refreshOrder();
    const interval = window.setInterval(refreshOrder, 7000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [order.id, shouldPoll]);

  async function markPaid() {
    if (markingPaid || order.status !== "awaiting_payment") return;

    setMarkingPaid(true);
    setPollError("");
    setPaymentError("");

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
      console.error("Mark paid failed", error);
      setPaymentError("Не удалось отметить оплату. Попробуйте ещё раз или свяжитесь с поддержкой.");
    } finally {
      setMarkingPaid(false);
    }
  }

  if (order.status === "completed") {
    return <CompletedConfirmation order={order} />;
  }

  if (order.status === "cancelled") {
    return <CancelledConfirmation order={order} />;
  }

  if (order.status === "paid" || order.status === "processing") {
    return <PaidConfirmation order={order} pollError={pollError} />;
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
    <section className="flow-panel requisites-screen requisites-ready-screen">
      <div className="requisites-ready-head">
        <div>
          <span className="status-pill status-waiting">{statusLabel(order.status)}</span>
          <h3>Реквизиты готовы</h3>
          <p>Переведите точную сумму по указанным реквизитам.</p>
        </div>
        <div className="requisites-amount-card">
          <span>Сумма к оплате</span>
          <strong>{formatMoney(order.send_amount, order.send_currency)}</strong>
          <CopyButton value={formatMoney(order.send_amount, order.send_currency)} />
        </div>
      </div>

      <div className="requisites-payment-card">
        <div className="requisites-payment-top">
          <div>
            <span>Банк / способ</span>
            <strong>{requisites?.bankName || requisites?.method || displayMethod(order)}</strong>
          </div>
          {requisites?.expiresAt && (
            <div>
              <span>Действуют до</span>
              <strong>{requisites.expiresAt}</strong>
            </div>
          )}
        </div>

        <div className="requisites-row-list">
          <DetailRow label="Получатель" value={requisites?.recipientName} copy />
          <DetailRow label="Номер карты" value={requisites?.cardNumber} copy />
          <DetailRow label="Телефон" value={requisites?.phoneNumber} copy />
          <DetailRow label="IBAN" value={requisites?.iban} copy />
          <DetailRow label="Кошелек" value={requisites?.walletAddress} copy />
          <DetailRow label="Комментарий к переводу" value={comment} copy />
        </div>
      </div>

      <div className="security-warning">
        EuroFlow не запрашивает CVV, PIN, пароли банка и одноразовые SMS-коды.
      </div>
      {pollError && <div className="error">{pollError}</div>}
      {paymentError && (
        <div className="payment-error-card">
          <strong>Не удалось отметить оплату</strong>
          <span>Попробуйте ещё раз или свяжитесь с поддержкой.</span>
        </div>
      )}

      <div className="flow-actions visible-actions">
        <button type="button" className="btn btn-primary" onClick={markPaid} disabled={markingPaid || order.status === "paid"}>
          {markingPaid ? "Отправляем подтверждение..." : paymentError ? "Попробовать снова" : "Я оплатил"}
        </button>
        <a className="btn" href="https://t.me/" target="_blank" rel="noreferrer">Связаться с поддержкой</a>
      </div>
    </section>
  );
}
