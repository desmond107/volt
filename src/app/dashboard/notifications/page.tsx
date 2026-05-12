"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { Bell, CheckCheck, ArrowDownLeft, ArrowUpRight, CreditCard, AlertCircle, Info, Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  DEPOSIT:      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />,
  SEND:         <ArrowUpRight className="w-4 h-4 text-red-400" />,
  TRANSFER:     <ArrowUpRight className="w-4 h-4 text-blue-400" />,
  CARD_PAYMENT: <CreditCard className="w-4 h-4 text-amber-400" />,
  CARD:         <CreditCard className="w-4 h-4 text-amber-400" />,
  WALLET:       <Wallet className="w-4 h-4 text-violet-400" />,
  ALERT:        <AlertCircle className="w-4 h-4 text-yellow-400" />,
};

function groupByDate(notifications: Notification[]): Array<{ label: string; items: Notification[] }> {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    let label: string;
    if (day >= today) label = "Today";
    else if (day >= yesterday) label = "Yesterday";
    else if (day >= weekAgo) label = "This week";
    else label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    (groups[label] ??= []).push(n);
  }

  const ORDER = ["Today", "Yesterday", "This week"];
  return Object.entries(groups)
    .sort(([a], [b]) => {
      const ai = ORDER.indexOf(a);
      const bi = ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return b.localeCompare(a);
    })
    .map(([label, items]) => ({ label, items }));
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const markOne = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const markAll = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setMarkingAll(false);
  };

  const unread = notifications.filter((n) => !n.read).length;
  const groups = groupByDate(notifications);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
      />

      <main className="flex-1 p-6 max-w-2xl w-full mx-auto space-y-6">
        {/* Header actions */}
        {unread > 0 && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" loading={markingAll} onClick={markAll}>
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[#061120] border border-[#0d2040] rounded-xl">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-[#0d2040] mx-auto mb-3" />
            <p className="text-sm text-[#6b88b0]">No notifications yet</p>
            <p className="text-xs text-[#6b88b0]/60 mt-1">Activity on your wallets and cards will appear here</p>
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label}>
              <h2 className="text-xs font-semibold text-[#6b88b0] uppercase tracking-wider mb-3">{label}</h2>
              <div className="space-y-2">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markOne(n.id)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      n.read
                        ? "bg-[#061120] border-[#0d2040] opacity-60"
                        : "bg-[#061120] border-blue-600/20 hover:border-blue-600/40 hover:bg-[#071530]"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.read ? "bg-[#0d2040]" : "bg-blue-500/10"}`}>
                      {TYPE_ICONS[n.type] ?? <Info className="w-4 h-4 text-[#6b88b0]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${n.read ? "text-[#6b88b0]" : "text-white"}`}>{n.title}</p>
                        <span className="text-[10px] text-[#6b88b0] shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-[#6b88b0] mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
