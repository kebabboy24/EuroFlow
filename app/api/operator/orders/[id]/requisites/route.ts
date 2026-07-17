import { NextResponse } from "next/server";
import { savePaymentRequisites } from "@/lib/orders/payment-requisites";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isAuthorized(request: Request) {
  const secret = process.env.OPERATOR_API_SECRET;
  if (!secret) return false;

  const headerSecret = request.headers.get("x-operator-api-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerSecret === secret || bearer === secret;
}

export async function POST(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { data, error } = await savePaymentRequisites(id, body);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, order: data });
}
