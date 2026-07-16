"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  full_name: string | null;
  phone: string | null;
  telegram: string | null;
  country: string | null;
  avatar_url: string | null;
};

export default function ProfileEditor({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: Profile;
}) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Выберите изображение.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Размер изображения не должен превышать 3 МБ.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
    setMessage("Аватар загружен. Нажмите «Сохранить изменения».");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);

    const payload = {
      id: userId,
      full_name: String(form.get("full_name") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      telegram: String(form.get("telegram") || "").trim() || null,
      country: String(form.get("country") || "").trim() || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Профиль успешно сохранён.");
    router.refresh();
  }

  const initials =
    profile.full_name?.trim().slice(0, 1).toUpperCase() ||
    email.slice(0, 1).toUpperCase();

  return (
    <form className="profile-editor" onSubmit={saveProfile}>
      <section className="dashboard-card profile-hero-card">
        <div className="avatar-editor">
          <button
            type="button"
            className="profile-avatar profile-avatar-large"
            onClick={() => inputRef.current?.click()}
            aria-label="Изменить аватар"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Аватар пользователя" />
            ) : (
              <span>{initials}</span>
            )}
            <span className="avatar-edit-badge">✎</span>
          </button>

          <input
            ref={inputRef}
            className="hidden-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={uploadAvatar}
          />

          <div>
            <h2>Фотография профиля</h2>
            <p>PNG, JPG или WebP. Максимальный размер — 3 МБ.</p>
            <button
              type="button"
              className="btn"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Загрузка…" : "Выбрать изображение"}
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-card profile-fields-card">
        <div className="card-heading">
          <div>
            <span className="dashboard-kicker">Личные данные</span>
            <h2>Настройки профиля</h2>
          </div>
        </div>

        <div className="profile-fields">
          <label>
            <span>Имя и фамилия</span>
            <input
              name="full_name"
              defaultValue={profile.full_name || ""}
              placeholder="Danil Khachyrashvili"
            />
          </label>

          <label>
            <span>Email</span>
            <input value={email} disabled />
          </label>

          <label>
            <span>Телефон</span>
            <input
              name="phone"
              defaultValue={profile.phone || ""}
              placeholder="+43 660 000 00 00"
            />
          </label>

          <label>
            <span>Telegram</span>
            <input
              name="telegram"
              defaultValue={profile.telegram || ""}
              placeholder="@username"
            />
          </label>

          <label className="profile-field-wide">
            <span>Страна проживания</span>
            <select name="country" defaultValue={profile.country || ""}>
              <option value="">Выберите страну</option>
              <option value="Austria">Австрия</option>
              <option value="Germany">Германия</option>
              <option value="Türkiye">Турция</option>
              <option value="Netherlands">Нидерланды</option>
              <option value="Other">Другая страна</option>
            </select>
          </label>
        </div>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <div className="profile-actions">
          <button className="btn btn-primary" disabled={saving || uploading}>
            {saving ? "Сохраняем…" : "Сохранить изменения"}
          </button>
        </div>
      </section>
    </form>
  );
}
