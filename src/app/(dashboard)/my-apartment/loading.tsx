import { Skeleton, CardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-32" />
      </div>
      <CardsSkeleton count={3} />
      <div className="space-y-1">
        <Skeleton className="h-5 w-32" />
        <TableSkeleton rows={6} cols={8} />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-5 w-48" />
        <TableSkeleton rows={5} cols={6} />
      </div>
    </div>
  );
}
