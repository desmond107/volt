import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const entries = [
  {
    version: "v0.9.0",
    date: "April 28, 2026",
    tag: "New",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    changes: [
      "NFC contactless payments support on virtual cards",
      "Wallet-to-card funding transfer",
      "Connect / disconnect wallet to virtual card",
      "Card balance display on management page",
    ],
  },
  {
    version: "v0.8.0",
    date: "April 10, 2026",
    tag: "Improvement",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    changes: [
      "Rich virtual card face with gradient themes and chip",
      "Eagle logo across all brand touchpoints",
      "Contactless symbol on NFC-enabled cards",
      "Card reveal / hide CVV toggle",
    ],
  },
  {
    version: "v0.7.0",
    date: "March 22, 2026",
    tag: "New",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    changes: [
      "Send USDT to another user by email or wallet address",
      "Wallet-to-wallet transfer between own accounts",
      "M-Pesa KES equivalent amount displayed on deposit",
      "Spend limit and spend progress bar on cards",
    ],
  },
  {
    version: "v0.6.0",
    date: "February 14, 2026",
    tag: "New",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    changes: [
      "Virtual Visa card issuance (post-KYC)",
      "Card freeze and unfreeze",
      "Card termination",
      "Six card colour themes",
    ],
  },
  {
    version: "v0.5.0",
    date: "January 30, 2026",
    tag: "Improvement",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    changes: [
      "KYC Level 1 and Level 2 verification flow",
      "Document upload and selfie verification",
      "KYC banner on dashboard for unverified users",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Changelog</h1>
          <p className="text-[#6b88b0]">Every update, improvement, and fix — documented.</p>
        </div>

        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.version} className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono font-bold text-white">{entry.version}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${entry.tagColor}`}>
                  {entry.tag}
                </span>
                <span className="text-xs text-[#6b88b0] ml-auto">{entry.date}</span>
              </div>
              <ul className="space-y-2">
                {entry.changes.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-[#6b88b0]">
                    <span className="w-1 h-1 rounded-full bg-[#6b88b0] shrink-0 mt-2" />
                    {c}
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
