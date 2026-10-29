export function isPublicAgencySlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 3 &&
    value.length <= 80 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}
export function publicAgencySlug(pathname: string): string | null {
  const slug = pathname.match(/^\/imobiliaria\/([^/]+)(?:\/|$)/)?.[1];
  return isPublicAgencySlug(slug) ? slug : null;
}
export const publicAgencyPath = (slug: string) =>
  `/imobiliaria/${encodeURIComponent(slug)}`;
export const assistantApiUrl = (slug?: string | null, demoSlug?: string | null) =>
  `/api/assistente${slug ? `?imobiliaria=${encodeURIComponent(slug)}` : demoSlug ? `?demo=${encodeURIComponent(demoSlug)}` : ''}`;
