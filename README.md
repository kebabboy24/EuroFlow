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
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Токен Telegram и Secret key отметь как Sensitive.

## 4. Деплой

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
