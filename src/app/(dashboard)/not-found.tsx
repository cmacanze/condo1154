import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileQuestion className="mb-4 h-10 w-10 text-gray-400" />
      <h2 className="text-xl font-bold text-gray-900">Página não encontrada</h2>
      <p className="mt-1 text-sm text-gray-500">
        O recurso que procura não existe ou foi removido.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
