import type { Metadata } from "next";
export const metadata: Metadata = { title: "Moradores" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { ResidentsClient } from "@/components/residents/residents-client";

export default async function ResidentsPage() {
  const session = await auth();
  if (!session) return null;

  const [residents, apartments] = await Promise.all([
    prisma.resident.findMany({
      include: { user: true, apartment: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.apartment.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Moradores</h1>
        <p className="text-sm text-gray-500">{residents.length} morador(es) registado(s)</p>
      </div>
      <ResidentsClient
        residents={serialize(residents)}
        apartments={serialize(apartments)}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
