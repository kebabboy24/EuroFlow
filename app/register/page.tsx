"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(""); setErrorText(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        data: { full_name: String(form.get("name")) },
        emailRedirectTo: `${location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) return setErrorText(error.message);
    setMessage("Аккаунт создан. Проверьте почту и подтвердите email.");
    e.currentTarget.reset();
  }

  return (
    <main className="auth-shell">
      <div className="card">
        <div className="small">EuroFlow account</div>
        <h1>Регистрация</h1>
        <form className="form" onSubmit={submit}>
          <input name="name" placeholder="Имя и фамилия" required/>
          <input name="email" type="email" placeholder="Email" required/>
          <input name="password" type="password" placeholder="Пароль — минимум 6 символов" minLength={6} required/>
          {errorText && <div className="error">{errorText}</div>}
          {message && <div className="success">{message}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Создаём…" : "Создать аккаунт"}</button>
        </form>
        <p className="small">Уже зарегистрированы? <Link href="/login">Войти</Link></p>
      </div>
    </main>
  );
}
