import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { inputToRow, rowToLead } from '@/lib/leads-mapper';
import { ownerFilter, parseLeadDetails } from '@/lib/lead-input';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { LeadInput } from '@/types/lead';

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (auth.role === 'lead') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false });
  if (auth.role === 'corretor') query = query.eq('corretor_id', auth.uid);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: (data ?? []).map(rowToLead) });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (auth.role === 'lead') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = parseLeadDetails(body);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        ...inputToRow(parsed.data as LeadInput),
        corretor_id: auth.uid,
      },
    ])
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: rowToLead(data) }, { status: 201 });
}
