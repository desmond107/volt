"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserCheck, Wallet, CreditCard, ShoppingCart, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

// ── Data ──────────────────────────────────────────────────────────────────────

const steps = [
  {
    icon: UserCheck,
    title: "Create your account",
    time: "~1 min",
    description:
      "Sign up with your email and complete our streamlined KYC process. Most users finish in under 3 minutes.",
    details: [
      "Email & password or social sign-in",
      "Upload a government-issued photo ID",
      "Automated scanning — no manual review wait",
    ],
    expanded:
      "We use bank-grade identity verification powered by automated document scanning. Your data is encrypted end-to-end and never stored unmasked. Level 1 KYC unlocks the Starter plan instantly.",
    iconBg:    "bg-blue-600/10 border-blue-600/20",
    iconColor: "text-blue-400",
    timeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    glow:      "rgba(59,130,246,0.3)",
    lineGrad:  "rgba(59,130,246,0.5)",
  },
  {
    icon: Wallet,
    title: "Fund your wallet",
    time: "~2 min",
    description:
      "Deposit USDC, USDT, or DAI to your Volt wallet address from any exchange or DeFi protocol.",
    details: [
      "Unique deposit address per stablecoin",
      "Base & BSC networks — more coming soon",
      "Deposits confirm in under 30 seconds",
    ],
    expanded:
      "Your Volt wallet holds each stablecoin separately with its own on-chain address. Deposits from Coinbase, Binance, MetaMask, or any DeFi protocol are supported. Funds appear in your dashboard the moment the transaction confirms.",
    iconBg:    "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-400",
    timeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    glow:      "rgba(245,158,11,0.3)",
    lineGrad:  "rgba(245,158,11,0.5)",
  },
  {
    icon: CreditCard,
    title: "Get your virtual card",
    time: "Instant",
    description:
      "Your Visa virtual card is issued instantly. Set a spending limit and link it to your stablecoin balance.",
    details: [
      "Full 16-digit card number + CVV + expiry",
      "Set custom per-card spending limits",
      "Link to any of your funded wallets",
    ],
    expanded:
      "Cards are issued by our banking partner and carry a full Visa card number, CVV, and expiry date — usable everywhere Visa is accepted online. You can issue multiple cards per wallet and freeze or terminate any card from your dashboard.",
    iconBg:    "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    timeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    glow:      "rgba(16,185,129,0.3)",
    lineGrad:  "rgba(16,185,129,0.5)",
  },
  {
    icon: ShoppingCart,
    title: "Spend anywhere",
    time: "Instant",
    description:
      "Use your card at any Visa-accepting merchant online or in-person. Transactions settle on-chain in real time.",
    details: [
      "150+ countries, all Visa merchants",
      "Apple Pay & Google Pay compatible",
      "Real-time on-chain settlement",
    ],
    expanded:
      "Every transaction is authorised against your stablecoin balance and settled on-chain within seconds. You receive a push notification and webhook event for every charge. Refunds are credited back to your wallet automatically.",
    iconBg:    "bg-purple-500/10 border-purple-500/20",
    iconColor: "text-purple-400",
    timeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    glow:      "rgba(168,85,247,0.3)",
    lineGrad:  "rgba(168,85,247,0.5)",
  },
];

const statsData = [
  { num: 150,  suffix: "+",    prefix: "",  decimals: 0, label: "Countries"    },
  { num: 0,    suffix: "",     prefix: "$", decimals: 0, label: "Monthly Fee"  },
  { num: 3,    suffix: " min", prefix: "",  decimals: 0, label: "Avg KYC Time" },
  { num: 99.9, suffix: "%",    prefix: "",  decimals: 1, label: "Uptime SLA"   },
];

// ── CountUp ───────────────────────────────────────────────────────────────────

