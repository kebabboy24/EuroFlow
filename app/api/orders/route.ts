import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateRate } from "@/lib/rates/engine";
import { insertOrderWithSchemaFallback } from "@/lib/orders/insert-order";

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function paymentReference() {
  return `EF-${Date.now().toString(36).toUpperCase()}`;
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
      receive_currency: clean(body.receive_currency || "EUR", 10),
      send_region: clean(body.send_region, 80),
      send_method: clean(body.send_method, 120),
      send_bank: clean(body.send_bank, 160),
      receive_region: clean(body.receive_region, 80),
      receive_method: clean(body.receive_method, 120),
      receive_bank: clean(body.receive_bank || body.bank_name, 160),
      payout_details: clean(body.payout_details || body.iban, 600),
      payment_reference: paymentReference(),
      rate_value: Number(body.rate_value),
      bank_name: clean(body.receive_bank || body.bank_name, 120),
      iban: clean(body.payout_details || body.iban, 180),
      comment: clean(body.comment, 500),
      status: "Новая",
    };

    if (!order.full_name || !order.telegram || !Number.isFinite(order.send_amount)) {
      return NextResponse.json({ error: "Заполните обязательные поля." }, { status: 400 });
    }

    const rate = await calculateRate({
      from: order.send_currency,
      to: order.receive_currency,
      amount: order.send_amount,
      direction: "buy_eur",
    });
    order.receive_amount = Number(rate.receiveAmount.toFixed(2));
    order.rate_value = Number(rate.rate.toFixed(8));

    const { data, error, omittedColumns } = await insertOrderWithSchemaFallback(supabase, order);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Не удалось сохранить заявку." }, { status: 500 });

    const token = process.env.TELEGRAM_NOTIFY_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
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
        `💸 Клиент отправляет: ${order.send_amount} ${order.send_currency}`,
        `🏦 Банк/метод отправки: ${order.send_bank || order.send_method || "Не указан"}`,
        `💶 Клиент получает: ${order.receive_amount} ${order.receive_currency}`,
        `🏦 Банк/метод получения: ${order.receive_bank || order.receive_method || "Не указан"}`,
        `💳 Реквизиты получения: ${order.payout_details}`,
        `📈 Курс: 1 ${order.send_currency} = ${order.rate_value} ${order.receive_currency}`,
        `🔖 Комментарий к оплате: ${order.payment_reference}`,
        `📌 Статус: ${order.status}`,
        order.comment ? `📝 ${order.comment}` : "",
      ].filter(Boolean).join("\n");

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }

    return NextResponse.json({ ok: true, order: data, omittedColumns });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера." }, { status: 500 });
  }
}
