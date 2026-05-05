"use client";

import { useState } from "react";
import { Apartment, Resident, User, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  createResident,
  updateResident,
  deactivateResident,
} from "@/app/(dashboard)/residents/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Pencil, UserX } from "lucide-react";

type ResidentWithRelations = Resident & {
  user: User;
  apartment: Apartment;
};

const relationshipLabel: Record<string, string> = {
  owner: "Proprietário",
  tenant: "Inquilino",
  representative: "Representante",
};

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  resident: "Morador",
  auditor: "Auditor",
};

interface ResidentFormData {
  resident?: ResidentWithRelations;
}

function ResidentForm({
  resident,
  apartments,
  onSubmit,
  onCancel,
}: {
  resident?: ResidentWithRelations;
  apartments: Apartment[];
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
          <Label>Nome completo *</Label>
          <Input name="name" defaultValue={resident?.user.name} required />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input name="email" type="email" defaultValue={resident?.user.email} required />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input name="phone" defaultValue={resident?.user.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>{resident ? "Nova password (deixe vazio para manter)" : "Password *"}</Label>
          <Input
            name="password"
            type="password"
            placeholder={resident ? "••••••••" : "mínimo 6 caracteres"}
            required={!resident}
          />
        </div>
        <div className="space-y-2">
          <Label>Apartamento *</Label>
          <Select name="apartmentId" defaultValue={resident?.apartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {apartments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de relação</Label>
          <Select name="relationshipType" defaultValue={resident?.relationshipType ?? "tenant"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Proprietário</SelectItem>
              <SelectItem value="tenant">Inquilino</SelectItem>
              <SelectItem value="representative">Representante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Perfil</Label>
          <Select name="role" defaultValue={(resident?.user.role as UserRole) ?? "resident"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resident">Morador</SelectItem>
              <SelectItem value="auditor">Auditor</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select name="status" defaultValue={resident?.status ?? "active"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "A guardar..." : resident ? "Actualizar" : "Criar Morador"}
        </Button>
      </div>
    </form>
  );
}

export function ResidentsClient({
  residents,
  apartments,
  isAdmin,
}: {
  residents: ResidentWithRelations[];
  apartments: Apartment[];
  isAdmin: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editResident, setEditResident] = useState<ResidentWithRelations | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = residents.filter(
    (r) =>
      r.user.name.toLowerCase().includes(search.toLowerCase()) ||
      r.user.email.toLowerCase().includes(search.toLowerCase()) ||
      r.apartment.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Pesquisar morador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Morador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Morador</DialogTitle>
              </DialogHeader>
              <ResidentForm
                apartments={apartments}
                onSubmit={async (fd) => {
                  const r = await createResident(fd);
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
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Apartamento</TableHead>
              <TableHead>Relação</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead className="w-24">Acções</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-gray-400 py-8">
                  Nenhum morador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.user.name}</TableCell>
                  <TableCell className="text-gray-500">{r.user.email}</TableCell>
                  <TableCell>{r.apartment.name}</TableCell>
                  <TableCell>{relationshipLabel[r.relationshipType]}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel[r.user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "active" ? "success" : "secondary"}>
                      {r.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditResident(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {r.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-500 hover:text-orange-700"
                            onClick={() => setDeactivateId(r.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editResident} onOpenChange={(o) => !o && setEditResident(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Morador</DialogTitle>
          </DialogHeader>
          {editResident && (
            <ResidentForm
              resident={editResident}
              apartments={apartments}
              onSubmit={async (fd) => {
                const r = await updateResident(editResident.id, fd);
                if (r.success) setEditResident(null);
                return r;
              }}
              onCancel={() => setEditResident(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateId}
        title="Desactivar morador"
        description="O morador perderá acesso ao sistema. Pode ser reactivado posteriormente."
        confirmLabel="Desactivar"
        destructive
        onConfirm={async () => {
          if (deactivateId) {
            await deactivateResident(deactivateId);
            toast.success("Morador desactivado.");
          }
          setDeactivateId(null);
        }}
        onCancel={() => setDeactivateId(null)}
      />
    </div>
  );
}
