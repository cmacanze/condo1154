import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 A criar dados de teste...");

  // ── Utilizadores ────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin1154", 10);
  const residentPassword = await bcrypt.hash("morador1154", 10);
  const auditorPassword = await bcrypt.hash("auditor1154", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@condo1154.mz" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@condo1154.mz",
      password: adminPassword,
      role: "admin",
      status: "active",
      phone: "+258 84 000 0000",
    },
  });

  const resident1 = await prisma.user.upsert({
    where: { email: "joao@condo1154.mz" },
    update: {},
    create: {
      name: "João Manuel",
      email: "joao@condo1154.mz",
      password: residentPassword,
      role: "resident",
      status: "active",
      phone: "+258 84 111 1111",
    },
  });

  const resident2 = await prisma.user.upsert({
    where: { email: "maria@condo1154.mz" },
    update: {},
    create: {
      name: "Maria dos Santos",
      email: "maria@condo1154.mz",
      password: residentPassword,
      role: "resident",
      status: "active",
      phone: "+258 84 222 2222",
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@condo1154.mz" },
    update: {},
    create: {
      name: "Carlos Auditoria",
      email: "auditor@condo1154.mz",
      password: auditorPassword,
      role: "auditor",
      status: "active",
    },
  });

  console.log("✅ Utilizadores criados");

  // ── Apartamentos ────────────────────────────────────────────────────
  const apartments = await Promise.all([
    prisma.apartment.upsert({
      where: { id: "apt-rc" },
      update: {},
      create: {
        id: "apt-rc",
        name: "R/C Esquerdo",
        unitType: "apartment",
        monthlyContribution: 3500,
        paymentDueDay: 10,
        lateFeeType: "fixed",
        lateFeeValue: 500,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-rc-d" },
      update: {},
      create: {
        id: "apt-rc-d",
        name: "R/C Direito",
        unitType: "apartment",
        monthlyContribution: 3500,
        paymentDueDay: 10,
        lateFeeType: "fixed",
        lateFeeValue: 500,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-1e" },
      update: {},
      create: {
        id: "apt-1e",
        name: "1.º Andar Esquerdo",
        unitType: "apartment",
        monthlyContribution: 4000,
        paymentDueDay: 10,
        lateFeeType: "percentage",
        lateFeeValue: 10,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-1d" },
      update: {},
      create: {
        id: "apt-1d",
        name: "1.º Andar Direito",
        unitType: "apartment",
        monthlyContribution: 4000,
        paymentDueDay: 10,
        lateFeeType: "percentage",
        lateFeeValue: 10,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-2e" },
      update: {},
      create: {
        id: "apt-2e",
        name: "2.º Andar Esquerdo",
        unitType: "apartment",
        monthlyContribution: 4500,
        paymentDueDay: 10,
        lateFeeType: "fixed",
        lateFeeValue: 750,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-2d" },
      update: {},
      create: {
        id: "apt-2d",
        name: "2.º Andar Direito",
        unitType: "apartment",
        monthlyContribution: 4500,
        paymentDueDay: 10,
        lateFeeType: "fixed",
        lateFeeValue: 750,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-3e" },
      update: {},
      create: {
        id: "apt-3e",
        name: "3.º Andar Esquerdo",
        unitType: "apartment",
        monthlyContribution: 5000,
        paymentDueDay: 10,
        lateFeeType: "percentage",
        lateFeeValue: 5,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-3d" },
      update: {},
      create: {
        id: "apt-3d",
        name: "3.º Andar Direito",
        unitType: "apartment",
        monthlyContribution: 5000,
        paymentDueDay: 10,
        lateFeeType: "percentage",
        lateFeeValue: 5,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-flat1" },
      update: {},
      create: {
        id: "apt-flat1",
        name: "Flat 1",
        unitType: "flat",
        monthlyContribution: 2000,
        paymentDueDay: 15,
        lateFeeType: "fixed",
        lateFeeValue: 300,
        status: "active",
      },
    }),
    prisma.apartment.upsert({
      where: { id: "apt-flat2" },
      update: {},
      create: {
        id: "apt-flat2",
        name: "Flat 2",
        unitType: "flat",
        monthlyContribution: 2000,
        paymentDueDay: 15,
        lateFeeType: "fixed",
        lateFeeValue: 300,
        status: "active",
      },
    }),
  ]);

  console.log("✅ 10 Apartamentos criados (2 flats com contribuição menor)");

  // ── Moradores ────────────────────────────────────────────────────────
  await prisma.resident.upsert({
    where: { userId_apartmentId: { userId: resident1.id, apartmentId: "apt-1e" } },
    update: {},
    create: {
      userId: resident1.id,
      apartmentId: "apt-1e",
      relationshipType: "owner",
      status: "active",
    },
  });

  await prisma.resident.upsert({
    where: { userId_apartmentId: { userId: resident2.id, apartmentId: "apt-2e" } },
    update: {},
    create: {
      userId: resident2.id,
      apartmentId: "apt-2e",
      relationshipType: "tenant",
      status: "active",
    },
  });

  console.log("✅ Moradores associados");

  // ── Mensalidades — Mês anterior ───────────────────────────────────
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const apt of apartments) {
    const base = parseFloat(apt.monthlyContribution.toString());
    // Mês anterior
    await prisma.monthlyCharge.upsert({
      where: { apartmentId_referenceMonth: { apartmentId: apt.id, referenceMonth: prevMonth } },
      update: {},
      create: {
        apartmentId: apt.id,
        referenceMonth: prevMonth,
        baseAmount: base,
        dueDate: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), apt.paymentDueDay),
        lateFeeAmount: 0,
        totalDue: base,
        totalPaid: 0,
        outstandingAmount: base,
        status: "pending",
      },
    });
    // Mês actual
    await prisma.monthlyCharge.upsert({
      where: { apartmentId_referenceMonth: { apartmentId: apt.id, referenceMonth: thisMonth } },
      update: {},
      create: {
        apartmentId: apt.id,
        referenceMonth: thisMonth,
        baseAmount: base,
        dueDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), apt.paymentDueDay),
        lateFeeAmount: 0,
        totalDue: base,
        totalPaid: 0,
        outstandingAmount: base,
        status: "pending",
      },
    });
  }

  // Apartamento em atraso (R/C Esquerdo — mês anterior)
  await prisma.monthlyCharge.updateMany({
    where: {
      apartmentId: "apt-rc",
      referenceMonth: prevMonth,
    },
    data: {
      lateFeeAmount: 500,
      totalDue: 4000,
      outstandingAmount: 4000,
      status: "overdue",
    },
  });

  // Apartamento com pagamento parcial (1.º Andar Esquerdo — mês actual)
  const chargePartial = await prisma.monthlyCharge.findUnique({
    where: { apartmentId_referenceMonth: { apartmentId: "apt-1e", referenceMonth: thisMonth } },
  });

  if (chargePartial) {
    await prisma.monthlyCharge.update({
      where: { id: chargePartial.id },
      data: {
        totalPaid: 2000,
        outstandingAmount: 2000,
        status: "partial",
      },
    });

    await prisma.payment.upsert({
      where: { receiptNumber: "REC-SEED-001" },
      update: {},
      create: {
        apartmentId: "apt-1e",
        monthlyChargeId: chargePartial.id,
        paymentDate: new Date(),
        amount: 2000,
        paymentMethod: "mpesa",
        receiptNumber: "REC-SEED-001",
        notes: "Pagamento parcial — seed",
        createdById: admin.id,
      },
    });
  }

  // Apartamento pago integralmente (2.º Andar Esquerdo — mês actual)
  const chargePaid = await prisma.monthlyCharge.findUnique({
    where: { apartmentId_referenceMonth: { apartmentId: "apt-2e", referenceMonth: thisMonth } },
  });

  if (chargePaid) {
    await prisma.monthlyCharge.update({
      where: { id: chargePaid.id },
      data: {
        totalPaid: 4500,
        outstandingAmount: 0,
        status: "paid",
      },
    });

    await prisma.payment.upsert({
      where: { receiptNumber: "REC-SEED-002" },
      update: {},
      create: {
        apartmentId: "apt-2e",
        monthlyChargeId: chargePaid.id,
        paymentDate: new Date(),
        amount: 4500,
        paymentMethod: "transfer",
        receiptNumber: "REC-SEED-002",
        transactionReference: "TXN-SEED-2025",
        notes: "Pagamento integral — seed",
        createdById: admin.id,
      },
    });
  }

  console.log("✅ Mensalidades criadas (em atraso, parcial, pago)");

  // ── Despesas ─────────────────────────────────────────────────────────
  const expenseData = [
    {
      expenseDate: new Date(now.getFullYear(), now.getMonth(), 5),
      category: "security" as const,
      description: "Pagamento serviço de segurança — empresa XYZ",
      beneficiary: "Empresa XYZ Segurança",
      amount: 15000,
      paymentMethod: "transfer" as const,
      isPublic: true,
    },
    {
      expenseDate: new Date(now.getFullYear(), now.getMonth(), 3),
      category: "cleaning" as const,
      description: "Limpeza das áreas comuns",
      beneficiary: "Rosa Faxina",
      amount: 3000,
      paymentMethod: "cash" as const,
      isPublic: true,
    },
    {
      expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
      category: "energy" as const,
      description: "Factura EDM — Partes comuns",
      beneficiary: "EDM",
      amount: 4200,
      paymentMethod: "transfer" as const,
      isPublic: true,
    },
    {
      expenseDate: new Date(now.getFullYear(), now.getMonth(), 7),
      category: "maintenance" as const,
      description: "Reparação bomba de água",
      beneficiary: "TechFix Lda",
      amount: 8500,
      paymentMethod: "cash" as const,
      isPublic: false,
    },
    {
      expenseDate: new Date(now.getFullYear(), now.getMonth(), 2),
      category: "water" as const,
      description: "Factura FIPAG — Água",
      beneficiary: "FIPAG",
      amount: 2800,
      paymentMethod: "transfer" as const,
      isPublic: true,
    },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({
      data: { ...e, createdById: admin.id },
    });
  }

  console.log("✅ 5 Despesas criadas");

  // ── Seguranças ────────────────────────────────────────────────────────
  const staff1 = await prisma.securityStaff.upsert({
    where: { id: "sec-1" },
    update: {},
    create: {
      id: "sec-1",
      name: "António Machava",
      phone: "+258 84 333 3333",
      status: "active",
    },
  });

  const staff2 = await prisma.securityStaff.upsert({
    where: { id: "sec-2" },
    update: {},
    create: {
      id: "sec-2",
      name: "Benedito Sitoe",
      phone: "+258 84 444 4444",
      status: "active",
    },
  });

  // Salários
  for (const [staff, month] of [
    [staff1, prevMonth],
    [staff2, thisMonth],
  ] as const) {
    const salaryExpense = await prisma.expense.create({
      data: {
        expenseDate: new Date(),
        category: "security",
        description: `Salário — ${staff.name}`,
        beneficiary: staff.name,
        amount: 7500,
        paymentMethod: "cash",
        isPublic: false,
        createdById: admin.id,
      },
    });

    await prisma.salaryPayment.create({
      data: {
        securityStaffId: staff.id,
        referenceMonth: month,
        paymentDate: new Date(),
        amount: 7500,
        notes: "Salário mensal",
        expenseId: salaryExpense.id,
        createdById: admin.id,
      },
    });
  }

  console.log("✅ 2 Pagamentos de salários criados");

  // ── Auditoria inicial ─────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      entityType: "user",
      entityId: admin.id,
      action: "created",
      newValues: { message: "Sistema inicializado com dados de teste" },
    },
  });

  console.log("✅ Registo de auditoria inicial criado");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seed concluído! Credenciais:");
  console.log("   Administrador: admin@condo1154.mz / admin1154");
  console.log("   Morador 1:     joao@condo1154.mz / morador1154");
  console.log("   Morador 2:     maria@condo1154.mz / morador1154");
  console.log("   Auditor:       auditor@condo1154.mz / auditor1154");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
