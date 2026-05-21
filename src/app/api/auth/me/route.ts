import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createServerSupabaseClient } from '@/lib/supabase';

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
      .select('*')
      .eq('id', payload.uid)
      .maybeSingle();

    if (error || !perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ perfil });
  } catch {
    return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
  }
}
