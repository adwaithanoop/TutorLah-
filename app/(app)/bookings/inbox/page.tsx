import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/user";
import { getFreeWindows } from "@/lib/booking/availability";
import TutorInbox, { type IncomingRequest } from "@/app/components/booking/TutorInbox";

const RANGE_DAYS = 14;

export default async function InboxPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // look two weeks ahead for free slots
  const now = new Date();
  const to = new Date(now.getTime() + RANGE_DAYS * 86_400_000);

  // incoming requests plus this tutor's free windows
  const [{ data: reqRows }, freeWindows] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id, module_code, student_id, scheduled_start, scheduled_end, amount, status, expires_at")
      .eq("tutor_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(60),
    getFreeWindows(createAdminClient(), user!.id, now, to, now),
  ]);

  // look up the student names for those requests
  const studentIds = [...new Set((reqRows ?? []).map((r) => r.student_id))];
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // shape the rows for the inbox component
  const requests: IncomingRequest[] = (reqRows ?? []).map((r) => ({
    id: r.id,
    moduleCode: r.module_code,
    studentId: r.student_id,
    studentName: nameOf.get(r.student_id) ?? "Student",
    start: r.scheduled_start,
    end: r.scheduled_end,
    amount: Number(r.amount),
    status: r.status,
    expiresAt: r.expires_at,
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Incoming requests</h1>
        <Link href="/schedule" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Edit availability
        </Link>
      </div>
      <TutorInbox userId={user!.id} requests={requests} freeWindows={freeWindows} />
    </main>
  );
}
