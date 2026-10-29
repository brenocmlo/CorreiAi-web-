import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicAgency,
  publicCatalog,
  presentPublicAgency,
  presentPublicProperty,
} from '@/lib/public-agency';
import type { AssistantProperty } from '@/types/assistant';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params,
      agency = await getPublicAgency(slug);
    if (!agency)
      return NextResponse.json(
        { error: 'Página da imobiliária não encontrada.' },
        { status: 404 },
      );
    const { data, error } = await publicCatalog(agency.id);
    if (error)
      return NextResponse.json(
        { error: 'Não foi possível consultar os imóveis agora.' },
        { status: 503 },
      );
    return NextResponse.json(
      {
        imobiliaria: presentPublicAgency(agency),
        imoveis: ((data ?? []) as AssistantProperty[]).map((row) =>
          presentPublicProperty(row, slug),
        ),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Atendimento temporariamente indisponível.' },
      { status: 503 },
    );
  }
}
