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

export async function assistantScope(request: NextRequest, cookieHash: string) {
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
