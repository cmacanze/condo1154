import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
        <Skeleton className="h-5 w-24" />
        <TableSkeleton rows={3} cols={4} />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
        <Skeleton className="h-5 w-28" />
        <TableSkeleton rows={6} cols={6} />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    </div>
  );
}
