import { counterProposeSchema, requestActionSchema, weeklyBlockSchema } from "./requests";

const slot = (startIso: string, minutes: number) => ({
  scheduled_start: startIso,
  scheduled_end: new Date(Date.parse(startIso) + minutes * 60_000).toISOString(),
});

const start = "2026-06-15T08:00:00.000Z";

describe("counterProposeSchema slot duration", () => {
  test("accepts the half-hour lengths up to three hours", () => {
    for (const minutes of [60, 90, 120, 150, 180]) {
      expect(counterProposeSchema.safeParse({ slots: [slot(start, minutes)] }).success).toBe(true);
    }
  });

  test("rejects anything past three hours or off the allowed set", () => {
    for (const minutes of [45, 210]) {
      expect(counterProposeSchema.safeParse({ slots: [slot(start, minutes)] }).success).toBe(false);
    }
  });
});

describe("requestActionSchema", () => {
  test("accepts an action without the silent flag", () => {
    expect(requestActionSchema.safeParse({ action: "decline" }).success).toBe(true);
  });

  test("accepts the optional silent flag for grouped cleanup declines", () => {
    const parsed = requestActionSchema.safeParse({ action: "decline", silent: true });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.silent).toBe(true);
  });

  test("rejects an unknown action", () => {
    expect(requestActionSchema.safeParse({ action: "counter" }).success).toBe(false);
  });
});

describe("weeklyBlockSchema", () => {
  test("accepts a three hour block", () => {
    expect(weeklyBlockSchema.safeParse({ weekday: 1, start_minute: 960, end_minute: 1140 }).success).toBe(true);
  });

  test("rejects a block longer than three hours", () => {
    expect(weeklyBlockSchema.safeParse({ weekday: 1, start_minute: 960, end_minute: 1170 }).success).toBe(false);
  });
});
