export const metadata = { title: "Volt — System Flowchart" };

const W = 1600;
const H = 2460;

type Node = {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string; sub?: string;
  kind: "start" | "end" | "decision" | "process" | "page" | "api" | "io";
};
type Edge = {
  from: string; to: string; label?: string;
  via?: [number, number][];
  end?: "none";
};

const COLORS: Record<Node["kind"], { fill: string; stroke: string; text: string }> = {
  start:    { fill: "#1d4ed8", stroke: "#3b82f6", text: "#fff" },
  end:      { fill: "#065f46", stroke: "#10b981", text: "#fff" },
  decision: { fill: "#4c1d95", stroke: "#8b5cf6", text: "#fff" },
  process:  { fill: "#0c1a2e", stroke: "#1e40af", text: "#93c5fd" },
  page:     { fill: "#0f172a", stroke: "#334155", text: "#e2e8f0" },
  api:      { fill: "#111827", stroke: "#374151", text: "#9ca3af" },
  io:       { fill: "#0c1a2e", stroke: "#0d9488", text: "#5eead4" },
};

const nodes: Node[] = [
  // ── entry ──
  { id: "start",       x: 700, y: 20,   w: 200, h: 44, label: "User visits Volt",          kind: "start" },
  { id: "landing",     x: 670, y: 90,   w: 260, h: 44, label: "Landing Page",              sub: "/",                         kind: "page" },
  { id: "has_acct",    x: 685, y: 162,  w: 230, h: 52, label: "Has an account?",           kind: "decision" },

  // ── auth ──
  { id: "signup",      x: 290, y: 240,  w: 200, h: 44, label: "Sign Up",                   sub: "/auth/signup",              kind: "page" },
  { id: "login",       x: 1010, y: 240, w: 200, h: 44, label: "Log In",                    sub: "/auth/login",               kind: "page" },
  { id: "api_signup",  x: 210, y: 310,  w: 210, h: 36, label: "POST /api/auth/signup",     kind: "api" },
  { id: "api_login",   x: 940, y: 310,  w: 210, h: 36, label: "POST /api/auth/login",      kind: "api" },
  { id: "session",     x: 675, y: 380,  w: 250, h: 44, label: "Create Session Cookie",     kind: "process" },

  // ── dashboard ──
  { id: "dashboard",   x: 620, y: 455,  w: 360, h: 52, label: "Dashboard Overview",        sub: "/dashboard",               kind: "page" },

  // ── KYC lane (x=10) ──
  { id: "kyc_pg",      x: 10,  y: 580,  w: 175, h: 44, label: "KYC Verification",          sub: "/dashboard/kyc",           kind: "page" },
  { id: "kyc_api",     x: 10,  y: 642,  w: 175, h: 36, label: "POST /api/kyc",             kind: "api" },
  { id: "kyc_done",    x: 10,  y: 696,  w: 175, h: 36, label: "Status: VERIFIED",          kind: "io" },

  // ── Crypto Wallet lane (x=200) ──
  { id: "wallet_pg",   x: 200, y: 580,  w: 185, h: 44, label: "Crypto Wallets",            sub: "/dashboard/wallet",        kind: "page" },
  { id: "deposit",     x: 200, y: 642,  w: 185, h: 36, label: "Deposit (Card / M-Pesa)",   kind: "io" },
  { id: "w_bal",       x: 200, y: 696,  w: 185, h: 36, label: "Wallet Balance Updated",    kind: "process" },
  { id: "w_send",      x: 200, y: 750,  w: 185, h: 36, label: "Send / Transfer",           kind: "io" },

  // ── Multi-Currency Wallet lane (x=400) ──
  { id: "multicur_pg", x: 400, y: 580,  w: 195, h: 44, label: "Multi-Currency Wallets",   sub: "/dashboard/multi-wallet",  kind: "page" },
  { id: "mc_deposit",  x: 400, y: 642,  w: 195, h: 36, label: "Deposit Fiat Funds",        kind: "io" },
  { id: "mc_send",     x: 400, y: 696,  w: 195, h: 36, label: "Send via Email",            kind: "io" },
  { id: "mc_mpesa",    x: 400, y: 750,  w: 195, h: 36, label: "M-Pesa Withdrawal",         kind: "io" },
  { id: "mc_convert",  x: 400, y: 804,  w: 195, h: 36, label: "Currency Convert",          kind: "process" },
  { id: "mc_vc",       x: 400, y: 858,  w: 195, h: 36, label: "Create Virtual Card →",     kind: "process" },

  // ── Virtual Cards lane (x=610) ──
  { id: "cards_pg",    x: 610, y: 580,  w: 195, h: 44, label: "Virtual Cards",             sub: "/dashboard/cards",         kind: "page" },
  { id: "issue",       x: 610, y: 642,  w: 195, h: 36, label: "Issue Card (Crypto/Fiat)",  kind: "process" },
  { id: "one_time",    x: 610, y: 696,  w: 195, h: 36, label: "One-Time Use Toggle",       kind: "io" },
  { id: "timed_freeze",x: 610, y: 750,  w: 195, h: 36, label: "Timed Freeze / Auto-Unfreeze", kind: "process" },
  { id: "link_w",      x: 610, y: 804,  w: 195, h: 36, label: "Link Crypto Wallet",        kind: "process" },
  { id: "fund_c",      x: 610, y: 858,  w: 195, h: 36, label: "Fund Card from Wallet",     kind: "io" },
  { id: "pay",         x: 610, y: 912,  w: 195, h: 44, label: "Make Payment",              sub: "Chip · NFC · Fiat Wallet", kind: "page" },
  { id: "txn_rec",     x: 610, y: 976,  w: 195, h: 36, label: "Transaction Recorded",      kind: "process" },
  { id: "card_detail", x: 610, y: 1030, w: 195, h: 44, label: "Per-Card Detail",           sub: "/dashboard/cards/[id]",   kind: "page" },

  // ── Physical Card lane (x=820) ──
  { id: "phys_pg",     x: 820, y: 696,  w: 195, h: 44, label: "Request Physical Card",     sub: "/dashboard/cards/physical", kind: "page" },
  { id: "phys_api",    x: 820, y: 758,  w: 195, h: 36, label: "POST /api/physical-cards",  kind: "api" },
  { id: "phys_fiat",   x: 820, y: 812,  w: 195, h: 36, label: "Linked Fiat Wallet",        kind: "io" },

  // ── Scheduled lane (x=1030) ──
  { id: "sched_pg",    x: 1030, y: 580, w: 195, h: 44, label: "Scheduled Payments",        sub: "/dashboard/scheduled",    kind: "page" },
  { id: "sched_c",     x: 1030, y: 642, w: 195, h: 36, label: "Create Schedule",           kind: "process" },
  { id: "sched_r",     x: 1030, y: 696, w: 195, h: 36, label: "Auto-Run on Next Date",     kind: "io" },
  { id: "sched_t",     x: 1030, y: 750, w: 195, h: 36, label: "Transfer Executed",         kind: "process" },

  // ── Analytics lane (x=1245) ──
  { id: "analytics",   x: 1245, y: 580, w: 185, h: 44, label: "Analytics",                 sub: "/dashboard/analytics",    kind: "page" },
  { id: "a_cats",      x: 1245, y: 642, w: 185, h: 36, label: "Spend by Category",         kind: "io" },
  { id: "a_merch",     x: 1245, y: 696, w: 185, h: 36, label: "Top Merchants",             kind: "io" },
  { id: "a_util",      x: 1245, y: 750, w: 185, h: 36, label: "Card Utilisation",          kind: "io" },

  // ── Transactions page ──
  { id: "txns_pg",     x: 490, y: 1130, w: 280, h: 44, label: "Transaction History",       sub: "/dashboard/transactions", kind: "page" },
  { id: "txns_crypto", x: 390, y: 1192, w: 190, h: 36, label: "Digital Currency Tab",      kind: "io" },
  { id: "txns_fiat",   x: 594, y: 1192, w: 190, h: 36, label: "Multi-Currency Tab",        kind: "io" },
  { id: "api_fiat_txn",x: 594, y: 1246, w: 190, h: 36, label: "GET /api/fiat-transactions",kind: "api" },
  { id: "csv",         x: 490, y: 1300, w: 280, h: 36, label: "Export CSV Statement",      kind: "io" },

  // ── Notifications ──
  { id: "notif",       x: 840, y: 1130, w: 200, h: 44, label: "Notification Bell",         sub: "TopBar",                  kind: "page" },
  { id: "notif_api",   x: 840, y: 1192, w: 200, h: 36, label: "GET /api/notifications",    kind: "api" },

  // ── Settings ──
  { id: "settings",    x: 490, y: 1390, w: 280, h: 44, label: "Settings",                  sub: "/dashboard/settings",    kind: "page" },
  { id: "profile",     x: 380, y: 1452, w: 160, h: 36, label: "Update Profile",            kind: "process" },
  { id: "pwd",         x: 550, y: 1452, w: 160, h: 36, label: "Change Password",           kind: "process" },
  { id: "apikeys",     x: 720, y: 1452, w: 160, h: 36, label: "Manage API Keys",           kind: "process" },

  // ── Route guard ──
  { id: "proxy",       x: 570, y: 1570, w: 360, h: 44, label: "Route Guard (proxy.ts)",    sub: "Protects /dashboard/*",  kind: "process" },
  { id: "redirect",    x: 570, y: 1642, w: 360, h: 44, label: "Redirect → /auth/login",   kind: "decision" },

  // ── Developer API ──
  { id: "dev",         x: 570, y: 1740, w: 360, h: 44, label: "External API Consumer",     sub: "Uses API key + secret",  kind: "io" },
  { id: "api_key_v",   x: 570, y: 1812, w: 360, h: 44, label: "Key Validated → Access Granted", kind: "process" },

  // ── end ──
  { id: "end",         x: 650, y: 1920, w: 230, h: 44, label: "Session ends / Logout",    kind: "end" },
  { id: "api_out",     x: 570, y: 1984, w: 360, h: 36, label: "POST /api/auth/logout  — Cookie cleared", kind: "api" },
];

