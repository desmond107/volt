"use client";
import { useState, useEffect, useRef } from "react";
import { CreditCard, Wallet, Globe, Zap, Shield, Code2, RefreshCw, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";
import ClientEagleLogo from "@/components/ui/ClientEagleLogo";

// ── Types & Data ──────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  stat: string;
  color: string;
  bg: string;
  rgb: string;
  category: "payments" | "security" | "developers";
  href: string;
  badge?: { text: string; type: "new" | "soon" };
}

const features: Feature[] = [
  {
    icon: CreditCard,
    title: "Instant Virtual Cards",
    description: "Get a Visa virtual card in seconds after signup. Fund it from your stablecoin wallet and start spending immediately.",
    stat: "< 10s issuance",
    color: "text-blue-400",
    bg: "bg-blue-600/10",
    rgb: "59,130,246",
    category: "payments",
    href: "/auth/signup",
  },
  {
    icon: Wallet,
    title: "Multi-Asset Wallets",
    description: "Hold USDC, USDT, and DAI across Base and BSC networks in one unified dashboard.",
    stat: "3 stablecoins",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    rgb: "245,158,11",
    category: "payments",
    href: "/auth/signup",
  },
  {
    icon: Globe,
    title: "150+ Countries",
    description: "Accepted at all Visa merchants worldwide. Shop online, subscribe to services, or pay in-person.",
    stat: "150+ countries",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    rgb: "16,185,129",
    category: "payments",
    href: "/pricing",
  },
  {
    icon: Zap,
    title: "On-Chain Settlement",
    description: "Transactions settle on-chain in seconds. Full transparency with real-time blockchain confirmations.",
    stat: "< 3s finality",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    rgb: "234,179,8",
    category: "security",
    href: "/developers",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your funds are protected by multi-layer encryption, 2FA, and real-time fraud monitoring.",
    stat: "256-bit encryption",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    rgb: "168,85,247",
    category: "security",
    href: "/legal/privacy",
  },
  {
    icon: Code2,
    title: "Developer API",
    description: "RESTful API with SDKs for Node.js, Python, Go, Ruby, and PHP. Issue and manage cards programmatically.",
    stat: "5 SDKs",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    rgb: "236,72,153",
    category: "developers",
    href: "/developers",
    badge: { text: "Updated", type: "new" },
  },
  {
    icon: RefreshCw,
    title: "Instant Conversions",
    description: "Swap between USDC, USDT, and DAI at market rates with minimal slippage directly in your wallet.",
    stat: "< 0.3% slippage",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    rgb: "59,130,246",
    category: "payments",
    href: "/auth/signup",
    badge: { text: "New", type: "new" },
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description: "Get instant push notifications and webhook events for every transaction on your cards.",
    stat: "< 100ms latency",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    rgb: "249,115,22",
    category: "developers",
    href: "/developers#webhooks",
  },
];

const CATEGORIES = [
  { id: "all",        label: "All" },
  { id: "payments",   label: "Payments" },
  { id: "security",   label: "Security" },
  { id: "developers", label: "Developers" },
];

// ── FeatureCard ───────────────────────────────────────────────────────────────

function FeatureCard({
  feature: f,
  index,
  visible,
}: {
  feature: Feature;
  index: number;
  visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = f.icon;

  return (
    <Link
      href={f.href}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(24px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        transitionDelay: `${index * 75}ms`,
      }}
    >
      <div
        className="relative bg-[#061120] border border-[#0d2040] rounded-xl p-5 h-full"
        style={{
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0px)",
          boxShadow: hovered ? `0 8px 32px rgba(${f.rgb},0.2)` : "none",
          borderColor: hovered ? `rgba(${f.rgb},0.45)` : undefined,
        }}
      >
        {/* Badge */}
        {f.badge && (
          <div
            className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
              f.badge.type === "new"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-[#c9943a]/15 text-[#c9943a] border-[#c9943a]/30"
            }`}
          >
            {f.badge.text}
          </div>
        )}

        {/* Icon box */}
        <div
          className={`w-12 h-12 rounded-lg ${f.bg} flex items-center justify-center mb-4`}
          style={{
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            transform: hovered ? "scale(1.1)" : "scale(1)",
            boxShadow: hovered ? `0 0 20px rgba(${f.rgb},0.35)` : "none",
          }}
        >
          <Icon
            className={`w-6 h-6 ${f.color}`}
            style={{
              transition: "transform 0.2s ease",
              transform: hovered ? "rotate(12deg)" : "rotate(0deg)",
            }}
          />
        </div>

        <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
        <p className="text-xs text-[#6b88b0] leading-relaxed mb-3">{f.description}</p>

        {/* Stat pill */}
        <div
          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.bg} ${f.color}`}
        >
          {f.stat}
        </div>

        {/* Learn more — slides in on hover */}
        <div className="flex items-center gap-1 mt-3 text-[11px] text-[#4a6080] overflow-hidden"
          style={{ color: hovered ? `rgba(${f.rgb},0.9)` : undefined, transition: "color 0.2s ease" }}
        >
          <span>Learn more</span>
          <ArrowRight
            className="w-3 h-3"
            style={{
              transition: "transform 0.2s ease, opacity 0.2s ease",
              transform: hovered ? "translateX(2px)" : "translateX(-4px)",
              opacity: hovered ? 1 : 0,
            }}
          />
        </div>
      </div>
    </Link>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

export default function Features() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [transitioning,  setTransitioning]  = useState(false);
  const [visible,        setVisible]        = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const filtered = activeCategory === "all"
    ? features
    : features.filter(f => f.category === activeCategory);

  const countFor = (id: string) =>
    id === "all" ? features.length : features.filter(f => f.category === id).length;

  // Scroll-triggered reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter with brief fade transition
  const handleCategory = (id: string) => {
    if (id === activeCategory) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveCategory(id);
      setTransitioning(false);
    }, 140);
  };

  return (
    <section ref={sectionRef} id="features" className="py-24 relative overflow-hidden">

      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <ClientEagleLogo size={64} />
              <div className="flex flex-col leading-none text-left">
                <span className="font-black text-2xl uppercase gradient-text" style={{ letterSpacing: "0.1em" }}>
                  VOLT
                </span>
                <span
                  className="text-[10px] uppercase font-semibold rounded-full border self-start px-1.5 py-0.5"
                  style={{
                    borderColor: "rgba(201,148,58,0.3)",
                    backgroundColor: "rgba(201,148,58,0.08)",
                    letterSpacing: "0.15em",
                    marginTop: "4px",
                    color: "#c9943a",
                  }}
                >
                  Digital Cards
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300">
              Everything you need
            </div>
            <div className="inline-flex items-center bg-[#061120] border border-[#0d2040] rounded-full px-2.5 py-1 text-xs text-[#6b88b0]">
              {features.length} features
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Built for the crypto-native world
          </h2>
          <p className="text-[#6b88b0] text-lg max-w-xl mx-auto">
            Every feature is designed to make spending your crypto as seamless as using a bank card.
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-[#061120] border border-[#0d2040] rounded-full p-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className={`shine-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "text-[#6b88b0] hover:text-white"
                }`}
              >
                {cat.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                    activeCategory === cat.id
                      ? "bg-white/20 text-white"
                      : "bg-[#0d2040] text-[#4a6080]"
                  }`}
                >
                  {countFor(cat.id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{
            opacity: transitioning ? 0 : 1,
            transition: "opacity 0.14s ease",
          }}
        >
          {filtered.map((f, i) => (
            <FeatureCard
              key={`${activeCategory}-${f.title}`}
              feature={f}
              index={i}
              visible={visible && !transitioning}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
