import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <TableSkeleton rows={4} cols={5} />
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
