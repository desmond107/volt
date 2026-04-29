import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const sections = [
  {
    title: "1. Information We Collect",
    body: `We collect information you provide directly to us when you create an account, complete KYC verification, or use our services. This includes: name, email address, date of birth, government-issued ID documents, selfie/biometric data for identity verification, wallet addresses, and transaction history.

We also collect certain information automatically, including IP address, device type, browser type, and usage data through cookies and similar technologies.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use the information we collect to: provide, operate, and improve our services; process transactions; verify your identity in compliance with KYC/AML regulations; communicate with you about your account; detect and prevent fraud; and comply with applicable laws and regulations.`,
  },
  {
    title: "3. Sharing of Information",
    body: `We do not sell your personal information. We may share your information with: regulated identity verification providers (for KYC); card network partners (Visa) for card issuance; legal authorities when required by law; and service providers who assist in our operations under strict confidentiality agreements.`,
  },
  {
    title: "4. Data Retention",
    body: `We retain your personal data for as long as your account is active and for a minimum of 5 years after account closure, as required by anti-money laundering regulations applicable in Kenya and other jurisdictions we operate in.`,
  },
  {
    title: "5. Your Rights",
    body: `You have the right to access, correct, or delete your personal data, subject to legal and regulatory requirements. You may also request data portability or object to certain processing. To exercise these rights, contact us at privacy@usezpesa.com.`,
  },
  {
    title: "6. Security",
    body: `We implement industry-standard security measures including encryption in transit and at rest, multi-factor authentication, and regular security audits. However, no system is entirely secure and we cannot guarantee absolute security.`,
  },
  {
    title: "7. Contact",
    body: `For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@usezpesa.com or write to us at Volt Financial Technologies, Nairobi, Kenya.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-[#6b88b0] mb-12">Last updated: April 28, 2026</p>
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
