import { NextResponse } from "next/server";
import {
  handleOperatorCallback,
  handleOperatorMessage,
  type OperatorCallbackQuery,
  type OperatorTelegramMessage,
} from "@/lib/telegram/operator-notifications";

type OperatorTelegramUpdate = {
  callback_query?: OperatorCallbackQuery;
  message?: OperatorTelegramMessage;
};

function isAuthorized(request: Request) {
  const secret = process.env.OPERATOR_TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;

  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "operator-telegram-webhook" });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = (await request.json()) as OperatorTelegramUpdate;

    if (update.callback_query) {
      await handleOperatorCallback(update.callback_query);
    }

    if (update.message?.text) {
      await handleOperatorMessage(update.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Operator Telegram webhook error", error);
    return NextResponse.json({ ok: true });
  }
}
