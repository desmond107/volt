export default function SupportedAssets() {
  const assets = [
    { name: "USDC", network: "Base", color: "#2775ca", logo: "U" },
    { name: "USDT", network: "BSC", color: "#26a17b", logo: "T" },
    { name: "DAI", network: "Base", color: "#f4b731", logo: "D" },
    { name: "USDC", network: "BSC", color: "#2775ca", logo: "U" },
  ];

  return (
    <section className="py-20 border-y border-[#0d2040]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-[#6b88b0] mb-10 uppercase tracking-widest">
          Supported Stablecoins &amp; Networks
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {assets.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-[#061120] border border-[#0d2040] rounded-xl px-5 py-3 hover:border-blue-600/30 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: a.color }}
              >
                {a.logo}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{a.name}</div>
                <div className="text-xs text-[#6b88b0]">{a.network}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { label: "Visa Network", value: "All merchants" },
            { label: "Settlement", value: "On-chain, seconds" },
            { label: "KYC Required", value: "Yes (3 min avg)" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-lg font-semibold text-white">{item.value}</div>
              <div className="text-sm text-[#6b88b0]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
