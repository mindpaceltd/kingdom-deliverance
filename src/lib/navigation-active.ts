/** Match the page and its descendants without matching unrelated path prefixes. */
export function isNavigationActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  const target = href.replace(/\/+$/, '') || '/';
  if (target === '/') return path === '/';
  // These public routes share the giving and shopping navigation entries.
  if (target === '/donations' && (path === '/give' || path.startsWith('/give/'))) return true;
  if (target === '/shop' && ['/cart', '/checkout'].some(route => path === route || path.startsWith(`${route}/`))) return true;
  return path === target || path.startsWith(`${target}/`);
}
