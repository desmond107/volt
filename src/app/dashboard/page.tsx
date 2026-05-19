import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/dashboard/TopBar";
import DismissibleKycBanner from "@/components/dashboard/DismissibleKycBanner";
import Sparkline from "@/components/ui/Sparkline";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDateTime, getTransactionColor } from "@/lib/utils";
import { FALLBACK_RATES, CURRENCY_SYMBOLS } from "@/lib/rates";
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Plus,
  CheckCircle2,
  Circle,
  BarChart3,
  Globe,
  RefreshCw,
  Send,
} from "lucide-react";

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? "";
  const n = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sym ? `${sym}${n}` : `${n} ${currency}`;
}

function fiatToUsd(amount: number, currency: string, rates: Record<string, number>) {
  if (currency === "USD") return amount;
  const rate = rates[currency];
  if (!rate) return 0;
  return amount / rate;
}

function OnboardingChecklist({
  hasWallet,
  hasFiatWallet,
  hasCard,
  kycVerified,
  hasTxn,
}: {
  hasWallet: boolean;
  hasFiatWallet: boolean;
  hasCard: boolean;
  kycVerified: boolean;
  hasTxn: boolean;
}) {
  const steps = [
    { done: true,                    label: "Create your account",           href: null },
    { done: hasWallet || hasFiatWallet, label: "Add your first wallet",      href: "/dashboard/wallet" },
    { done: kycVerified,             label: "Complete KYC verification",     href: "/dashboard/kyc" },
    { done: hasCard,                 label: "Issue your first virtual card", href: "/dashboard/cards" },
    { done: hasTxn,                  label: "Make your first transaction",   href: "/dashboard/cards" },
  ];
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  if (completed === steps.length) return null;

  return (
    <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Get started with Volt</h2>
        <span className="text-xs text-[#6b88b0]">{completed}/{steps.length} done</span>
      </div>
      <div className="h-1.5 bg-[#0d2040] rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 ${s.done ? "opacity-50" : ""}`}>
            {s.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-[#6b88b0] shrink-0" />
            )}
            {s.href && !s.done ? (
              <Link href={s.href} className="text-sm text-blue-300 hover:text-blue-200 transition-colors">
                {s.label}
              </Link>
            ) : (
              <span className={`text-sm ${s.done ? "line-through text-[#6b88b0]" : "text-white"}`}>{s.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const quickActions = [
  { label: "Send",       icon: Send,       href: "/dashboard/wallet",       color: "text-blue-400",    bg: "rgba(59,130,246,0.08)",   hoverBg: "rgba(59,130,246,0.16)"   },
  { label: "Receive",    icon: ArrowDownRight, href: "/dashboard/wallet",   color: "text-emerald-400", bg: "rgba(16,185,129,0.08)",   hoverBg: "rgba(16,185,129,0.16)"   },
  { label: "Convert",    icon: RefreshCw,  href: "/dashboard/wallet",       color: "text-amber-400",   bg: "rgba(245,158,11,0.08)",   hoverBg: "rgba(245,158,11,0.16)"   },
  { label: "Issue Card", icon: CreditCard, href: "/dashboard/cards",        color: "text-purple-400",  bg: "rgba(168,85,247,0.08)",   hoverBg: "rgba(168,85,247,0.16)"   },
];

const catColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

const txCategoryColors: Record<string, string> = {
  Shopping:      "bg-blue-500/10 text-blue-400",
  Food:          "bg-orange-500/10 text-orange-400",
  Travel:        "bg-cyan-500/10 text-cyan-400",
  Entertainment: "bg-purple-500/10 text-purple-400",
  Utilities:     "bg-yellow-500/10 text-yellow-400",
  Health:        "bg-emerald-500/10 text-emerald-400",
  Other:         "bg-[#0d2040] text-[#6b88b0]",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [wallets, fiatWallets, cards, recentTxns, monthlyTxns, monthlyFiatTxns] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: session.id } }),
    prisma.fiatWallet.findMany({ where: { userId: session.id }, orderBy: { createdAt: "asc" } }),
    prisma.virtualCard.findMany({ where: { userId: session.id, status: { not: "TERMINATED" } } }),
    prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { card: { select: { label: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId: session.id, createdAt: { gte: startOfMonth }, type: "CARD_PAYMENT", status: "COMPLETED" },
    }),
    prisma.fiatTransaction.findMany({
      where: { userId: session.id, createdAt: { gte: startOfMonth }, type: "CARD_PAYMENT" },
    }),
  ]);

  const cryptoTotal = wallets.reduce((s, w) => s + w.balance.toNumber(), 0);
  const fiatTotalUsd = fiatWallets.reduce((s, w) => s + fiatToUsd(w.balance.toNumber(), w.currency, FALLBACK_RATES), 0);
  const totalBalance = cryptoTotal + fiatTotalUsd;

  const activeCards = cards.filter((c) => c.status === "ACTIVE").length;

  const monthlySpend =
    monthlyTxns.reduce((s, t) => s + t.amount.toNumber(), 0) +
    monthlyFiatTxns.reduce((s, t) => s + fiatToUsd(t.amount.toNumber(), t.currency, FALLBACK_RATES), 0);

  const categoryMap: Record<string, number> = {};
  monthlyTxns.forEach((t) => {
    const cat = t.category ?? "Other";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount.toNumber();
  });
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCategories[0]?.[1] ?? 0;

  const hasTxn = recentTxns.length > 0;
  const walletCount = wallets.length + fiatWallets.length;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Overview" userName={session.name} />

      <main className="flex-1 p-6 space-y-6">
        {/* KYC banner */}
        <DismissibleKycBanner kycStatus={session.kycStatus} />

        {/* Onboarding checklist */}
        <OnboardingChecklist
          hasWallet={wallets.length > 0}
          hasFiatWallet={fiatWallets.length > 0}
          hasCard={cards.length > 0}
          kycVerified={session.kycStatus === "VERIFIED"}
          hasTxn={hasTxn}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, href, color, bg }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-[#0d2040] transition-all duration-200 hover:border-[#1a3a60] hover:-translate-y-0.5"
              style={{ backgroundColor: bg }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-[#0d2040] bg-[#040f1c] group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs font-medium text-white">{label}</span>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 hover:border-blue-500/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.08)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Total Balance</span>
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>Across {walletCount} wallet{walletCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 hover:border-amber-500/30 hover:shadow-[0_0_24px_rgba(245,158,11,0.08)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Active Cards</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{activeCards}</div>
            <div className="text-xs text-[#6b88b0] mt-1">{cards.length} total issued</div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_24px_rgba(168,85,247,0.08)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Monthly Spend</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(monthlySpend)}</div>
            <div className="text-xs text-[#6b88b0] mt-1">This month (USD equiv.)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crypto wallets */}
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Stablecoin Wallets</h2>
              <Link href="/dashboard/wallet" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            <div className="space-y-3">
              {wallets.map((w) => {
                const colors: Record<string, string> = { USDC: "bg-blue-500", USDT: "bg-emerald-500", DAI: "bg-yellow-500" };
                return (
                  <div key={w.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[#0d2040]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${colors[w.asset] || "bg-blue-600"} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {w.asset[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{w.asset}</div>
                        <div className="text-xs text-[#6b88b0]">{w.network}</div>
                      </div>
                    </div>
                    <Sparkline seed={w.id} balance={w.balance.toNumber()} />
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatCurrency(w.balance.toNumber())}</div>
                      <div className="text-xs text-[#6b88b0]">{w.balance.toNumber().toFixed(2)} {w.asset}</div>
                    </div>
                  </div>
                );
              })}
              {wallets.length === 0 && (
                <div className="text-center py-8">
                  <Wallet className="w-10 h-10 text-[#0d2040] mx-auto mb-3" />
                  <p className="text-sm text-[#6b88b0] mb-3">No stablecoin wallets yet</p>
                  <Link href="/dashboard/wallet">
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" />Add Wallet</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Multi-currency wallets */}
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Multi-Currency Wallets</h2>
              </div>
              <Link href="/dashboard/multi-wallet" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            <div className="space-y-3">
              {fiatWallets.slice(0, 5).map((w) => (
                <div key={w.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0d2040]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold">
                      {w.currency.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{w.currency}</div>
                      <div className="text-xs text-[#6b88b0]">{w.name ?? "Wallet"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{fmt(w.balance.toNumber(), w.currency)}</div>
                    <div className="text-xs text-[#6b88b0]">≈ {formatCurrency(fiatToUsd(w.balance.toNumber(), w.currency, FALLBACK_RATES))}</div>
                  </div>
                </div>
              ))}
              {fiatWallets.length === 0 && (
                <div className="text-center py-8">
                  <Globe className="w-10 h-10 text-[#0d2040] mx-auto mb-3" />
                  <p className="text-sm text-[#6b88b0] mb-3">No multi-currency wallets yet</p>
                  <Link href="/dashboard/multi-wallet">
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" />Add Wallet</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spend by category */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Spend by Category</h2>
            <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              All transactions →
            </Link>
          </div>
          {topCategories.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-10 h-10 text-[#0d2040] mx-auto mb-3" />
              <p className="text-sm text-[#6b88b0]">No card spend this month</p>
              <p className="text-xs text-[#4a6080] mt-1">Transactions will appear here after you use your card</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([cat, amt], i) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-[#6b88b0] w-24 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-2 bg-[#0d2040] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(amt / maxCat) * 100}%`, backgroundColor: catColors[i] }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium w-16 text-right shrink-0">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Virtual Cards</h2>
            <Link href="/dashboard/cards" className="text-xs text-blue-400 hover:text-blue-300">Manage →</Link>
          </div>
          {cards.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-10 rounded-lg bg-[#0d2040] mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-8 h-6 text-[#1a3a60]" />
              </div>
              <p className="text-sm font-medium text-white mb-1">No cards issued yet</p>
              <p className="text-xs text-[#6b88b0] mb-4">Issue your first virtual card in seconds</p>
              <Link href="/dashboard/cards">
                <Button size="sm" variant="outline"><Plus className="w-4 h-4" />Issue a Card</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.slice(0, 3).map((c) => (
                <Link key={c.id} href={`/dashboard/cards/${c.id}`}>
                  <div className="flex items-center justify-between bg-[#020c1b] border border-[#0d2040] rounded-xl p-3 hover:border-blue-500/30 hover:shadow-[0_0_16px_rgba(59,130,246,0.08)] transition-all duration-200 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded" style={{ backgroundColor: c.color + "33", border: `1px solid ${c.color}44` }}>
                        <div className="w-full h-full rounded flex items-center justify-center">
                          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: c.color + "66" }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{c.label}</div>
                        <div className="text-xs text-[#6b88b0]">
                          {c.spendLimit.toNumber() === 0 ? "No limit" : `${formatCurrency(c.spendLimit.toNumber())} limit`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`text-xs px-2 py-0.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {c.status}
                      </div>
                      {c.oneTimeUse && (
                        <div className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">1×</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {recentTxns.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-[#0d2040] mx-auto mb-3 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-[#1a3a60]" />
              </div>
              <p className="text-sm font-medium text-white mb-1">No transactions yet</p>
              <p className="text-xs text-[#6b88b0]">Spend with your card and transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTxns.map((t) => {
                const isCredit = t.type === "DEPOSIT" || (t.type === "TRANSFER" && t.reference?.endsWith("-IN"));
                const cat = t.category ?? null;
                const catClass = cat ? (txCategoryColors[cat] ?? txCategoryColors.Other) : null;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#0d2040]/50 transition-colors border-b border-[#0d2040] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                        {isCredit
                          ? <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                          : <ArrowUpRight className="w-4 h-4 text-red-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">
                            {t.merchant || t.description || t.type.replace("_", " ")}
                          </span>
                          {cat && catClass && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${catClass}`}>
                              {cat}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#6b88b0] mt-0.5">
                          {formatDateTime(t.createdAt)}
                          {t.card && <span className="ml-2">· {t.card.label}</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${getTransactionColor(t.type)}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(t.amount.toNumber(), t.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
