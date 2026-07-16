import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{created?:string}> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const params = await searchParams;

  return (
    <main className="page">
      <div className="container">
        {params.created && <div className="success" style={{marginBottom:16}}>Заявка создана и отправлена оператору.</div>}
        <div className="dashboard-grid">
          <section>
            <div className="small">Личный кабинет</div>
            <h1 style={{fontSize:52}}>Ваши заявки</h1>
            <div className="card" style={{padding:0}}>
              {!orders?.length ? (
                <div style={{padding:24}}>
                  <p className="small">У вас пока нет заявок.</p>
                  <Link className="btn btn-primary" href="/exchange">Создать первую</Link>
                </div>
              ) : orders.map(order => (
                <article className="order" key={order.id}>
                  <div className="order-top">
                    <div>
                      <b>{order.send_amount} {order.send_currency} → {order.receive_amount} EUR</b>
                      <div className="small">{new Date(order.created_at).toLocaleString("ru-RU")}</div>
                    </div>
                    <span className="status">{order.status}</span>
                  </div>
                  <div className="small" style={{marginTop:10}}>Банк: {order.bank_name}</div>
                </article>
              ))}
            </div>
          </section>
          <aside>
            <div className="card">
              <h3>Профиль</h3>
              <p className="small">{user.email}</p>
              <Link className="btn btn-primary" href="/exchange">Новая заявка</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
