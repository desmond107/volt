"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "@/components/dashboard/TopBar";
import VirtualCardFace, { getTheme } from "@/components/ui/VirtualCardFace";
import EagleLogo from "@/components/ui/EagleLogo";
import { formatCurrency, maskCardNumber } from "@/lib/utils";
import { Plus, CreditCard, Eye, EyeOff, Snowflake, Trash2, AlertCircle, Link2, Link2Off, X, ArrowDownLeft, Wifi, WifiOff, Maximize2, ShoppingCart, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface LinkedWallet {
  id: string;
  asset: string;
  network: string;
  balance: number;
}

interface VirtualCard {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  cardHolder: string;
  brand: string;
  status: string;
  spendLimit: number;
  spentAmount: number;
  balance: number;
  nfcEnabled: boolean;
  currency: string;
  label: string;
  color: string;
  walletId: string | null;
  wallet: LinkedWallet | null;
}

interface Wallet {
  id: string;
  asset: string;
  network: string;
  balance: number;
}

const cardColors = [
  { label: "Navy",    value: "#6366f1", ...getTheme("#6366f1") },
  { label: "Cyan",    value: "#06b6d4", ...getTheme("#06b6d4") },
  { label: "Emerald", value: "#10b981", ...getTheme("#10b981") },
  { label: "Rose",    value: "#f43f5e", ...getTheme("#f43f5e") },
  { label: "Violet",  value: "#8b5cf6", ...getTheme("#8b5cf6") },
  { label: "Gold",    value: "#f59e0b", ...getTheme("#f59e0b") },
];

const CATEGORIES = [
  "Shopping", "Food & Drink", "Travel", "Subscriptions",
  "Entertainment", "Health", "Education", "Utilities", "Other",
];

function PayModal({ card, onClose, onSuccess }: {
  card: VirtualCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const theme = getTheme(card.color);

  const handlePay = async () => {
    const amt = parseFloat(amount);
    if (!merchant.trim()) { setError("Enter a merchant name"); return; }
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    setError("");
    setLoading(true);
    const res = await fetch(`/api/cards/${card.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, merchant: merchant.trim(), category }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } else {
      setError(data.error ?? "Payment failed");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Card preview header */}
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
              <p className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Balance</p>
              <p className="text-sm font-bold" style={{ color: theme.accent }}>{formatCurrency(card.balance)}</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-white font-semibold">Payment Successful</p>
            <p className="text-xs text-[#6b88b0]">{formatCurrency(parseFloat(amount))} sent to {merchant}</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Merchant / Store</label>
              <input
                type="text"
                placeholder="e.g. Amazon, Netflix, Uber"
                value={merchant}
                onChange={(e) => { setMerchant(e.target.value); setError(""); }}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#020c1b] border border-[#0d2040] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Amount (USD)</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handlePay()}
              />
            </div>

            <div className="flex gap-2">
              {[5, 10, 25, 50].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(Math.min(v, card.balance)))}
                  className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors"
                >
                  ${v}
                </button>
              ))}
            </div>

            {/* Spend summary */}
            <div className="bg-[#020c1b] rounded-lg px-3 py-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#6b88b0]">Spend limit remaining</span>
                <span className="text-white">{formatCurrency(card.spendLimit - card.spentAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6b88b0]">Card balance</span>
                <span className="text-white">{formatCurrency(card.balance)}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                loading={loading}
                onClick={handlePay}
                disabled={!merchant || !amount || parseFloat(amount) <= 0}
              >
                <ShoppingCart className="w-4 h-4" />
                Pay Now
              </Button>
            </div>
          </div>
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
      currentRef.current = {
        x: currentRef.current.x + dx * 0.12,
        y: currentRef.current.y + dy * 0.12,
      };
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
    setShine({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    targetRef.current = { x: 0, y: 0 };
    setShine({ x: 50, y: 50 });
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-xs text-[#6b88b0] mb-6 tracking-wide">Move cursor over card to rotate</p>

        <div
          ref={cardRef}
          style={{ perspective: "900px", cursor: "grab" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            style={{
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transformStyle: "preserve-3d",
              position: "relative",
              filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.7))",
            }}
          >
            <VirtualCardFace
              color={card.color}
              label={card.label}
              cardHolder={card.cardHolder}
              cardNumber={card.cardNumber}
              expiryMonth={card.expiryMonth}
              expiryYear={card.expiryYear}
              cvv={card.cvv}
              status={card.status}
              nfcEnabled={card.nfcEnabled}
              revealed
            />
            {/* Glare overlay */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
              }}
            />
            {/* Edge highlight */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
            />
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

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-[#1a3a6b] rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function CardsPage() {
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

  const [newCard, setNewCard] = useState({
    label: "",
    spendLimit: 500,
    color: "#6366f1",
    currency: "USD",
  });

  const fetchCards = useCallback(async () => {
    const res = await fetch("/api/cards");
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards);
    }
    setLoading(false);
  }, []);

  const fetchWallets = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.ok) {
      const data = await res.json();
      if (data.wallets) setWallets(data.wallets);
    }
  }, []);

  useEffect(() => {
    fetchCards();
    fetchWallets();
    fetch("/api/user").then((r) => r.json()).then((d) => {
      setKycVerified(d.user?.kycStatus === "VERIFIED");
    });
  }, [fetchCards, fetchWallets]);

  const handleCreate = async () => {
    setActionLoading("create");
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCard),
    });
    if (res.ok) {
      await fetchCards();
      setShowModal(false);
      setNewCard({ label: "", spendLimit: 500, color: "#6366f1", currency: "USD" });
    }
    setActionLoading(null);
  };

  const handleFreeze = async (id: string, status: string) => {
    setActionLoading(id);
    await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "ACTIVE" ? "FROZEN" : "ACTIVE" }),
    });
    await fetchCards();
    setActionLoading(null);
  };

  const handleTerminate = async (id: string) => {
    setActionLoading(id);
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    const data = await res.json();
    await fetchCards();
    setActionLoading(null);
    setDeleteConfirm(null);
    if (data.refunded > 0) {
      alert(`Card deleted. $${data.refunded.toFixed(2)} has been refunded to your wallet.`);
    }
  };

  const handleLinkWallet = async (cardId: string, walletId: string | null) => {
    setLinkingWalletId(walletId ?? "disconnect");
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    await fetchCards();
    setLinkModal(null);
    setLinkingWalletId(null);
  };

  const handleToggleNfc = async (id: string, current: boolean) => {
    setActionLoading(id + "-nfc");
    await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nfcEnabled: !current }),
    });
    await fetchCards();
    setActionLoading(null);
  };

  const handleFund = async () => {
    if (!fundModal) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) { setFundError("Enter a valid amount"); return; }
    setFundError("");
    setFundLoading(true);
    const res = await fetch(`/api/cards/${fundModal.id}/fund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      await Promise.all([fetchCards(), fetchWallets()]);
      setFundModal(null);
      setFundAmount("");
    } else {
      const data = await res.json();
      setFundError(data.error ?? "Failed to fund card");
    }
    setFundLoading(false);
  };

  const selectedColorStyle = getTheme(newCard.color);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Virtual Cards" subtitle="Manage your Visa virtual cards" />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#6b88b0]">{cards.length} active card(s)</p>
          <Button
            onClick={() => setShowModal(true)}
            disabled={!kycVerified}
            title={!kycVerified ? "Complete KYC to issue cards" : undefined}
          >
            <Plus className="w-4 h-4" />
            Issue New Card
          </Button>
        </div>

        {!kycVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              Complete <a href="/dashboard/kyc" className="underline font-medium">KYC verification</a> to issue virtual cards.
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-[#061120] border border-[#0d2040] animate-pulse" style={{ aspectRatio: "1.586/1" }} />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-14 h-14 text-[#0d2040] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No cards yet</h3>
            <p className="text-sm text-[#6b88b0] mb-6">Issue your first virtual Visa card and start spending digital currency anywhere.</p>
            {kycVerified && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" />
                Issue First Card
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((card) => {
              const revealed = revealedCard === card.id;
              const frozen = card.status === "FROZEN";
              const usedPercent = card.spendLimit > 0 ? (card.spentAmount / card.spendLimit) * 100 : 0;
              const style = getTheme(card.color);

              return (
                <div key={card.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-medium text-white">{card.label}</span>
                    <span className="text-xs text-[#6b88b0]">{formatCurrency(card.spendLimit)} limit</span>
                  </div>

                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setCard3dView(card)}
                    title="Click to view in 3D"
                  >
                    <VirtualCardFace
                      color={card.color}
                      label={card.label}
                      cardHolder={card.cardHolder}
                      cardNumber={card.cardNumber}
                      expiryMonth={card.expiryMonth}
                      expiryYear={card.expiryYear}
                      cvv={card.cvv}
                      status={card.status}
                      nfcEnabled={card.nfcEnabled}
                      revealed={revealed}
                      maskNumber={maskCardNumber}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs text-white font-medium">View in 3D</span>
                      </div>
                    </div>
                  </div>

                  {/* Card balance */}
                  <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6b88b0]">Card Balance</span>
                      <span className="text-white font-semibold" style={{ color: style.accent }}>{formatCurrency(card.balance)}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-[#6b88b0]">Spent</span>
                      <span className="text-white">{formatCurrency(card.spentAmount)} / {formatCurrency(card.spendLimit)}</span>
                    </div>
                    <div className="h-1.5 bg-[#0d2040] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(usedPercent, 100)}%`, backgroundColor: style.accent }}
                      />
                    </div>
                  </div>

                  {/* Linked wallet badge */}
                  {card.wallet ? (
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRevealedCard(revealed ? null : card.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-300 hover:text-white bg-[#061120] border border-blue-500/20 rounded-lg hover:border-blue-500/50 transition-colors"
                    >
                      {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {revealed ? "Hide" : "Reveal"}
                    </button>
                    <button
                      onClick={() => setLinkModal(card)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-violet-300 hover:text-violet-100 bg-[#061120] border border-violet-500/20 rounded-lg hover:border-violet-500/50 transition-colors"
                    >
                      <Link2 className="w-4 h-4" />
                      {card.wallet ? "Relink" : "Link"}
                    </button>
                    <button
                      onClick={() => { setFundModal(card); setFundAmount(""); setFundError(""); }}
                      disabled={!card.wallet}
                      title={!card.wallet ? "Link a wallet first" : "Fund this card"}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-amber-300 hover:text-amber-100 bg-[#061120] border border-amber-500/20 rounded-lg hover:border-amber-500/50 transition-colors disabled:cursor-not-allowed disabled:text-amber-300/60"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Fund
                    </button>
                    <button
                      onClick={() => setPayModal(card)}
                      disabled={card.status !== "ACTIVE" || card.balance <= 0}
                      title={card.status !== "ACTIVE" ? "Card must be active to pay" : card.balance <= 0 ? "Fund the card first" : "Make a payment"}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-300 hover:text-emerald-100 bg-[#061120] border border-emerald-500/20 rounded-lg hover:border-emerald-500/50 transition-colors disabled:cursor-not-allowed disabled:text-emerald-300/60"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Pay
                    </button>
                    <button
                      onClick={() => handleToggleNfc(card.id, card.nfcEnabled)}
                      disabled={actionLoading === card.id + "-nfc"}
                      title={card.nfcEnabled ? "Disable NFC" : "Enable NFC"}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-[#061120] border rounded-lg transition-colors disabled:opacity-50 ${
                        card.nfcEnabled
                          ? "text-emerald-300 border-emerald-500/20 hover:text-red-300 hover:border-red-500/50"
                          : "text-slate-300 border-slate-500/20 hover:text-emerald-300 hover:border-emerald-500/50"
                      }`}
                    >
                      {card.nfcEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      NFC
                    </button>
                    <button
                      onClick={() => handleFreeze(card.id, card.status)}
                      disabled={actionLoading === card.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-sky-300 hover:text-sky-100 bg-[#061120] border border-sky-500/20 rounded-lg hover:border-sky-500/50 transition-colors disabled:opacity-50"
                    >
                      <Snowflake className="w-4 h-4" />
                      {frozen ? "Unfreeze" : "Freeze"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(card)}
                      disabled={actionLoading === card.id}
                      className="flex items-center justify-center p-3 text-red-400 hover:text-red-200 bg-[#061120] border border-red-500/20 rounded-lg hover:border-red-500/50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Issue card modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-5">Issue New Virtual Card</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Card Label</label>
                <input
                  type="text"
                  placeholder="e.g. Shopping, Subscriptions"
                  value={newCard.label}
                  onChange={(e) => setNewCard({ ...newCard, label: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Spend Limit (USD)</label>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  value={newCard.spendLimit}
                  onChange={(e) => setNewCard({ ...newCard, spendLimit: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Card Theme</label>
                <div className="flex gap-2">
                  {cardColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewCard({ ...newCard, color: c.value })}
                      title={c.label}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{
                        background: c.gradient,
                        outline: newCard.color === c.value ? `2px solid ${c.accent}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Preview</label>
                <div
                  className="relative rounded-xl overflow-hidden shadow-xl"
                  style={{ background: selectedColorStyle.gradient, aspectRatio: "1.586/1" }}
                >
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-white/10 border border-white/20 flex items-center justify-center">
                          <EagleLogo size={13} />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-white font-semibold text-[10px]">Volt</span>
                          <span className="text-[7px] uppercase tracking-widest" style={{ color: selectedColorStyle.accent }}>Digital Pay</span>
                        </div>
                      </div>
                      <span className="text-white/50 text-[10px] italic">VISA</span>
                    </div>
                    <div>
                      <div
                        className="w-8 h-6 rounded mb-2 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${selectedColorStyle.chip}cc, ${selectedColorStyle.chip}55)`, border: `1px solid ${selectedColorStyle.chip}44` }}
                      >
                        <div className="w-5 h-3.5 rounded-sm flex flex-col justify-around p-0.5" style={{ background: `${selectedColorStyle.chip}33` }}>
                          {[0, 1, 2].map((i) => <div key={i} className="h-px rounded" style={{ background: `${selectedColorStyle.chip}99` }} />)}
                        </div>
                      </div>
                      <p className="text-white font-mono text-xs tracking-widest mb-2">•••• •••• •••• ????</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-white/40 text-[8px] uppercase tracking-wider">Card Holder</div>
                          <div className="text-white text-[10px]">{newCard.label || "Virtual Card"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/40 text-[8px] uppercase tracking-wider">Expires</div>
                          <div className="text-white text-[10px]">MM/YY</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={actionLoading === "create"}
                onClick={handleCreate}
                disabled={!newCard.label}
              >
                Issue Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link wallet modal */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <div>
                <h2 className="text-base font-semibold text-white">Link Wallet</h2>
                <p className="text-xs text-[#6b88b0] mt-0.5">{linkModal.label}</p>
              </div>
              <button onClick={() => setLinkModal(null)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
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
                      <button
                        key={w.id}
                        onClick={() => handleLinkWallet(linkModal.id, isLinked ? null : w.id)}
                        disabled={linkingWalletId !== null}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all disabled:opacity-60 ${
                          isLinked
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-[#0d2040] hover:border-blue-500/40 hover:bg-blue-500/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0d2040] flex items-center justify-center text-white text-xs font-bold">
                            {w.asset[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{w.asset}</div>
                            <div className="text-xs text-[#6b88b0]">{w.network}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white font-medium">{formatCurrency(w.balance)}</div>
                          {isLinked && (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 justify-end">
                              <Link2Off className="w-2.5 h-2.5" /> Tap to unlink
                            </div>
                          )}
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

      {/* 3D card viewer */}
      {card3dView && <Card3DViewer card={card3dView} onClose={() => setCard3dView(null)} />}

      {/* Pay modal */}
      {payModal && (
        <PayModal
          card={payModal}
          onClose={() => setPayModal(null)}
          onSuccess={() => { fetchCards(); fetchWallets(); }}
        />
      )}

      {/* Fund card modal */}
      {fundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <div>
                <h2 className="text-base font-semibold text-white">Fund Card</h2>
                <p className="text-xs text-[#6b88b0] mt-0.5">{fundModal.label}</p>
              </div>
              <button onClick={() => setFundModal(null)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {fundModal.wallet && (
                <div className="flex items-center justify-between bg-[#0d2040]/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0d2040] flex items-center justify-center text-white text-xs font-bold">
                      {fundModal.wallet.asset[0]}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{fundModal.wallet.asset}</div>
                      <div className="text-[10px] text-[#6b88b0]">{fundModal.wallet.network}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#6b88b0]">Available</div>
                    <div className="text-sm font-semibold text-white">{formatCurrency(fundModal.wallet.balance)}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount (USD)</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  placeholder="0.00"
                  value={fundAmount}
                  onChange={(e) => { setFundAmount(e.target.value); setFundError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleFund()}
                  autoFocus
                />
              </div>

              {fundModal.wallet && (
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => setFundAmount(String(Math.min(v, fundModal.wallet!.balance)))}
                      className="flex-1 py-1 text-xs text-[#6b88b0] hover:text-white border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors"
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              )}

              {fundError && (
                <p className="text-xs text-red-400">{fundError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setFundModal(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  loading={fundLoading}
                  onClick={handleFund}
                  disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Fund Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#071829] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Delete Card</h3>
                <p className="text-xs text-[#6b88b0] mt-0.5">{deleteConfirm.label}</p>
              </div>
            </div>

            <p className="text-sm text-[#6b88b0] mb-2">
              Are you sure you want to permanently delete this virtual card?
            </p>
            {deleteConfirm.balance > 0 && deleteConfirm.wallet ? (
              <p className="text-xs text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 mb-6">
                ${deleteConfirm.balance.toFixed(2)} remaining on this card will be refunded to your linked wallet.
              </p>
            ) : (
              <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-6">
                This action cannot be undone. The card has no balance to refund.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#6b88b0] hover:text-white bg-[#061120] border border-[#0d2040] rounded-lg hover:border-[#1a3a5c] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTerminate(deleteConfirm.id)}
                disabled={actionLoading === deleteConfirm.id}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/60 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === deleteConfirm.id ? "Deleting…" : "Yes, Delete Card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
