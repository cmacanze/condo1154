import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64 max-w-xs" />
      <TableSkeleton rows={8} cols={7} />
    </div>
  );
}
