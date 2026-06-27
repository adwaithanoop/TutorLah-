import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { signedAvatarUrl } from "@/lib/avatars";
import ProfileForm, { type ProfileFields } from "@/app/components/profile/ProfileForm";
import AvatarUpload from "@/app/components/profile/AvatarUpload";
import ConnectTelegram from "@/app/components/profile/ConnectTelegram";

// empty profile
const DEFAULTS: ProfileFields = {
  full_name: "",
  faculty: null,
  year: null,
  rate_per_hour: 0,
  avatar_color: "bg-indigo-500",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // load saved profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, faculty, year, rate_per_hour, avatar_color, avatar_path")
    .eq("id", user!.id)
    .maybeSingle();

  // use saved values, or fall back to defaults
  const fields: ProfileFields = profile
    ? {
        full_name: profile.full_name,
        faculty: profile.faculty,
        year: profile.year,
        rate_per_hour: profile.rate_per_hour,
        avatar_color: profile.avatar_color,
      }
    : DEFAULTS;

  const avatarSrc = await signedAvatarUrl(supabase, profile?.avatar_path);

  // is a telegram account linked yet
  const { data: telegram } = await supabase
    .from("telegram_accounts")
    .select("username")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Your profile</h1>
      <p className="mb-8 text-gray-500">Manage your details and rate.</p>

      <div className="space-y-6">
        <AvatarUpload
          userId={user!.id}
          fullName={fields.full_name}
          avatarColor={fields.avatar_color}
          initialPath={profile?.avatar_path ?? null}
          initialUrl={avatarSrc}
        />
        <ConnectTelegram connected={!!telegram} username={telegram?.username ?? null} />
        <ProfileForm initial={fields} />
      </div>
    </main>
  );
}
