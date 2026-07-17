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
      [writeButton],
    ],
  };
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

export async function sendOperatorOrderNotification(order: OperatorOrderNotification) {
  return sendOperatorTelegramMessage(formatOperatorOrderMessage(order), operatorKeyboard(order));
}

export async function handleOperatorCallback(callback: OperatorCallbackQuery) {
  const action = callback.data || "operator:unknown";
  console.log("Operator Telegram callback", {
    action,
    from: callback.from?.username || callback.from?.id,
    messageId: callback.message?.message_id,
  });

  const { token } = operatorTelegramConfig();
  if (!token || !callback.id) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callback.id,
      text: "Действие зафиксировано. Обработка статусов будет добавлена в админ-панели.",
      show_alert: false,
    }),
  }).catch((error) => {
    console.error("Operator callback answer failed", error);
  });
}
