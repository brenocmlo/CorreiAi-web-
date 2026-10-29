import { createServerSupabaseClient } from './supabase';
import type { CatalogAccess } from './catalog-access';
import type { AssistantContext } from '../types/assistant';
import { phoneDigits } from './phone';

export async function assistantContext(
  access: CatalogAccess | null,
): Promise<AssistantContext> {
  if (!access || access.role === 'super_admin' || !access.imobiliariaId)
    return {
      catalogState: 'restricted',
      company: null,
      restrictionReason: !access
        ? 'login_required'
        : access.role === 'super_admin'
          ? 'admin_only'
          : 'company_required',
    };
  const { data, error } = await createServerSupabaseClient()
    .from('imobiliarias')
    .select('id,nome,telefone,ativo')
    .eq('id', access.imobiliariaId)
    .maybeSingle();
  if (error || data?.ativo !== true)
    return { catalogState: 'unavailable', company: null };
  return {
    catalogState: 'available',
    company: {
      nome: typeof data.nome === 'string' ? data.nome : 'Sua imobiliária',
      telefone: phoneDigits(data.telefone),
    },
  };
}
