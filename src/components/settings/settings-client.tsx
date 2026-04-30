"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
} from "@/app/(dashboard)/settings/actions";
import { Plus, Pencil, KeyRound, UserX, UserCheck } from "lucide-react";

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  resident: "Morador",
  auditor: "Auditor",
};

export function SettingsClient({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createUser(new FormData(e.currentTarget));
    setLoading(false);
    if ("error" in result) setError(result.error ?? "Erro desconhecido");
    else setCreateOpen(false);
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await updateUser(new FormData(e.currentTarget));
    setLoading(false);
    if ("error" in result) setError(result.error ?? "Erro desconhecido");
    else setEditUser(null);
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await resetPassword(new FormData(e.currentTarget));
    setLoading(false);
    if ("error" in result) setError(result.error ?? "Erro desconhecido");
    else setResetUser(null);
  }

  async function handleToggleStatus(userId: string) {
    const result = await toggleUserStatus(userId);
    if ("error" in result) alert(result.error);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); setError(""); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Utilizador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Utilizador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input name="phone" />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Perfil *</Label>
                <Select name="role" defaultValue="resident">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">Morador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "A criar..." : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="font-medium text-gray-900">{u.name}</p>
            <p className="text-sm text-gray-500">{u.email}</p>
            {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{roleLabel[u.role]}</Badge>
            <Badge variant={u.status === "active" ? "success" : "secondary"}>
              {u.status === "active" ? "Activo" : "Inactivo"}
            </Badge>
            <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditUser(u); setError(""); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Redefinir password" onClick={() => { setResetUser(u); setError(""); }}>
              <KeyRound className="h-4 w-4" />
            </Button>
            {u.id !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                title={u.status === "active" ? "Desactivar" : "Activar"}
                onClick={() => handleToggleStatus(u.id)}
              >
                {u.status === "active" ? <UserX className="h-4 w-4 text-red-500" /> : <UserCheck className="h-4 w-4 text-green-600" />}
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); setError(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <input type="hidden" name="userId" value={editUser.id} />
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input name="name" defaultValue={editUser.name} required />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input name="phone" defaultValue={editUser.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Perfil *</Label>
                <Select name="role" defaultValue={editUser.role}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">Morador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "A guardar..." : "Guardar"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => { if (!o) setResetUser(null); setError(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir Password — {resetUser?.name}</DialogTitle>
          </DialogHeader>
          {resetUser && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <input type="hidden" name="userId" value={resetUser.id} />
              <div className="space-y-2">
                <Label>Nova Password *</Label>
                <Input name="password" type="password" required minLength={6} autoFocus />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setResetUser(null)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "A guardar..." : "Redefinir"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
