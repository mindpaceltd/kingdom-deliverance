"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/password-input";

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function initSession() {
      // 1. Fetch logo
      try {
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
      } catch {
        // Logo fetch is non-critical
      }

      // 2. Handle token_hash or PKCE code in URL query params if redirected directly
      const tokenHash = searchParams.get("token_hash");
      const code = searchParams.get("code");
      if (tokenHash) {
        try {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (otpError) {
            setError(otpError.message);
            setVerifyingSession(false);
            return;
          }
        } catch {
          setError("Failed to verify recovery token. Please request a new link.");
          setVerifyingSession(false);
          return;
        }
      } else if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            setVerifyingSession(false);
            return;
          }
        } catch {
          setError("Failed to verify authorization code. Please request a new link.");
          setVerifyingSession(false);
          return;
        }
      }

      // 3. Verify that an active session or user exists
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setSessionValid(true);
      } else {
        setSessionValid(false);
      }
      setVerifyingSession(false);
    }

    void initSession();

    // Also listen for Supabase auth state recovery event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionValid(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long for administrative accounts.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Sign out recovery session and redirect to login with confirmation
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/admin/login?message=password-updated");
      }, 2000);
    } catch {
      setError("An unexpected error occurred while updating your password.");
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#1e1b4b]">
        <Loader2 className="size-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-indigo-900 to-[#1e1b4b] px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-purple-900 px-6 py-8 text-center sm:px-8 sm:py-10">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-500/20 text-green-400 sm:size-16">
                <CheckCircle2 className="size-8 text-green-400" />
              </div>
              <h1 className="m-0 text-xl font-bold text-white sm:text-2xl">Password Updated</h1>
              <p className="m-0 mt-1 text-sm text-white/60">
                Administrative credentials updated successfully
              </p>
            </div>

            <div className="p-6 sm:p-8 text-center space-y-4">
              <p className="text-sm text-gray-600">
                Your new password has been set. Redirecting you to the administrator sign-in page...
              </p>
              <div className="pt-2 flex justify-center">
                <Loader2 className="size-5 animate-spin text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-indigo-900 to-[#1e1b4b] px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#1e1b4b] to-purple-900 px-6 py-8 text-center sm:px-8 sm:py-10">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-500/20 text-red-400 sm:size-16">
                <AlertCircle className="size-8 text-red-400" />
              </div>
              <h1 className="m-0 text-xl font-bold text-white sm:text-2xl">Link Invalid or Expired</h1>
              <p className="m-0 mt-1 text-sm text-white/60">
                Recovery session could not be established
              </p>
            </div>

            <div className="p-6 sm:p-8 text-center space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                This password reset link is invalid, has already been used, or has expired. Please request a fresh reset link to continue.
              </p>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/admin/forgot-password"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 py-1"
                >
                  <ArrowLeft className="size-3.5" /> Back to Sign In
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
                <Lock className="size-8 text-amber-400" />
              )}
            </div>
            <h1 className="m-0 text-xl font-bold text-white sm:text-2xl">Set New Password</h1>
            <p className="m-0 mt-1 text-sm text-white/60">
              Create a secure administrator password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
            <div>
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11 rounded-lg text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
                Minimum 8 characters. Use a combination of letters, numbers, and symbols.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11 rounded-lg text-sm"
              />
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
                  <Loader2 className="size-4 animate-spin" /> Updating Password...
                </>
              ) : (
                "Update Password & Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#1e1b4b]">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <AdminResetPasswordForm />
    </Suspense>
  );
}
