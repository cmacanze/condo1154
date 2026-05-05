"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ChargesYearFilter({
  years,
  currentYear,
}: {
  years: number[];
  currentYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={String(currentYear)}
      onValueChange={(v) => router.push(`${pathname}?year=${v}`)}
    >
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
