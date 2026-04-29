import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const items = [
  {
    quarter: "Q1 2025 — Shipped",
    status: "done",
    features: [
      "Virtual Visa card issuance",
      "USDC, USDT, DAI wallet support",
      "KYC Level 1 & Level 2",
      "Card freeze / unfreeze",
      "Transaction history",
    ],
  },
  {
    quarter: "Q2 2025 — In Progress",
    status: "active",
    features: [
      "NFC / contactless card support",
      "Wallet-to-card funding",
      "Cross-user USDT transfers",
      "Developer API v1",
      "Webhook events",
    ],
  },
  {
    quarter: "Q3 2025 — Planned",
    status: "planned",
    features: [
      "Multi-currency spend (KES, USD, EUR)",
      "Card spend analytics",
      "Merchant category controls",
      "Team / business accounts",
      "Mobile app (iOS & Android)",
    ],
  },
  {
    quarter: "Q4 2025 — Future",
    status: "planned",
    features: [
      "Physical card programme",
      "DeFi yield on idle balances",
      "Fiat on-ramp (M-Pesa, bank transfer)",
      "Multi-signature wallet support",
      "Regulated e-money licence (Kenya)",
    ],
  },
];

const iconMap = {
  done: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  active: <Clock className="w-5 h-5 text-blue-400 shrink-0" />,
  planned: <Circle className="w-5 h-5 text-[#6b88b0] shrink-0" />,
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Product Roadmap</h1>
          <p className="text-[#6b88b0]">What we&apos;ve built, what we&apos;re building, and where we&apos;re going.</p>
        </div>

        <div className="space-y-6">
          {items.map((phase) => (
            <div key={phase.quarter} className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                {iconMap[phase.status as keyof typeof iconMap]}
                <h2 className="text-sm font-semibold text-white">{phase.quarter}</h2>
              </div>
              <ul className="space-y-2">
                {phase.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#6b88b0]">
                    <span className="w-1 h-1 rounded-full bg-[#6b88b0] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
