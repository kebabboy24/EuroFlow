import { redirect } from "next/navigation";
import Link from "next/link";
import OperatorOrdersPanel from "@/components/operator/OperatorOrdersPanel";
import { createClient } from "@/lib/supabase/server";

export default async function OperatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="dashboard-page">
      <div className="operator-shell">
        <div className="profile-page-top">
          <div>
            <span className="dashboard-kicker">Оператор EuroFlow</span>
            <h1>Реквизиты для обменов</h1>
            <p>Добавляйте реальные реквизиты только после проверки обмена.</p>
          </div>
          <Link className="btn" href="/dashboard">
            ← В кабинет
          </Link>
        </div>

        <OperatorOrdersPanel />
      </div>
    </main>
  );
}
