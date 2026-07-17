import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateRate } from "@/lib/rates/engine";
import { insertOrderWithSchemaFallback } from "@/lib/orders/insert-order";
import { sendOperatorOrderNotification } from "@/lib/telegram/operator-notifications";

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
      payment_requisites: null,
      rate_value: Number(body.rate_value),
      bank_name: clean(body.receive_bank || body.bank_name, 120),
      iban: clean(body.payout_details || body.iban, 180),
      comment: clean(body.comment, 500),
      status: "awaiting_requisites",
    };

    if (!order.full_name || !order.telegram || !Number.isFinite(order.send_amount)) {
      return NextResponse.json({ error: "Заполните обязательные поля." }, { status: 400 });
    }

    const rate = await calculateRate({
      from: order.send_currency,
      to: order.receive_currency,
      amount: order.send_amount,
    });
    order.receive_amount = Number(rate.receiveAmount.toFixed(2));
    order.rate_value = Number(rate.finalRate.toFixed(8));
    const marginPercent = Number(rate.marginPercent.toFixed(1));

    const { data, error, omittedColumns } = await insertOrderWithSchemaFallback(supabase, order);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Не удалось сохранить заявку." }, { status: 500 });

    const telegramNotification = await sendOperatorOrderNotification({
      ...order,
      id: data.id,
      source: "website",
      created_at: typeof data.created_at === "string" ? data.created_at : null,
      base_rate: Number(rate.baseRate.toFixed(8)),
      margin_percent: marginPercent,
      estimated_profit: Number(rate.estimatedProfit.toFixed(2)),
      rate_source: rate.source,
      operator_note: "Клиент ожидает реквизиты на сайте.",
    });
    if (!telegramNotification.ok) {
      console.error("Telegram order notification failed", telegramNotification);
    }

    return NextResponse.json({ ok: true, order: data, omittedColumns, telegramNotification });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера." }, { status: 500 });
  }
}
