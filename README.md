# EuroFlow Next

Новая версия EuroFlow на Next.js + Supabase + Vercel + Telegram.

## 1. Supabase

Открой SQL Editor в Supabase, вставь содержимое `supabase/schema.sql` и нажми Run.

Для нового пошагового создания заявки также выполни:

`supabase/order-payment-methods.sql`

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
- `CLIENT_TELEGRAM_BOT_TOKEN` — клиентский бот, которому пишут пользователи
- `CLIENT_TELEGRAM_WEBHOOK_SECRET` — секрет webhook для клиентского бота
- `TELEGRAM_BOT_TOKEN` — legacy fallback, если новый operator/client token не задан
- `TELEGRAM_CHAT_ID` — legacy fallback для operator chat id
- `EUROFLOW_RATE_MARGIN_PERCENT` — маржа курса, по умолчанию 6, допустимо 5–7
- `EUROFLOW_RUB_PER_EUR_FALLBACK` — ручной fallback RUB/EUR, если P2P API недоступны
- `EUROFLOW_P2P_RUB_ASSET` — P2P-актив для RUB, по умолчанию USDT
- `EUROFLOW_P2P_RUB_ASSET_TO_EUR` — курс P2P-актива к EUR для пересчёта RUB/EUR
- `EUROFLOW_P2P_MIN_RUB_LIMIT` — минимальный лимит объявления для фильтра P2P

Telegram tokens, webhook secret и Supabase Secret key отметь как Sensitive. Никогда не коммить реальные токены в GitHub.

## 4. Payment Methods

Список валют, стран, банков и способов оплаты редактируется в:

`lib/exchange/payment-methods.ts`

Структура расширяемая: Currency → Country/Region → Bank/Method → required fields. Для длинных списков банков интерфейс показывает поиск и популярные методы сверху.

## 5. Rate Engine

Калькулятор курса работает через server-side route:

`/api/rates?from=RUB&to=EUR&amount=100000&direction=buy_eur`

Для RUB engine пытается получить P2P-объявления Binance, затем Bybit. По умолчанию используется ликвидная пара `USDT/RUB`, затем ориентир переводится в RUB/EUR через `EUROFLOW_P2P_RUB_ASSET_TO_EUR`. Объявления фильтруются по лимитам, отклонению от медианы, подозрительным ценам, completion rate и количеству сделок, затем берутся позиции 5–7 и применяется маржа EuroFlow. Если P2P API недоступны, используется `EUROFLOW_RUB_PER_EUR_FALLBACK`.

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

Админ-боту webhook не нужен для получения заказов. Он отправляет уведомления через `sendMessage` по `OPERATOR_TELEGRAM_CHAT_ID`. Inline-кнопки под уведомлением уже добавлены; если позже подключить webhook админ-бота, безопасный placeholder находится здесь:

`/api/telegram/operator`

Чтобы проверить админ-бота после входа на сайт, открой:

`/api/telegram/test-notify`

Если тестовое сообщение пришло, `OPERATOR_TELEGRAM_BOT_TOKEN` и `OPERATOR_TELEGRAM_CHAT_ID` настроены правильно.

## 7. Деплой

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
