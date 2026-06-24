import { Skeleton } from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <main role="status" aria-busy="true" className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading messages</span>
      <Skeleton className="mb-6 h-9 w-40" />
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-soft">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </main>
  );
}
