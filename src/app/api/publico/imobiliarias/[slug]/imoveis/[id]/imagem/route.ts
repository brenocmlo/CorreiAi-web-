import { NextRequest, NextResponse } from 'next/server';
import { getPublicAgency, publicCatalog } from '@/lib/public-agency';
import { isUuid } from '@/lib/imoveis-input';
import { imageObjectPath } from '@/lib/private-images';
import { createServerSupabaseClient } from '@/lib/supabase';
import { IMOVEIS_STORAGE_BUCKET } from '@/lib/supabase-config';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params,
      agency = await getPublicAgency(slug);
    if (!agency || !isUuid(id))
      return NextResponse.json(
        { error: 'Imagem não encontrada.' },
        { status: 404 },
      );
    const result = await publicCatalog(agency.id).eq('id', id).maybeSingle();
    const path =
      !result.error && result.data
        ? imageObjectPath(result.data.imagem_url)
        : null;
    if (!path)
      return NextResponse.json(
        { error: 'Imagem não encontrada.' },
        { status: 404 },
      );
    const { data, error } = await createServerSupabaseClient()
      .storage.from(IMOVEIS_STORAGE_BUCKET)
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl)
      return NextResponse.json(
        { error: 'Imagem não encontrada.' },
        { status: 404 },
      );
    return NextResponse.redirect(data.signedUrl, {
      status: 302,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Imagem não encontrada.' },
      { status: 404 },
    );
  }
}
