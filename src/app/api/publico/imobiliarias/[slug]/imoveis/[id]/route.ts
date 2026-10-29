import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicAgency,
  publicCatalog,
  presentPublicAgency,
  presentPublicProperty,
} from '@/lib/public-agency';
import { isUuid } from '@/lib/imoveis-input';
import type { AssistantProperty } from '@/types/assistant';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params,
      agency = await getPublicAgency(slug);
    if (!agency || !isUuid(id))
      return NextResponse.json(
        { error: 'Imóvel não encontrado.' },
        { status: 404 },
      );
    const { data, error } = await publicCatalog(agency.id)
      .eq('id', id)
      .maybeSingle();
    if (error)
      return NextResponse.json(
        { error: 'Não foi possível consultar o imóvel.' },
        { status: 503 },
      );
    if (!data)
      return NextResponse.json(
        { error: 'Imóvel não encontrado.' },
        { status: 404 },
      );
    return NextResponse.json(
      {
        imobiliaria: presentPublicAgency(agency),
        imovel: presentPublicProperty(data as AssistantProperty, slug),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível consultar o imóvel.' },
      { status: 503 },
    );
  }
}
