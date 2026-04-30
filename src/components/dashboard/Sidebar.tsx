"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  UserCheck,
  Code2,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import EagleLogo from "@/components/ui/EagleLogo";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/cards", icon: CreditCard, label: "Virtual Cards" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallets" },
  { href: "/dashboard/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/dashboard/kyc", icon: UserCheck, label: "KYC Verification" },
];

const secondary = [
  { href: "/developers", icon: Code2, label: "API Docs" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#040f1c] border-r border-[#0d2040] h-full transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#0d2040]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <EagleLogo size={36} />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white">Volt</span>
              <span className="text-[8px] text-[#c9943a] uppercase tracking-[0.12em] font-semibold">Digital Pay</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="flex items-center justify-center mx-auto">
            <EagleLogo size={32} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-[#6b88b0] hover:text-white p-1 rounded transition-colors",
            collapsed && "mx-auto mt-0"
          )}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-700/15 text-blue-300 border border-blue-600/20"
                  : "text-[#6b88b0] hover:text-white hover:bg-[#0d2040]",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Secondary nav */}
      <div className="py-4 px-2 space-y-0.5 border-t border-[#0d2040]">
        {secondary.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[#6b88b0] hover:text-white hover:bg-[#0d2040] transition-colors",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[#6b88b0] hover:text-red-400 hover:bg-red-500/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
