import { createClient } from "@/lib/supabase/server";
import { loadSosDashboard } from "@/lib/sos/dashboard";
import PostSosForm from "@/app/components/sos/PostSosForm";
import BidForm from "@/app/components/sos/BidForm";
import AcceptButton from "@/app/components/sos/AcceptButton";
import RefreshButton from "@/app/components/sos/RefreshButton";
import SosRealtime from "@/app/components/sos/SosRealtime";

export default async function SosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { myRequests, openForMe } = await loadSosDashboard(supabase, user!.id);
  const { data: subjectRows } = await supabase
    .from("subjects")
    .select("module_code, title")
    .order("module_code");
  const modules = (subjectRows ?? []).map((s) => ({ code: s.module_code, title: s.title }));

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
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-indigo-700">{req.module_code}</span>
                  <span className="text-xs text-gray-400">{req.status}</span>
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
          {openForMe.length === 0 ? (
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
