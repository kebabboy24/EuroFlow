import { createAdminClient } from "@/lib/supabase/admin";

export type PaymentRequisitesInput = {
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

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function optional(value: unknown, max = 300) {
  const text = clean(value, max);
  return text || null;
}

export function normalizePaymentRequisites(body: Record<string, unknown>): PaymentRequisitesInput {
  const source = (body.payment_requisites || body.requisites || body) as Record<string, unknown>;

  return {
    method: clean(source.method, 120),
    bankName: clean(source.bankName, 160),
    recipientName: clean(source.recipientName, 160),
    cardNumber: optional(source.cardNumber, 80),
    phoneNumber: optional(source.phoneNumber, 80),
    iban: optional(source.iban, 120),
    walletAddress: optional(source.walletAddress, 180),
    comment: clean(source.comment, 180),
    expiresAt: optional(source.expiresAt, 80),
  };
}

export function validatePaymentRequisites(payment_requisites: PaymentRequisitesInput) {
  if (!payment_requisites.method && !payment_requisites.bankName) {
    return "Укажите банк или способ оплаты.";
  }

  if (
    !payment_requisites.cardNumber &&
    !payment_requisites.phoneNumber &&
    !payment_requisites.iban &&
    !payment_requisites.walletAddress
  ) {
    return "Укажите хотя бы один реквизит для оплаты.";
  }

  return "";
}

function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: currency === "USDT" ? 4 : 2,
  })} ${currency}`;
}

async function notifyTelegramClient(order: Record<string, any>) {
  const token = process.env.CLIENT_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = order.telegram_chat_id;
  const requisites = order.payment_requisites as PaymentRequisitesInput | null;
  if (!token || !chatId || !requisites) return;

  const lines = [
    "Реквизиты EuroFlow готовы",
    "",
    `Сумма к оплате: ${formatMoney(Number(order.send_amount), order.send_currency)}`,
    `Банк / способ: ${requisites.bankName || requisites.method || "—"}`,
    requisites.recipientName ? `Получатель: ${requisites.recipientName}` : "",
    requisites.cardNumber ? `Номер карты: ${requisites.cardNumber}` : "",
    requisites.phoneNumber ? `Телефон: ${requisites.phoneNumber}` : "",
    requisites.iban ? `IBAN: ${requisites.iban}` : "",
    requisites.walletAddress ? `Кошелек: ${requisites.walletAddress}` : "",
    `Комментарий: ${requisites.comment || order.payment_reference || `EF-${String(order.id).slice(0, 8)}`}`,
    requisites.expiresAt ? `Действуют до: ${requisites.expiresAt}` : "",
    "",
    "После оплаты напишите сюда: Я оплатил",
    "EuroFlow не запрашивает CVV, PIN, пароли банка и SMS-коды.",
  ].filter(Boolean);

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
  }).catch((error) => {
    console.error("Client Telegram requisites notification failed", error);
  });
}

export async function savePaymentRequisites(orderId: string, input: Record<string, unknown>) {
  const payment_requisites = normalizePaymentRequisites(input);
  const validationError = validatePaymentRequisites(payment_requisites);
  if (validationError) return { data: null, error: { message: validationError } };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_requisites, status: "awaiting_payment" })
    .eq("id", String(orderId).trim())
    .select("*")
    .single();

  if (!error && data) await notifyTelegramClient(data);
  return { data, error };
}
