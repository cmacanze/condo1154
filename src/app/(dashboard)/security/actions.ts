"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const staffSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().optional(),
});

const salarySchema = z.object({
  securityStaffId: z.string().min(1, "Segurança obrigatório"),
  referenceMonth: z.string().min(1, "Mês obrigatório"),
  paymentDate: z.string().min(1, "Data obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  notes: z.string().optional(),
});

export async function createSecurityStaff(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const staff = await prisma.securityStaff.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "user",
    entityId: staff.id,
    action: "created",
    newValues: { name: parsed.data.name },
  });

  revalidatePath("/security");
  return { success: true };
}

export async function createSalaryPayment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = salarySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;
  const staff = await prisma.securityStaff.findUnique({ where: { id: data.securityStaffId } });
  if (!staff) return { error: "Segurança não encontrado." };

  const referenceMonth = new Date(data.referenceMonth + "-01");

  const expense = await prisma.expense.create({
    data: {
      expenseDate: new Date(data.paymentDate),
      category: "security",
      description: `Salário — ${staff.name} — ${referenceMonth.toLocaleDateString("pt-MZ", { month: "long", year: "numeric" })}`,
      beneficiary: staff.name,
      amount: data.amount,
      paymentMethod: "cash",
      isPublic: false,
      createdById: session.user.id,
    },
  });

  const salary = await prisma.salaryPayment.create({
    data: {
      securityStaffId: data.securityStaffId,
      referenceMonth,
      paymentDate: new Date(data.paymentDate),
      amount: data.amount,
      notes: data.notes || null,
      expenseId: expense.id,
      createdById: session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "salary_payment",
    entityId: salary.id,
    action: "created",
    newValues: { staff: staff.name, amount: data.amount },
  });

  revalidatePath("/security");
  revalidatePath("/expenses");
  return { success: true };
}
