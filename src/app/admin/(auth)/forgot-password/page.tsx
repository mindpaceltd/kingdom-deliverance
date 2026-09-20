"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      const supabase = createClient();
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
    }
    void fetchLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/auth/callback?next=/admin/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-indigo-900 to-[#1e1b4b] px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-purple-900 px-6 py-8 text-center sm:px-8 sm:py-10">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-500/20 text-green-400 sm:size-16">
                <CheckCircle2 className="size-8 text-green-400" />
              </div>
              <h1 className="m-0 text-xl font-bold text-white sm:text-2xl">Check Your Email</h1>
              <p className="m-0 mt-1 text-sm text-white/60">
                Password reset link dispatched
              </p>
            </div>

            <div className="p-6 sm:p-8 text-center space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                If an administrator account exists for{" "}
                <span className="font-semibold text-gray-900">{email}</span>, you will
                receive an email with instructions to reset your password shortly.
              </p>

              <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-700 text-left space-y-1">
                <p className="font-semibold">Important:</p>
                <p>The reset link is valid for 1 hour. Be sure to check your spam or junk folder if it does not appear in your inbox.</p>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  <ArrowLeft className="size-4" /> Back to Admin Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
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
            <h1 className="m-0 text-xl font-bold text-white sm:text-2xl">Reset Password</h1>
            <p className="m-0 mt-1 text-sm text-white/60">
              KDC Uganda Admin Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
            <p className="text-sm text-gray-600">
              Enter your registered administrator email address and we will send you a secure link to reset your password.
            </p>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kdcuganda.org"
                  required
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

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
                  <Loader2 className="size-4 animate-spin" /> Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#1e1b4b]">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <AdminForgotPasswordForm />
    </Suspense>
  );
}
