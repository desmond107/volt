"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ClientEagleLogo from "@/components/ui/ClientEagleLogo";
import { Target, Eye, Zap, Shield, Globe, Heart } from "lucide-react";
import { Users, MapPin, Mail, Star, ArrowRight, ExternalLink } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = "#020c1b";
const CARD = "#061120";
const BORDER = "#0d2040";
const MUTED = "#6b88b0";
const GOLD = "#c9943a";
const BLUE = "#1a56db";

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { label: "Founded",   value: "2024",   icon: Star },
  { label: "Users",     value: "12,400+", icon: Users },
  { label: "Countries", value: "150+",    icon: Globe },
  { label: "Processed", value: "$2.1B+",  icon: ArrowRight },
];

const values = [
  { label: "Security First",     icon: Shield, color: "#3b82f6",   desc: "Bank-grade encryption and non-custodial key design." },
  { label: "Borderless Access",  icon: Globe,  color: "#10b981",   desc: "Works anywhere Visa is accepted — 195+ countries." },
  { label: "Radical Simplicity", icon: Zap,    color: "#eab308",   desc: "No jargon. No friction. Just send and spend." },
  { label: "Full Transparency",  icon: Eye,    color: "#a855f7",   desc: "Open fees, open code, open roadmap." },
  { label: "Africa-First",       icon: Heart,  color: "#ec4899",   desc: "Built in Nairobi for the world's fastest-growing markets." },
  { label: "Community Driven",   icon: Users,  color: "#f59e0b",   desc: "Product decisions shaped by our user community." },
];

const team = [
  { name: "Desmond Kinoti",   role: "Founder & CEO",         initials: "DK", color: BLUE,      handle: "@desmond_volt" },
  { name: "Engineering Team", role: "Product & Engineering",  initials: "ET", color: "#10b981", handle: "@volt_eng" },
  { name: "Sarah Wambui",     role: "Head of Design",         initials: "SW", color: "#a855f7", handle: "@sarah_volt" },
  { name: "Kevin Mwangi",     role: "Head of Compliance",     initials: "KM", color: "#f59e0b", handle: "@kevin_volt" },
  { name: "Aisha Ochieng",    role: "Head of Growth",         initials: "AO", color: "#ec4899", handle: "@aisha_volt" },
  { name: "James Njoroge",    role: "Lead Infrastructure",    initials: "JN", color: "#06b6d4", handle: "@james_volt" },
];

const backers = ["Basecamp Fund", "Afritech Ventures", "Web3 Foundation", "Y Combinator Network"];
const press   = ["TechCrunch", "CoinDesk", "The Block", "Forbes", "Wired"];

