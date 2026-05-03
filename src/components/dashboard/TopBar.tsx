"use client";
import { Bell, Sun, Moon, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string | null;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeColors: Record<string, string> = {
  DEPOSIT: "bg-emerald-400",
  CARD_PAYMENT: "bg-red-400",
  KYC: "bg-amber-400",
  SYSTEM: "bg-blue-400",
  CARD: "bg-violet-400",
};

export default function TopBar({ title, subtitle, userName }: TopBarProps) {
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifications((await res.json()).notifications);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const toggleDark = () => {
    setDarkMode((prev) => {
      document.documentElement.classList.toggle("light-mode", prev);
      return !prev;
    });
  };

  return (
    <header className="h-16 border-b border-[#0d2040] flex items-center justify-between px-6 bg-[#020c1b]">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-[#6b88b0]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Dark/light toggle */}
        <button
          onClick={toggleDark}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 text-[#6b88b0] hover:text-white hover:bg-[#0d2040] rounded-lg transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 text-[#6b88b0] hover:text-white hover:bg-[#0d2040] rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-[#061120] border border-[#0d2040] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d2040]">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#6b88b0]">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-[#0d2040] last:border-0 hover:bg-[#0d2040]/50 transition-colors ${
                        n.read ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[n.type] ?? "bg-blue-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                          <div className="text-xs text-[#6b88b0] mt-0.5 line-clamp-2">{n.body}</div>
                          <div className="text-[10px] text-[#4a6080] mt-1">{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
