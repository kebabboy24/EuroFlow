import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "EuroFlow — обмен валют",
  description: "Обмен валют между СНГ и Европой",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <header className="nav">
          <div className="container nav-inner">
            <BrandLogo />
            <nav className="nav-links">
              <Link href="/">Главная</Link>
              <Link href="/#how">Как это работает</Link>
              <Link href="/#advantages">О нас</Link>
              <Link href="/#reviews">Отзывы</Link>
              <Link href="/#faq">FAQ</Link>
            </nav>
            <div className="actions">
              <ThemeToggle />
              {user ? (
                <>
                  <Link className="btn desktop" href="/dashboard">Кабинет</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link className="btn desktop" href="/login">Войти</Link>
                  <Link className="btn btn-primary" href="/exchange">Обменять</Link>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container footer-inner">
            <BrandLogo />
            <span>© 2026 EuroFlow</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
