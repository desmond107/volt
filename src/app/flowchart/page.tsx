export const metadata = { title: "Volt — System Flowchart" };

/* ─── layout helpers ───────────────────────────────────────────── */
const W = 1340;   // total SVG width
const H = 2060;   // total SVG height

type Node = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  kind: "start" | "end" | "decision" | "process" | "page" | "api" | "io";
};

type Edge = {
  from: string;
  to: string;
  label?: string;
  via?: [number, number][];   // bend points
  end?: "none";
};

/* ─── node colours ──────────────────────────────────────────────── */
const COLORS: Record<Node["kind"], { fill: string; stroke: string; text: string }> = {
  start:    { fill: "#1d4ed8",  stroke: "#3b82f6", text: "#fff" },
  end:      { fill: "#065f46",  stroke: "#10b981", text: "#fff" },
  decision: { fill: "#4c1d95",  stroke: "#8b5cf6", text: "#fff" },
  process:  { fill: "#0c1a2e",  stroke: "#1e40af", text: "#93c5fd" },
  page:     { fill: "#0f172a",  stroke: "#334155", text: "#e2e8f0" },
  api:      { fill: "#111827",  stroke: "#374151", text: "#9ca3af" },
  io:       { fill: "#0c1a2e",  stroke: "#0d9488", text: "#5eead4" },
};

