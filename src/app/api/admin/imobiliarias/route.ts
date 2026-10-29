import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseManagedAccount } from '@/lib/managed-account-input';
import { isUuid } from '@/lib/imoveis-input';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'super_admin') return NextResponse.json({ error: 'Acesso exclusivo do administrador geral.' }, { status: 403 });
  const db = createServerSupabaseClient();
  const result = await db.from('imobiliarias').select('id,nome,cnpj,ativo,criado_em').order('criado_em', { ascending: false }).limit(200);
  if (result.error) return NextResponse.json({ error: 'Não foi possível consultar as imobiliárias.' }, { status: 500 });
  const companies = result.data ?? [];
  const members = companies.length ? await db.from('perfis').select('id,nome_completo,email,role,ativo,imobiliaria_id').in('imobiliaria_id', companies.map(c => c.id)) : { data: [], error: null };
  if (members.error) return NextResponse.json({ error: 'Não foi possível consultar os acessos.' }, { status: 500 });
  return NextResponse.json({ imobiliarias: companies.map(c => ({ ...c,
    administradores: (members.data ?? []).filter(m => m.imobiliaria_id === c.id && m.role === 'admin_corretora').map(m => ({ id: m.id, nome: m.nome_completo, email: m.email, ativo: m.ativo })),
    total_corretores: (members.data ?? []).filter(m => m.imobiliaria_id === c.id && m.role === 'corretor').length,
  })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'super_admin') return NextResponse.json({ error: 'Acesso exclusivo do administrador geral.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
  const cnpj = typeof body?.cnpj === 'string' ? body.cnpj.replace(/\D/g, '') : '';
  const admin = parseManagedAccount(body?.administrador, 'admin_corretora');
  if (nome.length < 2 || nome.length > 160 || (cnpj && cnpj.length !== 14) || !admin) return NextResponse.json({ error: 'Informe a imobiliária e os dados do administrador, com senha de 8 a 128 caracteres. CNPJ é opcional.' }, { status: 400 });
  // A função executa as duas inserções na mesma transação. Falha não deixa empresa órfã.
  const result = await createServerSupabaseClient().rpc('provisionar_imobiliaria', {
    p_nome: nome, p_cnpj: cnpj || null, p_admin_nome: admin.nome_completo, p_email: admin.email,
    p_cpf: admin.cpf, p_senha_hash: await bcrypt.hash(admin.senha, 12), p_criado_por: auth.uid,
  });
  if (result.error?.code === '23505') return NextResponse.json({ error: 'O e-mail do administrador ou o CNPJ já está cadastrado.' }, { status: 409 });
  if (result.error || !result.data) return NextResponse.json({ error: 'Não foi possível liberar a imobiliária. Nenhum acesso foi criado.' }, { status: 500 });
  return NextResponse.json({ ok: true, imobiliaria: result.data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'super_admin') return NextResponse.json({ error: 'Acesso exclusivo do administrador geral.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Object.keys(body).some(k => !['id', 'ativo'].includes(k)) || typeof body.id !== 'string' || !isUuid(body.id) || typeof body.ativo !== 'boolean') return NextResponse.json({ error: 'Informe a imobiliária e o estado do acesso.' }, { status: 400 });
  const result = await createServerSupabaseClient().from('imobiliarias').update({ ativo: body.ativo }).eq('id', body.id).select('id').maybeSingle();
  if (result.error) return NextResponse.json({ error: 'Não foi possível alterar o acesso.' }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: 'Imobiliária não encontrada.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
