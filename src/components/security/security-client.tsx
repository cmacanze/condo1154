"use client";

import { useState } from "react";
import { SalaryPayment, SecurityStaff, User } from "@prisma/client";
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
import { createSecurityStaff, createSalaryPayment } from "@/app/(dashboard)/security/actions";
import { formatMZN, formatDate, formatMonth } from "@/lib/utils";
import { Plus, UserPlus } from "lucide-react";

type SalaryWithRelations = SalaryPayment & {
  securityStaff: SecurityStaff;
  createdBy: User;
};

export function SecurityClient({
  staff,
  salaries,
  isAdmin,
}: {
  staff: SecurityStaff[];
  salaries: SalaryWithRelations[];
  isAdmin: boolean;
}) {
  const [staffOpen, setStaffOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createSecurityStaff(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) setError(result.error);
    else setStaffOpen(false);
  }

  async function handleAddSalary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createSalaryPayment(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) setError(result.error);
    else setSalaryOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Seguranças</h2>
            {isAdmin && (
              <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <UserPlus className="mr-1 h-4 w-4" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Novo Segurança</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input name="phone" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setStaffOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={loading}>Adicionar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {staff.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum segurança registado.</p>
          ) : (
            <ul className="space-y-2">
              {staff.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.phone && <p className="text-xs text-gray-500">{s.phone}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pagamentos de Salários</h2>
            {isAdmin && (
              <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Registar Salário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Registar Pagamento de Salário</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSalary} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label>Segurança *</Label>
                      <Select name="securityStaffId">
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {staff.filter((s) => s.status === "active").map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Mês de Referência *</Label>
                        <Input name="referenceMonth" type="month" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Pagamento *</Label>
                        <Input
                          name="paymentDate"
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (MZN) *</Label>
                      <Input name="amount" type="number" step="0.01" min="0.01" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Input name="notes" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setSalaryOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={loading || staff.length === 0}>Registar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segurança</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      Nenhum pagamento registado.
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.securityStaff.name}</TableCell>
                      <TableCell>{formatMonth(s.referenceMonth)}</TableCell>
                      <TableCell>{formatDate(s.paymentDate)}</TableCell>
                      <TableCell className="font-medium text-red-700">{formatMZN(s.amount.toString())}</TableCell>
                      <TableCell className="text-gray-500">{s.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
