"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import { Copy, Download, ArrowUpRight, RefreshCw, CheckCircle2, CreditCard, Smartphone, X, ArrowLeftRight, Send, Search, User } from "lucide-react";
import Button from "@/components/ui/Button";

interface Wallet {
  id: string;
  asset: string;
  network: string;
  address: string;
  balance: number;
}

const assetColors: Record<string, string> = {
  USDC: "#2775ca",
  USDT: "#26a17b",
  DAI: "#f4b731",
};

const KES_RATE = 129.5; // 1 USD = 129.5 KES

export default function WalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Deposit state
  const [depositModal, setDepositModal] = useState<Wallet | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mpesa">("card");
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard">("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");

  // Transfer state
  const [transferModal, setTransferModal] = useState<Wallet | null>(null);
  const [transferToId, setTransferToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Send state
  interface LookupResult { name: string; email: string; address: string; asset: string; network: string }
  const [sendModal, setSendModal] = useState<Wallet | null>(null);
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendLookup, setSendLookup] = useState<LookupResult | null>(null);
  const [sendLookupLoading, setSendLookupLoading] = useState(false);
  const [sendLookupError, setSendLookupError] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const fetchWallets = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.ok) {
      const data = await res.json();
      setWallets(data.wallets);
    }
    setLoading(false);
  }, []);

useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Deposit helpers ──────────────────────────────────────────────────────────
  const resetDepositModal = () => {
    setDepositModal(null);
    setDepositAmount("");
    setDepositSuccess(false);
    setPaymentMethod("card");
    setCardBrand("visa");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setMpesaPhone("");
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const isCardValid = () =>
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardName.trim().length > 0 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3;

  const isMpesaValid = () => mpesaPhone.replace(/\D/g, "").length >= 9;

  const canSubmitDeposit = () =>
    !!depositAmount && parseFloat(depositAmount) > 0 &&
    (paymentMethod === "card" ? isCardValid() : isMpesaValid());

  const kesAmount = depositAmount && parseFloat(depositAmount) > 0
    ? (parseFloat(depositAmount) * KES_RATE).toLocaleString("en-KE", { maximumFractionDigits: 0 })
    : null;

  const handleDeposit = async () => {
    if (!depositModal || !canSubmitDeposit()) return;
    setDepositing(true);
    const payload: Record<string, unknown> = {
      walletId: depositModal.id,
      amount: parseFloat(depositAmount),
      paymentMethod,
    };
    if (paymentMethod === "card") {
      payload.cardBrand = cardBrand;
      payload.cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);
    } else {
      payload.mpesaPhone = mpesaPhone;
    }
    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchWallets();
      setDepositSuccess(true);
    }
    setDepositing(false);
  };

  // ── Transfer helpers ─────────────────────────────────────────────────────────
  const resetTransferModal = () => {
    setTransferModal(null);
    setTransferToId("");
    setTransferAmount("");
    setTransferring(false);
    setTransferSuccess(false);
  };

  const transferDestinations = transferModal
    ? wallets.filter((w) => w.id !== transferModal.id)
    : [];

  const canSubmitTransfer = () =>
    !!transferToId &&
    !!transferAmount &&
    parseFloat(transferAmount) > 0 &&
    transferModal !== null &&
    parseFloat(transferAmount) <= transferModal.balance;

  const handleTransfer = async () => {
    if (!transferModal || !canSubmitTransfer()) return;
    setTransferring(true);
    const res = await fetch("/api/wallet/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromWalletId: transferModal.id,
        toWalletId: transferToId,
        amount: parseFloat(transferAmount),
      }),
    });
    if (res.ok) {
      await fetchWallets();
      setTransferSuccess(true);
    }
    setTransferring(false);
  };

  // ── Send helpers ─────────────────────────────────────────────────────────────
  const resetSendModal = () => {
    setSendModal(null);
    setSendRecipient("");
    setSendLookup(null);
    setSendLookupError("");
    setSendAmount("");
    setSending(false);
    setSendSuccess(false);
  };

  const handleLookup = async () => {
    if (!sendModal || !sendRecipient.trim()) return;
    setSendLookupLoading(true);
    setSendLookup(null);
    setSendLookupError("");
    const res = await fetch(
      `/api/wallet/lookup?q=${encodeURIComponent(sendRecipient.trim())}&asset=${sendModal.asset}`
    );
    const data = await res.json();
    if (res.ok) {
      setSendLookup(data);
    } else {
      setSendLookupError(data.error ?? "Recipient not found");
    }
    setSendLookupLoading(false);
  };

  const canSubmitSend = () =>
    !!sendLookup &&
    !!sendAmount &&
    parseFloat(sendAmount) > 0 &&
    sendModal !== null &&
    parseFloat(sendAmount) <= sendModal.balance;

  const handleSend = async () => {
    if (!sendModal || !sendLookup || !canSubmitSend()) return;
    setSending(true);
    const res = await fetch("/api/wallet/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromWalletId: sendModal.id,
        toAddress: sendLookup.address,
        amount: parseFloat(sendAmount),
      }),
    });
    if (res.ok) {
      await fetchWallets();
      setSendSuccess(true);
    }
    setSending(false);
  };

  const totalUSD = wallets.reduce((sum, w) => sum + w.balance, 0);
  const transferDest = wallets.find((w) => w.id === transferToId);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Digital Currency Wallets" subtitle="Manage your stablecoin balances" />

      <main className="flex-1 p-6 space-y-6">
        {/* Total balance */}
        <div className="bg-gradient-to-br from-blue-950/50 via-[#061120] to-[#061120] border border-blue-600/20 rounded-2xl p-6">
          <div className="text-sm text-[#6b88b0] mb-1">Total Portfolio Value</div>
          <div className="text-4xl font-bold text-white mb-1">{formatCurrency(totalUSD)}</div>
          <div className="text-sm text-[#6b88b0]">{wallets.length} wallets across {[...new Set(wallets.map((w) => w.network))].join(", ")}</div>
        </div>

        {/* Wallet cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-[#061120] border border-[#0d2040] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {wallets.map((wallet) => {
              const color = assetColors[wallet.asset] || "#6366f1";
              return (
                <div
                  key={wallet.id}
                  className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 hover:border-blue-600/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: color }}
                      >
                        {wallet.asset[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{wallet.asset}</div>
                        <div className="text-xs text-[#6b88b0]">{wallet.network}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchWallets()}
                      className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-white">{wallet.balance.toFixed(2)}</div>
                    <div className="text-sm text-[#6b88b0]">{formatCurrency(wallet.balance)} USD</div>
                  </div>

                  {/* Address */}
                  <div className="bg-[#020c1b] border border-[#0d2040] rounded-lg p-2.5 flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-[#6b88b0]">{truncateAddress(wallet.address)}</span>
                    <button
                      onClick={() => handleCopy(wallet.address, wallet.id)}
                      className="text-[#6b88b0] hover:text-white ml-2"
                    >
                      {copied === wallet.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <Button size="sm" className="flex-1 text-xs" onClick={() => setDepositModal(wallet)}>
                      <Download className="w-3 h-3" />
                      Deposit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 text-xs"
                      onClick={() => { setTransferModal(wallet); setTransferToId(""); }}
                      disabled={wallets.length < 2}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      Transfer
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 text-xs"
                      onClick={() => setSendModal(wallet)}
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Network info */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Supported Networks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Base", desc: "Low fees, fast finality. Powered by Coinbase.", assets: ["USDC", "DAI"] },
              { name: "BNB Smart Chain (BSC)", desc: "High throughput, EVM-compatible chain.", assets: ["USDT", "USDC"] },
            ].map((n) => (
              <div key={n.name} className="flex items-start gap-3 p-4 bg-[#020c1b] border border-[#0d2040] rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{n.name}</div>
                  <div className="text-xs text-[#6b88b0] mt-0.5">{n.desc}</div>
                  <div className="flex gap-1 mt-2">
                    {n.assets.map((a) => (
                      <span
                        key={a}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: assetColors[a] + "22", color: assetColors[a] }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Deposit modal ─────────────────────────────────────────────────────── */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#0d2040]">
              <div>
                <h2 className="text-lg font-semibold text-white">Deposit {depositModal.asset}</h2>
                <p className="text-xs text-[#6b88b0] mt-0.5">{depositModal.network} · {truncateAddress(depositModal.address)}</p>
              </div>
              <button onClick={resetDepositModal} className="p-2 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {depositSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Deposit Successful</h3>
                <p className="text-sm text-[#6b88b0] mb-1">
                  <span className="text-white font-medium">{formatCurrency(parseFloat(depositAmount))}</span> has been added to your {depositModal.asset} wallet.
                </p>
                {paymentMethod === "card" && (
                  <p className="text-xs text-[#6b88b0]">Charged to {cardBrand === "visa" ? "Visa" : "Mastercard"} ending in {cardNumber.replace(/\s/g, "").slice(-4)}</p>
                )}
                {paymentMethod === "mpesa" && (
                  <p className="text-xs text-[#6b88b0]">M-Pesa payment from +254{mpesaPhone}</p>
                )}
                <Button className="mt-6 w-full" onClick={resetDepositModal}>Done</Button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b88b0] text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-7"
                    />
                  </div>
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-[#6b88b0]">≈ {parseFloat(depositAmount).toFixed(2)} {depositModal.asset} credited</p>
                      {paymentMethod === "mpesa" && kesAmount && (
                        <p className="text-xs font-medium text-emerald-400">KES {kesAmount}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment method tabs */}
                <div>
                  <label className="block text-sm font-medium text-[#c0d4ef] mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === "card"
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                          : "border-[#0d2040] text-[#6b88b0] hover:border-[#1a3a60] hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === "mpesa"
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-[#0d2040] text-[#6b88b0] hover:border-[#1a3a60] hover:text-white"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      M-Pesa
                    </button>
                  </div>
                </div>

                {/* Card form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {(["visa", "mastercard"] as const).map((brand) => (
                        <button
                          key={brand}
                          onClick={() => setCardBrand(brand)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            cardBrand === brand
                              ? "border-blue-500/40 bg-blue-500/10 text-white"
                              : "border-[#0d2040] text-[#6b88b0] hover:border-[#1a3a60]"
                          }`}
                        >
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
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="font-mono tracking-wider"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Name on Card</label>
                      <input
                        type="text"
                        placeholder="JOHN DOE"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Expiry</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">CVV</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-[#6b88b0]">🔒 Your card details are encrypted and never stored.</p>
                  </div>
                )}

                {/* M-Pesa form */}
                {paymentMethod === "mpesa" && (
                  <div className="space-y-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-300">M-Pesa STK Push</span>
                      </div>
                      <p className="text-xs text-[#6b88b0]">Enter your Safaricom number. You&apos;ll receive a push notification to authorize the payment.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#6b88b0] mb-1.5">Phone Number</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b88b0] text-sm font-mono">+254</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="7XX XXX XXX"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                          className="pl-14 font-mono tracking-wider"
                        />
                      </div>
                    </div>

                    {/* KES breakdown */}
                    {kesAmount && (
                      <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6b88b0]">Amount (USD)</span>
                          <span className="text-white font-medium">{formatCurrency(parseFloat(depositAmount))}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6b88b0]">Rate</span>
                          <span className="text-[#6b88b0]">1 USD = {KES_RATE} KES</span>
                        </div>
                        <div className="border-t border-[#0d2040] pt-2 flex justify-between text-sm">
                          <span className="text-[#c0d4ef] font-medium">You Pay (KES)</span>
                          <span className="text-emerald-400 font-bold">KES {kesAmount}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-[#6b88b0]">Supported: Safaricom M-Pesa Kenya. Rate updates daily.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={resetDepositModal}>Cancel</Button>
                  <Button
                    className="flex-1"
                    loading={depositing}
                    onClick={handleDeposit}
                    disabled={!canSubmitDeposit()}
                  >
                    {paymentMethod === "mpesa" ? "Send STK Push" : "Pay Now"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Transfer modal ────────────────────────────────────────────────────── */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#0d2040]">
              <div>
                <h2 className="text-lg font-semibold text-white">Transfer Funds</h2>
                <p className="text-xs text-[#6b88b0] mt-0.5">Move balance between your wallets</p>
              </div>
              <button onClick={resetTransferModal} className="p-2 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Transfer Complete</h3>
                <p className="text-sm text-[#6b88b0]">
                  <span className="text-white font-medium">{parseFloat(transferAmount).toFixed(2)} {transferModal.asset}</span>
                  {" "}moved to{" "}
                  <span className="text-white font-medium">{transferDest?.asset ?? ""}</span> wallet.
                </p>
                <Button className="mt-6 w-full" onClick={resetTransferModal}>Done</Button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* From */}
                <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-4">
                  <p className="text-xs text-[#6b88b0] mb-1">From</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: assetColors[transferModal.asset] || "#6366f1" }}
                      >
                        {transferModal.asset[0]}
                      </div>
                      <span className="text-sm font-medium text-white">{transferModal.asset}</span>
                      <span className="text-xs text-[#6b88b0]">({transferModal.network})</span>
                    </div>
                    <span className="text-sm text-[#6b88b0]">Balance: <span className="text-white">{transferModal.balance.toFixed(2)}</span></span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#0d2040] flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">To Wallet</label>
                  {transferDestinations.length === 0 ? (
                    <p className="text-sm text-[#6b88b0] py-2">No other wallets available.</p>
                  ) : (
                    <div className="space-y-2">
                      {transferDestinations.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setTransferToId(w.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            transferToId === w.id
                              ? "border-blue-500/50 bg-blue-500/10"
                              : "border-[#0d2040] hover:border-[#1a3a60]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: assetColors[w.asset] || "#6366f1" }}
                            >
                              {w.asset[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{w.asset}</div>
                              <div className="text-xs text-[#6b88b0]">{w.network}</div>
                            </div>
                          </div>
                          <span className="text-xs text-[#6b88b0]">{w.balance.toFixed(2)} {w.asset}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({transferModal.asset})</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={transferModal.balance}
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full pr-20"
                    />
                    <button
                      onClick={() => setTransferAmount(transferModal.balance.toFixed(2))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Max
                    </button>
                  </div>
                  {transferAmount && parseFloat(transferAmount) > transferModal.balance && (
                    <p className="text-xs text-red-400 mt-1">Exceeds available balance</p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={resetTransferModal}>Cancel</Button>
                  <Button
                    className="flex-1"
                    loading={transferring}
                    onClick={handleTransfer}
                    disabled={!canSubmitTransfer()}
                  >
                    Transfer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Send modal ───────────────────────────────────────────────────────── */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#0d2040]">
              <div>
                <h2 className="text-lg font-semibold text-white">Send {sendModal.asset}</h2>
                <p className="text-xs text-[#6b88b0] mt-0.5">Send to another person&apos;s wallet</p>
              </div>
              <button onClick={resetSendModal} className="p-2 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sendSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Sent!</h3>
                <p className="text-sm text-[#6b88b0]">
                  <span className="text-white font-medium">{parseFloat(sendAmount).toFixed(2)} {sendModal.asset}</span>
                  {" "}sent to{" "}
                  <span className="text-white font-medium">{sendLookup?.name ?? sendLookup?.email}</span>.
                </p>
                <Button className="mt-6 w-full" onClick={resetSendModal}>Done</Button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* From */}
                <div className="bg-[#020c1b] border border-[#0d2040] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: assetColors[sendModal.asset] || "#6366f1" }}
                    >
                      {sendModal.asset[0]}
                    </div>
                    <span className="text-sm font-medium text-white">{sendModal.asset}</span>
                    <span className="text-xs text-[#6b88b0]">{sendModal.network}</span>
                  </div>
                  <span className="text-xs text-[#6b88b0]">Balance: <span className="text-white">{sendModal.balance.toFixed(2)}</span></span>
                </div>

                {/* Recipient lookup */}
                <div>
                  <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Recipient</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Email or wallet address (0x…)"
                      value={sendRecipient}
                      onChange={(e) => {
                        setSendRecipient(e.target.value);
                        setSendLookup(null);
                        setSendLookupError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleLookup}
                      loading={sendLookupLoading}
                      disabled={!sendRecipient.trim()}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-[#6b88b0] mt-1">Enter an email address or a 0x wallet address</p>

                  {/* Error */}
                  {sendLookupError && (
                    <p className="text-xs text-red-400 mt-2">{sendLookupError}</p>
                  )}

                  {/* Recipient preview */}
                  {sendLookup && (
                    <div className="mt-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0d2040] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#6b88b0]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{sendLookup.name}</div>
                        <div className="text-xs text-[#6b88b0] truncate">{sendLookup.email}</div>
                        <div className="text-xs font-mono text-[#6b88b0] truncate mt-0.5">{truncateAddress(sendLookup.address)}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-auto" />
                    </div>
                  )}
                </div>

                {/* Amount — only show once recipient is confirmed */}
                {sendLookup && (
                  <div>
                    <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Amount ({sendModal.asset})</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={sendModal.balance}
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        className="w-full pr-14"
                      />
                      <button
                        onClick={() => setSendAmount(sendModal.balance.toFixed(2))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Max
                      </button>
                    </div>
                    {sendAmount && parseFloat(sendAmount) > sendModal.balance && (
                      <p className="text-xs text-red-400 mt-1">Exceeds available balance</p>
                    )}
                    {sendAmount && parseFloat(sendAmount) > 0 && parseFloat(sendAmount) <= sendModal.balance && (
                      <p className="text-xs text-[#6b88b0] mt-1">{formatCurrency(parseFloat(sendAmount))} will be deducted from your {sendModal.asset} wallet</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={resetSendModal}>Cancel</Button>
                  <Button
                    className="flex-1"
                    loading={sending}
                    onClick={handleSend}
                    disabled={!canSubmitSend()}
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
