import { createServerSupabaseClient } from './supabase';
import { isPublicAgencySlug } from './public-agency-path';
import { phoneDigits } from './phone';
import { imageObjectPath } from './private-images';
import type { AssistantProperty } from '../types/assistant';

export interface PublicAgency {
  id: string;
  nome: string;
  telefone: string | null;
  public_slug: string;
}
export class PublicAgencyNotFound extends Error {}
export async function getPublicAgency(
  slug: unknown,
): Promise<PublicAgency | null> {
  if (!isPublicAgencySlug(slug)) return null;
  const { data, error } = await createServerSupabaseClient()
    .from('imobiliarias')
    .select('id,nome,telefone,public_slug')
    .eq('public_slug', slug)
    .eq('ativo', true)
    .eq('atendimento_publico', true)
    .maybeSingle();
  if (error) throw new Error('Não foi possível consultar a imobiliária.');
  return data as PublicAgency | null;
}
export const presentPublicAgency = (agency: PublicAgency) => ({
  nome: agency.nome,
  telefone: phoneDigits(agency.telefone),
  slug: agency.public_slug,
});
export const PUBLIC_PROPERTY_FIELDS =
  'id,tipo,endereco,bairro,valor,metragem,quartos,vagas,descricao,imagem_url,status';
export function publicCatalog(companyId: string, limit = 100) {
  return createServerSupabaseClient()
    .from('imoveis')
    .select(PUBLIC_PROPERTY_FIELDS)
    .eq('imobiliaria_id', companyId)
    .eq('status', 'disponivel')
    .order('valor', { ascending: true })
    .limit(limit);
}
export function presentPublicProperty(
  row: AssistantProperty,
  slug: string,
): AssistantProperty {
  return {
    ...row,
    imagem_url: imageObjectPath(row.imagem_url)
      ? `/api/publico/imobiliarias/${encodeURIComponent(slug)}/imoveis/${row.id}/imagem`
      : null,
  };
}
export async function publicAgencyOwner(
  companyId: string,
): Promise<string | null> {
  const { data, error } = await createServerSupabaseClient()
    .from('perfis')
    .select('id,role')
    .eq('imobiliaria_id', companyId)
    .eq('ativo', true)
    .in('role', ['corretor', 'admin_corretora'])
    .order('criado_em', { ascending: true })
    .limit(100);
  if (error) throw new Error('Não foi possível preparar o atendimento.');
  return (
    data?.find((p) => p.role === 'corretor')?.id ??
    data?.find((p) => p.role === 'admin_corretora')?.id ??
    null
  );
}
