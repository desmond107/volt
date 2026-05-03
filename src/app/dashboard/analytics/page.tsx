import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/dashboard/TopBar";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, CreditCard, ArrowUpRight, BarChart3 } from "lucide-react";

function SpendBar({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((amount / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6b88b0] w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[#0d2040] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-white font-medium w-20 text-right shrink-0">{formatCurrency(amount)}</span>
    </div>
  );
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 100 / (data.length - 1);
  const points = data.map((v, i) => `${i * w},${100 - (v / max) * 80}`).join(" ");
  return (
    <svg viewBox={`0 0 100 100`} className="w-full h-12" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={color}
        opacity="0.08"
        strokeWidth="0"
      />
    </svg>
  );
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [allTxns, cards] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.id, createdAt: { gte: sixMonthsAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.virtualCard.findMany({ where: { userId: session.id } }),
  ]);

  const thisMonthTxns = allTxns.filter((t) => t.createdAt >= startOfMonth);
  const lastMonthTxns = allTxns.filter((t) => t.createdAt >= startOfLastMonth && t.createdAt <= endOfLastMonth);

  const calcSpend = (txns: typeof allTxns) =>
    txns
      .filter((t) => t.type === "CARD_PAYMENT" && t.status === "COMPLETED")
      .reduce((s, t) => s + t.amount.toNumber(), 0);

  const calcDeposits = (txns: typeof allTxns) =>
    txns
      .filter((t) => t.type === "DEPOSIT" && t.status === "COMPLETED")
      .reduce((s, t) => s + t.amount.toNumber(), 0);

  const thisMonthSpend = calcSpend(thisMonthTxns);
  const lastMonthSpend = calcSpend(lastMonthTxns);
  const thisMonthDeposits = calcDeposits(thisMonthTxns);
  const spendChange = lastMonthSpend > 0 ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100 : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  allTxns
    .filter((t) => t.type === "CARD_PAYMENT" && t.status === "COMPLETED" && t.createdAt >= startOfMonth)
    .forEach((t) => {
      const cat = t.category ?? "Other";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount.toNumber();
    });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCategory = categories[0]?.[1] ?? 0;

  const catColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#0d9488", "#ea580c"];

  // Monthly spend for last 6 months
  const monthlyData: { label: string; spend: number; deposits: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const mTxns = allTxns.filter((t) => t.createdAt >= mStart && t.createdAt <= mEnd);
    monthlyData.push({
      label: mStart.toLocaleDateString("en-US", { month: "short" }),
      spend: calcSpend(mTxns),
      deposits: calcDeposits(mTxns),
    });
  }

  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.spend, m.deposits)), 1);

  // Top merchants
  const merchantMap: Record<string, number> = {};
  thisMonthTxns
    .filter((t) => t.type === "CARD_PAYMENT" && t.status === "COMPLETED" && t.merchant)
    .forEach((t) => {
      const m = t.merchant!;
      merchantMap[m] = (merchantMap[m] ?? 0) + t.amount.toNumber();
    });
  const topMerchants = Object.entries(merchantMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const totalTransactions = allTxns.filter((t) => t.createdAt >= startOfMonth).length;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Analytics" subtitle="Spending insights and trends" userName={session.name} />

      <main className="flex-1 p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">This Month Spend</span>
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold text-white">{formatCurrency(thisMonthSpend)}</div>
            <div className={`flex items-center gap-1 mt-1 text-xs ${spendChange <= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {spendChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              <span>{Math.abs(spendChange).toFixed(1)}% vs last month</span>
            </div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Deposits In</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{formatCurrency(thisMonthDeposits)}</div>
            <div className="text-xs text-[#6b88b0] mt-1">This month</div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Transactions</span>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">{totalTransactions}</div>
            <div className="text-xs text-[#6b88b0] mt-1">This month</div>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b88b0] uppercase tracking-wider">Active Cards</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">{cards.filter((c) => c.status === "ACTIVE").length}</div>
            <div className="text-xs text-[#6b88b0] mt-1">{cards.length} total</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly bar chart */}
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">6-Month Overview</h2>
            <div className="space-y-2 mb-4">
              {monthlyData.map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#6b88b0]">
                    <span>{m.label}</span>
                    <span>{formatCurrency(m.spend)}</span>
                  </div>
                  <div className="h-2 bg-[#0d2040] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500/70 transition-all"
                      style={{ width: `${(m.spend / maxMonthly) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#0d2040] pt-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#6b88b0]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" /> Spend
                </div>
              </div>
            </div>
            {/* Mini trend line */}
            <div className="mt-3">
              <MiniChart data={monthlyData.map((m) => m.spend)} color="#6366f1" />
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Spending by Category</h2>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#6b88b0]">No card payments this month</div>
            ) : (
              <div className="space-y-3">
                {categories.map(([cat, amt], i) => (
                  <SpendBar key={cat} label={cat} amount={amt} max={maxCategory} color={catColors[i % catColors.length]} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top merchants */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Merchants This Month</h2>
          {topMerchants.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#6b88b0]">No merchant activity this month</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topMerchants.map(([merchant, amount], i) => (
                <div key={merchant} className="flex items-center gap-3 bg-[#020c1b] border border-[#0d2040] rounded-xl p-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: catColors[i % catColors.length] + "33", border: `1px solid ${catColors[i % catColors.length]}44` }}
                  >
                    {merchant[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{merchant}</div>
                    <div className="text-xs text-[#6b88b0]">{formatCurrency(amount)}</div>
                  </div>
                  <div
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                    style={{ backgroundColor: catColors[i % catColors.length] + "55" }}
                  >
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards spend utilization */}
        {cards.length > 0 && (
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Card Utilization</h2>
            <div className="space-y-4">
              {cards.filter((c) => c.status !== "TERMINATED").map((c, i) => {
                const pct = c.spendLimit.toNumber() > 0
                  ? Math.min((c.spentAmount.toNumber() / c.spendLimit.toNumber()) * 100, 100)
                  : 0;
                const color = pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : catColors[i % catColors.length];
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{c.label}</span>
                      <span className="text-[#6b88b0]">
                        {formatCurrency(c.spentAmount.toNumber())} / {formatCurrency(c.spendLimit.toNumber())}
                      </span>
                    </div>
                    <div className="h-2 bg-[#0d2040] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
