import { TIPOS_IMOVEL } from '../types/lead';
import type { AssistantProperty, ConversationMessage, Qualification } from '../types/assistant';
import { phoneDigits } from './phone';

export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function parseMoney(value: string): number | null {
  const text = normalize(value);
  const match = text.match(/([\d][\d.,]*)\s*(milhao|milhoes|mil|mi\b|k\b)?/);
  if (!match) return null;
  const raw = match[1].replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const amount = Number(raw) * (/milhao|milhoes|^mi$/.test(match[2] || '') ? 1000000 : /mil|k/.test(match[2] || '') ? 1000 : 1);
  return Number.isFinite(amount) && amount > 0 && amount <= 1000000000 ? amount : null;
}

function budgetFrom(text: string, question = ''): number | null {
  const lower = normalize(text);
  const range = lower.match(/entre\s+(?:r\$\s*)?[\d.,]+\s*(?:mil|k)?\s+(?:e|a)\s*(?:r\$\s*)?([\d.,]+\s*(?:milhao|milhoes|mil|mi\b|k\b)?)/);
  if (range) return parseMoney(range[1]);
  const candidates = [...lower.matchAll(/(?:ate|orcamento(?:\s+maximo)?(?:\s+(?:e|de))?|teto(?:\s+de)?|no maximo|posso gastar(?:\s+ate)?|tenho(?:\s+ate)?|r\$)\s*(?:r\$\s*)?([\d][\d.,]*\s*(?:milhao|milhoes|mil|mi\b|k\b)?)/g)]
    .filter((m) => !negated(lower, m.index!) && !/^\s*(?:quartos?|vagas?|dias?|meses?|anos?)\b/.test(lower.slice(m.index! + m[0].length)));
  if (candidates.length) return parseMoney(candidates.at(-1)![1]);
  if (/orcamento|valor maximo|quanto.{0,25}(?:gastar|investir|pagar)|teto/.test(normalize(question)) && /^\s*(?:r\$\s*)?[\d.,]+\s*(?:milhao|milhoes|mil|mi\b|k\b|reais)?[.!]?\s*$/.test(lower)) {
    return parseMoney(lower);
  }
  return null;
}

function negated(text: string, index: number): boolean {
  const clause = text.slice(Math.max(0, index - 60), index).split(/[,.;!?]|\b(?:mas|porem|e sim)\b/).at(-1)!;
  return /\b(?:nao|nem|sem)\b/.test(clause);
}

