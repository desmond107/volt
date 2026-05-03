"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Clock, Pause, Play, Trash2, X, CalendarClock, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface Wallet {
  id: string;
  asset: string;
  network: string;
  balance: number;
}

interface ScheduledPayment {
  id: string;
  walletId: string;
  toAddress: string;
  amount: number;
  currency: string;
  description: string | null;
  frequency: string;
  nextRunAt: string;
  lastRunAt: string | null;
  status: string;
  wallet: { asset: string; network: string; balance: number };
}

const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

const freqColors: Record<string, string> = {
  DAILY: "text-blue-400 bg-blue-400/10",
  WEEKLY: "text-violet-400 bg-violet-400/10",
  MONTHLY: "text-amber-400 bg-amber-400/10",
  YEARLY: "text-emerald-400 bg-emerald-400/10",
};

export default function ScheduledPage() {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    walletId: "",
    toAddress: "",
    amount: "",
    description: "",
    frequency: "MONTHLY",
  });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    const [schedRes, walletRes] = await Promise.all([
      fetch("/api/scheduled"),
      fetch("/api/wallet"),
    ]);
    if (schedRes.ok) setPayments((await schedRes.json()).payments);
    if (walletRes.ok) {
      const d = await walletRes.json();
      if (d.wallets) setWallets(d.wallets);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.walletId || !form.toAddress || !form.amount) {
      setFormError("Wallet, recipient, and amount are required");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { setFormError("Enter a valid amount"); return; }
    setFormError("");
    setCreating(true);
    const res = await fetch("/api/scheduled", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount }),
    });
    if (res.ok) {
      await fetchData();
      setShowModal(false);
      setForm({ walletId: "", toAddress: "", amount: "", description: "", frequency: "MONTHLY" });
    } else {
      const d = await res.json();
      setFormError(d.error ?? "Failed to create");
    }
    setCreating(false);
  };

  const handleToggle = async (p: ScheduledPayment) => {
    setActionLoading(p.id);
    const newStatus = p.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch("/api/scheduled", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, status: newStatus }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    await fetch("/api/scheduled", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleteConfirm(null);
    await fetchData();
    setActionLoading(null);
  };

  const active = payments.filter((p) => p.status === "ACTIVE");
  const paused = payments.filter((p) => p.status === "PAUSED");

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Scheduled Payments" subtitle="Automate recurring transfers" />

      <main className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-sm text-[#6b88b0]">
            <span><span className="text-white font-semibold">{active.length}</span> active</span>
            <span><span className="text-white font-semibold">{paused.length}</span> paused</span>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            New Schedule
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#061120] border border-[#0d2040] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <CalendarClock className="w-14 h-14 text-[#0d2040] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No scheduled payments</h3>
            <p className="text-sm text-[#6b88b0] mb-6">
              Automate recurring transfers — daily, weekly, monthly, or yearly.
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              Create First Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className={`bg-[#061120] border rounded-xl p-4 flex items-center gap-4 transition-colors ${
                  p.status === "PAUSED" ? "border-[#0d2040] opacity-60" : "border-[#0d2040] hover:border-blue-500/20"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0d2040] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(p.amount, p.currency)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${freqColors[p.frequency] ?? "text-gray-400 bg-gray-400/10"}`}>
                      {p.frequency}
                    </span>
                    {p.status === "PAUSED" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-yellow-400 bg-yellow-400/10">
                        PAUSED
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-[#6b88b0] mt-0.5 truncate">{p.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#6b88b0]">
                    <span>From: {p.wallet.asset} wallet</span>
                    <span>·</span>
                    <span className="font-mono truncate max-w-[120px]">{p.toAddress.slice(0, 8)}…{p.toAddress.slice(-4)}</span>
                    <span>·</span>
                    <span>Next: {formatDate(p.nextRunAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(p)}
                    disabled={actionLoading === p.id}
                    title={p.status === "ACTIVE" ? "Pause" : "Resume"}
                    className="p-2 text-[#6b88b0] hover:text-white hover:bg-[#0d2040] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {p.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    disabled={actionLoading === p.id}
                    className="p-2 text-[#6b88b0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
              <h2 className="text-base font-semibold text-white">New Scheduled Payment</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">From Wallet</label>
                <select
                  value={form.walletId}
                  onChange={(e) => setForm({ ...form, walletId: e.target.value })}
                  className="w-full bg-[#020c1b] border border-[#0d2040] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Select wallet…</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.asset} ({w.network}) — {formatCurrency(w.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Recipient Address</label>
                <input
                  type="text"
                  placeholder="0x… or wallet address"
                  value={form.toAddress}
                  onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Amount (USD)</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full bg-[#020c1b] border border-[#0d2040] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0d4ef] mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly rent, Netflix"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" loading={creating} onClick={handleCreate}>
                  <CalendarClock className="w-4 h-4" />
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#071829] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Delete Schedule</h3>
                <p className="text-xs text-[#6b88b0] mt-0.5">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[#6b88b0] mb-6">
              The scheduled payment will be permanently removed and no further transfers will be made.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#6b88b0] hover:text-white bg-[#061120] border border-[#0d2040] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === deleteConfirm ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
