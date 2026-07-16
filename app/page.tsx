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
        <path d="M3.5 15.4h3.1l3.6-2.1c.8-.5 1.8-.7 2.7-.5l2.6.5c.8.2 1.3.9 1.1 1.7-.1.5-.5.9-1 1.1l-3.4.8" />
        <path d="M6.6 18.6h7.1c1 0 1.9-.3 2.7-.9l4-3.1c.7-.5.8-1.5.3-2.2-.5-.7-1.5-.8-2.2-.3l-2.9 2.1" />
        <path d="M3.5 12.7v7.2" />
        <circle cx="14.2" cy="6.9" r="4.1" />
        <path d="M12.6 6h3M12.6 7.7h2.4" />
        <path d="M15.6 4.3a3.4 3.4 0 1 0 0 5.2" />
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
          <svg className="europe-planet" viewBox="0 0 520 520">
            <defs>
              <radialGradient id="planetGlow" cx="42%" cy="38%" r="64%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#eaf4ff" stopOpacity="0.64" />
                <stop offset="100%" stopColor="#cfe3ff" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="heroAccentGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1557ff" />
                <stop offset="100%" stopColor="#12d7c7" />
              </linearGradient>
              <clipPath id="planetClip">
                <circle cx="260" cy="260" r="205" />
              </clipPath>
            </defs>

            <circle className="planet-shell" cx="260" cy="260" r="205" />
            <g clipPath="url(#planetClip)">
              <circle className="planet-fill" cx="260" cy="260" r="205" />
              <path className="planet-grid" d="M76 205c82-35 243-44 368-8M64 263c104-30 275-32 395-2M93 324c90 25 242 31 350 5M167 75c-55 112-58 259-8 370M260 54c-22 116-24 287 0 410M354 76c54 112 57 258 9 367" />
              <path className="europe-land" d="M212 164l33-18 42 9 22 23 38 6 26 30-13 34 27 26-13 45-35 9-25 38-47-4-23-34-40 8-29-28 12-43-29-27 16-38 36-5 4-31Z" />
              <path className="europe-land soft" d="M167 270l31 5 22 31-12 46-39 17-33-30 6-43 25-26Z" />
              <path className="europe-land soft" d="M319 126l42 10 34 33-20 24-43-10-27-33 14-24Z" />
              <path className="coast-line" d="M231 170l-18 38 20 28-16 34 27 34 41-4 25 34 35-36-23-35 22-40-37-11-18-29-34 7-24-20Z" />
            </g>

            <path className="payment-route route-one" d="M282 225 C365 138 421 123 477 104" />
            <path className="payment-route route-two" d="M282 225 C390 260 430 325 468 394" />
            <path className="payment-route route-three" d="M282 225 C195 300 126 329 64 357" />
            <path className="payment-route route-four" d="M282 225 C246 126 207 85 149 50" />
            <circle className="payment-hub" cx="282" cy="225" r="8" />
            <circle className="payment-node node-one" cx="477" cy="104" r="7" />
            <circle className="payment-node node-two" cx="468" cy="394" r="7" />
            <circle className="payment-node node-three" cx="64" cy="357" r="7" />
            <circle className="payment-node node-four" cx="149" cy="50" r="7" />
          </svg>
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
