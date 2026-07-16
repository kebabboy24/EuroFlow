import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderForm from "@/components/OrderForm";

export default async function ExchangePage({ searchParams }: { searchParams: Promise<{currency?: string; amount?: string}> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  return (
    <main className="page">
      <div className="container">
        <div style={{maxWidth:720, margin:"auto"}}>
          <div className="small">Новая заявка</div>
          <h1 style={{fontSize:50}}>Оформить обмен</h1>
          <OrderForm initialCurrency={params.currency || "RUB"} initialAmount={params.amount || "100000"} userEmail={user.email || ""}/>
        </div>
      </div>
    </main>
  );
}
