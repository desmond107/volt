"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import Button from "@/components/ui/Button";
import {
  Plus, X, CheckCircle2, Search, ArrowLeftRight, Send,
  TrendingUp, Download, RefreshCw, ChevronDown, User,
  CreditCard, Smartphone,
} from "lucide-react";
import { CURRENCY_NAMES, CURRENCY_SYMBOLS, FALLBACK_RATES } from "@/lib/rates";

interface FiatWallet {
  id: string;
  currency: string;
  name: string | null;
  balance: number;
}

const PALETTE = [
  "#2775ca", "#26a17b", "#f59e0b", "#6366f1", "#ef4444",
  "#10b981", "#8b5cf6", "#f97316", "#ec4899", "#14b8a6",
];

function walletColor(currency: string) {
  let h = 0;
  for (const c of currency) h = (h * 31 + c.charCodeAt(0)) & 0xff;
  return PALETTE[h % PALETTE.length];
}

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? "";
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sym ? `${sym}${formatted}` : `${formatted} ${currency}`;
}

function usdEquiv(balance: number, currency: string, rates: Record<string, number>) {
  const rate = rates[currency] ?? 1;
  return balance / rate;
}

const ALL_CURRENCIES = Object.keys(FALLBACK_RATES).map((code) => ({
  code,
  name: CURRENCY_NAMES[code] ?? code,
}));

type Modal = "add" | "deposit" | "transfer" | "send" | "convert" | null;

