"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { CheckCircle2, Clock, AlertCircle, Shield, Upload, FileText } from "lucide-react";
import Button from "@/components/ui/Button";

interface KycStatus {
  kycStatus: string;
  documents: Array<{ id: string; docType: string; country: string; status: string; createdAt: string }>;
}

const countries = [
  "United States", "United Kingdom", "Germany", "France", "Canada", "Australia",
  "Japan", "Singapore", "Netherlands", "Switzerland", "Sweden", "Norway",
  "Brazil", "Mexico", "India", "South Africa", "Nigeria", "Kenya",
];

const docTypes = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's License" },
];

export default function KycPage() {
  const [data, setData] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ docType: "passport", country: "", docNumber: "" });
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0] ?? null;
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const fetchKyc = useCallback(async () => {
    const res = await fetch("/api/kyc");
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const handleSubmit = async () => {
    if (!form.country) return;
    setSubmitting(true);
    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await fetchKyc();
      setStep(4);
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === "VERIFIED") return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Verified" };
    if (status === "SUBMITTED") return { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Under Review" };
    if (status === "REJECTED") return { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Rejected" };
    return { icon: AlertCircle, color: "text-[#6b88b0]", bg: "bg-[#0d2040] border-[#0d2040]", label: "Not Started" };
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 overflow-y-auto">
        <TopBar title="KYC Verification" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const badge = statusBadge(data?.kycStatus || "PENDING");
  const BadgeIcon = badge.icon;
  const isVerified = data?.kycStatus === "VERIFIED";

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="KYC Verification" subtitle="Identity verification for card issuance" />

      <main className="flex-1 p-6 max-w-2xl">
        {/* Status card */}
        <div className={`border rounded-xl p-5 mb-6 flex items-center gap-4 ${badge.bg}`}>
          <div className={`w-12 h-12 rounded-xl ${badge.bg} flex items-center justify-center`}>
            <BadgeIcon className={`w-6 h-6 ${badge.color}`} />
          </div>
          <div>
            <div className={`font-semibold ${badge.color}`}>{badge.label}</div>
            <div className="text-sm text-[#6b88b0]">
              {isVerified
                ? "Your identity is verified. You can now issue virtual cards."
                : "Complete KYC to unlock card issuance and higher limits."}
            </div>
          </div>
        </div>

        {isVerified ? (
          <div className="space-y-4">
            {/* Benefits unlocked */}
            <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Benefits Unlocked</h3>
              <div className="space-y-3">
                {[
                  "Issue up to 5 virtual Visa cards",
                  "Spend up to $10,000 per month",
                  "Access to all 150+ supported countries",
                  "Priority customer support",
                  "Webhook & API access",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-[#c0d4ef]">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document history */}
            {data?.documents && data.documents.length > 0 && (
              <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Submitted Documents</h3>
                <div className="space-y-3">
                  {data.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-sm text-white capitalize">{doc.docType.replace("_", " ")}</div>
                          <div className="text-xs text-[#6b88b0]">{doc.country}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
            {/* Progress steps */}
            <div className="border-b border-[#0d2040] p-5">
              <div className="flex items-center gap-0">
                {["Personal Info", "Document", "Selfie", "Complete"].map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                      i + 1 < step ? "bg-emerald-500 text-white" :
                      i + 1 === step ? "bg-blue-700 text-white" :
                      "bg-[#0d2040] text-[#6b88b0]"
                    }`}>
                      {i + 1 < step ? "✓" : i + 1}
                    </div>
                    <div className="text-xs text-[#6b88b0] ml-1.5 hidden sm:block">{s}</div>
                    {i < 3 && <div className={`flex-1 h-px mx-2 ${i + 1 < step ? "bg-emerald-500/40" : "bg-[#0d2040]"}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white">Step 1: Select your country</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Country of Residence</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    >
                      <option value="">Select country…</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <Button onClick={() => form.country && setStep(2)} disabled={!form.country}>
                    Continue
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white">Step 2: Choose document type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {docTypes.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setForm({ ...form, docType: d.value })}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          form.docType === d.value
                            ? "border-blue-600 bg-blue-600/10"
                            : "border-[#0d2040] hover:border-blue-600/30"
                        }`}
                      >
                        <FileText className={`w-5 h-5 mb-2 ${form.docType === d.value ? "text-blue-400" : "text-[#6b88b0]"}`} />
                        <div className="text-sm font-medium text-white">{d.label}</div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Document Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. AB1234567"
                      value={form.docNumber}
                      onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white">Step 3: Upload your document</h3>
                  <p className="text-sm text-[#6b88b0]">Upload a clear photo of your {docTypes.find((d) => d.value === form.docType)?.label}.</p>

                  {/* Front side upload */}
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setFrontFile, setFrontPreview)}
                  />
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                      frontFile ? "border-blue-600/60 bg-blue-600/5" : "border-[#0d2040] hover:border-blue-600/40"
                    }`}
                  >
                    {frontPreview ? (
                      <div className="flex items-center gap-4">
                        <img src={frontPreview} alt="Front" className="w-16 h-16 rounded-lg object-cover border border-[#0d2040]" />
                        <div className="text-left">
                          <p className="text-sm text-white font-medium">{frontFile?.name}</p>
                          <p className="text-xs text-[#6b88b0] mt-0.5">{((frontFile?.size ?? 0) / 1024).toFixed(0)} KB · Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#6b88b0] mx-auto mb-3" />
                        <p className="text-sm text-white mb-1">Front side</p>
                        <p className="text-xs text-[#6b88b0]">JPG, PNG up to 10MB</p>
                      </>
                    )}
                  </div>

                  {/* Selfie upload */}
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview)}
                  />
                  <div
                    onClick={() => selfieInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                      selfieFile ? "border-blue-600/60 bg-blue-600/5" : "border-[#0d2040] hover:border-blue-600/40"
                    }`}
                  >
                    {selfiePreview ? (
                      <div className="flex items-center gap-4">
                        <img src={selfiePreview} alt="Selfie" className="w-16 h-16 rounded-lg object-cover border border-[#0d2040]" />
                        <div className="text-left">
                          <p className="text-sm text-white font-medium">{selfieFile?.name}</p>
                          <p className="text-xs text-[#6b88b0] mt-0.5">{((selfieFile?.size ?? 0) / 1024).toFixed(0)} KB · Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#6b88b0] mx-auto mb-3" />
                        <p className="text-sm text-white mb-1">Selfie with document</p>
                        <p className="text-xs text-[#6b88b0]">Clear photo, good lighting</p>
                      </>
                    )}
                  </div>

                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      Your documents are encrypted and processed securely. We comply with GDPR and do not store raw images after verification.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                    <Button loading={submitting} onClick={handleSubmit} disabled={!frontFile}>
                      Submit for Review
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Verification Complete!</h3>
                  <p className="text-sm text-[#6b88b0]">Your identity has been verified. You can now issue virtual cards.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
