import { Skeleton } from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <main role="status" aria-busy="true" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-72" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mt-3 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
