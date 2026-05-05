import type { Metadata } from "next";
export const metadata: Metadata = { title: "Recibos" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReceiptsClient } from "@/components/receipts/receipts-client";

export default async function ReceiptsPage() {
  const session = await auth();
  if (!session) return null;

  const where =
    session.user.role === "resident"
      ? {
          cancelled: false,
          apartment: {
            residents: {
              some: { userId: session.user.id },
            },
          },
        }
      : { cancelled: false };

  const payments = await prisma.payment.findMany({
    where,
    include: {
      apartment: true,
      monthlyCharge: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recibos</h1>
        <p className="text-sm text-gray-500">{payments.length} recibo(s)</p>
      </div>
      <ReceiptsClient payments={payments} />
    </div>
  );
}
