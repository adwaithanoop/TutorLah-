import { Skeleton } from "@/app/components/Skeleton";

function TutorCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-7 w-10" />
      </div>
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mt-4 h-9 w-full rounded-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <main role="status" aria-busy="true" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading dashboard</span>
      <header className="mb-8 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </header>
      <Skeleton className="mb-10 h-48 w-full rounded-2xl" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TutorCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
