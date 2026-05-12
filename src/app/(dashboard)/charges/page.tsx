import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mensalidades" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChargesClient } from "@/components/charges/charges-client";
import { ChargesYearFilter } from "@/components/charges/charges-year-filter";
import { Suspense } from "react";

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session) return null;

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? "") || now.getFullYear();

  const charges = await prisma.monthlyCharge.findMany({
    where: {
      referenceMonth: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    include: { apartment: true },
    orderBy: [{ referenceMonth: "desc" }, { apartment: { name: "asc" } }],
  });

  // Distinct years that have charge data, for the year picker
  const yearGroups = await prisma.monthlyCharge.groupBy({
    by: ["referenceMonth"],
    orderBy: { referenceMonth: "desc" },
  });
  const years = [...new Set(yearGroups.map((g) => new Date(g.referenceMonth).getFullYear()))];
  if (!years.includes(year)) years.push(year);
  years.sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensalidades</h1>
          <p className="text-sm text-gray-500">{charges.length} mensalidade(s) em {year}</p>
        </div>
        <Suspense>
          <ChargesYearFilter years={years} currentYear={year} />
        </Suspense>
      </div>
      <ChargesClient charges={charges} isAdmin={session.user.role === "admin"} />
    </div>
  );
}
