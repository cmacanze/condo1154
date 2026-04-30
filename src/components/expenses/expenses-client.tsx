"use client";

import { useState } from "react";
import { Expense, User } from "@prisma/client";
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
import { createExpense, updateExpense, cancelExpense } from "@/app/(dashboard)/expenses/actions";
import { formatMZN, formatDate } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, Pencil, XCircle, Eye, EyeOff, Paperclip } from "lucide-react";

type ExpenseWithUser = Expense & { createdBy: User };

const categoryLabel: Record<string, string> = {
  security: "Segurança",
  cleaning: "Limpeza",
  energy: "Energia",
  water: "Água",
  maintenance: "Manutenção",
  repairs: "Reparações",
  materials: "Material",
  administration: "Administração",
  other: "Outros",
};

const methodLabel: Record<string, string> = {
  cash: "Numerário",
  transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  other: "Outro",
};

function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
}: {
  expense?: ExpenseWithUser;
  onSubmit: (fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await onSubmit(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data *</Label>
          <Input
            name="expenseDate"
            type="date"
            defaultValue={expense?.expenseDate
              ? new Date(expense.expenseDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select name="category" defaultValue={expense?.category ?? "other"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabel).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Descrição *</Label>
          <Input name="description" defaultValue={expense?.description} required />
        </div>
        <div className="space-y-2">
          <Label>Beneficiário / Fornecedor</Label>
          <Input name="beneficiary" defaultValue={expense?.beneficiary ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Valor (MZN) *</Label>
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={expense?.amount?.toString()}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <Select name="paymentMethod" defaultValue={expense?.paymentMethod ?? "cash"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(methodLabel).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            defaultChecked={expense?.isPublic ?? false}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPublic">Visível para moradores</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Comprovativo</Label>
        <FileUpload
          name="attachment"
          currentUrl={expense?.attachmentUrl}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "A guardar..." : expense ? "Actualizar" : "Registar Despesa"}
        </Button>
      </div>
    </form>
  );
}

export function ExpensesClient({
  expenses,
  isAdmin,
}: {
  expenses: ExpenseWithUser[];
  isAdmin: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseWithUser | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [search, setSearch] = useState("");

  const active = expenses.filter((e) => !e.cancelled);

  const filtered = active.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.beneficiary ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Pesquisar despesa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Nova Despesa</DialogTitle>
              </DialogHeader>
              <ExpenseForm
                onSubmit={async (fd) => {
                  const r = await createExpense(fd);
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
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Beneficiário</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Visível</TableHead>
              <TableHead className="w-12">Doc.</TableHead>
              {isAdmin && <TableHead className="w-24">Acções</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-gray-400 py-8">
                  Nenhuma despesa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{formatDate(e.expenseDate)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryLabel[e.category]}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{e.description}</TableCell>
                  <TableCell className="text-gray-500">{e.beneficiary ?? "—"}</TableCell>
                  <TableCell className="font-medium text-red-700">{formatMZN(e.amount.toString())}</TableCell>
                  <TableCell>
                    {e.isPublic
                      ? <Eye className="h-4 w-4 text-green-600" />
                      : <EyeOff className="h-4 w-4 text-gray-400" />}
                  </TableCell>
                  <TableCell>
                    {e.attachmentUrl ? (
                      <a href={e.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <Paperclip className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditExpense(e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-600"
                          onClick={() => setCancelId(e.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editExpense} onOpenChange={(o) => !o && setEditExpense(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          {editExpense && (
            <ExpenseForm
              expense={editExpense}
              onSubmit={async (fd) => {
                const r = await updateExpense(editExpense.id, fd);
                if (r.success) setEditExpense(null);
                return r;
              }}
              onCancel={() => setEditExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Anular Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo da anulação..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelId(null)}>Voltar</Button>
              <Button
                variant="destructive"
                disabled={!cancelReason.trim()}
                onClick={async () => {
                  if (!cancelId) return;
                  const r = await cancelExpense(cancelId, cancelReason);
                  if (r.success) {
                    setCancelId(null);
                    setCancelReason("");
                  } else {
                    alert(r.error);
                  }
                }}
              >
                Anular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
