"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Bell, Activity } from "lucide-react";

const MAX_LATENCY = 560;

const systems = [
  { name: "API Gateway", status: "operational", latencyMs: 42 },
  { name: "Virtual Card Issuance", status: "operational", latencyMs: 310 },
  { name: "Wallet Infrastructure", status: "operational", latencyMs: 88 },
  { name: "Transaction Processing", status: "operational", latencyMs: 124 },
  { name: "KYC Verification", status: "operational", latencyMs: 560 },
  { name: "Authentication", status: "operational", latencyMs: 31 },
  { name: "Dashboard", status: "operational", latencyMs: 210 },
  { name: "Webhooks", status: "operational", latencyMs: 67 },
];

const incidents = [
  {
    title: "Minor API latency spike",
    daysAgo: 45,
    duration: "23 minutes",
    status: "Resolved",
  },
  {
    title: "Webhook delivery delay",
    daysAgo: 72,
    duration: "8 minutes",
    status: "Resolved",
  },
];

function latencyColor(ms: number): string {
  if (ms < 100) return "rgba(52, 211, 153, 0.85)";
  if (ms <= 300) return "rgba(251, 191, 36, 0.85)";
  return "rgba(251, 146, 60, 0.85)";
}

function uptimeBarColor(i: number): string {
  if (i === 17 || i === 44 || i === 72) return "rgba(251, 191, 36, 0.75)";
  return "rgba(52, 211, 153, 0.70)";
}

