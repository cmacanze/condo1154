import type { Metadata } from "next";
export const metadata: Metadata = { title: "Relatórios" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) return null;

  const where =
    session.user.role === "resident" ? { published: true } : {};

  const reports = await prisma.report.findMany({
    where,
    include: { createdBy: true },
    orderBy: { referenceMonth: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios Mensais</h1>
        <p className="text-sm text-gray-500">{reports.length} relatório(s)</p>
      </div>
      <ReportsClient
        reports={serialize(reports)}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
