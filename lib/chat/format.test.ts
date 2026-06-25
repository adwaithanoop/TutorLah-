import { relativeTime } from "./format";

describe("relativeTime", () => {
  const now = new Date("2026-06-25T12:00:00Z");

  it("shows 'now' for under a minute", () => {
    expect(relativeTime("2026-06-25T11:59:30Z", now)).toBe("now");
  });

  it("shows minutes under an hour", () => {
    expect(relativeTime("2026-06-25T11:45:00Z", now)).toBe("15m");
  });

  it("shows hours under a day", () => {
    expect(relativeTime("2026-06-25T09:00:00Z", now)).toBe("3h");
  });

  it("shows days under a week", () => {
    expect(relativeTime("2026-06-23T12:00:00Z", now)).toBe("2d");
  });

  it("falls back to a calendar date past a week", () => {
    expect(relativeTime("2026-06-01T12:00:00Z", now)).toMatch(/\d/);
  });
});
