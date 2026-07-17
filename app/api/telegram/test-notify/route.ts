import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Необходим вход." }, { status: 401 });
  }

  const result = await sendTelegramNotification([
    "✅ EuroFlow test notification",
    "",
    "Если ты видишь это сообщение, OPERATOR_TELEGRAM_BOT_TOKEN и OPERATOR_TELEGRAM_CHAT_ID настроены правильно.",
  ].join("\n"));

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
