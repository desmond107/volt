import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { CheckCircle2, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    desc: "For individuals getting started with crypto payments",
    cta: "Get Started Free",
    href: "/auth/signup",
    highlight: false,
    features: [
      { text: "1 virtual Visa card", included: true },
      { text: "$500 monthly spend limit", included: true },
      { text: "USDC, USDT, DAI support", included: true },
      { text: "Base & BSC networks", included: true },
      { text: "1% transaction fee", included: true },
      { text: "KYC (Level 1)", included: true },
      { text: "API access", included: false },
      { text: "Webhooks", included: false },
      { text: "Multi-card management", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "For power users and small teams spending at scale",
    cta: "Start Pro Trial",
    href: "/auth/signup",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "5 virtual Visa cards", included: true },
      { text: "$10,000 monthly spend limit", included: true },
      { text: "USDC, USDT, DAI support", included: true },
      { text: "Base & BSC networks", included: true },
      { text: "0.5% transaction fee", included: true },
      { text: "KYC (Level 2)", included: true },
      { text: "Full API access", included: true },
      { text: "Webhooks", included: true },
      { text: "Multi-card management", included: true },
      { text: "Email support", included: true },
    ],
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    desc: "For businesses and developers building on top of Volt",
    cta: "Contact Sales",
    href: "mailto:sales@usezpesa.com",
    highlight: false,
    features: [
      { text: "Unlimited virtual cards", included: true },
      { text: "Custom spend limits", included: true },
      { text: "All stablecoins & networks", included: true },
      { text: "Multi-chain support", included: true },
      { text: "0.1% transaction fee", included: true },
      { text: "KYC (Level 3 + business)", included: true },
      { text: "Full API + SDKs", included: true },
      { text: "Advanced webhooks", included: true },
      { text: "Team dashboard", included: true },
      { text: "Dedicated account manager", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <div className="py-20 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Pay only for what you use
          </h1>
          <p className="text-[#6b88b0] text-lg max-w-xl mx-auto">
            No hidden fees. No lock-in. Start free and scale as you grow.
          </p>
        </div>

        {/* Plans */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-b from-blue-950/80 to-[#061120] border border-blue-600/40"
                    : "bg-[#061120] border border-[#0d2040]"
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                  </>
                )}

                <div className="mb-5">
                  <div className="text-sm font-semibold text-white mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-[#6b88b0]">{plan.period}</span>
                  </div>
                  <p className="text-xs text-[#6b88b0]">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-[#2d4a6e] flex-shrink-0" />
                      )}
                      <span className={f.included ? "text-[#c0d4ef]" : "text-[#2d4a6e]"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "primary" : "secondary"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Fee table */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-white text-center mb-8">Transaction Fees</h2>
            <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#0d2040]">
                    <th className="text-left px-6 py-4 text-xs text-[#6b88b0] uppercase tracking-wider">Transaction Type</th>
                    <th className="text-center px-4 py-4 text-xs text-[#6b88b0] uppercase tracking-wider">Starter</th>
                    <th className="text-center px-4 py-4 text-xs text-[#6b88b0] uppercase tracking-wider">Pro</th>
                    <th className="text-center px-4 py-4 text-xs text-[#6b88b0] uppercase tracking-wider">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Card payment", "1%", "0.5%", "0.1%"],
                    ["Wallet deposit", "Free", "Free", "Free"],
                    ["Wallet withdrawal", "0.5%", "0.25%", "Free"],
                    ["Stablecoin conversion", "0.3%", "0.15%", "0.1%"],
                    ["International transaction", "+0.5%", "+0.2%", "Free"],
                  ].map(([label, ...fees]) => (
                    <tr key={label} className="border-b border-[#0d2040] last:border-0">
                      <td className="px-6 py-3.5 text-[#c0d4ef]">{label}</td>
                      {fees.map((fee, i) => (
                        <td key={i} className={`px-4 py-3.5 text-center ${fee === "Free" ? "text-emerald-400" : "text-white"}`}>
                          {fee}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  q: "Is there a free trial for Pro?",
                  a: "Yes — Pro comes with a 14-day free trial. No credit card required.",
                },
                {
                  q: "Can I switch plans at any time?",
                  a: "Absolutely. Upgrade or downgrade at any time. Billing is prorated daily.",
                },
                {
                  q: "What stablecoins are supported?",
                  a: "We support USDC, USDT, and DAI across Base and BSC networks, with more coming soon.",
                },
                {
                  q: "Is KYC mandatory?",
                  a: "Yes — KYC is required to issue virtual cards and access higher spending limits. Most users complete it in under 3 minutes.",
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-[#6b88b0]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
