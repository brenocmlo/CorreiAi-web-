import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { nome_completo, email, cpf, creci, senha } = await request.json();

    if (!nome_completo || !email || !cpf || !creci || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
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
          role: 'corretor',
        },
      ])
      .select()
      .single();

    if (dbError || !novoPerfil) {
      console.error('[POST /api/auth/register] DB error:', dbError?.message);
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
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
