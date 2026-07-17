import { NextResponse } from "next/server";
import {
  handleTelegramOrderMessage,
  type TelegramMessage,
} from "@/lib/telegram/order-flow";

type TelegramUpdate = {
  message?: TelegramMessage;
};

function isAuthorized(request: Request) {
  const secret = process.env.CLIENT_TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;

  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;

    if (update.message?.text) {
      await handleTelegramOrderMessage(update.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: true });
  }
}
