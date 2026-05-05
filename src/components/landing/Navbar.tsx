"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import EagleLogo from "@/components/ui/EagleLogo";

export default function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await fetch("/api/demo/login", { method: "POST" });
      router.push("/dashboard");
    } catch {
      setDemoLoading(false);
    }
  };

  const links = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/developers", label: "Developers" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#0d2040]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <EagleLogo size={40} />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight text-white">Volt</span>
              <span className="text-[9px] text-[#c9943a] uppercase tracking-[0.15em] font-semibold">Digital Pay</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-[#6b88b0] hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn && (
              <button
                onClick={handleDemo}
                disabled={demoLoading}
                className="text-sm px-3 py-1.5 rounded-lg border border-[#c9943a]/30 text-[#c9943a] hover:bg-[#c9943a]/10 transition-colors disabled:opacity-60 font-medium"
              >
                {demoLoading ? "Loading…" : "⚡ Live Demo"}
              </button>
            )}
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">View your Volt</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-[#6b88b0] hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#061120] border-t border-[#0d2040] px-4 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-sm text-[#6b88b0] hover:text-white py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#0d2040] flex flex-col gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">View your Volt</Button>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => { setOpen(false); handleDemo(); }}
                  disabled={demoLoading}
                  className="w-full py-2 rounded-lg border border-[#c9943a]/30 text-[#c9943a] text-sm font-medium hover:bg-[#c9943a]/10 transition-colors disabled:opacity-60"
                >
                  {demoLoading ? "Loading…" : "⚡ Try Live Demo"}
                </button>
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
