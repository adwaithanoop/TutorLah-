import { createSosSchema, bidSchema } from "./sos";

describe("createSosSchema", () => {
  const base = { module_code: "CS2103T", description: "Need help with tutorial five" };

  it.each([60, 90, 120, 150, 180])("accepts a %i minute session", (duration_minutes) => {
    expect(createSosSchema.safeParse({ ...base, duration_minutes }).success).toBe(true);
  });

  it.each([0, 30, 45, 75, 200, 240])("rejects an invalid duration of %i", (duration_minutes) => {
    expect(createSosSchema.safeParse({ ...base, duration_minutes }).success).toBe(false);
  });

  it("requires a duration", () => {
    expect(createSosSchema.safeParse(base).success).toBe(false);
  });

  it("requires a description of at least 10 characters", () => {
    expect(
      createSosSchema.safeParse({ ...base, description: "too short", duration_minutes: 60 }).success,
    ).toBe(false);
  });

  it("rejects a malformed module code", () => {
    expect(
      createSosSchema.safeParse({ module_code: "nope", description: base.description, duration_minutes: 60 }).success,
    ).toBe(false);
  });
});

describe("bidSchema", () => {
  it("accepts a positive total amount", () => {
    expect(bidSchema.safeParse({ amount: 45 }).success).toBe(true);
  });

  it.each([0, -5])("rejects a non-positive amount of %i", (amount) => {
    expect(bidSchema.safeParse({ amount }).success).toBe(false);
  });

  it("rejects an amount above the cap", () => {
    expect(bidSchema.safeParse({ amount: 1001 }).success).toBe(false);
  });

  it("requires an amount", () => {
    expect(bidSchema.safeParse({}).success).toBe(false);
  });
});
