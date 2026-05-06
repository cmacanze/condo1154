import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <TableSkeleton rows={8} cols={9} />
      </div>
    </div>
  );
}
