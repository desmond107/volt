"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Globe, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import EagleLogo from "@/components/ui/EagleLogo";


const cards = [
  {
    id: 0,
    name: "Platinum Executive",
    holder: "Desmond Kinoti",
    number: "4921",
    expiry: "12/27",
    bg: "linear-gradient(135deg, #0b1a35 0%, #1a3a6b 45%, #0d2347 100%)",
    chip: "#c9943a",
    accent: "#c9943a",
    network: "VISA",
  },
  {
    id: 1,
    name: "Gold Reserve",
    holder: "Amina Wanjiru",
    number: "7834",
    expiry: "09/28",
    bg: "linear-gradient(135deg, #2d1a00 0%, #7c4a00 45%, #3d2400 100%)",
    chip: "#f0b429",
    accent: "#f0b429",
    network: "VISA",
  },
  {
    id: 2,
    name: "Corporate Black",
    holder: "Brian Otieno",
    number: "2267",
    expiry: "03/29",
    bg: "linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 50%, #0a0a0a 100%)",
    chip: "#9ca3af",
    accent: "#e5e7eb",
    network: "VISA",
  },
  {
    id: 3,
    name: "Emerald Business",
    holder: "Faith Muthoni",
    number: "5519",
    expiry: "06/28",
    bg: "linear-gradient(135deg, #022c1e 0%, #065f46 45%, #022c1e 100%)",
    chip: "#34d399",
    accent: "#34d399",
    network: "VISA",
  },
];

function CardFace({ card, active, direction }: { card: typeof cards[0]; active: boolean; direction: "left" | "right" }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        opacity: active ? 1 : 0,
        transform: active
          ? "translateX(0) scale(1)"
          : direction === "right"
          ? "translateX(64px) scale(0.96)"
          : "translateX(-64px) scale(0.96)",
        pointerEvents: active ? "auto" : "none",
        background: card.bg,
      }}
    >
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center border border-white/20">
              <EagleLogo size={16} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-semibold text-xs">Volt</span>
              <span className="text-[8px] uppercase tracking-widest font-medium" style={{ color: card.accent }}>
                Financial
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/50 text-xs italic font-light tracking-widest">{card.network}</div>
            <div className="text-[10px] mt-0.5 font-medium" style={{ color: card.accent }}>{card.name}</div>
          </div>
        </div>

        {/* Chip + number */}
        <div>
          <div
            className="w-10 h-7 rounded-md mb-4 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${card.chip}cc, ${card.chip}66)`, border: `1px solid ${card.chip}44` }}
          >
            <div className="w-6 h-4 rounded-sm flex flex-col justify-around p-0.5" style={{ background: `${card.chip}33` }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-px rounded" style={{ background: `${card.chip}99` }} />
              ))}
            </div>
          </div>
          <p className="text-white font-mono text-sm tracking-widest mb-3">
            •••• •••• •••• {card.number}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</div>
              <div className="text-white text-sm font-medium">{card.holder}</div>
            </div>
            <div className="text-right">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Expires</div>
              <div className="text-white text-sm font-medium">{card.expiry}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [paused, setPaused] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await fetch("/api/demo/login", { method: "POST" });
      router.push("/dashboard");
    } catch {
      setDemoLoading(false);
    }
  };

  const goTo = useCallback((index: number, dir: "left" | "right") => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % cards.length, "right");
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + cards.length) % cards.length, "left");
  }, [current, goTo]);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(next, 3200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, next]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 1 }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-[#020d1a]/70 pointer-events-none" />

      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#1a56db 1px, transparent 1px), linear-gradient(90deg, #1a56db 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
              <Zap className="w-3.5 h-3.5" />
              Now supporting USDC, USDT &amp; DAI on Base &amp; BSC
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
              Spend digital currency
              <br />
              <span className="gradient-text">in USDT, anywhere in the World</span>
            </h1>

            <p className="text-xl text-[#6b88b0] mb-10 leading-relaxed">
              Volt gives you instant virtual Visa cards funded directly by your stablecoin wallet.
              No conversion, no delays — seamless borderless payments at 150+ million merchants worldwide.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={handleDemo}
                disabled={demoLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#c9943a]/40 text-[#c9943a] text-sm font-semibold hover:bg-[#c9943a]/10 hover:border-[#c9943a]/60 transition-colors disabled:opacity-60"
              >
                {demoLoading ? (
                  <span className="w-4 h-4 border-2 border-[#c9943a]/30 border-t-[#c9943a] rounded-full animate-spin" />
                ) : "⚡"}
                {demoLoading ? "Loading…" : "Live Demo"}
              </button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-[#6b88b0]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Bank-grade security
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Instant card issuance
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                150+ countries
              </div>
            </div>
          </div>

          {/* Right — carousel */}
          <div
            className="flex flex-col items-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Card stack */}
            <div className="relative w-full max-w-sm">
              {/* Shadow card behind */}
              <div
                className="absolute inset-x-4 -bottom-3 h-full rounded-2xl opacity-40 transition-all duration-500"
                style={{ background: cards[(current + 1) % cards.length].bg }}
              />
              <div
                className="absolute inset-x-2 -bottom-1.5 h-full rounded-2xl opacity-60 transition-all duration-500"
                style={{ background: cards[(current + 1) % cards.length].bg }}
              />

              {/* Main card */}
              <div className="relative w-full aspect-[1.586/1] rounded-2xl shadow-2xl">
                {cards.map((c) => (
                  <CardFace key={c.id} card={c} active={c.id === current} direction={direction} />
                ))}
              </div>

            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-12">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-full border border-[#0d2040] bg-[#061120] text-[#6b88b0] hover:text-white hover:border-blue-600/40 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                {cards.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => goTo(i, i > current ? "right" : "left")}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === current ? "20px" : "8px",
                      height: "8px",
                      background: i === current ? "#1a56db" : "#0d2040",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-8 h-8 rounded-full border border-[#0d2040] bg-[#061120] text-[#6b88b0] hover:text-white hover:border-blue-600/40 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card name label */}
            <p className="text-sm text-[#6b88b0] mt-3 tracking-wide">{cards[current].name}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
