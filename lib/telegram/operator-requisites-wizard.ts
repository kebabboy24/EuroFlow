import {
  normalizePaymentRequisites,
  savePaymentRequisites,
  type PaymentRequisitesInput,
} from "@/lib/orders/payment-requisites";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  answerOperatorCallback,
  isOperatorChat,
  sendOperatorChatMessage,
  type OperatorCallbackQuery,
  type OperatorTelegramMessage,
  type TelegramInlineKeyboard,
} from "@/lib/telegram/operator-notifications";

type RequisiteKind = "card" | "phone" | "iban" | "wallet";

type WizardStep =
  | "method"
  | "bank"
  | "bank_manual"
  | "recipient"
  | "detail"
  | "comment"
  | "comment_manual"
  | "expires"
  | "expires_manual"
  | "preview";

type WizardPayload = PaymentRequisitesInput & {
  detailKind?: RequisiteKind;
  suggestedBank?: string | null;
  defaultComment?: string | null;
};

type WizardSession = {
  chat_id: number | string;
  order_id: string;
  step: WizardStep;
  payload: WizardPayload;
};

type TelegramButton = {
  text: string;
  callback_data: string;
};

const POPULAR_BANKS: Record<string, string> = {
  sber: "Сбербанк",
  tbank: "Т-Банк",
  alfa: "Альфа-Банк",
};

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function formatOrderId(orderId: string) {
  return `#EF-${orderId.slice(0, 8).toUpperCase()}`;
}

function defaultReference(order: Record<string, any>) {
  return clean(order.payment_reference, 180) || `EF-${String(order.id).slice(0, 8).toUpperCase()}`;
}

function inferRequisiteKind(order: Record<string, any>): RequisiteKind {
  const source = `${order.send_method || ""} ${order.send_bank || ""}`.toLowerCase();
  if (source.includes("iban") || source.includes("sepa")) return "iban";
  if (source.includes("телефон") || source.includes("сбп") || source.includes("phone")) return "phone";
  if (source.includes("wallet") || source.includes("кошел") || source.includes("usdt")) return "wallet";
  return "card";
}

function methodLabel(kind?: RequisiteKind) {
  const labels: Record<RequisiteKind, string> = {
    card: "Карта",
    phone: "Телефон",
    iban: "IBAN",
    wallet: "Кошелек",
  };
  return kind ? labels[kind] : "Не выбран";
}

function detailLabel(kind?: RequisiteKind) {
  const labels: Record<RequisiteKind, string> = {
    card: "Номер карты",
    phone: "Номер телефона",
    iban: "IBAN",
    wallet: "Адрес кошелька",
  };
  return kind ? labels[kind] : "Реквизит";
}

function detailValue(payload: WizardPayload) {
  if (payload.detailKind === "phone") return payload.phoneNumber;
  if (payload.detailKind === "iban") return payload.iban;
  if (payload.detailKind === "wallet") return payload.walletAddress;
  return payload.cardNumber;
}

function callback(action: string, orderId: string) {
  return `op:req:${action}:${orderId}`;
}

function keyboard(rows: TelegramButton[][]): TelegramInlineKeyboard {
  return { inline_keyboard: rows };
}

function methodKeyboard(orderId: string) {
  return keyboard([
    [
      { text: "Карта", callback_data: callback("m:c", orderId) },
      { text: "Телефон", callback_data: callback("m:p", orderId) },
    ],
    [
      { text: "IBAN", callback_data: callback("m:i", orderId) },
      { text: "Кошелек", callback_data: callback("m:w", orderId) },
    ],
    [{ text: "Пропустить", callback_data: callback("m:s", orderId) }],
  ]);
}

function bankKeyboard(orderId: string, suggestedBank?: string | null) {
  const rows: TelegramButton[][] = [];
  if (suggestedBank) {
    rows.push([
      {
        text: `Использовать: ${suggestedBank}`.slice(0, 60),
        callback_data: callback("b:selected", orderId),
      },
    ]);
  }

  rows.push(
    [
      { text: "Сбербанк", callback_data: callback("b:sber", orderId) },
      { text: "Т-Банк", callback_data: callback("b:tbank", orderId) },
    ],
    [
      { text: "Альфа-Банк", callback_data: callback("b:alfa", orderId) },
      { text: "Ввести вручную", callback_data: callback("b:manual", orderId) },
    ]
  );

  return keyboard(rows);
}

