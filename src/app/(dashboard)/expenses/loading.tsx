import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <TableSkeleton rows={7} cols={8} />
    </div>
  );
}
