import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[#020c1b]">
      <Sidebar userName={session.name} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}
