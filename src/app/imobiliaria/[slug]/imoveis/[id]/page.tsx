import { notFound } from 'next/navigation';
import {
  getPublicAgency,
  publicCatalog,
  presentPublicProperty,
  presentPublicAgency,
} from '@/lib/public-agency';
import { isUuid } from '@/lib/imoveis-input';
import { PublicPropertyDetail } from '@/components/public-agency/PublicPropertyDetail';
import type { AssistantProperty } from '@/types/assistant';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params,
    agency = await getPublicAgency(slug);
  if (!agency || !isUuid(id)) notFound();
  const result = await publicCatalog(agency.id).eq('id', id).maybeSingle();
  if (result.error) throw new Error('Não foi possível consultar o imóvel.');
  if (!result.data) notFound();
  return (
    <PublicPropertyDetail
      agency={presentPublicAgency(agency)}
      property={presentPublicProperty(result.data as AssistantProperty, slug)}
    />
  );
}
