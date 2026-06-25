import { newLinkToken, parseStartCommand } from "./link-token";

describe("parseStartCommand", () => {
  it("returns null for a non-start message", () => {
    expect(parseStartCommand("hi")).toBeNull();
    expect(parseStartCommand("/help")).toBeNull();
  });

  it("returns a null token for a bare start", () => {
    expect(parseStartCommand("/start")).toEqual({ token: null });
  });

  it("reads the token from a start payload", () => {
    expect(parseStartCommand("/start abc123")).toEqual({ token: "abc123" });
  });

  it("handles the group form with a bot mention", () => {
    expect(parseStartCommand("/start@TutorLahBot abc123")).toEqual({ token: "abc123" });
  });

  it("ignores extra inner and surrounding whitespace", () => {
    expect(parseStartCommand("  /start   abc123  ")).toEqual({ token: "abc123" });
  });

  it("returns null for an empty string", () => {
    expect(parseStartCommand("")).toBeNull();
  });
});

describe("newLinkToken", () => {
  it("is 32 hex characters", () => {
    expect(newLinkToken()).toMatch(/^[a-f0-9]{32}$/);
  });

  it("differs between calls", () => {
    expect(newLinkToken()).not.toBe(newLinkToken());
  });
});
