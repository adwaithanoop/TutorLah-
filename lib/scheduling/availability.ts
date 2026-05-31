export interface TimeInterval {
  start: Date;
  end: Date;
}

export class Availability {
  private readonly slots: TimeInterval[];

  constructor(slots: TimeInterval[]) {
    this.slots = Availability.normalise(slots);
  }

  intersect(other: Availability, minDuration = 0): TimeInterval[] {
    const result: TimeInterval[] = [];
    let i = 0;
    let j = 0;
    while (i < this.slots.length && j < other.slots.length) {
      const a = this.slots[i];
      const b = other.slots[j];
      const start = a.start > b.start ? a.start : b.start;
      const end = a.end < b.end ? a.end : b.end;
      if (start < end && end.getTime() - start.getTime() >= minDuration) {
        result.push({ start, end });
      }
      if (a.end < b.end) i++;
      else j++;
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
