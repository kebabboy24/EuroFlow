import Link from "next/link";
import ExchangeCalculator from "@/components/ExchangeCalculator";

type IconName = "plus" | "check" | "plane" | "currency" | "bolt" | "lock" | "percent" | "support";

const trustItems: { icon: IconName; title: string; description: string }[] = [
  { icon: "bolt", title: "Быстро", description: "Обычно 10–30 минут" },
  { icon: "lock", title: "Безопасно", description: "Защита данных и средств" },
  { icon: "percent", title: "Выгодно", description: "P2P-ориентир и маржа" },
  { icon: "support", title: "Поддержка 24/7", description: "Мы всегда на связи" },
];

const steps: { number: string; icon: IconName; title: string; description: string }[] = [
  { number: "01", icon: "plus", title: "Создайте заявку", description: "Укажите сумму, валюту и реквизиты." },
  { number: "02", icon: "check", title: "Подтвердите детали", description: "Оператор фиксирует курс." },
  { number: "03", icon: "plane", title: "Отправьте средства", description: "Переведите деньги по реквизитам." },
  { number: "04", icon: "currency", title: "Получите евро", description: "Перевод поступает на карту или IBAN." },
];

function SiteIcon({ name }: { name: IconName }) {
  if (name === "plus") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12.5 4.2 4.2L19 7" />
      </svg>
    );
  }

  if (name === "plane") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 4 3.8 11.1c-.8.3-.8 1.4.1 1.7l6.2 2.1 2.1 6.2c.3.9 1.4.9 1.7.1L21 4Z" />
        <path d="m10.1 14.9 4.5-4.5" />
      </svg>
    );
  }

  if (name === "currency") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 7.2h7.8M8 12h6.2M8 16.8h7.8" />
        <path d="M14.6 4.4a7.6 7.6 0 1 0 0 15.2" />
        <path d="M17.6 8.2h2.7v8.1h-2.7" />
      </svg>
    );
  }

  if (name === "bolt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2 4.6 13.2h6.2L10 22l8.6-12.4h-6.4L13 2Z" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10V8a5 5 0 0 1 10 0v2" />
        <path d="M6.5 10h11A1.5 1.5 0 0 1 19 11.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z" />
      </svg>
    );
  }

  if (name === "percent") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 18 12-12" />
        <path d="M7.4 8.5a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
        <path d="M16.6 19.3a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 13.5v-2a7.5 7.5 0 0 1 15 0v2" />
      <path d="M4.5 13.5h3v5h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
      <path d="M16.5 13.5h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3v-5Z" />
      <path d="M15.5 20c-1 .7-2.2 1-3.5 1" />
    </svg>
  );
}

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
        {trustItems.map((item) => (
          <div key={item.title}>
            <span className="feature-icon">
              <SiteIcon name={item.icon} />
            </span>
            <b>{item.title}</b>
            <small>{item.description}</small>
          </div>
        ))}
      </section>

      <section id="how" className="container section">
        <small className="kicker">Как это работает</small>
        <h2>Четыре понятных шага</h2>
        <div className="steps">
          {steps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <i>
                <SiteIcon name={step.icon} />
              </i>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
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
