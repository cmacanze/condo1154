"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
      <h1 className="text-2xl font-bold text-gray-900">Algo correu mal</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Ocorreu um erro inesperado. Tente novamente ou contacte o administrador.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-gray-400">Ref: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
}