/* ─── nodes ─────────────────────────────────────────────────────── */
const nodes: Node[] = [
  // ── top entry ──
  { id: "start",     x: 570, y: 20,   w: 200, h: 44, label: "User visits Volt",        kind: "start" },
  { id: "landing",   x: 540, y: 90,   w: 260, h: 44, label: "Landing Page",            sub: "/",               kind: "page" },
  { id: "has_acct",  x: 555, y: 162,  w: 230, h: 52, label: "Has an account?",         kind: "decision" },

  // ── auth left branch ──
  { id: "signup",    x: 180, y: 240,  w: 200, h: 44, label: "Sign Up",                 sub: "/auth/signup",    kind: "page" },
  { id: "login",     x: 810, y: 240,  w: 200, h: 44, label: "Log In",                  sub: "/auth/login",     kind: "page" },

  // ── API auth ──
  { id: "api_signup",x: 100, y: 310,  w: 210, h: 36, label: "POST /api/auth/signup",   kind: "api" },
  { id: "api_login", x: 745, y: 310,  w: 210, h: 36, label: "POST /api/auth/login",    kind: "api" },

  // ── session ──
  { id: "session",   x: 545, y: 380,  w: 250, h: 44, label: "Create Session Cookie",   kind: "process" },

  // ── dashboard ──
  { id: "dashboard", x: 490, y: 455,  w: 360, h: 52, label: "Dashboard Overview",      sub: "/dashboard",      kind: "page" },

  // ── six main feature lanes ──
  // KYC
  { id: "kyc_pg",    x: 20,  y: 570,  w: 180, h: 44, label: "KYC Verification",        sub: "/dashboard/kyc",  kind: "page" },
  { id: "kyc_api",   x: 20,  y: 632,  w: 180, h: 36, label: "POST /api/kyc",           kind: "api" },
  { id: "kyc_done",  x: 22,  y: 686,  w: 176, h: 36, label: "Status: VERIFIED",        kind: "io" },

  // Wallet
  { id: "wallet_pg", x: 230, y: 570,  w: 180, h: 44, label: "Wallet Manager",          sub: "/dashboard/wallet", kind: "page" },
  { id: "deposit",   x: 230, y: 632,  w: 180, h: 36, label: "Deposit (Card / M-Pesa)", kind: "io" },
  { id: "w_bal",     x: 230, y: 686,  w: 180, h: 36, label: "Wallet Balance Updated",  kind: "process" },
  { id: "w_send",    x: 230, y: 740,  w: 180, h: 36, label: "Send to User / Transfer", kind: "io" },

  // Cards
  { id: "cards_pg",  x: 440, y: 570,  w: 190, h: 44, label: "Virtual Cards",           sub: "/dashboard/cards", kind: "page" },
  { id: "issue",     x: 440, y: 632,  w: 190, h: 36, label: "Issue Card",              kind: "process" },
  { id: "link_w",    x: 440, y: 686,  w: 190, h: 36, label: "Link Wallet to Card",     kind: "process" },
  { id: "fund_c",    x: 440, y: 740,  w: 190, h: 36, label: "Fund Card from Wallet",   kind: "io" },
  { id: "pay",       x: 440, y: 794,  w: 190, h: 44, label: "Make Payment",            sub: "Chip or NFC tap",  kind: "page" },
  { id: "txn_rec",   x: 440, y: 858,  w: 190, h: 36, label: "Transaction Recorded",    kind: "process" },

  // Physical card (sub-branch off Cards)
  { id: "phys_pg",   x: 660, y: 686,  w: 190, h: 44, label: "Request Physical Card",   sub: "/dashboard/cards/physical", kind: "page" },
  { id: "phys_api",  x: 660, y: 748,  w: 190, h: 36, label: "POST /api/physical-cards",kind: "api" },

  // Scheduled
  { id: "sched_pg",  x: 880, y: 570,  w: 190, h: 44, label: "Scheduled Payments",      sub: "/dashboard/scheduled", kind: "page" },
  { id: "sched_c",   x: 880, y: 632,  w: 190, h: 36, label: "Create Schedule",         kind: "process" },
  { id: "sched_r",   x: 880, y: 686,  w: 190, h: 36, label: "Auto-Run on Next Date",   kind: "io" },
  { id: "sched_t",   x: 880, y: 740,  w: 190, h: 36, label: "Transfer Executed",       kind: "process" },

  // Analytics
  { id: "analytics", x: 1100, y: 570, w: 190, h: 44, label: "Analytics",               sub: "/dashboard/analytics", kind: "page" },
  { id: "a_cats",    x: 1100, y: 632, w: 190, h: 36, label: "Spend by Category",       kind: "io" },
  { id: "a_merch",   x: 1100, y: 686, w: 190, h: 36, label: "Top Merchants",           kind: "io" },
  { id: "a_util",    x: 1100, y: 740, w: 190, h: 36, label: "Card Utilisation",        kind: "io" },

  // ── transactions page ──
  { id: "txns_pg",   x: 390, y: 950,  w: 290, h: 44, label: "Transaction History",     sub: "/dashboard/transactions", kind: "page" },
  { id: "csv",       x: 390, y: 1012, w: 290, h: 36, label: "Export CSV Statement",    kind: "io" },

  // ── notifications ──
  { id: "notif",     x: 730, y: 950,  w: 200, h: 44, label: "Notification Bell",       sub: "TopBar",          kind: "page" },
  { id: "notif_api", x: 730, y: 1012, w: 200, h: 36, label: "GET /api/notifications",  kind: "api" },

  // ── settings ──
  { id: "settings",  x: 390, y: 1100, w: 290, h: 44, label: "Settings",                sub: "/dashboard/settings", kind: "page" },
  { id: "profile",   x: 300, y: 1162, w: 170, h: 36, label: "Update Profile",          kind: "process" },
  { id: "pwd",       x: 480, y: 1162, w: 160, h: 36, label: "Change Password",         kind: "process" },
  { id: "apikeys",   x: 650, y: 1162, w: 160, h: 36, label: "Manage API Keys",         kind: "process" },

  // ── proxy / auth guard ──
  { id: "proxy",     x: 490, y: 1290, w: 360, h: 44, label: "Route Guard  (proxy.ts)", sub: "Protects /dashboard/*", kind: "process" },
  { id: "redirect",  x: 490, y: 1362, w: 360, h: 44, label: "Redirect → /auth/login", kind: "decision" },

  // ── API keys flow ──
  { id: "dev",       x: 490, y: 1460, w: 360, h: 44, label: "External API Consumer",   sub: "Uses API key + secret", kind: "io" },
  { id: "api_key_v", x: 490, y: 1532, w: 360, h: 44, label: "Key Validated → Access Granted", kind: "process" },

  // ── end ──
  { id: "end",       x: 555, y: 1640, w: 230, h: 44, label: "Session ends / Logout",   kind: "end" },
  { id: "api_out",   x: 490, y: 1704, w: 360, h: 36, label: "POST /api/auth/logout  — Cookie cleared", kind: "api" },
];

