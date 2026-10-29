import type { getAuthFromRequest } from './api-auth';

export type CatalogAccess = NonNullable<Awaited<ReturnType<typeof getAuthFromRequest>>>;

// Mesmo administradores não recebem acesso global ao portfólio de outras empresas.
export function scopeCatalog<T>(query: T, access: CatalogAccess): T {
  const filters = query as { eq(column: string, value: string): unknown; or(filters: string): unknown };
  return (access.imobiliariaId
    ? filters.or(`proprietario_id.eq.${access.uid},imobiliaria_id.eq.${access.imobiliariaId}`)
    : filters.eq('proprietario_id', access.uid)) as T;
}
