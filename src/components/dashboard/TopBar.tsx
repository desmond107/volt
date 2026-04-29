"use client";
import { Bell, Search } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string | null;
}

export default function TopBar({ title, subtitle, userName }: TopBarProps) {
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="h-16 border-b border-[#0d2040] flex items-center justify-between px-6 bg-[#020c1b]">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-[#6b88b0]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-[#061120] border border-[#0d2040] rounded-lg px-3 py-1.5 text-sm text-[#6b88b0]">
          <Search className="w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-xs w-32 text-[#6b88b0] placeholder-[#2d4a6e]"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-[#6b88b0] hover:text-white hover:bg-[#0d2040] rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
