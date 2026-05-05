"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { formatCurrency, formatDateTime, getTransactionColor, getStatusColor } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, CreditCard, Search, Filter, Download, Globe } from "lucide-react";

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

interface FiatTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  reference: string;
  createdAt: string;
  wallet?: { name: string; currency: string } | null;
}

const CRYPTO_TYPES = ["ALL", "DEPOSIT", "CARD_PAYMENT", "WITHDRAWAL", "TRANSFER", "CARD_FUNDING", "CONVERSION"];
const FIAT_TYPES = ["ALL", "DEPOSIT", "WITHDRAWAL", "TRANSFER", "CARD_PAYMENT", "SEND", "RECEIVE", "CONVERSION"];

function exportCryptoCSV(transactions: Transaction[]) {
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
  downloadCSV(csv, "volt-transactions");
}

function exportFiatCSV(transactions: FiatTransaction[]) {
  const headers = ["Date", "Type", "Wallet", "Description", "Reference", "Amount", "Currency"];
  const rows = transactions.map((t) => [
    new Date(t.createdAt).toISOString(),
    t.type,
    t.wallet?.name ?? "",
    t.description ?? "",
    t.reference,
    t.amount,
    t.currency,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadCSV(csv, "volt-fiat-transactions");
}

function downloadCSV(csv: string, name: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const typeIcons: Record<string, React.ReactNode> = {
  DEPOSIT: <ArrowDownRight className="w-4 h-4 text-emerald-400" />,
  CARD_PAYMENT: <ArrowUpRight className="w-4 h-4 text-red-400" />,
  WITHDRAWAL: <ArrowUpRight className="w-4 h-4 text-orange-400" />,
  TRANSFER: <ArrowUpRight className="w-4 h-4 text-blue-400" />,
  CONVERSION: <ArrowUpRight className="w-4 h-4 text-violet-400" />,
  CARD_FUNDING: <CreditCard className="w-4 h-4 text-blue-400" />,
  SEND: <ArrowUpRight className="w-4 h-4 text-orange-400" />,
  RECEIVE: <ArrowDownRight className="w-4 h-4 text-emerald-400" />,
};

export default function TransactionsPage() {
  const [tab, setTab] = useState<"crypto" | "fiat">("crypto");

  // Crypto state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [cryptoType, setCryptoType] = useState("ALL");
  const [cryptoPage, setCryptoPage] = useState(1);
  const [cryptoTotalPages, setCryptoTotalPages] = useState(1);
  const [cryptoDateFrom, setCryptoDateFrom] = useState("");
  const [cryptoDateTo, setCryptoDateTo] = useState("");

  // Fiat state
  const [fiatTxns, setFiatTxns] = useState<FiatTransaction[]>([]);
  const [fiatLoading, setFiatLoading] = useState(true);
  const [fiatType, setFiatType] = useState("ALL");
  const [fiatPage, setFiatPage] = useState(1);
  const [fiatTotalPages, setFiatTotalPages] = useState(1);
  const [fiatDateFrom, setFiatDateFrom] = useState("");
  const [fiatDateTo, setFiatDateTo] = useState("");

  // Shared
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchCrypto = useCallback(async () => {
    setCryptoLoading(true);
    const params = new URLSearchParams({ page: String(cryptoPage), limit: "15", type: cryptoType });
    if (cryptoDateFrom) params.set("dateFrom", cryptoDateFrom);
    if (cryptoDateTo) params.set("dateTo", cryptoDateTo);
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
      setCryptoTotalPages(data.pages);
    }
    setCryptoLoading(false);
  }, [cryptoPage, cryptoType, cryptoDateFrom, cryptoDateTo]);

  const fetchFiat = useCallback(async () => {
    setFiatLoading(true);
    const params = new URLSearchParams({ page: String(fiatPage), limit: "15", type: fiatType });
    if (fiatDateFrom) params.set("dateFrom", fiatDateFrom);
    if (fiatDateTo) params.set("dateTo", fiatDateTo);
    const res = await fetch(`/api/fiat-transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setFiatTxns(data.transactions);
      setFiatTotalPages(data.pages);
    }
    setFiatLoading(false);
  }, [fiatPage, fiatType, fiatDateFrom, fiatDateTo]);

  useEffect(() => { fetchCrypto(); }, [fetchCrypto]);
  useEffect(() => { fetchFiat(); }, [fetchFiat]);

  const handleExport = async () => {
    setExporting(true);
    if (tab === "crypto") {
      const params = new URLSearchParams({ page: "1", limit: "1000", type: cryptoType });
      if (cryptoDateFrom) params.set("dateFrom", cryptoDateFrom);
      if (cryptoDateTo) params.set("dateTo", cryptoDateTo);
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) exportCryptoCSV((await res.json()).transactions);
    } else {
      const params = new URLSearchParams({ page: "1", limit: "1000", type: fiatType });
      if (fiatDateFrom) params.set("dateFrom", fiatDateFrom);
      if (fiatDateTo) params.set("dateTo", fiatDateTo);
      const res = await fetch(`/api/fiat-transactions?${params}`);
      if (res.ok) exportFiatCSV((await res.json()).transactions);
    }
    setExporting(false);
  };

  const filteredCrypto = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  const filteredFiat = fiatTxns.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.description?.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q) ||
      t.wallet?.name.toLowerCase().includes(q)
    );
  });

  const isFiatCredit = (type: string) => ["DEPOSIT", "RECEIVE"].includes(type);
  const isCryptoCredit = (type: string, ref: string) =>
    type === "DEPOSIT" || (type === "TRANSFER" && ref.endsWith("-IN"));

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Transactions" subtitle="Your complete payment history" />

      <main className="flex-1 p-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#061120] border border-[#0d2040] rounded-xl w-fit">
          <button
            onClick={() => setTab("crypto")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "crypto"
                ? "bg-blue-600 text-white"
                : "text-[#6b88b0] hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Digital Currency
          </button>
          <button
            onClick={() => setTab("fiat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "fiat"
                ? "bg-blue-600 text-white"
                : "text-[#6b88b0] hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4" />
            Multi-Currency
          </button>
        </div>

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
            {tab === "crypto" ? (
              <select
                value={cryptoType}
                onChange={(e) => { setCryptoType(e.target.value); setCryptoPage(1); }}
                className="text-sm"
              >
                {CRYPTO_TYPES.map((t) => (
                  <option key={t} value={t}>{t === "ALL" ? "All Types" : t.replace(/_/g, " ")}</option>
                ))}
              </select>
            ) : (
              <select
                value={fiatType}
                onChange={(e) => { setFiatType(e.target.value); setFiatPage(1); }}
                className="text-sm"
              >
                {FIAT_TYPES.map((t) => (
                  <option key={t} value={t}>{t === "ALL" ? "All Types" : t.replace(/_/g, " ")}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tab === "crypto" ? cryptoDateFrom : fiatDateFrom}
              onChange={(e) => {
                if (tab === "crypto") { setCryptoDateFrom(e.target.value); setCryptoPage(1); }
                else { setFiatDateFrom(e.target.value); setFiatPage(1); }
              }}
              className="text-sm px-3 py-2 bg-[#061120] border border-[#0d2040] rounded-lg text-[#6b88b0] focus:outline-none focus:border-blue-500/50"
              title="From date"
            />
            <span className="text-[#6b88b0] text-xs">to</span>
            <input
              type="date"
              value={tab === "crypto" ? cryptoDateTo : fiatDateTo}
              onChange={(e) => {
                if (tab === "crypto") { setCryptoDateTo(e.target.value); setCryptoPage(1); }
                else { setFiatDateTo(e.target.value); setFiatPage(1); }
              }}
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
            {tab === "crypto" ? (
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
                  {cryptoLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#0d2040]">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-[#0d2040] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredCrypto.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-[#6b88b0]">No transactions found</td>
                    </tr>
                  ) : (
                    filteredCrypto.map((t) => {
                      const isCredit = isCryptoCredit(t.type, t.reference);
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
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#0d2040]">
                    <th className="text-left px-5 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium">Transaction</th>
                    <th className="text-left px-4 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium hidden md:table-cell">Wallet</th>
                    <th className="text-left px-4 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium hidden lg:table-cell">Reference</th>
                    <th className="text-right px-5 py-3.5 text-xs text-[#6b88b0] uppercase tracking-wider font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fiatLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#0d2040]">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-[#0d2040] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredFiat.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-[#6b88b0]">No transactions found</td>
                    </tr>
                  ) : (
                    filteredFiat.map((t) => {
                      const isCredit = isFiatCredit(t.type);
                      return (
                        <tr key={t.id} className="border-b border-[#0d2040] last:border-0 hover:bg-[#0d2040]/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                                {typeIcons[t.type] ?? <ArrowUpRight className="w-4 h-4 text-[#6b88b0]" />}
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {t.description || t.type.replace(/_/g, " ")}
                                </div>
                                <div className="text-xs text-[#6b88b0]">
                                  {formatDateTime(t.createdAt)}
                                  {t.wallet && <span className="ml-2">· {t.wallet.name}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <span className="text-xs text-[#6b88b0]">{t.type.replace(/_/g, " ")}</span>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            {t.wallet ? (
                              <div className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="text-xs text-[#6b88b0]">{t.wallet.name}</span>
                                <span className="text-xs text-[#4a6080]">· {t.wallet.currency}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#4a6080]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <span className="text-xs font-mono text-[#6b88b0]">{t.reference.slice(0, 16)}...</span>
                          </td>
                          <td className={`px-5 py-4 text-right font-semibold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                            {isCredit ? "+" : "-"}{formatCurrency(t.amount, t.currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {(tab === "crypto" ? cryptoTotalPages : fiatTotalPages) > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#0d2040]">
              <span className="text-xs text-[#6b88b0]">
                Page {tab === "crypto" ? cryptoPage : fiatPage} of {tab === "crypto" ? cryptoTotalPages : fiatTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => tab === "crypto" ? setCryptoPage((p) => Math.max(1, p - 1)) : setFiatPage((p) => Math.max(1, p - 1))}
                  disabled={(tab === "crypto" ? cryptoPage : fiatPage) === 1}
                  className="px-3 py-1.5 text-xs text-[#6b88b0] bg-[#020c1b] border border-[#0d2040] rounded-lg hover:text-white disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => tab === "crypto" ? setCryptoPage((p) => Math.min(cryptoTotalPages, p + 1)) : setFiatPage((p) => Math.min(fiatTotalPages, p + 1))}
                  disabled={(tab === "crypto" ? cryptoPage : fiatPage) === (tab === "crypto" ? cryptoTotalPages : fiatTotalPages)}
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
