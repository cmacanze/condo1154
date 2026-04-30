"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  Receipt,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  Home,
  UserCircle,
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "resident", "auditor"] },
  { href: "/apartments", label: "Apartamentos", icon: Building2, roles: ["admin", "auditor"] },
  { href: "/residents", label: "Moradores", icon: Users, roles: ["admin", "auditor"] },
  { href: "/charges", label: "Mensalidades", icon: FileText, roles: ["admin", "auditor"] },
  { href: "/payments", label: "Pagamentos", icon: CreditCard, roles: ["admin", "auditor"] },
  { href: "/expenses", label: "Despesas", icon: Receipt, roles: ["admin", "auditor"] },
  { href: "/security", label: "Seguranças", icon: ShieldCheck, roles: ["admin", "auditor"] },
  { href: "/reports", label: "Relatórios", icon: BarChart3, roles: ["admin", "resident", "auditor"] },
  { href: "/receipts", label: "Recibos", icon: FileText, roles: ["admin", "resident", "auditor"] },
  { href: "/audit", label: "Auditoria", icon: ClipboardList, roles: ["admin", "auditor"] },
  { href: "/my-apartment", label: "O Meu Apartamento", icon: Home, roles: ["resident"] },
  { href: "/settings", label: "Configurações", icon: Settings, roles: ["admin"] },
];

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <Building2 className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-gray-900">Condomínio 1154</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <UserCircle className="h-8 w-8 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
