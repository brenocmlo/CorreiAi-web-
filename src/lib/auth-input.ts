export type PublicRole = 'lead';

export interface RegistrationInput {
  nome_completo: string;
  email: string;
  cpf: string;
  creci: string | null;
  senha: string;
  role: PublicRole;
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function parseRegistration(value: unknown): RegistrationInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const nome_completo = typeof input.nome_completo === 'string' ? input.nome_completo.trim() : '';
  const email = normalizeEmail(input.email);
  const cpf = typeof input.cpf === 'string' ? input.cpf.trim() : '';
  const senha = typeof input.senha === 'string' ? input.senha : '';
  if (input.role !== undefined && input.role !== 'lead') return null;
  if (!nome_completo || !/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email) || !cpf || senha.length < 6) return null;
  return { nome_completo, email, cpf, creci: null, senha, role: 'lead' };
}
