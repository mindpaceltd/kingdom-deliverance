/**
 * Layout for unauthenticated admin routes (login page).
 * Intentionally bypasses the admin auth check — renders children as-is.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
