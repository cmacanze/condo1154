import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 max-w-xs" />
        <Skeleton className="h-9 w-32" />
      </div>
      <TableSkeleton rows={8} cols={7} />
    </div>
  );
}