// ─── Reveal hook (single element) ─────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Reusable reveal wrapper ───────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [hoveredStat,  setHoveredStat]  = useState<number | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [hoveredTeam,  setHoveredTeam]  = useState<number | null>(null);
  const [hoveredMV,    setHoveredMV]    = useState<"mission" | "vision" | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e8eef8" }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-24">

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <Reveal>
          <div
            style={{
              position: "relative",
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: "1.5rem",
              padding: "4rem 2rem",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {/* Dot-grid background */}
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `radial-gradient(circle, rgba(13,32,64,0.9) 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
              }}
            />

            {/* Blue glow — top right */}
            <div style={{
              position: "absolute", top: "-80px", right: "-80px",
              width: "320px", height: "320px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(26,86,219,0.22) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Gold glow — bottom left */}
            <div style={{
              position: "absolute", bottom: "-80px", left: "-80px",
              width: "280px", height: "280px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,148,58,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                <ClientEagleLogo size={72} animated />
              </div>

              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "0.75rem", lineHeight: 1.15 }}>
                About{" "}
                <span className="text-white">Volt</span>
              </h1>

              {/* Location chip */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.375rem",
                background: "rgba(26,86,219,0.12)", border: `1px solid rgba(26,86,219,0.28)`,
                borderRadius: "999px", padding: "0.3rem 0.9rem",
                fontSize: "0.8rem", color: "#7ca3f0", marginBottom: "1.25rem",
              }}>
                <MapPin size={13} />
                Nairobi, Kenya
              </div>

              <p style={{
                maxWidth: "600px", margin: "0 auto 1.5rem",
                fontSize: "1.05rem", lineHeight: 1.7, color: MUTED,
              }}>
                We&apos;re building the financial layer for the next generation of digital payments — stablecoin-powered, globally accessible, and radically simple.
              </p>

              {/* Tagline badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: `rgba(201,148,58,0.1)`, border: `1px solid rgba(201,148,58,0.3)`,
                borderRadius: "999px", padding: "0.4rem 1.1rem",
                fontSize: "0.8rem", color: GOLD, fontWeight: 600,
              }}>
                <Star size={13} />
                Building the future of payments
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              const hovered = hoveredStat === i;
              return (
                <Reveal key={s.label} delay={i * 70}>
                  <div
                    onMouseEnter={() => setHoveredStat(i)}
                    onMouseLeave={() => setHoveredStat(null)}
                    style={{
                      background: CARD,
                      border: `1px solid ${hovered ? "rgba(26,86,219,0.45)" : BORDER}`,
                      borderRadius: "1rem",
                      padding: "1.5rem 1.25rem",
                      textAlign: "center",
                      cursor: "default",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                      transform: hovered ? "translateY(-4px)" : "translateY(0)",
                      boxShadow: hovered ? "0 8px 32px rgba(26,86,219,0.18)" : "none",
                    }}
                  >
                    <div style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem",
                      background: "rgba(26,86,219,0.14)", marginBottom: "0.75rem",
                    }}>
                      <Icon size={18} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#e8eef8", lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: MUTED, marginTop: "0.35rem", fontWeight: 500 }}>
                      {s.label}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Mission / Vision ──────────────────────────────────────────────── */}
        <section>
          <Reveal>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", textAlign: "center" }}>
              Mission &amp; Vision
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {/* Mission */}
            <Reveal delay={0}>
              <div
                onMouseEnter={() => setHoveredMV("mission")}
                onMouseLeave={() => setHoveredMV(null)}
                style={{
                  background: CARD,
                  border: `1px solid ${hoveredMV === "mission" ? "rgba(26,86,219,0.45)" : BORDER}`,
                  borderRadius: "1.25rem",
                  padding: "1.75rem 1.5rem",
                  transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                  transform: hoveredMV === "mission" ? "translateY(-5px)" : "translateY(0)",
                  boxShadow: hoveredMV === "mission" ? "0 12px 40px rgba(26,86,219,0.15)" : "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent line — blue */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: "linear-gradient(90deg, #1a56db, #3b82f6)",
                  borderRadius: "1.25rem 1.25rem 0 0",
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                    background: "rgba(26,86,219,0.15)", flexShrink: 0,
                  }}>
                    <Target size={17} color="#3b82f6" />
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#e8eef8" }}>Our Mission</h3>
                </div>
                <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.75 }}>
                  To enable anyone, anywhere to spend digital currency as easily as swiping a card. We bridge the gap between stablecoins and everyday commerce through virtual Visa cards and simple wallet infrastructure.
                </p>
              </div>
            </Reveal>

            {/* Vision */}
            <Reveal delay={80}>
              <div
                onMouseEnter={() => setHoveredMV("vision")}
                onMouseLeave={() => setHoveredMV(null)}
                style={{
                  background: CARD,
                  border: `1px solid ${hoveredMV === "vision" ? "rgba(201,148,58,0.45)" : BORDER}`,
                  borderRadius: "1.25rem",
                  padding: "1.75rem 1.5rem",
                  transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                  transform: hoveredMV === "vision" ? "translateY(-5px)" : "translateY(0)",
                  boxShadow: hoveredMV === "vision" ? "0 12px 40px rgba(201,148,58,0.12)" : "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent line — gold */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: "linear-gradient(90deg, #c9943a, #f0b429)",
                  borderRadius: "1.25rem 1.25rem 0 0",
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                    background: "rgba(201,148,58,0.15)", flexShrink: 0,
                  }}>
                    <Eye size={17} color={GOLD} />
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#e8eef8" }}>Our Vision</h3>
                </div>
                <p style={{ fontSize: "0.875rem", color: MUTED, lineHeight: 1.75 }}>
                  A world where holding USDC, USDT, or DAI is as useful as holding cash — where you can pay for subscriptions, services, and everyday items without ever converting back to fiat.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Values ────────────────────────────────────────────────────────── */}
        <section>
          <Reveal>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>
              Our Values
            </h2>
            <p style={{ color: MUTED, textAlign: "center", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
              The principles that guide every decision we make.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {values.map((v, i) => {
              const Icon = v.icon;
              const hovered = hoveredValue === i;
              const hex = v.color;
              const rgba = (op: number) => `${hex}${Math.round(op * 255).toString(16).padStart(2, "0")}`;
              return (
                <Reveal key={v.label} delay={i * 55}>
                  <div
                    onMouseEnter={() => setHoveredValue(i)}
                    onMouseLeave={() => setHoveredValue(null)}
                    style={{
                      background: CARD,
                      border: `1px solid ${hovered ? rgba(0.4) : BORDER}`,
                      borderRadius: "1rem",
                      padding: "1.5rem",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                      transform: hovered ? "translateY(-4px)" : "translateY(0)",
                      boxShadow: hovered ? `0 10px 36px ${rgba(0.14)}` : "none",
                      cursor: "default",
                    }}
                  >
                    <div style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem",
                      background: rgba(0.13), marginBottom: "0.875rem",
                    }}>
                      <Icon size={18} color={hex} />
                    </div>
                    <div style={{
                      display: "inline-flex", alignItems: "center",
                      background: rgba(0.1), borderRadius: "999px",
                      padding: "0.2rem 0.65rem", marginBottom: "0.5rem",
                    }}>
                      <span style={{ fontSize: "0.72rem", color: hex, fontWeight: 600 }}>{v.label}</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: MUTED, lineHeight: 1.7 }}>{v.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Team ──────────────────────────────────────────────────────────── */}
        <section>
          <Reveal>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>
              The Team
            </h2>
            <p style={{ color: MUTED, textAlign: "center", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
              A distributed team building the future of money.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            {team.map((member, i) => {
              const hovered = hoveredTeam === i;
              const c = member.color;
              return (
                <Reveal key={member.name} delay={i * 60}>
                  <div
                    onMouseEnter={() => setHoveredTeam(i)}
                    onMouseLeave={() => setHoveredTeam(null)}
                    style={{
                      background: CARD,
                      border: `1px solid ${hovered ? `${c}66` : BORDER}`,
                      borderRadius: "1.25rem",
                      padding: "1.5rem",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                      transform: hovered ? "translateY(-4px)" : "translateY(0)",
                      boxShadow: hovered ? `0 10px 36px ${c}22` : "none",
                    }}
                  >
                    {/* Gradient avatar */}
                    <div style={{
                      width: "3rem", height: "3rem", borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c}33, ${c}88)`,
                      border: `2px solid ${c}55`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.9rem", color: c,
                      marginBottom: "0.875rem",
                    }}>
                      {member.initials}
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e8eef8" }}>{member.name}</div>
                    <div style={{ fontSize: "0.75rem", color: c, fontWeight: 500, margin: "0.2rem 0 0.5rem" }}>
                      {member.role}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: MUTED }}>{member.handle}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Backed by ─────────────────────────────────────────────────────── */}
        <section>
          <Reveal>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, textAlign: "center", marginBottom: "1.25rem", color: MUTED }}>
              Backed by
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              {backers.map((b) => (
                <span key={b} style={{
                  background: "rgba(26,86,219,0.1)",
                  border: "1px solid rgba(26,86,219,0.25)",
                  borderRadius: "999px",
                  padding: "0.4rem 1.1rem",
                  fontSize: "0.82rem",
                  color: "#7ca3f0",
                  fontWeight: 600,
                }}>
                  {b}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── As seen in ────────────────────────────────────────────────────── */}
        <section>
          <Reveal>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textAlign: "center", marginBottom: "1.25rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              As seen in
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center" }}>
              {press.map((p) => (
                <span key={p} style={{
                  background: "rgba(107,136,176,0.08)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "999px",
                  padding: "0.35rem 1rem",
                  fontSize: "0.8rem",
                  color: MUTED,
                  fontWeight: 500,
                }}>
                  {p}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        <Reveal>
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: "1.5rem",
              padding: "3rem 2rem",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Soft glow */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px", height: "200px",
              background: "radial-gradient(ellipse, rgba(26,86,219,0.09) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Get in touch</h2>
              <p style={{ color: MUTED, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                Based in Nairobi, Kenya — building for the world
              </p>

              {/* Social icon row */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
                {[
                  { label: "Email",    icon: Mail,         href: "mailto:contact@usevolt.com", color: "#3b82f6" },
                  { label: "Twitter",  icon: ExternalLink, href: "https://twitter.com/usevolt", color: "#1d9bf0" },
                  { label: "GitHub",   icon: ExternalLink, href: "https://github.com/usevolt",  color: MUTED },
                  { label: "LinkedIn", icon: ExternalLink, href: "https://linkedin.com/company/usevolt", color: "#0a66c2" },
                ].map(({ label, icon: Icon, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    title={label}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem",
                      background: "rgba(13,32,64,0.8)",
                      border: `1px solid ${BORDER}`,
                      color,
                      transition: "border-color 0.2s, background 0.2s, transform 0.2s",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = color;
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = BORDER;
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>

              <a
                href="mailto:contact@usevolt.com"
                className="shine-btn"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "linear-gradient(135deg, #1a56db, #1448c2)",
                  color: "#fff", fontWeight: 600, fontSize: "0.875rem",
                  padding: "0.7rem 1.75rem", borderRadius: "0.75rem",
                  textDecoration: "none", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(26,86,219,0.3)",
                  transition: "box-shadow 0.2s",
                }}
              >
                <Mail size={15} />
                contact@usevolt.com
              </a>
            </div>
          </div>
        </Reveal>

      </main>
      <Footer />
    </div>
  );
}
