"use client";

import { useState } from "react";
import { Apartment, MonthlyCharge, Payment, User } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMZN, formatDate, formatMonth } from "@/lib/utils";
import { Printer, Eye, Download, FileDown } from "lucide-react";

function downloadCsv(filename: string, rows: string[][]) {
  const bom = "﻿";
  const csv = bom + rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

type PaymentWithRelations = Payment & {
  apartment: Apartment;
  monthlyCharge: MonthlyCharge;
  createdBy: User;
};

const methodLabel: Record<string, string> = {
  cash: "Numerário",
  transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  other: "Outro",
};

function ReceiptView({ payment }: { payment: PaymentWithRelations }) {
  return (
    <div className="receipt-print space-y-6 p-2">
      <div className="text-center border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900">CONDOMÍNIO 1154</h1>
        <p className="text-sm text-gray-500">Recibo de Pagamento</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Nº Recibo:</span>
          <p className="font-mono font-bold">{payment.receiptNumber}</p>
        </div>
        <div>
          <span className="text-gray-500">Data de Emissão:</span>
          <p className="font-medium">{formatDate(payment.createdAt)}</p>
        </div>
        <div>
          <span className="text-gray-500">Apartamento:</span>
          <p className="font-medium">{payment.apartment.name}</p>
        </div>
        <div>
          <span className="text-gray-500">Mês Referência:</span>
          <p className="font-medium">{formatMonth(payment.monthlyCharge.referenceMonth)}</p>
        </div>
        <div>
          <span className="text-gray-500">Data de Pagamento:</span>
          <p className="font-medium">{formatDate(payment.paymentDate)}</p>
        </div>
        <div>
          <span className="text-gray-500">Método:</span>
          <p className="font-medium">{methodLabel[payment.paymentMethod]}</p>
        </div>
        {payment.transactionReference && (
          <div className="col-span-2">
            <span className="text-gray-500">Referência:</span>
            <p className="font-medium">{payment.transactionReference}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">Valor Pago</p>
        <p className="text-3xl font-bold text-green-700">{formatMZN(payment.amount.toString())}</p>
      </div>

      {payment.notes && (
        <div>
          <span className="text-sm text-gray-500">Observações:</span>
          <p className="text-sm">{payment.notes}</p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        <p>Emitido por: {payment.createdBy.name}</p>
        <p>Este documento serve de recibo válido.</p>
      </div>
    </div>
  );
}

export function ReceiptsClient({
  payments,
}: {
  payments: PaymentWithRelations[];
}) {
  const [selected, setSelected] = useState<PaymentWithRelations | null>(null);
  const [search, setSearch] = useState("");

  const filtered = payments.filter(
    (p) =>
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.apartment.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Pesquisar por recibo ou apartamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const header = ["Nº Recibo","Apartamento","Mês","Data","Valor (MZN)","Método"];
            const rows = filtered.map((p) => [
              p.receiptNumber,
              p.apartment.name,
              formatMonth(p.monthlyCharge.referenceMonth),
              formatDate(p.paymentDate),
              p.amount.toString(),
              methodLabel[p.paymentMethod] ?? p.paymentMethod,
            ]);
            downloadCsv("recibos.csv", [header, ...rows]);
          }}
        >
          <FileDown className="mr-1 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Recibo</TableHead>
              <TableHead>Apartamento</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="w-20">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Nenhum recibo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                  <TableCell className="font-medium">{p.apartment.name}</TableCell>
                  <TableCell>{formatMonth(p.monthlyCharge.referenceMonth)}</TableCell>
                  <TableCell>{formatDate(p.paymentDate)}</TableCell>
                  <TableCell className="font-medium text-green-700">{formatMZN(p.amount.toString())}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{methodLabel[p.paymentMethod]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo</DialogTitle>
          </DialogHeader>
          {selected && <ReceiptView payment={selected} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              asChild
            >
              <a
                href={selected ? `/api/pdf/receipt/${selected.id}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={() => setSelected(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
