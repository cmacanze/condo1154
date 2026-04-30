import { Badge } from "@/components/ui/badge";
import { ChargeStatus } from "@prisma/client";

const config: Record<ChargeStatus, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline" }> = {
  pending: { label: "Pendente", variant: "warning" },
  paid: { label: "Pago", variant: "success" },
  partial: { label: "Parcial", variant: "default" },
  overdue: { label: "Em atraso", variant: "destructive" },
  exempt: { label: "Isento", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
