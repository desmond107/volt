import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const cookies = [
  { name: "session", purpose: "Keeps you logged in during your session", duration: "Session", type: "Essential" },
  { name: "csrf_token", purpose: "Protects against cross-site request forgery", duration: "Session", type: "Essential" },
  { name: "theme", purpose: "Remembers your display preferences", duration: "1 year", type: "Functional" },
  { name: "_analytics", purpose: "Aggregate usage analytics (no personal data)", duration: "90 days", type: "Analytics" },
];

const typeColors: Record<string, string> = {
  Essential: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Functional: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Analytics: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-xs text-[#6b88b0] mb-12">Last updated: April 28, 2026</p>

        <div className="space-y-8 mb-12">
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">What are cookies?</h2>
            <p className="text-sm text-[#6b88b0] leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. We use cookies to keep you signed in, remember your preferences, and understand how our platform is used.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Cookies we use</h2>
            <div className="bg-[#061120] border border-[#0d2040] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#0d2040] text-[10px] uppercase tracking-wider text-[#6b88b0] font-semibold">
                <span>Name</span><span>Purpose</span><span>Duration</span><span>Type</span>
              </div>
              {cookies.map((c, i) => (
                <div key={c.name} className={`grid grid-cols-4 gap-4 px-4 py-3 text-xs ${i < cookies.length - 1 ? "border-b border-[#0d2040]" : ""}`}>
                  <span className="font-mono text-white">{c.name}</span>
                  <span className="text-[#6b88b0]">{c.purpose}</span>
                  <span className="text-[#6b88b0]">{c.duration}</span>
                  <span className={`self-start text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeColors[c.type]}`}>{c.type}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Managing cookies</h2>
            <p className="text-sm text-[#6b88b0] leading-relaxed">
              You can control cookies through your browser settings. Disabling essential cookies will prevent you from using certain features of Volt. For more information, contact privacy@usezpesa.com.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
