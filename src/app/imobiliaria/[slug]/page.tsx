import { notFound } from 'next/navigation';
import { getPublicAgency, presentPublicAgency } from '@/lib/public-agency';
import { PublicAgencyLanding } from '@/components/public-agency/PublicAgencyLanding';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    agency = await getPublicAgency(slug);
  if (!agency) notFound();
  return (
    <PublicAgencyLanding
      key={agency.public_slug}
      agency={presentPublicAgency(agency)}
    />
  );
}
