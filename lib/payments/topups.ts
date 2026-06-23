import { getStripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreditResult = "credited" | "unpaid" | "error";

// Credits a wallet from a Stripe Checkout Session, used as a backup to the webhook:
// once on the success redirect, and again by the reconciliation cron. credit_topup is
// idempotent, so calling this for an already-credited session is a safe no-op.
export async function creditTopupBySession(sessionId: string): Promise<CreditResult> {
  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return "error";
  }
  if (session.payment_status !== "paid") return "unpaid";

  const { error } = await createAdminClient().rpc("credit_topup", { p_session_id: session.id });
  return error ? "error" : "credited";
}
