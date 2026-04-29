import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";

const posts = [
  {
    title: "Why Stablecoins Are the Future of Cross-Border Payments",
    excerpt: "Sending money across borders is still slow and expensive. Stablecoins change the equation — but only if you can actually spend them.",
    date: "April 20, 2026",
    readTime: "5 min read",
    tag: "Insights",
  },
  {
    title: "How Virtual Visa Cards Work With Digital Wallets",
    excerpt: "A deep dive into how Volt bridges your USDC/USDT balance to a Visa card that works everywhere.",
    date: "April 5, 2026",
    readTime: "4 min read",
    tag: "Product",
  },
  {
    title: "NFC Payments in the Digital Currency Era",
    excerpt: "Tap-to-pay isn't just for credit cards anymore. Here's how NFC-enabled virtual cards are changing everyday spending.",
    date: "March 18, 2026",
    readTime: "3 min read",
    tag: "Technology",
  },
  {
    title: "KYC Without the Friction: Our Approach",
    excerpt: "We believe identity verification shouldn't take days. See how Volt completes KYC in under three minutes.",
    date: "March 1, 2026",
    readTime: "4 min read",
    tag: "Product",
  },
];

const tagColors: Record<string, string> = {
  Insights: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Product: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Technology: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
          <p className="text-[#6b88b0]">Thoughts on digital payments, stablecoins, and building fintech in Africa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.title}
              href="#"
              className="bg-[#061120] border border-[#0d2040] rounded-2xl p-6 hover:border-blue-500/30 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColors[post.tag]}`}>
                  {post.tag}
                </span>
                <span className="text-xs text-[#6b88b0]">{post.readTime}</span>
              </div>
              <h2 className="text-sm font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-xs text-[#6b88b0] leading-relaxed mb-3">{post.excerpt}</p>
              <span className="text-[10px] text-[#6b88b0]">{post.date}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
