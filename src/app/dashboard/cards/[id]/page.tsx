"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import VirtualCardFace from "@/components/ui/VirtualCardFace";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft, ArrowUpRight, Globe, Link2, CreditCard,
  ShoppingCart, TrendingUp, BarChart3, ChevronLeft, ChevronRight,
  Flame, Timer, Snowflake,
} from "lucide-react";
import Link from "next/link";

interface CardData {
  id: string;
  label: string;
  color: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  cardHolder: string;
  brand: string;
  status: string;
  balance: number;
  spendLimit: number;
  spentAmount: number;
  currency: string;
  nfcEnabled: boolean;
  oneTimeUse: boolean;
  freezeUntil: string | null;
  fiatWalletId: string | null;
  fiatWallet: { id: string; currency: string; name: string | null; balance: number } | null;
  wallet: { id: string; asset: string; network: string } | null;
}

interface Txn {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  merchant?: string;
  category?: string;
  reference: string;
  createdAt: string;
  status?: string;
  metadata?: string;
}

const TYPE_COLORS: Record<string, string> = {
  CARD_PAYMENT: "text-red-400",
  CARD_FUNDING:  "text-emerald-400",
  DEPOSIT:       "text-emerald-400",
  CONVERSION:    "text-violet-400",
};

const TYPE_BG: Record<string, string> = {
  CARD_PAYMENT: "bg-red-500/10",
  CARD_FUNDING:  "bg-emerald-500/10",
  DEPOSIT:       "bg-emerald-500/10",
  CONVERSION:    "bg-violet-500/10",
};

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardData | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/cards/${id}/transactions?page=${page}`);
    if (!res.ok) { router.push("/dashboard/cards"); return; }
    const data = await res.json();
    setCard(data.card);
    setTxns(data.transactions);
    setTotalPages(data.pages);
    setTotal(data.total);
    setLoading(false);
  }, [id, page, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Category analytics from current page
  const catMap: Record<string, number> = {};
  txns.forEach((t) => {
    if (t.type === "CARD_PAYMENT") {
      const cat = t.category ?? "Other";
      catMap[cat] = (catMap[cat] ?? 0) + t.amount;
    }
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats[0]?.[1] ?? 0;
  const catColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

  const totalSpend = txns.filter((t) => t.type === "CARD_PAYMENT").reduce((s, t) => s + t.amount, 0);

  if (!card && !loading) return null;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title={card?.label ?? "Card Detail"} subtitle="Transaction history & analytics" />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Back */}
        <Link href="/dashboard/cards" className="inline-flex items-center gap-1.5 text-sm text-[#6b88b0] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Cards
        </Link>

        {loading && !card ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : card ? (
          <>
            {/* Card header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="max-w-sm">
                <VirtualCardFace
                  color={card.color}
                  label={card.label}
                  cardHolder={card.cardHolder}
                  cardNumber={card.cardNumber}
                  expiryMonth={card.expiryMonth}
                  expiryYear={card.expiryYear}
                  status={card.status}
                  brand={card.brand}
                  nfcEnabled={card.nfcEnabled}
                />
              </div>

              <div className="space-y-3">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    card.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    card.status === "FROZEN" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>{card.status}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium border border-[#0d2040] text-[#6b88b0]">{card.brand}</span>
                  {card.oneTimeUse && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> One-time use
                    </span>
                  )}
                  {card.freezeUntil && card.status === "FROZEN" && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Timed freeze
                    </span>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-3">
                    <div className="text-[10px] text-[#6b88b0] uppercase tracking-wider mb-1">
                      {card.fiatWallet ? "Wallet Balance" : "Card Balance"}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {card.fiatWallet
                        ? `${card.fiatWallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${card.fiatWallet.currency}`
                        : formatCurrency(card.balance)}
                    </div>
                  </div>
                  <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-3">
                    <div className="text-[10px] text-[#6b88b0] uppercase tracking-wider mb-1">Total Spent</div>
                    <div className="text-lg font-bold text-white">{formatCurrency(card.spentAmount)}</div>
                  </div>
                  <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-3">
                    <div className="text-[10px] text-[#6b88b0] uppercase tracking-wider mb-1">Spend Limit</div>
                    <div className="text-lg font-bold text-white">
                      {card.spendLimit === 0 ? "No Limit" : formatCurrency(card.spendLimit)}
                    </div>
                  </div>
                  <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-3">
                    <div className="text-[10px] text-[#6b88b0] uppercase tracking-wider mb-1">Transactions</div>
                    <div className="text-lg font-bold text-white">{total}</div>
                  </div>
                </div>

                {/* Linked wallet */}
                {card.fiatWallet ? (
                  <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-blue-300">{card.fiatWallet.currency} wallet</div>
                      <div className="text-[10px] text-[#6b88b0]">{card.fiatWallet.name ?? "Multi-Currency Wallet"}</div>
                    </div>
                  </div>
                ) : card.wallet ? (
                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-emerald-300">{card.wallet.asset}</div>
                      <div className="text-[10px] text-[#6b88b0]">{card.wallet.network}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-[#020c1b] border border-dashed border-[#0d2040] rounded-xl px-3 py-2.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#6b88b0]" />
                    <span className="text-xs text-[#6b88b0]">No wallet linked</span>
                  </div>
                )}

                {card.spendLimit > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-[#6b88b0] mb-1.5">
                      <span>Spend progress</span>
                      <span>{Math.min(100, Math.round((card.spentAmount / card.spendLimit) * 100))}%</span>
                    </div>
                    <div className="h-2 bg-[#0d2040] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(100, (card.spentAmount / card.spendLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category analytics */}
            {topCats.length > 0 && (
              <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-semibold text-white">Spending Breakdown</h2>
                    <span className="text-xs text-[#6b88b0]">(this page)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6b88b0]">
                    <TrendingUp className="w-3 h-3" />
                    <span>{formatCurrency(totalSpend)} total</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {topCats.map(([cat, amt], i) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-[#6b88b0] w-28 shrink-0 truncate">{cat}</span>
                      <div className="flex-1 h-2 bg-[#0d2040] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(amt / maxCat) * 100}%`, backgroundColor: catColors[i] }} />
                      </div>
                      <span className="text-xs text-white font-medium w-16 text-right shrink-0">{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction list */}
            <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#0d2040]">
                <h2 className="text-sm font-semibold text-white">Transaction History</h2>
                <span className="text-xs text-[#6b88b0]">{total} total</span>
              </div>

              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : txns.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCart className="w-10 h-10 text-[#0d2040] mx-auto mb-3" />
                  <p className="text-sm text-[#6b88b0]">No transactions yet</p>
                </div>
              ) : (
                <div>
                  {txns.map((t) => {
                    const isDebit = t.type === "CARD_PAYMENT";
                    const label = t.merchant || t.description || t.type.replace(/_/g, " ");
                    const paymentMethod = (() => {
                      try { return JSON.parse(t.metadata ?? "{}").paymentMethod; } catch { return null; }
                    })();
                    return (
                      <div key={t.id} className="flex items-center justify-between px-5 py-4 border-b border-[#0d2040] last:border-0 hover:bg-[#0d2040]/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_BG[t.type] ?? "bg-blue-500/10"}`}>
                            <ArrowUpRight className={`w-4 h-4 ${TYPE_COLORS[t.type] ?? "text-blue-400"}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{label}</div>
                            <div className="text-xs text-[#6b88b0]">
                              {formatDateTime(t.createdAt)}
                              {t.category && <span className="ml-2 text-[#4a6080]">· {t.category}</span>}
                              {paymentMethod === "nfc" && <span className="ml-2 text-emerald-400/70">· NFC</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
                            {isDebit ? "-" : "+"}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.currency}
                          </div>
                          {t.status && (
                            <div className="text-[10px] text-[#6b88b0] mt-0.5">{t.status}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-[#0d2040]">
                  <span className="text-xs text-[#6b88b0]">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 text-[#6b88b0] hover:text-white bg-[#020c1b] border border-[#0d2040] rounded-lg disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 text-[#6b88b0] hover:text-white bg-[#020c1b] border border-[#0d2040] rounded-lg disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
