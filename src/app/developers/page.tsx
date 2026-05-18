"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  Code2, Zap, Shield, Globe, Copy, Check, ChevronDown, ChevronUp,
  Key, Play, AlertCircle, Clock, BookOpen, Terminal, Lock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Param {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

interface Endpoint {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  desc: string;
  params?: Param[];
  body: string | null;
  response: string;
  errors: { code: number; message: string }[];
}

type Lang = "curl" | "nodejs" | "python";

// ── Data ──────────────────────────────────────────────────────────────────────

const endpoints: Endpoint[] = [
  {
    id: "list-cards",
    method: "GET",
    path: "/v1/cards",
    desc: "List all virtual cards",
    params: [
      { name: "status",  type: "string",  required: false, desc: "Filter by ACTIVE | FROZEN | TERMINATED" },
      { name: "page",    type: "integer", required: false, desc: "Page number (default: 1)" },
      { name: "limit",   type: "integer", required: false, desc: "Results per page, max 100 (default: 20)" },
    ],
    body: null,
    response: `{\n  "cards": [\n    {\n      "id": "card_abc123",\n      "label": "Shopping Card",\n      "status": "ACTIVE",\n      "spend_limit": 500,\n      "spent": 123.45,\n      "currency": "USD"\n    }\n  ],\n  "total": 12,\n  "page": 1,\n  "pages": 1\n}`,
    errors: [
      { code: 401, message: "Invalid or missing API key" },
      { code: 429, message: "Rate limit exceeded — retry after X-RateLimit-Reset" },
    ],
  },
  {
    id: "get-card",
    method: "GET",
    path: "/v1/cards/:id",
    desc: "Retrieve a single card by ID",
    params: [
      { name: "id", type: "string", required: true, desc: "Card ID (path parameter)" },
    ],
    body: null,
    response: `{\n  "card": {\n    "id": "card_abc123",\n    "label": "Shopping Card",\n    "number": "4111111111114921",\n    "cvv": "392",\n    "expiry": "12/27",\n    "status": "ACTIVE",\n    "spend_limit": 500,\n    "spent": 123.45,\n    "currency": "USD",\n    "created_at": "2026-01-15T10:30:00Z"\n  }\n}`,
    errors: [
      { code: 401, message: "Invalid or missing API key" },
      { code: 404, message: "Card not found" },
    ],
  },
  {
    id: "create-card",
    method: "POST",
    path: "/v1/cards",
    desc: "Issue a new virtual Visa card",
    body: `{\n  "label": "Shopping Card",\n  "spend_limit": 500,\n  "currency": "USD",\n  "color": "#6366f1"\n}`,
    response: `{\n  "card": {\n    "id": "card_abc123",\n    "number": "4111111111114921",\n    "cvv": "392",\n    "expiry": "12/27",\n    "status": "ACTIVE"\n  }\n}`,
    errors: [
      { code: 400, message: "spend_limit must be a positive number" },
      { code: 401, message: "Invalid or missing API key" },
      { code: 422, message: "KYC verification required before issuing cards" },
    ],
  },
  {
    id: "update-card",
    method: "PATCH",
    path: "/v1/cards/:id",
    desc: "Freeze, unfreeze, or update a card",
    body: `{ "status": "FROZEN" }`,
    response: `{ "card": { "id": "card_abc123", "status": "FROZEN" } }`,
    errors: [
      { code: 400, message: "Invalid status value" },
      { code: 401, message: "Invalid or missing API key" },
      { code: 404, message: "Card not found" },
    ],
  },
  {
    id: "delete-card",
    method: "DELETE",
    path: "/v1/cards/:id",
    desc: "Permanently terminate a card",
    body: null,
    response: `{ "deleted": true, "id": "card_abc123" }`,
    errors: [
      { code: 401, message: "Invalid or missing API key" },
      { code: 404, message: "Card not found" },
      { code: 409, message: "Card is already terminated" },
    ],
  },
  {
    id: "list-wallets",
    method: "GET",
    path: "/v1/wallets",
    desc: "Get all stablecoin wallet balances",
    params: [
      { name: "network", type: "string", required: false, desc: "Filter by Base | BSC | Ethereum" },
      { name: "asset",   type: "string", required: false, desc: "Filter by USDC | USDT | DAI" },
    ],
    body: null,
    response: `{\n  "wallets": [\n    { "id": "wlt_xyz", "asset": "USDC", "network": "Base", "balance": 2450.00 },\n    { "id": "wlt_abc", "asset": "USDT", "network": "BSC",  "balance": 500.00 }\n  ]\n}`,
    errors: [
      { code: 401, message: "Invalid or missing API key" },
    ],
  },
  {
    id: "deposit-wallet",
    method: "POST",
    path: "/v1/wallets/deposit",
    desc: "Simulate a wallet deposit",
    body: `{ "wallet_id": "wlt_xyz", "amount": 100 }`,
    response: `{\n  "wallet": { "asset": "USDC", "balance": 2550.00 },\n  "transaction": { "id": "txn_dep_001", "amount": 100, "status": "CONFIRMED" }\n}`,
    errors: [
      { code: 400, message: "amount must be greater than 0" },
      { code: 401, message: "Invalid or missing API key" },
      { code: 404, message: "Wallet not found" },
    ],
  },
  {
    id: "list-transactions",
    method: "GET",
    path: "/v1/transactions",
    desc: "List transactions with filtering and pagination",
    params: [
      { name: "card_id", type: "string",   required: false, desc: "Filter by card ID" },
      { name: "status",  type: "string",   required: false, desc: "PENDING | COMPLETED | DECLINED | REFUNDED" },
      { name: "from",    type: "ISO 8601", required: false, desc: "Start date filter" },
      { name: "to",      type: "ISO 8601", required: false, desc: "End date filter" },
      { name: "page",    type: "integer",  required: false, desc: "Page number (default: 1)" },
      { name: "limit",   type: "integer",  required: false, desc: "Results per page, max 100 (default: 20)" },
    ],
    body: null,
    response: `{\n  "transactions": [\n    {\n      "id": "txn_001",\n      "card_id": "card_abc123",\n      "amount": 29.99,\n      "currency": "USD",\n      "merchant": "Spotify",\n      "status": "COMPLETED",\n      "created_at": "2026-01-15T10:30:00Z"\n    }\n  ],\n  "total": 48,\n  "page": 1,\n  "pages": 3\n}`,
    errors: [
      { code: 400, message: "Invalid date format for from/to parameters" },
      { code: 401, message: "Invalid or missing API key" },
      { code: 429, message: "Rate limit exceeded" },
    ],
  },
  {
    id: "simulate-transaction",
    method: "POST",
    path: "/v1/transactions/simulate",
    desc: "Simulate a card transaction for testing",
    body: `{\n  "card_id": "card_abc123",\n  "amount": 29.99,\n  "currency": "USD",\n  "merchant": "Test Store",\n  "category": "Shopping"\n}`,
    response: `{\n  "transaction": {\n    "id": "txn_sim_001",\n    "amount": 29.99,\n    "currency": "USD",\n    "merchant": "Test Store",\n    "status": "COMPLETED",\n    "card_balance_after": 470.01\n  }\n}`,
    errors: [
      { code: 400, message: "amount exceeds card spend limit" },
      { code: 400, message: "Card is frozen or terminated" },
      { code: 401, message: "Invalid or missing API key" },
      { code: 404, message: "Card not found" },
    ],
  },
  {
    id: "list-webhooks",
    method: "GET",
    path: "/v1/webhooks",
    desc: "List all registered webhook endpoints",
    body: null,
    response: `{\n  "webhooks": [\n    {\n      "id": "wh_001",\n      "url": "https://your-app.com/webhook",\n      "events": ["card.transaction", "wallet.deposit"],\n      "status": "ACTIVE",\n      "created_at": "2026-01-01T00:00:00Z"\n    }\n  ]\n}`,
    errors: [
      { code: 401, message: "Invalid or missing API key" },
    ],
  },
];

const sdkExamples = {
  nodejs: (key: string) => `import Volt from '@volt/sdk';

const client = new Volt({ apiKey: "${key || "YOUR_API_KEY"}" });

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
});`,

  python: (key: string) => `import volt

client = volt.Client(api_key="${key || "YOUR_API_KEY"}")

# Issue a virtual card
card = client.cards.create(
    label="My Shopping Card",
    spend_limit=500,
    currency="USD",
)

print(card.number)  # 4111111111114921

# Handle webhook events
@volt.webhook_handler("card.transaction")
def on_transaction(event):
    print(f"Charged: {event.amount} at {event.merchant}")`,

  go: (key: string) => `package main

import (
    "fmt"
    volt "github.com/volt/sdk-go"
)

func main() {
    client := volt.NewClient("${key || "YOUR_API_KEY"}")

    // Issue a virtual card
    card, err := client.Cards.Create(volt.CardParams{
        Label:      "My Shopping Card",
        SpendLimit: 500,
        Currency:   "USD",
    })
    if err != nil {
        panic(err)
    }

    fmt.Println(card.Number) // 4111111111114921
}`,

  ruby: (key: string) => `require 'volt-sdk'

client = Volt::Client.new(api_key: '${key || "YOUR_API_KEY"}')

# Issue a virtual card
card = client.cards.create(
  label: 'My Shopping Card',
  spend_limit: 500,
  currency: 'USD'
)

puts card.number # 4111111111114921

# Handle webhook events
client.webhooks.on('card.transaction') do |event|
  puts "Charged: \#{event.amount} at \#{event.merchant}"
end`,

  php: (key: string) => `<?php

require_once 'vendor/autoload.php';

use Volt\\Client;

$client = new Client('${key || "YOUR_API_KEY"}');

// Issue a virtual card
$card = $client->cards->create([
    'label'       => 'My Shopping Card',
    'spend_limit' => 500,
    'currency'    => 'USD',
]);

echo $card->number; // 4111111111114921

// Handle webhook events
$client->webhooks->on('card.transaction', function ($event) {
    echo "Charged: {$event->amount} at {$event->merchant}";
});`,
};

const changelog = [
  { version: "v1.5.0", date: "2026-05-18", note: "Ruby and PHP SDKs released. gem install volt-sdk / composer require volt/sdk." },
  { version: "v1.4.0", date: "2026-05-01", note: "Added /v1/transactions/simulate endpoint for sandbox testing." },
  { version: "v1.3.0", date: "2026-03-15", note: "Added /v1/webhooks management endpoints. DAI support on Ethereum mainnet." },
  { version: "v1.2.0", date: "2026-01-20", note: "Added pagination to /v1/transactions and /v1/cards. Rate limiting headers introduced." },
  { version: "v1.1.0", date: "2024-11-10", note: "Go SDK released. Webhook signature verification via X-Volt-Signature." },
  { version: "v1.0.0", date: "2024-09-01", note: "Initial stable release. Node.js and Python SDKs available." },
];

const navSections = [
  { id: "api-key",       label: "API Key" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limiting", label: "Rate Limiting" },
  { id: "sdks",          label: "SDKs" },
  { id: "reference",     label: "API Reference" },
  { id: "webhooks",      label: "Webhooks" },
  { id: "changelog",     label: "Changelog" },
];

const methodColors: Record<string, string> = {
  GET:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  POST:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PATCH:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

const errorColor = (code: number) => {
  if (code === 429) return "text-purple-400";
  if (code >= 500)  return "text-red-400";
  if (code >= 400)  return "text-orange-400";
  return "text-[#6b88b0]";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function snippet(ep: Endpoint, lang: Lang, apiKey: string): string {
  const key = apiKey || "sk_live_your_api_key_here";
  const url  = `https://api.usevolt.com${ep.path}`;
  const bodyOneLiner = ep.body ? ep.body.replace(/\s+/g, " ") : null;

  if (lang === "curl") {
    const parts = [`curl "${url}"`];
    if (ep.method !== "GET") parts.push(`  -X ${ep.method}`);
    parts.push(`  -H "Authorization: Bearer ${key}"`);
    parts.push(`  -H "Content-Type: application/json"`);
    if (bodyOneLiner) parts.push(`  -d '${bodyOneLiner}'`);
    return parts.join(" \\\n");
  }

  if (lang === "nodejs") {
    const bodyStr = ep.body ? `,\n  body: JSON.stringify(${ep.body})` : "";
    return `const res = await fetch("${url}", {
  method: "${ep.method}",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json",
  }${bodyStr}
});
const data = await res.json();
console.log(data);`;
  }

  const bodyStr = ep.body ? `,\n    json=${ep.body.replace(/"/g, "'")}` : "";
  return `import requests

res = requests.${ep.method.toLowerCase()}(
    "${url}",
    headers={"Authorization": f"Bearer ${key}"}${bodyStr}
)
print(res.json())`;
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 text-xs transition-colors ${
        copied ? "text-emerald-400" : "text-[#6b88b0] hover:text-white"
      } ${className}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── EndpointCard ──────────────────────────────────────────────────────────────

function EndpointCard({ ep, apiKey }: { ep: Endpoint; apiKey: string }) {
  const [open,       setOpen]       = useState(false);
  const [lang,       setLang]       = useState<Lang>("curl");
  const [tryOpen,    setTryOpen]    = useState(false);
  const [tryBody,    setTryBody]    = useState(ep.body ?? "");
  const [tryResult,  setTryResult]  = useState<string | null>(null);
  const [tryLoading, setTryLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleRun = async () => {
    setTryLoading(true);
    setTryResult(null);
    await new Promise(r => setTimeout(r, 700));
    setTryResult(ep.response);
    setTryLoading(false);
  };

  const code = snippet(ep, lang, apiKey);

  return (
    <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
      {/* Header row — always visible, click to expand */}
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#071428] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${methodColors[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm font-mono text-white">{ep.path}</code>
        <span className="text-sm text-[#6b88b0] hidden sm:block flex-1 truncate">— {ep.desc}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-[#4a6080] shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#4a6080] shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-[#0d2040]">

          {/* Parameters */}
          {ep.params && ep.params.length > 0 && (
            <div className="px-5 py-4 border-b border-[#0d2040]">
              <div className="text-xs text-[#6b88b0] uppercase tracking-wider mb-3">Parameters</div>
              <div className="space-y-2">
                {ep.params.map(p => (
                  <div key={p.name} className="flex items-start gap-3 text-xs">
                    <code className="text-blue-300 font-mono w-28 shrink-0">{p.name}</code>
                    <span className="text-[#4a6080] w-20 shrink-0">{p.type}</span>
                    {p.required
                      ? <span className="text-red-400 text-[10px] uppercase tracking-wide w-16 shrink-0">required</span>
                      : <span className="text-[#2d4a6e] text-[10px] uppercase tracking-wide w-16 shrink-0">optional</span>}
                    <span className="text-[#6b88b0]">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language selector + code snippet */}
          <div className="border-b border-[#0d2040]">
            <div className="flex items-center justify-between px-5 py-2 border-b border-[#0d2040]">
              <div className="flex gap-1">
                {(["curl", "nodejs", "python"] as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`text-xs px-3 py-1 rounded-md transition-colors ${
                      lang === l ? "bg-blue-500/20 text-blue-300" : "text-[#6b88b0] hover:text-white"
                    }`}
                  >
                    {l === "nodejs" ? "Node.js" : l === "python" ? "Python" : "cURL"}
                  </button>
                ))}
              </div>
              <CopyButton text={code} />
            </div>
            <pre className="px-5 py-4 text-xs font-mono text-[#c0d4ef] leading-relaxed overflow-x-auto">
              {code}
            </pre>
          </div>

          {/* Request body + response */}
          <div className={`grid ${ep.body ? "md:grid-cols-2" : "grid-cols-1"} divide-x divide-[#0d2040]`}>
            {ep.body && (
              <div className="p-4">
                <div className="text-xs text-[#6b88b0] uppercase tracking-wider mb-2">Request Body</div>
                <pre className="text-xs font-mono text-amber-300 leading-relaxed overflow-x-auto">{ep.body}</pre>
              </div>
            )}
            <div className="p-4">
              <div className="text-xs text-[#6b88b0] uppercase tracking-wider mb-2">Response 200</div>
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">{ep.response}</pre>
            </div>
          </div>

          {/* Error codes (collapsible) */}
          <div className="px-5 py-3 border-t border-[#0d2040]">
            <button
              onClick={() => setShowErrors(v => !v)}
              className="flex items-center gap-1.5 text-xs text-[#6b88b0] hover:text-white transition-colors"
            >
              <AlertCircle className="w-3 h-3" />
              Error codes
              {showErrors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showErrors && (
              <div className="mt-3 space-y-2">
                {ep.errors.map(e => (
                  <div key={`${e.code}-${e.message}`} className="flex items-center gap-3 text-xs">
                    <span className={`font-mono font-bold w-8 shrink-0 ${errorColor(e.code)}`}>{e.code}</span>
                    <span className="text-[#6b88b0]">{e.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Try it panel */}
          <div className="border-t border-[#0d2040] px-5 py-3">
            <button
              onClick={() => setTryOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              <Play className="w-3 h-3" />
              Try it
              {tryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {tryOpen && (
              <div className="mt-3 space-y-3">
                {ep.body && (
                  <div>
                    <div className="text-xs text-[#6b88b0] mb-1.5">Request body</div>
                    <textarea
                      className="w-full text-xs font-mono rounded-lg p-3 resize-none"
                      rows={5}
                      value={tryBody}
                      onChange={e => setTryBody(e.target.value)}
                    />
                  </div>
                )}
                <button
                  onClick={handleRun}
                  disabled={tryLoading}
                  className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <Play className="w-3 h-3" />
                  {tryLoading ? "Sending…" : "Send Request"}
                </button>
                {tryResult && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-emerald-400 font-medium">200 OK</span>
                      <CopyButton text={tryResult} />
                    </div>
                    <pre className="bg-[#020c1b] border border-[#0d2040] rounded-lg p-3 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
                      {tryResult}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── SdkTabs ───────────────────────────────────────────────────────────────────

type SdkLang = "nodejs" | "python" | "go" | "ruby" | "php";

function SdkTabs({ apiKey }: { apiKey: string }) {
  const [tab, setTab] = useState<SdkLang>("nodejs");

  const sdks: { id: SdkLang; name: string; install: string; dot: string }[] = [
    { id: "nodejs", name: "Node.js", install: "npm install @volt/sdk",         dot: "bg-yellow-500"  },
    { id: "python", name: "Python",  install: "pip install volt-sdk",          dot: "bg-blue-500"    },
    { id: "go",     name: "Go",      install: "go get github.com/volt/sdk-go", dot: "bg-cyan-600"    },
    { id: "ruby",   name: "Ruby",    install: "gem install volt-sdk",          dot: "bg-red-500"     },
    { id: "php",    name: "PHP",     install: "composer require volt/sdk",     dot: "bg-indigo-500"  },
  ];

  const code = sdkExamples[tab](apiKey);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {sdks.map(sdk => (
          <button
            key={sdk.id}
            onClick={() => setTab(sdk.id)}
            className={`bg-[#061120] border rounded-xl p-4 text-left transition-colors ${
              tab === sdk.id ? "border-blue-500/40" : "border-[#0d2040] hover:border-[#1a3060]"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg ${sdk.dot} flex items-center justify-center text-white text-xs font-bold mb-3`}>
              {sdk.name[0]}
            </div>
            <div className="text-sm font-semibold text-white mb-2">{sdk.name} SDK</div>
            <code className="text-xs font-mono text-[#6b88b0] bg-[#020c1b] border border-[#0d2040] rounded px-2 py-1 block truncate">
              {sdk.install}
            </code>
          </button>
        ))}
      </div>

      <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d2040]">
          <span className="text-xs text-[#6b88b0]">{sdks.find(s => s.id === tab)?.name} example</span>
          <CopyButton text={code} />
        </div>
        <pre className="p-5 text-sm font-mono overflow-x-auto text-[#c0d4ef] leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const WEBHOOK_PAYLOAD = `POST https://your-app.com/webhook
Content-Type: application/json
X-Volt-Signature: sha256=3a7bd3e2...

{
  "id": "evt_001",
  "type": "card.transaction",
  "created_at": "2026-01-15T10:30:00Z",
  "data": {
    "transaction_id": "txn_001",
    "card_id": "card_abc123",
    "amount": 29.99,
    "currency": "USD",
    "merchant": "Spotify",
    "category": "Entertainment",
    "status": "COMPLETED"
  }
}`;

const WEBHOOK_VERIFY = `import crypto from 'crypto';

function verifyWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(\`sha256=\${expected}\`),
    Buffer.from(signature)
  );
}

// Express handler
app.post('/webhook', (req, res) => {
  const sig = req.headers['x-volt-signature'];
  if (!verifyWebhook(req.rawBody, sig, process.env.VOLT_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = req.body;
  // handle event.type ...
  res.sendStatus(200);
});`;

export default function DevelopersPage() {
  const [apiKey,        setApiKey]        = useState("");
  const [activeSection, setActiveSection] = useState("api-key");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 130;
      let current = navSections[0].id;
      for (const s of navSections) {
        const el = sectionRefs.current[s.id];
        if (el && el.offsetTop <= y) current = s.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) =>
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  const ref = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };

  const authCurl = `curl "https://api.usevolt.com/v1/cards" \\\n  -H "Authorization: Bearer ${apiKey || "sk_live_your_api_key_here"}" \\\n  -H "Content-Type: application/json"`;

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
                { icon: Zap,    label: "RESTful API" },
                { icon: Shield, label: "Secure Auth"  },
                { icon: Globe,  label: "Webhooks"     },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-[#061120] border border-[#0d2040] rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <span className="text-xs text-[#6b88b0]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="max-w-7xl mx-auto flex gap-8 px-4 py-12">

          {/* Sticky sidebar */}
          <aside className="hidden lg:block w-44 shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              <p className="text-[10px] text-[#4a6080] uppercase tracking-wider mb-3 font-semibold px-3">
                On this page
              </p>
              {navSections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors ${
                    activeSection === s.id
                      ? "text-blue-300 bg-blue-500/10"
                      : "text-[#6b88b0] hover:text-white hover:bg-[#061120]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-16 min-w-0">

            {/* ── API Key ── */}
            <section ref={ref("api-key")} id="api-key">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-[#c9943a]" />
                <h2 className="text-xl font-bold text-white">Your API Key</h2>
              </div>
              <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                <p className="text-sm text-[#6b88b0] mb-4">
                  Paste your API key below to have it automatically injected into every code example on this page.
                </p>
                <div className="flex gap-3">
                  <input
                    type="password"
                    placeholder="sk_live_your_api_key_here"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  {apiKey && (
                    <button
                      onClick={() => setApiKey("")}
                      className="text-xs text-[#6b88b0] hover:text-white px-3 border border-[#0d2040] rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {apiKey && (
                  <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    API key injected into all examples
                  </p>
                )}
              </div>
            </section>

            {/* ── Authentication ── */}
            <section ref={ref("authentication")} id="authentication">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Authentication</h2>
              </div>
              <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                <p className="text-sm text-[#6b88b0] mb-4">
                  All requests must include your API key in the{" "}
                  <code className="text-blue-300">Authorization</code> header as a Bearer token.
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#6b88b0]">cURL</span>
                  <CopyButton text={authCurl} />
                </div>
                <pre className="bg-[#020c1b] border border-[#0d2040] rounded-lg p-4 text-sm font-mono text-emerald-300 overflow-x-auto">
                  {authCurl}
                </pre>
              </div>
            </section>

            {/* ── Rate Limiting ── */}
            <section ref={ref("rate-limiting")} id="rate-limiting">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Rate Limiting</h2>
              </div>
              <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5 space-y-4">
                <p className="text-sm text-[#6b88b0]">
                  The API is rate-limited to{" "}
                  <span className="text-white font-medium">600 requests / minute</span> per API key.
                  Exceeding the limit returns{" "}
                  <code className="text-red-400">429 Too Many Requests</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { header: "X-RateLimit-Limit",     desc: "Max requests allowed per window" },
                    { header: "X-RateLimit-Remaining", desc: "Requests remaining in current window" },
                    { header: "X-RateLimit-Reset",     desc: "Unix timestamp when window resets" },
                  ].map(h => (
                    <div key={h.header} className="bg-[#020c1b] border border-[#0d2040] rounded-lg p-3">
                      <code className="text-xs font-mono text-blue-300 block mb-1">{h.header}</code>
                      <p className="text-xs text-[#6b88b0]">{h.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── SDKs ── */}
            <section ref={ref("sdks")} id="sdks">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Quick Start with SDKs</h2>
              </div>
              <SdkTabs apiKey={apiKey} />
            </section>

            {/* ── API Reference ── */}
            <section ref={ref("reference")} id="reference">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold text-white">API Reference</h2>
              </div>
              <p className="text-sm text-[#6b88b0] mb-4">Click any endpoint to expand details, code snippets, and the interactive Try it panel.</p>
              <div className="space-y-3">
                {endpoints.map(ep => (
                  <EndpointCard key={ep.id} ep={ep} apiKey={apiKey} />
                ))}
              </div>
            </section>

            {/* ── Webhooks ── */}
            <section ref={ref("webhooks")} id="webhooks">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Webhooks</h2>
              </div>
              <div className="space-y-4">

                {/* Event list */}
                <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                  <p className="text-sm text-[#6b88b0] mb-4">
                    Volt sends real-time <code className="text-blue-300">POST</code> requests to your endpoint for all
                    card and wallet events. Verify authenticity with the{" "}
                    <code className="text-blue-300">X-Volt-Signature</code> header.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { event: "card.transaction", desc: "Fired on every card charge" },
                      { event: "card.frozen",      desc: "Card status changed to frozen" },
                      { event: "wallet.deposit",   desc: "Funds received in wallet" },
                      { event: "wallet.withdrawal",desc: "Funds sent from wallet" },
                      { event: "kyc.verified",     desc: "Identity verification completed" },
                      { event: "kyc.rejected",     desc: "Identity verification rejected" },
                    ].map(w => (
                      <div key={w.event} className="flex items-start gap-3 bg-[#020c1b] border border-[#0d2040] rounded-lg p-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <div>
                          <code className="text-xs font-mono text-blue-300">{w.event}</code>
                          <p className="text-xs text-[#6b88b0] mt-0.5">{w.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payload example */}
                <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d2040]">
                    <span className="text-xs text-[#6b88b0]">Payload example — card.transaction</span>
                    <CopyButton text={WEBHOOK_PAYLOAD} />
                  </div>
                  <pre className="p-5 text-xs font-mono text-[#c0d4ef] leading-relaxed overflow-x-auto">
                    {WEBHOOK_PAYLOAD}
                  </pre>
                </div>

                {/* Signature verification */}
                <div className="bg-[#061120] border border-[#0d2040] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d2040]">
                    <span className="text-xs text-[#6b88b0]">Signature verification — Node.js</span>
                    <CopyButton text={WEBHOOK_VERIFY} />
                  </div>
                  <pre className="p-5 text-xs font-mono text-[#c0d4ef] leading-relaxed overflow-x-auto">
                    {WEBHOOK_VERIFY}
                  </pre>
                </div>

              </div>
            </section>

            {/* ── Changelog ── */}
            <section ref={ref("changelog")} id="changelog">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[#c9943a]" />
                <h2 className="text-xl font-bold text-white">Changelog</h2>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  v1 stable
                </span>
              </div>
              <div className="bg-[#061120] border border-[#0d2040] rounded-xl p-5">
                <p className="text-sm text-[#6b88b0] mb-6">
                  The <code className="text-blue-300">/v1</code> API is stable. Breaking changes will only be
                  introduced under a new version prefix (<code className="text-blue-300">/v2</code>) with a minimum
                  6-month deprecation window and migration guide.
                </p>
                <div className="space-y-0">
                  {changelog.map((entry, i) => (
                    <div key={entry.version} className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-blue-400" : "bg-[#163060]"}`} />
                        {i < changelog.length - 1 && <div className="w-px flex-1 bg-[#0d2040] my-1" />}
                      </div>
                      <div className="pb-5">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-white">{entry.version}</span>
                          <span className="text-xs text-[#4a6080]">{entry.date}</span>
                        </div>
                        <p className="text-sm text-[#6b88b0]">{entry.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
