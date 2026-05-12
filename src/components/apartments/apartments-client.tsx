"use client";

import { useState } from "react";
import { Apartment } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApartmentForm } from "./apartment-form";
import { createApartment, updateApartment, deleteApartment } from "@/app/(dashboard)/apartments/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMZN } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

const unitTypeLabel: Record<string, string> = {
  apartment: "Apartamento",
  flat: "Flat",
  shop: "Loja",
  dependency: "Dependência",
  other: "Outro",
};

interface ApartmentsClientProps {
  apartments: Apartment[];
  isAdmin: boolean;
}

export function ApartmentsClient({ apartments, isAdmin }: ApartmentsClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editApartment, setEditApartment] = useState<Apartment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = apartments.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(formData: FormData) {
    const result = await createApartment(formData);
    if (result.success) { setCreateOpen(false); toast.success("Apartamento criado."); }
    return result;
  }

  async function handleUpdate(formData: FormData) {
    if (!editApartment) return { error: "Erro" };
    const result = await updateApartment(editApartment.id, formData);
    if (result.success) { setEditApartment(null); toast.success("Apartamento actualizado."); }
    return result;
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteApartment(deleteId);
    setDeleteId(null);
    if (result.error) toast.error(result.error);
    else toast.success("Apartamento eliminado.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Pesquisar apartamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Apartamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Apartamento</DialogTitle>
              </DialogHeader>
              <ApartmentForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contribuição</TableHead>
              <TableHead>Dia Limite</TableHead>
              <TableHead>Multa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-28">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Nenhum apartamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.name}</TableCell>
                  <TableCell>{unitTypeLabel[apt.unitType]}</TableCell>
                  <TableCell>{formatMZN(apt.monthlyContribution.toString())}</TableCell>
                  <TableCell>Dia {apt.paymentDueDay}</TableCell>
                  <TableCell>
                    {apt.lateFeeType === "none"
                      ? "—"
                      : apt.lateFeeType === "fixed"
                      ? formatMZN(apt.lateFeeValue.toString())
                      : `${apt.lateFeeValue}%`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={apt.status === "active" ? "success" : "secondary"}>
                      {apt.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Ver detalhes" asChild>
                        <Link href={`/apartments/${apt.id}`}>
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Link>
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => setEditApartment(apt)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(apt.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar apartamento"
        description="Esta acção é irreversível. Todos os dados associados serão perdidos."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Dialog open={!!editApartment} onOpenChange={(o) => !o && setEditApartment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Apartamento</DialogTitle>
          </DialogHeader>
          {editApartment && (
            <ApartmentForm
              apartment={editApartment}
              onSubmit={handleUpdate}
              onCancel={() => setEditApartment(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
