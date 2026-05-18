"use client";

import { useRef, useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { MapPin, Briefcase, ArrowRight, Globe, DollarSign, TrendingUp, Shield } from "lucide-react";
import { Zap, BookOpen, Target, Users } from "lucide-react";

type Role = {
  title: string;
  team: string;
  location: string;
  type: string;
  color: string;
  rgb: string;
};

const roles: Role[] = [
  { title: "Senior Backend Engineer", team: "Engineering", location: "Remote (Africa)", type: "Full-time", color: "#3b82f6", rgb: "59,130,246" },
  { title: "Product Designer", team: "Design", location: "Nairobi / Remote", type: "Full-time", color: "#a855f7", rgb: "168,85,247" },
  { title: "Compliance & AML Officer", team: "Legal", location: "Nairobi, Kenya", type: "Full-time", color: "#f59e0b", rgb: "245,158,11" },
  { title: "Growth Marketer", team: "Marketing", location: "Remote", type: "Contract", color: "#10b981", rgb: "16,185,129" },
];

const FILTERS = ["All", "Engineering", "Design", "Legal", "Marketing"] as const;
type Filter = typeof FILTERS[number];

const filterLabel = (f: Filter) => {
  if (f === "All") return `All (${roles.length})`;
  const count = roles.filter((r) => r.team === f).length;
  return `${f} (${count})`;
};

const perks = [
  { icon: Globe, label: "Remote-first", desc: "Work from anywhere in the world on your schedule." },
  { icon: DollarSign, label: "Competitive Salary", desc: "Market-rate pay benchmarked against global standards." },
  { icon: TrendingUp, label: "Early Equity", desc: "Meaningful ownership so you share in what we build." },
  { icon: Shield, label: "Health Insurance", desc: "Comprehensive cover for you and your dependants." },
  { icon: Zap, label: "Crypto Pay", desc: "Option to receive part or all of your salary in crypto." },
  { icon: BookOpen, label: "Learning Budget", desc: "Annual budget for courses, conferences, and books." },
];

const whyVolt = [
  { icon: Target, label: "Mission-driven", desc: "Every line of code moves money for people who need it most.", color: "#3b82f6", rgb: "59,130,246" },
  { icon: Zap, label: "Early-stage impact", desc: "You won't be a cog — your decisions shape the product from day one.", color: "#f59e0b", rgb: "245,158,11" },
  { icon: Users, label: "Global team", desc: "Teammates across Africa, Europe, and beyond — diverse by design.", color: "#10b981", rgb: "16,185,129" },
];

function RoleCard({ role, index, visible }: { role: Role; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#061120",
        border: `1px solid ${hovered ? `rgba(${role.rgb}, 0.4)` : "#0d2040"}`,
        borderRadius: "1rem",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        cursor: "pointer",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 32px rgba(${role.rgb}, 0.2)` : "0 0 0 transparent",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.5s ease, translate 0.5s ease",
        opacity: visible ? 1 : 0,
        translate: visible ? "0 0" : "0 24px",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: hovered ? role.color : "#e8eef8",
            marginBottom: "0.375rem",
            transition: "color 0.3s ease",
          }}
        >
          {role.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6b88b0" }}>
            <Briefcase style={{ width: 12, height: 12 }} />
            {role.team}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6b88b0" }}>
            <MapPin style={{ width: 12, height: 12 }} />
            {role.location}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            padding: "0.25rem 0.625rem",
            borderRadius: "9999px",
            background: `rgba(${role.rgb}, 0.12)`,
            color: role.color,
            border: `1px solid rgba(${role.rgb}, 0.25)`,
          }}
        >
          {role.type}
        </span>
        <a
          href={`mailto:careers@usevolt.com?subject=Application: ${encodeURIComponent(role.title)}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: role.color,
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(0)" : "translateX(4px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
          aria-label={`Apply for ${role.title}`}
        >
          Apply <ArrowRight style={{ width: 14, height: 14 }} />
        </a>
      </div>
    </div>
  );
}

export default function CareersPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [gridOpacity, setGridOpacity] = useState(1);
  const [visibleRoles, setVisibleRoles] = useState(false);
  const rolesWrapperRef = useRef<HTMLDivElement>(null);

  const filtered = activeFilter === "All" ? roles : roles.filter((r) => r.team === activeFilter);

  const handleFilterChange = (f: Filter) => {
    if (f === activeFilter) return;
    setGridOpacity(0);
    setTimeout(() => {
      setActiveFilter(f);
      setGridOpacity(1);
    }, 140);
  };

  useEffect(() => {
    const el = rolesWrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleRoles(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#020c1b", color: "#e8eef8" }}>
      <Navbar />

      <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "6rem 1.5rem 5rem" }}>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            marginBottom: "4rem",
            padding: "4rem 2rem 3rem",
            borderRadius: "1.5rem",
            background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 70%), #061120",
            border: "1px solid #0d2040",
            overflow: "hidden",
          }}
        >
          {/* dot-grid */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(109,136,176,0.12) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.3rem 0.875rem",
                borderRadius: "9999px",
                background: "rgba(59,130,246,0.12)",
                color: "#3b82f6",
                border: "1px solid rgba(59,130,246,0.25)",
                marginBottom: "1.25rem",
                letterSpacing: "0.04em",
              }}
            >
              4 open roles
            </span>

            <h1 className="gradient-text" style={{ fontSize: "clamp(2.25rem,5vw,3.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "1rem" }}>
              Join the Team
            </h1>
            <p style={{ fontSize: "1.0625rem", color: "#6b88b0", maxWidth: "36rem", margin: "0 auto 2rem" }}>
              We&apos;re a small, ambitious team building financial infrastructure for the next billion users. If that excites you, let&apos;s talk.
            </p>

            {/* perks strip */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.625rem" }}>
              {["🌍 Remote-first", "💰 Crypto salary", "⚡ Early equity", "🏥 Health cover"].map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    padding: "0.3rem 0.875rem",
                    borderRadius: "9999px",
                    background: "rgba(13,32,64,0.9)",
                    color: "#a8c0d8",
                    border: "1px solid #0d2040",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filter tabs ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {FILTERS.map((f) => {
            const active = f === activeFilter;
            return (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: active ? 600 : 500,
                  padding: "0.375rem 1rem",
                  borderRadius: "9999px",
                  border: `1px solid ${active ? "rgba(59,130,246,0.45)" : "#0d2040"}`,
                  background: active ? "rgba(59,130,246,0.15)" : "rgba(6,17,32,0.6)",
                  color: active ? "#3b82f6" : "#6b88b0",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {filterLabel(f)}
              </button>
            );
          })}
        </div>

        {/* ── Role cards ──────────────────────────────────────────────────── */}
        <div ref={rolesWrapperRef}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
              marginBottom: "5rem",
              opacity: gridOpacity,
              transition: "opacity 0.14s ease",
            }}
          >
            {filtered.map((role, i) => (
              <RoleCard key={role.title} role={role} index={i} visible={visibleRoles} />
            ))}
          </div>
        </div>

        {/* ── Why Volt ─────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: "5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8eef8", marginBottom: "1.5rem", textAlign: "center" }}>
            Why Volt?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
              gap: "1rem",
            }}
          >
            {whyVolt.map(({ icon: Icon, label, desc, color, rgb }) => (
              <div
                key={label}
                style={{
                  background: "#061120",
                  border: "1px solid #0d2040",
                  borderRadius: "1rem",
                  padding: "1.75rem 1.5rem",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  }}
                />
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "0.75rem",
                    background: `rgba(${rgb}, 0.12)`,
                    marginBottom: "1rem",
                  }}
                >
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#e8eef8", marginBottom: "0.5rem" }}>{label}</h3>
                <p style={{ fontSize: "0.8125rem", color: "#6b88b0", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Perks & Benefits ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: "5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8eef8", marginBottom: "1.5rem", textAlign: "center" }}>
            Perks &amp; Benefits
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
              gap: "1rem",
            }}
          >
            {perks.map(({ icon: Icon, label, desc }) => (
              <PerkCard key={label} Icon={Icon} label={label} desc={desc} />
            ))}
          </div>
        </section>

        {/* ── Contact card ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            background: "#061120",
            border: "1px solid #0d2040",
            borderRadius: "1.5rem",
            padding: "3rem 2rem",
            overflow: "hidden",
          }}
        >
          {/* dot-grid */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(109,136,176,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "1.4375rem", fontWeight: 700, color: "#e8eef8", marginBottom: "0.625rem" }}>
              Don&apos;t see your role?
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "#6b88b0", marginBottom: "1.75rem", maxWidth: "28rem", margin: "0 auto 1.75rem" }}>
              We&apos;re always open to talented people who care about our mission. Drop us a line and let&apos;s explore.
            </p>
            <ContactButton />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function PerkCard({ Icon, label, desc }: { Icon: React.ElementType; label: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#061120",
        border: `1px solid ${hovered ? "rgba(201,148,58,0.3)" : "#0d2040"}`,
        borderRadius: "1rem",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: hovered ? "0 4px 24px rgba(201,148,58,0.1)" : "none",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "0.625rem",
          background: "rgba(201,148,58,0.1)",
        }}
      >
        <Icon style={{ width: 18, height: 18, color: "#c9943a" }} />
      </div>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e8eef8" }}>{label}</h3>
      <p style={{ fontSize: "0.8rem", color: "#6b88b0", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function ContactButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="mailto:careers@usevolt.com"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shine-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.9375rem",
        fontWeight: 600,
        padding: "0.75rem 2rem",
        borderRadius: "0.625rem",
        background: hovered ? "rgba(26,86,219,0.22)" : "rgba(26,86,219,0.15)",
        border: "1px solid rgba(26,86,219,0.4)",
        color: "#60a5fa",
        textDecoration: "none",
        transition: "background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease",
        boxShadow: hovered ? "0 0 24px rgba(26,86,219,0.25)" : "none",
      }}
    >
      Get in touch
      <ArrowRight style={{ width: 16, height: 16 }} />
    </a>
  );
}
