import Link from "next/link";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function CTA({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative bg-gradient-to-br from-blue-950 via-[#061120] to-[#061120] border border-blue-600/20 rounded-2xl p-12 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-700/10 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to spend your crypto?
            </h2>
            <p className="text-[#6b88b0] text-lg mb-8 max-w-xl mx-auto">
              Join thousands of users who use Volt to bridge the gap between crypto
              and everyday spending.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg">
                    View your Volt
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg">
                    Get Started for Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Link href="/pricing">
                <Button variant="secondary" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-[#6b88b0]">
              No credit card required &bull; Free account &bull; Card issued in seconds
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
