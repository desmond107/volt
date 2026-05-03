import EagleLogo from "@/components/ui/EagleLogo";
import { Snowflake } from "lucide-react";

export const cardThemes: Record<string, { gradient: string; chip: string; accent: string }> = {
  "#6366f1": { gradient: "linear-gradient(135deg, #0b1a35 0%, #1a3a6b 50%, #0b1a35 100%)", chip: "#c9943a", accent: "#c9943a" },
  "#06b6d4": { gradient: "linear-gradient(135deg, #0c1a2e 0%, #0e7490 50%, #0c1a2e 100%)", chip: "#06b6d4", accent: "#67e8f9" },
  "#10b981": { gradient: "linear-gradient(135deg, #022c1e 0%, #065f46 50%, #022c1e 100%)", chip: "#34d399", accent: "#34d399" },
  "#f43f5e": { gradient: "linear-gradient(135deg, #1f0a10 0%, #9f1239 50%, #1f0a10 100%)", chip: "#fb7185", accent: "#fb7185" },
  "#8b5cf6": { gradient: "linear-gradient(135deg, #1e1030 0%, #5b21b6 50%, #1e1030 100%)", chip: "#a78bfa", accent: "#a78bfa" },
  "#f59e0b": { gradient: "linear-gradient(135deg, #1c1000 0%, #78350f 50%, #1c1000 100%)", chip: "#f0b429", accent: "#f0b429" },
};

const fallbackTheme = { gradient: "linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 50%, #0a0a0a 100%)", chip: "#9ca3af", accent: "#e5e7eb" };

export function getTheme(color: string) {
  return cardThemes[color] ?? fallbackTheme;
}

function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
      <path d="M7.5 7C9.4 7 11 8.3 11 10s-1.6 3-3.5 3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.5 4C13.8 4 16.5 6.7 16.5 10s-2.7 6-6 6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

interface Props {
  color: string;
  label: string;
  cardHolder: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv?: string;
  status: string;
  brand?: string;
  nfcEnabled?: boolean;
  revealed?: boolean;
  maskNumber?: (n: string) => string;
}

export default function VirtualCardFace({
  color, label, cardHolder, cardNumber, expiryMonth, expiryYear, cvv, status, brand = "VISA", nfcEnabled = true, revealed = false, maskNumber,
}: Props) {
  const theme = getTheme(color);
  const frozen = status === "FROZEN";

  const displayNumber = revealed
    ? cardNumber.replace(/(.{4})/g, "$1 ").trim()
    : maskNumber
    ? maskNumber(cardNumber)
    : `•••• •••• •••• ${cardNumber.slice(-4)}`;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl w-full"
      style={{ background: theme.gradient, aspectRatio: "1.586 / 1" }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {frozen && (
        <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-blue-200 font-semibold text-sm">
            <Snowflake className="w-5 h-5" />
            Frozen
          </div>
        </div>
      )}

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center border border-white/20">
              <EagleLogo size={16} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-semibold text-xs">Volt</span>
              <span className="text-[8px] uppercase tracking-widest font-medium" style={{ color: theme.accent }}>
                Digital Pay
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {nfcEnabled && (
              <ContactlessIcon className="w-5 h-5 text-white/60" />
            )}
            {brand === "MASTERCARD" ? (
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500/80" />
                <div className="w-4 h-4 rounded-full bg-yellow-400/80 -ml-2" />
              </div>
            ) : (
              <div className="text-white/50 text-xs italic font-light tracking-widest">VISA</div>
            )}
            <div
              className={`text-[10px] font-semibold ${
                status === "ACTIVE" ? "" : frozen ? "text-blue-300" : "text-red-400"
              }`}
              style={status === "ACTIVE" ? { color: theme.accent } : undefined}
            >
              {label}
            </div>
          </div>
        </div>

        {/* Chip + number + details */}
        <div>
          <div
            className="w-10 h-7 rounded-md mb-3 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.chip}cc, ${theme.chip}55)`,
              border: `1px solid ${theme.chip}44`,
            }}
          >
            <div className="w-6 h-4 rounded-sm flex flex-col justify-around p-0.5" style={{ background: `${theme.chip}33` }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-px rounded" style={{ background: `${theme.chip}99` }} />
              ))}
            </div>
          </div>

          <p className="text-white font-mono text-sm tracking-widest mb-3">{displayNumber}</p>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</div>
              <div className="text-white text-xs font-medium">{cardHolder}</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Expires</div>
              <div className="text-white text-xs font-medium">
                {String(expiryMonth).padStart(2, "0")}/{expiryYear}
              </div>
            </div>
            {cvv !== undefined && (
              <div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">CVV</div>
                <div className="text-white text-xs font-medium font-mono">
                  {revealed ? cvv : "•••"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
