import {
  defaultRegion,
  receiveCurrencies,
  sendCurrencies,
} from "@/lib/exchange/payment-methods";
import { insertOrderWithSchemaFallback } from "@/lib/orders/insert-order";
import { calculateRate } from "@/lib/rates/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOperatorOrderNotification } from "@/lib/telegram/operator-notifications";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
};

export type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: TelegramChat;
  from?: TelegramUser;
};

type TelegramReplyMarkup = {
  keyboard?: string[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  remove_keyboard?: boolean;
};

type OrderPayload = {
  full_name?: string;
  email?: string;
  send_amount?: number;
  send_currency?: string;
  send_region?: string;
  send_method?: string;
  send_bank?: string;
  receive_currency?: string;
  receive_region?: string;
  receive_method?: string;
  receive_bank?: string;
  payout_details?: string;
  receive_amount?: number;
  rate_value?: number;
  base_rate?: number;
  margin_percent?: number;
  estimated_profit?: number;
  rate_source?: "binance_p2p" | "bybit_p2p" | "manual_fallback";
  comment?: string;
};

type OrderStep =
  | "full_name"
  | "email"
  | "send_currency"
  | "send_method"
  | "receive_currency"
  | "receive_method"
  | "payout_details"
  | "send_amount"
  | "comment"
  | "confirm";

type TelegramOrderSession = {
  chat_id: number;
  username: string | null;
  step: OrderStep;
  payload: OrderPayload;
};

const SEND_CURRENCIES = sendCurrencies.map((currency) => currency.code);
const RECEIVE_CURRENCIES = receiveCurrencies.map((currency) => currency.code);

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function parseAmount(value: string) {
  const amount = Number(value.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function telegramHandle(from?: TelegramUser) {
  if (!from) return "Telegram";
  if (from.username) return `@${from.username}`;
  return `tg://user?id=${from.id}`;
}

function userName(from?: TelegramUser) {
  return [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim();
}

function paymentReference() {
  return `EF-${Date.now().toString(36).toUpperCase()}`;
}

function formatRate(value?: number) {
  return Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: 8,
  });
}

function defaultMethodName(currency: string) {
  const region = defaultRegion(currency);
  return region.methods.find((method) => method.popular)?.name || region.methods[0]?.name || "Другое";
}

function methodNames(currency: string) {
  const region = defaultRegion(currency);
  return region.methods.map((method) => method.name);
}

function keyboardRows(values: string[]) {
  const rows: string[][] = [];
  for (let index = 0; index < values.length; index += 2) {
    rows.push(values.slice(index, index + 2));
  }
  return rows;
}

function promptForStep(step: OrderStep, payload: OrderPayload) {
  const sendCurrency = payload.send_currency || "RUB";
  const receiveCurrency = payload.receive_currency || "EUR";

  const prompts: Record<OrderStep, string> = {
    full_name: [
      "Шаг 1 из 9. Имя и фамилия",
      "",
      "Напишите ваше имя и фамилию как в заявке.",
      "Например: Иван Иванов",
      "",
      "Чтобы отменить заполнение, отправьте /cancel.",
    ].join("\n"),
    email: [
      "Шаг 2 из 9. Email",
      "",
      "Укажите email для связи и подтверждения заявки.",
      "Например: name@example.com",
    ].join("\n"),
    send_currency: [
      "Шаг 3 из 9. Валюта отправки",
      "",
      `Выберите валюту, которую отправляете: ${SEND_CURRENCIES.join(", ")}`,
    ].join("\n"),
    send_method: [
      "Шаг 4 из 9. Откуда отправляете",
      "",
      `Выберите банк или способ оплаты для ${sendCurrency}.`,
      methodNames(sendCurrency).join(", "),
    ].join("\n"),
    receive_currency: [
      "Шаг 5 из 9. Валюта получения",
      "",
      `Выберите, что хотите получить: ${RECEIVE_CURRENCIES.join(", ")}`,
    ].join("\n"),
    receive_method: [
      "Шаг 6 из 9. Куда получить",
      "",
      `Выберите банк или способ получения для ${receiveCurrency}.`,
      methodNames(receiveCurrency).join(", "),
    ].join("\n"),
    payout_details: [
      "Шаг 7 из 9. Реквизиты получения",
      "",
      "Введите только реквизиты для получения: IBAN, номер карты или wallet.",
      "Не отправляйте CVV, PIN, пароли банка и SMS-коды.",
    ].join("\n"),
    send_amount: [
      "Шаг 8 из 9. Сумма",
      "",
      `Какую сумму отправляете в ${sendCurrency}?`,
      "Напишите только число. Например: 100000",
    ].join("\n"),
    comment: [
      "Шаг 9 из 9. Комментарий",
      "",
      "Если есть важные детали, напишите их одним сообщением.",
      "Если комментарий не нужен, отправьте /skip.",
    ].join("\n"),
    confirm: "Проверьте данные. Если всё верно, отправьте Да. Если хотите отменить заявку, отправьте Нет.",
  };

  return prompts[step];
}

function orderSummary(payload: OrderPayload, from?: TelegramUser) {
  return [
    "Проверьте заявку EuroFlow",
    "",
    `Имя: ${payload.full_name}`,
    `Email: ${payload.email}`,
    `Telegram: ${telegramHandle(from)}`,
    `Клиент отправляет: ${payload.send_amount} ${payload.send_currency}`,
    `Банк/метод отправки: ${payload.send_bank || payload.send_method}`,
    `Клиент получает: ${payload.receive_amount?.toFixed(2)} ${payload.receive_currency}`,
    `Банк/метод получения: ${payload.receive_bank || payload.receive_method}`,
    `Реквизиты получения: ${payload.payout_details}`,
    payload.rate_value ? `Курс EuroFlow: 1 ${payload.send_currency} = ${formatRate(payload.rate_value)} ${payload.receive_currency}` : "Курс: будет уточнён",
    payload.comment ? `Комментарий: ${payload.comment}` : "Комментарий: нет",
  ]
    .filter(Boolean)
    .join("\n");
}

function startMessage() {
  return [
    "Добро пожаловать в EuroFlow.",
    "",
    "Здесь можно создать заявку на обмен прямо в Telegram. Я задам вопросы по шагам: откуда отправляете, куда получить, сумма и реквизиты.",
    "",
    "Чтобы начать новую заявку, отправьте /order.",
    "Чтобы отменить заполнение, отправьте /cancel.",
    "",
    "Важно: не отправляйте PIN, CVV, пароли банка и одноразовые SMS-коды.",
  ].join("\n");
}

function orderIntroMessage() {
  return [
    "Начинаем оформление заявки.",
    "",
    "Сначала выберем валюту и способ отправки, потом реквизиты получения и сумму.",
    "Заполнение обычно занимает 1-2 минуты.",
    "",
    promptForStep("full_name", {}),
  ].join("\n");
}

function noSessionMessage() {
  return [
    "Сейчас нет активной заявки.",
    "",
    "Чтобы создать новую заявку на обмен, отправьте /order.",
  ].join("\n");
}

function clientBotToken() {
  return process.env.CLIENT_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
}

async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: TelegramReplyMarkup,
  token = clientBotToken()
) {
  if (!token) throw new Error("Telegram bot token is not configured.");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });
}

