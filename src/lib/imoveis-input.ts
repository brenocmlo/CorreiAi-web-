export interface ImovelPayload {
  tipo: 'casa' | 'apartamento' | 'terreno' | 'comercial';
  endereco: string;
  bairro: string;
  valor: number;
  metragem?: number | null;
  quartos?: number | null;
  vagas?: number | null;
  status: 'disponivel' | 'vendido' | 'alugado';
  imagem_url?: string | null;
}

type Result = { data: Partial<ImovelPayload>; error?: never } | { error: string; data?: never };

const TIPOS = new Set<ImovelPayload['tipo']>(['casa', 'apartamento', 'terreno', 'comercial']);
const STATUS = new Set<ImovelPayload['status']>(['disponivel', 'vendido', 'alugado']);
const CAMPOS = ['tipo', 'endereco', 'bairro', 'valor', 'metragem', 'quartos', 'vagas', 'status', 'imagem_url'] as const;

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseImovelInput(value: unknown, options: { partial?: boolean } = {}): Result {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Informe os campos do imóvel.' };
  }

  const input = value as Record<string, unknown>;
  const data: Record<string, string | number | null> = {};
  const required = options.partial ? [] : ['tipo', 'endereco', 'bairro', 'valor', 'status'];

  for (const field of required) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      return { error: `Campo obrigatório ausente: ${field === 'endereco' ? 'endereço' : field}.` };
    }
  }

  for (const field of CAMPOS) {
    const raw = input[field];
    if (raw === undefined) continue;

    if (field === 'tipo') {
      if (typeof raw !== 'string' || !TIPOS.has(raw as ImovelPayload['tipo'])) return { error: 'Tipo de imóvel inválido.' };
      data.tipo = raw;
    } else if (field === 'status') {
      if (typeof raw !== 'string' || !STATUS.has(raw as ImovelPayload['status'])) return { error: 'Status do imóvel inválido.' };
      data.status = raw;
    } else if (field === 'endereco' || field === 'bairro') {
      if (typeof raw !== 'string' || !raw.trim()) return { error: `${field === 'endereco' ? 'Endereço' : 'Bairro'} inválido.` };
      data[field] = raw.trim();
    } else if (field === 'valor' || field === 'metragem' || field === 'quartos' || field === 'vagas') {
      if (raw === null && field !== 'valor') {
        data[field] = null;
      } else if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0 || ((field === 'quartos' || field === 'vagas') && !Number.isInteger(raw))) {
        return { error: `${field === 'valor' ? 'Valor' : field} inválido.` };
      } else {
        data[field] = raw;
      }
    } else if (field === 'imagem_url') {
      if (raw !== null && (typeof raw !== 'string' || !/^https:\/\//.test(raw))) return { error: 'URL da imagem inválida.' };
      data.imagem_url = raw;
    }
  }

  if (options.partial && Object.keys(data).length === 0) return { error: 'Informe ao menos um campo para editar.' };
  return { data: data as Partial<ImovelPayload> };
}
