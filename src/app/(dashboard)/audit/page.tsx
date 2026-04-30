import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const actionLabel: Record<string, string> = {
  created: "Criado",
  updated: "Actualizado",
  deleted: "Eliminado",
  deactivated: "Desactivado",
  activated: "Activado",
  applied: "Aplicado",
  adjusted: "Ajustado",
  removed: "Removido",
  generated: "Gerado",
  published: "Publicado",
  cancelled: "Cancelado",
};

const entityLabel: Record<string, string> = {
  user: "Utilizador",
  apartment: "Apartamento",
  resident: "Morador",
  monthly_charge: "Mensalidade",
  payment: "Pagamento",
  expense: "Despesa",
  salary_payment: "Salário",
  report: "Relatório",
  late_fee: "Multa",
};

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  created: "success",
  updated: "default",
  deleted: "destructive",
  deactivated: "warning",
  cancelled: "destructive",
  applied: "warning",
  published: "success",
  generated: "default",
  activated: "success",
  adjusted: "warning",
  removed: "destructive",
};

export default async function AuditPage() {
  const session = await auth();
  if (!session) return null;

  if (session.user.role === "resident") {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-sm text-gray-500">Últimos {logs.length} registos de auditoria</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Utilizador</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Acção</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Nenhum registo de auditoria.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {new Intl.DateTimeFormat("pt-MZ", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(log.createdAt))}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{log.user.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entityLabel[log.entityType] ?? log.entityType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[log.action] ?? "secondary"}>
                      {actionLabel[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                    {log.reason ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
