import type { AppRole } from './auth-policy';

export interface ProfileRow {
  id: string;
  nome_completo: string;
  email: string;
  cpf: string | null;
  creci: string | null;
  role: AppRole;
  criado_em: string;
  senha_hash?: string;
  imobiliaria_id?: string | null;
}

export function publicProfile(perfil: ProfileRow) {
  return {
    id: perfil.id,
    nome_completo: perfil.nome_completo,
    email: perfil.email,
    cpf: perfil.cpf,
    creci: perfil.creci,
    role: perfil.role,
    criado_em: perfil.criado_em,
    imobiliaria_id: perfil.imobiliaria_id ?? null,
  };
}
