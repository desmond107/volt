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
  BarChart3,
  CalendarClock,
  Menu,
  X,
  Globe,
  Bell,
  Plus,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import EagleLogo from "@/components/ui/EagleLogo";
import { useTheme } from "@/components/ui/ThemeProvider";

const nav = [
  { href: "/dashboard",                   icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/cards",             icon: CreditCard,      label: "Virtual Cards" },
  { href: "/dashboard/wallet",            icon: Wallet,          label: "Wallets" },
  { href: "/dashboard/multi-wallet",      icon: Globe,           label: "Multi-Currency" },
  { href: "/dashboard/transactions",      icon: ArrowLeftRight,  label: "Transactions" },
  { href: "/dashboard/analytics",         icon: BarChart3,       label: "Analytics" },
  { href: "/dashboard/scheduled",         icon: CalendarClock,   label: "Scheduled" },
  { href: "/dashboard/kyc",               icon: UserCheck,       label: "KYC Verification" },
  { href: "/dashboard/notifications",     icon: Bell,            label: "Notifications", badge: true },
];

const secondary = [
  { href: "/developers", icon: Code2, label: "API Docs" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({
  collapsed,
  setCollapsed,
  onClose,
  unreadCount,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onClose?: () => void;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleNavClick = () => {
    onClose?.();
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
          <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
            <EagleLogo size={56} />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white">Volt</span>
              <span className="text-[8px] text-[#c9943a] uppercase tracking-[0.12em] font-semibold">Digital Cards</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="flex items-center justify-center mx-auto">
            <EagleLogo size={48} />
          </div>
        )}
        <button
          onClick={() => (onClose ? onClose() : setCollapsed(!collapsed))}
          className={cn(
            "text-[#6b88b0] hover:text-white p-1 rounded transition-colors",
            collapsed && "mx-auto mt-0"
          )}
        >
          {onClose ? (
            <X className="w-4 h-4" />
          ) : (
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          )}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const showBadge = item.badge && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-700/15 text-blue-300 border border-blue-600/20"
                  : "text-[#6b88b0] hover:text-white hover:bg-[#0d2040]",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && showBadge && (
                <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Add Wallet shortcut */}
        <Link
          href="/dashboard/wallet"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[#6b88b0] hover:text-white hover:bg-[#0d2040] transition-colors mt-1",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Add Wallet" : undefined}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Add Wallet</span>}
        </Link>
      </nav>

      {/* Secondary nav */}
      <div className="py-4 px-2 space-y-0.5 border-t border-[#0d2040]">
        {secondary.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
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
          onClick={toggle}
          className={cn(
            "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[#6b88b0] hover:text-white hover:bg-[#0d2040] transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>
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

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.notifications) setUnreadCount(d.notifications.filter((n: { read: boolean }) => !n.read).length); })
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-[#040f1c] border border-[#0d2040] rounded-lg text-[#6b88b0] hover:text-white md:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} unreadCount={unreadCount} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex h-full">
            <SidebarContent collapsed={false} setCollapsed={() => {}} onClose={() => setMobileOpen(false)} unreadCount={unreadCount} />
          </div>
        </div>
      )}
    </>
  );
}