function CountUp({
  num, suffix = "", prefix = "", decimals = 0, active,
}: {
  num: number; suffix?: string; prefix?: string; decimals?: number; active: boolean;
}) {
  const [val, setVal]  = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t     = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(eased * num);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setVal(num);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, num]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  return <>{prefix}{display}{suffix}</>;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function HowItWorks() {
  const [activeStep,    setActiveStep]    = useState<number | null>(null);
  const [stepsVisible,  setStepsVisible]  = useState([false, false, false, false]);
  const [lineVisible,   setLineVisible]   = useState(false);
  const [statsActive,   setStatsActive]   = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);

  // Trigger step reveals + connector line when section enters view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLineVisible(true);
        steps.forEach((_, i) => {
          setTimeout(() => {
            setStepsVisible(prev => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, i * 180);
        });
        observer.disconnect();
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Trigger count-up when stats bar enters view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsActive(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-24 relative overflow-hidden">

      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            Get started in minutes
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">How Volt works</h2>
          <p className="text-[#6b88b0] text-lg max-w-xl mx-auto">
            From crypto wallet to global spending card in four simple steps.
          </p>
        </div>

        {/* ── Desktop layout ── */}
        <div className="relative hidden lg:block">

          {/* Dashed background line */}
          <div
            className="absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(26,86,219,0.15) 0, rgba(26,86,219,0.15) 8px, transparent 8px, transparent 18px)",
            }}
          />

          {/* Animated fill line */}
          <div
            className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-600/30 via-blue-400/50 to-purple-500/30 origin-left transition-transform duration-1000 ease-out"
            style={{ transform: lineVisible ? "scaleX(1)" : "scaleX(0)" }}
          />

          {/* Traveling dot */}
          {lineVisible && (
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px overflow-visible pointer-events-none">
              <div
                className="travel-dot w-2.5 h-2.5 rounded-full bg-blue-400"
                style={{ boxShadow: "0 0 10px rgba(96,165,250,0.9)" }}
              />
            </div>
          )}

          {/* Step cards grid */}
          <div className="grid grid-cols-4 gap-8">
            {steps.map((s, i) => {
              const Icon     = s.icon;
              const visible  = stepsVisible[i];
              const isActive = activeStep === i;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center cursor-pointer transition-all duration-500"
                  style={{
                    opacity:   visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transitionDelay: `${i * 60}ms`,
                  }}
                  onClick={() => setActiveStep(isActive ? null : i)}
                >
                  {/* Icon box */}
                  <div
                    className={`relative w-20 h-20 rounded-2xl border flex items-center justify-center mb-4 transition-all duration-300 ${s.iconBg}`}
                    style={{ boxShadow: isActive ? `0 0 28px ${s.glow}` : "" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 28px ${s.glow}`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = isActive ? `0 0 28px ${s.glow}` : ""; }}
                  >
                    <Icon className={`w-7 h-7 ${s.iconColor}`} />

                    {/* Pulse ring — fires once on reveal */}
                    {visible && (
                      <span
                        className="absolute inset-0 rounded-2xl animate-ping"
                        style={{
                          backgroundColor: s.glow,
                          opacity: 0.25,
                          animationDuration: "0.9s",
                          animationIterationCount: "2",
                        }}
                      />
                    )}

                    {/* Step number badge */}
                    <span className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-[#020c1b] border border-[#0d2040] text-[10px] font-bold text-[#6b88b0] flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>

                  {/* Time chip */}
                  <div className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 mb-2 ${s.timeColor}`}>
                    <Clock className="w-2.5 h-2.5" />
                    {s.time}
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1.5">{s.title}</h3>
                  <p className="text-xs text-[#6b88b0] leading-relaxed mb-3">{s.description}</p>

                  {/* Sub-details */}
                  <ul className="space-y-1 text-left w-full">
                    {s.details.map(d => (
                      <li key={d} className="flex items-start gap-1.5 text-[11px] text-[#4a6080]">
                        <div className="w-1 h-1 rounded-full bg-[#1a3060] shrink-0 mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>

                  {/* Expand indicator */}
                  <div className={`mt-3 text-[10px] transition-colors ${isActive ? "text-blue-400" : "text-[#2d4a6e]"}`}>
                    {isActive ? "▲ less" : "▼ more"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile vertical timeline ── */}
        <div className="lg:hidden space-y-0">
          {steps.map((s, i) => {
            const Icon     = s.icon;
            const visible  = stepsVisible[i];
            const isActive = activeStep === i;

            return (
              <div
                key={i}
                className="flex gap-4 pb-8 last:pb-0 cursor-pointer transition-all duration-500"
                style={{
                  opacity:   visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-16px)",
                  transitionDelay: `${i * 100}ms`,
                }}
                onClick={() => setActiveStep(isActive ? null : i)}
              >
                {/* Left: icon + connecting line */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 ${s.iconBg}`}
                    style={{ boxShadow: isActive ? `0 0 20px ${s.glow}` : "" }}
                  >
                    <Icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-px flex-1 mt-2 transition-all duration-700"
                      style={{
                        background: visible
                          ? `linear-gradient(to bottom, ${s.lineGrad}, rgba(13,32,64,0.3))`
                          : "rgba(13,32,64,0.3)",
                      }}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 ${s.timeColor}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {s.time}
                    </span>
                  </div>
                  <p className="text-sm text-[#6b88b0] leading-relaxed mb-2">{s.description}</p>
                  <ul className="space-y-1">
                    {s.details.map(d => (
                      <li key={d} className="flex items-start gap-1.5 text-xs text-[#4a6080]">
                        <div className="w-1 h-1 rounded-full bg-[#1a3060] shrink-0 mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Expanded step detail panel ── */}
        {activeStep !== null && (
          <div
            className="mt-8 bg-[#061120] border border-[#0d2040] rounded-2xl p-6 transition-all duration-300"
            style={{ borderColor: steps[activeStep].lineGrad }}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${steps[activeStep].iconBg}`}
              >
                {(() => { const Icon = steps[activeStep].icon; return <Icon className={`w-5 h-5 ${steps[activeStep].iconColor}`} />; })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm font-semibold text-white">{steps[activeStep].title}</h4>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 ${steps[activeStep].timeColor}`}>
                    <Clock className="w-2.5 h-2.5" />
                    {steps[activeStep].time}
                  </span>
                </div>
                <p className="text-sm text-[#6b88b0] leading-relaxed mb-3">{steps[activeStep].expanded}</p>
                <ul className="space-y-1.5">
                  {steps[activeStep].details.map(d => (
                    <li key={d} className="flex items-center gap-2 text-xs text-[#c0d4ef]">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${steps[activeStep].iconColor}`} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setActiveStep(null)}
                className="text-[#4a6080] hover:text-white text-xs transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── Stats bar ── */}
        <div ref={statsRef} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {statsData.map((s) => (
            <div key={s.label} className="bg-[#061120] border border-[#0d2040] rounded-xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">
                <CountUp {...s} active={statsActive} />
              </div>
              <div className="text-sm text-[#6b88b0]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="mt-12 text-center">
          <Link href="/auth/signup">
            <Button size="lg">
              Create Your Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-[#4a6080]">
            Free to start · No credit card required · Card issued in seconds
          </p>
        </div>

      </div>
    </section>
  );
}
