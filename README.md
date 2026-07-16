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

Telegram tokens и Secret key отметь как Sensitive.

## 4. Telegram Bot

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

## 5. Деплой

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
