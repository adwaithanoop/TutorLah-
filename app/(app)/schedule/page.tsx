import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import AvailabilityEditor, { type Slot } from "@/app/components/schedule/AvailabilityEditor";
import WeeklyAvailabilityEditor, {
  type WeeklyBlock,
} from "@/app/components/schedule/WeeklyAvailabilityEditor";
import ProposeSession from "@/app/components/schedule/ProposeSession";

export default async function SchedulePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const [{ data: blocks }, { data: slots }] = await Promise.all([
    supabase
      .from("availability_blocks")
      .select("id, weekday, start_minute, end_minute")
      .eq("profile_id", user!.id)
      .order("weekday", { ascending: true })
      .order("start_minute", { ascending: true }),
    supabase
      .from("availability")
      .select("id, starts_at, ends_at, kind")
      .eq("profile_id", user!.id)
      .order("starts_at", { ascending: true }),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scheduling</h1>
        <p className="text-gray-500">
          Set the weekly hours students can book, then propose mutual free slots in chat.
        </p>
      </div>
      <WeeklyAvailabilityEditor blocks={(blocks as WeeklyBlock[]) ?? []} />
      <AvailabilityEditor slots={(slots as Slot[]) ?? []} />
      <ProposeSession />
    </main>
  );
}
