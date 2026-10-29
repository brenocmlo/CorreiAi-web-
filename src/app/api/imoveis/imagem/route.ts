import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { scopeCatalog } from '@/lib/catalog-access';
import { imageObjectPath, storedImageUrl } from '@/lib/private-images';
import { createServerSupabaseClient } from '@/lib/supabase';
import { IMOVEIS_STORAGE_BUCKET } from '@/lib/supabase-config';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const path = imageObjectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (!path) return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
  const db = createServerSupabaseClient();

  if (!auth) {
    // Sem sessão: só libera se essa imagem pertence a um imóvel que o
    // corretor marcou explicitamente para a vitrine pública da landing.
    const destaque = await db
      .from('imoveis')
      .select('id')
      .eq('imagem_url', storedImageUrl(path))
      .eq('destaque_landing', true)
      .eq('status', 'disponivel')
      .limit(1);
    if (destaque.error || !destaque.data?.length) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
  } else {
    if (auth.role === 'super_admin') return NextResponse.json({ error: 'Acesse a administração das imobiliárias.' }, { status: 403 });
    if (!path.startsWith(`${auth.uid}/`)) {
      const result = await scopeCatalog(db.from('imoveis').select('id').eq('imagem_url', storedImageUrl(path)), auth).limit(1);
      if (result.error || !result.data?.length) return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
    }
  }

  const { data, error } = await db.storage.from(IMOVEIS_STORAGE_BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { 'Cache-Control': auth ? 'private, no-store' : 'public, max-age=60' } });
}
