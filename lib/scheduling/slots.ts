import { Availability, type TimeInterval } from "./availability";

// Singapore never observes daylight saving, so a fixed +8h offset converts between a
// stored wall-clock block and a real instant exactly. All weekly availability is
// expressed in this wall clock.
export const SGT_OFFSET_MIN = 8 * 60;
const SGT_OFFSET_MS = SGT_OFFSET_MIN * 60_000;
const DAY_MS = 86_400_000;
const MIN_MS = 60_000;

export const ALLOWED_DURATIONS_MIN = [60, 90, 120, 150, 180] as const;
export type DurationMin = (typeof ALLOWED_DURATIONS_MIN)[number];
export const SLOT_GRID_MIN = 30;
export const MAX_WEEKDAY_MINUTE = 24 * 60;

// A tutor's repeating weekly slot. weekday is 0 (Sunday) through 6 (Saturday) in the
// Singapore wall clock; the minutes count from local midnight.
export interface WeeklyBlock {
  weekday: number;
  start_minute: number;
  end_minute: number;
}

interface SgtParts {
  y: number;
  m: number;
  d: number;
  weekday: number;
}

function sgtParts(utcMs: number): SgtParts {
  const shifted = new Date(utcMs + SGT_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

// The real instant of Singapore midnight on a given local calendar date.
function sgtMidnightUtc(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d) - SGT_OFFSET_MS;
}

// Expands repeating weekly blocks into concrete dated windows that fall inside
// [from, to]. Windows are returned in UTC; the caller clamps to "now" and intersects
// against bookings to get truly free time.
export function expandWeeklyBlocks(blocks: WeeklyBlock[], from: Date, to: Date): TimeInterval[] {
  if (blocks.length === 0 || to <= from) return [];
  const out: TimeInterval[] = [];
  const firstDay = sgtParts(from.getTime());
  let midnight = sgtMidnightUtc(firstDay.y, firstDay.m, firstDay.d);
  const toMs = to.getTime();
  const fromMs = from.getTime();

  while (midnight < toMs) {
    const weekday = new Date(midnight + SGT_OFFSET_MS).getUTCDay();
    for (const block of blocks) {
      if (block.weekday !== weekday) continue;
      const start = new Date(midnight + block.start_minute * MIN_MS);
      const end = new Date(midnight + block.end_minute * MIN_MS);
      if (end.getTime() <= fromMs || start.getTime() >= toMs) continue;
      out.push({ start, end });
    }
    midnight += DAY_MS;
  }
  return out;
}

// The free windows a student can actually request: the tutor's published weeks minus
// their confirmed sessions, never reaching into the past.
export function freeWindows(
  blocks: WeeklyBlock[],
  booked: TimeInterval[],
  from: Date,
  to: Date,
  now: Date = new Date(),
): TimeInterval[] {
  const lower = from.getTime() > now.getTime() ? from : now;
  if (to <= lower) return [];
  const published = expandWeeklyBlocks(blocks, lower, to);
  if (published.length === 0) return [];
  const open = new Availability(published).subtract(new Availability(booked));
  return open
    .map((w) => ({
      start: w.start.getTime() < lower.getTime() ? lower : w.start,
      end: w.end.getTime() > to.getTime() ? to : w.end,
    }))
    .filter((w) => w.end > w.start);
}

// Aligns a candidate start up to the next Singapore wall-clock grid mark (:00 or :30).
function alignUpToGrid(ms: number, gridMin: number): number {
  const shifted = ms + SGT_OFFSET_MS;
  const dayStart = Math.floor(shifted / DAY_MS) * DAY_MS;
  const minutes = (shifted - dayStart) / MIN_MS;
  const aligned = Math.ceil(minutes / gridMin) * gridMin;
  return dayStart + aligned * MIN_MS - SGT_OFFSET_MS;
}

// Every valid start time for a session of the given duration inside one free window:
// grid-aligned starts where the whole session still fits before the window closes.
export function slotStartsInWindow(
  window: TimeInterval,
  durationMin: number,
  gridMin: number = SLOT_GRID_MIN,
  notBefore?: Date,
): Date[] {
  const durationMs = durationMin * MIN_MS;
  const floor = notBefore && notBefore.getTime() > window.start.getTime() ? notBefore.getTime() : window.start.getTime();
  let cursor = alignUpToGrid(floor, gridMin);
  const latest = window.end.getTime() - durationMs;
  const starts: Date[] = [];
  while (cursor <= latest) {
    starts.push(new Date(cursor));
    cursor += gridMin * MIN_MS;
  }
  return starts;
}

export interface SlotOption {
  start: string;
  end: string;
}

// Slices every free window into bookable start times for one duration, across the
// whole visible range. This is what the duration-first picker renders.
export function slotsForDuration(
  windows: TimeInterval[],
  durationMin: number,
  now: Date = new Date(),
  gridMin: number = SLOT_GRID_MIN,
): SlotOption[] {
  const durationMs = durationMin * MIN_MS;
  const out: SlotOption[] = [];
  for (const window of windows) {
    for (const start of slotStartsInWindow(window, durationMin, gridMin, now)) {
      out.push({ start: start.toISOString(), end: new Date(start.getTime() + durationMs).toISOString() });
    }
  }
  return out;
}

// A day in the visible range is bookable for the chosen duration only if at least one
// slot of that length fits. Returns the set of SGT calendar dates (yyyy-mm-dd) that have
// availability, so the week calendar can shade them.
export function bookableDays(
  windows: TimeInterval[],
  durationMin: number,
  now: Date = new Date(),
  gridMin: number = SLOT_GRID_MIN,
): string[] {
  const days = new Set<string>();
  for (const slot of slotsForDuration(windows, durationMin, now, gridMin)) {
    const { y, m, d } = sgtParts(Date.parse(slot.start));
    days.add(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return [...days].sort();
}

// The Singapore calendar date (yyyy-mm-dd) an instant falls on.
export function sgtDateKey(value: Date | string): string {
  const ms = typeof value === "string" ? Date.parse(value) : value.getTime();
  const { y, m, d } = sgtParts(ms);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export interface PendingRequestCost {
  module_code: string;
  amount: number;
}

// What the student could still be charged across their live requests. Requests for the
// same module are alternatives for one session (accepting one prunes the rest), so each
// module counts once at its dearest option. This deliberately never collapses different
// modules together, so the estimate only ever errs on the safe (higher) side.
export function committedEstimate(pending: PendingRequestCost[]): number {
  const perModule = new Map<string, number>();
  for (const r of pending) {
    const current = perModule.get(r.module_code) ?? 0;
    if (r.amount > current) perModule.set(r.module_code, r.amount);
  }
  let total = 0;
  for (const amount of perModule.values()) total += amount;
  return Math.round(total * 100) / 100;
}