export default function StatusPage() {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [incidentsOpen, setIncidentsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [tableVisible, setTableVisible] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Live "last updated" counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // IntersectionObserver for scroll-triggered stagger
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTableVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Stable response-time bars (computed once on mount)
  const responseBars = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => 30 + Math.sin(i / 3) * 20 + ((i * 7 + 13) % 15));
  }, []);
  const maxBar = Math.max(...responseBars);

  function lastUpdatedLabel() {
    if (secondsAgo <= 2) return "just now";
    return `${secondsAgo} seconds ago`;
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#020c1b" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">

        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
            style={{
              background: "rgba(52, 211, 153, 0.08)",
              border: "1px solid rgba(52, 211, 153, 0.20)",
              color: "rgb(110, 231, 183)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "rgb(110, 231, 183)" }}
            />
            All Systems Operational
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">System Status</h1>
          <p style={{ color: "#6b88b0" }} className="text-sm">
            Real-time status of Volt services
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(107, 136, 176, 0.65)" }}>
            Last updated {lastUpdatedLabel()}
          </p>
        </div>

        {/* Response Times Chart */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#061120", border: "1px solid #0d2040" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{ color: "#6b88b0" }} />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Response Times — Last 24h
            </span>
          </div>
          <div className="flex items-end gap-0.5" style={{ height: "44px" }}>
            {responseBars.map((val, i) => {
              const heightPx = Math.max(4, (val / maxBar) * 40);
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${heightPx}px`,
                    background: "rgba(52, 211, 153, 0.65)",
                    alignSelf: "flex-end",
                  }}
                  title={`~${Math.round(val)}ms`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "#6b88b0" }}>
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>

        {/* Systems Table */}
        <div
          ref={tableRef}
          className="rounded-2xl overflow-hidden mb-6"
          style={{ background: "#061120", border: "1px solid #0d2040" }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid #0d2040" }}
          >
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Service</span>
            <div className="flex gap-8 text-xs font-semibold text-white uppercase tracking-wider">
              <span>Latency</span>
              <span>Status</span>
            </div>
          </div>

          {systems.map((s, i) => {
            const barWidth = `${Math.round((s.latencyMs / MAX_LATENCY) * 100)}%`;
            const barColor = latencyColor(s.latencyMs);
            const isHovered = hoveredRow === i;
            const isLast = i === systems.length - 1;

            return (
              <div
                key={s.name}
                className="px-5 py-4 flex items-center justify-between cursor-default transition-colors duration-150"
                style={{
                  borderBottom: isLast ? "none" : "1px solid #0d2040",
                  background: isHovered ? "rgba(10, 25, 41, 0.60)" : "transparent",
                  opacity: tableVisible ? 1 : 0,
                  transform: tableVisible ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity 0.35s ease ${i * 50}ms, transform 0.35s ease ${i * 50}ms, background 0.15s`,
                }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <span className="text-sm text-white">{s.name}</span>
                <div className="flex items-center gap-8">
                  {/* Latency + bar */}
                  <div className="flex items-center gap-2" style={{ width: "120px", justifyContent: "flex-end" }}>
                    <span className="text-xs w-12 text-right" style={{ color: "#6b88b0" }}>
                      {s.latencyMs}ms
                    </span>
                    <div
                      className="rounded-full overflow-hidden"
                      style={{ width: "56px", height: "6px", background: "rgba(13, 32, 64, 0.8)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: barWidth, background: barColor }}
                      />
                    </div>
                  </div>
                  {/* Status */}
                  <div className="flex items-center gap-1.5" style={{ width: "88px", justifyContent: "flex-end" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "rgb(110, 231, 183)" }} />
                    <span className="text-xs capitalize" style={{ color: "rgb(110, 231, 183)" }}>
                      {s.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Uptime Bar */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#061120", border: "1px solid #0d2040" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: "#6b88b0" }} />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Uptime — Last 90 days
            </span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-6 rounded-sm"
                style={{ background: uptimeBarColor(i) }}
                title={i === 17 || i === 44 || i === 72 ? "Minor incident" : "100% uptime"}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "#6b88b0" }}>
            <span>90 days ago</span>
            <span className="font-medium" style={{ color: "rgb(110, 231, 183)" }}>
              99.98% uptime
            </span>
            <span>Today</span>
          </div>

          {/* Past Incidents accordion */}
          <div className="mt-4" style={{ borderTop: "1px solid #0d2040", paddingTop: "16px" }}>
            <button
              onClick={() => setIncidentsOpen((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
              style={{ color: incidentsOpen ? "white" : "#6b88b0" }}
            >
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#c9943a" }} />
              Past Incidents
              {incidentsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              )}
            </button>

            {incidentsOpen && (
              <div className="mt-3 flex flex-col gap-3">
                {incidents.map((inc) => (
                  <div
                    key={inc.title}
                    className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "rgba(13, 32, 64, 0.50)", border: "1px solid rgba(13, 32, 64, 0.8)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "rgba(251, 191, 36, 0.85)" }}
                    />
                    <span className="text-sm text-white flex-1 min-w-0">{inc.title}</span>
                    <span className="text-xs" style={{ color: "#6b88b0" }}>
                      {inc.daysAgo} days ago
                    </span>
                    <span className="text-xs" style={{ color: "#6b88b0" }}>
                      Resolved in {inc.duration}
                    </span>
                    <span
                      className="text-xs font-medium rounded-full px-2 py-0.5"
                      style={{
                        background: "rgba(52, 211, 153, 0.12)",
                        color: "rgb(110, 231, 183)",
                        border: "1px solid rgba(52, 211, 153, 0.20)",
                      }}
                    >
                      {inc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subscribe to updates */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#061120", border: "1px solid #0d2040" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" style={{ color: "#6b88b0" }} />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Subscribe to Updates
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: "#6b88b0" }}>
            Get notified by email when Volt service status changes.
          </p>
          {subscribed ? (
            <div
              className="flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-3"
              style={{
                background: "rgba(52, 211, 153, 0.08)",
                border: "1px solid rgba(52, 211, 153, 0.20)",
                color: "rgb(110, 231, 183)",
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#6b88b0] outline-none focus:ring-1"
                style={{
                  background: "rgba(13, 32, 64, 0.60)",
                  border: "1px solid #0d2040",
                  // focus ring via JS would need extra state; rely on Tailwind focus class
                }}
              />
              <button
                type="submit"
                className="shine-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1a56db, #1448c2)" }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}
