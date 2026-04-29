import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Volt — Spend Digital Currency in USDT",
  description:
    "Volt gives you Visa virtual cards funded by stablecoins. Spend USDC, USDT, and DAI at 150+ countries instantly.",
  keywords: ["crypto card", "stablecoin", "virtual card", "USDC", "USDT", "DeFi"],
  openGraph: {
    title: "Volt — Spend Digital Currency in USDT",
    description: "Virtual Visa cards powered by stablecoins. Simple, secure, borderless.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-[#020c1b] text-[#e8eef8] antialiased">{children}</body>
    </html>
  );
}
