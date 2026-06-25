import { MAX_DESCRIPTION, formatSosMessage, formatSosTakenMessage } from "./sos-message";

describe("formatSosMessage", () => {
  const base = {
    moduleCode: "CS2103T",
    description: "Need help with week 7",
    siteUrl: "https://tutorlah.app",
  };

  it("links to the sos page", () => {
    expect(formatSosMessage(base).link).toBe("https://tutorlah.app/sos");
  });

  it("normalises a trailing slash in the site url", () => {
    expect(formatSosMessage({ ...base, siteUrl: "https://tutorlah.app/" }).link).toBe(
      "https://tutorlah.app/sos",
    );
  });

  it("includes the bold module header", () => {
    expect(formatSosMessage(base).text).toContain("<b>CS2103T</b>");
  });

  it("escapes html in the description", () => {
    const { text } = formatSosMessage({ ...base, description: "help <script> & more" });
    expect(text).toContain("help &lt;script&gt; &amp; more");
  });

  it("keeps a description at the cap length", () => {
    const description = "x".repeat(MAX_DESCRIPTION);
    expect(formatSosMessage({ ...base, description }).text).toContain(description);
  });

  it("truncates a description past the cap", () => {
    const description = "x".repeat(MAX_DESCRIPTION + 1);
    const { text } = formatSosMessage({ ...base, description });
    expect(text).toContain("…");
    expect(text).not.toContain(description);
  });

  it("is deterministic", () => {
    expect(formatSosMessage(base)).toEqual(formatSosMessage(base));
  });
});

describe("formatSosTakenMessage", () => {
  it("names the module and carries no link", () => {
    const { text } = formatSosTakenMessage({ moduleCode: "CS2103T" });
    expect(text).toContain("<b>CS2103T</b>");
    expect(text).not.toContain("http");
  });

  it("escapes html in the module code", () => {
    expect(formatSosTakenMessage({ moduleCode: "<x>" }).text).toContain("&lt;x&gt;");
  });
});
