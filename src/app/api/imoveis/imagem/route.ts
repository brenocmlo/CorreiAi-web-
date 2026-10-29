import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { scopeCatalog } from '@/lib/catalog-access';
import { imageObjectPath, storedImageUrl } from '@/lib/private-images';
import { createServerSupabaseClient } from '@/lib/supabase';
import { IMOVEIS_STORAGE_BUCKET } from '@/lib/supabase-config';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'super_admin') return NextResponse.json({ error: 'Acesse a administração das imobiliárias.' }, { status: 403 });
  const path = imageObjectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (!path) return NextResponse.json({ error: 'Imagem inválida.' }, { status: 400 });
  const db = createServerSupabaseClient();
  if (!path.startsWith(`${auth.uid}/`)) {
    const result = await scopeCatalog(db.from('imoveis').select('id').eq('imagem_url', storedImageUrl(path)), auth).limit(1);
    if (result.error || !result.data?.length) return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
  }
  const { data, error } = await db.storage.from(IMOVEIS_STORAGE_BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { 'Cache-Control': 'private, no-store' } });
}
