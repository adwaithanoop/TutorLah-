import { Availability, type TimeInterval } from "./availability";

const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 0, 1, hour, minute));

const interval = (startHour: number, endHour: number): TimeInterval => ({
  start: at(startHour),
  end: at(endHour),
});

describe("Availability validation", () => {
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
