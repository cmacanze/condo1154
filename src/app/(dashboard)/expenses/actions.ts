"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";

const expenseSchema = z.object({
  expenseDate: z.string().min(1, "Data obrigatória").refine((d) => !isNaN(new Date(d).getTime()), "Data inválida"),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1, "Descrição obrigatória"),
  beneficiary: z.string().optional(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  isPublic: z.string().optional(),
});

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  let attachmentUrl: string | null = null;
  const attachmentFile = formData.get("attachment") as File | null;
  if (attachmentFile && attachmentFile.size > 0) {
    const uploadResult = await uploadFile(attachmentFile, "expenses");
    if ("error" in uploadResult) return { error: uploadResult.error };
    attachmentUrl = uploadResult.url;
  }

  const expense = await prisma.expense.create({
    data: {
      expenseDate: new Date(data.expenseDate),
      category: data.category,
      description: data.description,
      beneficiary: data.beneficiary || null,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      attachmentUrl,
      isPublic: data.isPublic === "on" || data.isPublic === "true",
      createdById: session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "expense",
    entityId: expense.id,
    action: "created",
    newValues: { amount: data.amount, category: data.category },
  });

  revalidatePath("/expenses");
  return { success: true };
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;
  const old = await prisma.expense.findUnique({ where: { id } });
  if (!old) return { error: "Despesa não encontrada." };

  await prisma.expense.update({
    where: { id },
    data: {
      expenseDate: new Date(data.expenseDate),
      category: data.category,
      description: data.description,
      beneficiary: data.beneficiary || null,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      isPublic: data.isPublic === "on" || data.isPublic === "true",
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "expense",
    entityId: id,
    action: "updated",
    oldValues: old ? { amount: old.amount.toString(), category: old.category } : undefined,
    newValues: { amount: data.amount, category: data.category },
  });

  revalidatePath("/expenses");
  return { success: true };
}

export async function cancelExpense(id: string, reason: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  if (!reason.trim()) return { error: "Motivo obrigatório." };

  const old = await prisma.expense.findUnique({ where: { id } });
  if (!old) return { error: "Despesa não encontrada." };

  await prisma.expense.update({
    where: { id },
    data: { cancelled: true, cancelReason: reason },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "expense",
    entityId: id,
    action: "cancelled",
    reason,
    oldValues: { amount: old.amount.toString() },
  });

  revalidatePath("/expenses");
  return { success: true };
}
