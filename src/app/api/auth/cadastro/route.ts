import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';
import { parseRegistration } from '@/lib/auth-input';

export async function POST(request: NextRequest) {
  try {
    const input = parseRegistration(await request.json());
    if (!input) {
      return NextResponse.json(
        { error: 'Dados inválidos. Informe nome, e-mail, CPF, perfil e senha de pelo menos 6 caracteres; corretores precisam informar CRECI.' },
        { status: 400 }
      );
    }
    const { nome_completo, email, cpf, creci, senha, role } = input;

    const supabaseServer = createServerSupabaseClient();

    // Verificar se o e-mail já existe
    const { data: existente, error: lookupError } = await supabaseServer
      .from('perfis')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: 'Erro ao verificar e-mail.' }, { status: 500 });
    }

    if (existente) {
      return NextResponse.json(
        { error: 'Este e-mail já está sendo utilizado por outra conta.' },
        { status: 409 }
      );
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(senha, 12);

    // Gerar ID único (a coluna 'id' não tem DEFAULT no banco legado)
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
          role,
        },
      ])
      .select()
      .single();

    if (dbError || !novoPerfil) {
      if (dbError?.code === '23505') {
        return NextResponse.json({ error: 'Este e-mail já está sendo utilizado por outra conta.' }, { status: 409 });
      }
      console.error('[POST /api/auth/cadastro] DB error:', dbError?.message);
      return NextResponse.json(
        { error: 'Erro ao criar conta. Tente novamente.' },
        { status: 500 }
      );
    }

    // Gerar token JWT
    const token = signToken({
      uid: novoPerfil.id,
      email: novoPerfil.email,
      role: novoPerfil.role,
      nome_completo: novoPerfil.nome_completo,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/cadastro]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
