"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import VirtualCardFace, { getTheme } from "@/components/ui/VirtualCardFace";
import { formatCurrency, maskCardNumber } from "@/lib/utils";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  Plus, CreditCard, Eye, EyeOff, Snowflake, Trash2, AlertCircle, Link2, Link2Off, X,
  ArrowDownLeft, Wifi, WifiOff, Maximize2, ShoppingCart, CheckCircle2, ChevronRight,
  SlidersHorizontal, Globe, Truck, Timer, Flame,
} from "lucide-react";
import {
  Copy, Check, Pencil, History, Search, ChevronDown, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkedWallet { id: string; asset: string; network: string; balance: number }
interface LinkedFiatWallet { id: string; currency: string; name: string | null; balance: number }

interface VirtualCard {
  id: string; cardNumber: string; cvv: string; expiryMonth: number; expiryYear: number;
  cardHolder: string; brand: string; status: string; spendLimit: number; spentAmount: number;
  balance: number; nfcEnabled: boolean; currency: string; label: string; color: string;
  walletId: string | null; wallet: LinkedWallet | null; fiatWalletId: string | null;
  fiatWallet: LinkedFiatWallet | null; oneTimeUse: boolean; freezeUntil: string | null;
  createdAt: string;
}

interface Wallet { id: string; asset: string; network: string; balance: number }

interface CardTxn {
  id: string; merchant?: string | null; description?: string | null;
  amount: number; currency: string; type: string; createdAt: string; category?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const cardColors = [
  { label: "Navy",     value: "#6366f1", ...getTheme("#6366f1") },
  { label: "Cyan",     value: "#06b6d4", ...getTheme("#06b6d4") },
  { label: "Emerald",  value: "#10b981", ...getTheme("#10b981") },
  { label: "Rose",     value: "#f43f5e", ...getTheme("#f43f5e") },
  { label: "Violet",   value: "#8b5cf6", ...getTheme("#8b5cf6") },
  { label: "Gold",     value: "#f59e0b", ...getTheme("#f59e0b") },
  { label: "Crimson",  value: "#ef4444", ...getTheme("#ef4444") },
  { label: "Ocean",    value: "#1d4ed8", ...getTheme("#1d4ed8") },
  { label: "Midnight", value: "#334155", ...getTheme("#334155") },
  { label: "Teal",     value: "#0d9488", ...getTheme("#0d9488") },
  { label: "Orange",   value: "#ea580c", ...getTheme("#ea580c") },
  { label: "Fuchsia",  value: "#d946ef", ...getTheme("#d946ef") },
  { label: "Lime",     value: "#84cc16", ...getTheme("#84cc16") },
  { label: "Arctic",   value: "#0ea5e9", ...getTheme("#0ea5e9") },
];

const CATEGORIES = [
  "Shopping", "Food & Drink", "Travel", "Subscriptions",
  "Entertainment", "Health", "Education", "Utilities", "Other",
];

const NAME_SUGGESTIONS = ["Shopping", "Netflix", "Travel", "Subscriptions", "Work", "One-time"];
const LIMIT_PRESETS = [50, 100, 250, 500, 1000];

// ── Helper components ─────────────────────────────────────────────────────────

function FreezeCountdown({ freezeUntil }: { freezeUntil: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(freezeUntil).getTime() - Date.now();
      if (diff <= 0) { setRemaining("soon"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [freezeUntil]);
  return (
    <div className="flex items-center gap-2 bg-sky-500/5 border border-sky-500/20 rounded-lg px-3 py-2">
      <Timer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      <span className="text-xs text-sky-300">
        Auto-unfreezes in <span className="font-mono font-semibold">{remaining}</span>
      </span>
    </div>
  );
}

function SpendRing({ used, total, accent, isUnlimited }: { used: number; total: number; accent: string; isUnlimited: boolean }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const pct = isUnlimited ? 0 : Math.min(used / total, 1);
  const dash = pct * circ;
  const label = isUnlimited ? "∞" : `${Math.round(pct * 100)}%`;
  const col = isUnlimited ? "#6b88b0" : pct > 0.8 ? "#f43f5e" : pct > 0.5 ? "#f59e0b" : accent;
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 38 38">
        <circle cx="19" cy="19" r={r} fill="none" stroke="#0d2040" strokeWidth="4" />
        {!isUnlimited && pct > 0 && (
          <circle cx="19" cy="19" r={r} fill="none" stroke={col} strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: "8px", color: col, fontWeight: 700 }}>{label}</span>
      </div>
    </div>
  );
}

function AnimatedEmptyCard({ color = "#6366f1" }: { color?: string }) {
  return (
    <div className="relative mx-auto" style={{ width: "176px", height: "110px" }}>
      <div className="absolute inset-[-6px] rounded-2xl animate-ping opacity-[0.05]"
        style={{ backgroundColor: color, animationDuration: "2.4s" }} />
      <div className="absolute inset-0 rounded-xl border-2 animate-pulse"
        style={{ borderColor: color + "40", backgroundColor: color + "08" }} />
      <div className="absolute rounded animate-pulse"
        style={{ top: "16px", left: "14px", width: "26px", height: "18px", backgroundColor: color + "28", border: `1px solid ${color}35` }} />
      <div className="absolute space-y-1.5" style={{ bottom: "14px", left: "14px", right: "14px" }}>
        <div className="h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color + "28", width: "100%" }} />
        <div className="h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color + "18", width: "55%" }} />
      </div>
    </div>
  );
}

function NfcScreen({ onComplete, loading }: { onComplete: () => void; loading: boolean }) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    const t = setTimeout(() => onCompleteRef.current(), 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="py-10 px-5 flex flex-col items-center gap-6">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-[0.08]" style={{ animationDuration: "1.8s" }} />
        <span className="animate-ping absolute inline-flex h-4/5 w-4/5 rounded-full bg-emerald-400 opacity-[0.12]" style={{ animationDuration: "1.8s", animationDelay: "0.4s" }} />
        <span className="animate-ping absolute inline-flex h-3/5 w-3/5 rounded-full bg-emerald-400 opacity-[0.18]" style={{ animationDuration: "1.8s", animationDelay: "0.8s" }} />
        <div className="relative z-10 w-20 h-20 rounded-full bg-[#020c1b] border-2 border-emerald-400 flex items-center justify-center">
          <Wifi className="w-9 h-9 text-emerald-400 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-base">{loading ? "Processing..." : "Hold near terminal"}</p>
        <p className="text-[#6b88b0] text-sm mt-0.5">Contactless NFC payment</p>
      </div>
      <div className="flex gap-2">
        {[0, 0.3, 0.6].map((delay, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-emerald-400/70 animate-bounce" style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  );
}

function PayModal({ card, onClose, onSuccess }: { card: VirtualCard; onClose: () => void; onSuccess: () => void }) {
  const [method, setMethod] = useState<"chip" | "nfc">("chip");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [nfcTapping, setNfcTapping] = useState(false);
  const [revealDetails, setRevealDetails] = useState(false);
  const theme = getTheme(card.color);
  const effectiveBalance = card.fiatWallet ? card.fiatWallet.balance : card.balance;
  const effectiveCurrency = card.fiatWallet ? card.fiatWallet.currency : "USD";

  const handlePay = async (paymentMethod: string) => {
    const amt = parseFloat(amount);
    if (!merchant.trim()) { setError("Enter a merchant name"); return; }
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    setError(""); setLoading(true);
    const res = await fetch(`/api/cards/${card.id}/pay`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, merchant: merchant.trim(), category, paymentMethod }),
    });
    const data = await res.json();
    if (res.ok) { setSuccess(true); setTimeout(() => { onSuccess(); onClose(); }, 2500); }
    else { setError(data.error ?? "Payment failed"); setNfcTapping(false); }
    setLoading(false);
  };

  const handleNfcTap = () => {
    const amt = parseFloat(amount);
    if (!merchant.trim()) { setError("Enter a merchant name"); return; }
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    setError(""); setNfcTapping(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 relative overflow-hidden" style={{ background: theme.gradient }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Paying with</p>
              <p className="text-white text-sm font-semibold">{card.label}</p>
              <p className="font-mono text-white/70 text-xs mt-0.5">•••• •••• •••• {card.cardNumber.slice(-4)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">{card.fiatWallet ? "Wallet Balance" : "Balance"}</p>
              <p className="text-sm font-bold" style={{ color: theme.accent }}>
                {card.fiatWallet
                  ? `${effectiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${effectiveCurrency}`
                  : formatCurrency(effectiveBalance)}
              </p>
            </div>
          </div>
          {!success && !nfcTapping && (
            <button onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
          )}
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Payment Successful</p>
            <p className="text-xs text-[#6b88b0]">{formatCurrency(parseFloat(amount))} sent to {merchant}</p>
          </div>
        ) : nfcTapping ? (
          <NfcScreen onComplete={() => handlePay("nfc")} loading={loading} />
        ) : (
          <>
            <div className="flex border-b border-[#0d2040]">
              <button onClick={() => setMethod("chip")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${method === "chip" ? "text-white border-blue-500" : "text-[#6b88b0] border-transparent hover:text-white/70"}`}>
                <CreditCard className="w-3.5 h-3.5" /> Chip &amp; PIN
              </button>
              <button onClick={() => setMethod("nfc")} disabled={!card.nfcEnabled}
                title={!card.nfcEnabled ? "NFC is disabled on this card" : undefined}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 disabled:opacity-40 ${method === "nfc" ? "text-white border-emerald-500" : "text-[#6b88b0] border-transparent hover:text-white/70"}`}>
                <Wifi className="w-3.5 h-3.5" /> NFC Tap
              </button>
            </div>
            <div className="p-5 space-y-4">
              {method === "chip" && (
                <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-[#6b88b0] uppercase tracking-wider">Card Details</span>
                    <button onClick={() => setRevealDetails(!revealDetails)} className="text-[#6b88b0] hover:text-white transition-colors">
                      {revealDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6b88b0]">Number</span>
                      <span className="font-mono text-white tracking-widest text-[11px]">
                        {revealDetails ? card.cardNumber.replace(/(.{4})/g, "$1 ").trim() : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6b88b0]">Expiry</span>
                      <span className="text-white">{String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6b88b0]">CVV</span>
                      <span className="font-mono text-white">{revealDetails ? card.cvv : "•••"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6b88b0]">Network</span>
                      <span className="text-white font-medium">{card.brand}</span>
                    </div>
                  </div>
                </div>
              )}
              {method === "nfc" && (
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Wifi className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Contactless Payment</p>
                    <p className="text-[11px] text-[#6b88b0] mt-0.5">Tap card at any NFC-enabled terminal</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Merchant / Store</label>
                <input type="text" placeholder="e.g. Amazon, Netflix, Uber" value={merchant}
                  onChange={(e) => { setMerchant(e.target.value); setError(""); }} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#020c1b] border border-[#0d2040] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Amount ({effectiveCurrency})</label>
                <input type="number" min={0.01} step="0.01" placeholder="0.00" value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && (method === "chip" ? handlePay("chip") : handleNfcTap())} />
              </div>
              <div className="flex gap-2">
                {card.fiatWallet
                  ? [0.25, 0.5, 0.75, 1].map((pct) => {
                      const val = Math.floor(effectiveBalance * pct * 100) / 100;
                      return (
                        <button key={pct} onClick={() => setAmount(String(val))}
                          className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors">
                          {pct === 1 ? "Max" : `${pct * 100}%`}
                        </button>
                      );
                    })
                  : [5, 10, 25, 50].map((v) => (
                      <button key={v} onClick={() => setAmount(String(Math.min(v, effectiveBalance)))}
                        className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors">
                        ${v}
                      </button>
                    ))}
              </div>
              <div className="bg-[#020c1b] rounded-lg px-3 py-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b88b0]">Spend limit remaining</span>
                  <span className="text-white">{card.spendLimit === 0 ? "Unlimited" : formatCurrency(card.spendLimit - card.spentAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b88b0]">{card.fiatWallet ? "Wallet balance" : "Card balance"}</span>
                  <span className="text-white">
                    {card.fiatWallet
                      ? `${effectiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${effectiveCurrency}`
                      : formatCurrency(effectiveBalance)}
                  </span>
                </div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                {method === "chip" ? (
                  <Button className="flex-1" loading={loading} onClick={() => handlePay("chip")}
                    disabled={!merchant || !amount || parseFloat(amount) <= 0}>
                    <ShoppingCart className="w-4 h-4" /> Pay with {card.brand}
                  </Button>
                ) : (
                  <Button className="flex-1 !bg-emerald-700/30 !border-emerald-500/40 hover:!bg-emerald-700/50 !text-emerald-300"
                    loading={loading} onClick={handleNfcTap} disabled={!merchant || !amount || parseFloat(amount) <= 0}>
                    <Wifi className="w-4 h-4" /> Tap to Pay
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card3DViewer({ card, onClose }: { card: VirtualCard; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const animRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const animate = () => {
      const dx = targetRef.current.x - currentRef.current.x;
      const dy = targetRef.current.y - currentRef.current.y;
      currentRef.current = { x: currentRef.current.x + dx * 0.12, y: currentRef.current.y + dy * 0.12 };
      setRotate({ x: currentRef.current.x, y: currentRef.current.y });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    targetRef.current = { x: -dy * 22, y: dx * 22 };
    setShine({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-xs text-[#6b88b0] mb-6 tracking-wide">Move cursor over card to rotate</p>
        <div ref={cardRef} style={{ perspective: "900px", cursor: "grab" }}
          onMouseMove={handleMouseMove} onMouseLeave={() => { targetRef.current = { x: 0, y: 0 }; setShine({ x: 50, y: 50 }); }}>
          <div style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, transformStyle: "preserve-3d", position: "relative", filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.7))" }}>
            <VirtualCardFace color={card.color} label={card.label} cardHolder={card.cardHolder}
              cardNumber={card.cardNumber} expiryMonth={card.expiryMonth} expiryYear={card.expiryYear}
              cvv={card.cvv} status={card.status} brand={card.brand} nfcEnabled={card.nfcEnabled} revealed />
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)` }} />
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }} />
          </div>
        </div>
        <div className="mt-6 bg-[#061120]/80 border border-[#0d2040] rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#6b88b0]">Card number</span>
            <span className="font-mono text-white tracking-widest">{card.cardNumber.replace(/(.{4})/g, "$1 ").trim()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#6b88b0]">CVV</span>
            <span className="font-mono text-white">{card.cvv}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#6b88b0]">Expires</span>
            <span className="text-white">{String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#6b88b0]">Balance</span>
            <span className="text-white font-medium">{formatCurrency(card.balance)}</span>
          </div>
        </div>
        <button onClick={onClose}
          className="mt-4 w-full py-2.5 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-[#1a3a6b] rounded-xl transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [revealedCard, setRevealedCard] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [linkModal, setLinkModal] = useState<VirtualCard | null>(null);
  const [linkingWalletId, setLinkingWalletId] = useState<string | null>(null);
  const [fundModal, setFundModal] = useState<VirtualCard | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState("");
  const [card3dView, setCard3dView] = useState<VirtualCard | null>(null);
  const [payModal, setPayModal] = useState<VirtualCard | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<VirtualCard | null>(null);
  const [limitModal, setLimitModal] = useState<VirtualCard | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState("");
  const [freezeModal, setFreezeModal] = useState<VirtualCard | null>(null);
  const [freezeDuration, setFreezeDuration] = useState("1h");
  const [freezeLoading, setFreezeLoading] = useState(false);

  // New state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "FROZEN">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az">("newest");
  const [renamingCard, setRenamingCard] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [cardHistories, setCardHistories] = useState<Record<string, CardTxn[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [newCard, setNewCard] = useState({ label: "", spendLimit: 250, color: "#6366f1", currency: "USD", brand: "VISA", oneTimeUse: false });
  const [previewExpiry] = useState(() => { const d = new Date(); return { month: d.getMonth() + 1, year: d.getFullYear() + 3 }; });

  const fetchCards = useCallback(async () => {
    const res = await fetch("/api/cards");
    if (res.ok) { const data = await res.json(); setCards(data.cards); }
    setLoading(false);
  }, []);

  const fetchWallets = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.ok) { const data = await res.json(); if (data.wallets) setWallets(data.wallets); }
  }, []);

  useEffect(() => {
    fetchCards(); fetchWallets();
    fetch("/api/user").then((r) => r.json()).then((d) => setKycVerified(d.user?.kycStatus === "VERIFIED"));
  }, [fetchCards, fetchWallets]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRename = async (cardId: string) => {
    if (!renameValue.trim()) return;
    setRenameLoading(true);
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: renameValue.trim() }),
    });
    await fetchCards();
    setRenamingCard(null); setRenameValue(""); setRenameLoading(false);
  };

  const fetchCardHistory = async (cardId: string) => {
    if (expandedHistory === cardId) { setExpandedHistory(null); return; }
    if (cardHistories[cardId] !== undefined) { setExpandedHistory(cardId); return; }
    setHistoryLoading(cardId);
    try {
      const res = await fetch(`/api/cards/${cardId}/transactions?page=1`);
      if (res.ok) { const data = await res.json(); setCardHistories(prev => ({ ...prev, [cardId]: data.transactions ?? [] })); }
      else { setCardHistories(prev => ({ ...prev, [cardId]: [] })); }
    } catch { setCardHistories(prev => ({ ...prev, [cardId]: [] })); }
    setExpandedHistory(cardId); setHistoryLoading(null);
  };

  const handleCreate = async () => {
    setActionLoading("create");
    const res = await fetch("/api/cards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCard),
    });
    if (res.ok) {
      const { card: created } = await res.json();
      if (newCard.oneTimeUse && created?.id) {
        await fetch(`/api/cards/${created.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oneTimeUse: true }) });
      }
      await fetchCards(); setShowModal(false);
      setNewCard({ label: "", spendLimit: 250, color: "#6366f1", currency: "USD", brand: "VISA", oneTimeUse: false });
    }
    setActionLoading(null);
  };

  const handleFreeze = async (id: string, status: string) => {
    setActionLoading(id);
    await fetch(`/api/cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: status === "ACTIVE" ? "FROZEN" : "ACTIVE" }) });
    await fetchCards(); setActionLoading(null);
  };

  const handleTerminate = async (id: string) => {
    setActionLoading(id);
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    const data = await res.json();
    setActionLoading(null); setDeleteConfirm(null);
    if (!res.ok) { alert(data.error ?? "Failed to delete card. Please try again."); return; }
    await fetchCards();
    if (data.refunded > 0) alert(`Card deleted. $${data.refunded.toFixed(2)} has been refunded to your wallet.`);
  };

  const handleLinkWallet = async (cardId: string, walletId: string | null) => {
    setLinkingWalletId(walletId ?? "disconnect");
    await fetch(`/api/cards/${cardId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletId }) });
    await fetchCards(); setLinkModal(null); setLinkingWalletId(null);
  };

  const handleToggleNfc = async (id: string, current: boolean) => {
    setActionLoading(id + "-nfc");
    await fetch(`/api/cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nfcEnabled: !current }) });
    await fetchCards(); setActionLoading(null);
  };

  const handleUpdateLimit = async () => {
    if (!limitModal) return;
    const val = parseFloat(newLimit);
    if (isNaN(val) || val < 0) { setLimitError("Enter a valid limit"); return; }
    setLimitError(""); setLimitLoading(true);
    await fetch(`/api/cards/${limitModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spendLimit: val }) });
    await fetchCards(); setLimitModal(null); setNewLimit(""); setLimitLoading(false);
  };

  const handleTimedFreeze = async () => {
    if (!freezeModal) return;
    setFreezeLoading(true);
    const durations: Record<string, number> = { "30m": 30, "1h": 60, "2h": 120, "6h": 360, "12h": 720, "24h": 1440, "48h": 2880, "7d": 10080 };
    const mins = durations[freezeDuration] ?? 60;
    const freezeUntil = new Date(Date.now() + mins * 60000).toISOString();
    await fetch(`/api/cards/${freezeModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "FROZEN", freezeUntil }) });
    await fetchCards(); setFreezeModal(null); setFreezeLoading(false);
  };

  const handleFund = async () => {
    if (!fundModal) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) { setFundError("Enter a valid amount"); return; }
    setFundError(""); setFundLoading(true);
    const res = await fetch(`/api/cards/${fundModal.id}/fund`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }),
    });
    if (res.ok) { await Promise.all([fetchCards(), fetchWallets()]); setFundModal(null); setFundAmount(""); }
    else { const data = await res.json(); setFundError(data.error ?? "Failed to fund card"); }
    setFundLoading(false);
  };

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const filterCards = (arr: VirtualCard[]) =>
    arr
      .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === "all" || c.status === statusFilter))
      .sort((a, b) => {
        if (sortOrder === "az") return a.label.localeCompare(b.label);
        if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

  const fiatCards = filterCards(cards.filter(c => c.fiatWalletId !== null));
  const cryptoCards = filterCards(cards.filter(c => c.fiatWalletId === null));

  // ── renderCard ────────────────────────────────────────────────────────────

  const renderCard = (card: VirtualCard) => {
    const revealed = revealedCard === card.id;
    const frozen = card.status === "FROZEN";
    const isUnlimited = card.spendLimit === 0;
    const usedPercent = !isUnlimited && card.spendLimit > 0 ? (card.spentAmount / card.spendLimit) * 100 : 0;
    const style = getTheme(card.color);
    const hasLinkedWallet = !!(card.wallet || card.fiatWallet);

    // Expiry check
    const now = new Date();
    const expiryEnd = new Date(card.expiryYear, card.expiryMonth, 0);
    const daysToExpiry = Math.floor((expiryEnd.getTime() - now.getTime()) / 86400000);
    const expiringSOon = daysToExpiry >= 0 && daysToExpiry <= 30;

    // Balance health color
    const healthColor = usedPercent > 80 ? "#f43f5e" : usedPercent > 50 ? "#f59e0b" : "#10b981";
    const healthLabel = usedPercent > 80 ? "Running low" : usedPercent > 50 ? "Moderate spend" : "Budget healthy";

    return (
      <div key={card.id} className="group space-y-3 hover:-translate-y-0.5 transition-transform duration-200">

        {/* Label row + rename */}
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {renamingCard === card.id ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="text" value={renameValue} autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(card.id); if (e.key === "Escape") setRenamingCard(null); }}
                  className="text-sm font-medium text-white bg-[#0d2040] border border-blue-500/50 rounded-lg px-2 py-1 flex-1 min-w-0 focus:outline-none"
                />
                <button onClick={() => handleRename(card.id)} disabled={renameLoading} title="Save" className="text-emerald-400 hover:text-emerald-300 p-0.5">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setRenamingCard(null)} title="Cancel" className="text-[#6b88b0] hover:text-white p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-white truncate">{card.label}</span>
                {card.oneTimeUse && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 shrink-0">1×</span>
                )}
                <button
                  onClick={() => { setRenamingCard(card.id); setRenameValue(card.label); }}
                  title="Rename card"
                  className="text-[#4a6080] hover:text-[#6b88b0] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
          <span className="text-xs text-[#6b88b0] shrink-0">{isUnlimited ? "No Limit" : `${formatCurrency(card.spendLimit)} limit`}</span>
        </div>

        {/* Card face */}
        <div
          className="relative cursor-pointer"
          onClick={() => setCard3dView(card)}
          title="Click to view in 3D"
          style={{ filter: card.status === "TERMINATED" ? "grayscale(1) opacity(0.55)" : card.status === "FROZEN" ? "grayscale(0.6) brightness(0.85)" : undefined }}
        >
          <VirtualCardFace
            color={card.color} label={card.label} cardHolder={card.cardHolder}
            cardNumber={card.cardNumber} expiryMonth={card.expiryMonth} expiryYear={card.expiryYear}
            cvv={card.cvv} status={card.status} brand={card.brand} nfcEnabled={card.nfcEnabled}
            revealed={revealed} maskNumber={maskCardNumber}
          />
          {(card.status === "FROZEN" || card.status === "TERMINATED") && (
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none">
              <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border backdrop-blur-sm ${card.status === "FROZEN" ? "bg-sky-900/70 text-sky-200 border-sky-400/40" : "bg-neutral-900/70 text-neutral-300 border-neutral-500/40"}`}>
                {card.status}
              </span>
            </div>
          )}
          {expiringSOon && (
            <div className="absolute top-2 left-2 pointer-events-none">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/80 text-amber-100 backdrop-blur-sm">
                Expires in {daysToExpiry}d
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
              <span className="text-xs text-white font-medium">View in 3D</span>
            </div>
          </div>
        </div>

        {/* Revealed details panel with copy */}
        {revealed && (
          <div className="bg-[#020c1b] border border-blue-500/20 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b88b0]">Number</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-white tracking-widest text-[11px]">{card.cardNumber.replace(/(.{4})/g, "$1 ").trim()}</span>
                <button onClick={() => handleCopy(card.cardNumber, `num-${card.id}`)} title="Copy number" className="text-[#6b88b0] hover:text-blue-400 transition-colors">
                  {copied === `num-${card.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6b88b0]">Expiry</span>
              <span className="text-white">{String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b88b0]">CVV</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-white">{card.cvv}</span>
                <button onClick={() => handleCopy(card.cvv, `cvv-${card.id}`)} title="Copy CVV" className="text-[#6b88b0] hover:text-blue-400 transition-colors">
                  {copied === `cvv-${card.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="border-t border-[#0d2040] pt-1.5">
              <button
                onClick={() => handleCopy(`${card.cardNumber.replace(/(.{4})/g, "$1 ").trim()} | ${String(card.expiryMonth).padStart(2, "0")}/${card.expiryYear} | ${card.cvv}`, `all-${card.id}`)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 rounded-lg transition-colors"
              >
                {copied === `all-${card.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied === `all-${card.id}` ? "Copied!" : "Copy all details"}
              </button>
            </div>
          </div>
        )}

        {/* Balance + spend ring */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-3">
          <div className="flex items-center gap-3">
            <SpendRing used={card.spentAmount} total={card.spendLimit} accent={style.accent} isUnlimited={isUnlimited} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#6b88b0]">{card.fiatWallet ? "Wallet Balance" : "Card Balance"}</span>
                {card.fiatWallet ? (
                  <span className="font-semibold" style={{ color: style.accent }}>
                    {card.fiatWallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {card.fiatWallet.currency}
                  </span>
                ) : (
                  <span className="font-semibold" style={{ color: style.accent }}>{formatCurrency(card.balance)}</span>
                )}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6b88b0]">Spent</span>
                <span className="text-white">{formatCurrency(card.spentAmount)}{isUnlimited ? "" : ` / ${formatCurrency(card.spendLimit)}`}</span>
              </div>
              {!isUnlimited && card.spendLimit > 0 && (
                <div className="text-[10px] mt-1 font-medium" style={{ color: healthColor }}>{healthLabel}</div>
              )}
            </div>
          </div>
        </div>

        {/* Freeze countdown */}
        {frozen && card.freezeUntil && new Date(card.freezeUntil) > new Date() && (
          <FreezeCountdown freezeUntil={card.freezeUntil} />
        )}
        {frozen && card.freezeUntil && new Date(card.freezeUntil) <= new Date() && (
          <div className="flex items-center gap-2 bg-sky-500/5 border border-sky-500/20 rounded-lg px-3 py-2">
            <Timer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-xs text-sky-300">Auto-unfreezes soon</span>
          </div>
        )}

        {/* Linked wallet badge */}
        {card.fiatWallet ? (
          <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium">{card.fiatWallet.currency}</span>
              <span className="text-xs text-[#6b88b0]">· {card.fiatWallet.name ?? "Multi-Currency Wallet"}</span>
            </div>
            <span className="text-xs text-[#6b88b0]">{card.fiatWallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {card.fiatWallet.currency}</span>
          </div>
        ) : card.wallet ? (
          <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">{card.wallet.asset}</span>
              <span className="text-xs text-[#6b88b0]">· {card.wallet.network}</span>
            </div>
            <span className="text-xs text-[#6b88b0]">{formatCurrency(card.wallet.balance)} available</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#020c1b] border border-dashed border-[#0d2040] rounded-lg px-3 py-2">
            <Link2Off className="w-3 h-3 text-[#6b88b0]" />
            <span className="text-xs text-[#6b88b0]">No wallet linked — link one to fund this card</span>
          </div>
        )}

        {/* Actions row 1 */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => setRevealedCard(revealed ? null : card.id)} title={revealed ? "Hide card details" : "Reveal card number & CVV"}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-blue-300 hover:text-white bg-[#061120] border border-blue-500/20 rounded-lg hover:border-blue-500/50 transition-colors">
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button onClick={() => !card.fiatWalletId && setLinkModal(card)} disabled={!!card.fiatWalletId}
            title={card.fiatWalletId ? "Managed by multi-currency wallet" : card.wallet ? "Relink to a different wallet" : "Link a stablecoin wallet"}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-violet-300 hover:text-violet-100 bg-[#061120] border border-violet-500/20 rounded-lg hover:border-violet-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Link2 className="w-4 h-4" />
            {card.fiatWalletId ? "Linked" : card.wallet ? "Relink" : "Link"}
          </button>
          {card.fiatWalletId ? (
            <button onClick={() => router.push(`/dashboard/cards/physical?card=${card.id}&wallet=${card.fiatWalletId}`)}
              title="Order a physical version of this Digital Currency Card"
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-cyan-300 hover:text-cyan-100 bg-[#061120] border border-cyan-500/20 rounded-lg hover:border-cyan-500/50 transition-colors">
              <Truck className="w-4 h-4" /> Physical
            </button>
          ) : (
            <button onClick={() => { setFundModal(card); setFundAmount(""); setFundError(""); }}
              disabled={!hasLinkedWallet} title={!hasLinkedWallet ? "Link a wallet first to fund" : "Transfer funds from wallet to card"}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-amber-300 hover:text-amber-100 bg-[#061120] border border-amber-500/20 rounded-lg hover:border-amber-500/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              <ArrowDownLeft className="w-4 h-4" /> Fund
            </button>
          )}
          <button onClick={() => setPayModal(card)} disabled={card.status !== "ACTIVE" || (card.fiatWallet ? card.fiatWallet.balance <= 0 : card.balance <= 0)}
            title={card.status !== "ACTIVE" ? "Card must be active to pay" : "Make a payment with this card"}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-emerald-300 hover:text-emerald-100 bg-[#061120] border border-emerald-500/20 rounded-lg hover:border-emerald-500/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
            <ShoppingCart className="w-4 h-4" /> Pay
          </button>
        </div>

        {/* Actions row 2 */}
        <div className={`grid gap-2 ${!card.fiatWalletId ? "grid-cols-5" : "grid-cols-4"}`}>
          <button onClick={() => handleToggleNfc(card.id, card.nfcEnabled)} disabled={actionLoading === card.id + "-nfc"}
            title={card.nfcEnabled ? "Disable NFC contactless payments" : "Enable NFC contactless payments"}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium bg-[#061120] border rounded-lg transition-colors disabled:opacity-50 ${card.nfcEnabled ? "text-emerald-300 border-emerald-500/20 hover:text-red-300 hover:border-red-500/50" : "text-slate-300 border-slate-500/20 hover:text-emerald-300 hover:border-emerald-500/50"}`}>
            {card.nfcEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            NFC
          </button>
          {frozen ? (
            <button onClick={() => handleFreeze(card.id, card.status)} disabled={actionLoading === card.id}
              title="Unfreeze this card to resume payments"
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-sky-300 hover:text-sky-100 bg-[#061120] border border-sky-500/20 rounded-lg hover:border-sky-500/50 transition-colors disabled:opacity-50">
              <Snowflake className="w-4 h-4" /> Unfreeze
            </button>
          ) : (
            <button onClick={() => { setFreezeModal(card); setFreezeDuration("1h"); }}
              title="Temporarily freeze this card"
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-sky-300 hover:text-sky-100 bg-[#061120] border border-sky-500/20 rounded-lg hover:border-sky-500/50 transition-colors">
              <Snowflake className="w-4 h-4" /> Freeze
            </button>
          )}
          <button onClick={() => { setLimitModal(card); setNewLimit(card.spendLimit === 0 ? "0" : String(card.spendLimit)); setLimitError(""); }}
            title="Edit monthly spend limit"
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-[#061120] border border-slate-500/20 rounded-lg hover:border-slate-500/50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Limit
          </button>
          {!card.fiatWalletId && (
            <button onClick={() => router.push(`/dashboard/cards/physical?card=${card.id}${card.walletId ? "" : ""}`)}
              title="Order a physical version of this Digital Currency Card"
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-cyan-300 hover:text-cyan-100 bg-[#061120] border border-cyan-500/20 rounded-lg hover:border-cyan-500/50 transition-colors">
              <Truck className="w-4 h-4" /> Physical
            </button>
          )}
          <button onClick={() => setDeleteConfirm(card)} disabled={actionLoading === card.id}
            title="Permanently delete this card"
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-red-400 hover:text-red-200 bg-[#061120] border border-red-500/20 rounded-lg hover:border-red-500/50 transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        {/* Recent activity (collapsible) */}
        <div className="border border-[#0d2040] rounded-xl overflow-hidden">
          <button onClick={() => fetchCardHistory(card.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-[#6b88b0] hover:text-white hover:bg-[#0d2040]/40 transition-colors">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Recent activity</span>
              {cardHistories[card.id]?.length > 0 && (
                <span className="text-[10px] bg-[#0d2040] px-1.5 py-0.5 rounded-full">{cardHistories[card.id].length}</span>
              )}
            </div>
            {historyLoading === card.id
              ? <div className="w-3 h-3 border border-[#6b88b0] border-t-transparent rounded-full animate-spin" />
              : <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedHistory === card.id ? "rotate-180" : ""}`} />
            }
          </button>
          {expandedHistory === card.id && (
            <div className="border-t border-[#0d2040]">
              {!cardHistories[card.id] || cardHistories[card.id].length === 0 ? (
                <div className="text-center py-4 text-xs text-[#6b88b0]">No transactions yet</div>
              ) : (
                <>
                  {cardHistories[card.id].slice(0, 3).map((t) => {
                    const isCredit = t.type === "DEPOSIT";
                    return (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2.5 border-b border-[#0d2040] last:border-0 hover:bg-[#0d2040]/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            {isCredit ? <ArrowDownRight className="w-3 h-3 text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-red-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">{t.merchant || t.description || t.type}</div>
                            <div className="text-[10px] text-[#6b88b0]">{new Date(t.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className={`text-xs font-semibold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                          {isCredit ? "+" : "-"}{formatCurrency(t.amount)}
                        </div>
                      </div>
                    );
                  })}
                  <Link href="/dashboard/transactions"
                    className="block text-center py-2 text-[10px] text-blue-400 hover:text-blue-300 border-t border-[#0d2040] transition-colors">
                    View all transactions →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Virtual Cards" userName={undefined} />

      <main className="flex-1 p-6">

        {/* Stats strip */}
        {!loading && (
          <div className="flex items-center gap-2.5 flex-wrap mb-5">
            <span className="text-sm text-[#6b88b0]">{cards.length} card{cards.length !== 1 ? "s" : ""}</span>
            {cards.filter(c => c.status === "ACTIVE").length > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {cards.filter(c => c.status === "ACTIVE").length} Active
              </span>
            )}
            {cards.filter(c => c.status === "FROZEN").length > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Snowflake className="w-3 h-3" />
                {cards.filter(c => c.status === "FROZEN").length} Frozen
              </span>
            )}
            {cards.filter(c => c.oneTimeUse).length > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Flame className="w-3 h-3" />
                {cards.filter(c => c.oneTimeUse).length} One-time
              </span>
            )}
            {cards.filter(c => c.fiatWalletId !== null).length > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Globe className="w-3 h-3" />
                {cards.filter(c => c.fiatWalletId !== null).length} Multi-currency
              </span>
            )}
          </div>
        )}

        {/* KYC warning */}
        {!kycVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              Complete <a href="/dashboard/kyc" className="underline font-medium">KYC verification</a> to issue virtual cards.
            </p>
          </div>
        )}

        {/* Search + filter + sort bar */}
        {!loading && cards.length > 0 && (
          <div className="flex items-center gap-2.5 mb-6 flex-wrap">
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080] pointer-events-none" />
              <input
                type="text" placeholder="Search cards…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#061120] border border-[#0d2040] rounded-lg text-sm text-white placeholder:text-[#4a6080] focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "ACTIVE", "FROZEN"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === f ? "bg-blue-600/20 text-blue-300 border-blue-500/40" : "text-[#6b88b0] border-[#0d2040] hover:text-white hover:border-[#1a3a60]"}`}>
                  {f === "all" ? "All" : f === "ACTIVE" ? "Active" : "Frozen"}
                </button>
              ))}
            </div>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="bg-[#061120] border border-[#0d2040] text-xs text-[#6b88b0] rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500/50">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A → Z</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-[#061120] border border-[#0d2040] animate-pulse" style={{ aspectRatio: "1.586/1" }} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── Digital Currency Cards ─────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Digital Currency Cards</h2>
                  <span className="bg-violet-500/10 text-violet-400 text-xs px-2 py-0.5 rounded-full border border-violet-500/20 font-medium">{cryptoCards.length}</span>
                </div>
                <Button onClick={() => setShowModal(true)} disabled={!kycVerified} title={!kycVerified ? "Complete KYC to issue cards" : undefined}>
                  <Plus className="w-4 h-4" /> Issue New Card
                </Button>
              </div>

              {cryptoCards.length === 0 ? (
                <div className="bg-[#061120] border border-dashed border-[#0d2040] rounded-xl p-10 flex flex-col items-center gap-4 text-center">
                  <AnimatedEmptyCard color="#8b5cf6" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">No digital currency cards yet</p>
                    <p className="text-xs text-[#4a6080]">Issue a card to start spending from your crypto wallets</p>
                  </div>
                  {kycVerified && (
                    <Button onClick={() => setShowModal(true)}>
                      <Plus className="w-4 h-4" /> Issue First Card
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cryptoCards.map(renderCard)}
                </div>
              )}
            </div>

            <div className="border-t border-[#0d2040]" />

            {/* ── Multi-Currency Cards ───────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Multi-Currency Cards</h2>
                  <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/20 font-medium">{fiatCards.length}</span>
                </div>
                <Link href="/dashboard/multi-wallet" className="text-xs text-[#6b88b0] hover:text-blue-300 flex items-center gap-1 transition-colors">
                  Manage wallets <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {fiatCards.length === 0 ? (
                <div className="bg-[#061120] border border-dashed border-[#0d2040] rounded-xl p-10 flex flex-col items-center gap-4 text-center">
                  <AnimatedEmptyCard color="#1d4ed8" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">No multi-currency cards yet</p>
                    <p className="text-xs text-[#4a6080] max-w-xs">
                      Open any wallet on the Multi-Currency Wallets page and tap <strong className="text-[#6b88b0]">Create Virtual Card</strong>
                    </p>
                  </div>
                  <Link href="/dashboard/multi-wallet">
                    <button className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 px-4 py-2 rounded-lg transition-colors">
                      Go to Multi-Currency Wallets
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {fiatCards.map(renderCard)}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Physical card banner — upgraded */}
        <div className="mt-10">
          <div className="group bg-[#061120] border border-[#0d2040] hover:border-[#c9943a]/30 rounded-xl overflow-hidden transition-all duration-200">
            <div className="flex flex-col sm:flex-row">
              {/* Text side */}
              <div className="flex-1 px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg,#0a0c10 0%,#1a2230 100%)", border: "1px solid rgba(201,148,58,0.2)" }}>
                    <CreditCard className="w-4 h-4" style={{ color: "#c9943a" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Get a Physical Volt Card</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,148,58,0.12)", color: "#c9943a", border: "1px solid rgba(201,148,58,0.25)" }}>PREMIUM</span>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {["Premium matte metal finish card", "Visa accepted at 150+ countries", "Free express shipping to your door", "Tap to pay with NFC contactless"].map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs text-[#6b88b0]">
                      <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#c9943a" }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/cards/physical"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border transition-all duration-200 hover:brightness-110"
                  style={{ borderColor: "rgba(201,148,58,0.35)", color: "#c9943a", backgroundColor: "rgba(201,148,58,0.08)" }}>
                  Order Now <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {/* Card mock side */}
              <div className="sm:w-48 bg-gradient-to-br from-[#0a0c10] to-[#1a2230] flex items-center justify-center p-6 border-t sm:border-t-0 sm:border-l border-[#0d2040]">
                <div className="w-32 h-20 rounded-xl relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", border: "1px solid rgba(201,148,58,0.3)", boxShadow: "0 8px 24px rgba(0,0,0,0.5),0 0 0 1px rgba(201,148,58,0.08)" }}>
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#c9943a,transparent)" }} />
                  <div className="absolute top-3 left-3 w-6 h-4 rounded" style={{ background: "linear-gradient(135deg,#c9943a 0%,#f0b429 100%)", opacity: 0.9 }} />
                  <div className="absolute bottom-2.5 right-3 text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>VOLT</div>
                  <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "8px 8px" }} />
                  <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg,rgba(201,148,58,0.06) 0%,transparent 60%)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Issue card modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#0d2040] shrink-0">
              <h2 className="text-lg font-semibold text-white">Issue New Digital Currency Card</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Live preview — top so it's always visible first */}
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Preview</label>
                <VirtualCardFace color={newCard.color} label={newCard.label || "Digital Card"} cardHolder="CARD HOLDER"
                  cardNumber="0000000000000000" expiryMonth={previewExpiry.month} expiryYear={previewExpiry.year}
                  status="ACTIVE" brand={newCard.brand} nfcEnabled />
              </div>

              <div className="border-t border-[#0d2040]" />

              {/* Label + suggestions */}
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Card Label</label>
                <input type="text" placeholder="e.g. Shopping, Subscriptions" value={newCard.label}
                  onChange={(e) => setNewCard({ ...newCard, label: e.target.value })} />
                {!newCard.label && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {NAME_SUGGESTIONS.map(name => (
                      <button key={name} onClick={() => setNewCard({ ...newCard, label: name })}
                        className="text-xs px-2.5 py-1 rounded-full bg-[#0d2040] text-[#6b88b0] hover:text-white hover:bg-[#1a3a60] border border-[#0d2040] hover:border-blue-500/30 transition-colors">
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Spend limit + presets */}
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Spend Limit (USD)</label>
                <input type="number" min={10} max={10000} value={newCard.spendLimit}
                  onChange={(e) => setNewCard({ ...newCard, spendLimit: Number(e.target.value) })} />
                <div className="flex gap-1.5 mt-2">
                  {LIMIT_PRESETS.map(v => (
                    <button key={v} onClick={() => setNewCard({ ...newCard, spendLimit: v })}
                      className={`flex-1 py-1 text-xs rounded-lg border transition-colors ${newCard.spendLimit === v ? "bg-blue-600/20 text-blue-300 border-blue-500/40" : "text-[#6b88b0] border-[#0d2040] hover:text-white hover:border-blue-500/30"}`}>
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Card Theme</label>
                <div className="flex flex-wrap gap-2">
                  {cardColors.map((c) => (
                    <button key={c.value} onClick={() => setNewCard({ ...newCard, color: c.value })} title={c.label}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{ background: c.gradient, outline: newCard.color === c.value ? `2px solid ${c.accent}` : "none", outlineOffset: "2px" }} />
                  ))}
                </div>
              </div>

              {/* Network */}
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Card Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["VISA", "MASTERCARD"] as const).map((b) => (
                    <button key={b} onClick={() => setNewCard({ ...newCard, brand: b })}
                      className={`py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 ${newCard.brand === b ? "border-blue-500/50 bg-blue-500/10 text-white" : "border-[#0d2040] text-[#6b88b0] hover:border-blue-500/30"}`}>
                      {b === "VISA" ? <span className="italic font-light tracking-widest">VISA</span> : (
                        <><div className="flex items-center"><div className="w-3.5 h-3.5 rounded-full bg-red-500/80" /><div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80 -ml-2" /></div><span>Mastercard</span></>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* One-time use */}
              <button type="button" onClick={() => setNewCard({ ...newCard, oneTimeUse: !newCard.oneTimeUse })}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${newCard.oneTimeUse ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-[#0d2040] text-[#6b88b0] hover:border-violet-500/30 hover:text-violet-400"}`}>
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5" />
                  <div className="text-left">
                    <div>One-time use</div>
                    <div className="text-[10px] font-normal opacity-70 mt-0.5">Auto-terminates after first payment</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${newCard.oneTimeUse ? "border-violet-400 bg-violet-400" : "border-[#3a5a80]"}`}>
                  {newCard.oneTimeUse && <div className="w-1.5 h-1.5 rounded-full bg-[#061120]" />}
                </div>
              </button>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[#0d2040] shrink-0">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={actionLoading === "create"} onClick={handleCreate} disabled={!newCard.label}>
                {newCard.oneTimeUse ? "Issue One-Time Card" : "Issue Card"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link wallet modal ─────────────────────────────────────────────── */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <div><h2 className="text-base font-semibold text-white">Link Wallet</h2><p className="text-xs text-[#6b88b0] mt-0.5">{linkModal.label}</p></div>
              <button onClick={() => setLinkModal(null)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-[#6b88b0]">Select a wallet to link to this card. You can then transfer funds from that wallet to the card.</p>
              {wallets.length === 0 ? (
                <p className="text-sm text-[#6b88b0] text-center py-4">No wallets available.</p>
              ) : (
                <div className="space-y-2">
                  {wallets.map((w) => {
                    const isLinked = linkModal.walletId === w.id;
                    return (
                      <button key={w.id} onClick={() => handleLinkWallet(linkModal.id, isLinked ? null : w.id)} disabled={linkingWalletId !== null}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all disabled:opacity-60 ${isLinked ? "border-emerald-500/50 bg-emerald-500/10" : "border-[#0d2040] hover:border-blue-500/40 hover:bg-blue-500/5"}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0d2040] flex items-center justify-center text-white text-xs font-bold">{w.asset[0]}</div>
                          <div><div className="text-sm font-medium text-white">{w.asset}</div><div className="text-xs text-[#6b88b0]">{w.network}</div></div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white font-medium">{formatCurrency(w.balance)}</div>
                          {isLinked && <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 justify-end"><Link2Off className="w-2.5 h-2.5" /> Tap to unlink</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3D viewer ─────────────────────────────────────────────────────── */}
      {card3dView && <Card3DViewer card={card3dView} onClose={() => setCard3dView(null)} />}

      {/* ── Pay modal ─────────────────────────────────────────────────────── */}
      {payModal && <PayModal card={payModal} onClose={() => setPayModal(null)} onSuccess={() => { fetchCards(); fetchWallets(); }} />}

      {/* ── Fund modal ────────────────────────────────────────────────────── */}
      {fundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <div><h2 className="text-base font-semibold text-white">Fund Card</h2><p className="text-xs text-[#6b88b0] mt-0.5">{fundModal.label}</p></div>
              <button onClick={() => setFundModal(null)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {fundModal.fiatWallet && (
                <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold">{fundModal.fiatWallet.currency.slice(0, 2)}</div>
                    <div><div className="text-xs font-medium text-white">{fundModal.fiatWallet.currency}</div><div className="text-[10px] text-[#6b88b0]">{fundModal.fiatWallet.name ?? "Multi-Currency Wallet"}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#6b88b0]">Available</div>
                    <div className="text-sm font-semibold text-white">{fundModal.fiatWallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fundModal.fiatWallet.currency}</div>
                  </div>
                </div>
              )}
              {!fundModal.fiatWallet && fundModal.wallet && (
                <div className="flex items-center justify-between bg-[#0d2040]/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0d2040] flex items-center justify-center text-white text-xs font-bold">{fundModal.wallet.asset[0]}</div>
                    <div><div className="text-xs font-medium text-white">{fundModal.wallet.asset}</div><div className="text-[10px] text-[#6b88b0]">{fundModal.wallet.network}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#6b88b0]">Available</div>
                    <div className="text-sm font-semibold text-white">{formatCurrency(fundModal.wallet.balance)}</div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({fundModal.fiatWallet ? fundModal.currency : "USD"})</label>
                <input type="number" min={0.01} step="0.01" placeholder="0.00" value={fundAmount}
                  onChange={(e) => { setFundAmount(e.target.value); setFundError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleFund()} autoFocus />
              </div>
              {fundModal.fiatWallet ? (
                <div className="flex gap-2">
                  {[0.25, 0.5, 0.75, 1].map((pct) => {
                    const val = Math.floor(fundModal.fiatWallet!.balance * pct * 100) / 100;
                    return <button key={pct} onClick={() => setFundAmount(String(val))}
                      className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors">
                      {pct === 1 ? "Max" : `${pct * 100}%`}
                    </button>;
                  })}
                </div>
              ) : fundModal.wallet ? (
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((v) => (
                    <button key={v} onClick={() => setFundAmount(String(Math.min(v, fundModal.wallet!.balance)))}
                      className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors">${v}</button>
                  ))}
                </div>
              ) : null}
              {fundError && <p className="text-xs text-red-400">{fundError}</p>}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setFundModal(null)}>Cancel</Button>
                <Button className="flex-1" loading={fundLoading} onClick={handleFund} disabled={!fundAmount || parseFloat(fundAmount) <= 0}>
                  <ArrowDownLeft className="w-4 h-4" /> Fund Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit spend limit modal ───────────────────────────────────────── */}
      {limitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <div><h2 className="text-base font-semibold text-white">Edit Spend Limit</h2><p className="text-xs text-[#6b88b0] mt-0.5">{limitModal.label}</p></div>
              <button onClick={() => setLimitModal(null)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6b88b0] bg-[#020c1b] border border-[#0d2040] rounded-lg px-3 py-2">
                <span>Currently spent</span>
                <span className="text-white font-medium">{formatCurrency(limitModal.spentAmount)}{limitModal.spendLimit === 0 ? " · No limit set" : ` / ${formatCurrency(limitModal.spendLimit)}`}</span>
              </div>
              <button onClick={() => { setLimitError(""); setNewLimit(newLimit === "0" ? "" : "0"); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${newLimit === "0" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-[#0d2040] text-[#6b88b0] hover:border-emerald-500/30 hover:text-emerald-400"}`}>
                <span>No Limit (Unlimited spending)</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${newLimit === "0" ? "border-emerald-400 bg-emerald-400" : "border-[#3a5a80]"}`}>
                  {newLimit === "0" && <div className="w-1.5 h-1.5 rounded-full bg-[#061120]" />}
                </div>
              </button>
              {newLimit !== "0" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">New Spend Limit (USD)</label>
                    <input type="number" min={1} step="10" placeholder="e.g. 1000" value={newLimit}
                      onChange={(e) => { setNewLimit(e.target.value); setLimitError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateLimit()} autoFocus />
                  </div>
                  <div className="flex gap-2">
                    {[100, 250, 500, 1000, 2500].map((v) => (
                      <button key={v} onClick={() => setNewLimit(String(v))}
                        className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors">${v}</button>
                    ))}
                  </div>
                </>
              )}
              {limitError && <p className="text-xs text-red-400">{limitError}</p>}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setLimitModal(null)}>Cancel</Button>
                <Button className="flex-1" loading={limitLoading} onClick={handleUpdateLimit} disabled={!newLimit && newLimit !== "0"}>
                  <SlidersHorizontal className="w-4 h-4" /> {newLimit === "0" ? "Remove Limit" : "Update Limit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#071829] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-red-400" /></div>
              <div><h3 className="font-semibold text-white text-base">Delete Card</h3><p className="text-xs text-[#6b88b0] mt-0.5">{deleteConfirm.label}</p></div>
            </div>
            <p className="text-sm text-[#6b88b0] mb-2">Are you sure you want to permanently delete this virtual card?</p>
            {deleteConfirm.balance > 0 && deleteConfirm.wallet ? (
              <p className="text-xs text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 mb-6">
                ${deleteConfirm.balance.toFixed(2)} remaining will be refunded to your linked wallet.
              </p>
            ) : (
              <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-6">
                This action cannot be undone. The card has no balance to refund.
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#6b88b0] hover:text-white bg-[#061120] border border-[#0d2040] rounded-lg hover:border-[#1a3a5c] transition-colors">
                Cancel
              </button>
              <button onClick={() => handleTerminate(deleteConfirm.id)} disabled={actionLoading === deleteConfirm.id}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/60 rounded-lg transition-colors disabled:opacity-50">
                {actionLoading === deleteConfirm.id ? "Deleting…" : "Yes, Delete Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Timed freeze modal ───────────────────────────────────────────── */}
      {freezeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <div><h2 className="text-base font-semibold text-white">Freeze Card</h2><p className="text-xs text-[#6b88b0] mt-0.5">{freezeModal.label}</p></div>
              <button onClick={() => setFreezeModal(null)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#6b88b0]">Choose how long to freeze this card. It will auto-unfreeze when the timer expires.</p>
              <div className="grid grid-cols-4 gap-2">
                {["30m", "1h", "2h", "6h", "12h", "24h", "48h", "7d"].map((d) => (
                  <button key={d} onClick={() => setFreezeDuration(d)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all ${freezeDuration === d ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-[#0d2040] text-[#6b88b0] hover:border-sky-500/30"}`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setFreezeModal(null)}>Cancel</Button>
                <Button className="flex-1 !bg-sky-700/30 !border-sky-500/40 hover:!bg-sky-700/50 !text-sky-300"
                  loading={freezeLoading} onClick={handleTimedFreeze}>
                  <Snowflake className="w-4 h-4" /> Freeze for {freezeDuration}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
