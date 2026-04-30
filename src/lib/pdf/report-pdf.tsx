import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1f2937",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  subtitle: { fontSize: 11, color: "#374151", marginBottom: 2 },
  meta: { fontSize: 8, color: "#9ca3af" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginTop: 16,
    marginBottom: 6,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  summaryBox: {
    width: "47%",
    borderRadius: 4,
    padding: 10,
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 5,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottom: "1px solid #f9fafb",
  },
  col1: { width: "15%" },
  col2: { width: "45%" },
  col3: { width: "20%" },
  col4: { width: "20%", textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  footer: {
    marginTop: 20,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
  notes: {
    marginTop: 12,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
  },
});

function fmt(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${n.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN`;
}

function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-MZ", { month: "long", year: "numeric" });
}

export interface ReportExpense {
  expenseDate: Date;
  category: string;
  description: string;
  amount: number;
}

export interface ReportApartment {
  name: string;
  status: string;
  totalDue: number;
  totalPaid: number;
}

export interface ReportData {
  referenceMonth: Date;
  generatedAt: Date;
  openingBalance: number;
  totalIncome: number;
  totalLateFees: number;
  totalExpenses: number;
  closingBalance: number;
  notes?: string | null;
  expenses: ReportExpense[];
  apartments: ReportApartment[];
  createdByName: string;
}

const categoryLabel: Record<string, string> = {
  security: "Segurança",
  cleaning: "Limpeza",
  energy: "Energia",
  water: "Água",
  maintenance: "Manutenção",
  repairs: "Reparações",
  materials: "Material",
  administration: "Administração",
  other: "Outros",
};

const chargeStatusLabel: Record<string, string> = {
  paid: "Pago",
  partial: "Parcial",
  pending: "Pendente",
  overdue: "Em atraso",
  exempt: "Isento",
  cancelled: "Cancelado",
};

export function ReportDocument({ data }: { data: ReportData }) {
  const paidApts = data.apartments.filter((a) => a.status === "paid");
  const overdueApts = data.apartments.filter((a) =>
    ["overdue", "partial", "pending"].includes(a.status)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CONDOMÍNIO 1154</Text>
          <Text style={styles.subtitle}>
            Relatório Financeiro Mensal — {fmtMonth(data.referenceMonth)}
          </Text>
          <Text style={styles.meta}>
            Gerado em {fmtDate(data.generatedAt)} por {data.createdByName}
          </Text>
        </View>

        {/* Financial Summary */}
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryBox, { backgroundColor: "#eff6ff" }]}>
            <Text style={styles.summaryLabel}>Saldo Inicial</Text>
            <Text style={[styles.summaryValue, { color: "#1e40af" }]}>
              {fmt(data.openingBalance)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: "#f0fdf4" }]}>
            <Text style={styles.summaryLabel}>Total Receitas</Text>
            <Text style={[styles.summaryValue, { color: "#15803d" }]}>
              {fmt(data.totalIncome)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: "#fff7ed" }]}>
            <Text style={styles.summaryLabel}>Total Multas</Text>
            <Text style={[styles.summaryValue, { color: "#c2410c" }]}>
              {fmt(data.totalLateFees)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: "#fef2f2" }]}>
            <Text style={styles.summaryLabel}>Total Despesas</Text>
            <Text style={[styles.summaryValue, { color: "#dc2626" }]}>
              {fmt(data.totalExpenses)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: "#f0fdf4", width: "98%" }]}>
            <Text style={styles.summaryLabel}>Saldo Final</Text>
            <Text
              style={[
                styles.summaryValue,
                { fontSize: 18, color: data.closingBalance >= 0 ? "#15803d" : "#dc2626" },
              ]}
            >
              {fmt(data.closingBalance)}
            </Text>
          </View>
        </View>

        {/* Expenses */}
        {data.expenses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Despesas do Mês</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Data</Text>
              <Text style={styles.col2}>Descrição</Text>
              <Text style={styles.col3}>Categoria</Text>
              <Text style={styles.col4}>Valor</Text>
            </View>
            {data.expenses.map((e, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{fmtDate(e.expenseDate)}</Text>
                <Text style={styles.col2}>{e.description}</Text>
                <Text style={styles.col3}>{categoryLabel[e.category] ?? e.category}</Text>
                <Text style={[styles.col4, { color: "#dc2626" }]}>{fmt(e.amount)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Paid apartments */}
        {paidApts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Apartamentos Pagos ({paidApts.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={{ width: "50%" }}>Apartamento</Text>
              <Text style={{ width: "25%", textAlign: "right" }}>Total Devido</Text>
              <Text style={{ width: "25%", textAlign: "right" }}>Pago</Text>
            </View>
            {paidApts.map((a, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: "50%" }}>{a.name}</Text>
                <Text style={{ width: "25%", textAlign: "right" }}>{fmt(a.totalDue)}</Text>
                <Text style={{ width: "25%", textAlign: "right", color: "#15803d" }}>
                  {fmt(a.totalPaid)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Overdue apartments */}
        {overdueApts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Apartamentos em Atraso / Pendentes ({overdueApts.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={{ width: "40%" }}>Apartamento</Text>
              <Text style={{ width: "20%" }}>Estado</Text>
              <Text style={{ width: "20%", textAlign: "right" }}>Total Devido</Text>
              <Text style={{ width: "20%", textAlign: "right" }}>Em Aberto</Text>
            </View>
            {overdueApts.map((a, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: "40%" }}>{a.name}</Text>
                <Text style={{ width: "20%", color: "#dc2626" }}>
                  {chargeStatusLabel[a.status] ?? a.status}
                </Text>
                <Text style={{ width: "20%", textAlign: "right" }}>{fmt(a.totalDue)}</Text>
                <Text style={{ width: "20%", textAlign: "right", color: "#dc2626" }}>
                  {fmt(a.totalDue - a.totalPaid)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Notes */}
        {data.notes && (
          <>
            <Text style={styles.sectionTitle}>Observações do Gestor</Text>
            <View style={styles.notes}>
              <Text>{data.notes}</Text>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text>Condomínio 1154 — Relatório Financeiro</Text>
          <Text style={{ marginTop: 3 }}>
            {fmtMonth(data.referenceMonth)} — Gerado em {fmtDate(data.generatedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