function commentKeyboard(orderId: string, defaultComment: string) {
  return keyboard([
    [{ text: `Использовать ${defaultComment}`.slice(0, 60), callback_data: callback("c:def", orderId) }],
    [
      { text: "Ввести вручную", callback_data: callback("c:manual", orderId) },
      { text: "Без комментария", callback_data: callback("c:none", orderId) },
    ],
  ]);
}

function expiresKeyboard(orderId: string) {
  return keyboard([
    [
      { text: "Сегодня до 18:00", callback_data: callback("e:18", orderId) },
      { text: "Сегодня до 22:00", callback_data: callback("e:22", orderId) },
    ],
    [
      { text: "30 минут", callback_data: callback("e:30", orderId) },
      { text: "1 час", callback_data: callback("e:60", orderId) },
    ],
    [
      { text: "Без срока", callback_data: callback("e:none", orderId) },
      { text: "Ввести вручную", callback_data: callback("e:manual", orderId) },
    ],
  ]);
}

function previewKeyboard(orderId: string) {
  return keyboard([
    [{ text: "Отправить клиенту", callback_data: callback("confirm", orderId) }],
    [
      { text: "Изменить", callback_data: callback("edit", orderId) },
      { text: "Отменить", callback_data: callback("cancel", orderId) },
    ],
  ]);
}

function methodPrompt(chatId: number | string, orderId: string) {
  return sendOperatorChatMessage(
    chatId,
    ["Шаг 1 из 7", "", "Выберите способ оплаты"].join("\n"),
    methodKeyboard(orderId)
  );
}

function bankPrompt(session: WizardSession) {
  return sendOperatorChatMessage(
    session.chat_id,
    ["Шаг 2 из 7", "", "Выберите банк / способ"].join("\n"),
    bankKeyboard(session.order_id, session.payload.suggestedBank)
  );
}

function recipientPrompt(session: WizardSession) {
  return sendOperatorChatMessage(
    session.chat_id,
    ["Шаг 3 из 7", "", "Введите имя получателя"].join("\n")
  );
}

function detailPrompt(session: WizardSession) {
  return sendOperatorChatMessage(
    session.chat_id,
    ["Шаг 4 из 7", "", `Введите: ${detailLabel(session.payload.detailKind)}`].join("\n")
  );
}

function commentPrompt(session: WizardSession) {
  const value = session.payload.defaultComment || `EF-${session.order_id.slice(0, 8).toUpperCase()}`;
  return sendOperatorChatMessage(
    session.chat_id,
    ["Шаг 5 из 7", "", "Введите комментарий к переводу"].join("\n"),
    commentKeyboard(session.order_id, value)
  );
}

function expiresPrompt(session: WizardSession) {
  return sendOperatorChatMessage(
    session.chat_id,
    ["Шаг 6 из 7", "", "Срок действия реквизитов"].join("\n"),
    expiresKeyboard(session.order_id)
  );
}

function previewText(session: WizardSession) {
  return [
    "Шаг 7 из 7",
    "",
    "Проверьте реквизиты",
    "",
    `Обмен: ${formatOrderId(session.order_id)}`,
    `Способ: ${methodLabel(session.payload.detailKind)}`,
    `Банк: ${session.payload.bankName || "—"}`,
    `Получатель: ${session.payload.recipientName || "—"}`,
    `${detailLabel(session.payload.detailKind)}: ${detailValue(session.payload) || "—"}`,
    `Комментарий: ${session.payload.comment || "нет"}`,
    `Действуют до: ${session.payload.expiresAt || "без срока"}`,
  ].join("\n");
}

function previewPrompt(session: WizardSession) {
  return sendOperatorChatMessage(
    session.chat_id,
    previewText(session),
    previewKeyboard(session.order_id)
  );
}

async function getOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, any> | null;
}

async function getSession(chatId: number | string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("operator_requisites_sessions")
    .select("chat_id, order_id, step, payload")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) throw error;
  return data as WizardSession | null;
}

