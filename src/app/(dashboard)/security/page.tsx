import type { Metadata } from "next";
export const metadata: Metadata = { title: "Seguranças" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SecurityClient } from "@/components/security/security-client";

export default async function SecurityPage() {
  const session = await auth();
  if (!session) return null;

  const [staff, salaries] = await Promise.all([
    prisma.securityStaff.findMany({ orderBy: { name: "asc" } }),
    prisma.salaryPayment.findMany({
      include: { securityStaff: true, createdBy: true },
      orderBy: { paymentDate: "desc" },
      take: 300,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seguranças</h1>
        <p className="text-sm text-gray-500">Gestão de seguranças e pagamentos de salários</p>
      </div>
      <SecurityClient
        staff={staff}
        salaries={salaries}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
