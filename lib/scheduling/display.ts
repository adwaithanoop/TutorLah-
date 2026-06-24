// Display helpers for the Singapore wall clock, safe to use on the client. All booking
// times are stored as UTC instants and shown here in Asia/Singapore.
const TZ = "Asia/Singapore";

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Half-hour grid marks across a day, as { value: minutesFromMidnight, label: "4:00 PM" }.
export function gridMarks(): { value: number; label: string }[] {
  const marks: { value: number; label: string }[] = [];
  for (let m = 0; m <= 1440; m += 30) marks.push({ value: m, label: minuteToLabel(m) });
  return marks;
}

export function minuteToLabel(min: number): string {
  if (min >= 1440) return "12:00 AM";
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatSgtTime(iso: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(new Date(iso));
}

// A start/end pair, e.g. "4:00 PM - 6:00 PM". Uses a plain hyphen, never a dash.
export function formatSgtRange(startIso: string, endIso: string): string {
  return `${formatSgtTime(startIso)} - ${formatSgtTime(endIso)}`;
}

export function formatSgtDayLabel(value: string): string {
  const date = value.length === 10 ? new Date(`${value}T12:00:00+08:00`) : new Date(value);
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(date);
}

export function formatSgtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(new Date(iso));
}

// "1h 30m" style label for a duration in minutes.
export function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Whole minutes left until a deadline, floored at zero. The caller ticks this for a live
// countdown; correctness never depends on it because the server hides expired rows.
export function minutesUntil(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((Date.parse(iso) - now) / 60000));
}

export function countdownLabel(iso: string, now: number = Date.now()): string {
  const totalSeconds = Math.max(0, Math.floor((Date.parse(iso) - now) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
