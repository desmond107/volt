import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import EagleLogo from "@/components/ui/EagleLogo";

const team = [
  { name: "Desmond Kinoti", role: "Founder & CEO", bio: "Fintech builder focused on making digital currency accessible across Africa and beyond." },
  { name: "Engineering Team", role: "Product & Engineering", bio: "A distributed team building the infrastructure for stablecoin-powered payments." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <EagleLogo size={56} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">About Volt</h1>
          <p className="text-lg text-[#6b88b0] max-w-2xl mx-auto">
            We&apos;re building the financial layer for the next generation of digital payments — stablecoin-powered, globally accessible, and radically simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Our Mission</h2>
            <p className="text-sm text-[#6b88b0] leading-relaxed">
              To enable anyone, anywhere to spend digital currency as easily as swiping a card. We bridge the gap between stablecoins and everyday commerce through virtual Visa cards and simple wallet infrastructure.
            </p>
          </div>
          <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Our Vision</h2>
            <p className="text-sm text-[#6b88b0] leading-relaxed">
              A world where holding USDC, USDT, or DAI is as useful as holding cash — where you can pay for subscriptions, services, and everyday items without ever converting back to fiat.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">The Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm mb-3">
                  {member.name[0]}
                </div>
                <h3 className="text-sm font-semibold text-white">{member.name}</h3>
                <p className="text-xs text-blue-400 mb-2">{member.role}</p>
                <p className="text-xs text-[#6b88b0] leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center bg-[#061120] border border-[#0d2040] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-3">Get in touch</h2>
          <p className="text-sm text-[#6b88b0] mb-2">contact@usezpesa.com</p>
          <p className="text-xs text-[#6b88b0]">We&apos;re based in Nairobi, Kenya — building for the world.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
