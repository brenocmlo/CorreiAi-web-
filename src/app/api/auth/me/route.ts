import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createServerSupabaseClient } from '@/lib/supabase';
import { publicProfile } from '@/lib/auth-session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const payload = verifyToken(token);

  
    const supabaseServer = createServerSupabaseClient();
    const { data: perfil, error } = await supabaseServer
      .from('perfis')
      .select('id, nome_completo, email, cpf, creci, role, criado_em')
      .eq('id', payload.uid)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erro ao consultar sessão.' }, { status: 500 });
    }
    if (!perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ perfil: publicProfile(perfil) });
  } catch {
    return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
  }
}
