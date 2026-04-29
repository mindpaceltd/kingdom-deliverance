/**
 * Standalone layout for the admin login page.
 * Renders without the public Navbar/Footer and without the admin auth check,
 * so the login form is the only thing on screen.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
