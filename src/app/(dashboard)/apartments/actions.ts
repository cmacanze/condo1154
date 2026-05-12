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
}).refine(
  (d) => {
    if (d.lateFeeType === "percentage") return d.lateFeeValue <= 100;
    if (d.lateFeeType === "fixed") return d.lateFeeValue <= 9_999_999;
    return true;
  },
  { message: "Valor de multa inválido (máx. 100% ou 9 999 999 MZN fixo)", path: ["lateFeeValue"] }
);

export async function createApartment(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = apartmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const existing = await prisma.apartment.findFirst({ where: { name: data.name } });
  if (existing) return { error: "Já existe um apartamento com este nome." };

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
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const parsed = apartmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const old = await prisma.apartment.findUnique({ where: { id } });
  if (!old) return { error: "Apartamento não encontrado." };

  if (data.name !== old.name) {
    const nameTaken = await prisma.apartment.findFirst({ where: { name: data.name } });
    if (nameTaken) return { error: "Já existe um apartamento com este nome." };
  }

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
  if (!session || session.user.role !== "admin") return { error: "Acesso negado." };

  const [hasCharges, hasResidents] = await Promise.all([
    prisma.monthlyCharge.count({ where: { apartmentId: id } }),
    prisma.resident.count({ where: { apartmentId: id } }),
  ]);
  if (hasCharges > 0) {
    return { error: "Não é possível apagar um apartamento com mensalidades registadas. Desactive-o em vez disso." };
  }
  if (hasResidents > 0) {
    return { error: "Não é possível apagar um apartamento com moradores associados. Remova os moradores primeiro." };
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
