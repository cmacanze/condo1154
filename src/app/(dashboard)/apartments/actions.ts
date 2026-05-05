"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ApartmentStatus,
  LateFeeType,
  UnitType,
} from "@prisma/client";

const apartmentSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  unitType: z.nativeEnum(UnitType),
  monthlyContribution: z.coerce.number().positive("Valor deve ser positivo"),
  paymentDueDay: z.coerce.number().min(1).max(31),
  lateFeeType: z.nativeEnum(LateFeeType),
  lateFeeValue: z.coerce.number().min(0),
  status: z.nativeEnum(ApartmentStatus),
  notes: z.string().optional(),
});

export async function createApartment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Acesso negado");
  }

  const parsed = apartmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const apartment = await prisma.apartment.create({
    data: {
      name: data.name,
      unitType: data.unitType,
      monthlyContribution: data.monthlyContribution,
      paymentDueDay: data.paymentDueDay,
      lateFeeType: data.lateFeeType,
      lateFeeValue: data.lateFeeValue,
      status: data.status,
      notes: data.notes,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entityType: "apartment",
    entityId: apartment.id,
    action: "created",
    newValues: { ...data },
  });

  revalidatePath("/apartments");
  return { success: true };
}

export async function updateApartment(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Acesso negado");
  }

  const parsed = apartmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const old = await prisma.apartment.findUnique({ where: { id } });
  if (!old) return { error: "Apartamento não encontrado." };

  await prisma.apartment.update({
    where: { id },
    data: {
      name: data.name,
      unitType: data.unitType,
      monthlyContribution: data.monthlyContribution,
      paymentDueDay: data.paymentDueDay,
      lateFeeType: data.lateFeeType,
      lateFeeValue: data.lateFeeValue,
      status: data.status,
      notes: data.notes,
    },
  });

  const action =
    data.status === "inactive" && old?.status === "active"
      ? "deactivated"
      : "updated";

  await createAuditLog({
    userId: session.user.id,
    entityType: "apartment",
    entityId: id,
    action,
    oldValues: old ? { ...old } : undefined,
    newValues: { ...data },
  });

  revalidatePath("/apartments");
  return { success: true };
}

export async function deleteApartment(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Acesso negado");
  }

  const hasCharges = await prisma.monthlyCharge.count({ where: { apartmentId: id } });
  if (hasCharges > 0) {
    return { error: "Não é possível apagar um apartamento com mensalidades registadas. Desactive-o em vez disso." };
  }

  await prisma.apartment.delete({ where: { id } });

  await createAuditLog({
    userId: session.user.id,
    entityType: "apartment",
    entityId: id,
    action: "deleted",
  });

  revalidatePath("/apartments");
  return { success: true };
}
