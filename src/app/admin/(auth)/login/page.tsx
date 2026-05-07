"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Check organization_images first, then site_settings
      const [orgLogoRes, settingsLogoRes] = await Promise.all([
        supabase.from('organization_images').select('url').eq('type', 'logo').eq('is_active', true).maybeSingle(),
        supabase.from('site_settings').select('value').eq('key', 'site_logo').maybeSingle()
      ]);
      
      const logoUrl = orgLogoRes.data?.url || settingsLogoRes.data?.value;
      if (logoUrl) setLogo(logoUrl);
    }
    fetchLogo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Dynamically import to avoid any server-side module issues
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", margin: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #4c1d95)", padding: "40px 32px", textAlign: "center" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              border: "2px solid #fbbf24", background: "rgba(251,191,36,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", overflow: "hidden"
            }}>
              {logo ? (
                <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ShieldCheck size={32} color="#fbbf24" />
              )}
            </div>
            <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: "0 0 4px" }}>KDC Admin</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>Kingdom Deliverance Centre Uganda</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ padding: "32px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kdcuganda.org"
                required
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "14px",
                  border: "1px solid #d1d5db", borderRadius: "8px",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="password" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%", padding: "10px 40px 10px 14px", fontSize: "14px",
                    border: "1px solid #d1d5db", borderRadius: "8px",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
                padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600,
                background: loading ? "#6366f1" : "#4f46e5", color: "#fff",
                border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : "Sign In to Dashboard"}
            </button>

            <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "16px", marginBottom: 0 }}>
              Only authorized church administrators may access this area.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
