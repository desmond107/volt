"use client";
import { useState } from "react";
import Link from "next/link";
import ClientEagleLogo from "@/components/ui/ClientEagleLogo";

const links: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features",   href: "/#features" },
    { label: "Pricing",    href: "/pricing" },
    { label: "Roadmap",    href: "/roadmap" },
    { label: "Changelog",  href: "/changelog" },
  ],
  Developers: [
    { label: "API Docs",  href: "/developers" },
    { label: "SDKs",      href: "/developers#sdks" },
    { label: "Webhooks",  href: "/developers#webhooks" },
    { label: "Status",    href: "/status" },
  ],
  Company: [
    { label: "About",    href: "/about" },
    { label: "Blog",     href: "/blog" },
    { label: "Careers",  href: "/careers" },
    { label: "Press",    href: "/press" },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Cookie Policy",    href: "/legal/cookies" },
    { label: "AML Policy",       href: "/legal/aml" },
  ],
};

export default function Footer() {
  const [revealed,    setRevealed]    = useState(false);
  const [logoHov,     setLogoHov]     = useState(false);
  const [brandHov,    setBrandHov]    = useState(false);

  return (
    <footer className="border-t border-[#0d2040] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="shine-btn flex items-center gap-2.5 mb-4 rounded-lg self-start"
              onMouseEnter={() => setBrandHov(true)}
              onMouseLeave={() => setBrandHov(false)}
              style={{
                display: "inline-flex",
                transform: brandHov ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.2s ease",
              }}
            >
              {/* Eagle: hover glow + wing-flap */}
              <div
                onMouseEnter={() => setLogoHov(true)}
                onMouseLeave={() => setLogoHov(false)}
                style={{
                  filter: logoHov
                    ? "drop-shadow(0 0 8px rgba(26,86,219,0.75)) drop-shadow(0 0 18px rgba(26,86,219,0.35))"
                    : "none",
                  transition: "filter 0.3s ease",
                }}
              >
                <div className={logoHov ? "wing-flap" : ""}>
                  <ClientEagleLogo size={64} />
                </div>
              </div>

              {/* VOLT + Digital Cards */}
              <div className="flex flex-col leading-none">
                <span
                  className="font-black text-sm uppercase gradient-text"
                  style={{
                    letterSpacing: brandHov ? "0.2em" : "0.08em",
                    transition: "letter-spacing 0.35s ease",
                  }}
                >
                  VOLT
                </span>
                <span
                  className="text-[9px] uppercase font-semibold rounded-full border self-start px-1.5 py-0.5"
                  style={{
                    borderColor: "rgba(201,148,58,0.3)",
                    backgroundColor: "rgba(201,148,58,0.08)",
                    letterSpacing: "0.12em",
                    marginTop: "3px",
                  }}
                >
                  <span className={brandHov ? "tagline-shimmer" : "text-[#c9943a]"}>
                    Digital Cards
                  </span>
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#6b88b0] leading-relaxed mb-4">
              Simple, secure, borderless payments powered by stablecoins.
            </p>
            <p className="text-xs text-[#6b88b0]">
              contact@usevolt.com
            </p>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-xs text-[#6b88b0] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#0d2040] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#6b88b0]">
            © 2025 Volt Digital Cards Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#6b88b0]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </span>
            <span>SOC 2 Type II</span>
            <span>PCI DSS Level 1</span>
            <button
              onClick={() => setRevealed((v) => !v)}
              className="text-[10px] text-[#1a2e4a] hover:text-[#2a4a6a] transition-colors select-none"
            >
              {revealed ? "Made By Desmond Kinoti" : "DK"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
