import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("leaves a plain string unchanged", () => {
    expect(escapeHtml("CS2103T tutor needed")).toBe("CS2103T tutor needed");
  });

  it("escapes an empty string to empty", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes the ampersand", () => {
    expect(escapeHtml("you & me")).toBe("you &amp; me");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
  });

  it("escapes the ampersand before tags so it is not double-escaped", () => {
    expect(escapeHtml("a<b & c>")).toBe("a&lt;b &amp; c&gt;");
  });
});