/* ─── edges ─────────────────────────────────────────────────────── */
const edges: Edge[] = [
  { from: "start",     to: "landing" },
  { from: "landing",   to: "has_acct" },
  { from: "has_acct",  to: "signup",    label: "No",  via: [[455, 266]] },
  { from: "has_acct",  to: "login",     label: "Yes", via: [[885, 266]] },
  { from: "signup",    to: "api_signup" },
  { from: "login",     to: "api_login" },
  { from: "api_signup",to: "session",   via: [[205, 402]] },
  { from: "api_login", to: "session",   via: [[850, 402]] },
  { from: "session",   to: "dashboard" },

  // dashboard → features
  { from: "dashboard", to: "kyc_pg",    via: [[110, 534]] },
  { from: "dashboard", to: "wallet_pg", via: [[320, 534]] },
  { from: "dashboard", to: "cards_pg",  via: [[535, 534]] },
  { from: "dashboard", to: "sched_pg",  via: [[975, 534]] },
  { from: "dashboard", to: "analytics", via: [[1195, 534]] },

  // KYC chain
  { from: "kyc_pg",  to: "kyc_api" },
  { from: "kyc_api", to: "kyc_done" },

  // Wallet chain
  { from: "wallet_pg", to: "deposit" },
  { from: "deposit",   to: "w_bal" },
  { from: "w_bal",     to: "w_send" },

  // Cards chain
  { from: "cards_pg", to: "issue" },
  { from: "issue",    to: "link_w" },
  { from: "link_w",   to: "fund_c" },
  { from: "fund_c",   to: "pay" },
  { from: "pay",      to: "txn_rec" },
  { from: "txn_rec",  to: "txns_pg", via: [[535, 920], [535, 950]] },

  // Physical card branch from cards
  { from: "cards_pg", to: "phys_pg",  via: [[630, 614], [755, 686]] },
  { from: "phys_pg",  to: "phys_api" },

  // Scheduled
  { from: "sched_pg", to: "sched_c" },
  { from: "sched_c",  to: "sched_r" },
  { from: "sched_r",  to: "sched_t" },

  // Analytics
  { from: "analytics", to: "a_cats" },
  { from: "a_cats",    to: "a_merch" },
  { from: "a_merch",   to: "a_util" },

  // Transactions
  { from: "txns_pg", to: "csv" },

  // Notifications
  { from: "dashboard", to: "notif",    via: [[830, 534], [830, 950]] },
  { from: "notif",     to: "notif_api" },

  // Settings
  { from: "dashboard", to: "settings", via: [[535, 534], [535, 1100]] },
  { from: "settings",  to: "profile",  via: [[420, 1184], [385, 1184]] },
  { from: "settings",  to: "pwd" },
  { from: "settings",  to: "apikeys",  via: [[650, 1184], [730, 1184]] },

  // Proxy
  { from: "proxy",    to: "redirect",  label: "No session" },
  { from: "redirect", to: "login",     via: [[670, 1362], [1010, 300], [910, 265]], label: "→ login" },

  // API key flow
  { from: "apikeys",   to: "dev",     via: [[730, 1240], [670, 1460]] },
  { from: "dev",       to: "api_key_v" },

  // Logout
  { from: "end",      to: "api_out" },
];

/* ─── node lookup ────────────────────────────────────────────────── */
function nodeMap(): Map<string, Node> {
  const m = new Map<string, Node>();
  nodes.forEach((n) => m.set(n.id, n));
  return m;
}

