import { NextRequest, NextResponse } from 'next/server';
import { rowToLead } from '@/lib/leads-mapper';
import { createPublicLead } from '@/lib/public-leads';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const result = await createPublicLead(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ lead: rowToLead(result.lead) }, { status: 201 });
}
