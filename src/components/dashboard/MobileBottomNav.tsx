"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Wallet, ArrowLeftRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard",               icon: LayoutDashboard, label: "Home"    },
  { href: "/dashboard/wallet",        icon: Wallet,          label: "Wallets" },
  { href: "/dashboard/cards",         icon: CreditCard,      label: "Cards"   },
  { href: "/dashboard/transactions",  icon: ArrowLeftRight,  label: "History" },
  { href: "/dashboard/notifications", icon: Bell,            label: "Alerts"  },
];

export default function MobileBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#040f1c] border-t border-[#0d2040] flex items-stretch safe-area-inset-bottom">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        const isBell = href.includes("notifications");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] transition-colors relative",
              active ? "text-blue-400" : "text-[#6b88b0] hover:text-white"
            )}
          >
            {/* Active top indicator */}
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-500"
                style={{ boxShadow: "0 0 8px rgba(59,130,246,0.6)" }}
              />
            )}
            <div className="relative">
              <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
              {isBell && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className={cn("font-medium", active && "text-blue-400")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
