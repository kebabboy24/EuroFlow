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
          <svg className="europe-planet" viewBox="0 0 620 520">
            <defs>
              <radialGradient id="globeSurface" cx="38%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
                <stop offset="42%" stopColor="#eef4ff" stopOpacity="0.9" />
                <stop offset="78%" stopColor="#dfe8ff" stopOpacity="0.54" />
                <stop offset="100%" stopColor="#cdd8ff" stopOpacity="0.18" />
              </radialGradient>
              <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1557ff" />
                <stop offset="100%" stopColor="#12d7c7" />
              </linearGradient>
              <radialGradient id="euroCenterGlow" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#8b8cff" />
                <stop offset="100%" stopColor="#1557ff" />
              </radialGradient>
              <pattern id="globeDots" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" fill="#1557ff" opacity="0.18" />
              </pattern>
              <clipPath id="globeClip">
                <circle cx="310" cy="260" r="215" />
              </clipPath>
            </defs>

            <ellipse className="planet-shadow" cx="310" cy="490" rx="150" ry="22" />
            <circle className="planet-rim" cx="310" cy="260" r="215" />
            <g clipPath="url(#globeClip)">
              <circle className="planet-surface" cx="310" cy="260" r="215" />
              <rect className="globe-dot-field" x="82" y="28" width="456" height="456" fill="url(#globeDots)" />
              <path className="globe-grid" d="M102 206c91-38 292-46 416-8M96 260c113-31 314-31 428 0M122 319c93 33 270 39 388 10M202 55c-68 119-71 291-9 411M310 42c-28 125-30 311 0 438M420 58c67 119 70 286 9 407" />
              <path className="surrounding-land" d="M158 192l48-23 50 7 23 25-19 35-61 10-47-20 6-34ZM154 280l56 10 34 38-14 50-55 22-49-35 4-52 24-33ZM402 150l58 14 42 37-30 33-58-13-38-42 26-29ZM411 302l74 20 23 49-47 39-66-12-29-49 45-47Z" />
              <path className="europe-core" d="M258 168l45-20 49 13 24 28 44 6 27 35-20 37 27 31-20 53-45 8-29 41-55-7-28-35-49 11-36-34 14-50-34-33 22-43 44-6 20-33Z" />
              <path className="europe-detail" d="M274 184l-22 39 26 31-18 39 31 39 50-5 30 38 35-39-25-39 28-46-45-14-22-32-42 10-26-21Z" />
            </g>

            <path className="payment-arc" d="M310 268 C222 202 181 174 139 168" />
            <path className="payment-arc" d="M310 268 C207 247 151 246 94 270" />
            <path className="payment-arc" d="M310 268 C202 320 151 358 111 410" />
            <path className="payment-arc" d="M310 268 C382 187 436 159 497 151" />
            <path className="payment-arc" d="M310 268 C420 258 481 286 532 326" />
            <path className="payment-arc" d="M310 268 C357 361 377 412 382 466" />
            <circle className="payment-node" cx="139" cy="168" r="8" />
            <circle className="payment-node" cx="94" cy="270" r="8" />
            <circle className="payment-node" cx="111" cy="410" r="8" />
            <circle className="payment-node" cx="497" cy="151" r="8" />
            <circle className="payment-node" cx="532" cy="326" r="8" />
            <circle className="payment-node" cx="382" cy="466" r="8" />
            <circle className="euro-badge-ring" cx="310" cy="268" r="42" />
            <circle className="euro-badge" cx="310" cy="268" r="31" />
            <text className="euro-symbol" x="310" y="280" textAnchor="middle">€</text>
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