const edges: Edge[] = [
  // entry
  { from: "start",      to: "landing" },
  { from: "landing",    to: "has_acct" },
  { from: "has_acct",   to: "signup",      label: "No",  via: [[560, 266]] },
  { from: "has_acct",   to: "login",       label: "Yes", via: [[1060, 266]] },
  { from: "signup",     to: "api_signup" },
  { from: "login",      to: "api_login" },
  { from: "api_signup", to: "session",     via: [[315, 402]] },
  { from: "api_login",  to: "session",     via: [[1045, 402]] },
  { from: "session",    to: "dashboard" },

  // dashboard → feature lanes
  { from: "dashboard",  to: "kyc_pg",      via: [[97,  553]] },
  { from: "dashboard",  to: "wallet_pg",   via: [[292, 553]] },
  { from: "dashboard",  to: "multicur_pg", via: [[497, 553]] },
  { from: "dashboard",  to: "cards_pg",    via: [[707, 553]] },
  { from: "dashboard",  to: "sched_pg",    via: [[1127, 553]] },
  { from: "dashboard",  to: "analytics",   via: [[1337, 553]] },

  // KYC chain
  { from: "kyc_pg",     to: "kyc_api" },
  { from: "kyc_api",    to: "kyc_done" },

  // Crypto wallet chain
  { from: "wallet_pg",  to: "deposit" },
  { from: "deposit",    to: "w_bal" },
  { from: "w_bal",      to: "w_send" },

  // Multi-currency chain
  { from: "multicur_pg", to: "mc_deposit" },
  { from: "mc_deposit",  to: "mc_send" },
  { from: "mc_send",     to: "mc_mpesa" },
  { from: "mc_mpesa",    to: "mc_convert" },
  { from: "mc_convert",  to: "mc_vc" },
  // fiat wallet → creates virtual card
  { from: "mc_vc",       to: "cards_pg",   via: [[595, 876], [640, 876], [707, 624]] },

  // Virtual cards chain
  { from: "cards_pg",   to: "issue" },
  { from: "issue",      to: "one_time" },
  { from: "one_time",   to: "timed_freeze" },
  { from: "timed_freeze", to: "link_w" },
  { from: "link_w",     to: "fund_c" },
  { from: "fund_c",     to: "pay" },
  { from: "pay",        to: "txn_rec" },
  { from: "txn_rec",    to: "card_detail" },
  { from: "card_detail",to: "txns_pg",     via: [[707, 1090], [630, 1130]] },

  // Physical card branch
  { from: "cards_pg",   to: "phys_pg",     via: [[805, 602], [917, 696]] },
  { from: "phys_pg",    to: "phys_api" },
  { from: "phys_api",   to: "phys_fiat" },
  // fiat wallet also links physical card request
  { from: "multicur_pg",to: "phys_pg",     via: [[497, 602], [800, 640], [917, 696]], label: "Get Physical" },

  // Scheduled chain
  { from: "sched_pg",   to: "sched_c" },
  { from: "sched_c",    to: "sched_r" },
  { from: "sched_r",    to: "sched_t" },

  // Analytics chain
  { from: "analytics",  to: "a_cats" },
  { from: "a_cats",     to: "a_merch" },
  { from: "a_merch",    to: "a_util" },

  // Transactions
  { from: "txns_pg",    to: "txns_crypto", via: [[535, 1192]] },
  { from: "txns_pg",    to: "txns_fiat",   via: [[689, 1192]] },
  { from: "txns_fiat",  to: "api_fiat_txn" },
  { from: "txns_pg",    to: "csv",         via: [[630, 1320]] },

  // Notifications
  { from: "dashboard",  to: "notif",       via: [[940, 553], [940, 1130]] },
  { from: "notif",      to: "notif_api" },

  // Settings
  { from: "dashboard",  to: "settings",    via: [[800, 553], [630, 1390]] },
  { from: "settings",   to: "profile",     via: [[490, 1474], [460, 1474]] },
  { from: "settings",   to: "pwd" },
  { from: "settings",   to: "apikeys",     via: [[770, 1474], [800, 1474]] },

  // Route guard
  { from: "proxy",      to: "redirect",    label: "No session" },
  { from: "redirect",   to: "login",       via: [[750, 1642], [1210, 300], [1110, 265]], label: "→ login" },

  // API key flow
  { from: "apikeys",    to: "dev",         via: [[800, 1530], [750, 1740]] },
  { from: "dev",        to: "api_key_v" },

  // Logout
  { from: "end",        to: "api_out" },
];

