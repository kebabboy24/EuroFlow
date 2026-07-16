import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileEditor from "@/components/ProfileEditor";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, telegram, country, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="dashboard-page">
      <div className="profile-page-shell">
        <div className="profile-page-top">
          <div>
            <span className="dashboard-kicker">Настройки аккаунта</span>
            <h1>Ваш профиль</h1>
            <p>Добавьте фотографию и контактные данные.</p>
          </div>
          <Link className="btn" href="/dashboard">
            ← В личный кабинет
          </Link>
        </div>

        <ProfileEditor
          userId={user.id}
          email={user.email || ""}
          profile={{
            full_name: profile?.full_name || null,
            phone: profile?.phone || null,
            telegram: profile?.telegram || null,
            country: profile?.country || null,
            avatar_url: profile?.avatar_url || null,
          }}
        />
      </div>
    </main>
  );
}
