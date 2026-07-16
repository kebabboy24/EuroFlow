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
  full_name: [
    "Шаг 1 из 8. Имя и фамилия",
    "",
    "Напишите, пожалуйста, ваше имя и фамилию как в заявке.",
    "Например: Иван Иванов",
    "",
    "Если передумали, отправьте /cancel.",
  ].join("\n"),
  email: [
    "Шаг 2 из 8. Email",
    "",
    "Укажите email для связи и подтверждения заявки.",
    "Например: name@example.com",
  ].join("\n"),
  send_amount: [
    "Шаг 3 из 8. Сумма отправки",
    "",
    "Какую сумму вы хотите отправить?",
    "Напишите только число. Например: 50000",
  ].join("\n"),
  send_currency: [
    "Шаг 4 из 8. Валюта отправки",
    "",
    "Выберите валюту, которую вы отправляете.",
    "Доступно: RUB, UAH, KZT, GEL, USDT",
  ].join("\n"),
  receive_amount: [
    "Шаг 5 из 8. Сумма получения",
    "",
    "Какую сумму вы ожидаете получить в EUR?",
    "Напишите число. Например: 500",
  ].join("\n"),
  bank_name: [
    "Шаг 6 из 8. Банк получателя",
    "",
    "Укажите банк или сервис, куда нужно отправить EUR.",
    "Например: Revolut, Wise, N26, Sparkasse",
  ].join("\n"),
  iban: [
    "Шаг 7 из 8. Реквизиты получения",
    "",
    "Укажите IBAN или другие реквизиты для получения EUR.",
    "Не отправляйте PIN, CVV, пароли банка и коды из SMS.",
  ].join("\n"),
  comment: [
    "Шаг 8 из 8. Комментарий",
    "",
    "Если есть важные детали, напишите их одним сообщением.",
    "Если комментарий не нужен, отправьте /skip.",
  ].join("\n"),
  confirm: "Проверьте данные. Если всё верно, отправьте Да. Если хотите отменить заявку, отправьте Нет.",
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
    "Проверьте заявку EuroFlow",
    "",
    `Имя: ${payload.full_name}`,
    `Email: ${payload.email}`,
    `Telegram: ${telegramHandle(from)}`,
    `Отправляете: ${payload.send_amount} ${payload.send_currency}`,
    `Получаете: ${payload.receive_amount} EUR`,
    `Банк: ${payload.bank_name}`,
    `Реквизиты: ${payload.iban}`,
    payload.comment ? `Комментарий: ${payload.comment}` : "Комментарий: нет",
  ]
    .filter(Boolean)
    .join("\n");
}

function startMessage() {
  return [
    "Добро пожаловать в EuroFlow.",
    "",
    "Здесь можно быстро создать заявку на обмен прямо в Telegram. Я задам несколько вопросов, сохраню заявку и передам её оператору.",
    "",
    "Чтобы начать новую заявку, отправьте /order.",
    "Чтобы отменить заполнение в любой момент, отправьте /cancel.",
    "",
    "Важно: не отправляйте PIN, CVV, пароли банка и одноразовые коды из SMS.",
  ].join("\n");
}

function orderIntroMessage() {
  return [
    "Начинаем оформление заявки.",
    "",
    "Я попрошу: имя, email, сумму отправки, валюту, сумму получения в EUR, банк и реквизиты.",
    "Заполнение обычно занимает 1-2 минуты.",
    "",
    stepPrompts.full_name,
  ].join("\n");
}

function noSessionMessage() {
  return [
    "Сейчас нет активной заявки.",
    "",
    "Чтобы создать новую заявку на обмен, отправьте /order.",
    "Если нужна помощь, напишите оператору после создания заявки.",
  ].join("\n");
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
  await sendTelegramMessage(message.chat.id, orderIntroMessage());
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
    [
      "Заявка создана.",
      "",
      `Номер заявки: ${data.id}`,
      "Оператор получил данные и скоро свяжется с вами в Telegram.",
      "",
      "Пожалуйста, не отправляйте оплату, пока оператор не подтвердит детали обмена.",
    ].join("\n"),
    { remove_keyboard: true }
  );
}

async function handleStep(message: TelegramMessage, session: TelegramOrderSession) {
  const text = clean(message.text, 500);
  const payload = { ...(session.payload || {}) };
  let errorMessage = "";

  if (session.step === "full_name") {
    if (text.length < 2) errorMessage = "Пожалуйста, введите имя и фамилию текстом. Например: Иван Иванов";
    else payload.full_name = text;
  }

  if (session.step === "email") {
    if (!isEmail(text)) errorMessage = "Похоже, email введён некорректно. Проверьте формат, например: name@example.com";
    else payload.email = text;
  }

  if (session.step === "send_amount") {
    const amount = parseAmount(text);
    if (!amount) errorMessage = "Введите сумму числом больше нуля. Например: 50000";
    else payload.send_amount = amount;
  }

  if (session.step === "send_currency") {
    const currency = text.toUpperCase();
    if (!CURRENCIES.includes(currency)) {
      errorMessage = "Выберите одну из доступных валют: RUB, UAH, KZT, GEL или USDT.";
    } else {
      payload.send_currency = currency;
    }
  }

  if (session.step === "receive_amount") {
    const amount = parseAmount(text);
    if (!amount) errorMessage = "Введите ожидаемую сумму в EUR числом больше нуля. Например: 500";
    else payload.receive_amount = amount;
  }

  if (session.step === "bank_name") {
    if (text.length < 2) errorMessage = "Укажите банк или сервис получателя. Например: Revolut, Wise, N26";
    else payload.bank_name = text;
  }

  if (session.step === "iban") {
    if (text.length < 5) errorMessage = "Укажите IBAN или реквизиты получения. Минимум 5 символов.";
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
    await sendTelegramMessage(
      message.chat.id,
      noSessionMessage()
    );
    return;
  }

  await handleStep(message, session);
}
