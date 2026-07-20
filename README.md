# EuroFlow Next

Новая версия EuroFlow на Next.js + Supabase + Vercel + Telegram.

## 1. Supabase

Открой SQL Editor в Supabase, вставь содержимое `supabase/schema.sql` и нажми Run.

Для нового пошагового создания заявки также выполни:

`supabase/order-payment-methods.sql`

Для flow ожидания реквизитов после создания обмена выполни:

`supabase/payment-requisites-flow.sql`

В Authentication → URL Configuration добавь:
- Site URL: адрес будущего сайта Vercel
- Redirect URL: `https://ВАШ-ДОМЕН.vercel.app/**`

## 2. Локальный запуск

Создай `.env.local` по образцу `.env.example`.

```bash
npm install
npm run dev
```

## 3. Vercel Environment Variables

Добавь:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `OPERATOR_TELEGRAM_BOT_TOKEN` — админ-бот, который присылает все новые обмены оператору
- `OPERATOR_TELEGRAM_CHAT_ID` — твой chat id или id группы, куда админ-бот присылает заказы
- `OPERATOR_TELEGRAM_WEBHOOK_SECRET` — секрет webhook для кнопок и сообщений админ-бота
- `OPERATOR_API_SECRET` — секрет для защищённого добавления реквизитов оператором
- `CLIENT_TELEGRAM_BOT_TOKEN` — клиентский бот, которому пишут пользователи
- `CLIENT_TELEGRAM_WEBHOOK_SECRET` — секрет webhook для клиентского бота
- `TELEGRAM_BOT_TOKEN` — legacy fallback, если новый operator/client token не задан
- `TELEGRAM_CHAT_ID` — legacy fallback для operator chat id
- `EUROFLOW_RATE_MARGIN_PERCENT` — маржа курса, по умолчанию 6, допустимо 5–7
- `EUROFLOW_RUB_PER_EUR_FALLBACK` — ручной fallback RUB/EUR, если P2P API недоступны
- `EUROFLOW_P2P_RUB_ASSET` — P2P-актив для RUB, по умолчанию USDT
- `EUROFLOW_P2P_RUB_ASSET_TO_EUR` — курс P2P-актива к EUR для пересчёта RUB/EUR
- `EUROFLOW_P2P_MIN_RUB_LIMIT` — минимальный лимит RUB-объявления для фильтра P2P
- `EUROFLOW_UAH_TO_EUR_FALLBACK`, `EUROFLOW_KZT_TO_EUR_FALLBACK`, `EUROFLOW_GEL_TO_EUR_FALLBACK`, `EUROFLOW_TRY_TO_EUR_FALLBACK` — ручные fallback-курсы
- `EUROFLOW_USD_TO_EUR_FALLBACK`, `EUROFLOW_USDT_TO_EUR_FALLBACK` — кросс-курсы для расчёта получения USD/USDT

Telegram tokens, webhook secret и Supabase Secret key отметь как Sensitive. Никогда не коммить реальные токены в GitHub.

## 4. Payment Methods

Список валют, стран, банков и способов оплаты редактируется в:

`lib/exchange/payment-methods.ts`

Структура расширяемая: Currency → Country/Region → Bank/Method → required fields. Для длинных списков банков интерфейс показывает поиск и популярные методы сверху.

## 5. Rate Engine

Калькулятор курса работает через server-side route:

`/api/rates?from=RUB&to=EUR&amount=100000&direction=buy_eur`

Для RUB, UAH, KZT, GEL и TRY engine пытается получить P2P-объявления Binance, затем Bybit. Базовый маршрут использует локальную валюту к USDT; для EUR и USD применяется кросс-курс. Объявления фильтруются по лимитам, отклонению от медианы, подозрительным ценам, completion rate и количеству сделок, затем берутся позиции 5–7 и применяется скрытая маржа EuroFlow. Если P2P API недоступны, используются ручные fallback-курсы из environment variables.

Маржа задаётся через `EUROFLOW_RATE_MARGIN_PERCENT` и ограничена диапазоном 5–7%.

## 6. Telegram Bot

Для заказов через Telegram открой Supabase SQL Editor и выполни:

`supabase/telegram-orders.sql`

В EuroFlow теперь две разные роли Telegram-ботов:

- operator/admin bot: только получает уведомления о заказах;
- client bot: общается с клиентами и создаёт обмены внутри Telegram.

В Vercel Environment Variables добавь:

- `OPERATOR_TELEGRAM_BOT_TOKEN` — токен нового админ-бота;
- `OPERATOR_TELEGRAM_CHAT_ID` — твой chat id или id операторской группы;
- `OPERATOR_TELEGRAM_WEBHOOK_SECRET` — случайная строка для защиты webhook админ-бота;
- `CLIENT_TELEGRAM_BOT_TOKEN` — токен клиентского бота;
- `CLIENT_TELEGRAM_WEBHOOK_SECRET` — случайная строка для защиты webhook.

