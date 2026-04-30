import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "@/components/payments/payments-client";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session) return null;

  const [payments, charges] = await Promise.all([
    prisma.payment.findMany({
      include: { apartment: true, monthlyCharge: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.monthlyCharge.findMany({
      include: { apartment: true },
      where: { status: { in: ["pending", "partial", "overdue"] } },
      orderBy: [{ apartment: { name: "asc" } }, { referenceMonth: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-500">{payments.filter((p) => !p.cancelled).length} pagamento(s) activo(s)</p>
      </div>
      <PaymentsClient
        payments={payments}
        charges={charges}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
