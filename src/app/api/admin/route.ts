import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isUuid } from '@/lib/imoveis-input';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'admin_corretora' || !auth.imobiliariaId) return NextResponse.json({ error: 'Acesso restrito à imobiliária.' }, { status: 403 });
  const db = createServerSupabaseClient();
  const result = await db.from('perfis').select('id,nome_completo,email,creci,role,ativo,criado_em')
    .eq('imobiliaria_id', auth.imobiliariaId).eq('role', 'corretor').order('criado_em', { ascending: false });
  if (result.error) return NextResponse.json({ error: 'Não foi possível consultar a equipe.' }, { status: 500 });
  const users = result.data ?? [];
  const counts: Record<string, number> = {};
  if (users.length) {
    const leads = await db.from('leads').select('corretor_id').in('corretor_id', users.map(u => u.id));
    for (const lead of leads.data ?? []) counts[lead.corretor_id] = (counts[lead.corretor_id] ?? 0) + 1;
  }
  return NextResponse.json(users.map(u => ({ ...u, total_leads: counts[u.id] ?? 0 })), { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'admin_corretora' || !auth.imobiliariaId) return NextResponse.json({ error: 'Acesso restrito à imobiliária.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Object.keys(body).some(k => !['userId', 'ativo'].includes(k)) || typeof body.userId !== 'string' || !isUuid(body.userId) || typeof body.ativo !== 'boolean') {
    return NextResponse.json({ error: 'Informe o corretor e se o acesso está ativo. Alterar permissões não é permitido.' }, { status: 400 });
  }
  const result = await createServerSupabaseClient().from('perfis').update({ ativo: body.ativo })
    .eq('id', body.userId).eq('imobiliaria_id', auth.imobiliariaId).eq('role', 'corretor').select('id').maybeSingle();
  if (result.error) return NextResponse.json({ error: 'Não foi possível atualizar o acesso.' }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: 'Corretor não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
