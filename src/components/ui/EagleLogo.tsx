import Image from "next/image";

interface EagleLogoProps {
  className?: string;
  size?: number;
}

export default function EagleLogo({ className = "", size = 32 }: EagleLogoProps) {
  return (
    <Image
      src="/eagle-logo.png"
      alt="Volt eagle logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}
