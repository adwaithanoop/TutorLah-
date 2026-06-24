export interface TimeInterval {
  start: Date;
  end: Date;
}

export class Availability {
  private readonly slots: TimeInterval[];

  constructor(slots: TimeInterval[]) {
    this.slots = Availability.normalise(slots);
  }

  // Removes the busy intervals from this availability, leaving the gaps a session can
  // still be booked into. Touching endpoints do not chip a window (a booking ending at
  // 6pm leaves 6pm free).
  subtract(busy: Availability): TimeInterval[] {
    const result: TimeInterval[] = [];
    const blocks = busy.slots;
    for (const free of this.slots) {
      let cursor = free.start;
      for (const b of blocks) {
        if (b.end <= cursor) continue;
        if (b.start >= free.end) break;
        if (b.start > cursor) result.push({ start: cursor, end: b.start });
        if (b.end > cursor) cursor = b.end;
        if (cursor >= free.end) break;
      }
      if (cursor < free.end) result.push({ start: cursor, end: free.end });
    }
    return result;
  }

  private static normalise(slots: TimeInterval[]): TimeInterval[] {
    for (const { start, end } of slots) {
      if (start >= end) {
        throw new Error(
          `Invalid interval: start ${start.toISOString()} must be before end ${end.toISOString()}`,
        );
      }
    }
    const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: TimeInterval[] = [];
    for (const slot of sorted) {
      const last = merged[merged.length - 1];
      if (last && slot.start <= last.end) {
        if (slot.end > last.end) last.end = slot.end;
      } else {
        merged.push({ start: slot.start, end: slot.end });
      }
    }
    return merged;
  }
}