function nodeMap() {
  const m = new Map<string, Node>();
  nodes.forEach((n) => m.set(n.id, n));
  return m;
}
function cx(n: Node) { return n.x + n.w / 2; }
function cy(n: Node) { return n.y + n.h / 2; }   // eslint-disable-line @typescript-eslint/no-unused-vars
function bottom(n: Node) { return { x: cx(n), y: n.y + n.h }; }
function top(n: Node)    { return { x: cx(n), y: n.y }; }

function buildPath(edge: Edge, map: Map<string, Node>): string {
  const src = map.get(edge.from)!;
  const dst = map.get(edge.to)!;
  const s = bottom(src);
  const e = top(dst);
  if (edge.via?.length) {
    const pts = [s, ...edge.via.map(([x, y]) => ({ x, y })), e];
    return pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  }
  const mx = s.x;
  const my = (s.y + e.y) / 2;
  return `M${s.x},${s.y} C${mx},${my} ${e.x},${my} ${e.x},${e.y}`;
}

export default function FlowchartPage() {
  const map = nodeMap();

  return (
    <div className="min-h-screen bg-[#020c1b] flex flex-col">
      <div className="px-8 py-5 border-b border-[#0d2040] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Volt — System Flowchart</h1>
          <p className="text-xs text-[#6b88b0] mt-0.5">End-to-end user journey and data flow</p>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs text-[#6b88b0]">
          {(["start","page","api","process","decision","io","end"] as Node["kind"][]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS[k].fill, border: `1px solid ${COLORS[k].stroke}` }} />
              <span className="capitalize">{k === "io" ? "Data / IO" : k === "api" ? "API Route" : k}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="mx-auto" style={{ maxWidth: "100%" }}>
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
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d2040" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect width={W} height={H} fill="#020c1b" />
          <rect width={W} height={H} fill="url(#grid)" opacity="0.5" />

          {/* section labels */}
          {[
            { x: 12,   y: 552, label: "KYC",                  color: "#f59e0b" },
            { x: 200,  y: 552, label: "Crypto Wallets",        color: "#06b6d4" },
            { x: 396,  y: 552, label: "Multi-Currency",        color: "#3b82f6" },
            { x: 606,  y: 552, label: "Virtual Cards",         color: "#6366f1" },
            { x: 816,  y: 552, label: "Physical Card",         color: "#c9943a" },
            { x: 1026, y: 552, label: "Scheduled",             color: "#10b981" },
            { x: 1240, y: 552, label: "Analytics",             color: "#8b5cf6" },
          ].map((s) => (
            <text key={s.label} x={s.x} y={s.y} fontSize={10} fontWeight="600"
              fill={s.color} opacity={0.85} letterSpacing="0.08em"
              style={{ textTransform: "uppercase" }}>
              {s.label}
            </text>
          ))}

          {/* lane separators */}
          {[195, 395, 605, 815, 1025, 1240].map((lx) => (
            <line key={lx} x1={lx} y1={560} x2={lx} y2={1100}
              stroke="#0d2040" strokeWidth="1" strokeDasharray="4 4" />
          ))}

          {/* edges */}
          {edges.map((e, i) => {
            const src = map.get(e.from);
            const dst = map.get(e.to);
            if (!src || !dst) return null;
            const d = buildPath(e, map);
            const isBlue = src.kind === "start" || src.kind === "decision";
            const s = bottom(src);
            const t = top(dst);
            const allPts = [s, ...(e.via ?? []).map(([x, y]: [number,number]) => ({ x, y })), t];
            const mid = allPts[Math.floor(allPts.length / 2)];
            return (
              <g key={i}>
                <path d={d} fill="none"
                  stroke={isBlue ? "#3b82f6" : "#1e3a5f"}
                  strokeWidth={isBlue ? 1.8 : 1.2}
                  markerEnd={e.end === "none" ? undefined : `url(#${isBlue ? "arrow-blue" : "arrow"})`}
                  opacity={0.75}
                />
                {e.label && (
                  <text x={mid.x + 4} y={mid.y - 4} fontSize={9} fill="#6b88b0" fontWeight="500">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const c = COLORS[n.kind];
            const r = n.kind === "start" || n.kind === "end" ? 22 : n.kind === "decision" ? 8 : 6;
            const isDecision = n.kind === "decision";
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                {isDecision ? (
                  <>
                    <rect x={0} y={0} width={n.w} height={n.h} rx={r} ry={r}
                      fill={c.fill} stroke={c.stroke} strokeWidth={1.5} />
                    <polygon
                      points={`${n.w/2},4 ${n.w-8},${n.h/2} ${n.w/2},${n.h-4} 8,${n.h/2}`}
                      fill="none" stroke={c.stroke} strokeWidth={1} opacity={0.4} />
                  </>
                ) : (
                  <rect x={0} y={0} width={n.w} height={n.h} rx={r} ry={r}
                    fill={c.fill} stroke={c.stroke}
                    strokeWidth={n.kind === "start" || n.kind === "end" ? 2 : 1}
                    filter={n.kind === "start" ? "url(#glow)" : undefined} />
                )}
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
                  <text x={n.w / 2} y={n.h / 2 + 9} textAnchor="middle"
                    fontSize={9} fill={c.stroke} opacity={0.8}>
                    {n.sub}
                  </text>
                )}
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

          {/* section dividers */}
          <rect x={0} y={1100} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1120} fontSize={10} fill="#1e40af" fontWeight="600" letterSpacing="0.1em" opacity={0.7}>
            TRANSACTION HISTORY
          </text>
          <rect x={0} y={1360} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1380} fontSize={10} fill="#1e40af" fontWeight="600" letterSpacing="0.1em" opacity={0.7}>
            ACCOUNT MANAGEMENT / SECURITY
          </text>
          <rect x={0} y={1545} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1562} fontSize={10} fill="#1e40af" fontWeight="600" letterSpacing="0.1em" opacity={0.7}>
            ROUTE PROTECTION + DEVELOPER API
          </text>
          <rect x={0} y={1900} width={W} height={1} fill="#0d2040" opacity={0.8} />
          <text x={16} y={1916} fontSize={10} fill="#065f46" fontWeight="600" letterSpacing="0.1em" opacity={0.7}>
            SESSION END
          </text>
        </svg>
      </div>

      <div className="px-8 py-3 border-t border-[#0d2040] text-xs text-[#4a6080] flex items-center justify-between">
        <span>Volt Digital Pay — System Architecture Flowchart</span>
        <span>{nodes.length} nodes · {edges.length} connections</span>
      </div>
    </div>
  );
}
