import { isPublicAgencySlug } from './public-agency-path';

export function sharedAgencyLink(text: string, currentOrigin: string) {
  const candidate = text.match(
    /https?:\/\/[^\s<>]+|\/imobiliaria\/[^\s<>]+/i,
  )?.[0];
  if (!candidate) return null;
  try {
    const url = new URL(candidate, currentOrigin);
    const current = new URL(currentOrigin);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.host !== current.host && url.host !== 'correiai.vercel.app')
    )
      return { valid: false as const };
    const slug = url.pathname.match(/^\/imobiliaria\/([^/]+)\/?$/)?.[1];
    return isPublicAgencySlug(slug)
      ? { valid: true as const, slug }
      : { valid: false as const };
  } catch {
    return { valid: false as const };
  }
}
