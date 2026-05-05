import { prisma } from "./prisma";
import { AuditAction, AuditEntity } from "@prisma/client";

export async function createAuditLog({
  userId,
  entityType,
  entityId,
  action,
  oldValues,
  newValues,
  reason,
}: {
  userId: string;
  entityType: AuditEntity;
  entityId: string;
  action: AuditAction;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        entityType,
        entityId,
        action,
        oldValues: oldValues ? (oldValues as import("@prisma/client").Prisma.InputJsonValue) : undefined,
        newValues: newValues ? (newValues as import("@prisma/client").Prisma.InputJsonValue) : undefined,
        reason,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}
