export function urlSlug(url: string): string {
  try {
    const u = new URL(url);
    const base = (u.hostname + u.pathname)
      .replace(/[^\w]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    const qs = u.search
      .slice(1)
      .replace(/[^\w]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return qs ? `${base}__${qs}` : base;
  } catch {
    return url.replace(/[^\w]/g, '_').slice(0, 100);
  }
}
