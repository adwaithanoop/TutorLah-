export interface CandidateTutor {
  tutorId: string;
  chatId: number;
}

export function selectSosRecipients(candidates: CandidateTutor[], excludeUserIds: string[]): number[] {
  const excluded = new Set(excludeUserIds);
  const seen = new Set<number>();
  const chatIds: number[] = [];
  for (const candidate of candidates) {
    if (excluded.has(candidate.tutorId) || seen.has(candidate.chatId)) continue;
    seen.add(candidate.chatId);
    chatIds.push(candidate.chatId);
  }
  return chatIds;
}
