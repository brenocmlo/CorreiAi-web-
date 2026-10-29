import { NextRequest } from 'next/server.js';
import { verifyToken } from './jwt.ts';
import { createServerSupabaseClient } from './supabase.ts';
import { resolveProfileAccess } from './profile-access';

export async function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const claims = verifyToken(token);
    // JWT identifica a sessão. Permissões e vínculo são sempre os atuais do banco.
    const { data, error } = await createServerSupabaseClient().from('perfis')
      .select('id,role,ativo,imobiliaria_id').eq('id', claims.uid).maybeSingle();
    if (error || !data) return null;
    const access = await resolveProfileAccess(data);
    return access ? { ...claims, ...access } : null;
  } catch {
    return null;
  }
}
