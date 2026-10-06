import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { imagePath, parseImageMetadata } from '@/lib/imoveis-upload';
import { createServerSupabaseClient } from '@/lib/supabase';
import { IMOVEIS_STORAGE_BUCKET } from '@/lib/supabase-config';

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (auth.role === 'lead') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  let metadata: unknown;
  try {
    metadata = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = parseImageMetadata(metadata);
  if (!parsed.extension) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const path = imagePath(auth.uid, parsed.extension, randomUUID());
  const { data, error } = await createServerSupabaseClient()
    .storage.from(IMOVEIS_STORAGE_BUCKET).createSignedUploadUrl(path);

  if (error || !data?.token) {
    return NextResponse.json({ error: 'Não foi possível autorizar o upload.' }, { status: 500 });
  }

  return NextResponse.json({ path, token: data.token });
}
