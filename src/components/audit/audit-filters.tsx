"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const entityOptions = [
  { value: "user", label: "Utilizador" },
  { value: "apartment", label: "Apartamento" },
  { value: "resident", label: "Morador" },
  { value: "monthly_charge", label: "Mensalidade" },
  { value: "payment", label: "Pagamento" },
  { value: "expense", label: "Despesa" },
  { value: "salary_payment", label: "Salário" },
  { value: "report", label: "Relatório" },
  { value: "late_fee", label: "Multa" },
];

const actionOptions = [
  { value: "created", label: "Criado" },
  { value: "updated", label: "Actualizado" },
  { value: "deleted", label: "Eliminado" },
  { value: "activated", label: "Activado" },
  { value: "deactivated", label: "Desactivado" },
  { value: "applied", label: "Aplicado" },
  { value: "adjusted", label: "Ajustado" },
  { value: "removed", label: "Removido" },
  { value: "generated", label: "Gerado" },
  { value: "published", label: "Publicado" },
  { value: "cancelled", label: "Cancelado" },
];

export function AuditFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const entity = searchParams.get("entity") ?? "";
  const action = searchParams.get("action") ?? "";
  const user = searchParams.get("user") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const hasFilters = entity || action || user || from || to;

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Entidade</span>
        <Select value={entity || "all"} onValueChange={(v) => set("entity", v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {entityOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Acção</span>
        <Select value={action || "all"} onValueChange={(v) => set("action", v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {actionOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Utilizador</span>
        <Input
          className="h-8 text-sm w-40"
          placeholder="Nome..."
          value={user}
          onChange={(e) => set("user", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">De</span>
        <Input
          className="h-8 text-sm w-36"
          type="date"
          value={from}
          onChange={(e) => set("from", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Até</span>
        <Input
          className="h-8 text-sm w-36"
          type="date"
          value={to}
          onChange={(e) => set("to", e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-gray-500"
          onClick={() => router.push(pathname)}
        >
          <X className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
