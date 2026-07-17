import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateRate } from "@/lib/rates/engine";
import OrderForm from "@/components/OrderForm";

export default async function ExchangePage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; amount?: string; receive?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const currency = (params.currency || "RUB").toUpperCase();
  const amount = params.amount || "100000";
  const calculated = await calculateRate({
    from: currency,
    to: "EUR",
    amount: Number(amount) || 0,
    direction: "buy_eur",
  });
  const receive = calculated.receiveAmount.toFixed(2);

  return (
    <main className="page">
      <div className="container">
        <div style={{ maxWidth: 720, margin: "auto" }}>
          <div className="small">Новый обмен</div>
          <h1 style={{ fontSize: 50 }}>Оформить обмен</h1>
          <OrderForm
            initialCurrency={currency}
            initialAmount={amount}
            initialReceive={receive}
            userEmail={user.email || ""}
          />
        </div>
      </div>
    </main>
  );
}
