import Link from "next/link";
import { Building2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Building2 className="mb-4 h-12 w-12 text-blue-600" />
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-lg font-medium text-gray-700">Página não encontrada</p>
      <p className="mt-1 text-sm text-gray-500">
        A página que procura não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        <Home className="h-4 w-4" />
        Voltar ao início
      </Link>
    </div>
  );
}
