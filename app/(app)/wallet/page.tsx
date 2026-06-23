import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getBalance, getRecentTransactions } from "@/lib/wallet/service";
import { suggestTopUp } from "@/lib/wallet/money";
import { creditTopupBySession } from "@/lib/payments/topups";
import WalletTopUp from "@/app/components/wallet/WalletTopUp";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const KIND_LABELS: Record<string, string> = {
  topup: "Top-up",
  escrow_hold: "Held for booking",
  escrow_release: "Session payout",
  escrow_refund: "Refund",
};

const KIND_STYLES: Record<string, string> = {
  topup: "bg-emerald-50 text-emerald-700",
  escrow_hold: "bg-amber-50 text-amber-700",
  escrow_release: "bg-emerald-50 text-emerald-700",
  escrow_refund: "bg-sky-50 text-sky-700",
};

export default async function WalletPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // Returning from Stripe: credit straight away so the balance below is fresh, rather
  // than waiting on the webhook.
  const sessionId = first(params.session_id);
  if (sessionId) await creditTopupBySession(sessionId);

  const [balance, transactions] = await Promise.all([
    getBalance(supabase, user!.id),
    getRecentTransactions(supabase, user!.id),
  ]);

  const need = Number(first(params.need) ?? "0");
  const suggested = suggestTopUp(Number.isFinite(need) ? need : 0, balance);
  const topupResult = first(params.topup);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Wallet</h1>

      {topupResult === "success" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Payment received. Your balance updates within a few seconds.
        </p>
      )}
      {topupResult === "cancelled" && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Top-up cancelled. Nothing was charged.
        </p>
      )}

      <div className="mb-5 rounded-2xl bg-white shadow-soft p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Balance</p>
        <p className="mt-1 text-4xl font-black text-gray-900">${balance.toFixed(2)}</p>
      </div>

      <div className="mb-5">
        <WalletTopUp suggested={suggested} />
      </div>

      <div className="rounded-2xl bg-white shadow-soft p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.map((t) => {
              const amount = Number(t.amount);
              return (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${KIND_STYLES[t.kind]}`}
                    >
                      {KIND_LABELS[t.kind]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${amount < 0 ? "text-gray-900" : "text-emerald-600"}`}
                  >
                    {amount < 0 ? "-" : "+"}${Math.abs(amount).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
