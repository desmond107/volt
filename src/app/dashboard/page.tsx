import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/dashboard/TopBar";
import Link from "next/link";
import { formatCurrency, formatDateTime, getTransactionColor } from "@/lib/utils";
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  Plus,
  CheckCircle2,
  Circle,
  BarChart3,
} from "lucide-react";
import Button from "@/components/ui/Button";

function OnboardingChecklist({
  hasWallet,
  hasCard,
  kycVerified,
  hasTxn,
}: {
  hasWallet: boolean;
  hasCard: boolean;
  kycVerified: boolean;
  hasTxn: boolean;
}) {
  const steps = [
    { done: true, label: "Create your account", href: null },
    { done: hasWallet, label: "Add a stablecoin wallet", href: "/dashboard/wallet" },
    { done: kycVerified, label: "Complete KYC verification", href: "/dashboard/kyc" },
    { done: hasCard, label: "Issue your first virtual card", href: "/dashboard/cards" },
    { done: hasTxn, label: "Make your first transaction", href: "/dashboard/cards" },
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
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
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

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [wallets, cards, recentTxns, monthlyTxns] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: session.id } }),
    prisma.virtualCard.findMany({ where: { userId: session.id, status: { not: "TERMINATED" } } }),
    prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { userId: session.id, createdAt: { gte: startOfMonth }, type: "CARD_PAYMENT", status: "COMPLETED" },
    }),
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance.toNumber(), 0);
  const activeCards = cards.filter((c) => c.status === "ACTIVE").length;
  const monthlySpend = monthlyTxns.reduce((sum, t) => sum + t.amount.toNumber(), 0);

  // Category breakdown for current month
  const categoryMap: Record<string, number> = {};
  monthlyTxns.forEach((t) => {
    const cat = t.category ?? "Other";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount.toNumber();
  });
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCategories[0]?.[1] ?? 0;
  const catColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

  // Onboarding state
  const hasTxn = recentTxns.length > 0;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Overview" subtitle={`Welcome back, ${session.name?.split(" ")[0] ?? "there"}`} userName={session.name} />

      <main className="flex-1 p-6 space-y-6">
        {/* KYC banner */}
        {session.kycStatus !== "VERIFIED" && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Complete KYC to unlock card issuance</p>
                <p className="text-xs text-yellow-400/70">Verify your identity in under 3 minutes</p>
              </div>
            </div>
            <Link href="/dashboard/kyc">
              <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 whitespace-nowrap">
                Verify Now
              </Button>
            </Link>
          </div>
        )}

        {/* Onboarding checklist */}
        <OnboardingChecklist
          hasWallet={wallets.length > 0}
          hasCard={cards.length > 0}
          kycVerified={session.kycStatus === "VERIFIED"}
          hasTxn={hasTxn}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Total Balance</span>
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>Across {wallets.length} wallets</span>
            </div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Active Cards</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{activeCards}</div>
            <div className="text-xs text-[#6b88b0] mt-1">{cards.length} total issued</div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Monthly Spend</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(monthlySpend)}</div>
            <div className="text-xs text-[#6b88b0] mt-1">This month</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallets */}
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Stablecoin Wallets</h2>
              <Link href="/dashboard/wallet" className="text-xs text-blue-400 hover:text-blue-300">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {wallets.map((w) => {
                const colors: Record<string, string> = { USDC: "bg-blue-500", USDT: "bg-emerald-500", DAI: "bg-yellow-500" };
                return (
                  <div key={w.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${colors[w.asset] || "bg-blue-600"} flex items-center justify-center text-white text-xs font-bold`}>
                        {w.asset[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{w.asset}</div>
                        <div className="text-xs text-[#6b88b0]">{w.network}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatCurrency(w.balance.toNumber())}</div>
                      <div className="text-xs text-[#6b88b0]">{w.balance.toNumber().toFixed(2)} {w.asset}</div>
                    </div>
                  </div>
                );
              })}
              {wallets.length === 0 && (
                <p className="text-sm text-[#6b88b0] text-center py-4">No wallets found</p>
              )}
            </div>
          </div>

          {/* Spending by category */}
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Spend by Category</h2>
              <Link href="/dashboard/analytics" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Analytics →
              </Link>
            </div>
            {topCategories.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-[#0d2040] mx-auto mb-2" />
                <p className="text-sm text-[#6b88b0]">No card spend this month</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCategories.map(([cat, amt], i) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-[#6b88b0] w-24 shrink-0 truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-[#0d2040] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(amt / maxCat) * 100}%`, backgroundColor: catColors[i] }}
                      />
                    </div>
                    <span className="text-xs text-white font-medium w-16 text-right shrink-0">{formatCurrency(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Virtual Cards</h2>
            <Link href="/dashboard/cards" className="text-xs text-blue-400 hover:text-blue-300">
              Manage →
            </Link>
          </div>
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-[#0d2040] mx-auto mb-3" />
              <p className="text-sm text-[#6b88b0] mb-4">No cards issued yet</p>
              <Link href="/dashboard/cards">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                  Issue a Card
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-[#020c1b] border border-[#0d2040] rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-6 rounded" style={{ backgroundColor: c.color + "33", border: `1px solid ${c.color}44` }}>
                      <div className="w-full h-full rounded flex items-center justify-center">
                        <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: c.color + "66" }} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{c.label}</div>
                      <div className="text-xs text-[#6b88b0]">{formatCurrency(c.spendLimit.toNumber())} limit</div>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                    {c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300">
              View all →
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6b88b0]">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((t) => {
                const isCredit = t.type === "DEPOSIT" || (t.type === "TRANSFER" && t.reference?.endsWith("-IN"));
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#0d2040] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                        {isCredit ? (
                          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {t.merchant || t.description || t.type.replace("_", " ")}
                        </div>
                        <div className="text-xs text-[#6b88b0]">{formatDateTime(t.createdAt)}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${getTransactionColor(t.type)}`}>
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
