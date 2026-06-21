import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import AvailabilityEditor, { type Slot } from "@/app/components/schedule/AvailabilityEditor";
import ProposeSession from "@/app/components/schedule/ProposeSession";

export default async function SchedulePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const { data: slots } = await supabase
    .from("availability")
    .select("id, starts_at, ends_at, kind")
    .eq("profile_id", user!.id)
    .order("starts_at", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scheduling</h1>
        <p className="text-gray-500">Keep your availability current, then propose mutual free slots.</p>
      </div>
      <AvailabilityEditor slots={(slots as Slot[]) ?? []} />
      <ProposeSession />
    </main>
  );
}
