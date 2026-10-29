import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (auth.role !== 'admin_corretora' && auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  if (auth.role !== 'super_admin' && !auth.imobiliariaId) return NextResponse.json({ error: 'Imobiliária não vinculada.' }, { status: 403 });

  const supabase = createServerSupabaseClient();

  let usersQuery = supabase
    .from('perfis')
    .select('id, nome_completo, email, cpf, creci, role, criado_em')
    .in('role', ['corretor', 'admin_corretora'])
    .order('criado_em', { ascending: false });
  if (auth.role !== 'super_admin') usersQuery = usersQuery.eq('imobiliaria_id', auth.imobiliariaId);
  const { data: usuarios, error } = await usersQuery;

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('corretor_id').in('corretor_id', (usuarios ?? []).map(u => u.id));

  const leadsPorUsuario: Record<string, number> = {};
  if (leads) {
    for (const l of leads) {
      if (l.corretor_id) {
        leadsPorUsuario[l.corretor_id] = (leadsPorUsuario[l.corretor_id] || 0) + 1;
      }
    }
  }

  const resultado = usuarios.map((u) => ({
    ...u,
    total_leads: leadsPorUsuario[u.id] || 0,
  }));

  return NextResponse.json(resultado);
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (auth.role !== 'admin_corretora' && auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  if (auth.role !== 'super_admin' && !auth.imobiliariaId) return NextResponse.json({ error: 'Imobiliária não vinculada.' }, { status: 403 });

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId e role são obrigatórios' }, { status: 400 });
  }

  if (!['corretor', 'admin_corretora'].includes(role)) {
    return NextResponse.json({ error: 'Role inválida' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  let updateQuery = supabase
    .from('perfis')
    .update({ role })
    .eq('id', userId).in('role', ['corretor', 'admin_corretora']);
  if (auth.role !== 'super_admin') updateQuery = updateQuery.eq('imobiliaria_id', auth.imobiliariaId);
  const { error, data } = await updateQuery.select('id').maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar permissão' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  return NextResponse.json({ success: true });
}
