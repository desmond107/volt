import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2, Clock } from "lucide-react";

const systems = [
  { name: "API Gateway", status: "operational", latency: "42ms" },
  { name: "Virtual Card Issuance", status: "operational", latency: "310ms" },
  { name: "Wallet Infrastructure", status: "operational", latency: "88ms" },
  { name: "Transaction Processing", status: "operational", latency: "124ms" },
  { name: "KYC Verification", status: "operational", latency: "560ms" },
  { name: "Authentication", status: "operational", latency: "31ms" },
  { name: "Dashboard", status: "operational", latency: "210ms" },
  { name: "Webhooks", status: "operational", latency: "67ms" },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-sm text-emerald-400 font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            All Systems Operational
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">System Status</h1>
          <p className="text-[#6b88b0] text-sm">Real-time status of Volt services</p>
        </div>

        <div className="bg-[#061120] border border-[#0d2040] rounded-2xl overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-[#0d2040] flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Service</span>
            <div className="flex gap-12 text-xs font-semibold text-white uppercase tracking-wider">
              <span>Latency</span>
              <span>Status</span>
            </div>
          </div>
          {systems.map((s, i) => (
            <div
              key={s.name}
              className={`px-5 py-4 flex items-center justify-between ${i < systems.length - 1 ? "border-b border-[#0d2040]" : ""}`}
            >
              <span className="text-sm text-white">{s.name}</span>
              <div className="flex items-center gap-12">
                <span className="text-xs text-[#6b88b0] w-12 text-right">{s.latency}</span>
                <div className="flex items-center gap-1.5 w-24 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 capitalize">{s.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#6b88b0]" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Uptime — Last 90 days</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-6 rounded-sm bg-emerald-500/70"
                title="100% uptime"
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[#6b88b0] mt-1.5">
            <span>90 days ago</span>
            <span className="text-emerald-400 font-medium">99.98% uptime</span>
            <span>Today</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
