import { createServerSupabaseClient } from './supabase';
import { isAppRole } from './auth-policy';
import { isUuid } from './imoveis-input';

type AccessProfile = { role?: unknown; ativo?: unknown; imobiliaria_id?: unknown };

export async function resolveProfileAccess(profile: AccessProfile) {
  if (profile.ativo !== true || !isAppRole(profile.role)) return null;
  if (profile.role === 'super_admin') return { role: profile.role, imobiliariaId: null };
  const org = typeof profile.imobiliaria_id === 'string' && isUuid(profile.imobiliaria_id) ? profile.imobiliaria_id : null;
  if (!org) return profile.role === 'lead' ? { role: profile.role, imobiliariaId: null } : null;
  const company = await createServerSupabaseClient().from('imobiliarias').select('id,ativo').eq('id', org).maybeSingle();
  if (company.error || company.data?.ativo !== true) return null;
  return { role: profile.role, imobiliariaId: org };
}
