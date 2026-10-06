export type PublicRole = 'corretor' | 'lead';

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
  const creci = typeof input.creci === 'string' ? input.creci.trim() : '';
  const senha = typeof input.senha === 'string' ? input.senha : '';
  if (input.role !== 'corretor' && input.role !== 'lead') return null;
  if (!nome_completo || !/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email) || !cpf || senha.length < 6) return null;
  if (input.role === 'corretor' && !creci) return null;
  return { nome_completo, email, cpf, creci: input.role === 'corretor' ? creci : null, senha, role: input.role };
}
