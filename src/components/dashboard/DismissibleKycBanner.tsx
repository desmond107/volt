"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "volt-kyc-banner-dismissed";

export default function DismissibleKycBanner({ kycStatus }: { kycStatus: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed && kycStatus !== "VERIFIED") setVisible(true);
  }, [kycStatus]);

  if (!visible) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-yellow-300">Complete KYC to unlock card issuance</p>
          <p className="text-xs text-yellow-400/70">Verify your identity in under 3 minutes</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard/kyc">
          <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 whitespace-nowrap">
            Verify Now
          </Button>
        </Link>
        <button
          onClick={() => { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); }}
          className="text-yellow-400/60 hover:text-yellow-300 transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
