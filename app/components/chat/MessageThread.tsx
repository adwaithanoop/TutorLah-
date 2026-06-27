"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clockTime } from "@/lib/chat/format";

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export default function MessageThread({
  myId,
  otherId,
  initial,
}: {
  myId: string;
  otherId: string;
  initial: ChatMessage[];
}) {
  // thread state
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // mark this conversation as read
  const markRead = useCallback(() => {
    void fetch("/api/messages/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ other_id: otherId }),
    }).catch(() => {});
  }, [otherId]);

  // scroll to the newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // mark read when the thread opens
  useEffect(() => {
    markRead();
  }, [markRead]);

  // live updates for incoming messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${myId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${myId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.sender_id === otherId) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            markRead();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, otherId, markRead]);

  // send a message, restore the draft if it fails
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError("");
    setDraft("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipient_id: otherId, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not send");
      setDraft(body);
      return;
    }
    setMessages((prev) => [...prev, data.message]);
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl bg-white shadow-soft">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No messages yet. Say hello.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.body}
              </div>
              <span className="mt-0.5 px-1 text-[11px] text-gray-400">{clockTime(m.created_at)}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-gray-100 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button type="submit" className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Send
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
