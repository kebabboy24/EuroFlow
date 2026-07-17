import { savePaymentRequisites } from "@/lib/orders/payment-requisites";
import { createAdminClient } from "@/lib/supabase/admin";

type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
  error_code?: number;
};

type TelegramInlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
};

export type OperatorNotificationResult = {
  ok: boolean;
  chatIdConfigured: boolean;
  tokenConfigured: boolean;
  description?: string;
  errorCode?: number;
};

export type OperatorOrderNotification = {
  id?: string | number | null;
  status?: string | null;
  source?: string | null;
  created_at?: string | null;
  full_name?: string | null;
  telegram?: string | null;
  email?: string | null;
  phone?: string | null;
  send_amount?: number | null;
  send_currency?: string | null;
  receive_amount?: number | null;
  receive_currency?: string | null;
  send_method?: string | null;
  send_bank?: string | null;
  receive_method?: string | null;
  receive_bank?: string | null;
  payout_details?: string | null;
  payment_reference?: string | null;
  rate_value?: number | null;
  base_rate?: number | null;
  margin_percent?: number | null;
  estimated_profit?: number | null;
  rate_source?: string | null;
  comment?: string | null;
  operator_note?: string | null;
};

export type OperatorCallbackQuery = {
  id: string;
  data?: string;
  from?: { id: number; username?: string; first_name?: string; last_name?: string };
  message?: { chat?: { id: number | string }; message_id?: number };
};

export type OperatorTelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number | string };
  from?: { id: number; username?: string; first_name?: string; last_name?: string };
};

export function operatorTelegramConfig() {
  return {
    token:
      process.env.OPERATOR_TELEGRAM_BOT_TOKEN ||
      process.env.TELEGRAM_NOTIFY_BOT_TOKEN ||
      process.env.TELEGRAM_BOT_TOKEN ||
      "",
    chatId: process.env.OPERATOR_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "",
  };
}

function formatOrderId(id?: string | number | null) {
  if (!id) return "#EF-new";
  const value = String(id);
  if (/^\d+$/.test(value)) return `#EF-${value.padStart(6, "0")}`;
  return `#EF-${value.slice(0, 8).toUpperCase()}`;
}

function formatAmount(value?: number | null, currency = "") {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return "—";
  const digits = currency === "USDT" ? 4 : 2;
  return `${Number(value).toLocaleString("ru-RU", { maximumFractionDigits: digits })} ${currency}`.trim();
}

function formatRate(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 8 });
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return "—";
  return `${Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%`;
}

function sourceLabel(source?: string | null) {
  const labels: Record<string, string> = {
    binance_p2p: "Binance P2P",
    bybit_p2p: "Bybit P2P",
    manual_fallback: "Manual fallback",
  };

  return source ? labels[source] || source : "—";
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    awaiting_requisites: "Ожидает реквизиты",
    awaiting_payment: "Ожидает оплату",
    paid: "Оплачено",
    processing: "В обработке",
    completed: "Выполнено",
    cancelled: "Отменено",
    "Новая": "Новая",
  };
  const value = String(status || "awaiting_requisites");
  return labels[value] || value;
}

