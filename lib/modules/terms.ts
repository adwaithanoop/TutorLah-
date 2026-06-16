export interface TermOption {
  label: string;
  value: string;
}

function ayLabel(startYear: number): string {
  const start = String(startYear % 100).padStart(2, "0");
  const end = String((startYear + 1) % 100).padStart(2, "0");
  return `${start}/${end}`;
}

export function termCompletedDate(startYear: number, sem: 1 | 2): string {
  return sem === 1 ? `${startYear}-12-01` : `${startYear + 1}-05-01`;
}

export function recentTerms(now: Date = new Date(), years = 6): TermOption[] {
  const currentStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const options: TermOption[] = [];
  for (let startYear = currentStart; startYear >= currentStart - years; startYear--) {
    for (const sem of [1, 2] as const) {
      const value = termCompletedDate(startYear, sem);
      if (new Date(value).getTime() <= now.getTime()) {
        options.push({ label: `${ayLabel(startYear)} Sem ${sem}`, value });
      }
    }
  }
  return options.sort((a, b) => (a.value < b.value ? 1 : -1));
}

export function formatTerm(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  const startYear = month >= 8 ? year : year - 1;
  const sem = month >= 8 ? 1 : 2;
  return `${ayLabel(startYear)} Sem ${sem}`;
}
