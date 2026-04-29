import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Code2, Zap, Shield, Globe, Copy } from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/v1/cards",
    desc: "Issue a new virtual Visa card",
    body: `{
  "label": "Shopping Card",
  "spend_limit": 500,
  "currency": "USD",
  "color": "#6366f1"
}`,
    response: `{
  "card": {
    "id": "card_abc123",
    "number": "4111111111114921",
    "cvv": "392",
    "expiry": "12/27",
    "status": "ACTIVE"
  }
}`,
  },
  {
    method: "GET",
    path: "/v1/cards",
    desc: "List all virtual cards",
    body: null,
    response: `{
  "cards": [
    {
      "id": "card_abc123",
      "label": "Shopping Card",
      "status": "ACTIVE",
      "spend_limit": 500,
      "spent": 123.45
    }
  ]
}`,
  },
  {
    method: "PATCH",
    path: "/v1/cards/:id",
    desc: "Freeze, unfreeze, or update a card",
    body: `{ "status": "FROZEN" }`,
    response: `{ "card": { "id": "card_abc123", "status": "FROZEN" } }`,
  },
  {
    method: "GET",
    path: "/v1/wallets",
    desc: "Get all stablecoin wallet balances",
    body: null,
    response: `{
  "wallets": [
    { "asset": "USDC", "network": "Base", "balance": 2450.00 },
    { "asset": "USDT", "network": "BSC",  "balance": 500.00 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/v1/wallets/deposit",
    desc: "Simulate a wallet deposit",
    body: `{ "wallet_id": "wlt_xyz", "amount": 100 }`,
    response: `{ "wallet": { "asset": "USDC", "balance": 2550.00 }, "transaction": { "id": "txn_dep_001" } }`,
  },
  {
    method: "GET",
    path: "/v1/transactions",
    desc: "List transactions with filtering and pagination",
    body: null,
    response: `{
  "transactions": [...],
  "total": 48,
  "page": 1,
  "pages": 3
}`,
  },
];

const sdks = [
  { name: "Node.js", install: "npm install @zpesa/sdk", color: "bg-yellow-500" },
  { name: "Python", install: "pip install zpesa-sdk", color: "bg-blue-500" },
  { name: "Go", install: "go get github.com/zpesa/sdk-go", color: "bg-amber-500" },
];

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  POST: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PATCH: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <div className="border-b border-[#0d2040] py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
              <Code2 className="w-3 h-3" />
              Developer API
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Build on Volt</h1>
            <p className="text-[#6b88b0] text-lg max-w-2xl mx-auto">
              A RESTful API and SDKs for Node.js, Python, and Go. Issue cards, manage wallets,
              and listen for webhook events — all in a few lines of code.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: Zap, label: "RESTful API" },
                { icon: Shield, label: "Secure Auth" },
                { icon: Globe, label: "Webhooks" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-[#061120] border border-[#0d2040] rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <span className="text-xs text-[#6b88b0]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
          {/* Authentication */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Authentication</h2>
            <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
              <p className="text-sm text-[#6b88b0] mb-4">
                All API requests must include your API key in the <code className="text-blue-300">Authorization</code> header as a Bearer token.
              </p>
              <pre className="bg-[#020c1b] border border-[#0d2040] rounded-lg p-4 text-sm font-mono text-emerald-300 overflow-x-auto">
{`curl https://api.usezpesa.com/v1/cards \\
  -H "Authorization: Bearer sk_live_your_api_key_here" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </section>

          {/* SDKs */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Quick Start with SDKs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sdks.map((sdk) => (
                <div key={sdk.name} className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                  <div className={`w-8 h-8 rounded-lg ${sdk.color} flex items-center justify-center text-white text-xs font-bold mb-3`}>
                    {sdk.name[0]}
                  </div>
                  <div className="text-sm font-semibold text-white mb-2">{sdk.name} SDK</div>
                  <code className="text-xs font-mono text-[#6b88b0] bg-[#020c1b] border border-[#0d2040] rounded px-2 py-1 block">
                    {sdk.install}
                  </code>
                </div>
              ))}
            </div>

            {/* Code example */}
            <div className="mt-4 bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d2040]">
                <span className="text-xs text-[#6b88b0]">Node.js example</span>
                <button className="text-xs text-[#6b88b0] flex items-center gap-1 hover:text-white">
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <pre className="p-5 text-sm font-mono overflow-x-auto text-[#c0d4ef] leading-relaxed">
{`import ZPesa from '@zpesa/sdk';

const client = new ZPesa({
  apiKey: process.env.ZPESA_API_KEY,
});

// Issue a virtual card
const card = await client.cards.create({
  label: 'My Shopping Card',
  spendLimit: 500,
  currency: 'USD',
});

console.log(card.number); // 4111111111114921

// Listen for card transactions
client.webhooks.on('card.transaction', (event) => {
  console.log('Charged:', event.amount, event.merchant);
});`}
              </pre>
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">API Reference</h2>
            <div className="space-y-4">
              {endpoints.map((ep, i) => (
                <div key={i} className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#0d2040]">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${methodColors[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-white">{ep.path}</code>
                    <span className="text-sm text-[#6b88b0] hidden sm:block">— {ep.desc}</span>
                  </div>
                  <div className={`grid ${ep.body ? "md:grid-cols-2" : "grid-cols-1"} gap-0 divide-x divide-[#0d2040]`}>
                    {ep.body && (
                      <div className="p-4">
                        <div className="text-xs text-[#6b88b0] uppercase tracking-wider mb-2">Request Body</div>
                        <pre className="text-xs font-mono text-amber-300 leading-relaxed overflow-x-auto">{ep.body}</pre>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="text-xs text-[#6b88b0] uppercase tracking-wider mb-2">Response</div>
                      <pre className="text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">{ep.response}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Webhooks */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Webhooks</h2>
            <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
              <p className="text-sm text-[#6b88b0] mb-4">
                Volt sends real-time POST requests to your endpoint for all card and wallet events.
                Verify authenticity using the <code className="text-blue-300">X-ZPesa-Signature</code> header.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { event: "card.transaction", desc: "Fired on every card charge" },
                  { event: "card.frozen", desc: "Card status changed to frozen" },
                  { event: "wallet.deposit", desc: "Funds received in wallet" },
                  { event: "wallet.withdrawal", desc: "Funds sent from wallet" },
                  { event: "kyc.verified", desc: "Identity verification completed" },
                  { event: "kyc.rejected", desc: "Identity verification rejected" },
                ].map((w) => (
                  <div key={w.event} className="flex items-start gap-3 bg-[#020c1b] border border-[#0d2040] rounded-lg p-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <code className="text-xs font-mono text-blue-300">{w.event}</code>
                      <p className="text-xs text-[#6b88b0] mt-0.5">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
