import { createServerSupabaseClient } from './supabase';
import { scopeCatalog, type CatalogAccess } from './catalog-access';
import { isPublicImovelImageUrl } from './imoveis-upload';

export function imageObjectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    let path: string;
    if (value.startsWith('/api/imoveis/imagem?')) {
      const url = new URL(value, 'https://local.invalid');
      if ([...url.searchParams.keys()].some(k => k !== 'path') || url.hash) return null;
      path = url.searchParams.get('path') ?? '';
    } else {
      if (!isPublicImovelImageUrl(value, process.env.NEXT_PUBLIC_SUPABASE_URL)) return null;
      path = decodeURIComponent(new URL(value).pathname.split('/imoveis_imagens/')[1] ?? '');
    }
    return path && /^[a-zA-Z0-9_./-]+$/.test(path) && !path.includes('..') && !path.startsWith('/') ? path : null;
  } catch { return null; }
}

export function storedImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_imagens/${path}`;
}

export function presentImovel<T extends { imagem_url?: string | null }>(row: T): T {
  const path = imageObjectPath(row.imagem_url);
  return { ...row, imagem_url: path ? `/api/imoveis/imagem?path=${encodeURIComponent(path)}` : null };
}

export async function validateImovelImage(input: { imagem_url?: string | null }, access: CatalogAccess, id?: string): Promise<boolean> {
  if (!input.imagem_url) return true;
  const path = imageObjectPath(input.imagem_url);
  if (!path) return false;
  const canonical = storedImageUrl(path);
  if (!path.startsWith(`${access.uid}/`)) {
    if (!id) return false;
    // Edição pode preservar a imagem já vinculada ao imóvel da imobiliária.
    const existing = await scopeCatalog(createServerSupabaseClient().from('imoveis')
      .select('id').eq('id', id).eq('imagem_url', canonical), access).maybeSingle();
    if (existing.error || !existing.data) return false;
  }
  input.imagem_url = canonical;
  return true;
}
