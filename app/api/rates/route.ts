import { NextResponse } from "next/server";
import { calculateRate, type RateDirection } from "@/lib/rates/engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "RUB";
  const to = searchParams.get("to") || "EUR";
  const amount = Number(searchParams.get("amount") || "0");
  const direction = searchParams.get("direction") as RateDirection | null;

  try {
    const rate = await calculateRate({
      from,
      to,
      amount,
      direction: direction || undefined,
    });

    return NextResponse.json(rate, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rate unavailable" },
      { status: 400 }
    );
  }
}
