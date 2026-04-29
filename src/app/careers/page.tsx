import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { MapPin, Briefcase } from "lucide-react";

const roles = [
  { title: "Senior Backend Engineer", team: "Engineering", location: "Remote (Africa)", type: "Full-time" },
  { title: "Product Designer", team: "Design", location: "Nairobi / Remote", type: "Full-time" },
  { title: "Compliance & AML Officer", team: "Legal", location: "Nairobi, Kenya", type: "Full-time" },
  { title: "Growth Marketer", team: "Marketing", location: "Remote", type: "Contract" },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#020c1b] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Join the Team</h1>
          <p className="text-[#6b88b0] max-w-xl mx-auto">
            We&apos;re a small, ambitious team building financial infrastructure for the next billion users. If that excites you, let&apos;s talk.
          </p>
        </div>

        <div className="space-y-4 mb-16">
          {roles.map((role) => (
            <div
              key={role.title}
              className="bg-[#061120] border border-[#0d2040] hover:border-blue-500/30 rounded-2xl p-5 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors mb-1">
                  {role.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#6b88b0]">
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{role.team}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{role.location}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20 shrink-0">
                {role.type}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center bg-[#061120] border border-[#0d2040] rounded-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-2">Don&apos;t see your role?</h2>
          <p className="text-sm text-[#6b88b0] mb-4">We&apos;re always open to talented people who care about our mission.</p>
          <a
            href="mailto:careers@usezpesa.com"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            careers@usezpesa.com →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
