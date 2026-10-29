import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getAuthFromRequest } from './api-auth';
import { assistantContext } from './assistant-context';
import { assistantOwner } from './assistant-store';
import {
  getPublicAgency,
  publicAgencyOwner,
  PublicAgencyNotFound,
  presentPublicAgency,
} from './public-agency';
import { publicSessionHash } from './assistant-public-session';
import type { AssistantContext } from '../types/assistant';
import { getDemoAgency, demoAgencyMention } from './assistant-demo';

export async function assistantScope(
  request: NextRequest,
  cookieHash: string,
  latestMessage = '',
) {
  if (
    request.nextUrl.searchParams.has('demo') &&
    !request.nextUrl.searchParams.has('imobiliaria')
  ) {
    const requested = getDemoAgency(request.nextUrl.searchParams.get('demo'));
    if (!requested) throw new PublicAgencyNotFound();
    const agency = getDemoAgency(demoAgencyMention(latestMessage)) ?? requested;
    const context: AssistantContext = {
      mode: 'demo',
      demoSlug: agency.slug,
      catalogState: 'available',
      company: { nome: agency.nome, telefone: null },
    };
    return {
      auth: null,
      context,
      companyId: null,
      publicSlug: null,
      demoSlug: agency.slug,
      owner: null,
      hash: null,
    };
  }
  if (request.nextUrl.searchParams.has('imobiliaria')) {
    const agency = await getPublicAgency(
      request.nextUrl.searchParams.get('imobiliaria'),
    );
    if (!agency) throw new PublicAgencyNotFound();
    const details = presentPublicAgency(agency);
    const context: AssistantContext = {
      catalogState: 'available',
      company: { nome: details.nome, telefone: details.telefone },
      publicSlug: agency.public_slug,
    };
    return {
      auth: null,
      context,
      companyId: agency.id,
      publicSlug: agency.public_slug,
      demoSlug: null,
      owner: await publicAgencyOwner(agency.id),
      hash: publicSessionHash(cookieHash, agency.id),
    };
  }
  const auth = await getAuthFromRequest(request),
    context = await assistantContext(auth);
  return {
    auth,
    context,
    companyId: auth?.imobiliariaId ?? null,
    publicSlug: null,
    demoSlug: null,
    owner: auth ? await assistantOwner(auth) : null,
    hash: auth
      ? createHash('sha256')
          .update(
            `${auth.uid}:${auth.imobiliariaId ?? 'sem-vinculo'}:${cookieHash}`,
          )
          .digest('hex')
      : null,
  };
}
