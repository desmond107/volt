import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import EagleLogo from "@/components/ui/EagleLogo";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Press & Media</h1>
          <p className="text-[#6b88b0]">Assets, facts, and contact info for journalists and media partners.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Company Facts</h2>
            <dl className="space-y-3 text-xs">
              {[
                ["Founded", "2025"],
                ["Headquarters", "Nairobi, Kenya"],
                ["Focus", "Stablecoin-powered Visa virtual cards"],
                ["Supported assets", "USDC, USDT, DAI"],
                ["Networks", "Ethereum, Base, BSC, Polygon"],
                ["Contact", "press@usezpesa.com"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-[#6b88b0]">{k}</dt>
                  <dd className="text-white font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
            <EagleLogo size={64} />
            <div className="text-center">
              <p className="text-sm font-bold text-white">Volt Digital Pay</p>
              <p className="text-[10px] text-[#c9943a] uppercase tracking-widest">Digital Pay</p>
            </div>
            <a
              href="/eagle-logo.png"
              download
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30 rounded-lg px-3 py-1.5"
            >
              Download Logo (PNG)
            </a>
          </div>
        </div>

        <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Media Enquiries</h2>
          <p className="text-xs text-[#6b88b0] mb-3">
            For interviews, product demos, or press coverage, reach out to our communications team.
          </p>
          <a href="mailto:press@usezpesa.com" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
            press@usezpesa.com →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
