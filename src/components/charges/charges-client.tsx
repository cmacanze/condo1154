"use client";

import { useState } from "react";
import { Apartment, MonthlyCharge } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChargeStatusBadge } from "./charge-status-badge";
import {
  generateMonthlyCharges,
  applyLateFees,
  exemptCharge,
  notifyOverdueResidents,
} from "@/app/(dashboard)/charges/actions";
import { formatMZN, formatDate, formatMonth } from "@/lib/utils";
import { toast } from "sonner";
import { Zap, Calendar, ShieldOff, Bell } from "lucide-react";

type ChargeWithApartment = MonthlyCharge & { apartment: Apartment };

const months = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export function ChargesClient({
  charges,
  isAdmin,
}: {
  charges: ChargeWithApartment[];
  isAdmin: boolean;
}) {
  const now = new Date();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [exemptId, setExemptId] = useState<string | null>(null);
  const [exemptReason, setExemptReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<"fees" | "notify" | null>(null);

  const filtered = charges.filter((c) => {
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const refMonth = new Date(c.referenceMonth).getMonth() + 1;
    const matchMonth = filterMonth === "all" || String(refMonth) === filterMonth;
    return matchStatus && matchMonth;
  });

  async function handleGenerate() {
    setLoading(true);
    setGenResult(null);
    const fd = new FormData();
    fd.append("year", String(genYear));
    fd.append("month", String(genMonth));
    const result = await generateMonthlyCharges(fd);
    setLoading(false);
    if (result.success) {
      setGenResult(`Criadas: ${result.created}, Já existiam: ${result.skipped}`);
    }
  }

  async function handleApplyFees() {
    const result = await applyLateFees(new FormData());
    if (result.success) toast.success(`Multas aplicadas: ${result.applied}`);
  }

  async function handleNotify() {
    setLoading(true);
    const result = await notifyOverdueResidents();
    setLoading(false);
    if (result.success) toast.success(`Notificações enviadas: ${result.notified}`);
  }

  async function handleExempt() {
    if (!exemptId || !exemptReason.trim()) return;
    const result = await exemptCharge(exemptId, exemptReason);
    if (result.success) {
      setExemptId(null);
      setExemptReason("");
      toast.success("Mensalidade isenta.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="overdue">Em atraso</SelectItem>
              <SelectItem value="exempt">Isento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirm("notify")} size="sm" disabled={loading}>
              <Bell className="mr-1 h-4 w-4" />
              Notificar em Atraso
            </Button>
            <Button variant="outline" onClick={() => setConfirm("fees")} size="sm">
              <Zap className="mr-1 h-4 w-4" />
              Aplicar Multas
            </Button>
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  Gerar Mensalidades
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Gerar Mensalidades</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Input
                        type="number"
                        value={genYear}
                        onChange={(e) => setGenYear(+e.target.value)}
                        min={2020}
                        max={2100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mês</Label>
                      <Select value={String(genMonth)} onValueChange={(v) => setGenMonth(+v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m, i) => (
                            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {genResult && (
                    <Alert variant="success">
                      <AlertDescription>{genResult}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGenerateOpen(false)}>Fechar</Button>
                    <Button onClick={handleGenerate} disabled={loading}>
                      {loading ? "A gerar..." : "Gerar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apartamento</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Multa</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Em aberto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Limite</TableHead>
              {isAdmin && <TableHead className="w-16">Acções</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="text-center text-gray-400 py-8">
                  Nenhuma mensalidade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.apartment.name}</TableCell>
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
                  {isAdmin && (
                    <TableCell>
                      {["pending", "partial", "overdue"].includes(c.status) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Isentar"
                          onClick={() => setExemptId(c.id)}
                        >
                          <ShieldOff className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirm === "fees"}
        title="Aplicar multas"
        description="Serão aplicadas multas a todas as mensalidades em atraso que ainda não têm multa. Esta acção não pode ser revertida automaticamente."
        confirmLabel="Aplicar"
        onConfirm={() => { setConfirm(null); handleApplyFees(); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "notify"}
        title="Notificar moradores em atraso"
        description="Será enviado um email a todos os moradores com mensalidades em estado de atraso ou parcial."
        confirmLabel="Enviar notificações"
        onConfirm={() => { setConfirm(null); handleNotify(); }}
        onCancel={() => setConfirm(null)}
      />

      <Dialog open={!!exemptId} onOpenChange={(o) => !o && setExemptId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Isentar Mensalidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo (obrigatório)</Label>
              <Input
                value={exemptReason}
                onChange={(e) => setExemptReason(e.target.value)}
                placeholder="Descreva o motivo da isenção..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExemptId(null)}>Cancelar</Button>
              <Button onClick={handleExempt} disabled={!exemptReason.trim()}>
                Confirmar Isenção
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
