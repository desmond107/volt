"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { CheckCircle2, X, HelpCircle, ChevronDown, ChevronUp, Building2, Users, Globe, Zap, Shield } from "lucide-react";

// ── Types & Data ──────────────────────────────────────────────────────────────

interface Feature {
  text: string;
  included: boolean;
  tooltip?: string;
}

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualTotal: number;
  desc: string;
  cta: string;
  href: string;
  highlight: boolean;
  badge?: string;
  features: Feature[];
}

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: 0,
    desc: "For individuals getting started with crypto payments",
    cta: "Get Started Free",
    href: "/auth/signup",
    highlight: false,
    features: [
      { text: "1 virtual Visa card",         included: true  },
      { text: "$500 monthly spend limit",    included: true,  tooltip: "Resets on the 1st of each month" },
      { text: "USDC, USDT, DAI support",     included: true  },
      { text: "Base & BSC networks",         included: true  },
      { text: "1% transaction fee",          included: true  },
      { text: "KYC Level 1",                 included: true,  tooltip: "Photo ID verification — completes in under 3 minutes" },
      { text: "API access",                  included: false },
      { text: "Webhooks",                    included: false },
      { text: "Multi-card management",       included: false },
      { text: "Priority support",            included: false },
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 19,
    annualPrice: 16,
    annualTotal: 190,
    desc: "For power users and small teams spending at scale",
    cta: "Start 14-Day Free Trial",
    href: "/auth/signup",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "5 virtual Visa cards",        included: true  },
      { text: "$10,000 monthly spend limit", included: true,  tooltip: "Resets on the 1st of each month" },
      { text: "USDC, USDT, DAI support",     included: true  },
      { text: "Base & BSC networks",         included: true  },
      { text: "0.5% transaction fee",        included: true  },
      { text: "KYC Level 2",                 included: true,  tooltip: "ID + selfie — unlocks $10k spend limit" },
      { text: "Full API access",             included: true,  tooltip: "REST API with 600 req/min rate limit" },
      { text: "Webhooks",                    included: true  },
      { text: "Multi-card management",       included: true  },
      { text: "Email support",               included: true  },
    ],
  },
  {
    name: "Business",
    monthlyPrice: 99,
    annualPrice: 82,
    annualTotal: 984,
    desc: "For businesses and developers building on top of Volt",
    cta: "Contact Sales",
    href: "mailto:sales@usevolt.com",
    highlight: false,
    features: [
      { text: "Unlimited virtual cards",     included: true  },
      { text: "Custom spend limits",         included: true,  tooltip: "Per-card limits up to $500,000/month" },
      { text: "All stablecoins & networks",  included: true  },
      { text: "Multi-chain support",         included: true  },
      { text: "0.1% transaction fee",        included: true  },
      { text: "KYC Level 3 + business",      included: true,  tooltip: "Entity + beneficial owner verification, 1–3 business days" },
      { text: "Full API + SDKs",             included: true,  tooltip: "Node.js, Python, Go, Ruby, PHP SDKs included" },
      { text: "Advanced webhooks",           included: true  },
      { text: "Team dashboard",              included: true  },
      { text: "Dedicated account manager",   included: true  },
    ],
  },
];

const feeRows = [
  ["Card payment",             "1%",     "0.5%",   "0.1%"  ],
  ["Wallet deposit",           "Free",   "Free",    "Free"  ],
  ["Wallet withdrawal",        "0.5%",   "0.25%",  "Free"  ],
  ["Stablecoin conversion",    "0.3%",   "0.15%",  "0.1%"  ],
  ["International transaction","+0.5%",  "+0.2%",  "Free"  ],
];

