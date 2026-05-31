import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface BookingPair {
  student_id: string;
  tutor_id: string;
  student: { full_name: string } | null;
  tutor: { full_name: string } | null;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("bookings")
    .select(
      "student_id, tutor_id, student:profiles!bookings_student_id_fkey(full_name), tutor:profiles!bookings_tutor_id_fkey(full_name)",
    );

  const seen = new Map<string, string>();
  for (const b of (data as BookingPair[] | null) ?? []) {
    const isStudent = b.student_id === user!.id;
    const otherId = isStudent ? b.tutor_id : b.student_id;
    const otherName = (isStudent ? b.tutor?.full_name : b.student?.full_name) ?? "User";
    if (!seen.has(otherId)) seen.set(otherId, otherName);
  }
  const conversations = [...seen.entries()];

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Messages</h1>
      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Chat unlocks once you book a session. Find a tutor to get started.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-soft">
          {conversations.map(([id, name]) => (
            <li key={id}>
              <Link href={`/messages/${id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <span className="font-semibold text-gray-900">{name}</span>
                <span className="text-sm text-indigo-600">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
