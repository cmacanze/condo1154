"use client";

import { useState } from "react";
import { Menu, X, Building2 } from "lucide-react";
import { Sidebar } from "./sidebar";
import { UserRole } from "@prisma/client";

interface MobileNavProps {
  userRole: UserRole;
  userName: string;
}

export function MobileNav({ userRole, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-gray-900">Condomínio 1154</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <div className="relative h-full">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-2 top-4 z-10 rounded-md p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar userRole={userRole} userName={userName} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
