import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using Volt Financial services, you agree to be bound by these Terms of Service. If you do not agree, do not use our services. We may update these terms at any time; continued use constitutes acceptance.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years old and capable of forming a legally binding contract. Our services are not available in jurisdictions where they are prohibited by law. You must complete KYC verification to access card issuance and transfer features.`,
  },
  {
    title: "3. Virtual Cards",
    body: `Virtual Visa cards issued through Volt are for legitimate personal or business use only. Cards may not be used for illegal transactions, gambling in prohibited jurisdictions, or circumventing financial regulations. We reserve the right to suspend or terminate cards at our discretion.`,
  },
  {
    title: "4. Wallets & Transactions",
    body: `You are solely responsible for the security of your account credentials. Transactions are irreversible once confirmed on the blockchain. Volt is not liable for losses resulting from unauthorised access to your account due to your negligence.`,
  },
  {
    title: "5. Fees",
    body: `Current fees are published on our Pricing page. We reserve the right to change fees with 30 days' notice. Transaction fees are deducted automatically at the time of the transaction.`,
  },
  {
    title: "6. Prohibited Uses",
    body: `You may not use Volt to: launder money; finance terrorism; evade sanctions; engage in fraud; manipulate markets; or violate any applicable law. Violation will result in immediate account termination and may be reported to relevant authorities.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `To the maximum extent permitted by law, Volt's liability for any claim is limited to the fees paid by you in the 3 months preceding the claim. We are not liable for indirect, consequential, or incidental damages.`,
  },
  {
    title: "8. Governing Law",
    body: `These terms are governed by the laws of Kenya. Disputes shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
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
