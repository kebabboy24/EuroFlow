import Link from "next/link";
import ExchangeCalculator from "@/components/ExchangeCalculator";

export default function HomePage() {
  return (
    <main>
      <div className="container hero">
        <section>
          <span className="badge">⚡ Быстрый обмен между СНГ и Европой</span>
          <h1>Ваши деньги.<br/><span className="gradient">Один понятный поток.</span></h1>
          <p className="lead">
            EuroFlow помогает студентам и семьям переводить RUB, UAH, KZT, GEL и USDT
            в евро — с понятной комиссией, поддержкой и уведомлениями.
          </p>
          <div className="hero-buttons">
            <Link className="btn btn-primary" href="/exchange">Начать обмен</Link>
            <Link className="btn" href="#advantages">Как это работает</Link>
          </div>
        </section>
        <ExchangeCalculator />
      </div>

      <section id="advantages" className="container features">
        <article className="card feature"><div>🛡️</div><h3>Безопасность</h3><p>Секреты находятся на сервере, а доступ к заявкам защищается авторизацией.</p></article>
        <article className="card feature"><div>⚡</div><h3>Быстрые заявки</h3><p>Данные заявки сразу поступают оператору EuroFlow в Telegram.</p></article>
        <article className="card feature"><div>📊</div><h3>История</h3><p>Пользователь видит свои обмены и текущий статус каждой заявки.</p></article>
        <article className="card feature"><div>🎓</div><h3>Для студентов</h3><p>Интерфейс и поддержка ориентированы на студентов из стран СНГ в Австрии.</p></article>
      </section>
    </main>
  );
}
