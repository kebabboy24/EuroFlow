import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateRate } from "@/lib/rates/engine";
import OrderForm from "@/components/OrderForm";

const allowedReceiveCurrencies = new Set(["EUR", "USD", "USDT"]);

export default async function ExchangePage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; amount?: string; receiveCurrency?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const currency = (params.currency || "RUB").toUpperCase();
  const requestedReceiveCurrency = (params.receiveCurrency || "EUR").toUpperCase();
  const receiveCurrency =
    allowedReceiveCurrencies.has(requestedReceiveCurrency) && requestedReceiveCurrency !== currency
      ? requestedReceiveCurrency
      : currency === "EUR" ? "USD" : "EUR";
  const amount = params.amount || "100000";
  const calculated = await calculateRate({
    from: currency,
    to: receiveCurrency,
    amount: Number(amount) || 0,
  });
  const receive = calculated.receiveAmount.toFixed(receiveCurrency === "USDT" ? 4 : 2);

  return (
    <main className="page">
      <div className="container">
        <div style={{ maxWidth: 720, margin: "auto" }}>
          <div className="small">Новый обмен</div>
          <h1 style={{ fontSize: 50 }}>Оформить обмен</h1>
          <OrderForm
            initialCurrency={currency}
            initialReceiveCurrency={receiveCurrency}
            initialAmount={amount}
            initialReceive={receive}
            userEmail={user.email || ""}
          />
        </div>
      </div>
    </main>
  );
}
