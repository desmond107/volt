"use client";
import { useState, useEffect, useRef } from "react";
import { Copy, Check, ExternalLink, Zap, Globe, Shield, TrendingUp } from "lucide-react";

// ── Types & Data ──────────────────────────────────────────────────────────────

type Network = "Base" | "BSC";

interface Asset {
  name: string;
  network: Network;
  color: string;
  rgb: string;
  contract: string;
  fullContract: string;
  explorerUrl: string;
  fee: string;
  volume: string;
  comingSoon?: boolean;
  badge?: string;
}

const ASSETS: Asset[] = [
  {
    name: "USDT",
    network: "BSC",
    color: "#26A17B",
    rgb: "38,161,123",
    contract: "0x55d3...955",
    fullContract: "0x55d398326f99059fF775485246999027B3197955",
    explorerUrl: "https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955",
    fee: "~$0.05",
    volume: "$8.1B",
  },
  {
    name: "USDT",
    network: "Base",
    color: "#26A17B",
    rgb: "38,161,123",
    contract: "0xfde4...b2",
    fullContract: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    explorerUrl: "https://basescan.org/token/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    fee: "~$0.001",
    volume: "$340M",
    badge: "New",
  },
  {
    name: "USDC",
    network: "Base",
    color: "#2775CA",
    rgb: "39,117,202",
    contract: "0x8335...2913",
    fullContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorerUrl: "https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    fee: "~$0.001",
    volume: "$2.4B",
  },
  {
    name: "USDC",
    network: "BSC",
    color: "#2775CA",
    rgb: "39,117,202",
    contract: "0x8AC7...80d",
    fullContract: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    explorerUrl: "https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    fee: "~$0.05",
    volume: "$890M",
  },
  {
    name: "DAI",
    network: "Base",
    color: "#F4B731",
    rgb: "244,183,49",
    contract: "0x50c5...0Cb",
    fullContract: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    explorerUrl: "https://basescan.org/token/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    fee: "~$0.001",
    volume: "$612M",
  },
  {
    name: "DAI",
    network: "BSC",
    color: "#F4B731",
    rgb: "244,183,49",
    contract: "0x1AF3...3",
    fullContract: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    explorerUrl: "https://bscscan.com/token/0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    fee: "~$0.05",
    volume: "$98M",
    badge: "New",
  },
  {
    name: "PYUSD",
    network: "Base",
    color: "#003087",
    rgb: "0,48,135",
    contract: "0x0000...000",
    fullContract: "",
    explorerUrl: "#",
    fee: "—",
    volume: "—",
    comingSoon: true,
  },
  {
    name: "EURC",
    network: "Base",
    color: "#1DA462",
    rgb: "29,164,98",
    contract: "0x0000...000",
    fullContract: "",
    explorerUrl: "#",
    fee: "—",
    volume: "—",
    comingSoon: true,
  },
];

const NETWORK_META: Record<Network, { color: string; rgb: string; explorer: string }> = {
  Base: { color: "#0052FF", rgb: "0,82,255",    explorer: "basescan.org" },
  BSC:  { color: "#F0B90B", rgb: "240,185,11",  explorer: "bscscan.com"  },
};

// ── Coin SVG Logos ────────────────────────────────────────────────────────────

function CoinLogo({ name, size = 36 }: { name: string; size?: number }) {
  if (name === "USDC") return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#2775CA"/>
      <path d="M22.5 18c0-2.761-1.791-4.5-4.5-4.5v1.8c1.49 0 2.7 1.075 2.7 2.7s-1.21 2.7-2.7 2.7V22.5c2.709 0 4.5-1.739 4.5-4.5z" fill="white"/>
      <path d="M13.5 18c0 2.761 1.791 4.5 4.5 4.5V20.7c-1.49 0-2.7-1.075-2.7-2.7s1.21-2.7 2.7-2.7V13.5c-2.709 0-4.5 1.739-4.5 4.5z" fill="white"/>
      <rect x="17.1" y="10" width="1.8" height="3.2" rx="0.9" fill="white"/>
      <rect x="17.1" y="22.8" width="1.8" height="3.2" rx="0.9" fill="white"/>
    </svg>
  );
  if (name === "USDT") return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#26A17B"/>
      <rect x="11" y="10.5" width="14" height="2.8" rx="1.4" fill="white"/>
      <rect x="16.6" y="10.5" width="2.8" height="12" rx="1.4" fill="white"/>
      <ellipse cx="18" cy="21" rx="5.5" ry="1.8" fill="white" fillOpacity="0.9"/>
    </svg>
  );
  if (name === "DAI") return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#F4B731"/>
      <path d="M11 12h7c3.314 0 6 2.686 6 6s-2.686 6-6 6h-7V12zm2.5 2.5v7H18c1.933 0 3.5-1.567 3.5-3.5S19.933 14.5 18 14.5h-4.5z" fill="#1A1A1A"/>
    </svg>
  );
  if (name === "PYUSD") return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#003087"/>
      <text x="18" y="22" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui,sans-serif">PYUSD</text>
    </svg>
  );
  if (name === "EURC") return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#1DA462"/>
      <text x="18" y="24" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui,sans-serif">€</text>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#6b88b0"/>
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="system-ui,sans-serif">{name[0]}</text>
    </svg>
  );
}

