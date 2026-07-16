import { createAdminClient } from "@/lib/supabase/admin";

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
  receive_amount?: number;
  bank_name?: string;
  iban?: string;
  comment?: string;
};

type OrderStep =
  | "full_name"
  | "email"
  | "send_amount"
  | "send_currency"
  | "receive_amount"
  | "bank_name"
  | "iban"
  | "comment"
  | "confirm";

type TelegramOrderSession = {
  chat_id: number;
  username: string | null;
  step: OrderStep;
  payload: OrderPayload;
};

const CURRENCIES = ["RUB", "UAH", "KZT", "GEL", "USDT"];

const stepPrompts: Record<OrderStep, string> = {
  full_name: "Введите имя и фамилию.",
  email: "Введите email для связи.",
  send_amount: "Какую сумму отправляете?",
  send_currency: "Выберите валюту отправки: RUB, UAH, KZT, GEL или USDT.",
  receive_amount: "Какую сумму ожидаете получить в EUR?",
  bank_name: "Укажите банк получателя.",
  iban: "Укажите IBAN или реквизиты получения.",
  comment: "Добавьте комментарий или отправьте /skip.",
  confirm: "Проверьте заявку и отправьте Да для создания или Нет для отмены.",
};

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

function orderSummary(payload: OrderPayload, from?: TelegramUser) {
  return [
    "Заявка EuroFlow:",
    "",
    `Имя: ${payload.full_name}`,
    `Email: ${payload.email}`,
    `Telegram: ${telegramHandle(from)}`,
    `Отправляет: ${payload.send_amount} ${payload.send_currency}`,
    `Получает: ${payload.receive_amount} EUR`,
    `Банк: ${payload.bank_name}`,
    `Реквизиты: ${payload.iban}`,
    payload.comment ? `Комментарий: ${payload.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function clientBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function notifyBotToken() {
  return process.env.TELEGRAM_NOTIFY_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
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
    "send_amount",
    "send_currency",
    "receive_amount",
    "bank_name",
    "iban",
    "comment",
    "confirm",
  ];
  return flow[Math.min(flow.indexOf(step) + 1, flow.length - 1)];
}

function keyboardForStep(step: OrderStep): TelegramReplyMarkup | undefined {
  if (step === "send_currency") {
    return {
      keyboard: [["RUB", "UAH"], ["KZT", "GEL"], ["USDT"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  if (step === "confirm") {
    return {
      keyboard: [["Да", "Нет"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  return undefined;
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
  await sendTelegramMessage(message.chat.id, stepPrompts.full_name);
}

async function createOrder(message: TelegramMessage, payload: OrderPayload) {
  const supabase = createAdminClient();
  const order = {
    user_id: null,
    source: "telegram",
    telegram_chat_id: message.chat.id,
    telegram_user_id: message.from?.id || null,
    full_name: clean(payload.full_name, 120),
    email: clean(payload.email, 180),
    telegram: clean(telegramHandle(message.from), 80),
    send_amount: payload.send_amount,
    send_currency: clean(payload.send_currency, 10),
    receive_amount: payload.receive_amount,
    receive_currency: "EUR",
    bank_name: clean(payload.bank_name, 120),
    iban: clean(payload.iban, 180),
    comment: clean(payload.comment, 500),
    status: "Новая",
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select("id")
    .single();

  if (error) throw error;

  const operatorChatId = process.env.TELEGRAM_CHAT_ID;
  if (operatorChatId && String(operatorChatId) !== String(message.chat.id)) {
    await sendTelegramMessage(
      operatorChatId,
      [
        "Новая заявка EuroFlow из Telegram",
        "",
        `ID: ${data.id}`,
        orderSummary(payload, message.from),
      ].join("\n"),
      undefined,
      notifyBotToken()
    );
  }

  await deleteSession(message.chat.id);
  await sendTelegramMessage(
    message.chat.id,
    `Заявка создана. Номер: ${data.id}\nОператор скоро свяжется с вами.`,
    { remove_keyboard: true }
  );
}

async function handleStep(message: TelegramMessage, session: TelegramOrderSession) {
  const text = clean(message.text, 500);
  const payload = { ...(session.payload || {}) };
  let errorMessage = "";

  if (session.step === "full_name") {
    if (text.length < 2) errorMessage = "Введите имя и фамилию текстом.";
    else payload.full_name = text;
  }

  if (session.step === "email") {
    if (!isEmail(text)) errorMessage = "Введите корректный email.";
    else payload.email = text;
  }

  if (session.step === "send_amount") {
    const amount = parseAmount(text);
    if (!amount) errorMessage = "Введите сумму числом больше нуля.";
    else payload.send_amount = amount;
  }

  if (session.step === "send_currency") {
    const currency = text.toUpperCase();
    if (!CURRENCIES.includes(currency)) {
      errorMessage = "Выберите валюту: RUB, UAH, KZT, GEL или USDT.";
    } else {
      payload.send_currency = currency;
    }
  }

  if (session.step === "receive_amount") {
    const amount = parseAmount(text);
    if (!amount) errorMessage = "Введите сумму в EUR числом больше нуля.";
    else payload.receive_amount = amount;
  }

  if (session.step === "bank_name") {
    if (text.length < 2) errorMessage = "Укажите банк получателя.";
    else payload.bank_name = text;
  }

  if (session.step === "iban") {
    if (text.length < 5) errorMessage = "Укажите IBAN или реквизиты получения.";
    else payload.iban = text;
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
      await sendTelegramMessage(message.chat.id, "Заявка отменена.", {
        remove_keyboard: true,
      });
      return;
    }

    errorMessage = "Отправьте Да для создания заявки или Нет для отмены.";
  }

  if (errorMessage) {
    await sendTelegramMessage(
      message.chat.id,
      errorMessage,
      keyboardForStep(session.step)
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
      `${orderSummary(payload, message.from)}\n\n${stepPrompts.confirm}`,
      keyboardForStep(step)
    );
    return;
  }

  await sendTelegramMessage(message.chat.id, stepPrompts[step], keyboardForStep(step));
}

export async function handleTelegramOrderMessage(message: TelegramMessage) {
  const text = clean(message.text, 500);
  const command = text.split(" ")[0].toLowerCase();

  if (command === "/start") {
    await sendTelegramMessage(
      message.chat.id,
      "Добро пожаловать в EuroFlow. Чтобы создать заявку на обмен, отправьте /order."
    );
    return;
  }

  if (command === "/cancel") {
    await deleteSession(message.chat.id);
    await sendTelegramMessage(message.chat.id, "Диалог заявки отменен.", {
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
    await sendTelegramMessage(
      message.chat.id,
      "Чтобы создать заявку на обмен, отправьте /order."
    );
    return;
  }

  await handleStep(message, session);
}