/* ─── mid-point helpers ──────────────────────────────────────────── */
function cx(n: Node) { return n.x + n.w / 2; }
function cy(n: Node) { return n.y + n.h / 2; }
function bottom(n: Node) { return { x: cx(n), y: n.y + n.h }; }
function top(n: Node)    { return { x: cx(n), y: n.y }; }

/* ─── path builder ───────────────────────────────────────────────── */
function buildPath(edge: Edge, map: Map<string, Node>): string {
  const src = map.get(edge.from)!;
  const dst = map.get(edge.to)!;
  const s = bottom(src);
  const e = top(dst);
  if (edge.via && edge.via.length) {
    const pts = [s, ...edge.via.map(([x, y]) => ({ x, y })), e];
    return pts
      .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
      .join(" ");
  }
  // slight curve when straight vertical
  const mx = s.x;
  const my = (s.y + e.y) / 2;
  return `M${s.x},${s.y} C${mx},${my} ${e.x},${my} ${e.x},${e.y}`;
}

/* ─── component ──────────────────────────────────────────────────── */
export default function FlowchartPage() {
  const map = nodeMap();

  return (
    <div className="min-h-screen bg-[#020c1b] flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-[#0d2040] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Volt — System Flowchart</h1>
          <p className="text-xs text-[#6b88b0] mt-0.5">End-to-end user journey and data flow</p>
        </div>
        {/* Legend */}
        <div className="hidden md:flex items-center gap-5 text-xs text-[#6b88b0]">
          {(["start","page","api","process","decision","io","end"] as Node["kind"][]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS[k].fill, border: `1px solid ${COLORS[k].stroke}` }} />
              <span className="capitalize">{k === "io" ? "Data / IO" : k === "api" ? "API Route" : k}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable SVG */}
      <div className="flex-1 overflow-auto p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="mx-auto"
          style={{ maxWidth: "100%" }}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
            </marker>
            <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── grid background ── */}
          <rect width={W} height={H} fill="#020c1b" />
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d2040" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" opacity="0.5" />

          {/* ── section labels ── */}
          {[
            { x: 14,   y: 540, label: "KYC",            color: "#f59e0b" },
            { x: 220,  y: 540, label: "Wallet",          color: "#06b6d4" },
            { x: 434,  y: 540, label: "Virtual Cards",   color: "#6366f1" },
            { x: 640,  y: 540, label: "Physical Card",   color: "#c9943a" },
            { x: 872,  y: 540, label: "Scheduled",       color: "#10b981" },
            { x: 1086, y: 540, label: "Analytics",       color: "#8b5cf6" },
          ].map((s) => (
            <text key={s.label} x={s.x} y={s.y} fontSize={10} fontWeight="600"
              fill={s.color} opacity={0.8} letterSpacing="0.08em"
              style={{ textTransform: "uppercase" }}>
              {s.label}
            </text>
          ))}

          {/* ── lane separators ── */}
          {[210, 420, 635, 870, 1085].map((lx) => (
            <line key={lx} x1={lx} y1={555} x2={lx} y2={900}
              stroke="#0d2040" strokeWidth="1" strokeDasharray="4 4" />
          ))}

          {/* ── edges ── */}
          {edges.map((e, i) => {
            const src = map.get(e.from);
            const dst = map.get(e.to);
            if (!src || !dst) return null;
            const d = buildPath(e, map);
            const isBlue = src.kind === "start" || src.kind === "decision";
            const midPts = e.via ?? [];
            const s = bottom(src);
            const t = top(dst);
            const allPts = [s, ...midPts.map(([x, y]: [number, number]) => ({ x, y })), t];
            const mid = allPts[Math.floor(allPts.length / 2)];
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke={isBlue ? "#3b82f6" : "#1e3a5f"}
                  strokeWidth={isBlue ? 1.8 : 1.2}
                  strokeDasharray={isBlue ? undefined : undefined}
                  markerEnd={e.end === "none" ? undefined : `url(#${isBlue ? "arrow-blue" : "arrow"})`}
                  opacity={0.75}
                />
                {e.label && (
                  <text x={mid.x + 4} y={mid.y - 4} fontSize={9} fill="#6b88b0"
                    fontWeight="500">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── nodes ── */}
          {nodes.map((n) => {
            const c = COLORS[n.kind];
            const r = n.kind === "start" || n.kind === "end" ? 22
                    : n.kind === "decision" ? 8
                    : 6;
            const isDecision = n.kind === "decision";
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                {isDecision ? (
                  /* diamond */
                  <>
                    <rect
                      x={0} y={0} width={n.w} height={n.h}
                      rx={r} ry={r}
                      fill={c.fill}
                      stroke={c.stroke}
                      strokeWidth={1.5}
                    />
                    <polygon
                      points={`${n.w / 2},4 ${n.w - 8},${n.h / 2} ${n.w / 2},${n.h - 4} 8,${n.h / 2}`}
                      fill="none"
                      stroke={c.stroke}
                      strokeWidth={1}
                      opacity={0.4}
                    />
                  </>
                ) : (
                  <rect
                    x={0} y={0} width={n.w} height={n.h}
                    rx={r} ry={r}
                    fill={c.fill}
                    stroke={c.stroke}
                    strokeWidth={n.kind === "start" || n.kind === "end" ? 2 : 1}
                    filter={n.kind === "start" ? "url(#glow)" : undefined}
                  />
                )}

                {/* label */}
                <text
                  x={n.w / 2}
                  y={n.sub ? n.h / 2 - 5 : n.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={n.kind === "start" || n.kind === "end" ? 12 : 11}
                  fontWeight={n.kind === "start" || n.kind === "end" ? "700" : "500"}
                  fill={c.text}
                >
                  {n.label}
                </text>
                {n.sub && (
                  <text
                    x={n.w / 2}
                    y={n.h / 2 + 9}
                    textAnchor="middle"
                    fontSize={9}
                    fill={c.stroke}
                    opacity={0.8}
                  >
                    {n.sub}
                  </text>
                )}

                {/* kind pill for api/io */}
                {(n.kind === "api" || n.kind === "io") && (
                  <rect x={4} y={4} width={n.kind === "api" ? 22 : 14} height={10}
                    rx={3} fill={c.stroke} opacity={0.25} />
                )}
                {n.kind === "api" && (
                  <text x={15} y={12} textAnchor="middle" fontSize={7}
                    fill={c.stroke} fontWeight="700">API</text>
                )}
                {n.kind === "io" && (
                  <text x={11} y={12} textAnchor="middle" fontSize={7}
                    fill={c.stroke} fontWeight="700">IO</text>
                )}
              </g>
            );
          })}

          {/* ── main section divider ── */}
          <rect x={0} y={1060} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1082} fontSize={10} fill="#1e40af" fontWeight="600"
            letterSpacing="0.1em" opacity={0.7}>
            ACCOUNT MANAGEMENT / SECURITY
          </text>
          <rect x={0} y={1270} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1288} fontSize={10} fill="#1e40af" fontWeight="600"
            letterSpacing="0.1em" opacity={0.7}>
            ROUTE PROTECTION + DEVELOPER API
          </text>
          <rect x={0} y={1620} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1638} fontSize={10} fill="#065f46" fontWeight="600"
            letterSpacing="0.1em" opacity={0.7}>
            SESSION END
          </text>
        </svg>
      </div>

      {/* Footer */}
      <div className="px-8 py-3 border-t border-[#0d2040] text-xs text-[#4a6080] flex items-center justify-between">
        <span>Volt Digital Pay — System Architecture Flowchart</span>
        <span>{nodes.length} nodes · {edges.length} connections</span>
      </div>
    </div>
  );
}
