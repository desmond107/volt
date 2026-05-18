"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ClientEagleLogo from "@/components/ui/ClientEagleLogo";
import { ArrowRight, CheckCircle2, Shield, Zap, Globe } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  "Virtual card issued in under 10 seconds",
  "No monthly fees or hidden charges",
  "Accepted at 150+ countries, all Visa merchants",
  "Real-time spend notifications & webhooks",
];

const TRUST = [
  { icon: Shield, label: "256-bit SSL" },
  { icon: Zap,    label: "Visa Certified" },
  { icon: Globe,  label: "Non-custodial" },
];

const AVATARS = [
  { initials: "AW", from: "#1a56db", to: "#3b82f6" },
  { initials: "BO", from: "#d97706", to: "#f59e0b" },
  { initials: "CN", from: "#059669", to: "#10b981" },
  { initials: "DK", from: "#7c3aed", to: "#a855f7" },
  { initials: "FA", from: "#0891b2", to: "#06b6d4" },
  { initials: "GK", from: "#db2777", to: "#ec4899" },
];

interface Particle {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  delay: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniCard({ hovered }: { hovered: boolean }) {
  return (
    <div
      className="w-56 h-36 rounded-2xl relative overflow-hidden shrink-0"
      style={{
        background: "linear-gradient(135deg, #0f2a4e 0%, #061120 60%, #0a1929 100%)",
        border: "1px solid rgba(26,86,219,0.3)",
        transition: "transform 0.4s ease, box-shadow 0.4s ease",
        transform: hovered
          ? "perspective(600px) rotateY(-8deg) rotateX(4deg) scale(1.05)"
          : "perspective(600px) rotateY(-4deg) rotateX(2deg)",
        boxShadow: hovered
          ? "0 24px 48px rgba(26,86,219,0.3), 0 8px 16px rgba(0,0,0,0.5)"
          : "0 12px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Card shine overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%)" }}
      />
      {/* Glow orb */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/15 rounded-full blur-xl" />

      <div className="relative p-4 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="text-[9px] text-[#4a6080] uppercase tracking-[0.15em]">Volt Digital</div>
          <div className="text-[10px] font-bold text-[#c9943a]">VISA</div>
        </div>
        {/* Chip */}
        <div className="w-7 h-5 rounded bg-gradient-to-br from-[#c9943a]/60 to-[#f0b429]/40 border border-[#c9943a]/30" />
        <div>
          <div className="text-[11px] font-mono text-white/60 tracking-[0.18em] mb-2">
            •••• •••• •••• 4291
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[7px] text-[#4a6080] uppercase tracking-wider">Valid thru</div>
              <div className="text-[9px] text-white/60 font-mono">12/28</div>
            </div>
            <div className="text-[8px] text-[#6b88b0] font-medium">USDC</div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── CTA ───────────────────────────────────────────────────────────────────────

export default function CTA({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [visible,     setVisible]     = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const [primaryHov,  setPrimaryHov]  = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [particles,   setParticles]   = useState<Particle[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fireCon = () => {
    const colors = ["#3b82f6", "#c9943a", "#10b981", "#a855f7", "#f59e0b", "#ec4899"];
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i / 24) * Math.PI * 2,
        distance: 50 + Math.random() * 70,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
        delay: Math.random() * 80,
      }))
    );
    setTimeout(() => setParticles([]), 900);
  };

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">

      {/* Bottom fade-out into footer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, transparent, #020c1b)" }}
      />

      <div
        className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Card — border shimmer + animated background */}
        <div
          className="border-shimmer relative rounded-2xl overflow-hidden"
          onMouseEnter={() => setCardHovered(true)}
          onMouseLeave={() => setCardHovered(false)}
          style={{
            background: "linear-gradient(135deg, #0c1f3a 0%, #061120 50%, #061120 100%)",
          }}
        >
          {/* Dot-grid inside card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Animated shimmer top bar */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div
              className="absolute top-0 h-full"
              style={{
                left: "-80%",
                width: "55%",
                background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.9), rgba(201,148,58,0.7), transparent)",
                animation: "shine-sweep 3s linear infinite",
              }}
            />
          </div>

          {/* Blue glow orb — top right */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(26,86,219,0.2) 0%, transparent 70%)",
              transition: "opacity 0.5s ease",
              opacity: cardHovered ? 1 : 0.65,
            }}
          />
          {/* Gold glow orb — bottom left */}
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(201,148,58,0.15) 0%, transparent 70%)",
              transition: "opacity 0.5s ease",
              opacity: cardHovered ? 1 : 0.65,
            }}
          />

          <div className="relative p-10 lg:p-14">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

              {/* ── Left: content ── */}
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">

                {/* Logo with hover wing-flap */}
                <div
                  className="mb-5 cursor-pointer"
                  onMouseEnter={() => setLogoHovered(true)}
                  onMouseLeave={() => setLogoHovered(false)}
                >
                  <div className={logoHovered ? "wing-flap" : ""}>
                    <ClientEagleLogo size={56} />
                  </div>
                </div>

                {/* Gradient headline */}
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  <span className="gradient-text">Ready to spend</span>
                  <br />
                  <span className="text-white">your crypto?</span>
                </h2>

                {/* Social proof micro-stat */}
                <p className="text-[#6b88b0] text-base mb-6 max-w-md">
                  Join{" "}
                  <span className="text-white font-semibold">12,400+</span> users ·{" "}
                  <span className="text-white font-semibold">$2.1B</span> processed ·{" "}
                  <span className="text-white font-semibold">150+</span> countries
                </p>

                {/* Feature checklist */}
                <ul className="flex flex-col gap-2.5 mb-8 text-sm text-[#6b88b0] w-full">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 relative">

                  {/* Confetti particles */}
                  {particles.map(p => (
                    <span
                      key={p.id}
                      className="absolute rounded-full pointer-events-none z-20"
                      style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        top: "50%",
                        left: "30%",
                        animation: `confetti-burst 0.8s ease-out ${p.delay}ms forwards`,
                        "--cx": `${Math.cos(p.angle) * p.distance}px`,
                        "--cy": `${Math.sin(p.angle) * p.distance}px`,
                      } as React.CSSProperties}
                    />
                  ))}

                  {/* Primary button with hover glow */}
                  <div
                    onMouseEnter={() => setPrimaryHov(true)}
                    onMouseLeave={() => setPrimaryHov(false)}
                    style={{
                      borderRadius: "0.5rem",
                      transition: "box-shadow 0.3s ease",
                      boxShadow: primaryHov
                        ? "0 0 28px rgba(26,86,219,0.6), 0 0 56px rgba(26,86,219,0.2)"
                        : "none",
                    }}
                  >
                    {isLoggedIn ? (
                      <Link href="/dashboard" onClick={fireCon}>
                        <Button size="lg">
                          View your Volt <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/signup" onClick={fireCon}>
                        <Button size="lg">
                          Get Started for Free <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  <Link href="/pricing">
                    <Button variant="secondary" size="lg">View Pricing</Button>
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start">
                  {TRUST.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-1.5 text-[10px] text-[#6b88b0] bg-[#061120]/80 border border-[#0d2040] rounded-full px-3 py-1"
                    >
                      <Icon className="w-3 h-3 text-emerald-400" />
                      {label}
                    </div>
                  ))}
                  <div className="inline-flex items-center gap-1.5 text-[10px] text-[#6b88b0] bg-[#061120]/80 border border-[#0d2040] rounded-full px-3 py-1">
                    Open Source
                  </div>
                </div>

                <p className="mt-4 text-xs text-[#4a6080]">
                  No credit card required &bull; Free account &bull; Card issued in seconds
                </p>
              </div>

              {/* ── Right: visual panel (desktop only) ── */}
              <div className="hidden lg:flex flex-col items-center gap-6 shrink-0">
                {/* 3D tilt mini card */}
                <MiniCard hovered={cardHovered} />

                {/* Avatar cluster */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex -space-x-2">
                    {AVATARS.map(a => (
                      <div
                        key={a.initials}
                        className="w-8 h-8 rounded-full border-2 border-[#061120] flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                      >
                        {a.initials}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#6b88b0]">
                    <span className="text-white font-semibold">12,400+</span> users already spending
                  </p>
                </div>

                {/* Mini stat cards */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[
                    { value: "$2.1B",  label: "Processed"  },
                    { value: "150+",   label: "Countries"  },
                    { value: "<10s",   label: "Card issue" },
                    { value: "99.9%",  label: "Uptime"     },
                  ].map(s => (
                    <div
                      key={s.label}
                      className="bg-[#020c1b]/60 border border-[#0d2040] rounded-xl px-3 py-2.5 text-center"
                    >
                      <div className="text-sm font-bold text-white">{s.value}</div>
                      <div className="text-[10px] text-[#6b88b0]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
