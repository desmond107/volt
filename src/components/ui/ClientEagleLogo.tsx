"use client";
import { useEffect, useState } from "react";
import EagleLogo from "@/components/ui/EagleLogo";

interface Props {
  size?: number;
  animated?: boolean;
}

export default function ClientEagleLogo({ size = 72, animated = false }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div style={{ width: size, height: size }} />;

  if (animated) {
    return (
      <div className="wing-flap">
        <EagleLogo size={size} />
      </div>
    );
  }

  return <EagleLogo size={size} />;
}
