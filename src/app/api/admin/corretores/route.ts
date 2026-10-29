import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseManagedAccount } from '@/lib/managed-account-input';

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role !== 'admin_corretora' || !auth.imobiliariaId) return NextResponse.json({ error: 'Somente o administrador da imobiliária cadastra corretores.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  const input = parseManagedAccount(body, 'corretor');
  if (!input) return NextResponse.json({ error: 'Informe nome, e-mail, CPF, CRECI e senha de 8 a 128 caracteres.' }, { status: 400 });
  const db = createServerSupabaseClient();
  const { senha, ...fields } = input;
  const result = await db.from('perfis').insert({ ...fields, id: crypto.randomUUID(), senha_hash: await bcrypt.hash(senha, 12),
    role: 'corretor', ativo: true, imobiliaria_id: auth.imobiliariaId, criado_por: auth.uid }).select('id').single();
  if (result.error?.code === '23505') return NextResponse.json({ error: 'Este e-mail já possui uma conta. Use outro e-mail.' }, { status: 409 });
  if (result.error || !result.data) return NextResponse.json({ error: 'Não foi possível criar o corretor.' }, { status: 500 });
  return NextResponse.json({ ok: true, id: result.data.id }, { status: 201 });
}
