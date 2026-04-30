import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptDocument, ReceiptData } from "@/lib/pdf/receipt-pdf";
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

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      apartment: {
        include: {
          residents: { include: { user: true }, where: { status: "active" } },
        },
      },
      monthlyCharge: true,
      createdBy: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  // Residents can only access their own receipts
  if (session.user.role === "resident") {
    const isOwn = payment.apartment.residents.some(
      (r) => r.userId === session.user.id
    );
    if (!isOwn) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }

  const primaryResident = payment.apartment.residents[0]?.user;

  const data: ReceiptData = {
    receiptNumber: payment.receiptNumber,
    emittedAt: payment.createdAt,
    apartmentName: payment.apartment.name,
    residentName: primaryResident?.name,
    referenceMonth: payment.monthlyCharge.referenceMonth,
    paymentDate: payment.paymentDate,
    amount: parseFloat(payment.amount.toString()),
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionReference,
    notes: payment.notes,
    createdByName: payment.createdBy.name,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(ReceiptDocument, { data }) as any);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${payment.receiptNumber}.pdf"`,
    },
  });
}
