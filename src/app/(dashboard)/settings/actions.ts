"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password mínimo 6 caracteres"),
  role: z.nativeEnum(UserRole),
});

const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, phone, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Já existe um utilizador com este email." };

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, password: hashedPassword, role },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "user",
    entityId: user.id,
    action: "created",
    newValues: { name, email, role },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { userId, name, phone, role } = parsed.data;

  if (userId === session.user.id && role !== "admin") {
    return { error: "Não pode remover o seu próprio acesso de administrador." };
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { error: "Utilizador não encontrado." };

  await prisma.user.update({
    where: { id: userId },
    data: { name, phone: phone || null, role },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "user",
    entityId: userId,
    action: "updated",
    oldValues: { name: existing.name, role: existing.role },
    newValues: { name, role },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function toggleUserStatus(userId: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  if (userId === session.user.id) {
    return { error: "Não pode desactivar a sua própria conta." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Utilizador não encontrado." };

  const newStatus = user.status === "active" ? "inactive" : "active";

  await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });

  await createAuditLog({
    userId: session.user.id,
    entityType: "user",
    entityId: userId,
    action: newStatus === "active" ? "activated" : "deactivated",
    oldValues: { status: user.status },
    newValues: { status: newStatus },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const userId = formData.get("userId") as string;
  const password = formData.get("password") as string;

  if (!userId || !password || password.length < 6) {
    return { error: "Password deve ter no mínimo 6 caracteres." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Utilizador não encontrado." };

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

  await createAuditLog({
    userId: session.user.id,
    entityType: "user",
    entityId: userId,
    action: "updated",
    newValues: { passwordReset: true },
  });

  revalidatePath("/settings");
  return { success: true };
}
