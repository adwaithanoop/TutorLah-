import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import BookingActions from "@/app/components/booking/BookingActions";
import { ESCROW_STATE_LABELS, ESCROW_STATE_STYLES } from "@/app/components/booking/escrowState";

interface BookingView {
  id: string;
  student_id: string;
  tutor_id: string;
  module_code: string;
  scheduled_start: string;
  scheduled_end: string;
  amount: number;
  escrow_state: string;
  report_submitted: boolean;
  student: { full_name: string } | null;
  tutor: { full_name: string } | null;
}

export default async function BookingsPage() {
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getCurrentUser(supabase),
    supabase
      .from("bookings")
      .select(
        "id, student_id, tutor_id, module_code, scheduled_start, scheduled_end, amount, escrow_state, report_submitted, student:profiles!bookings_student_id_fkey(full_name), tutor:profiles!bookings_tutor_id_fkey(full_name)",
      )
      .order("scheduled_start", { ascending: false }),
  ]);

  const bookings = (data as BookingView[] | null) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Your bookings</h1>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          No bookings yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const role = b.tutor_id === user!.id ? "tutor" : "student";
            const counterparty = role === "tutor" ? b.student?.full_name : b.tutor?.full_name;
            return (
              <li key={b.id} className="rounded-2xl bg-white shadow-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-indigo-700">{b.module_code}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ESCROW_STATE_STYLES[b.escrow_state]}`}>
                        {ESCROW_STATE_STYLES[b.escrow_state]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {role === "tutor" ? "Teaching" : "Learning from"} {counterparty}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(b.scheduled_start).toLocaleString()} → {new Date(b.scheduled_end).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-lg font-black text-gray-900">${Number(b.amount)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <BookingActions
                    bookingId={b.id}
                    escrowState={b.escrow_state}
                    reportSubmitted={b.report_submitted}
                    role={role}
                  />
                  <Link
                    href={`/messages/${role === "tutor" ? b.student_id : b.tutor_id}`}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Message
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
