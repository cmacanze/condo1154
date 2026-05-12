import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMZN, formatDate, formatMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChargeStatusBadge } from "@/components/charges/charge-status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Users, TrendingUp, AlertCircle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const apt = await prisma.apartment.findUnique({ where: { id }, select: { name: true } });
  return { title: apt?.name ?? "Apartamento" };
}

const unitTypeLabel: Record<string, string> = {
  apartment: "Apartamento", flat: "Flat", shop: "Loja",
  dependency: "Dependência", other: "Outro",
};

const methodLabel: Record<string, string> = {
  cash: "Numerário", transfer: "Transferência", mpesa: "M-Pesa",
  emola: "e-Mola", other: "Outro",
};

const relationshipLabel: Record<string, string> = {
  owner: "Proprietário", tenant: "Inquilino", representative: "Representante",
};

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  const apt = await prisma.apartment.findUnique({
    where: { id },
    include: {
      residents: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!apt) notFound();

  const [charges, payments] = await Promise.all([
    prisma.monthlyCharge.findMany({
      where: { apartmentId: id },
      orderBy: { referenceMonth: "desc" },
      take: 24,
    }),
    prisma.payment.findMany({
      where: { apartmentId: id, cancelled: false },
      orderBy: { paymentDate: "desc" },
      take: 30,
      include: { monthlyCharge: { select: { referenceMonth: true } } },
    }),
  ]);

  const totalOutstanding = charges.reduce(
    (sum, c) => sum + parseFloat(c.outstandingAmount.toString()), 0
  );
  const totalPaid = charges.reduce(
    (sum, c) => sum + parseFloat(c.totalPaid.toString()), 0
  );
  const overdueCount = charges.filter((c) => c.status === "overdue").length;
  const activeResidents = apt.residents.filter((r) => r.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/apartments"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Apartamentos
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{apt.name}</h1>
          <p className="text-sm text-gray-500">
            {unitTypeLabel[apt.unitType]} · Dia limite: {apt.paymentDueDay}
          </p>
        </div>
        <Badge variant={apt.status === "active" ? "success" : "secondary"} className="text-sm">
          {apt.status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contribuição mensal</p>
              <p className="text-xl font-bold text-gray-900">{formatMZN(apt.monthlyContribution.toString())}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total recebido</p>
              <p className="text-xl font-bold text-green-700">{formatMZN(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className={`rounded-full p-3 ${totalOutstanding > 0 ? "bg-red-100" : "bg-green-100"}`}>
              {totalOutstanding > 0
                ? <AlertCircle className="h-5 w-5 text-red-600" />
                : <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <div>
              <p className="text-sm text-gray-500">Em dívida</p>
              <p className={`text-xl font-bold ${totalOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
                {formatMZN(totalOutstanding)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="rounded-full bg-gray-100 p-3">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Moradores activos</p>
              <p className="text-xl font-bold text-gray-900">{activeResidents.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Residents */}
      {apt.residents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moradores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Relação</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apt.residents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.user.name}</TableCell>
                    <TableCell className="text-gray-500">{r.user.email}</TableCell>
                    <TableCell>{relationshipLabel[r.relationshipType]}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "active" ? "success" : "secondary"}>
                        {r.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Mensalidades
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-2">{overdueCount} em atraso</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Em aberto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Limite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Sem mensalidades registadas.
                  </TableCell>
                </TableRow>
              ) : (
                charges.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatMonth(c.referenceMonth)}</TableCell>
                    <TableCell>{formatMZN(c.totalDue.toString())}</TableCell>
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

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamentos recentes</CardTitle>
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
                      <Badge variant="secondary">{methodLabel[p.paymentMethod]}</Badge>
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
