import { NextResponse } from "next/server";
import {
  handleOperatorCallback,
  type OperatorCallbackQuery,
} from "@/lib/telegram/operator-notifications";

type OperatorTelegramUpdate = {
  callback_query?: OperatorCallbackQuery;
};

export async function GET() {
  return NextResponse.json({ ok: true, service: "operator-telegram-webhook" });
}

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as OperatorTelegramUpdate;

    if (update.callback_query) {
      await handleOperatorCallback(update.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Operator Telegram webhook error", error);
    return NextResponse.json({ ok: true });
  }
}
