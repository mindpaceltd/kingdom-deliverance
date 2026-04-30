"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Eye, EyeOff, Lock, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a121f] p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#eab308]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-10 pb-6 text-center space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-[#eab308] flex items-center justify-center shadow-xl shadow-[#eab308]/20 group-hover:scale-105 transition-transform duration-500">
                <ShieldCheck className="w-6 h-6 text-[#0a121f]" />
              </div>
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Admin <span className="text-[#eab308]">Portal</span></h1>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Kingdom Deliverance Centre</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-10 pt-4 space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eab308] ml-1">
                Identity
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/20 group-focus-within:text-[#eab308] transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kdcuganda.org"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#eab308]/20 focus:border-[#eab308]/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eab308] ml-1">
                Authorization
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/20 group-focus-within:text-[#eab308] transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#eab308]/20 focus:border-[#eab308]/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#eab308] hover:bg-white text-[#0a121f] h-16 font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#eab308]/10 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Sign In</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>

            <div className="pt-6 text-center border-t border-white/5">
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">
                Restricted Access Zone
              </p>
              <p className="text-[10px] text-white/20 font-medium mt-1">
                Authorized Personnel Only
              </p>
            </div>
          </form>
        </div>
        
        {/* Back to Site */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-[#eab308] transition-colors flex items-center justify-center gap-2">
            Return to Kingdom Home
          </Link>
        </div>
      </div>
    </div>
  );
}
