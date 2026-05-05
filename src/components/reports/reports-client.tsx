"use client";

import { useState } from "react";
import { Report, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { generateReport, publishReport, unpublishReport } from "@/app/(dashboard)/reports/actions";
import { formatMZN, formatMonth } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Eye, EyeOff, TrendingUp, TrendingDown, Wallet, Download } from "lucide-react";

type ReportWithUser = Report & { createdBy: User };

const months = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export function ReportsClient({
  reports,
  isAdmin,
}: {
  reports: ReportWithUser[];
  isAdmin: boolean;
}) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportWithUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<"publish" | "unpublish" | null>(null);
  const now = new Date();
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await generateReport(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setGenerateOpen(false);
      toast.success("Relatório gerado.");
    }
  }

  async function handlePublish() {
    if (!selectedReport) return;
    const result = await publishReport(selectedReport.id);
    if ("error" in result) toast.error(result.error);
    else { setSelectedReport(null); toast.success("Relatório publicado para moradores."); }
  }

  async function handleUnpublish() {
    if (!selectedReport) return;
    const result = await unpublishReport(selectedReport.id);
    if ("error" in result) toast.error(result.error);
    else { setSelectedReport(null); toast.success("Relatório despublicado."); }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerar Relatório Mensal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input
                      name="year"
                      type="number"
                      value={genYear}
                      onChange={(e) => setGenYear(+e.target.value)}
                      min={2020}
                      max={2100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select name="month" value={String(genMonth)} onValueChange={(v) => setGenMonth(+v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Saldo Inicial (MZN) *</Label>
                  <Input name="openingBalance" type="number" step="0.01" min="0" defaultValue="0" required />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea name="notes" rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "A gerar..." : "Gerar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400 shadow-sm">
            Nenhum relatório disponível.
          </div>
        ) : (
          reports.map((r) => (
            <Card key={r.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setSelectedReport(r)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{formatMonth(r.referenceMonth)}</CardTitle>
                  <Badge variant={r.published ? "success" : "secondary"}>
                    {r.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-gray-500">Receitas:</span>
                  <span className="font-medium text-green-700">{formatMZN(r.totalIncome.toString())}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-gray-500">Despesas:</span>
                  <span className="font-medium text-red-700">{formatMZN(r.totalExpenses.toString())}</span>
                </div>
                <div className="flex items-center gap-2 text-sm border-t border-gray-100 pt-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-500">Saldo final:</span>
                  <span className={`font-bold ${parseFloat(r.closingBalance.toString()) >= 0 ? "text-blue-700" : "text-red-700"}`}>
                    {formatMZN(r.closingBalance.toString())}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedReport} onOpenChange={(o) => !o && setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Relatório — {selectedReport && formatMonth(selectedReport.referenceMonth)}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Saldo Inicial</p>
                  <p className="font-bold">{formatMZN(selectedReport.openingBalance.toString())}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-gray-500">Total Receitas</p>
                  <p className="font-bold text-green-700">{formatMZN(selectedReport.totalIncome.toString())}</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-gray-500">Total Multas</p>
                  <p className="font-bold text-orange-700">{formatMZN(selectedReport.totalLateFees.toString())}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-gray-500">Total Despesas</p>
                  <p className="font-bold text-red-700">{formatMZN(selectedReport.totalExpenses.toString())}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-blue-50 p-3">
                  <p className="text-gray-500">Saldo Final</p>
                  <p className={`text-xl font-bold ${parseFloat(selectedReport.closingBalance.toString()) >= 0 ? "text-blue-700" : "text-red-700"}`}>
                    {formatMZN(selectedReport.closingBalance.toString())}
                  </p>
                </div>
              </div>
              {selectedReport.notes && (
                <div>
                  <p className="text-sm text-gray-500">Observações:</p>
                  <p className="text-sm">{selectedReport.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/api/pdf/report/${selectedReport.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Exportar PDF
                  </a>
                </Button>
                {isAdmin && (
                  selectedReport.published ? (
                    <Button variant="outline" size="sm" onClick={() => setConfirmAction("unpublish")}>
                      <EyeOff className="mr-1 h-4 w-4" />
                      Despublicar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setConfirmAction("publish")}>
                      <Eye className="mr-1 h-4 w-4" />
                      Publicar para Moradores
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction === "publish"}
        title="Publicar relatório"
        description="Este relatório ficará visível para todos os moradores. Confirma?"
        confirmLabel="Publicar"
        onConfirm={() => { setConfirmAction(null); handlePublish(); }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "unpublish"}
        title="Despublicar relatório"
        description="Os moradores deixarão de ver este relatório. Confirma?"
        confirmLabel="Despublicar"
        destructive
        onConfirm={() => { setConfirmAction(null); handleUnpublish(); }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