function safe(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function telegramUrl(handle?: string | null) {
  const value = String(handle || "").trim();
  if (!value.startsWith("@")) return undefined;
  return `https://t.me/${value.slice(1)}`;
}

function orderTelegramUrl(order: Record<string, any>) {
  return telegramUrl(order.telegram);
}

function buttonId(id?: string | number | null) {
  return String(id || "new").slice(0, 36);
}

function operatorKeyboard(order: OperatorOrderNotification): TelegramInlineKeyboard {
  const id = buttonId(order.id);
  const writeUrl = telegramUrl(order.telegram);
  const writeButton = writeUrl
    ? { text: "💬 Написать клиенту", url: writeUrl }
    : { text: "💬 Написать клиенту", callback_data: `operator:contact:${id}` };

  return {
    inline_keyboard: [
      [
        { text: "✅ Принять", callback_data: `operator:accept:${id}` },
        { text: "❌ Отклонить", callback_data: `operator:reject:${id}` },
      ],
      [{ text: "🏦 Добавить реквизиты", callback_data: `operator:requisites:${id}` }],
      [writeButton],
    ],
  };
}

function paidOperatorKeyboard(order: Record<string, any>): TelegramInlineKeyboard {
  const id = buttonId(order.id);
  const writeUrl = orderTelegramUrl(order);
  const contactButton = writeUrl
    ? { text: "Написать клиенту", url: writeUrl }
    : { text: "Написать клиенту", callback_data: `operator:contact_client:${id}` };

  return {
    inline_keyboard: [
      [{ text: "Проверить оплату", callback_data: `operator:check_payment:${id}` }],
      [
        { text: "Отпустить платеж", callback_data: `operator:release_payment:${id}` },
        { text: "Отклонить", callback_data: `operator:reject_order:${id}` },
      ],
      [contactButton],
    ],
  };
}

function requisitesTemplate(orderId: string) {
  return [
    "Заполните реквизиты и отправьте это сообщение обратно боту.",
    "",
    `/requisites ${orderId}`,
    "method: card",
    "bankName: Сбербанк",
    "recipientName: Иван Иванов",
    "cardNumber: ",
    "phoneNumber: ",
    "iban: ",
    "walletAddress: ",
    `comment: EF-${orderId.slice(0, 8).toUpperCase()}`,
    "expiresAt: сегодня до 18:00",
    "",
    "Можно заполнить только нужный реквизит: карту, телефон, IBAN или кошелек.",
  ].join("\n");
}

export function formatOperatorOrderMessage(order: OperatorOrderNotification) {
  const sendCurrency = safe(order.send_currency);
  const receiveCurrency = safe(order.receive_currency);
  const sendMethod = order.send_bank || order.send_method;
  const receiveMethod = Array.from(new Set([order.receive_method, order.receive_bank].filter(Boolean))).join(" / ");
  const createdAt = order.created_at ? new Date(order.created_at) : new Date();

  return [
    "🟦 EuroFlow — новый обмен",
    "",
    `Заявка: ${formatOrderId(order.id)}`,
    `Статус: ${statusLabel(order.status)}`,
    order.operator_note ? `Важно: ${order.operator_note}` : "",
    "",
    "Клиент",
    `Имя: ${safe(order.full_name)}`,
    `Telegram: ${safe(order.telegram)}`,
    `Email: ${safe(order.email)}`,
    `Телефон: ${safe(order.phone)}`,
    "",
    "Обмен",
    `Отдает: ${formatAmount(order.send_amount, sendCurrency)}`,
    `Получает: ${formatAmount(order.receive_amount, receiveCurrency)}`,
    `Направление: ${sendCurrency} → ${receiveCurrency}`,
    "",
    "Оплата клиента",
    `Банк/способ: ${safe(sendMethod)}`,
    `Реквизиты/банк получения: ${safe(receiveMethod)}`,
    `Реквизиты: ${safe(order.payout_details)}`,
    `Комментарий: ${safe(order.payment_reference || order.comment)}`,
    "",
    "Курс",
    `Курс клиента: 1 ${sendCurrency} = ${formatRate(order.rate_value)} ${receiveCurrency}`,
    `Базовый курс: 1 ${sendCurrency} = ${formatRate(order.base_rate)} ${receiveCurrency}`,
    `Источник: ${sourceLabel(order.rate_source)}`,
    `Маржа EuroFlow: ${formatPercent(order.margin_percent)}`,
    `Оценка прибыли: ${formatAmount(order.estimated_profit, receiveCurrency)}`,
    "",
    `Время: ${createdAt.toLocaleString("ru-RU", { timeZone: "Europe/Istanbul" })}`,
  ].join("\n");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", { timeZone: "Europe/Istanbul" });
}

export function formatOperatorPaidMessage(order: Record<string, any>) {
  return [
    "Клиент отметил оплату",
    "",
    "Клиент",
    `Имя: ${safe(order.full_name)}`,
    `Telegram: ${safe(order.telegram)}`,
    `Email: ${safe(order.email)}`,
    "",
    "Обмен",
    `Заявка: ${formatOrderId(order.id)}`,
    `Отдает: ${formatAmount(order.send_amount, order.send_currency)}`,
    `Получает: ${formatAmount(order.receive_amount, order.receive_currency)}`,
    "",
    "Оплата",
    `Банк / способ: ${safe(order.send_bank || order.send_method || order.payment_requisites?.bankName || order.payment_requisites?.method)}`,
    `Статус: Оплачено`,
    `Создано: ${formatDate(order.created_at)}`,
    `Оплачено: ${formatDate(order.paid_at)}`,
    "",
    "Действия",
    "Проверьте входящий перевод и выберите следующий шаг.",
  ].join("\n");
}

export async function sendOperatorTelegramMessage(
  text: string,
  replyMarkup?: TelegramInlineKeyboard
): Promise<OperatorNotificationResult> {
  const { token, chatId } = operatorTelegramConfig();

  if (!token || !chatId) {
    return {
      ok: false,
      tokenConfigured: Boolean(token),
      chatIdConfigured: Boolean(chatId),
      description: !token
        ? "Operator Telegram bot token is not configured."
        : "Operator Telegram chat id is not configured.",
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as TelegramApiResponse;

    if (!response.ok || result.ok === false) {
      return {
        ok: false,
        tokenConfigured: true,
        chatIdConfigured: true,
        description: result.description || `Telegram API returned HTTP ${response.status}`,
        errorCode: result.error_code,
      };
    }

    return { ok: true, tokenConfigured: true, chatIdConfigured: true };
  } catch (error) {
    return {
      ok: false,
      tokenConfigured: true,
      chatIdConfigured: true,
      description: error instanceof Error ? error.message : "Telegram request failed.",
    };
  }
}

async function sendOperatorChatMessage(chatId: number | string, text: string) {
  const { token } = operatorTelegramConfig();
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  }).catch((error) => {
    console.error("Operator Telegram chat message failed", error);
  });
}

