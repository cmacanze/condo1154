import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { formatMZN } from "@/lib/utils";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) return null;

  const expenses = await prisma.expense.findMany({
    include: { createdBy: true },
    orderBy: { expenseDate: "desc" },
  });

  const totalActive = expenses
    .filter((e) => !e.cancelled)
    .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
        <p className="text-sm text-gray-500">
          Total: <strong>{formatMZN(totalActive)}</strong>
        </p>
      </div>
      <ExpensesClient
        expenses={expenses}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
