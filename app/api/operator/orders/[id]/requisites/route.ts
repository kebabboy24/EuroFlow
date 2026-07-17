import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PaymentRequisites = {
  method?: string;
  bankName?: string;
  recipientName?: string;
  cardNumber?: string | null;
  phoneNumber?: string | null;
  iban?: string | null;
  walletAddress?: string | null;
  comment?: string;
  expiresAt?: string | null;
};

function isAuthorized(request: Request) {
  const secret = process.env.OPERATOR_API_SECRET;
  if (!secret) return false;

  const headerSecret = request.headers.get("x-operator-api-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerSecret === secret || bearer === secret;
}

function clean(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function optional(value: unknown, max = 300) {
  const text = clean(value, max);
  return text || null;
}

function normalizeRequisites(body: Record<string, unknown>): PaymentRequisites {
  const source = (body.payment_requisites || body.requisites || body) as Record<string, unknown>;

  return {
    method: clean(source.method, 120),
    bankName: clean(source.bankName, 160),
    recipientName: clean(source.recipientName, 160),
    cardNumber: optional(source.cardNumber, 80),
    phoneNumber: optional(source.phoneNumber, 80),
    iban: optional(source.iban, 120),
    walletAddress: optional(source.walletAddress, 180),
    comment: clean(source.comment, 180),
    expiresAt: optional(source.expiresAt, 80),
  };
}

export async function POST(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const payment_requisites = normalizeRequisites(body);

  if (!payment_requisites.method && !payment_requisites.bankName) {
    return NextResponse.json({ error: "Укажите банк или способ оплаты." }, { status: 400 });
  }

  if (
    !payment_requisites.cardNumber &&
    !payment_requisites.phoneNumber &&
    !payment_requisites.iban &&
    !payment_requisites.walletAddress
  ) {
    return NextResponse.json({ error: "Укажите хотя бы один реквизит для оплаты." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_requisites, status: "awaiting_payment" })
    .eq("id", String(id).trim())
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, order: data });
}
