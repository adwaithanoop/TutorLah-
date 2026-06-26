import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { listSubjects } from "@/lib/modules/catalog";
import { loadSosDashboard } from "@/lib/sos/dashboard";
import PostSosForm from "@/app/components/sos/PostSosForm";
import BidForm from "@/app/components/sos/BidForm";
import AcceptButton from "@/app/components/sos/AcceptButton";
import ResolveButton from "@/app/components/sos/ResolveButton";
import RefreshButton from "@/app/components/sos/RefreshButton";
import SosRealtime from "@/app/components/sos/SosRealtime";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  matched: "Matched",
  cancelled: "Resolved",
};

export default async function SosPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const [{ myRequests, openForMe, receivingSos }, modules] = await Promise.all([
    loadSosDashboard(supabase, user!.id),
    listSubjects(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <SosRealtime />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">SOS: urgent help</h1>
        <RefreshButton />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <PostSosForm modules={modules} />
          <h2 className="text-lg font-bold text-gray-900">Your requests</h2>
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No SOS requests yet.</p>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="rounded-2xl bg-white shadow-soft p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-indigo-700">{req.module_code}</span>
                    <span className="text-xs text-gray-400">{STATUS_LABEL[req.status] ?? req.status}</span>
                  </div>
                  {req.status === "open" && <ResolveButton requestId={req.id} />}
                </div>
                <p className="mt-1 text-sm text-gray-600">{req.description}</p>
                <div className="mt-3 space-y-2">
                  {req.bids.length === 0 && <p className="text-xs text-gray-400">Waiting for bids…</p>}
                  {req.bids.map((bid, i) => (
                    <div key={bid.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{bid.tutorName}</span>
                        <span className="ml-2 text-gray-500">${bid.rate}/hr</span>
                        <span className="ml-2 text-xs text-emerald-600">score {bid.reliabilityScore}</span>
                        {i === 0 && req.status === "open" && (
                          <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
                            best match
                          </span>
                        )}
                      </div>
                      {req.status === "open" && bid.status === "pending" && (
                        <AcceptButton requestId={req.id} bidId={bid.id} />
                      )}
                      {bid.status === "accepted" && <span className="text-xs font-semibold text-emerald-600">accepted</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Requests you can help with</h2>
          {!receivingSos ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
              You are not receiving SOS requests. Turn it on from your{" "}
              <Link href="/dashboard/tutor" className="font-semibold text-indigo-600 hover:text-indigo-700">
                dashboard
              </Link>{" "}
              to see and bid on open requests.
            </p>
          ) : openForMe.length === 0 ? (
            <p className="text-sm text-gray-500">
              No open requests for your verified modules right now.
            </p>
          ) : (
            openForMe.map((req) => (
              <div key={req.id} className="rounded-2xl bg-white shadow-soft p-5">
                <span className="font-mono text-sm font-semibold text-indigo-700">{req.module_code}</span>
                <p className="mt-1 mb-3 text-sm text-gray-600">{req.description}</p>
                <BidForm requestId={req.id} />
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
