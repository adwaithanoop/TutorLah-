export interface ConversationPartner {
  id: string;
  name: string;
  avatarColor: string;
}

export interface ConversationMessage {
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationSummary {
  partnerId: string;
  partnerName: string;
  avatarColor: string;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
}

function isBetween(message: ConversationMessage, meId: string, partnerId: string): boolean {
  return (
    (message.sender_id === meId && message.recipient_id === partnerId) ||
    (message.sender_id === partnerId && message.recipient_id === meId)
  );
}

export function summarizeConversations(input: {
  meId: string;
  partners: ConversationPartner[];
  messages: ConversationMessage[];
}): ConversationSummary[] {
  const { meId, partners, messages } = input;

  const summaries = partners.map((partner) => {
    let last: ConversationMessage | null = null;
    let unread = 0;
    for (const message of messages) {
      if (!isBetween(message, meId, partner.id)) continue;
      if (!last || Date.parse(message.created_at) > Date.parse(last.created_at)) last = message;
      if (message.recipient_id === meId && message.sender_id === partner.id && message.read_at === null) {
        unread += 1;
      }
    }
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      avatarColor: partner.avatarColor,
      lastBody: last?.body ?? null,
      lastAt: last?.created_at ?? null,
      unread,
    };
  });

  return summaries.sort((a, b) => {
    if (a.lastAt && b.lastAt) return Date.parse(b.lastAt) - Date.parse(a.lastAt);
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return a.partnerName.localeCompare(b.partnerName);
  });
}
