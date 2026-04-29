import {
  CreditCard,
  Wallet,
  Globe,
  Zap,
  Shield,
  Code2,
  RefreshCw,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Instant Virtual Cards",
    description:
      "Get a Visa virtual card in seconds after signup. Fund it from your stablecoin wallet and start spending immediately.",
    color: "text-blue-400",
    bg: "bg-blue-600/10",
  },
  {
    icon: Wallet,
    title: "Multi-Asset Wallets",
    description:
      "Hold USDC, USDT, and DAI across Base and BSC networks in one unified dashboard.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Globe,
    title: "150+ Countries",
    description:
      "Accepted at all Visa merchants worldwide. Shop online, subscribe to services, or pay in-person.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "On-Chain Settlement",
    description:
      "Transactions settle on-chain in seconds. Full transparency with real-time blockchain confirmations.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description:
      "Your funds are protected by multi-layer encryption, 2FA, and real-time fraud monitoring.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Code2,
    title: "Developer API",
    description:
      "RESTful API with SDKs for Node.js, Python, and Go. Issue and manage cards programmatically.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: RefreshCw,
    title: "Instant Conversions",
    description:
      "Swap between USDC, USDT, and DAI at market rates with minimal slippage directly in your wallet.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Get instant push notifications and webhook events for every transaction on your cards.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Built for the crypto-native world
          </h2>
          <p className="text-[#6b88b0] text-lg max-w-xl mx-auto">
            Every feature is designed to make spending your crypto as seamless as using a bank card.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 hover:border-blue-600/30 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-[#6b88b0] leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
