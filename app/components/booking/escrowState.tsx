export const ESCROW_STATE_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  held: "bg-indigo-50 text-indigo-700",
  completed: "bg-sky-50 text-sky-700",
  released: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-rose-50 text-rose-700",
};

export const ESCROW_STATE_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  held: "In escrow",
  completed: "Completed",
  released: "Paid out",
  cancelled: "Cancelled",
  refunded: "Refunded",
};