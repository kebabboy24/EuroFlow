# EuroFlow Development Rules

## Project Stack

EuroFlow uses Next.js, TypeScript, Supabase, Vercel, and a Telegram Bot.

## Development Guidelines

- All UI changes must support both light and dark themes.
- The interface must be responsive across desktop, tablet, and mobile layouts.
- Reuse existing components and styles whenever possible. Do not create duplicate components, utilities, or styling patterns unless there is a clear need.
- Never store secrets, API keys, tokens, or credentials in source code or GitHub. Use environment variables and the appropriate deployment or platform secret storage.
- Before making large changes, analyze the project structure and existing patterns first.
- After making changes, propose a short git commit message that summarizes the work.
