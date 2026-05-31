export type EscrowState =
  | "pending_payment"
  | "held"
  | "completed"
  | "released"
  | "cancelled"
  | "refunded";

export interface EscrowContext {
  scheduledEnd: Date;
}

export class BookingEscrow {
  private _state: EscrowState;
  private reportSubmitted = false;

  constructor(
    private readonly context: EscrowContext,
    initialState: EscrowState = "pending_payment",
  ) {
    this._state = initialState;
  }

  get state(): EscrowState {
    return this._state;
  }

  pay(): void {
    this.assertState("pay", "pending_payment");
    this._state = "held";
  }

  cancel(): void {
    this.assertState("cancel", "pending_payment");
    this._state = "cancelled";
  }

  submitReport(): void {
    this.assertState("submitReport", "held");
    this.reportSubmitted = true;
  }

  complete(now: Date): void {
    this.assertState("complete", "held");
    if (now < this.context.scheduledEnd) {
      throw new Error("Cannot complete escrow before the scheduled end.");
    }
    if (!this.reportSubmitted) {
      throw new Error("Cannot complete escrow without a submitted session report.");
    }
    this._state = "completed";
  }

  refund(): void {
    this.assertState("refund", "held");
    this._state = "refunded";
  }

  release(): void {
    this.assertState("release", "completed");
    this._state = "released";
  }

  private assertState(event: string, expected: EscrowState): void {
    if (this._state !== expected) {
      throw new Error(`Cannot ${event} from state "${this._state}"; expected "${expected}".`);
    }
  }
}
