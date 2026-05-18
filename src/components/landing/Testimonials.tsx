"use client";
import { useState, useEffect, useRef } from "react";
import { Star, BadgeCheck, ChevronDown, ChevronUp } from "lucide-react";

// ── Types & Data ──────────────────────────────────────────────────────────────

type Platform = "twitter" | "producthunt" | "discord" | "github";

interface Testimonial {
  quote: string;
  name: string;
  handle: string;
  role: string;
  avatar: string;
  colorFrom: string;
  colorTo: string;
  rgb: string;
  platform: Platform;
  date: string;
  verified?: boolean;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Volt completely changed how I manage my crypto. I can now pay for my SaaS subscriptions directly in USDC without going through a CEX.",
    name: "Amina Wanjiku",
    handle: "@aminawanjiku_dev",
    role: "DeFi Developer",
    avatar: "AW",
    colorFrom: "#1a56db",
    colorTo: "#3b82f6",
    rgb: "59,130,246",
    platform: "twitter",
    date: "Mar 2026",
    verified: true,
    stars: 5,
  },
  {
    quote: "The API is fantastic. We integrated card issuance into our app in under a day. The Node SDK is clean and well-documented.",
    name: "Brian Otieno",
    handle: "@brianotieno_cto",
    role: "CTO at RemoteBase",
    avatar: "BO",
    colorFrom: "#d97706",
    colorTo: "#f59e0b",
    rgb: "245,158,11",
    platform: "github",
    date: "Feb 2026",
    verified: true,
    stars: 5,
  },
  {
    quote: "KYC took me 2 minutes and my card was ready immediately. I used it to book a hotel the same evening. Insane UX.",
    name: "Cynthia Njeri",
    handle: "@cynthianjeri_eth",
    role: "Crypto Trader",
    avatar: "CN",
    colorFrom: "#059669",
    colorTo: "#10b981",
    rgb: "16,185,129",
    platform: "producthunt",
    date: "Apr 2026",
    verified: false,
    stars: 5,
  },
  {
    quote: "Finally a way to spend USDT without worrying about gas fees or slippage. Volt handles everything seamlessly.",
    name: "David Kipchoge",
    handle: "@kipchoge_defi",
    role: "Freelance Designer",
    avatar: "DK",
    colorFrom: "#7c3aed",
    colorTo: "#a855f7",
    rgb: "168,85,247",
    platform: "discord",
    date: "Jan 2026",
    verified: false,
    stars: 5,
  },
  {
    quote: "Switched from a traditional neobank to Volt. The real-time notifications alone are worth it — I know the second any card transaction happens.",
    name: "Faith Akinyi",
    handle: "@faithakinyi_base",
    role: "Web3 Founder",
    avatar: "FA",
    colorFrom: "#0891b2",
    colorTo: "#06b6d4",
    rgb: "6,182,212",
    platform: "twitter",
    date: "Apr 2026",
    verified: true,
    stars: 5,
  },
  {
    quote: "We issue Volt cards to our entire remote team for expense management. The API webhooks integrate perfectly with our accounting stack.",
    name: "George Kamau",
    handle: "@kamau_cto",
    role: "Engineering Lead",
    avatar: "GK",
    colorFrom: "#db2777",
    colorTo: "#ec4899",
    rgb: "236,72,153",
    platform: "github",
    date: "Mar 2026",
    verified: true,
    stars: 5,
  },
  {
    quote: "The stablecoin conversion feature is a game-changer. I keep DAI and swap to USDC for spending — all within the same dashboard.",
    name: "Hannah Chebet",
    handle: "@chebet_protocol",
    role: "Protocol Researcher",
    avatar: "HC",
    colorFrom: "#16a34a",
    colorTo: "#22c55e",
    rgb: "34,197,94",
    platform: "discord",
    date: "Feb 2026",
    verified: false,
    stars: 5,
  },
  {
    quote: "As someone in a country with strict banking restrictions, Volt gave me access to global spending in under 10 minutes. Life-changing.",
    name: "Isaac Mutua",
    handle: "@mutua_web3",
    role: "NFT Artist",
    avatar: "IM",
    colorFrom: "#c9943a",
    colorTo: "#f0b429",
    rgb: "240,180,41",
    platform: "producthunt",
    date: "Jan 2026",
    verified: false,
    stars: 5,
  },
];