const counts: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function qualificationFrom(messages: ConversationMessage[], extracted?: unknown, previous?: Qualification | null): Qualification {
  const source = messages.filter((m) => m.role === 'user').map((m) => m.text);
  const text = source.join('\n');
  const normalized = normalize(text);
  const raw = asRecord(extracted);
  const grounded = (key: string, max = 160): string | null => {
    const value = raw[key];
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max && normalized.includes(normalize(value.trim())) ? value.trim() : null;
  };
  const q: Qualification = {
    origem: 'assistente', nome: previous?.nome ?? null, email: previous?.email ?? null, telefone: previous?.telefone ?? null,
    objetivo: previous?.objetivo ?? null, tipoImovel: previous?.tipoImovel ?? null, bairro: previous?.bairro ?? null,
    orcamentoMax: previous?.orcamentoMax ?? null, quartosMin: previous?.quartosMin ?? null, vagasMin: previous?.vagasMin ?? null,
    prazo: previous?.prazo ?? null, formaPagamento: previous?.formaPagamento ?? null, preferencias: previous?.preferencias ?? [],
    permiteContato: previous?.permiteContato ?? true, visitaSolicitada: previous?.visitaSolicitada ?? false,
    contatoSolicitado: previous?.contatoSolicitado ?? false,
    visitaPreferencia: previous?.visitaPreferencia ?? null, imovelInteresseId: previous?.imovelInteresseId ?? null,
    resumo: '', proximoPasso: '', atualizadoEm: new Date().toISOString(),
  };
  for (let index = 0; index < messages.length; index++) {
    if (messages[index].role !== 'user') continue;
    const message = messages[index].text;
    const lower = normalize(message);
    const question = messages.slice(0, index).findLast((m) => m.role === 'assistant')?.text ?? '';
    const previousQuestion = normalize(question);
    const name = message.match(/\b(?:me chamo|meu nome [ée]|sou(?: o| a)?)\s+([\p{L}][\p{L} '-]{1,100})/iu)?.[1]?.split(/\s+(?:e (?:quero|procuro|meu|gostaria)|quero|procuro)\b/i)[0].trim();
    if (name && !/^(?:um |uma |corretor|cliente|proprietari|interessad)/.test(normalize(name))) q.nome = name;
    else if (/como.{0,20}(?:chamad|chama)|qual.{0,15}(?:seu )?nome/.test(previousQuestion) && /^[\p{L}][\p{L} '-]{1,100}[.!]?$/u.test(message.trim())) q.nome = message.trim().replace(/[.!]$/, '');
    const neighborhood = message.match(/\b(?:no bairro|na regi[ãa]o|bairro(?: [ée])?)\s+([\p{L}][\p{L} '-]{1,99})/iu)?.[1]
      ?.split(/\s+(?:at[ée]|com|por|para|e preciso|e quero|de at[ée])(?=\s|$)/i)[0].trim();
    if (neighborhood) q.bairro = neighborhood;
    else if (/qual bairro|em que bairro|em qual bairro|bairro.{0,20}prefere/.test(previousQuestion) && /^[\p{L}][\p{L} '-]{1,99}[.!]?$/u.test(message.trim()) && !/^(qualquer|nao|não|tanto faz)/i.test(message.trim())) q.bairro = message.trim().replace(/[.!]$/, '');
    const shortNeighborhood = message.match(/\b(?:casa|apartamento|apto|terreno|studio)\s+(?:no|na|em)\s+([\p{L}][\p{L} '-]{1,99})/iu)?.[1]?.split(/\s+(?:at[ée]|com|por|para|e preciso|e quero)(?=\s|$)/i)[0].trim();
    if (!neighborhood && shortNeighborhood && !/^(bairro|regiao|região)\b/i.test(shortNeighborhood)) q.bairro = shortNeighborhood;
    const finalLocation=message.match(/\b(?:em|no|na)\s+([\p{Lu}][\p{L} '-]{1,99})/u)?.[1]?.split(/\s+(?:at[ée]|com|por|para)(?=\s|$)/i)[0].trim();
    if(!neighborhood&&!shortNeighborhood&&finalLocation&&typesInSearch(lower))q.bairro=finalLocation;
    const budget = budgetFrom(message, question);
    if (budget !== null) q.orcamentoMax = budget;
    const comparing = /diferenca|compar|vantag|desvantag|qual.{0,30}melhor|nao sei|em duvida|indecis/.test(lower);
    const types = [...lower.matchAll(/\b(apartamento|ape|apto|casa|cobertura|studio|estudio|terreno|comercial)\b/g)].filter((m) => !negated(lower, m.index!));
    if (types.length && !comparing) {
      const type = types.at(-1)![1];
      q.tipoImovel = /ape|apto/.test(type) ? 'Apartamento' : /estudio/.test(type) ? 'Studio' : TIPOS_IMOVEL.find((t) => normalize(t) === type) ?? null;
    }
    const goals = [...lower.matchAll(/\b(alugar|aluguel|locacao|investir|investimento|comprar|compra|vender|anunciar)\b/g)].filter((m) => !negated(lower, m.index!));
    if (/sair do aluguel/.test(lower)) q.objetivo = 'comprar';
    else if (goals.length && !comparing && !/comprar ou alugar|alugar ou comprar/.test(lower)) {
      const goal = goals.at(-1)![1];
      q.objetivo = /alugar|aluguel|locacao/.test(goal) ? 'alugar' : /investir|investimento/.test(goal) ? 'investir' : /vender|anunciar/.test(goal) ? 'vender' : 'comprar';
    }
    const rooms = lower.match(/\b(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:quartos?|dormitorios?)\b/);
    const parking = lower.match(/\b(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco)\s*vagas?\b/);
    if (rooms) q.quartosMin = counts[rooms[1]] ?? Number(rooms[1]);
    if (parking) q.vagasMin = counts[parking[1]] ?? Number(parking[1]);
    if (/nao\s+(?:quero|autorizo|permito|desejo).{0,40}(?:cadastr|salv|compartilh|contat|corretor|(?:passar|informar|fornecer).{0,15}dados)|nao me (?:lig|contat)/.test(lower)) q.permiteContato = false;
    else if (/(?:autorizo|pode).{0,30}(?:cadastr|salv|encaminh|contat)/.test(lower)) q.permiteContato = true;
    if (/(?:quero|preciso|gostaria).{0,25}(?:falar|conversar|contato).{0,25}corretor|(?:me chame|me ligue|quero retorno)/.test(lower)) q.contatoSolicitado = true;
    if (!q.permiteContato) q.contatoSolicitado = false;
    if (/nao\s+(?:quero|desejo|preciso).{0,20}(?:visit|agend)|cancel.{0,20}visit/.test(lower)) q.visitaSolicitada = false;
    else if (/(?:quero|gostaria|podemos|pode|preciso|vamos).{0,35}(?:visit|agend)|\bvisitar\b/.test(lower)) q.visitaSolicitada = true;
    if (q.visitaSolicitada && /(?:qual dia|dia e periodo|horario|quando).{0,50}visita|(?:visita|visitar).{0,50}(?:qual dia|dia e periodo|horario|quando)/.test(previousQuestion) && /amanha|hoje|sabado|domingo|segunda|terca|quarta|quinta|sexta|\d+h|\d+:\d+/.test(lower) && message.length <= 160) q.visitaPreferencia = message.trim();
    const email = message.match(/[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>.]+/g)?.at(-1);
    if (email && email.length <= 254) q.email = email.toLowerCase();
    const phones = message.match(/\+?\d[\d\s().-]{8,}\d/g) ?? [];
    const phoneContext = /(?:meu |me chama|me liga|telefone|whatsapp|celular|contato)/.test(lower) || /(?:qual|informe|passe|numero).{0,30}(?:telefone|whatsapp|celular|retorno)/.test(previousQuestion);
    const phone = phones.filter(p => phoneDigits(p) && (phoneContext || /^\s*\+?\d{0,3}\s*\(\d{2}\)/.test(p)) && !/^\d{4}-\d{2}-\d{2}/.test(p)).at(-1);
    if (phone && !/(?:telefone|whatsapp).{0,15}(?:da imobiliaria|do corretor|dele|dela)/.test(lower)) q.telefone = phoneDigits(phone);
  }
  const latest = normalize(source.at(-1) ?? '');
  const extractedName = grounded('nome',120), extractedNeighborhood = grounded('bairro',100);
  if (extractedName && (!q.nome || latest.includes(normalize(extractedName)))) q.nome = extractedName;
  if (extractedNeighborhood && (!q.bairro || latest.includes(normalize(extractedNeighborhood)))) q.bairro = extractedNeighborhood;
  if (/nao tenho preferencia.{0,15}bairro|qualquer bairro|outros bairros|sem (?:preferencia|restricao).{0,15}bairro/.test(latest)) q.bairro = null;
  const deadline = grounded('prazo');
  // Literalidade não basta: modelos pequenos às vezes classificam "até 300 mil" como prazo.
  if (deadline && /\b(dias?|semanas?|mes|meses|anos?|hoje|amanha|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|semestre|trimestre|urgente|imediat[oa]|pressa)\b|quanto antes|assim que/.test(normalize(deadline))) q.prazo = deadline;
  q.formaPagamento = grounded('formaPagamento') ?? q.formaPagamento;
  if (q.visitaSolicitada) q.visitaPreferencia = grounded('visitaPreferencia') ?? q.visitaPreferencia;
  else q.visitaPreferencia = null;
  if (Array.isArray(raw.preferencias)) {
    const preferences = raw.preferencias.filter((v): v is string => typeof v === 'string' && v.length <= 100 && v.trim().length > 0 && normalized.includes(normalize(v)));
    if (preferences.length) q.preferencias = [...new Set(preferences)].slice(0, 8);
  }
  q.resumo = [q.objetivo, q.tipoImovel, q.bairro && `Bairro: ${q.bairro}`, q.orcamentoMax && `Teto: R$ ${q.orcamentoMax.toLocaleString('pt-BR')}`, q.quartosMin !== null && `${q.quartosMin} quartos`, q.vagasMin !== null && `${q.vagasMin} vagas`, q.prazo && `Prazo: ${q.prazo}`, q.formaPagamento && `Pagamento: ${q.formaPagamento}`, ...q.preferencias].filter(Boolean).join(' · ');
  q.proximoPasso = !q.permiteContato ? 'Não contatar: cliente recusou o cadastro/contato.' : q.visitaSolicitada ? 'Corretor deve verificar disponibilidade e confirmar a visita solicitada.' : 'Corretor deve revisar a busca e entrar em contato com o cliente.';
  return q;
}

function typesInSearch(text:string){return /\b(?:casa|apartamento|apto|terreno|studio)\b/.test(text)&&!/diferenca|comparacao/.test(text);}

export function completeContact(q: Qualification) {
  if (!q.permiteContato || !q.nome || q.nome.trim().length < 3 || !q.email || !q.telefone) return null;
  return { nome: q.nome, email: q.email, telefone: q.telefone, tipoImovel: q.tipoImovel ?? 'Não informado', faixaOrcamento: q.orcamentoMax ? `Até R$ ${q.orcamentoMax.toLocaleString('pt-BR')}` : 'Não informado' };
}

export function selectPortfolio(properties: AssistantProperty[], q: Qualification): AssistantProperty[] {
  if (q.objetivo === 'alugar' || q.objetivo === 'vender') return [];
  if (!q.tipoImovel && !q.bairro && q.orcamentoMax === null) return [];
  return properties.filter((p) => p.status === 'disponivel' && Number.isFinite(p.valor) && p.valor >= 0 &&
    (!q.tipoImovel || normalize(p.tipo) === normalize(q.tipoImovel)) &&
    (!q.bairro || normalize(p.bairro).includes(normalize(q.bairro))) &&
    (q.orcamentoMax === null || p.valor <= q.orcamentoMax) &&
    (q.quartosMin === null || (p.quartos != null && p.quartos >= q.quartosMin)) &&
    (q.vagasMin === null || (p.vagas != null && p.vagas >= q.vagasMin)))
    .sort((a, b) => a.valor - b.valor).slice(0, 5);
}
