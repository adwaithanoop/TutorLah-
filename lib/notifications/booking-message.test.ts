import { formatBookingResponseMessage } from "./booking-message";

describe("formatBookingResponseMessage", () => {
  const base = {
    moduleCode: "CS2103T",
    when: "Mon, 30 Jun, 4:00 PM",
    siteUrl: "https://tutorlah.app",
  };

  it("links to the requests page", () => {
    expect(formatBookingResponseMessage({ ...base, action: "accept" }).link).toBe(
      "https://tutorlah.app/bookings/requests",
    );
  });

  it("normalises a trailing slash in the site url", () => {
    expect(
      formatBookingResponseMessage({ ...base, action: "accept", siteUrl: "https://tutorlah.app/" }).link,
    ).toBe("https://tutorlah.app/bookings/requests");
  });

  it("uses a distinct headline per action", () => {
    const accept = formatBookingResponseMessage({ ...base, action: "accept" }).text;
    const decline = formatBookingResponseMessage({ ...base, action: "decline" }).text;
    const counter = formatBookingResponseMessage({ ...base, action: "counter" }).text;
    expect(accept).toContain("accepted");
    expect(decline).toContain("declined");
    expect(counter).toContain("Counter offer");
    expect(accept).not.toBe(decline);
  });

  it("includes the bold module header and the time", () => {
    const { text } = formatBookingResponseMessage({ ...base, action: "accept" });
    expect(text).toContain("<b>CS2103T</b>");
    expect(text).toContain("Mon, 30 Jun, 4:00 PM");
  });

  it("escapes html in the module code", () => {
    expect(
      formatBookingResponseMessage({ ...base, action: "decline", moduleCode: "<x>" }).text,
    ).toContain("&lt;x&gt;");
  });
});
