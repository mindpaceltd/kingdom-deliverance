/** Paginated collections have distinct content; search and filter combinations are utility views. */
export function resolveListQuerySeo(path: string, params: Record<string, string | undefined> = {}) {
  const rawPage = Number(params.page || 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const filtered = Object.entries(params).some(([key, value]) => key !== 'page' && Boolean(value?.trim()))
  return {
    path: !filtered && page > 1 ? `${path}?page=${page}` : path,
    suffix: !filtered && page > 1 ? ` — Page ${page}` : '',
    noIndex: filtered,
  }
}
