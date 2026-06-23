import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/payments/stripe";
import { topupSchema } from "@/lib/validation/wallet";
import { dollarsToCents } from "@/lib/wallet/money";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = topupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const amount = Math.round(parsed.data.amount * 100) / 100;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const returnTo = new URL(parsed.data.redirect ?? "/wallet", origin);
  const successUrl = new URL(returnTo);
  successUrl.searchParams.set("topup", "success");
  const cancelUrl = new URL(returnTo);
  cancelUrl.searchParams.set("topup", "cancelled");
  // Stripe replaces the literal {CHECKOUT_SESSION_ID}; it must stay unencoded, so it is
  // appended raw rather than through URLSearchParams. The session id lets the page verify
  // the payment on return as a backup to the webhook.
  const successWithSession = `${successUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`;

  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "sgd",
            unit_amount: dollarsToCents(amount),
            product_data: { name: "TutorLah wallet top-up" },
          },
        },
      ],
      success_url: successWithSession,
      cancel_url: cancelUrl.toString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { error } = await createAdminClient()
    .from("wallet_topups")
    .insert({ user_id: user.id, stripe_session_id: session.id, amount });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: session.url });
}
