import { Skeleton } from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <main role="status" aria-busy="true" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading bookings</span>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-52" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </div>
      <ul className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