const faqItems = [
  { q: "Is there a free trial for Pro?",
    a: "Yes — Pro comes with a 14-day free trial. No credit card required. You'll only be billed after the trial ends if you choose to continue." },
  { q: "Can I switch plans at any time?",
    a: "Absolutely. Upgrade or downgrade at any time. Billing is prorated daily, so you only pay for what you use." },
  { q: "What stablecoins are supported?",
    a: "We support USDC, USDT, and DAI across Base and BSC networks. Ethereum mainnet support is coming in Q3 2026." },
  { q: "Is KYC mandatory?",
    a: "Yes — KYC is required to issue virtual cards and access higher spending limits. Most users complete Level 1 in under 3 minutes." },
  { q: "What is your refund policy?",
    a: "We offer a full refund within 7 days of your first payment. After that, refunds are handled on a case-by-case basis by our support team." },
  { q: "How long does business verification take?",
    a: "Business KYC (Level 3) typically takes 1–3 business days. We'll notify you by email as soon as your account is approved." },
  { q: "Are there limits on API requests?",
    a: "Pro accounts are limited to 600 requests/minute. Business accounts get custom rate limits — contact sales for details." },
  { q: "Is there a physical card option?",
    a: "Yes — a premium matte physical Volt card is available as an add-on for Pro and Business plans. Pricing starts at $15 shipped worldwide." },
];

// ── AnimatedPrice ─────────────────────────────────────────────────────────────

function AnimatedPrice({ to, duration = 500 }: { to: number; duration?: number }) {
  const [val, setVal]   = useState(0);
  const prevRef = useRef<number | null>(null);
  const rafRef  = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current ?? 0;
    prevRef.current = to;
    if (from === to) { setVal(to); return; }

    cancelAnimationFrame(rafRef.current);
    const start = performance.now();

    const tick = (now: number) => {
      const t      = Math.min((now - start) / duration, 1);
      const eased  = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setVal(to);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration]);

  return <>{val}</>;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-[#4a6080] hover:text-[#6b88b0] transition-colors ml-1"
        aria-label="More info"
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#0d2040] border border-[#163060] text-xs text-[#c0d4ef] rounded-lg px-3 py-2 z-20 pointer-events-none shadow-xl">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#163060]" />
        </span>
      )}
    </span>
  );
}

