import { BookingEscrow, type EscrowState } from "./escrow";

const SCHEDULED_END = new Date("2026-06-01T12:00:00Z");
const AFTER_END = new Date("2026-06-01T13:00:00Z");
const BEFORE_END = new Date("2026-06-01T11:59:59Z");

const escrow = (state?: EscrowState) =>
  new BookingEscrow({ scheduledEnd: SCHEDULED_END }, state);

describe("BookingEscrow", () => {
  test("defaults to pending_payment", () => {
    expect(escrow().state).toBe("pending_payment");
  });

  test("happy path: pay, report, complete, release", () => {
    const e = escrow();
    e.pay();
    expect(e.state).toBe("held");
    e.submitReport();
    e.complete(AFTER_END);
    expect(e.state).toBe("completed");
    e.release();
    expect(e.state).toBe("released");
  });

  test("cancel from pending_payment", () => {
    const e = escrow();
    e.cancel();
    expect(e.state).toBe("cancelled");
  });

  test("refund from held", () => {
    const e = escrow();
    e.pay();
    e.refund();
    expect(e.state).toBe("refunded");
  });

  describe("release guard", () => {
    test("complete throws before the scheduled end even with a report", () => {
      const e = escrow();
      e.pay();
      e.submitReport();
      expect(() => e.complete(BEFORE_END)).toThrow();
      expect(e.state).toBe("held");
    });

    test("complete throws without a submitted report even after the scheduled end", () => {
      const e = escrow();
      e.pay();
      expect(() => e.complete(AFTER_END)).toThrow();
      expect(e.state).toBe("held");
    });

    test("complete succeeds exactly at the scheduled end with a report", () => {
      const e = escrow();
      e.pay();
      e.submitReport();
      e.complete(SCHEDULED_END);
      expect(e.state).toBe("completed");
    });

    test("release throws from held: funds never release early", () => {
      const e = escrow();
      e.pay();
      e.submitReport();
      expect(() => e.release()).toThrow();
      expect(e.state).toBe("held");
    });
  });

  describe("illegal transitions throw", () => {
    test("pay only from pending_payment", () => {
      const e = escrow();
      e.pay();
      expect(() => e.pay()).toThrow();
    });

    test("cancel only from pending_payment", () => {
      const e = escrow();
      e.pay();
      expect(() => e.cancel()).toThrow();
    });

    test("submitReport only while held", () => {
      expect(() => escrow().submitReport()).toThrow();
      expect(() => escrow("completed").submitReport()).toThrow();
    });

    test("complete only from held", () => {
      expect(() => escrow().complete(AFTER_END)).toThrow();
      expect(() => escrow("completed").complete(AFTER_END)).toThrow();
    });

    test("refund only from held", () => {
      expect(() => escrow().refund()).toThrow();
      expect(() => escrow("completed").refund()).toThrow();
    });

    test("release only from completed", () => {
      expect(() => escrow().release()).toThrow();
    });
  });

  describe("terminal states reject every event", () => {
    const terminals: EscrowState[] = ["released", "cancelled", "refunded"];
    for (const terminal of terminals) {
      test(`${terminal} is terminal`, () => {
        expect(() => escrow(terminal).pay()).toThrow();
        expect(() => escrow(terminal).cancel()).toThrow();
        expect(() => escrow(terminal).submitReport()).toThrow();
        expect(() => escrow(terminal).complete(AFTER_END)).toThrow();
        expect(() => escrow(terminal).refund()).toThrow();
        expect(() => escrow(terminal).release()).toThrow();
      });
    }
  });
});
