import {
  expandWeeklyBlocks,
  freeWindows,
  slotsForDuration,
  slotStartsInWindow,
  bookableDays,
  committedEstimate,
  sgtDateKey,
  type WeeklyBlock,
} from "./slots";
import type { TimeInterval } from "./availability";

// 2026-06-15 is a Monday. Singapore is UTC+8, so 16:00 SGT is 08:00 UTC.
const sgt = (y: number, mon: number, d: number, h: number, min = 0) =>
  new Date(Date.UTC(y, mon - 1, d, h - 8, min));

const block = (weekday: number, startH: number, endH: number): WeeklyBlock => ({
  weekday,
  start_minute: startH * 60,
  end_minute: endH * 60,
});

const MON = 1;

describe("expandWeeklyBlocks", () => {
  test("emits one dated window per matching weekday in range", () => {
    const blocks = [block(MON, 16, 20)];
    const from = sgt(2026, 6, 15, 0); // Mon
    const to = sgt(2026, 6, 29, 0); // two Mondays later (exclusive of the 29th 00:00)
    const out = expandWeeklyBlocks(blocks, from, to);
    expect(out).toEqual([
      { start: sgt(2026, 6, 15, 16), end: sgt(2026, 6, 15, 20) },
      { start: sgt(2026, 6, 22, 16), end: sgt(2026, 6, 22, 20) },
    ]);
  });

  test("uses the Singapore wall clock for the weekday, not UTC", () => {
    // 23:30 SGT Monday is 15:30 UTC Monday; the block must still land on Monday.
    const blocks = [block(MON, 23, 24)];
    const from = sgt(2026, 6, 15, 0);
    const to = sgt(2026, 6, 16, 0);
    const out = expandWeeklyBlocks(blocks, from, to);
    expect(out).toEqual([{ start: sgt(2026, 6, 15, 23), end: sgt(2026, 6, 16, 0) }]);
  });

  test("returns nothing without blocks or with an empty range", () => {
    expect(expandWeeklyBlocks([], sgt(2026, 6, 15, 0), sgt(2026, 6, 22, 0))).toEqual([]);
    expect(expandWeeklyBlocks([block(MON, 16, 20)], sgt(2026, 6, 22, 0), sgt(2026, 6, 15, 0))).toEqual([]);
  });
});

describe("freeWindows", () => {
  const blocks = [block(MON, 16, 22)];

  test("subtracts confirmed bookings and never returns the past", () => {
    const now = sgt(2026, 6, 15, 17); // mid-window
    const booked: TimeInterval[] = [{ start: sgt(2026, 6, 15, 19), end: sgt(2026, 6, 15, 20) }];
    const out = freeWindows(blocks, booked, sgt(2026, 6, 15, 0), sgt(2026, 6, 16, 0), now);
    expect(out).toEqual([
      { start: sgt(2026, 6, 15, 17), end: sgt(2026, 6, 15, 19) },
      { start: sgt(2026, 6, 15, 20), end: sgt(2026, 6, 15, 22) },
    ]);
  });

  test("clamps windows to the requested upper bound", () => {
    const now = sgt(2026, 6, 15, 0);
    const out = freeWindows(blocks, [], sgt(2026, 6, 15, 0), sgt(2026, 6, 15, 18), now);
    expect(out).toEqual([{ start: sgt(2026, 6, 15, 16), end: sgt(2026, 6, 15, 18) }]);
  });
});

describe("slotStartsInWindow", () => {
  const window: TimeInterval = { start: sgt(2026, 6, 15, 16), end: sgt(2026, 6, 16, 0) }; // 4pm-midnight

  test("stops so the session fits before the window closes", () => {
    const starts = slotStartsInWindow(window, 120).map((d) => d.toISOString());
    expect(starts[0]).toBe(sgt(2026, 6, 15, 16).toISOString());
    expect(starts[starts.length - 1]).toBe(sgt(2026, 6, 15, 22).toISOString());
  });

  test("aligns the first start up to the next half hour", () => {
    const ragged: TimeInterval = { start: sgt(2026, 6, 15, 16, 15), end: sgt(2026, 6, 15, 20) };
    const starts = slotStartsInWindow(ragged, 60).map((d) => d.toISOString());
    expect(starts[0]).toBe(sgt(2026, 6, 15, 16, 30).toISOString());
  });

  test("honours the notBefore floor", () => {
    const starts = slotStartsInWindow(window, 60, 30, sgt(2026, 6, 15, 21)).map((d) => d.toISOString());
    expect(starts[0]).toBe(sgt(2026, 6, 15, 21).toISOString());
  });
});

describe("slotsForDuration and bookableDays", () => {
  test("emits start/end pairs across windows for a duration", () => {
    const windows: TimeInterval[] = [{ start: sgt(2026, 6, 15, 16), end: sgt(2026, 6, 15, 18) }];
    const out = slotsForDuration(windows, 90, sgt(2026, 6, 15, 0));
    expect(out).toEqual([
      { start: sgt(2026, 6, 15, 16).toISOString(), end: sgt(2026, 6, 15, 17, 30).toISOString() },
      { start: sgt(2026, 6, 15, 16, 30).toISOString(), end: sgt(2026, 6, 15, 18).toISOString() },
    ]);
  });

  test("a day is bookable only if the duration fits", () => {
    const windows: TimeInterval[] = [{ start: sgt(2026, 6, 15, 16), end: sgt(2026, 6, 15, 17) }];
    expect(bookableDays(windows, 60, sgt(2026, 6, 15, 0))).toEqual(["2026-06-15"]);
    expect(bookableDays(windows, 120, sgt(2026, 6, 15, 0))).toEqual([]);
  });

  test("groups slots onto their Singapore calendar date", () => {
    expect(sgtDateKey(sgt(2026, 6, 15, 23))).toBe("2026-06-15");
    // 00:30 SGT on the 16th is 16:30 UTC on the 15th, but belongs to the 16th locally.
    expect(sgtDateKey(sgt(2026, 6, 16, 0, 30))).toBe("2026-06-16");
  });
});

describe("committedEstimate", () => {
  test("counts each module once at its dearest option", () => {
    const pending = [
      { module_code: "CS2030S", amount: 40 },
      { module_code: "CS2030S", amount: 50 },
      { module_code: "CS2040S", amount: 30 },
    ];
    expect(committedEstimate(pending)).toBe(80);
  });

  test("is zero with no live requests", () => {
    expect(committedEstimate([])).toBe(0);
  });
});
