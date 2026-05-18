"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ClientEagleLogo from "@/components/ui/ClientEagleLogo";

const TAGLINE = "Digital Cards";

export default function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const [open,        setOpen]        = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [logoHov,     setLogoHov]     = useState(false);
  const [brandHov,    setBrandHov]    = useState(false);
  const [typed,       setTyped]       = useState(0);

  // Entrance mount + typewriter
  useEffect(() => {
    setMounted(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(i);
      if (i >= TAGLINE.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, []);

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
    { href: "/#features",     label: "Features"     },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/pricing",       label: "Pricing"      },
    { href: "/developers",    label: "Developers"   },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#0d2040]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand lockup ── */}
          <Link
            href="/"
            className="shine-btn flex items-center gap-2.5 rounded-lg px-1 py-1 select-none"
            onMouseEnter={() => setBrandHov(true)}
            onMouseLeave={() => setBrandHov(false)}
            style={{
              transform: brandHov ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.2s ease",
            }}
          >
            {/* Eagle: entrance scale + hover glow + wing-flap */}
            <div
              onMouseEnter={() => setLogoHov(true)}
              onMouseLeave={() => setLogoHov(false)}
              style={{
                opacity: mounted ? 1 : 0,
                filter: logoHov
                  ? "drop-shadow(0 0 8px rgba(26,86,219,0.75)) drop-shadow(0 0 18px rgba(26,86,219,0.35))"
                  : "none",
                transition: "opacity 0.4s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease",
              }}
            >
              <div className={logoHov ? "wing-flap" : ""}>
                <ClientEagleLogo size={52} />
              </div>
            </div>

            {/* VOLT + Digital Cards: entrance slide-up */}
            <div
              className="flex flex-col leading-none"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
              }}
            >
              {/* VOLT: gradient, all-caps, bold, hover letter-spacing expand */}
              <span
                className="font-black text-lg uppercase gradient-text"
                style={{
                  letterSpacing: brandHov ? "0.22em" : "0.08em",
                  transition: "letter-spacing 0.35s ease",
                }}
              >
                VOLT
              </span>

              {/* Digital Cards: pill badge + typewriter + shimmer on hover */}
              <span
                className="text-[10px] uppercase font-semibold rounded-full border self-start px-1.5 py-0.5"
                style={{
                  borderColor: "rgba(201,148,58,0.3)",
                  backgroundColor: "rgba(201,148,58,0.08)",
                  letterSpacing: "0.13em",
                  marginTop: "2px",
                  minWidth: "72px",
                }}
              >
                <span className={brandHov ? "tagline-shimmer" : "text-[#c9943a]"}>
                  {TAGLINE.slice(0, typed) || TAGLINE}
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-[#6b88b0] hover:text-white transition-colors">
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
              <Link href="/dashboard"><Button size="sm">View your Volt</Button></Link>
            ) : (
              <>
                <Link href="/auth/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                <Link href="/auth/signup"><Button size="sm">Get Started</Button></Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-[#6b88b0] hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#061120] border-t border-[#0d2040] px-4 py-4 space-y-3">

          {/* Mobile brand lockup */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#0d2040]">
            <ClientEagleLogo size={44} />
            <div className="flex flex-col leading-none">
              <span className="font-black text-base uppercase gradient-text" style={{ letterSpacing: "0.1em" }}>
                VOLT
              </span>
              <span
                className="text-[9px] uppercase font-semibold rounded-full border self-start px-1.5 py-0.5 text-[#c9943a]"
                style={{ borderColor: "rgba(201,148,58,0.3)", backgroundColor: "rgba(201,148,58,0.08)", letterSpacing: "0.12em", marginTop: "2px" }}
              >
                Digital Cards
              </span>
            </div>
          </div>

          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block text-sm text-[#6b88b0] hover:text-white py-2" onClick={() => setOpen(false)}>
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
