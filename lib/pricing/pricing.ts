export interface PricingStrategy {
  quote(): number;
}

abstract class Pricing implements PricingStrategy {
  abstract quote(): number;

  protected static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}

export class FixedPricing extends Pricing {
  constructor(
    private readonly ratePerHour: number,
    private readonly hours: number,
  ) {
    super();
    if (ratePerHour <= 0) throw new Error("ratePerHour must be positive");
    if (hours <= 0) throw new Error("hours must be positive");
  }

  quote(): number {
    return Pricing.round(this.ratePerHour * this.hours);
  }
}

export class NegotiablePricing extends Pricing {
  constructor(
    private readonly agreed: number,
    private readonly min: number,
    private readonly max: number,
  ) {
    super();
    if (min < 0) throw new Error("min must not be negative");
    if (min > max) throw new Error("min must not exceed max");
  }

  quote(): number {
    if (this.agreed < this.min || this.agreed > this.max) {
      throw new Error("agreed amount is outside the negotiated range");
    }
    return Pricing.round(this.agreed);
  }
}

export class GroupPricing extends Pricing {
  constructor(
    private readonly totalCost: number,
    private readonly participants: number,
    private readonly floorPerStudent: number,
  ) {
    super();
    if (totalCost <= 0) throw new Error("totalCost must be positive");
    if (participants < 1) throw new Error("participants must be at least 1");
    if (floorPerStudent < 0) throw new Error("floorPerStudent must not be negative");
  }

  quote(): number {
    return Pricing.round(Math.max(this.floorPerStudent, this.totalCost / this.participants));
  }
}