// ── FaqItem ───────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#071428] transition-colors"
      >
        <span className="text-sm font-semibold text-white pr-4">{q}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-[#6b88b0] shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#6b88b0] shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#0d2040]">
          <p className="text-sm text-[#6b88b0] pt-3 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual,       setAnnual]       = useState(false);
  const [hoveredRow,   setHoveredRow]   = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="pt-16">

        {/* Hero */}
        <div className="py-20 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Pay only for what you use</h1>
          <p className="text-[#6b88b0] text-lg max-w-xl mx-auto mb-8">
            No hidden fees. No lock-in. Start free and scale as you grow.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-[#061120] border border-[#0d2040] rounded-full px-2 py-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                !annual ? "bg-blue-600 text-white" : "text-[#6b88b0] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors flex items-center gap-2 ${
                annual ? "bg-blue-600 text-white" : "text-[#6b88b0] hover:text-white"
              }`}
            >
              Annual
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                annual ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                Save 2 months
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-24 space-y-16">

          {/* Social proof strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-4">
            {[
              { icon: Users,  stat: "10,000+",  label: "Developers"     },
              { icon: Globe,  stat: "150+",     label: "Countries"       },
              { icon: Zap,    stat: "$50M+",    label: "Processed"       },
              { icon: Shield, stat: "99.9%",    label: "Uptime SLA"      },
            ].map(({ icon: Icon, stat, label }) => (
              <div key={label} className="bg-[#061120] border border-[#0d2040] rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-base font-bold text-white leading-none">{stat}</div>
                  <div className="text-xs text-[#6b88b0] mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              const savings = plan.monthlyPrice > 0
                ? plan.monthlyPrice * 12 - plan.annualTotal
                : 0;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${
                    plan.highlight
                      ? "bg-gradient-to-b from-blue-950/80 to-[#061120] border border-blue-600/40 shadow-[0_0_40px_rgba(26,86,219,0.15)]"
                      : "bg-[#061120] border border-[#0d2040] hover:border-blue-600/20 hover:shadow-[0_0_30px_rgba(26,86,219,0.08)]"
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
                    <div className="text-sm font-semibold text-white mb-2">{plan.name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-white">
                        $<AnimatedPrice to={price} />
                      </span>
                      <span className="text-sm text-[#6b88b0]">/month</span>
                    </div>
                    {annual && savings > 0 && (
                      <div className="text-xs text-emerald-400 font-medium mb-1">
                        Save ${savings}/yr — billed ${plan.annualTotal}/year
                      </div>
                    )}
                    <p className="text-xs text-[#6b88b0]">{plan.desc}</p>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-center gap-2.5 text-sm">
                        {f.included
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          : <X           className="w-4 h-4 text-[#2d4a6e] shrink-0" />}
                        <span className={f.included ? "text-[#c0d4ef]" : "text-[#2d4a6e]"}>
                          {f.text}
                        </span>
                        {f.included && f.tooltip && <Tooltip text={f.tooltip} />}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <Button className="w-full" variant={plan.highlight ? "primary" : "secondary"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Enterprise tier */}
          <div className="bg-[#061120] border border-[#0d2040] hover:border-[#c9943a]/30 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,148,58,0.06)]">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-[#c9943a]/10 border border-[#c9943a]/20 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-[#c9943a]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-white">Enterprise</h3>
                  <span className="text-xs bg-[#c9943a]/10 text-[#c9943a] border border-[#c9943a]/20 px-2 py-0.5 rounded-full font-medium">
                    Custom pricing
                  </span>
                </div>
                <p className="text-sm text-[#6b88b0] max-w-xl">
                  High-volume processing, custom contract terms, SLA guarantees, dedicated infrastructure, and white-label options for fintechs and financial institutions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3 shrink-0">
                {[
                  "Custom rate limits",
                  "White-label cards",
                  "SLA guarantee",
                  "On-premise option",
                ].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-[#6b88b0]">
                    <CheckCircle2 className="w-3 h-3 text-[#c9943a] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <a href="mailto:enterprise@usevolt.com" className="shrink-0">
                <Button variant="secondary" className="border-[#c9943a]/30 text-[#c9943a] hover:bg-[#c9943a]/10 whitespace-nowrap">
                  Talk to Sales
                </Button>
              </a>
            </div>
          </div>

          {/* Fee comparison table */}
          <div>
            <h2 className="text-xl font-bold text-white text-center mb-8">Transaction Fees</h2>
            <div className="overflow-x-auto rounded-xl border border-[#0d2040]">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="sticky top-16 z-10">
                  <tr className="bg-[#040e1a] border-b border-[#0d2040]">
                    <th className="text-left px-6 py-4 text-xs text-[#6b88b0] uppercase tracking-wider">
                      Transaction Type
                    </th>
                    {["Starter", "Pro", "Business"].map((name) => (
                      <th key={name} className="text-center px-4 py-4 text-xs uppercase tracking-wider">
                        <span className={name === "Pro" ? "text-blue-400" : "text-[#6b88b0]"}>{name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#061120]">
                  {feeRows.map(([label, ...fees], i) => (
                    <tr
                      key={label}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`border-b border-[#0d2040] last:border-0 transition-colors cursor-default ${
                        hoveredRow === i ? "bg-[#071828]" : ""
                      }`}
                    >
                      <td className="px-6 py-3.5 text-[#c0d4ef]">{label}</td>
                      {fees.map((fee, j) => (
                        <td
                          key={j}
                          className={`px-4 py-3.5 text-center font-medium ${
                            fee === "Free" ? "text-emerald-400" : "text-white"
                          }`}
                        >
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
          <div>
            <h2 className="text-xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {faqItems.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center bg-gradient-to-br from-blue-950/60 via-[#061120] to-[#061120] border border-blue-600/20 rounded-2xl p-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-[#6b88b0] mb-6 max-w-md mx-auto">
              Join 10,000+ developers spending crypto with Volt. Free account, card issued in seconds.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/auth/signup">
                <Button size="lg">Get Started for Free</Button>
              </Link>
              <Link href="/developers">
                <Button variant="secondary" size="lg">View API Docs</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#4a6080]">No credit card required · Cancel anytime · SOC 2 Type II</p>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
