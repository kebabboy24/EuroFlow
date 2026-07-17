import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const result = await currentUserOrder(cleanId(id));

  if (!result.user) return NextResponse.json({ error: result.error }, { status: 401 });
  if (!result.order) return NextResponse.json({ error: result.error }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (body.action !== "mark_paid") {
    return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
  }

  const { data, error } = await result.supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", result.order.id)
    .eq("user_id", result.user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, order: data });
}
