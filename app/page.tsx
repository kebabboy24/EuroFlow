import Link from "next/link";
import ExchangeCalculator from "@/components/ExchangeCalculator";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="container hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>◇</span>
            Надёжный обмен валют для людей из СНГ в Европе
          </div>
          <h1>
            Обменивайте валюту
            <br />
            <span>быстро и безопасно</span>
          </h1>
          <p className="lead">
            Принимаем RUB, UAH, KZT, GEL и USDT и переводим евро на вашу карту в Европе.
            P2P-ориентир, понятная маржа и поддержка на русском.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/exchange">
              Создать заявку →
            </Link>
            <Link className="btn btn-ghost" href="#how">
              Как это работает
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="globe-orbit orbit-one" />
          <div className="globe-orbit orbit-two" />
          <div className="globe-dot dot-one" />
          <div className="globe-dot dot-two" />
          <div className="globe-dot dot-three" />
        </div>
        <ExchangeCalculator />
      </section>

      <section className="container trust-grid" aria-label="Преимущества">
        <div>
          <span>↯</span>
          <b>Быстро</b>
          <small>Обычно 10–30 минут</small>
        </div>
        <div>
          <span>◇</span>
          <b>Безопасно</b>
          <small>Защита данных и средств</small>
        </div>
        <div>
          <span>%</span>
          <b>Выгодно</b>
          <small>P2P-ориентир и маржа</small>
        </div>
        <div>
          <span>◉</span>
          <b>Поддержка 24/7</b>
          <small>Мы всегда на связи</small>
        </div>
      </section>

      <section id="how" className="container section">
        <small className="kicker">Как это работает</small>
        <h2>Четыре понятных шага</h2>
        <div className="steps">
          {[
            ["01", "▤", "Создайте заявку", "Укажите сумму, валюту и реквизиты."],
            ["02", "➤", "Подтвердите детали", "Оператор фиксирует курс."],
            ["03", "◷", "Отправьте средства", "Переведите деньги по реквизитам."],
            ["04", "▭", "Получите евро", "Перевод поступает на карту или IBAN."],
          ].map(([n, i, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <i>{i}</i>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="advantages" className="container section advantages">
        <div>
          <small className="kicker">Почему EuroFlow</small>
          <h2>Сделано для студентов и семей в Европе</h2>
          <ul>
            <li>Работаем с популярными валютами СНГ</li>
            <li>Переводим на EUR-карты и IBAN</li>
            <li>Курс считается на сервере по P2P-рынку</li>
            <li>История заявок доступна в личном кабинете</li>
          </ul>
        </div>
        <aside>
          <small className="kicker">Отзывы клиентов</small>
          <strong>4.9</strong>
          <div>★★★★★</div>
          <p>На основе заявок пользователей, которым важны скорость и понятные условия.</p>
        </aside>
      </section>

      <section id="reviews" className="container section home-bottom">
        <div className="review-card">
          <small className="kicker">Почему выбирают EuroFlow</small>
          <ul>
            <li>Работаем по всей Европе</li>
            <li>Прозрачные условия до оплаты</li>
            <li>Без скрытых комиссий</li>
            <li>Поддержка на русском</li>
          </ul>
        </div>
        <div id="faq" className="faq-card">
          <small className="kicker">FAQ</small>
          {[
            ["Сколько времени занимает обмен?", "Обычно 10–30 минут после подтверждения деталей."],
            ["Какие валюты доступны?", "RUB, UAH, KZT, GEL, USDT и другие направления через оператора."],
            ["Безопасно ли это?", "Мы не просим PIN, CVV, пароли банка или SMS-коды."],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
