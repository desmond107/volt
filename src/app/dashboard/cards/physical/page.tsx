"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/dashboard/TopBar";
import EagleLogo from "@/components/ui/EagleLogo";
import Button from "@/components/ui/Button";
import { ArrowLeft, CheckCircle2, Clock, Package, Truck, MapPin, AlertCircle, ChevronRight, CreditCard, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VirtualCardFace from "@/components/ui/VirtualCardFace";

interface PhysicalCardRequest {
  id: string;
  status: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  cardColor: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
}

const CARD_COLORS = [
  {
    id: "midnight",
    label: "Midnight Black",
    bg: "linear-gradient(135deg, #0a0c10 0%, #151a24 40%, #0d1219 100%)",
    chip: "#c9943a",
    text: "rgba(255,255,255,0.6)",
    accent: "#c9943a",
    shimmer: "linear-gradient(90deg, transparent, #c9943a55, #c9943a, #c9943a55, transparent)",
    swatch: "#151a24",
    border: "#c9943a33",
  },
  {
    id: "white",
    label: "Pearl White",
    bg: "linear-gradient(135deg, #e8eaf0 0%, #f5f6fa 50%, #dde0ea 100%)",
    chip: "#9b8050",
    text: "rgba(30,40,60,0.7)",
    accent: "#8a7040",
    shimmer: "linear-gradient(90deg, transparent, #9b805055, #9b8050, #9b805055, transparent)",
    swatch: "#f0f1f6",
    border: "#9b805033",
  },
  {
    id: "navy",
    label: "Deep Navy",
    bg: "linear-gradient(135deg, #030b1f 0%, #0a1e4a 50%, #030b1f 100%)",
    chip: "#60a5fa",
    text: "rgba(255,255,255,0.6)",
    accent: "#60a5fa",
    shimmer: "linear-gradient(90deg, transparent, #60a5fa55, #60a5fa, #60a5fa55, transparent)",
    swatch: "#0a1e4a",
    border: "#60a5fa33",
  },
  {
    id: "gold",
    label: "Brushed Gold",
    bg: "linear-gradient(135deg, #1c1000 0%, #3d2a00 40%, #1c1000 100%)",
    chip: "#f0c040",
    text: "rgba(255,220,100,0.7)",
    accent: "#f0c040",
    shimmer: "linear-gradient(90deg, transparent, #f0c04055, #f0c040, #f0c04055, transparent)",
    swatch: "#3d2a00",
    border: "#f0c04033",
  },
  {
    id: "rosegold",
    label: "Rose Gold",
    bg: "linear-gradient(135deg, #1a0a0a 0%, #4a1a22 40%, #1a0a0a 100%)",
    chip: "#f4a0b0",
    text: "rgba(255,200,210,0.7)",
    accent: "#f4a0b0",
    shimmer: "linear-gradient(90deg, transparent, #f4a0b055, #f4a0b0, #f4a0b055, transparent)",
    swatch: "#4a1a22",
    border: "#f4a0b033",
  },
  {
    id: "arctic",
    label: "Arctic Blue",
    bg: "linear-gradient(135deg, #010f1f 0%, #013a5e 50%, #010f1f 100%)",
    chip: "#38bdf8",
    text: "rgba(150,220,255,0.7)",
    accent: "#38bdf8",
    shimmer: "linear-gradient(90deg, transparent, #38bdf855, #38bdf8, #38bdf855, transparent)",
    swatch: "#013a5e",
    border: "#38bdf833",
  },
];

const PHYSICAL_TO_VIRTUAL_COLOR: Record<string, string> = {
  midnight: "#334155",
  white:    "#334155",
  navy:     "#1d4ed8",
  gold:     "#f59e0b",
  rosegold: "#f43f5e",
  arctic:   "#0ea5e9",
};

interface VirtualCardModal {
  label: string;
  spendLimit: string;
  creating: boolean;
  error: string;
}

function CreateVirtualCardModal({
  physicalColor,
  holderName,
  onClose,
  onCreated,
}: {
  physicalColor: string;
  holderName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const colorHex = PHYSICAL_TO_VIRTUAL_COLOR[physicalColor] ?? "#334155";
  const colorLabel = CARD_COLORS.find((c) => c.id === physicalColor)?.label ?? "Midnight Black";

  const [modal, setModal] = useState<VirtualCardModal>({
    label: `${colorLabel} Physical Card`,
    spendLimit: "1000",
    creating: false,
    error: "",
  });

  async function handleCreate() {
    if (!modal.label.trim()) {
      setModal((m) => ({ ...m, error: "Please enter a card label." }));
      return;
    }
    const limit = parseFloat(modal.spendLimit);
    if (!limit || limit < 10) {
      setModal((m) => ({ ...m, error: "Spend limit must be at least $10." }));
      return;
    }
    setModal((m) => ({ ...m, creating: true, error: "" }));
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: modal.label.trim(), spendLimit: limit, color: colorHex, brand: "VISA" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModal((m) => ({ ...m, creating: false, error: data.error ?? "Failed to create card." }));
        return;
      }
      onCreated();
    } catch {
      setModal((m) => ({ ...m, creating: false, error: "Failed to create card." }));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#061120] border border-[#0d2040] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#0d2040]">
          <div>
            <h2 className="text-base font-semibold text-white">Create Matching Virtual Card</h2>
            <p className="text-xs text-[#6b88b0] mt-0.5">{colorLabel} theme</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6b88b0] hover:text-white rounded-lg hover:bg-[#0d2040] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Card preview */}
          <div className="max-w-[260px] mx-auto">
            <VirtualCardFace
              color={colorHex}
              label={modal.label || "Virtual Card"}
              cardHolder={holderName || "YOUR NAME"}
              cardNumber="0000000000000000"
              expiryMonth={new Date().getMonth() + 1}
              expiryYear={new Date().getFullYear() + 3}
              status="ACTIVE"
              brand="VISA"
              nfcEnabled
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">Card Label</label>
            <input
              type="text"
              placeholder="e.g. Physical Card Twin"
              value={modal.label}
              onChange={(e) => setModal((m) => ({ ...m, label: e.target.value, error: "" }))}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">Spend Limit (USD)</label>
            <input
              type="number"
              min={10}
              max={10000}
              value={modal.spendLimit}
              onChange={(e) => setModal((m) => ({ ...m, spendLimit: e.target.value, error: "" }))}
            />
          </div>

          {modal.error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {modal.error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-[#6b88b0] hover:text-white bg-[#020c1b] border border-[#0d2040] rounded-lg hover:border-[#1a3a5c] transition-colors"
            >
              Cancel
            </button>
            <Button loading={modal.creating} onClick={handleCreate} className="flex-1">
              Issue Virtual Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { key: "PENDING",   label: "Request Submitted", icon: Clock,         desc: "We've received your request and are reviewing it." },
  { key: "REVIEWING", label: "Under Review",       icon: AlertCircle,   desc: "Our team is verifying your details." },
  { key: "APPROVED",  label: "Approved",           icon: CheckCircle2,  desc: "Your request has been approved and card is being produced." },
  { key: "SHIPPED",   label: "Shipped",            icon: Truck,         desc: "Your card is on the way." },
  { key: "DELIVERED", label: "Delivered",          icon: MapPin,        desc: "Your card has been delivered." },
];

const STATUS_ORDER = ["PENDING", "REVIEWING", "APPROVED", "SHIPPED", "DELIVERED"];

function PhysicalCardMockup({ colorId, holderName }: { colorId: string; holderName?: string }) {
  const theme = CARD_COLORS.find((c) => c.id === colorId) ?? CARD_COLORS[0];
  const isLight = colorId === "white";

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl w-full select-none"
      style={{ background: theme.bg, aspectRatio: "1.586 / 1" }}
    >
      {/* Shimmer top line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: theme.shimmer }} />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)", border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)" }}
            >
              <EagleLogo size={16} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold" style={{ color: isLight ? "#1e2840" : "#fff" }}>Volt</span>
              <span className="text-[8px] uppercase tracking-widest font-medium" style={{ color: theme.accent }}>
                Physical Card
              </span>
            </div>
          </div>
          <span className="text-xs italic font-light tracking-widest" style={{ color: theme.text }}>VISA</span>
        </div>

        {/* Bottom */}
        <div>
          <div
            className="w-10 h-7 rounded-md mb-3 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.chip}cc, ${theme.chip}55)`, border: `1px solid ${theme.chip}44` }}
          >
            <div className="w-6 h-4 rounded-sm flex flex-col justify-around p-0.5" style={{ background: `${theme.chip}33` }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-px rounded" style={{ background: `${theme.chip}99` }} />
              ))}
            </div>
          </div>

          <p className="font-mono text-sm tracking-widest mb-3" style={{ color: theme.text }}>•••• •••• •••• ••••</p>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: `${theme.text}` }}>Card Holder</div>
              <div className="text-xs font-medium" style={{ color: isLight ? "#1e2840" : "rgba(255,255,255,0.85)" }}>
                {holderName || "YOUR NAME"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: theme.text }}>Expires</div>
              <div className="text-xs font-medium" style={{ color: isLight ? "#1e2840" : "rgba(255,255,255,0.85)" }}>MM/YY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  const isRejected = status === "REJECTED";

  return (
    <div className="space-y-0">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done = idx < currentIdx;
        const active = idx === currentIdx && !isRejected;

        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500/50"
                    : active
                    ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/20"
                    : "bg-[#0d2040]/40 border-[#0d2040]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${done ? "text-emerald-400" : active ? "text-blue-400" : "text-[#2a4060]"}`} />
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-px flex-1 min-h-7 my-1 ${done ? "bg-emerald-500/30" : "bg-[#0d2040]"}`} />
              )}
            </div>
            <div className={`pb-5 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}>
              <div className={`text-sm font-medium ${done ? "text-emerald-300" : active ? "text-white" : "text-[#2a4060]"}`}>
                {step.label}
              </div>
              {(done || active) && (
                <div className={`text-xs mt-0.5 ${done ? "text-[#4a7090]" : "text-[#6b88b0]"}`}>{step.desc}</div>
              )}
            </div>
          </div>
        );
      })}

      {isRejected && (
        <div className="flex gap-4 mt-2">
          <div className="w-8 flex items-center justify-center shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 border border-red-500/50">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-red-300">Rejected</div>
            <div className="text-xs text-[#6b88b0] mt-0.5">Your request was not approved. You may submit a new request.</div>
          </div>
        </div>
      )}
    </div>
  );
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Netherlands", "Switzerland", "Singapore", "Japan",
  "South Africa", "Nigeria", "Kenya", "Ghana", "India",
  "United Arab Emirates", "Other",
];

