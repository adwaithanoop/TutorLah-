import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import MessageThread, { type ChatMessage } from "@/app/components/chat/MessageThread";
import ProposeInChat from "@/app/components/chat/ProposeInChat";

export default async function ThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const [user, { data: other }] = await Promise.all([
    getCurrentUser(supabase),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      `and(sender_id.eq.${user!.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user!.id})`,
    )
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/messages" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← All conversations
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{other?.full_name ?? "Conversation"}</h1>
      <MessageThread myId={user!.id} otherId={userId} initial={(messages as ChatMessage[]) ?? []} />
      <ProposeInChat otherId={userId} />
    </main>
  );
}
