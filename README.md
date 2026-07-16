# EuroFlow Next

Новая версия EuroFlow на Next.js + Supabase + Vercel + Telegram.

## 1. Supabase

Открой SQL Editor в Supabase, вставь содержимое `supabase/schema.sql` и нажми Run.

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
- `TELEGRAM_BOT_TOKEN` — бот, которому пишут клиенты
- `TELEGRAM_NOTIFY_BOT_TOKEN` — бот, который присылает заявки оператору
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`
- `EUROFLOW_RATE_MARGIN_PERCENT` — маржа курса, по умолчанию 6, допустимо 5–7
- `EUROFLOW_RUB_PER_EUR_FALLBACK` — ручной fallback RUB/EUR, если P2P API недоступны
- `EUROFLOW_P2P_RUB_ASSET` — P2P-актив для RUB, по умолчанию USDT
- `EUROFLOW_P2P_RUB_ASSET_TO_EUR` — курс P2P-актива к EUR для пересчёта RUB/EUR
- `EUROFLOW_P2P_MIN_RUB_LIMIT` — минимальный лимит объявления для фильтра P2P

Telegram tokens и Secret key отметь как Sensitive.

## 4. Rate Engine

Калькулятор курса работает через server-side route:

`/api/rates?from=RUB&to=EUR&amount=100000&direction=buy_eur`

Для RUB engine пытается получить P2P-объявления Binance, затем Bybit. По умолчанию используется ликвидная пара `USDT/RUB`, затем ориентир переводится в RUB/EUR через `EUROFLOW_P2P_RUB_ASSET_TO_EUR`. Объявления фильтруются по лимитам, отклонению от медианы, подозрительным ценам, completion rate и количеству сделок, затем берутся позиции 5–7 и применяется маржа EuroFlow. Если P2P API недоступны, используется `EUROFLOW_RUB_PER_EUR_FALLBACK`.

Маржа задаётся через `EUROFLOW_RATE_MARGIN_PERCENT` и ограничена диапазоном 5–7%.

## 5. Telegram Bot

Для заказов через Telegram открой Supabase SQL Editor и выполни:

`supabase/telegram-orders.sql`

После деплоя на Vercel подключи webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://ВАШ-ДОМЕН.vercel.app/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Пользователь создает заявку командой `/order`, бот пошагово собирает данные и сохраняет заявку в `orders`.

Если используется два Telegram-бота, webhook подключай к клиентскому боту из `TELEGRAM_BOT_TOKEN`. Уведомления оператору будут отправляться через `TELEGRAM_NOTIFY_BOT_TOKEN`. Если `TELEGRAM_NOTIFY_BOT_TOKEN` не задан, уведомления отправятся через клиентского бота.

## 6. Деплой

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
