import { NextRequest, NextResponse } from 'next/server.js';
import bcrypt from 'bcryptjs';
import { createServerSupabaseClient } from '../../../../lib/supabase.ts';
import { signToken } from '../../../../lib/jwt.ts';
import { normalizeEmail } from '../../../../lib/auth-input.ts';
import { resolveProfileAccess } from '../../../../lib/profile-access';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const senha = body?.senha;

    if (!/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email) || typeof senha !== 'string' || !senha) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const supabaseServer = createServerSupabaseClient();

    // Buscar usuário pelo e-mail
    const { data: perfil, error } = await supabaseServer
      .from('perfis')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !perfil || perfil.ativo !== true) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaCorreta = typeof perfil.senha_hash === 'string' && await bcrypt.compare(senha, perfil.senha_hash);
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    if (!await resolveProfileAccess(perfil)) {
      return NextResponse.json({ error: 'Seu acesso profissional depende de uma imobiliária ativa. Procure o administrador responsável.' }, { status: 403 });
    }

    // Gerar token JWT
    const token = signToken({
      uid: perfil.id,
      email: perfil.email,
      role: perfil.role,
      nome_completo: perfil.nome_completo,
    });

    // Retornar com cookie httpOnly
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
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
