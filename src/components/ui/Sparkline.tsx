/** Deterministic pseudo-random sparkline based on a seed string. */
function seededPoints(seed: string, count = 7, base = 0): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const pts: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const n = (((h >>> 0) / 0xffffffff) - 0.5) * 0.18;
    pts.push(base + n);
  }
  return pts;
}

interface SparklineProps {
  seed: string;
  balance: number;
  color?: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ seed, balance, color = "#3b82f6", width = 80, height = 28 }: SparklineProps) {
  const raw = seededPoints(seed, 7, balance);
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const range = max - min || 1;

  const pts = raw.map((v, i) => {
    const x = (i / (raw.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const positive = raw[raw.length - 1] >= raw[0];
  const lineColor = positive ? "#10b981" : "#f43f5e";
  const fillColor = positive ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)";

  const d = `M${pts.join(" L")}`;
  const fill = `${d} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <path d={fill} fill={fillColor} />
      <path d={d} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