async function answerOperatorCallback(callbackId: string, text: string, showAlert = false) {
  const { token } = operatorTelegramConfig();
  if (!token || !callbackId) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: showAlert }),
  }).catch((error) => {
    console.error("Operator callback answer failed", error);
  });
}

function isOperatorChat(chatId?: string | number) {
  const configured = operatorTelegramConfig().chatId;
  return Boolean(configured) && String(chatId) === String(configured);
}

function parseRequisitesMessage(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0] || "";
  const match = first.match(/^\/requisites\s+(.+)$/i);
  if (!match) return null;

  const orderId = match[1].trim();
  const aliases: Record<string, string> = {
    method: "method",
    bank: "bankName",
    bankname: "bankName",
    recipient: "recipientName",
    recipientname: "recipientName",
    card: "cardNumber",
    cardnumber: "cardNumber",
    phone: "phoneNumber",
    phonenumber: "phoneNumber",
    iban: "iban",
    wallet: "walletAddress",
    walletaddress: "walletAddress",
    comment: "comment",
    expires: "expiresAt",
    expiresat: "expiresAt",
  };
  const payload: Record<string, string> = {};

  for (const line of lines.slice(1)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const rawKey = line.slice(0, separator).trim().toLowerCase().replace(/[\s_-]/g, "");
    const key = aliases[rawKey];
    if (!key) continue;
    payload[key] = line.slice(separator + 1).trim();
  }

  return { orderId, payload };
}

export async function sendOperatorOrderNotification(order: OperatorOrderNotification) {
  return sendOperatorTelegramMessage(formatOperatorOrderMessage(order), operatorKeyboard(order));
}

export async function sendOperatorPaidNotification(order: Record<string, any>) {
  return sendOperatorTelegramMessage(formatOperatorPaidMessage(order), paidOperatorKeyboard(order));
}

async function loadOperatorOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  return { supabase, data, error };
}

async function updateOperatorOrderStatus(orderId: string, status: "processing" | "completed" | "cancelled") {
  const { supabase, data: order, error: readError } = await loadOperatorOrder(orderId);
  if (readError) return { order: null, error: readError.message };
  if (!order) return { order: null, error: "Обмен не найден." };

  const now = new Date().toISOString();
  const update: Record<string, string> = { status, updated_at: now };
  if (status === "completed") update.completed_at = now;

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) return { order: null, error: error.message };
  if (!data) return { order: null, error: "Обмен не найден." };

  return { order: data, error: "" };
}

