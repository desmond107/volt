import { UserCheck, Wallet, CreditCard, ShoppingCart } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserCheck,
    title: "Create your account",
    description:
      "Sign up with your email and complete our streamlined KYC process. Most users finish in under 3 minutes.",
    color: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  },
  {
    step: "02",
    icon: Wallet,
    title: "Fund your wallet",
    description:
      "Deposit USDC, USDT, or DAI to your Volt wallet address from any exchange or DeFi protocol.",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    step: "03",
    icon: CreditCard,
    title: "Get your virtual card",
    description:
      "Your Visa virtual card is issued instantly. Set a spending limit and link it to your stablecoin balance.",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    step: "04",
    icon: ShoppingCart,
    title: "Spend anywhere",
    description:
      "Use your card at any Visa-accepting merchant online or in-person. Transactions settle on-chain in real time.",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            Get started in minutes
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">How Volt works</h2>
          <p className="text-[#6b88b0] text-lg max-w-xl mx-auto">
            From crypto wallet to global spending card in four simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-600/30 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  <div
                    className={`relative w-20 h-20 rounded-2xl border flex flex-col items-center justify-center mb-5 ${s.color}`}
                  >
                    <Icon className="w-7 h-7" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#020c1b] border border-[#0d2040] text-[10px] font-bold text-[#6b88b0] flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-[#6b88b0] leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "150+", label: "Countries" },
            { value: "$0", label: "Monthly Fee" },
            { value: "3 min", label: "Avg KYC Time" },
            { value: "99.9%", label: "Uptime SLA" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#061120] border border-[#0d2040] rounded-xl p-6 text-center"
            >
              <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-[#6b88b0]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
