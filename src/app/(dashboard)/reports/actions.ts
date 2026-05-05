"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reportSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  openingBalance: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export async function generateReport(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { year, month, openingBalance, notes } = parsed.data;
  const referenceMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const existing = await prisma.report.findUnique({ where: { referenceMonth } });
  if (existing) return { error: "Já existe um relatório para este mês. Delete-o primeiro para regenerar." };

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: {
        cancelled: false,
        paymentDate: { gte: referenceMonth, lte: endOfMonth },
      },
    }),
    prisma.expense.findMany({
      where: {
        cancelled: false,
        expenseDate: { gte: referenceMonth, lte: endOfMonth },
      },
    }),
  ]);

  const totalIncome = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );

  const totalLateFees = await prisma.monthlyCharge.aggregate({
    where: {
      referenceMonth,
      lateFeeAmount: { gt: 0 },
    },
    _sum: { lateFeeAmount: true },
  });

  const lateFeeTotal = parseFloat(
    (totalLateFees._sum.lateFeeAmount ?? 0).toString()
  );

  const closingBalance = openingBalance + totalIncome - totalExpenses;

  const report = await prisma.report.create({
    data: {
      referenceMonth,
      openingBalance,
      totalIncome,
      totalLateFees: lateFeeTotal,
      totalExpenses,
      closingBalance,
      notes: notes || null,
      published: false,
      createdById: session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "report",
    entityId: report.id,
    action: "generated",
    newValues: { referenceMonth: referenceMonth.toISOString(), closingBalance },
  });

  revalidatePath("/reports");
  return { success: true };
}

export async function publishReport(reportId: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  await prisma.report.update({
    where: { id: reportId },
    data: { published: true },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action: "published",
  });

  revalidatePath("/reports");
  return { success: true };
}

export async function unpublishReport(reportId: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  await prisma.report.update({
    where: { id: reportId },
    data: { published: false },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action: "updated",
    newValues: { published: false },
  });

  revalidatePath("/reports");
  return { success: true };
}
