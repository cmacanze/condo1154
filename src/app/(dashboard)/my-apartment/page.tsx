import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMZN, formatDate, formatMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChargeStatusBadge } from "@/components/charges/charge-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Home } from "lucide-react";

export default async function MyApartmentPage() {
  const session = await auth();
  if (!session) return null;

  if (session.user.role !== "resident") {
    redirect("/dashboard");
  }

  const resident = await prisma.resident.findFirst({
    where: { userId: session.user.id, status: "active" },
    include: {
      apartment: true,
    },
  });

  if (!resident) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-orange-400" />
        <h2 className="text-lg font-semibold text-gray-900">Sem apartamento associado</h2>
        <p className="mt-1 text-sm text-gray-500">Contacte o administrador para associar o seu apartamento.</p>
      </div>
    );
  }

  const apt = resident.apartment;

  const charges = await prisma.monthlyCharge.findMany({
    where: { apartmentId: apt.id },
    orderBy: { referenceMonth: "desc" },
    take: 12,
  });

  const payments = await prisma.payment.findMany({
    where: { apartmentId: apt.id, cancelled: false },
    include: { monthlyCharge: true },
    orderBy: { paymentDate: "desc" },
    take: 20,
  });

  const totalOutstanding = charges.reduce(
    (sum, c) => sum + parseFloat(c.outstandingAmount.toString()),
    0
  );
  const overdueCount = charges.filter((c) => c.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">O Meu Apartamento</h1>
        <p className="text-sm text-gray-500">{apt.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contribuição Mensal</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatMZN(apt.monthlyContribution.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${totalOutstanding > 0 ? "bg-red-100" : "bg-green-100"}`}>
                {totalOutstanding > 0
                  ? <AlertCircle className="h-5 w-5 text-red-600" />
                  : <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
              <div>
                <p className="text-sm text-gray-500">Dívida Total</p>
                <p className={`text-xl font-bold ${totalOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
                  {formatMZN(totalOutstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mensalidades em Atraso</p>
                <p className="text-xl font-bold text-orange-700">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensalidades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Contribuição</TableHead>
                <TableHead>Multa</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Em Aberto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Limite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    Sem mensalidades.
                  </TableCell>
                </TableRow>
              ) : (
                charges.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatMonth(c.referenceMonth)}</TableCell>
                    <TableCell>{formatMZN(c.baseAmount.toString())}</TableCell>
                    <TableCell>{formatMZN(c.lateFeeAmount.toString())}</TableCell>
                    <TableCell className="font-medium">{formatMZN(c.totalDue.toString())}</TableCell>
                    <TableCell className="text-green-700">{formatMZN(c.totalPaid.toString())}</TableCell>
                    <TableCell className={parseFloat(c.outstandingAmount.toString()) > 0 ? "text-red-600 font-medium" : ""}>
                      {formatMZN(c.outstandingAmount.toString())}
                    </TableCell>
                    <TableCell><ChargeStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(c.dueDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recibo</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    Sem pagamentos registados.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                    <TableCell>{formatMonth(p.monthlyCharge.referenceMonth)}</TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="font-medium text-green-700">{formatMZN(p.amount.toString())}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {({ cash: "Numerário", transfer: "Transferência", mpesa: "M-Pesa", emola: "e-Mola", other: "Outro" })[p.paymentMethod]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
