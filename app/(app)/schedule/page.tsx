import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import WeeklyAvailabilityEditor, {
  type WeeklyBlock,
} from "@/app/components/schedule/WeeklyAvailabilityEditor";

export default async function SchedulePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("id, weekday, start_minute, end_minute")
    .eq("profile_id", user!.id)
    .order("weekday", { ascending: true })
    .order("start_minute", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scheduling</h1>
        <p className="text-gray-500">Set the weekly hours students can book.</p>
      </div>
      <WeeklyAvailabilityEditor blocks={(blocks as WeeklyBlock[]) ?? []} />
    </main>
  );
}
