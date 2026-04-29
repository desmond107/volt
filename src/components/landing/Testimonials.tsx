const testimonials = [
  {
    quote:
      "Volt completely changed how I manage my crypto. I can now pay for my SaaS subscriptions directly in USDC without going through a CEX.",
    name: "Lena Fischer",
    role: "DeFi Developer",
    avatar: "LF",
    color: "bg-blue-600",
  },
  {
    quote:
      "The API is fantastic. We integrated card issuance into our app in under a day. The Node SDK is clean and well-documented.",
    name: "Marcus Okonkwo",
    role: "CTO at RemoteBase",
    avatar: "MO",
    color: "bg-amber-500",
  },
  {
    quote:
      "KYC took me 2 minutes and my card was ready immediately. I used it to book a hotel the same evening. Insane UX.",
    name: "Sofia Pérez",
    role: "Crypto Trader",
    avatar: "SP",
    color: "bg-emerald-500",
  },
  {
    quote:
      "Finally a way to spend USDT without worrying about gas fees or slippage. Volt handles everything seamlessly.",
    name: "Jin Park",
    role: "Freelance Designer",
    avatar: "JP",
    color: "bg-purple-500",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
            What our users say
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Loved by crypto users</h2>
          <p className="text-[#6b88b0] text-lg">
            Thousands of developers and crypto natives trust Volt daily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-[#061120] border border-[#0d2040] rounded-xl p-6 hover:border-blue-600/30 transition-colors"
            >
              <p className="text-[#c0d4ef] text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-[#6b88b0]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
