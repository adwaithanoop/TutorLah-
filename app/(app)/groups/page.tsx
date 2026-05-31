import { createClient } from "@/lib/supabase/server";
import { GroupPricing } from "@/lib/pricing/pricing";
import CreateGroupForm from "@/app/components/group/CreateGroupForm";
import EnrolButton from "@/app/components/group/EnrolButton";

function formatSchedule(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleString("en-SG", opts)} to ${e.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}`;
}

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from("group_sessions")
    .select(
      "id, title, module_code, total_cost, max_participants, floor_per_student, scheduled_start, scheduled_end, tutor_id, tutor:profiles!group_sessions_tutor_id_fkey(full_name), group_enrolments(student_id)",
    )
    .eq("status", "open")
    .order("scheduled_start", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Group sessions</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <CreateGroupForm />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Open sessions</h2>
          {!sessions || sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No open group sessions right now.</p>
          ) : (
            sessions.map((session) => {
              const enrolments = session.group_enrolments ?? [];
              const enrolled = enrolments.length;
              const seatsLeft = session.max_participants - enrolled;
              const alreadyEnrolled = enrolments.some((e) => e.student_id === user!.id);
              const isFull = seatsLeft <= 0;
              const nextPrice = new GroupPricing(
                session.total_cost,
                enrolled + 1,
                session.floor_per_student,
              ).quote();
              const host = Array.isArray(session.tutor) ? session.tutor[0] : session.tutor;

              return (
                <div key={session.id} className="rounded-2xl bg-white shadow-soft p-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-indigo-700">{session.module_code}</span>
                    <span className="text-xs text-gray-400">{host?.full_name ?? "Unknown host"}</span>
                  </div>
                  <h3 className="mt-1 font-semibold text-gray-900">{session.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatSchedule(session.scheduled_start, session.scheduled_end)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">${nextPrice}</span>
                      <span className="ml-1 text-gray-500">/ student next</span>
                      <span className="ml-3 text-xs text-gray-400">
                        {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left` : "Full"}
                      </span>
                    </div>
                    {alreadyEnrolled ? (
                      <span className="text-xs font-semibold text-emerald-600">Enrolled</span>
                    ) : (
                      <EnrolButton groupId={session.id} disabled={isFull} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
