import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/dashboard/TopBar";
import Link from "next/link";
import { formatCurrency, formatDateTime, getTransactionColor, maskCardNumber } from "@/lib/utils";
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [wallets, cards, recentTxns] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: session.id } }),
    prisma.virtualCard.findMany({ where: { userId: session.id, status: { not: "TERMINATED" } } }),
    prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance.toNumber(), 0);
  const activeCards = cards.filter((c) => c.status === "ACTIVE").length;
  const monthlySpend = recentTxns
    .filter((t) => t.type === "CARD_PAYMENT" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);

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
              <div className="space-y-3">
                {cards.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded" style={{ backgroundColor: c.color + "33", border: `1px solid ${c.color}44` }}>
                        <div className="w-full h-full rounded flex items-center justify-center">
                          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: c.color + "66" }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{c.label}</div>
                        <div className="text-xs text-[#6b88b0] font-mono">{maskCardNumber(c.cardNumber)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-0.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {c.status}
                      </div>
                      <div className="text-xs text-[#6b88b0] mt-0.5">{formatCurrency(c.spendLimit.toNumber())} limit</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                const isCredit = ["DEPOSIT"].includes(t.type);
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
