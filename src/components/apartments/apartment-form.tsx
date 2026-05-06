"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Apartment } from "@prisma/client";

interface ApartmentFormProps {
  apartment?: Apartment;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  onCancel: () => void;
}

export function ApartmentForm({ apartment, onSubmit, onCancel }: ApartmentFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lateFeeType, setLateFeeType] = useState(apartment?.lateFeeType ?? "none");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome / Designação *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={apartment?.name}
            placeholder="ex: R/C, 1.º Andar, Flat 1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitType">Tipo *</Label>
          <Select name="unitType" defaultValue={apartment?.unitType ?? "apartment"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartamento</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="shop">Loja</SelectItem>
              <SelectItem value="dependency">Dependência</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyContribution">Contribuição Mensal (MZN) *</Label>
          <Input
            id="monthlyContribution"
            name="monthlyContribution"
            type="number"
            step="0.01"
            min="0"
            defaultValue={apartment?.monthlyContribution?.toString()}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentDueDay">Dia Limite de Pagamento *</Label>
          <Input
            id="paymentDueDay"
            name="paymentDueDay"
            type="number"
            min="1"
            max="31"
            defaultValue={apartment?.paymentDueDay ?? 10}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lateFeeType">Tipo de Multa</Label>
          <Select
            name="lateFeeType"
            defaultValue={apartment?.lateFeeType ?? "none"}
            onValueChange={(v) => setLateFeeType(v as typeof lateFeeType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem multa</SelectItem>
              <SelectItem value="fixed">Valor fixo</SelectItem>
              <SelectItem value="percentage">Percentagem</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {lateFeeType !== "none" && (
          <div className="space-y-2">
            <Label htmlFor="lateFeeValue">
              {lateFeeType === "fixed" ? "Valor da Multa (MZN) *" : "Percentagem (%) *"}
            </Label>
            <Input
              id="lateFeeValue"
              name="lateFeeValue"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={apartment?.lateFeeValue?.toString() ?? ""}
              required
            />
          </div>
        )}

        {lateFeeType === "none" && (
          <input type="hidden" name="lateFeeValue" value="0" />
        )}

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={apartment?.status ?? "active"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={apartment?.notes ?? ""}
          placeholder="Observações opcionais..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "A guardar..." : apartment ? "Actualizar" : "Criar Apartamento"}
        </Button>
      </div>
    </form>
  );
}
