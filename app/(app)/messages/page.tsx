import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import Avatar from "@/app/components/Avatar";
import MessagesRealtime from "@/app/components/chat/MessagesRealtime";
import { summarizeConversations, type ConversationPartner } from "@/lib/chat/conversations";
import { relativeTime } from "@/lib/chat/format";

interface BookingPair {
  student_id: string;
  tutor_id: string;
  student: { full_name: string; avatar_color: string } | null;
  tutor: { full_name: string; avatar_color: string } | null;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const [{ data: bookingRows }, { data: messageRows }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "student_id, tutor_id, student:profiles!bookings_student_id_fkey(full_name, avatar_color), tutor:profiles!bookings_tutor_id_fkey(full_name, avatar_color)",
      ),
    supabase
      .from("messages")
      .select("sender_id, recipient_id, body, created_at, read_at")
      .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`),
  ]);

  const partnerMap = new Map<string, ConversationPartner>();
  for (const b of (bookingRows as BookingPair[] | null) ?? []) {
    const isStudent = b.student_id === user!.id;
    const otherId = isStudent ? b.tutor_id : b.student_id;
    const other = isStudent ? b.tutor : b.student;
    if (!partnerMap.has(otherId)) {
      partnerMap.set(otherId, {
        id: otherId,
        name: other?.full_name ?? "User",
        avatarColor: other?.avatar_color ?? "bg-indigo-500",
      });
    }
  }

  const conversations = summarizeConversations({
    meId: user!.id,
    partners: [...partnerMap.values()],
    messages: messageRows ?? [],
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <MessagesRealtime myId={user!.id} />
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Messages</h1>
      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Chat unlocks once you book a session. Find a tutor to get started.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-soft">
          {conversations.map((c) => (
            <li key={c.partnerId}>
              <Link
                href={`/messages/${c.partnerId}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50"
              >
                <Avatar
                  name={c.partnerName}
                  colorClass={c.avatarColor}
                  className="h-11 w-11 shrink-0"
                  textClass="text-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-gray-900">{c.partnerName}</span>
                    {c.lastAt && (
                      <span className="shrink-0 text-xs text-gray-400">{relativeTime(c.lastAt)}</span>
                    )}
                  </div>
                  <p
                    className={`truncate text-sm ${c.unread > 0 ? "font-medium text-gray-700" : "text-gray-500"}`}
                  >
                    {c.lastBody ?? "No messages yet"}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
