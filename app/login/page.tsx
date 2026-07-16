"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="small">EuroFlow account</div>
        <h1>Войти</h1>
        <form className="form" onSubmit={submit}>
          <input name="email" type="email" placeholder="Email" required/>
          <input name="password" type="password" placeholder="Пароль" minLength={6} required/>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Входим…" : "Войти"}</button>
        </form>
        <p className="small">Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></p>
      </div>
    </main>
  );
}
