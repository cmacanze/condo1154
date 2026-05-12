import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLateFee, calculateOutstanding } from "@/lib/finance";
import { createAuditLog } from "@/lib/audit";
import { sendOverdueNotification } from "@/lib/email";
import Decimal from "decimal.js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  const incoming = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (
    !cronSecret ||
    !incoming ||
    incoming.length !== cronSecret.length ||
    !timingSafeEqual(Buffer.from(incoming), Buffer.from(cronSecret))
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [adminUser, overdueCharges] = await Promise.all([
    prisma.user.findFirst({ where: { role: "admin" } }),
    prisma.monthlyCharge.findMany({
      where: {
        status: { in: ["pending", "partial", "overdue"] },
        dueDate: { lt: today },
      },
      include: {
        apartment: {
          include: {
            residents: { where: { status: "active" }, include: { user: true } },
          },
        },
      },
    }),
  ]);

  const actorId = adminUser?.id;
  let updatedCount = 0;
  let notifiedCount = 0;
  const errors: string[] = [];

  for (const charge of overdueCharges) {
    try {
      const apt = charge.apartment;
      const baseAmount = parseFloat(charge.baseAmount.toString());
      const newLateFee = calculateLateFee(baseAmount, apt.lateFeeType, parseFloat(apt.lateFeeValue.toString()));
      const newLateFeeDecimal = new Decimal(newLateFee);
      const existingLateFee = new Decimal(charge.lateFeeAmount.toString());
      let didUpdate = false;

      if (newLateFeeDecimal.greaterThan(existingLateFee)) {
        const totalDue = new Decimal(charge.baseAmount.toString()).plus(newLateFeeDecimal);
        const outstanding = new Decimal(
          calculateOutstanding(totalDue.toNumber(), parseFloat(charge.totalPaid.toString()))
        );

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
          await createAuditLog({
            userId: actorId,
            action: "applied",
            entityType: "late_fee",
            entityId: charge.id,
            newValues: {
              lateFeeAmount: newLateFeeDecimal.toFixed(2),
              totalDue: totalDue.toFixed(2),
              status: "overdue",
            },
          });
        }

        updatedCount++;
        didUpdate = true;
      } else if (charge.status !== "overdue") {
        await prisma.monthlyCharge.update({
          where: { id: charge.id },
          data: { status: "overdue" },
        });
        updatedCount++;
        didUpdate = true;
      }

      if (didUpdate) {
        const emailResults = await Promise.allSettled(
          apt.residents
            .filter((r) => r.user.email)
            .map((r) =>
              sendOverdueNotification({
                residentName: r.user.name,
                residentEmail: r.user.email!,
                apartmentName: apt.name,
                referenceMonth: charge.referenceMonth,
                totalDue: parseFloat(charge.totalDue.toString()),
                totalPaid: parseFloat(charge.totalPaid.toString()),
                outstandingAmount: parseFloat(charge.outstandingAmount.toString()),
                lateFeeAmount: parseFloat(charge.lateFeeAmount.toString()),
              })
            )
        );
        notifiedCount += emailResults.filter((r) => r.status === "fulfilled").length;
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
