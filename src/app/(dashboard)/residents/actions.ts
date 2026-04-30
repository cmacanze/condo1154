"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { ResidentRelationship, ResidentStatus, UserRole } from "@prisma/client";

const residentSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password mínimo 6 caracteres").optional().or(z.literal("")),
  apartmentId: z.string().min(1, "Apartamento obrigatório"),
  relationshipType: z.nativeEnum(ResidentRelationship),
  status: z.nativeEnum(ResidentStatus),
  role: z.nativeEnum(UserRole),
});

export async function createResident(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = residentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) return { error: "Já existe um utilizador com este email." };

  if (!data.password) return { error: "Password obrigatória para novo utilizador." };

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role,
      status: data.status === "active" ? "active" : "inactive",
    },
  });

  const resident = await prisma.resident.create({
    data: {
      userId: user.id,
      apartmentId: data.apartmentId,
      relationshipType: data.relationshipType,
      status: data.status,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "resident",
    entityId: resident.id,
    action: "created",
    newValues: { name: data.name, email: data.email, role: data.role },
  });

  revalidatePath("/residents");
  return { success: true };
}

export async function updateResident(residentId: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const parsed = residentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: { user: true },
  });
  if (!resident) return { error: "Morador não encontrado." };

  const emailExists = await prisma.user.findFirst({
    where: { email: data.email, id: { not: resident.userId } },
  });
  if (emailExists) return { error: "Já existe um utilizador com este email." };

  const updateData: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    status: data.status === "active" ? "active" : "inactive",
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id: resident.userId },
    data: updateData,
  });

  await prisma.resident.update({
    where: { id: residentId },
    data: {
      apartmentId: data.apartmentId,
      relationshipType: data.relationshipType,
      status: data.status,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "resident",
    entityId: residentId,
    action: "updated",
    oldValues: { name: resident.user.name, email: resident.user.email },
    newValues: { name: data.name, email: data.email },
  });

  revalidatePath("/residents");
  return { success: true };
}

export async function deactivateResident(residentId: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Acesso negado");

  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
  });
  if (!resident) return { error: "Morador não encontrado." };

  await prisma.resident.update({
    where: { id: residentId },
    data: { status: "inactive" },
  });

  await prisma.user.update({
    where: { id: resident.userId },
    data: { status: "inactive" },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "resident",
    entityId: residentId,
    action: "deactivated",
  });

  revalidatePath("/residents");
  return { success: true };
}