Старые переменные `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` остаются fallback, но для двух ботов лучше использовать новые имена.

После деплоя на Vercel подключи webhook только к клиентскому боту:

```bash
curl "https://api.telegram.org/bot$CLIENT_TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://ВАШ-ДОМЕН.vercel.app/api/telegram/webhook" \
  -d "secret_token=$CLIENT_TELEGRAM_WEBHOOK_SECRET"
```

Пользователь создает обмен командой `/order`, бот пошагово собирает данные и сохраняет заказ в `orders`.

Админ-бот получает заказы через `sendMessage` по `OPERATOR_TELEGRAM_CHAT_ID`. Чтобы кнопка «Добавить реквизиты» и ответы с реквизитами работали прямо в Telegram, подключи webhook админ-бота:

```bash
curl "https://api.telegram.org/bot$OPERATOR_TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://ВАШ-ДОМЕН.vercel.app/api/telegram/operator" \
  -d "secret_token=$OPERATOR_TELEGRAM_WEBHOOK_SECRET"
```

Webhook админ-бота принимает callback-кнопки и сообщения оператора здесь:

`/api/telegram/operator`

Чтобы проверить админ-бота после входа на сайт, открой:

`/api/telegram/test-notify`

Если тестовое сообщение пришло, `OPERATOR_TELEGRAM_BOT_TOKEN` и `OPERATOR_TELEGRAM_CHAT_ID` настроены правильно.

## 7. Реквизиты оплаты

После создания обмена клиент видит экран «Получаем реквизиты». Сайт обновляет заказ каждые несколько секунд и покажет оплату только после того, как оператор добавит реальные реквизиты.

До появления админ-панели оператор может добавить реквизиты защищённым endpoint:

```bash
curl -X POST "https://ВАШ-ДОМЕН.vercel.app/api/operator/orders/ORDER_ID/requisites" \
  -H "Content-Type: application/json" \
  -H "x-operator-api-secret: $OPERATOR_API_SECRET" \
  -d '{
    "method":"card",
    "bankName":"Сбербанк",
    "recipientName":"Ivan Ivanov",
    "cardNumber":"0000000000000000",
    "phoneNumber":null,
    "iban":null,
    "walletAddress":null,
    "comment":"EF-ORDER",
    "expiresAt":"2026-07-17 18:00"
  }'
```

Endpoint сохраняет `payment_requisites`, ставит статус `awaiting_payment`, и клиентский экран автоматически переключается на реквизиты. Реальные карты, токены и секреты нельзя хранить в коде или GitHub.

Также доступна простая операторская страница:

`/operator`

Открой её после входа на сайт, вставь `OPERATOR_API_SECRET`, загрузи активные обмены и отправь реквизиты клиенту через форму. Секрет хранится только в текущей вкладке браузера и не попадает в клиентский код.

Если хочешь работать только через админ-бота, нажми под уведомлением заказа кнопку «Добавить реквизиты».

Перед первым использованием выполни в Supabase SQL Editor:

`supabase/operator-requisites-wizard.sql`

После нажатия «Добавить реквизиты» бот проведёт оператора по коротким шагам: способ оплаты, банк, получатель, реквизит, комментарий, срок действия и проверка. После подтверждения заказ автоматически станет `awaiting_payment`, а клиент увидит реквизиты на сайте. Состояние мастера хранится в Supabase и не сбрасывается при новом запросе Vercel.

Старая команда остаётся запасным вариантом:

```text
/requisites ORDER_ID
method: card
bankName: Сбербанк
recipientName: Иван Иванов
cardNumber: 0000000000000000
phoneNumber:
iban:
walletAddress:
comment: EF-ORDER
expiresAt: сегодня до 18:00
```

После этого заказ станет `awaiting_payment`, а клиент на сайте автоматически увидит реквизиты.

## 8. Деплой

Создай новый GitHub-репозиторий `euroflow-next`, загрузите файлы и импортируй его в Vercel.

## Важно

Это MVP. Перед реальным запуском финансового сервиса нужны:
- юридическая проверка деятельности;
- KYC/AML;
- политика конфиденциальности и условия;
- защищённая админ-панель;
- аудит безопасности;
- защита от спама и rate limiting.


## Profile and avatar setup

Before using the new profile page, open Supabase SQL Editor and run:

`supabase/profile-and-avatar.sql`

This creates:

- the `profiles` table;
- Row Level Security policies;
- the public `avatars` Storage bucket;
- upload/update/delete policies for each user's own avatar folder.
