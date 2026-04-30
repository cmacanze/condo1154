"use client";

import { useState } from "react";
import { Apartment, MonthlyCharge, Payment, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { ChargeStatusBadge } from "@/components/charges/charge-status-badge";
import { createPayment, cancelPayment } from "@/app/(dashboard)/payments/actions";
import { formatMZN, formatDate, formatMonth } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, XCircle, Receipt } from "lucide-react";

type PaymentWithRelations = Payment & {
  apartment: Apartment;
  monthlyCharge: MonthlyCharge;
  createdBy: User;
};

type ChargeOption = MonthlyCharge & { apartment: Apartment };

const methodLabel: Record<string, string> = {
  cash: "Numerário",
  transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  other: "Outro",
};

function PaymentForm({
  charges,
  onSubmit,
  onCancel,
}: {
  charges: ChargeOption[];
  onSubmit: (fd: FormData) => Promise<{ error?: string; success?: boolean; receiptNumber?: string }>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<ChargeOption | null>(null);

  const openCharges = charges.filter((c) =>
    ["pending", "partial", "overdue"].includes(c.status)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await onSubmit(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) setError(result.error);
    if (result.receiptNumber) setReceipt(result.receiptNumber);
  }

  if (receipt) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg bg-green-50 p-6">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-green-600" />
          <p className="font-semibold text-green-800">Pagamento registado!</p>
          <p className="mt-1 text-sm text-green-700">Recibo: <strong>{receipt}</strong></p>
        </div>
        <Button onClick={onCancel} className="w-full">Fechar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Mensalidade *</Label>
        <Select
          name="monthlyChargeId"
          onValueChange={(v) => setSelectedCharge(openCharges.find((c) => c.id === v) ?? null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar mensalidade..." />
          </SelectTrigger>
          <SelectContent>
            {openCharges.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.apartment.name} — {formatMonth(c.referenceMonth)} — Em aberto: {formatMZN(c.outstandingAmount.toString())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCharge && (
          <p className="text-xs text-gray-500">
            Total em dívida: <strong>{formatMZN(selectedCharge.outstandingAmount.toString())}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Data do Pagamento *</Label>
          <Input
            name="paymentDate"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Valor Pago (MZN) *</Label>
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Método de Pagamento *</Label>
        <Select name="paymentMethod" defaultValue="cash">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Numerário</SelectItem>
            <SelectItem value="transfer">Transferência</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="emola">e-Mola</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Referência da Transacção</Label>
        <Input name="transactionReference" placeholder="Opcional" />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea name="notes" rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Comprovativo</Label>
        <FileUpload name="attachment" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "A registar..." : "Registar Pagamento"}
        </Button>
      </div>
    </form>
  );
}

export function PaymentsClient({
  payments,
  charges,
  isAdmin,
}: {
  payments: PaymentWithRelations[];
  charges: ChargeOption[];
  isAdmin: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [search, setSearch] = useState("");

  const filtered = payments.filter(
    (p) =>
      !p.cancelled &&
      (p.apartment.name.toLowerCase().includes(search.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Pesquisar por apartamento ou recibo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registar Pagamento</DialogTitle>
              </DialogHeader>
              <PaymentForm
                charges={charges}
                onSubmit={async (fd) => {
                  const r = await createPayment(fd);
                  if (r.success) setCreateOpen(false);
                  return r;
                }}
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recibo</TableHead>
              <TableHead>Apartamento</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead className="w-16">Acções</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-gray-400 py-8">
                  Nenhum pagamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                  <TableCell className="font-medium">{p.apartment.name}</TableCell>
                  <TableCell>{formatMonth(p.monthlyCharge.referenceMonth)}</TableCell>
                  <TableCell>{formatDate(p.paymentDate)}</TableCell>
                  <TableCell className="font-medium text-green-700">{formatMZN(p.amount.toString())}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{methodLabel[p.paymentMethod]}</Badge>
                  </TableCell>
                  <TableCell>
                    <ChargeStatusBadge status={p.monthlyCharge.status} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => setCancelId(p.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="warning">
              <AlertDescription>
                O valor pago será removido da mensalidade. Esta acção fica registada em auditoria.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelId(null)}>Voltar</Button>
              <Button
                variant="destructive"
                disabled={!cancelReason.trim()}
                onClick={async () => {
                  if (!cancelId) return;
                  const r = await cancelPayment(cancelId, cancelReason);
                  if (r.success) {
                    setCancelId(null);
                    setCancelReason("");
                  } else {
                    alert(r.error);
                  }
                }}
              >
                Cancelar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
