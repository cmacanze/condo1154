import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mensalidades" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChargesClient } from "@/components/charges/charges-client";

export default async function ChargesPage() {
  const session = await auth();
  if (!session) return null;

  const charges = await prisma.monthlyCharge.findMany({
    include: { apartment: true },
    orderBy: [{ referenceMonth: "desc" }, { apartment: { name: "asc" } }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensalidades</h1>
        <p className="text-sm text-gray-500">{charges.length} mensalidade(s) registada(s)</p>
      </div>
      <ChargesClient charges={charges} isAdmin={session.user.role === "admin"} />
    </div>
  );
}
