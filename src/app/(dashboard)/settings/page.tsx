import type { Metadata } from "next";
export const metadata: Metadata = { title: "Configurações" };

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

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
          <SettingsClient users={users} currentUserId={session.user.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Versão</span>
            <span className="font-medium">1.0.0</span>
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