// ── NetworkBadge ──────────────────────────────────────────────────────────────

function NetworkBadge({ network, showTooltip }: { network: Network; showTooltip?: boolean }) {
  const [tip, setTip] = useState(false);
  const meta = NETWORK_META[network];

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer select-none"
        style={{
          backgroundColor: `rgba(${meta.rgb},0.12)`,
          color: meta.color,
          border: `1px solid rgba(${meta.rgb},0.28)`,
        }}
        onMouseEnter={() => showTooltip && setTip(true)}
        onMouseLeave={() => setTip(false)}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
        {network}
      </div>

      {showTooltip && tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0a1929] border border-[#0d2040] rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap z-20 shadow-2xl pointer-events-none">
          <div className="text-[#6b88b0] mb-1 text-[10px]">{meta.explorer}</div>
          <div className="flex items-center gap-1 text-blue-400 text-[10px]">
            <ExternalLink className="w-3 h-3" />
            View on explorer
          </div>
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #0d2040" }}
          />
        </div>
      )}
    </div>
  );
}

// ── AssetCard ─────────────────────────────────────────────────────────────────

function AssetCard({ asset: a, index, visible }: { asset: Asset; index: number; visible: boolean }) {
  const [hovered, setHovered]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  // Clear stagger delay once the entrance animation completes
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setHasRevealed(true), index * 60 + 550);
    return () => clearTimeout(t);
  }, [visible, index]);

  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!a.fullContract) return;
    navigator.clipboard.writeText(a.fullContract).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (a.comingSoon) {
    return (
      <div
        className="relative bg-[#061120]/50 border border-dashed border-[#0d2040] rounded-xl p-4 flex flex-col gap-2"
        style={{
          opacity: visible ? 0.55 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          transitionDelay: `${index * 60}ms`,
        }}
      >
        <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#c9943a]/15 text-[#c9943a] border border-[#c9943a]/30">
          Soon
        </div>
        <div className="flex items-center gap-2.5">
          <CoinLogo name={a.name} size={32} />
          <div>
            <div className="text-sm font-semibold text-[#4a6080]">{a.name}</div>
            <NetworkBadge network={a.network} />
          </div>
        </div>
        <div className="text-[10px] text-[#2d4a6e] mt-1">Integration in progress</div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-[#061120] border border-[#0d2040] rounded-xl p-4 flex flex-col gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? "translateY(-4px)" : "translateY(0)"
          : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        transitionDelay: hasRevealed ? "0ms" : `${index * 60}ms`,
        boxShadow: hovered ? `0 8px 32px rgba(${a.rgb},0.2)` : "none",
        borderColor: hovered ? `rgba(${a.rgb},0.4)` : undefined,
      }}
    >
      {/* Badge */}
      {a.badge && (
        <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {a.badge}
        </div>
      )}

      {/* Coin + network row */}
      <div className="flex items-center gap-2.5">
        <div
          className="rounded-full shrink-0"
          style={{
            transition: "box-shadow 0.3s ease",
            boxShadow: hovered ? `0 0 18px rgba(${a.rgb},0.45)` : "none",
          }}
        >
          <CoinLogo name={a.name} size={36} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{a.name}</div>
          <NetworkBadge network={a.network} showTooltip />
        </div>
      </div>

      {/* Contract address row */}
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[10px] text-[#4a6080] font-mono truncate flex-1">{a.contract}</span>
        <button
          onClick={copy}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-[#0d2040] transition-colors"
          title="Copy contract address"
        >
          {copied
            ? <Check className="w-3 h-3 text-emerald-400" />
            : <Copy className="w-3 h-3 text-[#4a6080] hover:text-white transition-colors" />
          }
        </button>
        <a
          href={a.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-[#0d2040] transition-colors"
          title="View on block explorer"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3 text-[#4a6080] hover:text-blue-400 transition-colors" />
        </a>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#0d2040] mt-1">
        <div>
          <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-0.5">Gas fee</div>
          <div className="text-xs font-semibold text-white">{a.fee}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-0.5">Volume</div>
          <div className="text-xs font-semibold" style={{ color: `rgba(${a.rgb},1)` }}>{a.volume}</div>
        </div>
      </div>
    </div>
  );
}

// ── Stats data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Countries accepted",  value: "150+",    icon: Globe,       rgb: "59,130,246"  },
  { label: "Settlement time",     value: "< 3s",    icon: Zap,         rgb: "234,179,8"   },
  { label: "KYC avg time",        value: "3 min",   icon: Shield,      rgb: "168,85,247"  },
  { label: "On-chain volume",     value: "$12B+",   icon: TrendingUp,  rgb: "16,185,129"  },
];

// ── SupportedAssets ───────────────────────────────────────────────────────────

export default function SupportedAssets() {
  const [activeNetwork, setActiveNetwork] = useState<"all" | Network>("all");
  const [transitioning, setTransitioning] = useState(false);
  const [visible, setVisible]             = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNetwork = (id: "all" | Network) => {
    if (id === activeNetwork) return;
    setTransitioning(true);
    setTimeout(() => { setActiveNetwork(id); setTransitioning(false); }, 140);
  };

  const liveAssets = ASSETS.filter(a => !a.comingSoon);

  const filtered = activeNetwork === "all"
    ? ASSETS
    : ASSETS.filter(a => a.network === activeNetwork || a.comingSoon);

  const countFor = (id: "all" | Network) =>
    id === "all" ? liveAssets.length : liveAssets.filter(a => a.network === id).length;

  return (
    <section ref={sectionRef} className="py-20 border-y border-[#0d2040] relative overflow-hidden">

      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Total liquidity banner */}
        <div
          className="flex justify-center mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            $12B+ in stablecoins processed on-chain
          </div>
        </div>

        {/* Section header */}
        <div
          className="text-center mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.1s",
          }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">
            Supported Stablecoins &amp; Networks
          </h2>
          <p className="text-[#6b88b0] text-sm max-w-lg mx-auto leading-relaxed">
            Spend USDC, USDT, and DAI directly from your wallet — no conversions needed.
            Powered by Base and BSC for fast, low-cost on-chain settlement.
          </p>
        </div>

        {/* Chain connector (desktop) */}
        <div
          className="hidden md:flex items-center justify-center gap-4 mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.2s",
          }}
        >
          <div
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(0,82,255,0.1)",
              border: "1px solid rgba(0,82,255,0.25)",
              color: "#0052FF",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
            Base Network
          </div>
          <div className="relative flex-1 max-w-30 h-px bg-[#0d2040]">
            <div className="travel-dot w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="text-[10px] text-[#4a6080] font-mono px-2.5 py-1 bg-[#061120] border border-[#0d2040] rounded-md">
            Bridge
          </div>
          <div className="relative flex-1 max-w-30 h-px bg-[#0d2040]">
            <div className="travel-dot w-2 h-2 rounded-full bg-yellow-400" style={{ animationDelay: "1.5s" }} />
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(240,185,11,0.1)",
              border: "1px solid rgba(240,185,11,0.25)",
              color: "#F0B90B",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#F0B90B]" />
            BSC Network
          </div>
        </div>

        {/* Network filter tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 bg-[#061120] border border-[#0d2040] rounded-full p-1">
            {(["all", "Base", "BSC"] as const).map(id => (
              <button
                key={id}
                onClick={() => handleNetwork(id)}
                className={`shine-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeNetwork === id
                    ? "bg-blue-600 text-white"
                    : "text-[#6b88b0] hover:text-white"
                }`}
              >
                {id === "all" ? "All Networks" : id}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                    activeNetwork === id
                      ? "bg-white/20 text-white"
                      : "bg-[#0d2040] text-[#4a6080]"
                  }`}
                >
                  {countFor(id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Asset grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12"
          style={{
            opacity: transitioning ? 0 : 1,
            transition: "opacity 0.14s ease",
          }}
        >
          {filtered.map((a, i) => (
            <AssetCard
              key={`${activeNetwork}-${a.name}-${a.network}`}
              asset={a}
              index={i}
              visible={visible && !transitioning}
            />
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-[#061120] border border-[#0d2040] rounded-xl px-4 py-4 text-center"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  transitionDelay: `${320 + i * 80}ms`,
                }}
              >
                <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: `rgba(${s.rgb},0.85)` }} />
                <div className="text-lg font-bold text-white leading-none">{s.value}</div>
                <div className="text-[11px] text-[#6b88b0] mt-1">{s.label}</div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
