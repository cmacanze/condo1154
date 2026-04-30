"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { calculateOutstanding } from "@/lib/finance";
import { generateReceiptNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import Decimal from "decimal.js";

const paymentSchema = z.object({
  monthlyChargeId: z.string().min(1, "Mensalidade obrigatória"),
  paymentDate: z.string().min(1, "Data obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export async function createPayment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  const charge = await prisma.monthlyCharge.findUnique({
    where: { id: data.monthlyChargeId },
  });
  if (!charge) return { error: "Mensalidade não encontrada." };
  if (charge.status === "paid") return { error: "Esta mensalidade já está totalmente paga." };
  if (charge.status === "cancelled") return { error: "Esta mensalidade foi cancelada." };
  if (charge.status === "exempt") return { error: "Esta mensalidade está isenta." };

  const totalDue = new Decimal(charge.totalDue.toString());
  const totalPaid = new Decimal(charge.totalPaid.toString());
  const paymentAmount = new Decimal(data.amount.toString());

  const newTotalPaid = totalPaid.plus(paymentAmount);

  if (newTotalPaid.greaterThan(totalDue)) {
    return { error: `O valor pago (${newTotalPaid.toFixed(2)} MZN) excede o total em dívida (${totalDue.toFixed(2)} MZN).` };
  }

  const newOutstanding = calculateOutstanding(totalDue.toString(), newTotalPaid.toString());
  const newStatus = newOutstanding === 0 ? "paid" : "partial";

  const receiptNumber = generateReceiptNumber();

  const payment = await prisma.payment.create({
    data: {
      apartmentId: charge.apartmentId,
      monthlyChargeId: charge.id,
      paymentDate: new Date(data.paymentDate),
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference || null,
      receiptNumber,
      notes: data.notes || null,
      createdById: session.user.id,
    },
  });

  await prisma.monthlyCharge.update({
    where: { id: charge.id },
    data: {
      totalPaid: newTotalPaid.toNumber(),
      outstandingAmount: newOutstanding,
      status: newStatus,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "created",
    newValues: {
      amount: data.amount,
      method: data.paymentMethod,
      receipt: receiptNumber,
      chargeId: charge.id,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/charges");
  return { success: true, receiptNumber };
}

export async function cancelPayment(paymentId: string, reason: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

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

  await prisma.payment.update({
    where: { id: paymentId },
    data: { cancelled: true, cancelReason: reason },
  });

  await prisma.monthlyCharge.update({
    where: { id: charge.id },
    data: {
      totalPaid: newTotalPaid.toNumber(),
      outstandingAmount: newOutstanding,
      status: newStatus,
    },
  });

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
