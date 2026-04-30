import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMZN, formatMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Building2,
  Wallet,
} from "lucide-react";

async function getDashboardData(role: string) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalApartments,
    activeApartments,
    chargesThisMonth,
    expensesThisMonth,
    overdueCharges,
    paidCharges,
  ] = await Promise.all([
    prisma.apartment.count(),
    prisma.apartment.count({ where: { status: "active" } }),
    prisma.monthlyCharge.findMany({
      where: {
        referenceMonth: { gte: firstOfMonth, lte: lastOfMonth },
      },
      include: { apartment: true },
    }),
    prisma.expense.aggregate({
      where: {
        cancelled: false,
        expenseDate: { gte: firstOfMonth, lte: lastOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.monthlyCharge.count({
      where: { status: "overdue" },
    }),
    prisma.monthlyCharge.count({
      where: {
        status: "paid",
        referenceMonth: { gte: firstOfMonth, lte: lastOfMonth },
      },
    }),
  ]);

  const totalIncome = chargesThisMonth.reduce(
    (sum, c) => sum + parseFloat(c.totalPaid.toString()),
    0
  );
  const totalExpenses = parseFloat(
    (expensesThisMonth._sum.amount ?? 0).toString()
  );
  const totalOutstanding = chargesThisMonth.reduce(
    (sum, c) => sum + parseFloat(c.outstandingAmount.toString()),
    0
  );

  return {
    totalApartments,
    activeApartments,
    totalIncome,
    totalExpenses,
    currentBalance: totalIncome - totalExpenses,
    totalOutstanding,
    overdueCharges,
    paidCharges,
    pendingCount: chargesThisMonth.filter((c) =>
      ["pending", "partial", "overdue"].includes(c.status)
    ).length,
    currentMonth: formatMonth(firstOfMonth),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const data = await getDashboardData(session.user.role);

  const stats = [
    {
      title: "Recebido este mês",
      value: formatMZN(data.totalIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Despesas este mês",
      value: formatMZN(data.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Saldo actual",
      value: formatMZN(data.currentBalance),
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Dívidas pendentes",
      value: formatMZN(data.totalOutstanding),
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{data.currentMonth}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-3">
                <Building2 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Apartamentos activos</p>
                <p className="text-2xl font-bold text-gray-900">{data.activeApartments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagos este mês</p>
                <p className="text-2xl font-bold text-gray-900">{data.paidCharges}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Em atraso</p>
                <p className="text-2xl font-bold text-gray-900">{data.overdueCharges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
