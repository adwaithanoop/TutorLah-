import { createClient } from "@/lib/supabase/server";
import ProfileForm, { type ProfileFields } from "@/app/components/profile/ProfileForm";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, faculty, year, rate_per_hour, is_active, avatar_color")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Your profile</h1>
      <p className="mb-8 text-gray-500">Manage your details, rate, and tutoring availability.</p>

      <ProfileForm initial={profile ?? DEFAULTS} />
    </main>
  );
}
