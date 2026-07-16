import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Необходим вход." }, { status: 401 });

    const body = await request.json();
    const order = {
      user_id: user.id,
      full_name: clean(body.full_name, 120),
      email: clean(body.email, 180),
      telegram: clean(body.telegram, 80),
      send_amount: Number(body.send_amount),
      send_currency: clean(body.send_currency, 10),
      receive_amount: Number(body.receive_amount),
      receive_currency: "EUR",
      bank_name: clean(body.bank_name, 120),
      iban: clean(body.iban, 180),
      comment: clean(body.comment, 500),
      status: "Новая",
    };

    if (!order.full_name || !order.telegram || !Number.isFinite(order.send_amount) || !Number.isFinite(order.receive_amount)) {
      return NextResponse.json({ error: "Заполните обязательные поля." }, { status: 400 });
    }

    const { data, error } = await supabase.from("orders").insert(order).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const text = [
        "🟣 Новая заявка EuroFlow",
        "",
        `🆔 ${data.id}`,
        `👤 ${order.full_name}`,
        `📧 ${order.email}`,
        `📱 ${order.telegram}`,
        "",
        `💸 Отправляет: ${order.send_amount} ${order.send_currency}`,
        `💶 Получает: ${order.receive_amount} EUR`,
        `🏦 Банк: ${order.bank_name}`,
        `💳 Реквизиты: ${order.iban}`,
        order.comment ? `📝 ${order.comment}` : "",
      ].filter(Boolean).join("\n");

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера." }, { status: 500 });
  }
}
