import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "EuroFlow — обмен валют для студентов",
  description: "Обмен валют между СНГ и Европой",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ru">
      <body>
        <header className="nav">
          <div className="container nav-inner">
            <Link href="/" className="brand">
              <span className="logo">EF</span>
              <span>EuroFlow</span>
            </Link>
            <nav className="nav-links">
              <Link href="/#exchange">Обмен</Link>
              <Link href="/#advantages">Преимущества</Link>
              <Link href="/dashboard">Заявки</Link>
            </nav>
            <div className="actions">
              {user ? (
                <>
                  <Link className="btn desktop" href="/dashboard">Кабинет</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link className="btn desktop" href="/login">Войти</Link>
                  <Link className="btn btn-primary" href="/register">Регистрация</Link>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">© 2026 EuroFlow. Демонстрационная версия.</div>
        </footer>
      </body>
    </html>
  );
}
