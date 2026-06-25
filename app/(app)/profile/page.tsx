import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { signedAvatarUrl } from "@/lib/avatars";
import ProfileForm, { type ProfileFields } from "@/app/components/profile/ProfileForm";
import AvatarUpload from "@/app/components/profile/AvatarUpload";

const DEFAULTS: ProfileFields = {
  full_name: "",
  faculty: null,
  year: null,
  rate_per_hour: 0,
  is_active: false,
  avatar_color: "bg-indigo-500",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, faculty, year, rate_per_hour, is_active, avatar_color, avatar_path")
    .eq("id", user!.id)
    .maybeSingle();

  const fields: ProfileFields = profile
    ? {
        full_name: profile.full_name,
        faculty: profile.faculty,
        year: profile.year,
        rate_per_hour: profile.rate_per_hour,
        is_active: profile.is_active,
        avatar_color: profile.avatar_color,
      }
    : DEFAULTS;

  const avatarSrc = await signedAvatarUrl(supabase, profile?.avatar_path);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Your profile</h1>
      <p className="mb-8 text-gray-500">Manage your details, rate, and tutoring availability.</p>

      <div className="space-y-6">
        <AvatarUpload
          userId={user!.id}
          fullName={fields.full_name}
          avatarColor={fields.avatar_color}
          initialPath={profile?.avatar_path ?? null}
          initialUrl={avatarSrc}
        />
        <ProfileForm initial={fields} />
      </div>
    </main>
  );
}
