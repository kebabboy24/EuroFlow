import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOperatorTelegramMessage } from "@/lib/telegram/operator-notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function cleanId(value: string) {
  return String(value || "").trim();
}

async function currentUserOrder(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, order: null, error: "Необходим вход." };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { supabase, user, order: null, error: error.message };
  if (!data) return { supabase, user, order: null, error: "Обмен не найден." };

  return { supabase, user, order: data, error: null };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await currentUserOrder(cleanId(id));

  if (!result.user) return NextResponse.json({ error: result.error }, { status: 401 });
  if (!result.order) return NextResponse.json({ error: result.error }, { status: 404 });

  return NextResponse.json({ ok: true, order: result.order });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const orderId = cleanId(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Необходим вход." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.action !== "mark_paid") {
    return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existingOrder, error: readError } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (readError) {
    console.error("Mark paid order read failed", readError);
    return NextResponse.json({ error: "Не удалось найти обмен." }, { status: 500 });
  }
  if (!existingOrder) return NextResponse.json({ error: "Обмен не найден." }, { status: 404 });
  if (existingOrder.user_id !== user.id) {
    return NextResponse.json({ error: "Нет доступа к этому обмену." }, { status: 403 });
  }
  if (existingOrder.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Оплату можно отметить только после выдачи реквизитов." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: now, updated_at: now })
    .eq("id", existingOrder.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Mark paid order update failed", error);
    return NextResponse.json({ error: "Не удалось отметить оплату." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Обмен не найден." }, { status: 404 });

  const message = [
    "Клиент отметил оплату",
    "",
    `Обмен: #EF-${String(data.id).slice(0, 8).toUpperCase()}`,
    `Статус: paid`,
    "",
    `Клиент: ${data.full_name || "—"}`,
    `Telegram: ${data.telegram || "—"}`,
    `Email: ${data.email || "—"}`,
    "",
    `Оплачено: ${Number(data.send_amount || 0).toLocaleString("ru-RU")} ${data.send_currency}`,
    `К получению: ${Number(data.receive_amount || 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${data.receive_currency}`,
    `Банк / способ: ${data.send_bank || data.send_method || data.payment_requisites?.bankName || data.payment_requisites?.method || "—"}`,
    "",
    "Проверьте перевод и начните обработку обмена.",
  ].join("\n");

  const notification = await sendOperatorTelegramMessage(message);
  if (!notification.ok) console.error("Operator paid notification failed", notification);

  return NextResponse.json({ ok: true, order: data });
}