const PLATFORM_META: Record<Platform, { label: string; bg: string; color: string; border: string }> = {
  twitter:     { label: "X / Twitter",  bg: "rgba(255,255,255,0.05)", color: "#9ca3af",  border: "rgba(255,255,255,0.1)"  },
  producthunt: { label: "Product Hunt", bg: "rgba(218,85,47,0.1)",    color: "#DA552F",  border: "rgba(218,85,47,0.25)"   },
  discord:     { label: "Discord",      bg: "rgba(88,101,242,0.1)",   color: "#5865F2",  border: "rgba(88,101,242,0.25)"  },
  github:      { label: "GitHub",       bg: "rgba(255,255,255,0.05)", color: "#9ca3af",  border: "rgba(255,255,255,0.1)"  },
};

const INITIAL_COUNT = 6;

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          fill={i < count ? "#F59E0B" : "none"}
          stroke={i < count ? "#F59E0B" : "#4a6080"}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform];
  return (
    <div
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
    >
      {m.label}
    </div>
  );
}

function TestimonialCard({
  t,
  index,
  visible,
}: {
  t: Testimonial;
  index: number;
  visible: boolean;
}) {
  const [hovered, setHovered]         = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const delay = Math.min(index, 5) * 80 + 550;
    const timer = setTimeout(() => setHasRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [visible, index]);

  return (
    <div
      className="relative bg-[#061120] border border-[#0d2040] rounded-xl p-5 flex flex-col gap-3 mb-5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? "translateY(-4px)" : "translateY(0)"
          : "translateY(24px)",
        transition: "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        transitionDelay: hasRevealed ? "0ms" : `${Math.min(index, 5) * 80}ms`,
        boxShadow: hovered ? `0 8px 32px rgba(${t.rgb},0.18)` : "none",
        borderColor: hovered ? `rgba(${t.rgb},0.35)` : undefined,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${t.rgb},0.55), transparent)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Decorative background quote mark */}
      <div
        className="absolute top-2 right-4 text-7xl font-serif leading-none pointer-events-none select-none"
        style={{ color: `rgba(${t.rgb},0.07)` }}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      {/* Stars + platform */}
      <div className="flex items-center justify-between">
        <StarRow count={t.stars} />
        <PlatformBadge platform={t.platform} />
      </div>

      {/* Quote */}
      <p
        className="text-sm leading-relaxed relative z-10"
        style={{
          color: hovered ? "#e8eef8" : "#c0d4ef",
          transition: "color 0.2s ease",
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Author row */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{
              background: `linear-gradient(135deg, ${t.colorFrom}, ${t.colorTo})`,
              transition: "box-shadow 0.3s ease",
              boxShadow: hovered ? `0 0 14px rgba(${t.rgb},0.45)` : "none",
            }}
          >
            {t.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-white">{t.name}</span>
              {t.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
            </div>
            <div className="text-[10px] text-[#4a6080]">{t.handle}</div>
          </div>
        </div>
        <div className="text-[10px] text-[#2d4a6e]">{t.date}</div>
      </div>

      {/* Role chip */}
      <div className="text-[10px] text-[#6b88b0] bg-[#0a1929] border border-[#0d2040] rounded-full px-2.5 py-0.5 self-start">
        {t.role}
      </div>
    </div>
  );
}

function MarqueeCard({ t }: { t: Testimonial }) {
  return (
    <div className="shrink-0 w-72 bg-[#061120] border border-[#0d2040] rounded-xl p-4 mx-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <StarRow count={t.stars} />
        <PlatformBadge platform={t.platform} />
      </div>
      <p className="text-xs text-[#9ab0cc] leading-relaxed overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-2 mt-auto pt-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${t.colorFrom}, ${t.colorTo})` }}
        >
          {t.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-white">{t.name}</span>
            {t.verified && <BadgeCheck className="w-3 h-3 text-blue-400" />}
          </div>
          <div className="text-[9px] text-[#4a6080]">{t.handle}</div>
        </div>
      </div>
    </div>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleList = showAll ? TESTIMONIALS : TESTIMONIALS.slice(0, INITIAL_COUNT);

  // Distribute into 3 masonry columns
  const col1 = visibleList.filter((_, i) => i % 3 === 0);
  const col2 = visibleList.filter((_, i) => i % 3 === 1);
  const col3 = visibleList.filter((_, i) => i % 3 === 2);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">

      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Section glow divider — top */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(26,86,219,0.4) 35%, rgba(201,148,58,0.35) 65%, transparent 100%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Aggregate rating strip */}
        <div
          className="flex justify-center mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div className="inline-flex items-center gap-3 bg-[#061120] border border-[#0d2040] rounded-full px-5 py-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5" fill="#F59E0B" stroke="#F59E0B" />
              ))}
            </div>
            <span className="text-sm font-bold text-white">4.9</span>
            <span className="text-xs text-[#6b88b0]">·</span>
            <span className="text-xs text-[#6b88b0]">2,400+ reviews</span>
          </div>
        </div>

        {/* Header */}
        <div
          className="text-center mb-14"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.1s" }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            What our users say
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Loved by crypto users</h2>
          <p className="text-[#6b88b0] text-lg">
            Thousands of developers and crypto natives trust Volt daily.
          </p>
        </div>

        {/* Desktop: 3-column masonry */}
        <div className="hidden md:flex gap-5 items-start">
          <div className="flex-1 flex flex-col">
            {col1.map((t) => (
              <TestimonialCard key={t.name} t={t} index={TESTIMONIALS.indexOf(t)} visible={visible} />
            ))}
          </div>
          <div className="flex-1 flex flex-col mt-6">
            {col2.map((t) => (
              <TestimonialCard key={t.name} t={t} index={TESTIMONIALS.indexOf(t)} visible={visible} />
            ))}
          </div>
          <div className="flex-1 flex flex-col mt-10">
            {col3.map((t) => (
              <TestimonialCard key={t.name} t={t} index={TESTIMONIALS.indexOf(t)} visible={visible} />
            ))}
          </div>
        </div>

        {/* Mobile: horizontal snap carousel */}
        <div
          className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4"
          style={{ scrollbarWidth: "none" }}
        >
          {visibleList.map((t) => (
            <div key={t.name} className="snap-start shrink-0 w-[82vw]">
              <TestimonialCard t={t} index={TESTIMONIALS.indexOf(t)} visible={visible} />
            </div>
          ))}
        </div>

        {/* Load more */}
        {TESTIMONIALS.length > INITIAL_COUNT && (
          <div
            className="flex justify-center mt-2 mb-16"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.45s" }}
          >
            <button
              onClick={() => setShowAll(v => !v)}
              className="shine-btn inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#061120] border border-[#0d2040] text-[#6b88b0] hover:text-white hover:border-blue-600/40 transition-all duration-200"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4" />Show less</>
              ) : (
                <><ChevronDown className="w-4 h-4" />Show {TESTIMONIALS.length - INITIAL_COUNT} more reviews</>
              )}
            </button>
          </div>
        )}

        {/* Infinite marquee strip */}
        <div
          className="relative overflow-hidden"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.55s" }}
        >
          {/* Fade edges */}
          <div
            className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: "linear-gradient(90deg, #020c1b, transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: "linear-gradient(-90deg, #020c1b, transparent)" }}
          />
          <div className="marquee-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <MarqueeCard key={`${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>

      </div>

      {/* Section glow divider — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(26,86,219,0.3) 50%, transparent 100%)" }}
      />
    </section>
  );
}