async function getSession(chatId: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("telegram_order_sessions")
    .select("chat_id, username, step, payload")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) throw error;
  return data as TelegramOrderSession | null;
}

async function saveSession(session: TelegramOrderSession) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("telegram_order_sessions").upsert({
    ...session,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

async function deleteSession(chatId: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("telegram_order_sessions")
    .delete()
    .eq("chat_id", chatId);

  if (error) throw error;
}

function nextStep(step: OrderStep): OrderStep {
  const flow: OrderStep[] = [
    "full_name",
    "email",
    "send_currency",
    "send_method",
    "receive_currency",
    "receive_method",
    "payout_details",
    "send_amount",
    "comment",
    "confirm",
  ];
  return flow[Math.min(flow.indexOf(step) + 1, flow.length - 1)];
}

function keyboardForStep(step: OrderStep, payload: OrderPayload): TelegramReplyMarkup | undefined {
  if (step === "send_currency") {
    return { keyboard: keyboardRows(SEND_CURRENCIES), resize_keyboard: true, one_time_keyboard: true };
  }
  if (step === "send_method") {
    return { keyboard: keyboardRows(methodNames(payload.send_currency || "RUB")), resize_keyboard: true, one_time_keyboard: true };
  }
  if (step === "receive_currency") {
    return { keyboard: keyboardRows(RECEIVE_CURRENCIES), resize_keyboard: true, one_time_keyboard: true };
  }
  if (step === "receive_method") {
    return { keyboard: keyboardRows(methodNames(payload.receive_currency || "EUR")), resize_keyboard: true, one_time_keyboard: true };
  }
  if (step === "confirm") {
    return { keyboard: [["Да", "Нет"]], resize_keyboard: true, one_time_keyboard: true };
  }
  return undefined;
}

function pickMethodName(currency: string, text: string) {
  const normalized = text.trim().toLowerCase();
  return methodNames(currency).find((name) => name.toLowerCase() === normalized) || clean(text, 120);
}

async function startOrder(message: TelegramMessage) {
  const session: TelegramOrderSession = {
    chat_id: message.chat.id,
    username: message.from?.username || null,
    step: "full_name",
    payload: {
      full_name: userName(message.from) || undefined,
    },
  };

  await saveSession(session);
  await sendTelegramMessage(message.chat.id, orderIntroMessage());
}

async function enrichRate(payload: OrderPayload) {
  if (!payload.send_currency || !payload.receive_currency || !payload.send_amount) {
    return payload;
  }

  const rate = await calculateRate({
    from: payload.send_currency,
    to: payload.receive_currency,
    amount: payload.send_amount,
    direction: "buy_eur",
  });

  return {
    ...payload,
    receive_amount: Number(rate.receiveAmount.toFixed(2)),
    rate_value: Number(rate.finalRate.toFixed(8)),
    base_rate: Number(rate.baseRate.toFixed(8)),
    margin_percent: Number(rate.marginPercent.toFixed(1)),
    estimated_profit: Number(rate.estimatedProfit.toFixed(2)),
    rate_source: rate.source,
  };
}

async function createOrder(message: TelegramMessage, payload: OrderPayload) {
  const supabase = createAdminClient();
  const enriched = await enrichRate(payload);
  const sendRegion = defaultRegion(enriched.send_currency || "RUB").id;
  const receiveRegion = defaultRegion(enriched.receive_currency || "EUR").id;
  const reference = paymentReference();
  const order = {
    user_id: null,
    source: "telegram",
    telegram_chat_id: message.chat.id,
    telegram_user_id: message.from?.id || null,
    full_name: clean(enriched.full_name, 120),
    email: clean(enriched.email, 180),
    telegram: clean(telegramHandle(message.from), 80),
    send_amount: enriched.send_amount,
    send_currency: clean(enriched.send_currency, 10),
    receive_amount: enriched.receive_amount || enriched.send_amount,
    receive_currency: clean(enriched.receive_currency || "EUR", 10),
    send_region: sendRegion,
    send_method: clean(enriched.send_method, 120),
    send_bank: clean(enriched.send_bank || enriched.send_method, 160),
    receive_region: receiveRegion,
    receive_method: clean(enriched.receive_method, 120),
    receive_bank: clean(enriched.receive_bank || enriched.receive_method, 160),
    payout_details: clean(enriched.payout_details, 600),
    payment_reference: reference,
    rate_value: enriched.rate_value,
    bank_name: clean(enriched.receive_bank || enriched.receive_method, 120),
    iban: clean(enriched.payout_details, 180),
    comment: clean(enriched.comment, 500),
    status: "Новая",
  };

  const { data, error } = await insertOrderWithSchemaFallback(supabase, order, "id");

  if (error) throw error;
  if (!data?.id) throw new Error("Order was saved without id.");

  const operatorNotification = await sendOperatorOrderNotification({
    ...order,
    id: data.id,
    source: "telegram",
    base_rate: enriched.base_rate,
    margin_percent: enriched.margin_percent,
    estimated_profit: enriched.estimated_profit,
    rate_source: enriched.rate_source,
  });
  if (!operatorNotification.ok) {
    console.error("Telegram client order operator notification failed", operatorNotification);
  }

  await deleteSession(message.chat.id);
  await sendTelegramMessage(
    message.chat.id,
    [
      "Заявка создана.",
      "",
      `Номер заявки: ${data.id}`,
      `Комментарий к оплате: ${reference}`,
      "Оператор получил данные и скоро свяжется с вами в Telegram.",
      "",
      "Пожалуйста, не отправляйте оплату, пока оператор не подтвердит детали обмена.",
    ].join("\n"),
    { remove_keyboard: true }
  );
}

async function handleStep(message: TelegramMessage, session: TelegramOrderSession) {
  const text = clean(message.text, 600);
  let payload = { ...(session.payload || {}) };
  let errorMessage = "";

  if (session.step === "full_name") {
    if (text.length < 2) errorMessage = "Пожалуйста, введите имя и фамилию текстом. Например: Иван Иванов";
    else payload.full_name = text;
  }

  if (session.step === "email") {
    if (!isEmail(text)) errorMessage = "Похоже, email введён некорректно. Проверьте формат, например: name@example.com";
    else payload.email = text;
  }

  if (session.step === "send_currency") {
    const currency = text.toUpperCase();
    if (!SEND_CURRENCIES.includes(currency)) errorMessage = `Выберите валюту: ${SEND_CURRENCIES.join(", ")}.`;
    else {
      const region = defaultRegion(currency).id;
      payload.send_currency = currency;
      payload.send_region = region;
      payload.send_method = defaultMethodName(currency);
      payload.send_bank = payload.send_method;
    }
  }

  if (session.step === "send_method") {
    const currency = payload.send_currency || "RUB";
    payload.send_method = pickMethodName(currency, text);
    payload.send_bank = payload.send_method;
  }

  if (session.step === "receive_currency") {
    const currency = text.toUpperCase();
    if (!RECEIVE_CURRENCIES.includes(currency)) errorMessage = `Выберите валюту: ${RECEIVE_CURRENCIES.join(", ")}.`;
    else {
      const region = defaultRegion(currency).id;
      payload.receive_currency = currency;
      payload.receive_region = region;
      payload.receive_method = defaultMethodName(currency);
      payload.receive_bank = payload.receive_method;
    }
  }

  if (session.step === "receive_method") {
    const currency = payload.receive_currency || "EUR";
    payload.receive_method = pickMethodName(currency, text);
    payload.receive_bank = payload.receive_method;
  }

  if (session.step === "payout_details") {
    if (text.length < 4) errorMessage = "Укажите реквизиты получения: IBAN, номер карты или wallet.";
    else payload.payout_details = text;
  }

  if (session.step === "send_amount") {
    const amount = parseAmount(text);
    if (!amount) errorMessage = "Введите сумму числом больше нуля. Например: 100000";
    else {
      payload.send_amount = amount;
      payload = await enrichRate(payload);
    }
  }

  if (session.step === "comment") {
    payload.comment = text === "/skip" ? "" : text;
  }

  if (session.step === "confirm") {
    const answer = text.toLowerCase();
    if (["да", "yes", "y"].includes(answer)) {
      await createOrder(message, payload);
      return;
    }

    if (["нет", "no", "n"].includes(answer)) {
      await deleteSession(message.chat.id);
      await sendTelegramMessage(message.chat.id, "Заявка отменена. Если захотите начать заново, отправьте /order.", {
        remove_keyboard: true,
      });
      return;
    }

    errorMessage = "Пожалуйста, отправьте Да, чтобы создать заявку, или Нет, чтобы отменить её.";
  }

  if (errorMessage) {
    await sendTelegramMessage(
      message.chat.id,
      errorMessage,
      keyboardForStep(session.step, payload)
    );
    return;
  }

  const step = nextStep(session.step);
  const updatedSession = {
    ...session,
    step,
    payload,
    username: message.from?.username || session.username,
  };

  await saveSession(updatedSession);

  if (step === "confirm") {
    await sendTelegramMessage(
      message.chat.id,
      `${orderSummary(payload, message.from)}\n\n${promptForStep(step, payload)}`,
      keyboardForStep(step, payload)
    );
    return;
  }

  await sendTelegramMessage(
    message.chat.id,
    promptForStep(step, payload),
    keyboardForStep(step, payload)
  );
}

export async function handleTelegramOrderMessage(message: TelegramMessage) {
  const text = clean(message.text, 500);
  const command = text.split(" ")[0].toLowerCase();

  if (command === "/start") {
    await sendTelegramMessage(message.chat.id, startMessage());
    return;
  }

  if (command === "/cancel") {
    await deleteSession(message.chat.id);
    await sendTelegramMessage(message.chat.id, "Заполнение заявки отменено. Когда будете готовы начать заново, отправьте /order.", {
      remove_keyboard: true,
    });
    return;
  }

  if (command === "/order") {
    await startOrder(message);
    return;
  }

  const session = await getSession(message.chat.id);
  if (!session) {
    await sendTelegramMessage(message.chat.id, noSessionMessage());
    return;
  }

  await handleStep(message, session);
}
