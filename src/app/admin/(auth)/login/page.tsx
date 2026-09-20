"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/password-input";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth-callback-failed") {
      setError("Authentication failed or recovery link expired. Please try again.");
    }
    const msgParam = searchParams.get("message");
    if (msgParam === "password-updated") {
      setMessage("Your password has been updated successfully. Please sign in with your new password.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // If already signed in, never show login inside the shell — go to dashboard.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace("/admin");
        return;
      }

      const [orgLogoRes, settingsLogoRes] = await Promise.all([
        supabase
          .from("organization_images")
          .select("url")
          .eq("type", "logo")
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("site_settings")
          .select("value")
          .eq("key", "site_logo")
          .maybeSingle(),
      ]);

      const logoUrl = orgLogoRes.data?.url || settingsLogoRes.data?.value;
      if (logoUrl) setLogo(logoUrl);
      setCheckingSession(false);
    }
    void init();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

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

  if (checkingSession) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#1e1b4b]">
        <Loader2 className="size-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-indigo-900 to-[#1e1b4b] px-4 py-8">
      <div className="w-full max-w-[420px]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-[#1e1b4b] to-purple-900 px-6 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-amber-400/10 sm:size-16">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo" className="size-full object-cover" />
              ) : (
                <ShieldCheck className="size-8 text-amber-400" />
              )}
            </div>
            <h1 className="m-0 text-xl font-bold text-white sm:text-2xl">KDC Admin</h1>
            <p className="m-0 mt-1 text-sm text-white/60">
              Kingdom Deliverance Centre Uganda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 p-5 sm:p-8">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kdcuganda.org"
                required
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-gray-300 px-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 rounded-lg text-sm"
              />
            </div>

            {message && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>

            <p className="m-0 text-center text-xs text-gray-400">
              Only authorized church administrators may access this area.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#1e1b4b]">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