async function handlePaymentAction(command: string, orderId: string, callback: OperatorCallbackQuery) {
  const labels: Record<string, { status: "processing" | "completed" | "cancelled"; message: string; callback: string }> = {
    check_payment: { status: "processing", message: "Статус обновлён: В обработке", callback: "В обработке" },
    release_payment: { status: "completed", message: "Обмен завершён", callback: "Обмен завершён" },
    reject_order: { status: "cancelled", message: "Обмен отменён", callback: "Обмен отменён" },
  };

  const action = labels[command];
  if (!action) return false;

  const { order, error } = await updateOperatorOrderStatus(orderId, action.status);
  if (error || !order) {
    await answerOperatorCallback(callback.id, error || "Не удалось обновить статус", true);
    return true;
  }

  await answerOperatorCallback(callback.id, action.callback);
  await sendOperatorChatMessage(
    callback.message?.chat?.id || operatorTelegramConfig().chatId,
    [
      action.message,
      "",
      `Обмен: ${formatOrderId(order.id)}`,
      `Текущий статус: ${statusLabel(order.status)}`,
    ].join("\n")
  );
  return true;
}

export async function handleOperatorCallback(callback: OperatorCallbackQuery) {
  const action = callback.data || "operator:unknown";
  const [, command, orderId = ""] = action.split(":");
  console.log("Operator Telegram callback", {
    action,
    from: callback.from?.username || callback.from?.id,
    messageId: callback.message?.message_id,
  });

  const { token } = operatorTelegramConfig();
  if (!token || !callback.id) return;

  if (!isOperatorChat(callback.message?.chat?.id)) {
    await answerOperatorCallback(callback.id, "Недоступно", true);
    console.warn("Blocked operator callback from unexpected chat", callback.message?.chat?.id);
    return;
  }

  if (orderId && await handlePaymentAction(command, orderId, callback)) return;

  if (command === "contact_client" && orderId) {
    const { data: order } = await loadOperatorOrder(orderId);
    await answerOperatorCallback(
      callback.id,
      order ? `Клиент: ${order.telegram || order.email || order.full_name || "контакт не указан"}` : "Обмен не найден",
      true
    );
    return;
  }

  if (command === "requisites" && orderId) {
    const chatId = callback.message?.chat?.id || operatorTelegramConfig().chatId;
    await sendOperatorChatMessage(chatId, requisitesTemplate(orderId));
  }

  await answerOperatorCallback(callback.id, command === "requisites" ? "Шаблон реквизитов отправлен." : "Действие зафиксировано.");
}

export async function handleOperatorMessage(message: OperatorTelegramMessage) {
  if (!message.text) return;
  if (!isOperatorChat(message.chat.id)) {
    console.warn("Ignored operator bot message from unexpected chat", message.chat.id);
    return;
  }

  if (message.text === "/start" || message.text === "/help") {
    await sendOperatorChatMessage(message.chat.id, [
      "EuroFlow operator bot",
      "",
      "Чтобы добавить реквизиты, нажмите кнопку «Добавить реквизиты» под заявкой или отправьте:",
      "",
      "/requisites ORDER_ID",
      "bankName: Сбербанк",
      "recipientName: Иван Иванов",
      "cardNumber: 0000000000000000",
      "comment: EF-ORDER",
    ].join("\n"));
    return;
  }

  const parsed = parseRequisitesMessage(message.text);
  if (!parsed) return;

  const { data, error } = await savePaymentRequisites(parsed.orderId, parsed.payload);

  if (error || !data) {
    await sendOperatorChatMessage(message.chat.id, `Не удалось сохранить реквизиты: ${error?.message || "ошибка"}`);
    return;
  }

  await sendOperatorChatMessage(message.chat.id, [
    "Реквизиты отправлены клиенту.",
    "",
    `Обмен: ${formatOrderId(data.id)}`,
    "Статус: Ожидает оплату",
  ].join("\n"));
}
