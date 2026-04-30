import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument, ReportData } from "@/lib/pdf/report-pdf";
import { NextRequest, NextResponse } from "next/server";
import React from "react";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  // Residents can only access published reports
  if (session.user.role === "resident" && !report.published) {
    return NextResponse.json({ error: "Relatório não publicado" }, { status: 403 });
  }

  const refMonth = report.referenceMonth;
  const endOfMonth = new Date(
    refMonth.getFullYear(),
    refMonth.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const [expenses, charges] = await Promise.all([
    prisma.expense.findMany({
      where: {
        cancelled: false,
        expenseDate: { gte: refMonth, lte: endOfMonth },
      },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.monthlyCharge.findMany({
      where: { referenceMonth: refMonth },
      include: { apartment: true },
      orderBy: { apartment: { name: "asc" } },
    }),
  ]);

  const data: ReportData = {
    referenceMonth: report.referenceMonth,
    generatedAt: new Date(),
    openingBalance: parseFloat(report.openingBalance.toString()),
    totalIncome: parseFloat(report.totalIncome.toString()),
    totalLateFees: parseFloat(report.totalLateFees.toString()),
    totalExpenses: parseFloat(report.totalExpenses.toString()),
    closingBalance: parseFloat(report.closingBalance.toString()),
    notes: report.notes,
    createdByName: report.createdBy.name,
    expenses: expenses.map((e) => ({
      expenseDate: e.expenseDate,
      category: e.category,
      description: e.description,
      amount: parseFloat(e.amount.toString()),
    })),
    apartments: charges.map((c) => ({
      name: c.apartment.name,
      status: c.status,
      totalDue: parseFloat(c.totalDue.toString()),
      totalPaid: parseFloat(c.totalPaid.toString()),
    })),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(ReportDocument, { data }) as any);

  const monthStr = refMonth
    .toLocaleDateString("pt-MZ", { month: "long", year: "numeric" })
    .replace(" ", "-");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-${monthStr}.pdf"`,
    },
  });
}
