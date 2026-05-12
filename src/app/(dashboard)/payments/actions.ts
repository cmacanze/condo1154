"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { calculateOutstanding } from "@/lib/finance";
import { generateReceiptNumber } from "@/lib/utils";
import { uploadFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import Decimal from "decimal.js";

const paymentSchema = z.object({
  monthlyChargeId: z.string().min(1, "Mensalidade obrigatória"),
  paymentDate: z.string().min(1, "Data obrigatória").refine((d) => !isNaN(new Date(d).getTime()), "Data inválida"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export async function createPayment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  // Handle optional attachment before the transaction
  let attachmentUrl: string | null = null;
  const attachmentFile = formData.get("attachment") as File | null;
  if (attachmentFile && attachmentFile.size > 0) {
    const uploadResult = await uploadFile(attachmentFile, "payments");
    if ("error" in uploadResult) return { error: uploadResult.error };
    attachmentUrl = uploadResult.url;
  }

  let payment: { id: string; receiptNumber: string };
  try {
    payment = await prisma.$transaction(async (tx) => {
      // Re-read inside transaction to prevent race conditions
      const charge = await tx.monthlyCharge.findUnique({
        where: { id: data.monthlyChargeId },
      });
      if (!charge) throw new Error("Mensalidade não encontrada.");
      if (charge.status === "paid") throw new Error("Esta mensalidade já está totalmente paga.");
      if (charge.status === "cancelled") throw new Error("Esta mensalidade foi cancelada.");
      if (charge.status === "exempt") throw new Error("Esta mensalidade está isenta.");

      const totalDue = new Decimal(charge.totalDue.toString());
      const totalPaid = new Decimal(charge.totalPaid.toString());
      const paymentAmount = new Decimal(data.amount.toString());
      const newTotalPaid = totalPaid.plus(paymentAmount);

      if (newTotalPaid.greaterThan(totalDue)) {
        throw new Error(`O valor pago (${newTotalPaid.toFixed(2)} MZN) excede o total em dívida (${totalDue.toFixed(2)} MZN).`);
      }

      const newOutstanding = calculateOutstanding(totalDue.toString(), newTotalPaid.toString());
      const newStatus = newOutstanding === 0 ? "paid" : "partial";

      // Retry receipt number generation on collision (unique constraint)
      let receiptNumber = generateReceiptNumber();
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await tx.payment.findUnique({ where: { receiptNumber } });
        if (!exists) break;
        receiptNumber = generateReceiptNumber();
      }

      const p = await tx.payment.create({
        data: {
          apartmentId: charge.apartmentId,
          monthlyChargeId: charge.id,
          paymentDate: new Date(data.paymentDate),
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionReference: data.transactionReference || null,
          receiptNumber,
          attachmentUrl,
          notes: data.notes || null,
          createdById: session.user.id,
        },
      });

      await tx.monthlyCharge.update({
        where: { id: charge.id },
        data: {
          totalPaid: newTotalPaid.toNumber(),
          outstandingAmount: newOutstanding,
          status: newStatus,
        },
      });

      return p;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao registar pagamento." };
  }

  await createAuditLog({
    userId: session.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "created",
    newValues: {
      amount: data.amount,
      method: data.paymentMethod,
      receipt: payment.receiptNumber,
      chargeId: data.monthlyChargeId,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/charges");
  return { success: true, receiptNumber: payment.receiptNumber };
}

export async function cancelPayment(paymentId: string, reason: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  if (!reason.trim()) return { error: "Motivo obrigatório para cancelamento." };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { monthlyCharge: true },
  });
  if (!payment) return { error: "Pagamento não encontrado." };
  if (payment.cancelled) return { error: "Pagamento já cancelado." };

  const charge = payment.monthlyCharge;
  const newTotalPaid = new Decimal(charge.totalPaid.toString())
    .minus(payment.amount.toString());
  const newOutstanding = calculateOutstanding(charge.totalDue.toString(), newTotalPaid.toString());

  let newStatus: "pending" | "partial" | "overdue" = "pending";
  const now = new Date();
  if (newTotalPaid.greaterThan(0)) newStatus = "partial";
  if (charge.dueDate < now && newOutstanding > 0) newStatus = "overdue";

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { cancelled: true, cancelReason: reason },
    }),
    prisma.monthlyCharge.update({
      where: { id: charge.id },
      data: {
        totalPaid: newTotalPaid.toNumber(),
        outstandingAmount: newOutstanding,
        status: newStatus,
      },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    entityType: "payment",
    entityId: paymentId,
    action: "cancelled",
    reason,
    oldValues: { amount: payment.amount.toString() },
  });

  revalidatePath("/payments");
  revalidatePath("/charges");
  return { success: true };
}
