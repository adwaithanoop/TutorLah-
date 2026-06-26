import {
  MAX_DESCRIPTION,
  formatSosMessage,
  formatSosTakenMessage,
  formatNewBidMessage,
  formatSosWonMessage,
} from "./sos-message";

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

describe("formatNewBidMessage", () => {
  const base = { moduleCode: "CS2103T", amount: 30, siteUrl: "https://tutorlah.app" };

  it("links to the sos page", () => {
    expect(formatNewBidMessage(base).link).toBe("https://tutorlah.app/sos");
  });

  it("normalises a trailing slash in the site url", () => {
    expect(formatNewBidMessage({ ...base, siteUrl: "https://tutorlah.app/" }).link).toBe(
      "https://tutorlah.app/sos",
    );
  });

  it("includes the bold module header and the total amount", () => {
    const { text } = formatNewBidMessage(base);
    expect(text).toContain("<b>CS2103T</b>");
    expect(text).toContain("$30.00");
  });

  it("states a total, never an hourly rate", () => {
    expect(formatNewBidMessage(base).text).not.toContain("/hr");
  });

  it("escapes html in the module code", () => {
    expect(formatNewBidMessage({ ...base, moduleCode: "<x>" }).text).toContain("&lt;x&gt;");
  });
});

describe("formatSosWonMessage", () => {
  const base = { moduleCode: "CS2103T", amount: 45, siteUrl: "https://tutorlah.app" };

  it("links to the bookings page", () => {
    expect(formatSosWonMessage(base).link).toBe("https://tutorlah.app/bookings");
  });

  it("normalises a trailing slash in the site url", () => {
    expect(formatSosWonMessage({ ...base, siteUrl: "https://tutorlah.app/" }).link).toBe(
      "https://tutorlah.app/bookings",
    );
  });

  it("names the module and the total amount", () => {
    const { text } = formatSosWonMessage(base);
    expect(text).toContain("<b>CS2103T</b>");
    expect(text).toContain("$45.00");
  });

  it("escapes html in the module code", () => {
    expect(formatSosWonMessage({ ...base, moduleCode: "<x>" }).text).toContain("&lt;x&gt;");
  });
});
