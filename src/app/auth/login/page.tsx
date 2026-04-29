"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import EagleLogo from "@/components/ui/EagleLogo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemo = async () => {
    setDemoLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo/login", { method: "POST" });
      if (!res.ok) throw new Error("Demo login failed");
      router.push("/dashboard");
    } catch {
      setError("Failed to load demo. Please try again.");
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[#020c1b]">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-700/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <EagleLogo size={52} />
            <div className="flex flex-col leading-none text-left">
              <span className="text-xl font-bold text-white">Volt</span>
              <span className="text-[9px] text-[#c9943a] uppercase tracking-[0.15em] font-semibold">Financial</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-[#6b88b0] text-sm mt-1">Sign in to your Volt account</p>
        </div>

        {/* Card */}
        <div className="bg-[#061120] border border-[#0d2040] rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#c0d4ef] mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-[#c0d4ef]">Password</label>
                <Link href="#" className="text-xs text-blue-400 hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b88b0] hover:text-white"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#0d2040]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#061120] px-3 text-xs text-[#6b88b0]">or</span>
            </div>
          </div>

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#c9943a]/30 bg-[#c9943a]/5 text-[#c9943a] text-sm font-medium hover:bg-[#c9943a]/10 hover:border-[#c9943a]/50 transition-colors disabled:opacity-60"
          >
            {demoLoading ? (
              <span className="w-4 h-4 border-2 border-[#c9943a]/40 border-t-[#c9943a] rounded-full animate-spin" />
            ) : (
              "⚡"
            )}
            {demoLoading ? "Loading demo…" : "Try Live Demo — no signup needed"}
          </button>

          <p className="text-center text-sm text-[#6b88b0] mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