export default function MultiWalletPage() {
  const [wallets, setWallets] = useState<FiatWallet[]>([]);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [active, setActive] = useState<FiatWallet | null>(null);

  // shared
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // add wallet
  const [addSearch, setAddSearch] = useState("");
  const [addCurrency, setAddCurrency] = useState("");
  const [addName, setAddName] = useState("");

  // deposit
  const [depositAmt, setDepositAmt] = useState("");
  const [depositMethod, setDepositMethod] = useState<"card" | "mpesa">("card");
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard">("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");

  // transfer
  const [toWalletId, setToWalletId] = useState("");
  const [transferAmt, setTransferAmt] = useState("");

  // send
  const [sendEmail, setSendEmail] = useState("");
  const [sendLookup, setSendLookup] = useState<{ name: string; email: string } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupErr, setLookupErr] = useState("");
  const [sendAmt, setSendAmt] = useState("");

  // convert
  const [convSearch, setConvSearch] = useState("");
  const [convCurrency, setConvCurrency] = useState("");
  const [convAmt, setConvAmt] = useState("");

  const fetchWallets = useCallback(async () => {
    const res = await fetch("/api/fiat-wallets");
    if (res.ok) {
      const d = await res.json();
      setWallets(d.wallets);
    }
    setLoading(false);
  }, []);

  const fetchRates = useCallback(async () => {
    const res = await fetch("/api/wallet/rates");
    if (res.ok) {
      const d = await res.json();
      if (d.rates) setRates(d.rates);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
    fetchRates();
  }, [fetchWallets, fetchRates]);

  const openModal = (m: Modal, wallet?: FiatWallet) => {
    setModal(m);
    setActive(wallet ?? null);
    setSuccess(false);
    setSuccessMsg("");
    setErr("");
    setBusy(false);
    setAddSearch(""); setAddCurrency(""); setAddName("");
    setDepositAmt(""); setDepositMethod("card");
    setCardBrand("visa"); setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv("");
    setMpesaPhone("");
    setToWalletId(""); setTransferAmt("");
    setSendEmail(""); setSendLookup(null); setSendAmt(""); setLookupErr("");
    setConvSearch(""); setConvCurrency(""); setConvAmt("");
  };
  const closeModal = () => { setModal(null); setActive(null); };

  // ── Add wallet ────────────────────────────────────────────────────────────
  const filteredAdd = ALL_CURRENCIES.filter((c) => {
    const q = addSearch.toLowerCase();
    const taken = wallets.some((w) => w.currency === c.code);
    return !taken && (!q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }).slice(0, 80);

  const handleAddWallet = async () => {
    if (!addCurrency) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/fiat-wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: addCurrency, name: addName }),
    });
    const d = await res.json();
    if (res.ok) { await fetchWallets(); setSuccessMsg(`${addCurrency} wallet created`); setSuccess(true); }
    else setErr(d.error ?? "Failed");
    setBusy(false);
  };

  // ── Deposit ───────────────────────────────────────────────────────────────
  const fmtCardNum = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const isCardValid = () =>
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardName.trim().length > 0 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3;
  const isMpesaValid = () => mpesaPhone.replace(/\D/g, "").length >= 9;
  const canDeposit = () =>
    !!depositAmt && parseFloat(depositAmt) > 0 &&
    (depositMethod === "card" ? isCardValid() : isMpesaValid());

  // KES equivalent of deposit amount (for M-Pesa display)
  const kesEquiv = active && depositAmt && parseFloat(depositAmt) > 0
    ? ((parseFloat(depositAmt) / (rates[active.currency] ?? 1)) * (rates["KES"] ?? 129.5))
    : null;

  const handleDeposit = async () => {
    if (!active || !canDeposit()) return;
    setBusy(true); setErr("");
    const payload: Record<string, unknown> = {
      walletId: active.id,
      amount: parseFloat(depositAmt),
      paymentMethod: depositMethod,
    };
    if (depositMethod === "card") {
      payload.cardBrand = cardBrand;
      payload.cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);
    } else {
      payload.mpesaPhone = mpesaPhone;
    }
    const res = await fetch("/api/fiat-wallets/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchWallets();
      const method = depositMethod === "card"
        ? `${cardBrand === "visa" ? "Visa" : "Mastercard"} •••• ${cardNumber.replace(/\s/g, "").slice(-4)}`
        : `M-Pesa +254${mpesaPhone}`;
      setSuccessMsg(`${fmt(parseFloat(depositAmt), active.currency)} deposited via ${method}`);
      setSuccess(true);
    } else { const d = await res.json(); setErr(d.error ?? "Failed"); }
    setBusy(false);
  };

  // ── Transfer ──────────────────────────────────────────────────────────────
  const transferDest = wallets.find((w) => w.id === toWalletId);
  const transferPreview = transferDest && transferAmt && parseFloat(transferAmt) > 0 && active
    ? (parseFloat(transferAmt) / (rates[active.currency] ?? 1)) * (rates[transferDest.currency] ?? 1)
    : null;

  const handleTransfer = async () => {
    if (!active || !toWalletId || !transferAmt) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/fiat-wallets/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromWalletId: active.id, toWalletId, amount: parseFloat(transferAmt) }),
    });
    const d = await res.json();
    if (res.ok) {
      await fetchWallets();
      setSuccessMsg(
        `Transferred ${fmt(parseFloat(transferAmt), active.currency)} → ${fmt(d.receivedAmount, d.toCurrency)}`
      );
      setSuccess(true);
    } else setErr(d.error ?? "Failed");
    setBusy(false);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleLookup = async () => {
    if (!sendEmail.trim()) return;
    setLookupLoading(true); setSendLookup(null); setLookupErr("");
    const res = await fetch(`/api/fiat-wallets/lookup?email=${encodeURIComponent(sendEmail.trim())}`);
    const d = await res.json();
    if (res.ok) setSendLookup(d);
    else setLookupErr(d.error ?? "Not found");
    setLookupLoading(false);
  };

  const handleSend = async () => {
    if (!active || !sendLookup || !sendAmt) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/fiat-wallets/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromWalletId: active.id, recipientEmail: sendLookup.email, amount: parseFloat(sendAmt) }),
    });
    const d = await res.json();
    if (res.ok) {
      await fetchWallets();
      setSuccessMsg(`${fmt(parseFloat(sendAmt), active.currency)} sent to ${d.recipientName}`);
      setSuccess(true);
    } else setErr(d.error ?? "Failed");
    setBusy(false);
  };

  // ── Convert ───────────────────────────────────────────────────────────────
  const filteredConv = ALL_CURRENCIES.filter((c) => {
    const q = convSearch.toLowerCase();
    return c.code !== active?.currency && (!q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }).slice(0, 80);

  const convPreview = convCurrency && convAmt && parseFloat(convAmt) > 0 && active
    ? (parseFloat(convAmt) / (rates[active.currency] ?? 1)) * (rates[convCurrency] ?? 1)
    : null;

  const handleConvert = async () => {
    if (!active || !convCurrency || !convAmt) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/fiat-wallets/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromWalletId: active.id, targetCurrency: convCurrency, amount: parseFloat(convAmt) }),
    });
    const d = await res.json();
    if (res.ok) {
      await fetchWallets();
      setSuccessMsg(`Converted ${fmt(parseFloat(convAmt), active.currency)} → ${fmt(d.received, d.targetCurrency)}`);
      setSuccess(true);
    } else setErr(d.error ?? "Failed");
    setBusy(false);
  };

  const totalUSD = wallets.reduce((s, w) => s + usdEquiv(w.balance, w.currency, rates), 0);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Multi-Currency Wallets" subtitle="Hold, send and convert 150+ world currencies" />

      <main className="flex-1 p-6 space-y-6">
        {/* Portfolio summary */}
        <div className="bg-gradient-to-br from-blue-950/50 via-[#061120] to-[#061120] border border-blue-600/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-[#6b88b0] mb-1">Total Portfolio (USD equiv.)</div>
            <div className="text-4xl font-bold text-white">
              ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-[#6b88b0] mt-1">{wallets.length} wallet{wallets.length !== 1 ? "s" : ""} across {wallets.length} currencies</div>
          </div>
          <Button onClick={() => openModal("add")} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add Currency Wallet
          </Button>
        </div>

        {/* Wallet grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-[#061120] border border-[#0d2040] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No wallets yet</h3>
            <p className="text-sm text-[#6b88b0] mb-6 max-w-xs mx-auto">
              Create your first currency wallet and start holding, sending or converting money in any of 150+ world currencies.
            </p>
            <Button onClick={() => openModal("add")}>
              <Plus className="w-4 h-4" />
              Add Your First Wallet
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wallets.map((wallet) => {
              const color = walletColor(wallet.currency);
              const equiv = usdEquiv(wallet.balance, wallet.currency, rates);
              return (
                <div key={wallet.id} className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 hover:border-blue-600/30 transition-colors flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {wallet.currency.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{wallet.currency}</div>
                        <div className="text-xs text-[#6b88b0]">{wallet.name ?? CURRENCY_NAMES[wallet.currency] ?? wallet.currency}</div>
                      </div>
                    </div>
                    <button
                      onClick={fetchWallets}
                      className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Balance */}
                  <div>
                    <div className="text-2xl font-bold text-white">{fmt(wallet.balance, wallet.currency)}</div>
                    <div className="text-sm text-[#6b88b0]">
                      ≈ ${equiv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button size="sm" className="text-xs" onClick={() => openModal("deposit", wallet)}>
                      <Download className="w-3 h-3" />
                      Deposit
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs"
                      onClick={() => openModal("transfer", wallet)}
                      disabled={wallets.length < 2}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      Transfer
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs" onClick={() => openModal("send", wallet)}>
                      <Send className="w-3 h-3" />
                      Send
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs" onClick={() => openModal("convert", wallet)}>
                      <TrendingUp className="w-3 h-3" />
                      Convert
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Add wallet shortcut */}
            <button
              onClick={() => openModal("add")}
              className="bg-[#061120] border border-dashed border-[#0d2040] rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:border-blue-600/40 hover:bg-blue-600/5 transition-all text-[#6b88b0] hover:text-blue-400 min-h-[200px]"
            >
              <div className="w-11 h-11 rounded-full border border-dashed border-[#0d2040] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add Currency</span>
            </button>
          </div>
        )}

        {/* Exchange rates reference */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Popular Exchange Rates (vs USD)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {["EUR", "GBP", "KES", "NGN", "GHS", "ZAR", "JPY", "AED"].map((code) => (
              <div key={code} className="flex items-center justify-between bg-[#020c1b] border border-[#0d2040] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: walletColor(code) }}>
                    {code.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-white">{code}</span>
                </div>
                <span className="text-xs text-[#6b88b0] font-mono">
                  {(rates[code] ?? FALLBACK_RATES[code] ?? 1).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6b88b0] mt-3">Rates update hourly · Powered by open.er-api.com</p>
        </div>
      </main>

      {/* ── Modal backdrop ───────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* ── Add Wallet ─────────────────────────────────────────────────── */}
            {modal === "add" && (
              <>
                <ModalHeader title="Add Currency Wallet" onClose={closeModal} />
                {success ? (
                  <SuccessView msg={successMsg} onDone={closeModal} />
                ) : (
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Search Currency</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b88b0]" />
                        <input
                          className="pl-9"
                          placeholder="USD, Euro, Kenyan Shilling…"
                          value={addSearch}
                          onChange={(e) => { setAddSearch(e.target.value); setAddCurrency(""); }}
                        />
                      </div>
                      <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl overflow-hidden">
                        <div className="max-h-52 overflow-y-auto">
                          {filteredAdd.length === 0 ? (
                            <p className="text-xs text-[#6b88b0] p-4 text-center">No currencies found or already added</p>
                          ) : (
                            filteredAdd.map(({ code, name }) => (
                              <button key={code}
                                onClick={() => { setAddCurrency(code); setAddSearch(name); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#0d2040] transition-colors border-b border-[#0d2040]/40 last:border-0 ${addCurrency === code ? "bg-blue-500/10" : ""}`}
                              >
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                  style={{ backgroundColor: walletColor(code) }}>
                                  {code.slice(0, 2)}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-white">{code}</span>
                                  <span className="text-xs text-[#6b88b0] ml-2">{name}</span>
                                </div>
                                {addCurrency === code && <CheckCircle2 className="w-4 h-4 text-blue-400 ml-auto" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {addCurrency && (
                      <div>
                        <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Wallet Name (optional)</label>
                        <input
                          placeholder={CURRENCY_NAMES[addCurrency] ?? addCurrency}
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                        />
                      </div>
                    )}

                    {err && <p className="text-xs text-red-400">{err}</p>}
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
                      <Button className="flex-1" loading={busy} disabled={!addCurrency} onClick={handleAddWallet}>
                        Create Wallet
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Deposit ────────────────────────────────────────────────────── */}
            {modal === "deposit" && active && (
              <>
                <ModalHeader title={`Deposit ${active.currency}`} subtitle={active.name ?? undefined} onClose={closeModal} />
                {success ? (
                  <SuccessView msg={successMsg} onDone={closeModal} />
                ) : (
                  <div className="p-6 space-y-5">
                    <WalletBadge wallet={active} rates={rates} />

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({active.currency})</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b88b0] text-sm">
                          {CURRENCY_SYMBOLS[active.currency] ?? active.currency}
                        </span>
                        <input type="number" min="0.01" step="0.01" placeholder="0.00"
                          value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} className="pl-10" />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[100, 500, 1000, 5000].map((v) => (
                          <button key={v} onClick={() => setDepositAmt(String(v))}
                            className="flex-1 text-xs py-1.5 rounded-lg border border-[#0d2040] text-[#6b88b0] hover:border-blue-600/40 hover:text-blue-300 transition-colors">
                            {(CURRENCY_SYMBOLS[active.currency] ?? "") + v.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      {depositAmt && parseFloat(depositAmt) > 0 && (
                        <p className="text-xs text-[#6b88b0] mt-1.5">
                          ≈ ${usdEquiv(parseFloat(depositAmt), active.currency, rates).toFixed(2)} USD
                        </p>
                      )}
                    </div>

                    {/* Payment method tabs */}
                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setDepositMethod("card")}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                            depositMethod === "card"
                              ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                              : "border-[#0d2040] text-[#6b88b0] hover:border-[#1a3a60] hover:text-white"
                          }`}>
                          <CreditCard className="w-4 h-4" /> Card
                        </button>
                        <button onClick={() => setDepositMethod("mpesa")}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                            depositMethod === "mpesa"
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : "border-[#0d2040] text-[#6b88b0] hover:border-[#1a3a60] hover:text-white"
                          }`}>
                          <Smartphone className="w-4 h-4" /> M-Pesa
                        </button>
                      </div>
                    </div>

                    {/* Card form */}
                    {depositMethod === "card" && (
                      <div className="space-y-4">
                        {/* Brand picker */}
                        <div className="flex gap-2">
                          {(["visa", "mastercard"] as const).map((brand) => (
                            <button key={brand} onClick={() => setCardBrand(brand)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                cardBrand === brand
                                  ? "border-blue-500/40 bg-blue-500/10 text-white"
                                  : "border-[#0d2040] text-[#6b88b0] hover:border-[#1a3a60]"
                              }`}>
                              {brand === "visa" ? (
                                <span className="text-sm font-black italic tracking-tight text-blue-400">VISA</span>
                              ) : (
                                <>
                                  <span className="flex items-center">
                                    <span className="w-4 h-4 rounded-full bg-red-500 opacity-90 inline-block" />
                                    <span className="w-4 h-4 rounded-full bg-yellow-400 opacity-90 -ml-2 inline-block" />
                                  </span>
                                  <span className="text-[#6b88b0] text-xs">Mastercard</span>
                                </>
                              )}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Card Number</label>
                          <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                            value={cardNumber} maxLength={19}
                            onChange={(e) => setCardNumber(fmtCardNum(e.target.value))}
                            className="font-mono tracking-wider" />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Name on Card</label>
                          <input type="text" placeholder="JOHN DOE"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Expiry</label>
                            <input type="text" inputMode="numeric" placeholder="MM/YY"
                              value={cardExpiry} maxLength={5}
                              onChange={(e) => setCardExpiry(fmtExpiry(e.target.value))} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">CVV</label>
                            <input type="password" inputMode="numeric" placeholder="•••"
                              value={cardCvv} maxLength={4}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                          </div>
                        </div>
                        <p className="text-xs text-[#6b88b0]">🔒 Your card details are encrypted and never stored.</p>
                      </div>
                    )}

                    {/* M-Pesa form */}
                    {depositMethod === "mpesa" && (
                      <div className="space-y-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-300">M-Pesa STK Push</span>
                          </div>
                          <p className="text-xs text-[#6b88b0]">
                            Enter your Safaricom number. You&apos;ll receive a push notification to authorise the payment.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Phone Number</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b88b0] text-sm font-mono">+254</span>
                            <input type="tel" inputMode="numeric" placeholder="7XX XXX XXX"
                              value={mpesaPhone}
                              onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                              className="pl-14 font-mono tracking-wider" />
                          </div>
                        </div>

                        {kesEquiv !== null && (
                          <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-[#6b88b0]">Amount ({active.currency})</span>
                              <span className="text-white font-medium">{fmt(parseFloat(depositAmt), active.currency)}</span>
                            </div>
                            {active.currency !== "KES" && (
                              <div className="flex justify-between text-xs">
                                <span className="text-[#6b88b0]">Rate</span>
                                <span className="text-[#6b88b0]">
                                  1 {active.currency} = {((rates["KES"] ?? 129.5) / (rates[active.currency] ?? 1)).toLocaleString(undefined, { maximumFractionDigits: 4 })} KES
                                </span>
                              </div>
                            )}
                            <div className="border-t border-[#0d2040] pt-2 flex justify-between text-sm">
                              <span className="text-[#c0d4ef] font-medium">You Pay (KES)</span>
                              <span className="text-emerald-400 font-bold">
                                KES {kesEquiv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-[#6b88b0]">Supported: Safaricom M-Pesa Kenya. Rate updates hourly.</p>
                      </div>
                    )}

                    {err && <p className="text-xs text-red-400">{err}</p>}
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
                      <Button className="flex-1" loading={busy} disabled={!canDeposit()} onClick={handleDeposit}>
                        {depositMethod === "mpesa" ? "Send STK Push" : "Pay Now"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Transfer ───────────────────────────────────────────────────── */}
            {modal === "transfer" && active && (
              <>
                <ModalHeader title="Transfer Funds" subtitle="Between your wallets" onClose={closeModal} />
                {success ? (
                  <SuccessView msg={successMsg} onDone={closeModal} />
                ) : (
                  <div className="p-6 space-y-5">
                    <WalletBadge wallet={active} rates={rates} label="From" />

                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">To Wallet</label>
                      <div className="space-y-2">
                        {wallets.filter((w) => w.id !== active.id).map((w) => (
                          <button key={w.id}
                            onClick={() => setToWalletId(w.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${toWalletId === w.id ? "border-blue-500/50 bg-blue-500/10" : "border-[#0d2040] hover:border-[#1a3a60]"}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ backgroundColor: walletColor(w.currency) }}>
                                {w.currency.slice(0, 2)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{w.currency}</div>
                                <div className="text-xs text-[#6b88b0]">{w.name}</div>
                              </div>
                            </div>
                            <span className="text-xs text-[#6b88b0]">{fmt(w.balance, w.currency)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({active.currency})</label>
                      <div className="relative">
                        <input type="number" min="0.01" step="0.01" placeholder="0.00"
                          max={active.balance}
                          value={transferAmt}
                          onChange={(e) => setTransferAmt(e.target.value)}
                          className="pr-14"
                        />
                        <button onClick={() => setTransferAmt(active.balance.toFixed(2))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium">
                          Max
                        </button>
                      </div>
                      {transferAmt && parseFloat(transferAmt) > active.balance && (
                        <p className="text-xs text-red-400 mt-1">Exceeds balance</p>
                      )}
                      {transferPreview !== null && transferDest && (
                        <div className="mt-2 bg-[#020c1b] border border-[#0d2040] rounded-lg p-3 flex items-center justify-between">
                          <span className="text-xs text-[#6b88b0]">Recipient receives</span>
                          <span className="text-sm font-bold text-emerald-400">{fmt(transferPreview, transferDest.currency)}</span>
                        </div>
                      )}
                    </div>

                    {err && <p className="text-xs text-red-400">{err}</p>}
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
                      <Button className="flex-1" loading={busy}
                        disabled={!toWalletId || !transferAmt || parseFloat(transferAmt) <= 0 || parseFloat(transferAmt) > active.balance}
                        onClick={handleTransfer}
                      >
                        Transfer
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Send ───────────────────────────────────────────────────────── */}
            {modal === "send" && active && (
              <>
                <ModalHeader title={`Send ${active.currency}`} subtitle="To another Volt user" onClose={closeModal} />
                {success ? (
                  <SuccessView msg={successMsg} onDone={closeModal} />
                ) : (
                  <div className="p-6 space-y-5">
                    <WalletBadge wallet={active} rates={rates} />

                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Recipient Email</label>
                      <div className="flex gap-2">
                        <input type="email" placeholder="user@example.com"
                          value={sendEmail}
                          onChange={(e) => { setSendEmail(e.target.value); setSendLookup(null); setLookupErr(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                          className="flex-1"
                        />
                        <Button variant="secondary" onClick={handleLookup} loading={lookupLoading} disabled={!sendEmail.trim()}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      {lookupErr && <p className="text-xs text-red-400 mt-1">{lookupErr}</p>}
                      {sendLookup && (
                        <div className="mt-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0d2040] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-[#6b88b0]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{sendLookup.name}</div>
                            <div className="text-xs text-[#6b88b0] truncate">{sendLookup.email}</div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                        </div>
                      )}
                    </div>

                    {sendLookup && (
                      <div>
                        <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({active.currency})</label>
                        <div className="relative">
                          <input type="number" min="0.01" step="0.01" placeholder="0.00"
                            max={active.balance}
                            value={sendAmt}
                            onChange={(e) => setSendAmt(e.target.value)}
                            className="pr-14"
                          />
                          <button onClick={() => setSendAmt(active.balance.toFixed(2))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium">
                            Max
                          </button>
                        </div>
                        {sendAmt && parseFloat(sendAmt) > active.balance && (
                          <p className="text-xs text-red-400 mt-1">Exceeds balance</p>
                        )}
                      </div>
                    )}

                    {err && <p className="text-xs text-red-400">{err}</p>}
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
                      <Button className="flex-1" loading={busy}
                        disabled={!sendLookup || !sendAmt || parseFloat(sendAmt) <= 0 || parseFloat(sendAmt) > active.balance}
                        onClick={handleSend}
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Convert ────────────────────────────────────────────────────── */}
            {modal === "convert" && active && (
              <>
                <ModalHeader title={`Convert ${active.currency}`} subtitle="To any world currency" onClose={closeModal} />
                {success ? (
                  <SuccessView msg={successMsg} onDone={closeModal} />
                ) : (
                  <div className="p-6 space-y-5">
                    <WalletBadge wallet={active} rates={rates} label="From" />

                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({active.currency})</label>
                      <div className="relative">
                        <input type="number" min="0.01" step="0.01" placeholder="0.00"
                          max={active.balance}
                          value={convAmt}
                          onChange={(e) => setConvAmt(e.target.value)}
                          className="pr-14"
                        />
                        <button onClick={() => setConvAmt(active.balance.toFixed(2))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium">
                          Max
                        </button>
                      </div>
                      {convAmt && parseFloat(convAmt) > active.balance && (
                        <p className="text-xs text-red-400 mt-1">Exceeds balance</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Convert To</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b88b0]" />
                        <input className="pl-9" placeholder="EUR, Japanese Yen, Shilling…"
                          value={convSearch}
                          onChange={(e) => { setConvSearch(e.target.value); setConvCurrency(""); }}
                        />
                      </div>
                      <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl overflow-hidden">
                        <div className="max-h-44 overflow-y-auto">
                          {filteredConv.length === 0 ? (
                            <p className="text-xs text-[#6b88b0] p-4 text-center">No currencies found</p>
                          ) : (
                            filteredConv.map(({ code, name }) => (
                              <button key={code}
                                onClick={() => { setConvCurrency(code); setConvSearch(name); }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#0d2040] transition-colors border-b border-[#0d2040]/40 last:border-0 ${convCurrency === code ? "bg-blue-500/10" : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                    style={{ backgroundColor: walletColor(code) }}>
                                    {code.slice(0, 2)}
                                  </div>
                                  <span className="text-sm font-semibold text-white">{code}</span>
                                  <span className="text-xs text-[#6b88b0]">{name}</span>
                                </div>
                                <span className="text-xs text-[#6b88b0] font-mono shrink-0 ml-2">
                                  {(rates[code] ?? FALLBACK_RATES[code] ?? 1).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {convCurrency && convPreview !== null && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#6b88b0]">You send</span>
                          <span className="text-sm font-bold text-white">{fmt(parseFloat(convAmt || "0"), active.currency)}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 my-2">
                          <ChevronDown className="w-4 h-4 text-[#6b88b0]" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6b88b0]">You receive</span>
                          <span className="text-base font-bold text-emerald-400">{fmt(convPreview, convCurrency)}</span>
                        </div>
                        <div className="border-t border-blue-500/20 mt-3 pt-2">
                          <span className="text-xs text-[#6b88b0]">
                            Rate: 1 {active.currency} = {((rates[convCurrency] ?? 1) / (rates[active.currency] ?? 1)).toLocaleString(undefined, { maximumFractionDigits: 6 })} {convCurrency}
                          </span>
                        </div>
                      </div>
                    )}

                    {err && <p className="text-xs text-red-400">{err}</p>}
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
                      <Button className="flex-1" loading={busy}
                        disabled={!convCurrency || !convAmt || parseFloat(convAmt) <= 0 || parseFloat(convAmt) > active.balance}
                        onClick={handleConvert}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Convert
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-[#0d2040]">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-[#6b88b0] mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-2 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SuccessView({ msg, onDone }: { msg: string; onDone: () => void }) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Done!</h3>
      <p className="text-sm text-[#6b88b0] mb-6">{msg}</p>
      <Button className="w-full" onClick={onDone}>Close</Button>
    </div>
  );
}

function WalletBadge({ wallet, rates, label }: { wallet: FiatWallet; rates: Record<string, number>; label?: string }) {
  return (
    <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {label && <span className="text-xs text-[#6b88b0] mr-1">{label}</span>}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ backgroundColor: walletColor(wallet.currency) }}>
          {wallet.currency.slice(0, 2)}
        </div>
        <span className="text-sm font-medium text-white">{wallet.currency}</span>
        <span className="text-xs text-[#6b88b0]">{wallet.name}</span>
      </div>
      <span className="text-xs text-[#6b88b0]">Balance: <span className="text-white font-medium">{fmt(wallet.balance, wallet.currency)}</span></span>
    </div>
  );
}
