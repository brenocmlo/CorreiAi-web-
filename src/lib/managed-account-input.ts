import { normalizeEmail } from './auth-input';

export function parseManagedAccount(value: unknown, kind: 'corretor' | 'admin_corretora') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const nome_completo = typeof input.nome_completo === 'string' ? input.nome_completo.trim() : '';
  const email = normalizeEmail(input.email);
  const senha = typeof input.senha === 'string' ? input.senha : '';
  const cpf = typeof input.cpf === 'string' && input.cpf.trim() ? input.cpf.trim() : null;
  const creci = typeof input.creci === 'string' && input.creci.trim() ? input.creci.trim() : null;
  if (nome_completo.length < 2 || nome_completo.length > 120 || email.length > 254 || !/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email)) return null;
  if (senha.length < 8 || senha.length > 128 || (cpf && cpf.length > 20) || (creci && creci.length > 30)) return null;
  if (kind === 'corretor' && (!cpf || !creci)) return null;
  return { nome_completo, email, senha, cpf, creci: kind === 'corretor' ? creci : null };
}
