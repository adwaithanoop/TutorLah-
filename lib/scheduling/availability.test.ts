import { Availability, type TimeInterval } from "./availability";

const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 0, 1, hour, minute));

const interval = (startHour: number, endHour: number): TimeInterval => ({
  start: at(startHour),
  end: at(endHour),
});

const overlap = (
  a: TimeInterval[],
  b: TimeInterval[],
  minDuration?: number,
): TimeInterval[] => new Availability(a).intersect(new Availability(b), minDuration);

const HOUR = 60 * 60 * 1000;

describe("Availability.intersect", () => {
  test("returns nothing when the parties never overlap", () => {
    expect(overlap([interval(9, 10)], [interval(11, 12)])).toEqual([]);
  });

  test("returns the overlapping window for a partial overlap", () => {
    expect(overlap([interval(9, 11)], [interval(10, 12)])).toEqual([interval(10, 11)]);
  });

  test("returns the inner interval when one fully contains the other", () => {
    expect(overlap([interval(9, 13)], [interval(10, 12)])).toEqual([interval(10, 12)]);
  });

  test("collects overlaps across multiple slots on each side", () => {
    const tutor = [interval(9, 11), interval(14, 17)];
    const student = [interval(10, 12), interval(15, 16), interval(16, 18)];
    expect(overlap(tutor, student)).toEqual([
      interval(10, 11),
      interval(15, 17),
    ]);
  });

  test("handles unsorted input and returns results sorted by start", () => {
    const tutor = [interval(14, 16), interval(9, 11)];
    const student = [interval(15, 17), interval(10, 12)];
    expect(overlap(tutor, student)).toEqual([
      interval(10, 11),
      interval(15, 16),
    ]);
  });

  test("excludes touching endpoints (no zero-length intervals)", () => {
    expect(overlap([interval(9, 11)], [interval(11, 13)])).toEqual([]);
  });

  test("drops overlaps shorter than minDuration", () => {
    const tutor = [interval(9, 11), interval(14, 18)];
    const student = [interval(10, 11), interval(15, 17)];
    expect(overlap(tutor, student, 2 * HOUR)).toEqual([interval(15, 17)]);
  });

  test("keeps overlaps exactly equal to minDuration", () => {
    expect(overlap([interval(9, 11)], [interval(9, 11)], 2 * HOUR)).toEqual([
      interval(9, 11),
    ]);
  });

  test("returns empty when either party has no availability", () => {
    expect(overlap([], [interval(9, 11)])).toEqual([]);
    expect(overlap([interval(9, 11)], [])).toEqual([]);
  });

  test("merges a party's own overlapping slots before intersecting", () => {
    const tutor = [interval(9, 12), interval(11, 14)];
    const student = [interval(10, 13)];
    expect(overlap(tutor, student)).toEqual([interval(10, 13)]);
  });

  test("throws on an interval whose start is not before its end", () => {
    expect(() => new Availability([interval(11, 9)])).toThrow();
    expect(() => new Availability([interval(10, 10)])).toThrow();
  });
});

const free = (a: TimeInterval[], busy: TimeInterval[]): TimeInterval[] =>
  new Availability(a).subtract(new Availability(busy));

describe("Availability.subtract", () => {
  test("returns the whole window when nothing is booked", () => {
    expect(free([interval(9, 17)], [])).toEqual([interval(9, 17)]);
  });

  test("punches a hole for a booking inside the window", () => {
    expect(free([interval(9, 17)], [interval(12, 13)])).toEqual([
      interval(9, 12),
      interval(13, 17),
    ]);
  });

  test("trims the front and back when bookings hug the edges", () => {
    expect(free([interval(9, 17)], [interval(9, 10), interval(16, 17)])).toEqual([
      interval(10, 16),
    ]);
  });

  test("drops a window fully covered by a booking", () => {
    expect(free([interval(10, 12)], [interval(9, 13)])).toEqual([]);
  });

  test("touching bookings do not chip the window", () => {
    expect(free([interval(9, 17)], [interval(17, 19)])).toEqual([interval(9, 17)]);
    expect(free([interval(9, 17)], [interval(7, 9)])).toEqual([interval(9, 17)]);
  });

  test("merges overlapping bookings before subtracting", () => {
    expect(free([interval(9, 18)], [interval(11, 13), interval(12, 14)])).toEqual([
      interval(9, 11),
      interval(14, 18),
    ]);
  });

  test("subtracts across several windows independently", () => {
    expect(free([interval(9, 11), interval(14, 17)], [interval(10, 15)])).toEqual([
      interval(9, 10),
      interval(15, 17),
    ]);
  });
});
