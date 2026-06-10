import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (auth.role !== 'admin_corretora' && auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { nome_completo, email, cpf, creci, senha } = await request.json();

    if (!nome_completo || !email || !cpf || !senha) {
      return NextResponse.json(
        { error: 'Nome, e-mail, CPF e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!creci) {
      return NextResponse.json(
        { error: 'CRECI é obrigatório para corretores.' },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const supabaseServer = createServerSupabaseClient();

    // Verificar se o e-mail já existe
    const { data: existente } = await supabaseServer
      .from('perfis')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: 'Este e-mail já está sendo utilizado por outra conta.' },
        { status: 409 }
      );
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(senha, 12);
    const id = crypto.randomUUID();

    // Inserir perfil no Supabase
    const { data: novoPerfil, error: dbError } = await supabaseServer
      .from('perfis')
      .insert([
        {
          id,
          nome_completo,
          email,
          cpf,
          creci,
          senha_hash,
          role: 'corretor',
        },
      ])
      .select()
      .single();

    if (dbError || !novoPerfil) {
      console.error('[POST /api/admin/corretores] DB error:', dbError?.message);
      return NextResponse.json(
        { error: 'Erro ao criar conta. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: novoPerfil.id });
  } catch (err) {
    console.error('[POST /api/admin/corretores]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
