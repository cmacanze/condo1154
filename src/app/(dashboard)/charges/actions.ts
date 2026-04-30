"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { calculateLateFee } from "@/lib/finance";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generateSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
});

export async function generateMonthlyCharges(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { year, month } = parsed.data;
  const referenceMonth = new Date(year, month - 1, 1);

  const apartments = await prisma.apartment.findMany({
    where: { status: "active" },
  });

  let created = 0;
  let skipped = 0;

  for (const apt of apartments) {
    const existing = await prisma.monthlyCharge.findUnique({
      where: {
        apartmentId_referenceMonth: {
          apartmentId: apt.id,
          referenceMonth,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const baseAmount = parseFloat(apt.monthlyContribution.toString());
    const dueDate = new Date(year, month - 1, apt.paymentDueDay);

    await prisma.monthlyCharge.create({
      data: {
        apartmentId: apt.id,
        referenceMonth,
        baseAmount,
        dueDate,
        lateFeeAmount: 0,
        totalDue: baseAmount,
        totalPaid: 0,
        outstandingAmount: baseAmount,
        status: "pending",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      entityType: "monthly_charge",
      entityId: apt.id,
      action: "generated",
      newValues: { apartmentId: apt.id, referenceMonth: referenceMonth.toISOString(), baseAmount },
    });

    created++;
  }

  revalidatePath("/charges");
  return { success: true, created, skipped };
}

export async function applyLateFees(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const now = new Date();

  const overdueCharges = await prisma.monthlyCharge.findMany({
    where: {
      status: { in: ["pending", "partial"] },
      dueDate: { lt: now },
      lateFeeAmount: 0,
    },
    include: { apartment: true },
  });

  let applied = 0;

  for (const charge of overdueCharges) {
    const apt = charge.apartment;
    if (apt.lateFeeType === "none") {
      await prisma.monthlyCharge.update({
        where: { id: charge.id },
        data: { status: "overdue" },
      });
      continue;
    }

    const feeAmount = calculateLateFee(
      charge.baseAmount.toString(),
      apt.lateFeeType,
      apt.lateFeeValue.toString()
    );

    const newTotalDue = parseFloat(charge.baseAmount.toString()) + feeAmount;
    const newOutstanding = Math.max(
      0,
      newTotalDue - parseFloat(charge.totalPaid.toString())
    );

    await prisma.monthlyCharge.update({
      where: { id: charge.id },
      data: {
        lateFeeAmount: feeAmount,
        totalDue: newTotalDue,
        outstandingAmount: newOutstanding,
        status: "overdue",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      entityType: "late_fee",
      entityId: charge.id,
      action: "applied",
      newValues: { feeAmount, newTotalDue },
    });

    applied++;
  }

  revalidatePath("/charges");
  return { success: true, applied };
}

export async function exemptCharge(chargeId: string, reason: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const charge = await prisma.monthlyCharge.findUnique({ where: { id: chargeId } });
  if (!charge) return { error: "Mensalidade não encontrada." };

  await prisma.monthlyCharge.update({
    where: { id: chargeId },
    data: { status: "exempt", outstandingAmount: 0 },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "monthly_charge",
    entityId: chargeId,
    action: "updated",
    oldValues: { status: charge.status },
    newValues: { status: "exempt" },
    reason,
  });

  revalidatePath("/charges");
  return { success: true };
}
