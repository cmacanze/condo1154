import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar userRole={session.user.role} userName={session.user.name} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNav userRole={session.user.role} userName={session.user.name} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
