import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const roleLabel: Record<string, string> = {
    admin: "Administrador",
    resident: "Morador",
    auditor: "Auditor",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gestão de utilizadores e sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilizadores do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Versão</span>
            <span className="font-medium">1.0.0 MVP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sessão actual</span>
            <span className="font-medium">{session.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Perfil</span>
            <span className="font-medium">{roleLabel[session.user.role]}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
