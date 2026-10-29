import { normalize } from './assistant-qualification';
export type MessagePolicy = 'technical' | 'private' | 'off_topic';
export function inspectAssistantMessage(value: string): MessagePolicy | null {
  const text = normalize(value.normalize('NFKC')).replace(/\s+/g, ' ');
  if (
    /\bsk-(?:or-v1-)?[a-z0-9_-]{24,}\b|\beyJ[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{15,}/i.test(
      value,
    )
  )
    return 'technical';
  if (
    /\b(?:drop|truncate|alter)\s+(?:table|database|schema)|\b(?:select|delete)\b.{0,100}\bfrom\b|\bunion\s+(?:all\s+)?select|\binsert\s+into\b|\bupdate\b.{0,60}\bset\b|['"]\s*(?:or|and)\s+['"\d]|\bor\s+1\s*=\s*1/i.test(
      text,
    )
  )
    return 'technical';
  if (
    /(?:ignore|desconsidere|esqueca|bypass).{0,70}(?:instru|regras|previous|system|sistema|prompt)|(?:revele|mostre|imprima|retorne|print|reveal).{0,80}(?:senha|segredo|chave|token|secret|prompt)|supabase_service_role_key|openrouter_api_key|(?:finja|aja|act as).{0,30}(?:admin|root|sistema)/.test(
      text,
    )
  )
    return 'technical';
  if (
    /(?:outros clientes|outros atendimentos|dados.{0,25}outr)|(?:mude|avance|altere|marque|coloque).{0,50}(?:etapa|funil|fechado|permissao|administrador)/.test(
      text,
    )
  )
    return 'private';
  if (
    /receita.{0,20}(?:bolo|chocolate|pao|macarrao)|(?:quem ganhou|resultado|placar).{0,35}(?:jogo|futebol|partida)|(?:escreva|crie|gere|faca).{0,30}(?:codigo|script|programa).{0,20}(?:python|javascript|sql|para mim)|(?:conte|conta|me de|escreva).{0,20}piada|horoscopo|quem.{0,20}(?:votar|presidente)|qual.{0,20}(?:signo|partido politico)/.test(
      text,
    )
  )
    return 'off_topic';
  return null;
}
export function messagePolicyReply(policy: MessagePolicy): string {
  if (policy === 'technical')
    return 'Por aqui, posso ajudar com imóveis e atendimento. Não executo comandos nem acesso senhas, chaves ou configurações internas. Podemos continuar sua busca de imóvel?';
  if (policy === 'private')
    return 'Posso ajudar com os imóveis desta imobiliária e o seu atendimento. Os dados de outros clientes são privados, e as etapas do funil são gerenciadas pelo corretor responsável. Como posso ajudar na sua busca?';
  return 'Minha especialidade por aqui é ajudar com imóveis, dúvidas sobre moradia e o atendimento da imobiliária. Quer continuar sua busca ou esclarecer uma dúvida sobre um imóvel?';
}
