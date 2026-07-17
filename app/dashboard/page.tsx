import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardIcon from "@/components/DashboardIcon";
import { createClient } from "@/lib/supabase/server";

function statusLabel(status: string | null) {
  const value = (status || "new").toLowerCase();

  if (["completed", "done", "выполнено"].includes(value)) return "Выполнено";
  if (["processing", "in_progress", "в обработке"].includes(value)) return "В обработке";
  if (["cancelled", "canceled", "отменено"].includes(value)) return "Отменено";
  if (["awaiting_requisites", "ожидает реквизиты"].includes(value)) return "Ожидает реквизиты";
  if (["awaiting_payment", "waiting_payment", "ожидает оплаты"].includes(value)) return "Ожидает оплату";
  if (["paid", "оплачено"].includes(value)) return "Оплачено";

  return "Новая";
}

function statusClass(status: string | null) {
  const label = statusLabel(status);

  if (label === "Выполнено") return "status-completed";
  if (label === "В обработке") return "status-processing";
  if (label === "Отменено") return "status-cancelled";
  if (["Ожидает реквизиты", "Ожидает оплату"].includes(label)) return "status-waiting";
  if (label === "Оплачено") return "status-processing";

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
    (order) => ["Ожидает реквизиты", "Ожидает оплату", "Оплачено", "В обработке"].includes(statusLabel(order.status))
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
              <span className="nav-icon"><DashboardIcon name="dashboard" /></span> Обзор
            </Link>
            <Link href="/dashboard#orders">
              <span className="nav-icon"><DashboardIcon name="orders" /></span> Мои обмены
            </Link>
            <Link href="/profile">
              <span className="nav-icon"><DashboardIcon name="profile" /></span> Профиль
            </Link>
            <Link href="/exchange">
              <span className="nav-icon"><DashboardIcon name="newOrder" /></span> Новый обмен
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
              Обмен создан и отправлен оператору.
            </div>
          )}

          <header className="dashboard-header">
            <div>
              <span className="dashboard-kicker">Личный кабинет</span>
              <h1>Добро пожаловать, {name}!</h1>
              <p>Здесь находятся ваши обмены и данные аккаунта.</p>
            </div>

            <Link className="btn btn-primary dashboard-create" href="/exchange">
              <DashboardIcon name="newOrder" /> Обменять
            </Link>
          </header>

          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-icon stat-blue"><DashboardIcon name="totalOrders" /></span>
              <div>
                <small>Всего заявок</small>
                <strong>{allOrders.length}</strong>
                <p>за всё время</p>
              </div>
            </article>

            <article className="stat-card">
              <span className="stat-icon stat-orange"><DashboardIcon name="processing" /></span>
              <div>
                <small>В обработке</small>
                <strong>{processing}</strong>
                <p>активные обмены</p>
              </div>
            </article>

            <article className="stat-card">
              <span className="stat-icon stat-green"><DashboardIcon name="completed" /></span>
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
                <h2>Мои обмены</h2>
              </div>
              <Link href="/exchange">Новый обмен →</Link>
            </div>

            {!allOrders.length ? (
              <div className="empty-state">
                <div className="empty-icon"><DashboardIcon name="orders" /></div>
                <h3>У вас пока нет обменов</h3>
                <p>
                  Создайте первый обмен, и он появится здесь вместе со статусом
                  и деталями обмена.
                </p>
                <Link className="btn btn-primary" href="/exchange">
                  Обменять
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
