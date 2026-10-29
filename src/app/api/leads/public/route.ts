import { NextRequest, NextResponse } from 'next/server';
import { rowToLead } from '@/lib/leads-mapper';
import { createPublicLead } from '@/lib/public-leads';
import { getAuthFromRequest } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Entre na sua conta para registrar o contato.' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const result = await createPublicLead(body, auth);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ lead: rowToLead(result.lead) }, { status: 201 });
}
