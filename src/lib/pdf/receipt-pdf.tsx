import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1f2937",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  receiptBadge: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottom: "1px solid #f3f4f6",
  },
  label: {
    color: "#6b7280",
    width: "45%",
  },
  value: {
    fontFamily: "Helvetica-Bold",
    width: "55%",
    textAlign: "right",
  },
  amountBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    padding: 12,
    marginVertical: 16,
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
  },
  footer: {
    marginTop: 24,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
});

const methodLabel: Record<string, string> = {
  cash: "Numerário",
  transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  other: "Outro",
};

function formatMZN(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
}

function formatDatePt(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMonthPt(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-MZ", { month: "long", year: "numeric" });
}

export interface ReceiptData {
  receiptNumber: string;
  emittedAt: Date;
  apartmentName: string;
  residentName?: string;
  referenceMonth: Date;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | null;
  notes?: string | null;
  createdByName: string;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>CONDOMÍNIO 1154</Text>
          <Text style={styles.subtitle}>Recibo de Pagamento</Text>
          <Text style={styles.receiptBadge}>Nº {data.receiptNumber}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Emissão</Text>
            <Text style={styles.value}>{formatDatePt(data.emittedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Apartamento</Text>
            <Text style={styles.value}>{data.apartmentName}</Text>
          </View>
          {data.residentName && (
            <View style={styles.row}>
              <Text style={styles.label}>Morador</Text>
              <Text style={styles.value}>{data.residentName}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Mês de Referência</Text>
            <Text style={styles.value}>{formatMonthPt(data.referenceMonth)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data do Pagamento</Text>
            <Text style={styles.value}>{formatDatePt(data.paymentDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Método de Pagamento</Text>
            <Text style={styles.value}>{methodLabel[data.paymentMethod] ?? data.paymentMethod}</Text>
          </View>
          {data.transactionReference && (
            <View style={styles.row}>
              <Text style={styles.label}>Referência</Text>
              <Text style={styles.value}>{data.transactionReference}</Text>
            </View>
          )}
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>VALOR PAGO</Text>
          <Text style={styles.amount}>{formatMZN(data.amount)}</Text>
        </View>

        {data.notes && (
          <View style={styles.section}>
            <Text style={{ color: "#6b7280", marginBottom: 2 }}>Observações:</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Emitido por: {data.createdByName}</Text>
          <Text style={{ marginTop: 4 }}>
            Este documento serve de recibo válido — Condomínio 1154
          </Text>
        </View>
      </Page>
    </Document>
  );
}
