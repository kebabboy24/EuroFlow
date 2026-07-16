import Link from "next/link";
import ExchangeCalculator from "@/components/ExchangeCalculator";

export default function HomePage() {
  return (
    <main>
      <section className="container hero">
        <div>
          <div className="eyebrow">◇ Надёжный обмен валют для людей из СНГ в Европе</div>
          <h1>Обменивайте валюту<br/><span>быстро и безопасно</span></h1>
          <p className="lead">
            Принимаем RUB, UAH, KZT, GEL и USDT и переводим евро на вашу карту в Европе.
            Прозрачный курс, понятная комиссия и поддержка на русском.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/exchange">Создать заявку →</Link>
            <Link className="btn" href="#how">Как это работает</Link>
          </div>
          <div className="trust-grid">
            <div><b>⚡ 10–30 мин</b><small>Среднее время обмена</small></div>
            <div><b>◇ Безопасно</b><small>Защита данных</small></div>
            <div><b>% Прозрачно</b><small>Без скрытых комиссий</small></div>
            <div><b>◉ Поддержка</b><small>На русском языке</small></div>
          </div>
        </div>
        <ExchangeCalculator />
      </section>

      <section id="how" className="container section">
        <small className="kicker">Как это работает</small>
        <h2>Четыре простых шага</h2>
        <div className="steps">
          {[
            ["01","▤","Создайте заявку","Укажите сумму, валюту и реквизиты."],
            ["02","➤","Подтвердите детали","Оператор фиксирует курс."],
            ["03","◷","Отправьте средства","Переведите деньги по реквизитам."],
            ["04","▭","Получите евро","Перевод поступает на карту или IBAN."]
          ].map(([n,i,t,d]) => (
            <article key={n}><span>{n}</span><i>{i}</i><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
      </section>

      <section id="advantages" className="container section advantages">
        <div>
          <small className="kicker">Почему EuroFlow</small>
          <h2>Сделано для студентов и семей в Европе</h2>
          <ul>
            <li>Основные валюты СНГ</li>
            <li>EUR-карты и IBAN</li>
            <li>Курс и комиссия заранее</li>
            <li>История заявок в кабинете</li>
          </ul>
        </div>
        <aside><small className="kicker">Рейтинг</small><strong>4.9</strong><div>★★★★★</div><p>Минималистичный и понятный сервис.</p></aside>
      </section>
    </main>
  );
}
