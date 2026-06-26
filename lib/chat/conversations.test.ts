import {
  ConversationMessage,
  ConversationPartner,
  summarizeConversations,
} from "./conversations";

const me = "me";

function msg(partial: Partial<ConversationMessage> & Pick<ConversationMessage, "sender_id" | "recipient_id" | "created_at">): ConversationMessage {
  return { body: "hi", read_at: null, ...partial };
}

describe("summarizeConversations", () => {
  it("returns an empty array when there are no partners", () => {
    expect(summarizeConversations({ meId: me, partners: [], messages: [] })).toEqual([]);
  });

  it("keeps a partner with no messages, with null preview and zero unread", () => {
    const partners: ConversationPartner[] = [{ id: "a", name: "Ada", avatarColor: "bg-indigo-500" }];
    const result = summarizeConversations({ meId: me, partners, messages: [] });
    expect(result).toEqual([
      { partnerId: "a", partnerName: "Ada", avatarColor: "bg-indigo-500", lastBody: null, lastAt: null, unread: 0 },
    ]);
  });

  it("uses the newest message between the two parties as the preview", () => {
    const partners: ConversationPartner[] = [{ id: "a", name: "Ada", avatarColor: "bg-indigo-500" }];
    const messages = [
      msg({ sender_id: me, recipient_id: "a", body: "first", created_at: "2026-06-01T10:00:00Z", read_at: "x" }),
      msg({ sender_id: "a", recipient_id: me, body: "latest", created_at: "2026-06-01T12:00:00Z" }),
    ];
    const [summary] = summarizeConversations({ meId: me, partners, messages });
    expect(summary.lastBody).toBe("latest");
    expect(summary.lastAt).toBe("2026-06-01T12:00:00Z");
  });

  it("counts only inbound, unread messages from the partner", () => {
    const partners: ConversationPartner[] = [{ id: "a", name: "Ada", avatarColor: "bg-indigo-500" }];
    const messages = [
      msg({ sender_id: "a", recipient_id: me, created_at: "2026-06-01T10:00:00Z", read_at: null }),
      msg({ sender_id: "a", recipient_id: me, created_at: "2026-06-01T10:01:00Z", read_at: null }),
      msg({ sender_id: "a", recipient_id: me, created_at: "2026-06-01T10:02:00Z", read_at: "seen" }),
      msg({ sender_id: me, recipient_id: "a", created_at: "2026-06-01T10:03:00Z", read_at: null }),
    ];
    const [summary] = summarizeConversations({ meId: me, partners, messages });
    expect(summary.unread).toBe(2);
  });

  it("ignores messages that belong to a different conversation", () => {
    const partners: ConversationPartner[] = [{ id: "a", name: "Ada", avatarColor: "bg-indigo-500" }];
    const messages = [msg({ sender_id: "b", recipient_id: me, created_at: "2026-06-01T10:00:00Z" })];
    const [summary] = summarizeConversations({ meId: me, partners, messages });
    expect(summary.unread).toBe(0);
    expect(summary.lastBody).toBeNull();
  });

  it("sorts by most recent activity, with message-less partners last by name", () => {
    const partners: ConversationPartner[] = [
      { id: "a", name: "Ada", avatarColor: "bg-indigo-500" },
      { id: "b", name: "Ben", avatarColor: "bg-emerald-500" },
      { id: "z", name: "Zed", avatarColor: "bg-rose-500" },
      { id: "y", name: "Yan", avatarColor: "bg-amber-500" },
    ];
    const messages = [
      msg({ sender_id: "a", recipient_id: me, created_at: "2026-06-01T10:00:00Z" }),
      msg({ sender_id: "b", recipient_id: me, created_at: "2026-06-02T10:00:00Z" }),
    ];
    const order = summarizeConversations({ meId: me, partners, messages }).map((c) => c.partnerId);
    expect(order).toEqual(["b", "a", "y", "z"]);
  });

  it("does not mutate the input arrays", () => {
    const partners: ConversationPartner[] = [{ id: "a", name: "Ada", avatarColor: "bg-indigo-500" }];
    const messages = [msg({ sender_id: "a", recipient_id: me, created_at: "2026-06-01T10:00:00Z" })];
    const partnersSnapshot = JSON.parse(JSON.stringify(partners));
    const messagesSnapshot = JSON.parse(JSON.stringify(messages));
    summarizeConversations({ meId: me, partners, messages });
    expect(partners).toEqual(partnersSnapshot);
    expect(messages).toEqual(messagesSnapshot);
  });
});
