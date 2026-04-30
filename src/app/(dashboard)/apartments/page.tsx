import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApartmentsClient } from "@/components/apartments/apartments-client";

export default async function ApartmentsPage() {
  const session = await auth();
  if (!session) return null;

  const apartments = await prisma.apartment.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apartamentos</h1>
        <p className="text-sm text-gray-500">{apartments.length} apartamento(s) registado(s)</p>
      </div>
      <ApartmentsClient
        apartments={apartments}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