async function saveSession(session: WizardSession) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("operator_requisites_sessions").upsert({
    ...session,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

async function deleteSession(chatId: number | string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("operator_requisites_sessions")
    .delete()
    .eq("chat_id", chatId);

  if (error) throw error;
}

async function requireSession(chatId: number | string, orderId: string) {
  const session = await getSession(chatId);
  if (!session || session.order_id !== orderId) return null;
  return session;
}

async function startWizard(callbackQuery: OperatorCallbackQuery, orderId: string) {
  const chatId = callbackQuery.message?.chat?.id;
  if (!chatId) return;

  const order = await getOrder(orderId);
  if (!order) {
    await answerOperatorCallback(callbackQuery.id, "Обмен не найден", true);
    return;
  }

  const session: WizardSession = {
    chat_id: chatId,
    order_id: orderId,
    step: "method",
    payload: {
      detailKind: inferRequisiteKind(order),
      suggestedBank: clean(order.send_bank || order.send_method, 160) || null,
      defaultComment: defaultReference(order),
    },
  };

  await saveSession(session);
  await answerOperatorCallback(callbackQuery.id, "Мастер реквизитов открыт");
  await methodPrompt(chatId, orderId);
}

function setDetail(payload: WizardPayload, value: string) {
  const next: WizardPayload = {
    ...payload,
    cardNumber: null,
    phoneNumber: null,
    iban: null,
    walletAddress: null,
  };
  if (payload.detailKind === "phone") next.phoneNumber = value;
  else if (payload.detailKind === "iban") next.iban = value;
  else if (payload.detailKind === "wallet") next.walletAddress = value;
  else next.cardNumber = value;
  return next;
}

function relativeExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toLocaleString("ru-RU", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function handleMethodAction(session: WizardSession, code: string) {
  const methods: Record<string, RequisiteKind> = {
    c: "card",
    p: "phone",
    i: "iban",
    w: "wallet",
  };
  const detailKind = code === "s" ? session.payload.detailKind || "card" : methods[code];
  if (!detailKind) return false;

  const next = {
    ...session,
    step: "bank" as const,
    payload: { ...session.payload, detailKind, method: detailKind },
  };
  await saveSession(next);
  await bankPrompt(next);
  return true;
}

async function handleBankAction(session: WizardSession, code: string) {
  if (code === "manual") {
    const next = { ...session, step: "bank_manual" as const };
    await saveSession(next);
    await sendOperatorChatMessage(session.chat_id, ["Шаг 2 из 7", "", "Введите банк / способ"].join("\n"));
    return true;
  }

  const bankName = code === "selected" ? session.payload.suggestedBank : POPULAR_BANKS[code];
  if (!bankName) return false;

  const next = {
    ...session,
    step: "recipient" as const,
    payload: { ...session.payload, bankName },
  };
  await saveSession(next);
  await recipientPrompt(next);
  return true;
}

async function handleCommentAction(session: WizardSession, code: string) {
  if (code === "manual") {
    const next = { ...session, step: "comment_manual" as const };
    await saveSession(next);
    await sendOperatorChatMessage(session.chat_id, ["Шаг 5 из 7", "", "Введите комментарий к переводу"].join("\n"));
    return true;
  }

  if (!["def", "none"].includes(code)) return false;
  const comment = code === "def" ? session.payload.defaultComment || "" : "";
  const next = {
    ...session,
    step: "expires" as const,
    payload: { ...session.payload, comment },
  };
  await saveSession(next);
  await expiresPrompt(next);
  return true;
}

async function handleExpiresAction(session: WizardSession, code: string) {
  if (code === "manual") {
    const next = { ...session, step: "expires_manual" as const };
    await saveSession(next);
    await sendOperatorChatMessage(session.chat_id, ["Шаг 6 из 7", "", "Введите срок действия"].join("\n"));
    return true;
  }

  const values: Record<string, string | null> = {
    "18": "Сегодня до 18:00",
    "22": "Сегодня до 22:00",
    "30": relativeExpiry(30),
    "60": relativeExpiry(60),
    none: null,
  };
  if (!(code in values)) return false;

  const next = {
    ...session,
    step: "preview" as const,
    payload: { ...session.payload, expiresAt: values[code] },
  };
  await saveSession(next);
  await previewPrompt(next);
  return true;
}

async function confirmWizard(session: WizardSession, callbackQuery: OperatorCallbackQuery) {
  const payload = normalizePaymentRequisites(session.payload as Record<string, unknown>);
  const { data, error } = await savePaymentRequisites(session.order_id, payload as Record<string, unknown>);

  if (error || !data) {
    await answerOperatorCallback(callbackQuery.id, error?.message || "Не удалось отправить реквизиты", true);
    return;
  }

  await deleteSession(session.chat_id);
  await answerOperatorCallback(callbackQuery.id, "Реквизиты отправлены");
  await sendOperatorChatMessage(
    session.chat_id,
    [
      "Реквизиты отправлены клиенту",
      "",
      `Обмен: ${formatOrderId(session.order_id)}`,
      "Статус: Ожидает оплату",
    ].join("\n")
  );
}

export async function handleOperatorRequisitesCallback(callbackQuery: OperatorCallbackQuery) {
  const data = callbackQuery.data || "";
  if (!data.startsWith("op:req:")) return false;

  const chatId = callbackQuery.message?.chat?.id;
  if (!isOperatorChat(chatId)) {
    await answerOperatorCallback(callbackQuery.id, "Недоступно", true);
    return true;
  }

  const parts = data.split(":");
  const orderId = parts.at(-1) || "";
  const action = parts[2] || "";
  const code = parts[3] || "";

  try {
    if (action === "start") {
      await startWizard(callbackQuery, orderId);
      return true;
    }

    if (!chatId) return true;
    const session = await requireSession(chatId, orderId);
    if (!session) {
      await answerOperatorCallback(callbackQuery.id, "Сессия устарела. Нажмите «Добавить реквизиты» ещё раз.", true);
      return true;
    }

    if (action === "cancel") {
      await deleteSession(chatId);
      await answerOperatorCallback(callbackQuery.id, "Заполнение отменено");
      await sendOperatorChatMessage(chatId, `Добавление реквизитов для ${formatOrderId(orderId)} отменено.`);
      return true;
    }

    if (action === "edit") {
      const next = { ...session, step: "method" as const };
      await saveSession(next);
      await answerOperatorCallback(callbackQuery.id, "Начинаем заново");
      await methodPrompt(chatId, orderId);
      return true;
    }

    if (action === "confirm") {
      await confirmWizard(session, callbackQuery);
      return true;
    }

    let handled = false;
    if (action === "m") handled = await handleMethodAction(session, code);
    if (action === "b") handled = await handleBankAction(session, code);
    if (action === "c") handled = await handleCommentAction(session, code);
    if (action === "e") handled = await handleExpiresAction(session, code);

    await answerOperatorCallback(callbackQuery.id, handled ? "Готово" : "Неизвестное действие", !handled);
    return true;
  } catch (error) {
    console.error("Operator requisites wizard callback failed", error);
    await answerOperatorCallback(callbackQuery.id, "Не удалось продолжить. Попробуйте ещё раз.", true);
    return true;
  }
}

export async function handleOperatorRequisitesMessage(message: OperatorTelegramMessage) {
  if (!message.text || !isOperatorChat(message.chat.id)) return false;
  if (/^\/(requisites|start|help)\b/i.test(message.text)) return false;

  try {
    const session = await getSession(message.chat.id);
    if (!session) return false;

    if (message.text === "/cancel") {
      await deleteSession(message.chat.id);
      await sendOperatorChatMessage(message.chat.id, "Добавление реквизитов отменено.");
      return true;
    }

    const value = clean(message.text);
    if (!value) {
      await sendOperatorChatMessage(message.chat.id, "Введите значение текстом.");
      return true;
    }

    if (session.step === "bank_manual") {
      const next = {
        ...session,
        step: "recipient" as const,
        payload: { ...session.payload, bankName: value },
      };
      await saveSession(next);
      await recipientPrompt(next);
      return true;
    }

    if (session.step === "recipient") {
      const next = {
        ...session,
        step: "detail" as const,
        payload: { ...session.payload, recipientName: value },
      };
      await saveSession(next);
      await detailPrompt(next);
      return true;
    }

    if (session.step === "detail") {
      const next = {
        ...session,
        step: "comment" as const,
        payload: setDetail(session.payload, value),
      };
      await saveSession(next);
      await commentPrompt(next);
      return true;
    }

    if (session.step === "comment_manual") {
      const next = {
        ...session,
        step: "expires" as const,
        payload: { ...session.payload, comment: value },
      };
      await saveSession(next);
      await expiresPrompt(next);
      return true;
    }

    if (session.step === "expires_manual") {
      const next = {
        ...session,
        step: "preview" as const,
        payload: { ...session.payload, expiresAt: value },
      };
      await saveSession(next);
      await previewPrompt(next);
      return true;
    }

    await sendOperatorChatMessage(message.chat.id, "Используйте кнопки под последним сообщением.");
    return true;
  } catch (error) {
    console.error("Operator requisites wizard message failed", error);
    await sendOperatorChatMessage(message.chat.id, "Не удалось сохранить ответ. Попробуйте ещё раз.");
    return true;
  }
}
