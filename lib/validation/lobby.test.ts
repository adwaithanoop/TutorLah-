import { createLobbySchema } from "./lobby";

const HOUR = 60 * 60 * 1000;

function iso(offsetMs: number) {
  return new Date(Date.now() + offsetMs).toISOString();
}

describe("createLobbySchema", () => {
  const base = {
    module_code: "CS2103T",
    title: "Finals revision lobby",
    budget: 120,
    min_participants: 2,
    max_participants: 6,
    scheduled_start: iso(48 * HOUR),
    scheduled_end: iso(50 * HOUR),
    deadline: iso(24 * HOUR),
  };

  it("accepts a valid lobby", () => {
    expect(createLobbySchema.safeParse(base).success).toBe(true);
  });

  it("rejects a malformed module code", () => {
    expect(createLobbySchema.safeParse({ ...base, module_code: "nope" }).success).toBe(false);
  });

  it("rejects a title under 3 characters", () => {
    expect(createLobbySchema.safeParse({ ...base, title: "ab" }).success).toBe(false);
  });

  it.each([0, -50])("rejects a non-positive budget of %i", (budget) => {
    expect(createLobbySchema.safeParse({ ...base, budget }).success).toBe(false);
  });

  it.each([0, 1])("rejects a minimum of %i participants", (min_participants) => {
    expect(createLobbySchema.safeParse({ ...base, min_participants }).success).toBe(false);
  });

  it("rejects a max below the min", () => {
    expect(createLobbySchema.safeParse({ ...base, min_participants: 5, max_participants: 3 }).success).toBe(false);
  });

  it("rejects a session that ends before it starts", () => {
    expect(
      createLobbySchema.safeParse({ ...base, scheduled_end: iso(47 * HOUR) }).success,
    ).toBe(false);
  });

  it("rejects a deadline after the session start", () => {
    expect(createLobbySchema.safeParse({ ...base, deadline: iso(49 * HOUR) }).success).toBe(false);
  });

  it("rejects a deadline in the past", () => {
    expect(createLobbySchema.safeParse({ ...base, deadline: iso(-1 * HOUR) }).success).toBe(false);
  });

  it("requires a deadline", () => {
    expect(createLobbySchema.safeParse({ ...base, deadline: undefined }).success).toBe(false);
  });
});
