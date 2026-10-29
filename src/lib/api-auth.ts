import { NextRequest } from 'next/server.js';
import { verifyToken } from './jwt.ts';
import { createServerSupabaseClient } from './supabase.ts';
import { isAppRole } from './auth-policy.ts';
import { isUuid } from './imoveis-input.ts';

export async function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const claims = verifyToken(token);
    // JWT identifica a sessão. Permissões e vínculo são sempre os atuais do banco.
    const { data, error } = await createServerSupabaseClient().from('perfis')
      .select('id,role,ativo,imobiliaria_id').eq('id', claims.uid).maybeSingle();
    if (error || !data || data.ativo !== true || !isAppRole(data.role)) return null;
    return { ...claims, role: data.role, imobiliariaId: typeof data.imobiliaria_id === 'string' && isUuid(data.imobiliaria_id) ? data.imobiliaria_id : null };
  } catch {
    return null;
  }
}
