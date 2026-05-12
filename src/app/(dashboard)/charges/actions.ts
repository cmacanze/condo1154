"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { calculateLateFee } from "@/lib/finance";
import { sendOverdueNotification } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generateSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
});

export async function generateMonthlyCharges(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { year, month } = parsed.data;
  const referenceMonth = new Date(year, month - 1, 1);

  const [apartments, existingCharges] = await Promise.all([
    prisma.apartment.findMany({ where: { status: "active" } }),
    prisma.monthlyCharge.findMany({
      where: { referenceMonth },
      select: { apartmentId: true },
    }),
  ]);

  const existingApartmentIds = new Set(existingCharges.map((c) => c.apartmentId));
  const toCreate = apartments.filter((apt) => !existingApartmentIds.has(apt.id));
  const skipped = apartments.length - toCreate.length;

  if (toCreate.length > 0) {
    await prisma.monthlyCharge.createMany({
      data: toCreate.map((apt) => {
        const baseAmount = parseFloat(apt.monthlyContribution.toString());
        return {
          apartmentId: apt.id,
          referenceMonth,
          baseAmount,
          dueDate: new Date(year, month - 1, apt.paymentDueDay),
          lateFeeAmount: 0,
          totalDue: baseAmount,
          totalPaid: 0,
          outstandingAmount: baseAmount,
          status: "pending",
        };
      }),
    });

    await createAuditLog({
      userId: session.user.id,
      entityType: "monthly_charge",
      entityId: referenceMonth.toISOString(),
      action: "generated",
      newValues: { referenceMonth: referenceMonth.toISOString(), created: toCreate.length },
    });
  }

  const created = toCreate.length;

  revalidatePath("/charges");
  return { success: true, created, skipped };
}

export async function applyLateFees(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const now = new Date();

  const overdueCharges = await prisma.monthlyCharge.findMany({
    where: {
      status: { in: ["pending", "partial"] },
      dueDate: { lt: now },
      lateFeeAmount: 0,
    },
    include: { apartment: true },
  });

  const updates = overdueCharges.map((charge) => {
    const apt = charge.apartment;
    if (apt.lateFeeType === "none") {
      return { id: charge.id, data: { status: "overdue" as const }, feeAmount: 0, newTotalDue: 0 };
    }
    const feeAmount = calculateLateFee(charge.baseAmount.toString(), apt.lateFeeType, apt.lateFeeValue.toString());
    const newTotalDue = parseFloat(charge.baseAmount.toString()) + feeAmount;
    const newOutstanding = Math.max(0, newTotalDue - parseFloat(charge.totalPaid.toString()));
    return {
      id: charge.id,
      data: { lateFeeAmount: feeAmount, totalDue: newTotalDue, outstandingAmount: newOutstanding, status: "overdue" as const },
      feeAmount,
      newTotalDue,
    };
  });

  await prisma.$transaction(updates.map((u) => prisma.monthlyCharge.update({ where: { id: u.id }, data: u.data })));

  // Audit logs are non-blocking and don't need to be in the transaction
  await Promise.all(
    updates
      .filter((u) => u.feeAmount > 0)
      .map((u) =>
        createAuditLog({
          userId: session.user.id,
          entityType: "late_fee",
          entityId: u.id,
          action: "applied",
          newValues: { feeAmount: u.feeAmount, newTotalDue: u.newTotalDue },
        })
      )
  );

  const applied = updates.filter((u) => u.feeAmount > 0).length;

  revalidatePath("/charges");
  return { success: true, applied };
}

export async function exemptCharge(chargeId: string, reason: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

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

export async function notifyOverdueResidents() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const overdueCharges = await prisma.monthlyCharge.findMany({
    where: { status: { in: ["overdue", "partial"] } },
    include: {
      apartment: {
        include: {
          residents: { where: { status: "active" }, include: { user: true } },
        },
      },
    },
  });

  const allSends = overdueCharges.flatMap((charge) =>
    charge.apartment.residents
      .filter((r) => r.user.email)
      .map((r) => () =>
        sendOverdueNotification({
          residentName: r.user.name,
          residentEmail: r.user.email!,
          apartmentName: charge.apartment.name,
          referenceMonth: charge.referenceMonth,
          totalDue: parseFloat(charge.totalDue.toString()),
          totalPaid: parseFloat(charge.totalPaid.toString()),
          outstandingAmount: parseFloat(charge.outstandingAmount.toString()),
          lateFeeAmount: parseFloat(charge.lateFeeAmount.toString()),
        }).catch(() => null)
      )
  );

  // Send in batches of 50 to avoid provider rate limits
  const BATCH_SIZE = 50;
  let notified = 0;
  for (let i = 0; i < allSends.length; i += BATCH_SIZE) {
    const batch = allSends.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((fn) => fn()));
    notified += results.filter((r) => r !== null).length;
  }

  return { success: true, notified };
}
