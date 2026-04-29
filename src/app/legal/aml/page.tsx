import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Our Commitment",
    body: `Volt Financial Technologies is committed to combating money laundering, terrorist financing, and other financial crimes. We comply with the Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) of Kenya and applicable international standards set by the Financial Action Task Force (FATF).`,
  },
  {
    title: "2. Know Your Customer (KYC)",
    body: `All users must complete identity verification before accessing card issuance and transfer features. We collect and verify government-issued identification, proof of address, and biometric data. Enhanced due diligence is applied for higher-risk profiles or large transactions.`,
  },
  {
    title: "3. Transaction Monitoring",
    body: `We monitor transactions in real-time for suspicious activity. Automated systems flag unusual patterns including large or rapid transfers, structuring (breaking transactions into smaller amounts to avoid thresholds), and transactions involving high-risk jurisdictions.`,
  },
  {
    title: "4. Suspicious Activity Reporting",
    body: `We are legally required to file Suspicious Activity Reports (SARs) with the Financial Reporting Centre (FRC) of Kenya when we suspect money laundering or terrorist financing. We cannot disclose to users when a SAR has been filed.`,
  },
  {
    title: "5. Sanctions Screening",
    body: `All users and transactions are screened against international sanctions lists including OFAC, UN, EU, and HM Treasury lists. Accounts associated with sanctioned individuals or entities will be immediately frozen and reported.`,
  },
  {
    title: "6. Record Keeping",
    body: `We retain all KYC documents and transaction records for a minimum of 5 years as required by POCAMLA and international AML standards. Records are available to regulators upon request.`,
  },
  {
    title: "7. Training & Compliance",
    body: `Our team undergoes regular AML/CFT training. Our Compliance Officer reviews and updates our AML programme annually and in response to regulatory changes.`,
  },
  {
    title: "8. Contact",
    body: `To report suspicious activity or for compliance enquiries, contact our AML team at compliance@usezpesa.com.`,
  },
];

export default function AmlPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-4xl font-bold text-white">AML Policy</h1>
        </div>
        <p className="text-xs text-[#6b88b0] mb-12">Last updated: April 28, 2026 · Anti-Money Laundering & Counter-Terrorist Financing</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-sm font-semibold text-white mb-3">{s.title}</h2>
              <p className="text-sm text-[#6b88b0] leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
