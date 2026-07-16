import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function statusLabel(status: string | null) {
  const value = (status || "new").toLowerCase();

  if (["completed", "done", "выполнено"].includes(value)) return "Выполнено";
  if (["processing", "in_progress", "в обработке"].includes(value)) return "В обработке";
  if (["cancelled", "canceled", "отменено"].includes(value)) return "Отменено";
  if (["waiting_payment", "ожидает оплаты"].includes(value)) return "Ожидает оплаты";

  return "Новая";
}

function statusClass(status: string | null) {
  const label = statusLabel(status);

  if (label === "Выполнено") return "status-completed";
  if (label === "В обработке") return "status-processing";
  if (label === "Отменено") return "status-cancelled";
  if (label === "Ожидает оплаты") return "status-waiting";

  return "status-new";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: orders }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const params = await searchParams;
  const allOrders = orders || [];
  const processing = allOrders.filter(
    (order) => statusLabel(order.status) === "В обработке"
  ).length;
  const completed = allOrders.filter(
    (order) => statusLabel(order.status) === "Выполнено"
  ).length;

  const name =
    profile?.full_name?.trim().split(" ")[0] ||
    user.email?.split("@")[0] ||
    "пользователь";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div>
              <strong>{profile?.full_name || name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <nav className="sidebar-nav">
            <Link className="active" href="/dashboard">
              <span>⌂</span> Обзор
            </Link>
            <Link href="/dashboard#orders">
              <span>▤</span> Мои заявки
            </Link>
            <Link href="/profile">
              <span>◉</span> Профиль
            </Link>
            <Link href="/exchange">
              <span>＋</span> Новая заявка
            </Link>
          </nav>

          <div className="sidebar-help">
            <strong>Нужна помощь?</strong>
            <p>Напишите нашей поддержке в Telegram.</p>
            <a className="btn" href="https://t.me/" target="_blank">
              Поддержка
            </a>
          </div>
        </aside>

        <section className="dashboard-content">
          {params.created && (
            <div className="success dashboard-alert">
              Заявка создана и отправлена оператору.
            </div>
          )}

          <header className="dashboard-header">
            <div>
              <span className="dashboard-kicker">Личный кабинет</span>
              <h1>Добро пожаловать, {name}!</h1>
              <p>Здесь находятся ваши заявки и данные аккаунта.</p>
            </div>

            <Link className="btn btn-primary dashboard-create" href="/exchange">
              ＋ Создать заявку
            </Link>
          </header>

          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-icon stat-blue">▤</span>
              <div>
                <small>Всего заявок</small>
                <strong>{allOrders.length}</strong>
                <p>за всё время</p>
              </div>
            </article>

            <article className="stat-card">
              <span className="stat-icon stat-orange">◷</span>
              <div>
                <small>В обработке</small>
                <strong>{processing}</strong>
                <p>активные заявки</p>
              </div>
            </article>

            <article className="stat-card">
              <span className="stat-icon stat-green">✓</span>
              <div>
                <small>Выполнено</small>
                <strong>{completed}</strong>
                <p>успешные обмены</p>
              </div>
            </article>
          </div>

          <section id="orders" className="dashboard-card orders-section">
            <div className="card-heading">
              <div>
                <span className="dashboard-kicker">История операций</span>
                <h2>Мои заявки</h2>
              </div>
              <Link href="/exchange">Новая заявка →</Link>
            </div>

            {!allOrders.length ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>У вас пока нет заявок</h3>
                <p>
                  Создайте первую заявку, и она появится здесь вместе со статусом
                  и деталями обмена.
                </p>
                <Link className="btn btn-primary" href="/exchange">
                  Создать первую заявку
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {allOrders.map((order, index) => (
                  <article className="dashboard-order" key={order.id}>
                    <div className="order-number">
                      <strong>
                        #EF-{String(allOrders.length - index).padStart(5, "0")}
                      </strong>
                      <small>
                        {new Date(order.created_at).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>

                    <div className="order-exchange">
                      <strong>
                        {order.send_currency} <span>→</span> {order.receive_currency || "EUR"}
                      </strong>
                      <small>
                        {Number(order.send_amount).toLocaleString("ru-RU")}{" "}
                        {order.send_currency} →{" "}
                        {Number(order.receive_amount).toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        EUR
                      </small>
                    </div>

                    <div className="order-bank">
                      <small>Получение</small>
                      <strong>{order.receive_bank || order.bank_name || "Не указано"}</strong>
                    </div>

                    <span className={`status-pill ${statusClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