export default function PhysicalCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PhysicalCardRequest | null>(null);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showVirtualModal, setShowVirtualModal] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    cardColor: "midnight",
  });

  useEffect(() => {
    async function load() {
      const [reqRes, meRes] = await Promise.all([
        fetch("/api/physical-cards"),
        fetch("/api/user"),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequest(data.request ?? null);
      }
      if (meRes.ok) {
        const data = await meRes.json();
        setKycVerified(data.user?.kycStatus === "VERIFIED");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/physical-cards", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to cancel request.");
        return;
      }
      setRequest(null);
      setCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  }

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.addressLine1.trim() || !form.city.trim() || !form.postalCode.trim() || !form.country.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/physical-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit request.");
        return;
      }
      setRequest(data.request);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 overflow-y-auto">
        <TopBar title="Physical Card" />
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const previewColor = request ? (request.cardColor ?? "midnight") : form.cardColor;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Physical Card" />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <Link
            href="/dashboard/cards"
            className="inline-flex items-center gap-1.5 text-sm text-[#6b88b0] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cards
          </Link>
          <h1 className="text-2xl font-bold text-white">Physical Volt Card</h1>
          <p className="text-sm text-[#6b88b0] mt-1">A premium matte debit card delivered to your door.</p>
        </div>

        {/* Card mockup — live preview */}
        <div className="max-w-sm space-y-3">
          <PhysicalCardMockup colorId={previewColor} holderName={form.fullName || undefined} />
          {request && (
            <p className="text-xs text-center text-[#4a6080]">
              {CARD_COLORS.find((c) => c.id === request.cardColor)?.label ?? "Midnight Black"}
            </p>
          )}
        </div>

        {/* KYC gate */}
        {kycVerified === false && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-300 mb-1">Identity Verification Required</div>
              <p className="text-xs text-[#8aa0b8] mb-3">
                You must complete KYC verification before requesting a physical card.
              </p>
              <Link href="/dashboard/kyc" className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-200 transition-colors">
                Complete Verification <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Active request — status tracker */}
        {kycVerified && request && !success && (
          <div className="space-y-6">
            <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Request Status</h2>
              </div>
              <StatusTimeline status={request.status} />
            </div>

            <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white">Delivery Details</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#4a6080] mb-0.5">Full Name</div>
                  <div className="text-[#c0d4ef]">{request.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#4a6080] mb-0.5">Phone</div>
                  <div className="text-[#c0d4ef]">{request.phone}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#4a6080] mb-0.5">Address</div>
                  <div className="text-[#c0d4ef]">
                    {request.addressLine1}{request.addressLine2 && `, ${request.addressLine2}`}
                  </div>
                  <div className="text-[#c0d4ef]">
                    {[request.city, request.state, request.postalCode].filter(Boolean).join(", ")}
                  </div>
                  <div className="text-[#c0d4ef]">{request.country}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#4a6080] mb-0.5">Card Color</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/10"
                      style={{ background: CARD_COLORS.find((c) => c.id === request.cardColor)?.swatch ?? "#151a24" }}
                    />
                    <span className="text-[#c0d4ef]">
                      {CARD_COLORS.find((c) => c.id === request.cardColor)?.label ?? "Midnight Black"}
                    </span>
                  </div>
                </div>
                {request.trackingNumber && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#4a6080] mb-0.5">Tracking Number</div>
                    <div className="text-blue-300 font-mono text-xs">{request.trackingNumber}</div>
                  </div>
                )}
                {request.notes && (
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#4a6080] mb-0.5">Notes</div>
                    <div className="text-[#8aa0b8] text-xs">{request.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel request — only for PENDING / REVIEWING */}
            {["PENDING", "REVIEWING"].includes(request.status) && (
              cancelConfirm ? (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-300 mb-1">Cancel this request?</div>
                      <p className="text-xs text-[#8aa0b8]">
                        Your {CARD_COLORS.find((c) => c.id === request.cardColor)?.label ?? "card"} request will be permanently cancelled. You can submit a new one at any time.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="flex-1 py-2 text-sm font-medium text-[#6b88b0] hover:text-white bg-[#020c1b] border border-[#0d2040] rounded-lg hover:border-[#1a3a5c] transition-colors"
                    >
                      Keep Request
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 py-2 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/60 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling…" : "Yes, Cancel Request"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-400 hover:text-red-200 bg-[#061120] border border-red-500/20 hover:border-red-500/50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancel Request
                </button>
              )
            )}

            {/* Create matching virtual card */}
            <button
              onClick={() => setShowVirtualModal(true)}
              className="w-full flex items-center justify-between bg-[#061120] border border-[#0d2040] hover:border-violet-500/30 rounded-xl px-5 py-4 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">Create Matching Virtual Card</div>
                  <div className="text-xs text-[#6b88b0] mt-0.5">Use the same color online before your physical card arrives</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#4a6080] group-hover:text-violet-400 transition-colors shrink-0" />
            </button>

            {(request.status === "REJECTED" || request.status === "DELIVERED") && (
              <button
                onClick={() => setRequest(null)}
                className="w-full py-3 text-sm font-medium text-blue-300 hover:text-white bg-[#061120] border border-blue-500/20 rounded-xl hover:border-blue-500/50 transition-colors"
              >
                Submit a New Request
              </button>
            )}
          </div>
        )}

        {/* Success */}
        {success && request && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-white mb-1">Request Submitted!</div>
              <p className="text-sm text-[#6b88b0]">
                We'll produce your{" "}
                <span className="text-white font-medium">
                  {CARD_COLORS.find((c) => c.id === request.cardColor)?.label ?? "Midnight Black"}
                </span>{" "}
                card and ship it to {request.city}, {request.country}. Expect delivery within 7–14 business days after approval.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowVirtualModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-violet-300 hover:text-white bg-violet-500/10 border border-violet-500/30 hover:border-violet-500/60 rounded-xl transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Create Virtual Card
              </button>
              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-emerald-400 hover:text-emerald-200 transition-colors px-2"
              >
                View request status →
              </button>
            </div>
          </div>
        )}

        {/* Request form */}
        {kycVerified && !request && !success && (
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Request Your Card</h2>
            <p className="text-xs text-[#6b88b0] mb-6">Choose a color and enter your delivery address.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Color picker */}
              <div>
                <label className="block text-xs font-medium text-[#8aa0b8] mb-3">Card Color</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setField("cardColor", c.id)}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className="w-full aspect-square rounded-xl transition-all"
                        style={{
                          background: c.bg,
                          border: form.cardColor === c.id
                            ? `2px solid ${c.accent}`
                            : `1px solid ${c.border}`,
                          boxShadow: form.cardColor === c.id
                            ? `0 0 0 3px ${c.accent}22, 0 4px 16px ${c.accent}22`
                            : "none",
                          transform: form.cardColor === c.id ? "scale(1.05)" : "scale(1)",
                        }}
                      />
                      <span
                        className="text-[10px] text-center leading-tight transition-colors"
                        style={{ color: form.cardColor === c.id ? "#c0d4ef" : "#4a6080" }}
                      >
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#0d2040] pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="As it should appear on the card"
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      Address Line 1 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Street address, P.O. box"
                      value={form.addressLine1}
                      onChange={(e) => setField("addressLine1", e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      Address Line 2 <span className="text-[#4a6080] text-[10px] ml-1">Optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Apartment, suite, unit, floor, etc."
                      value={form.addressLine2}
                      onChange={(e) => setField("addressLine2", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      State / Province <span className="text-[#4a6080] text-[10px] ml-1">Optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="State or province"
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      Postal / ZIP Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="00000"
                      value={form.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8aa0b8] mb-1.5">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      required
                      className="w-full"
                    >
                      <option value="" disabled>Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" loading={submitting} className="w-full">
                Submit Request
              </Button>
            </form>
          </div>
        )}

        {/* Feature highlights */}
        {!request && !success && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🪙", title: "EMV Chip", desc: "Secure chip-and-PIN transactions worldwide." },
              { icon: "📡", title: "Contactless", desc: "Tap to pay at any NFC-enabled terminal." },
              { icon: "🌍", title: "Global Acceptance", desc: "Accepted wherever Visa is supported." },
            ].map((f) => (
              <div key={f.title} className="bg-[#061120] border border-[#0d2040] rounded-xl p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
                <div className="text-xs text-[#6b88b0]">{f.desc}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showVirtualModal && request && (
        <CreateVirtualCardModal
          physicalColor={request.cardColor ?? "midnight"}
          holderName={request.fullName}
          onClose={() => setShowVirtualModal(false)}
          onCreated={() => {
            setShowVirtualModal(false);
            router.push("/dashboard/cards");
          }}
        />
      )}
    </div>
  );
}
