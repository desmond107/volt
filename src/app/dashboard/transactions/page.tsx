"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { formatCurrency, formatDateTime, getTransactionColor, getStatusColor } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, CreditCard, Search, Filter, Download } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  fee: number;
  currency: string;
  merchant?: string;
  category?: string;
  description?: string;
  reference: string;
  createdAt: string;
  card?: { label: string; cardNumber: string } | null;
}

const TYPES = ["ALL", "DEPOSIT", "CARD_PAYMENT", "WITHDRAWAL", "TRANSFER", "CARD_FUNDING", "CONVERSION"];

function exportCSV(transactions: Transaction[]) {
  const headers = ["Date", "Type", "Status", "Merchant/Description", "Category", "Reference", "Amount", "Fee", "Currency"];
  const rows = transactions.map((t) => [
    new Date(t.createdAt).toISOString(),
    t.type,
    t.status,
    t.merchant ?? t.description ?? "",
    t.category ?? "",
    t.reference,
    t.amount,
    t.fee,
    t.currency,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `volt-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15", type });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
      setTotalPages(data.pages);
    }
    setLoading(false);
  }, [page, type, dateFrom, dateTo]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams({ page: "1", limit: "1000", type });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      exportCSV(data.transactions);
    }
    setExporting(false);
  };

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  const typeIcons: Record<string, React.ReactNode> = {
    DEPOSIT: <ArrowDownRight className="w-4 h-4 text-emerald-400" />,
    CARD_PAYMENT: <ArrowUpRight className="w-4 h-4 text-red-400" />,
    WITHDRAWAL: <ArrowUpRight className="w-4 h-4 text-orange-400" />,
    TRANSFER: <ArrowUpRight className="w-4 h-4 text-blue-400" />,
    CONVERSION: <ArrowUpRight className="w-4 h-4 text-violet-400" />,
    CARD_FUNDING: <CreditCard className="w-4 h-4 text-blue-400" />,
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Transactions" subtitle="Your complete payment history" />

      <main className="flex-1 p-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b88b0]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6b88b0] shrink-0" />
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t === "ALL" ? "All Types" : t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 bg-[#061120] border border-[#0d2040] rounded-lg text-[#6b88b0] focus:outline-none focus:border-blue-500/50"
              title="From date"
            />
            <span className="text-[#6b88b0] text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 bg-[#061120] border border-[#0d2040] rounded-lg text-[#6b88b0] focus:outline-none focus:border-blue-500/50"
              title="To date"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#6b88b0] hover:text-white bg-[#061120] border border-[#0d2040] hover:border-blue-500/40 rounded-lg transition-colors disabled:opacity-50"
            title="Export as CSV"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0d2040]">
                  <th className="text-left px-5 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium">Transaction</th>
                  <th className="text-left px-4 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium hidden lg:table-cell">Reference</th>
                  <th className="text-left px-4 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#0d2040]">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-[#0d2040] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-[#6b88b0]">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const isCredit = t.type === "DEPOSIT" || (t.type === "TRANSFER" && t.reference.endsWith("-IN"));
                    return (
                      <tr key={t.id} className="border-b border-[#0d2040] last:border-0 hover:bg-[#0d2040]/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                              {typeIcons[t.type]}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {t.merchant || t.description || t.type.replace(/_/g, " ")}
                              </div>
                              <div className="text-xs text-[#6b88b0]">
                                {formatDateTime(t.createdAt)}
                                {t.card && <span className="ml-2">· {t.card.label}</span>}
                                {t.category && <span className="ml-2 text-[#4a6080]">· {t.category}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-xs text-[#6b88b0]">{t.type.replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-xs font-mono text-[#6b88b0]">{t.reference.slice(0, 16)}...</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-right font-semibold ${getTransactionColor(t.type)}`}>
                          {isCredit ? "+" : "-"}{formatCurrency(t.amount, t.currency)}
                          {t.fee > 0 && (
                            <div className="text-xs text-[#6b88b0] font-normal">fee: {formatCurrency(t.fee)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#0d2040]">
              <span className="text-xs text-[#6b88b0]">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs text-[#6b88b0] bg-[#020c1b] border border-[#0d2040] rounded-lg hover:text-white disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs text-[#6b88b0] bg-[#020c1b] border border-[#0d2040] rounded-lg hover:text-white disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
