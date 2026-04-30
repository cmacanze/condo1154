import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLateFee } from "@/lib/finance";
import { sendOverdueNotification } from "@/lib/email";
import Decimal from "decimal.js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use first admin user as the audit actor
  const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
  const actorId = adminUser?.id;

  // Find all overdue or pending charges whose due date has passed
  const overdueCharges = await prisma.monthlyCharge.findMany({
    where: {
      status: { in: ["pending", "partial", "overdue"] },
      dueDate: { lt: today },
    },
    include: {
      apartment: true,
    },
  });

  let updatedCount = 0;
  let notifiedCount = 0;
  const errors: string[] = [];

  for (const charge of overdueCharges) {
    try {
      const apt = charge.apartment;
      const baseAmount = parseFloat(charge.baseAmount.toString());
      const newLateFee = calculateLateFee(baseAmount, apt.lateFeeType, parseFloat(apt.lateFeeValue.toString()));
      const newLateFeeDecimal = new Decimal(newLateFee);

      // Only update if the late fee increased (e.g. on first application)
      const existingLateFee = new Decimal(charge.lateFeeAmount.toString());
      if (newLateFeeDecimal.greaterThan(existingLateFee)) {
        const totalDue = new Decimal(charge.baseAmount.toString()).plus(newLateFeeDecimal);
        const totalPaid = new Decimal(charge.totalPaid.toString());
        const outstanding = totalDue.minus(totalPaid).lessThan(0)
          ? new Decimal(0)
          : totalDue.minus(totalPaid);

        await prisma.monthlyCharge.update({
          where: { id: charge.id },
          data: {
            lateFeeAmount: newLateFeeDecimal.toFixed(2),
            totalDue: totalDue.toFixed(2),
            outstandingAmount: outstanding.toFixed(2),
            status: "overdue",
          },
        });

        if (actorId) {
          await prisma.auditLog.create({
            data: {
              userId: actorId,
              action: "applied",
              entityType: "late_fee",
              entityId: charge.id,
              newValues: {
                lateFeeAmount: newLateFeeDecimal.toFixed(2),
                totalDue: totalDue.toFixed(2),
                status: "overdue",
              } as import("@prisma/client").Prisma.InputJsonValue,
            },
          });
        }

        updatedCount++;
      } else if (charge.status !== "overdue") {
        // Mark as overdue even if no late fee applies
        await prisma.monthlyCharge.update({
          where: { id: charge.id },
          data: { status: "overdue" },
        });
        updatedCount++;
      }

      // Send email notification to active residents
      const residents = await prisma.resident.findMany({
        where: { apartmentId: apt.id, status: "active" },
        include: { user: true },
      });

      for (const resident of residents) {
        if (resident.user.email) {
          try {
            await sendOverdueNotification({
              residentName: resident.user.name,
              residentEmail: resident.user.email,
              apartmentName: apt.name,
              referenceMonth: charge.referenceMonth,
              totalDue: parseFloat(charge.totalDue.toString()),
              totalPaid: parseFloat(charge.totalPaid.toString()),
              outstandingAmount: parseFloat(charge.outstandingAmount.toString()),
              lateFeeAmount: parseFloat(charge.lateFeeAmount.toString()),
            });
            notifiedCount++;
          } catch {
            // Email failures shouldn't abort the cron
          }
        }
      }
    } catch (err) {
      errors.push(`charge ${charge.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    success: true,
    processed: overdueCharges.length,
    updated: updatedCount,
    notified: notifiedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
}
