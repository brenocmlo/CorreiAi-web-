import type {
  AssistantContext,
  AssistantProperty,
  ConversationMessage,
  Qualification,
} from '../types/assistant';
import { normalize } from './assistant-qualification';
import { conciseReply, groundedReply } from './assistant-prompt';
import { formatPhone, phoneDigits, phoneLink } from './phone';

const latest = (messages: ConversationMessage[]) =>
  normalize(messages.at(-1)?.text ?? '');
const closing = (text: string) =>
  /(?:obrigad[oa].{0,15}(?:vou pensar|so isso)|vou pensar|volto depois|por enquanto e so|ate mais|tchau)/.test(
    text,
  );
const frustrated = (text: string) =>
  /ja disse|ja falei|nao quero repetir|pare de perguntar|nao entendeu/.test(
    text,
  );
export const wantsContact = (text: string) =>
  /(?:falar|conversar|contato|chame|ligue|retorno|encaminh).{0,30}(?:corretor|equipe|comigo)|quero.{0,20}(?:corretor|visit)|solicitar.{0,15}visita/.test(
    normalize(text),
  );
const searchQuestion = (text: string) =>
  /(?:mostre|procuro|busco|prefiro|quero|preciso|tem|ha).{0,50}(?:casa|apartamento|imoveis|imovel|comprar|alugar|anunciar)|outros bairros/.test(
    text,
  );
const factualQuestion = (text: string) =>
  /como funciona|financiamento|documentacao|documentos|diferenca|compare|tem elevador|aceita pet|condominio|barulho|ruido|silencio|iptu|qual.{0,15}(?:valor|preco|metragem)|quantos quartos/.test(
    text,
  ) ||
  (!searchQuestion(text) &&
    /\?|^(?:como |qual |quanto |tem |aceita |possui |por que )/.test(text));
const phoneQuestion = (text: string) =>
  /(?:telefone|whatsapp|numero|contato).{0,25}(?:imobiliaria|corretora|empresa)|(?:imobiliaria|corretora|empresa).{0,25}(?:telefone|whatsapp|numero|contato)/.test(
    text,
  );

export function nextQuestion(
  messages: ConversationMessage[],
  q: Qualification,
  properties: AssistantProperty[],
  context: AssistantContext,
): string | null {
  const text = latest(messages);
  if (
    closing(text) ||
    frustrated(text) ||
    /(?:outros clientes|outros atendimentos|dados.{0,25}outr)/.test(text) ||
    phoneQuestion(text) ||
    !q.permiteContato ||
    /(?:nao.{0,15}(?:quero|mais).{0,15}pergunt|pare de perguntar)/.test(text)
  )
    return null;
  if (factualQuestion(text) && !wantsContact(text)) return null;
  if (/caro|fora do (?:meu )?orcamento|nao (?:consigo|posso) pagar/.test(text))
    return 'Você prefere reduzir o valor buscando outra localização ou menos espaço?';
  if (/nao sei|indecis|estou perdid/.test(text))
    return 'O que mais importa na sua rotina para escolher o imóvel?';
  if (
    context.catalogState !== 'available' &&
    (q.tipoImovel || q.orcamentoMax || q.bairro)
  )
    return null;
  if (q.visitaSolicitada) {
    if (!q.imovelInteresseId)
      return properties.length
        ? 'Qual dos imóveis abaixo você quer visitar?'
        : null;
    if (!q.visitaPreferencia)
      return 'Qual dia e período você prefere para a visita?';
  }
  if (
    (wantsContact(text) || q.contatoSolicitado || q.visitaSolicitada) &&
    q.permiteContato
  ) {
    if (!q.nome) return 'Como você prefere ser chamado?';
    if (!q.telefone)
      return 'Qual é seu telefone com DDD para retorno do corretor?';
    if (!q.email) return 'Qual é seu e-mail para completar o atendimento?';
    return null;
  }
  if (!q.objetivo) return 'Você quer comprar, alugar ou anunciar um imóvel?';
  if (q.objetivo === 'vender')
    return !q.tipoImovel
      ? 'Que tipo de imóvel você quer anunciar?'
      : !q.bairro
        ? 'Em qual bairro fica o imóvel?'
        : null;
  if (q.objetivo === 'alugar') return null;
  if (properties.length)
    return 'Qual dessas opções você gostaria de conhecer melhor?';
  if (!q.tipoImovel)
    return 'Você procura casa, apartamento ou outro tipo de imóvel?';
  if (q.orcamentoMax === null)
    return 'Qual é o valor máximo que você pretende investir?';
  if (!q.bairro) return 'Em qual bairro você procura?';
  return 'Você aceitaria considerar outros bairros?';
}

export function directAnswer(
  messages: ConversationMessage[],
  q: Qualification,
  properties: AssistantProperty[],
  context: AssistantContext,
): string | null {
  const text = latest(messages),
    question = nextQuestion(messages, q, properties, context);
  if (
    /^(oi|ola|bom dia|boa tarde|boa noite|tudo bem|e ai)[!?.,\s]*$/.test(text)
  )
    return (
      'Olá! Sou a assistente da CorreAI.' +
      (question ? ' ' + question : ' Como posso ajudar?')
    );
  if (closing(text))
    return 'Claro! Fique à vontade para voltar quando quiser. Sua busca pode continuar por aqui.';
  if (phoneQuestion(text)) {
    const phone = phoneDigits(context.company?.telefone);
    return phone
      ? `O telefone oficial da ${context.company!.nome} é ${formatPhone(phone)}. Você também pode usar o botão de ligação no chat.`
      : 'O telefone oficial da imobiliária ainda não está cadastrado neste atendimento. Não tenho um número confirmado para informar.';
  }
  if (frustrated(text))
    return context.catalogState === 'restricted'
      ? 'Vou considerar os critérios que você já informou. O catálogo é privado e exige uma conta vinculada à imobiliária para consultar as opções.'
      : 'Vou considerar os critérios que você já informou, sem pedir tudo novamente. Podemos seguir com sua busca ou esclarecer uma dúvida específica.';
  if (
    /caro|fora do (?:meu )?orcamento|nao (?:consigo|posso) pagar/.test(text) &&
    !factualQuestion(text)
  )
    return `${q.orcamentoMax ? 'Vou manter o limite que você informou.' : 'Podemos respeitar um limite confortável para você.'} Podemos comparar opções mais econômicas, sem prometer descontos.${question ? ' ' + question : ''}`;
  if (
    context.catalogState === 'restricted' &&
    searchQuestion(text) &&
    !factualQuestion(text)
  )
    return 'Posso esclarecer suas dúvidas por aqui. Para consultar imóveis privados, entre em uma conta vinculada à imobiliária. Isso mantém cada catálogo separado.';
  if (context.catalogState === 'unavailable' && !factualQuestion(text))
    return 'Não consegui consultar os imóveis agora. A consulta está temporariamente indisponível; isso não significa que a imobiliária esteja sem opções.';
  if (q.objetivo === 'alugar' && !factualQuestion(text))
    return 'Posso ajudar com a busca por locação. O catálogo atual não informa preços de aluguel; a equipe da imobiliária precisa confirmar as opções e os valores.';
  if (
    q.visitaSolicitada &&
    q.imovelInteresseId &&
    q.visitaPreferencia &&
    question
  )
    return `Para o corretor acompanhar sua solicitação, vamos completar o contato. ${question}`;
  if (q.visitaSolicitada)
    return `A visita ainda depende da confirmação do corretor.${!q.imovelInteresseId && !properties.length ? ' Precisamos identificar um imóvel disponível antes de encaminhar o pedido.' : ''}${question ? ' ' + question : ''}`;
  if (wantsContact(text) || (q.contatoSolicitado && !factualQuestion(text)))
    return question
      ? `Posso preparar o atendimento com um corretor da sua imobiliária. ${question}`
      : 'Os dados necessários para o retorno estão completos. Você pode continuar esclarecendo suas dúvidas por aqui.';
  if (
    factualQuestion(text) ||
    /caro|medo|insegur|vantag|desvantag|nao sei|duvida/.test(text)
  )
    return null;
  if (properties.length)
    return `Encontrei ${properties.length} ${properties.length === 1 ? 'imóvel compatível' : 'imóveis compatíveis'} no catálogo da sua imobiliária. Veja os detalhes nos cartões abaixo.${question ? ' ' + question : ''}`;
  if (
    context.catalogState === 'available' &&
    q.tipoImovel &&
    q.orcamentoMax !== null &&
    q.bairro
  )
    return (
      'Não encontrei um imóvel que atenda a todos esses critérios no catálogo atual. ' +
      (question ?? 'Podemos ajustar a busca quando você quiser.')
    );
  return question
    ? `Vamos focar no que falta para encontrar uma opção. ${question}`
    : null;
}

export function directedReply(
  reply: string,
  messages: ConversationMessage[],
  q: Qualification,
  properties: AssistantProperty[],
  context: AssistantContext,
): string {
  const text = messages.at(-1)?.text ?? '';
  const grounded = groundedReply(
    reply,
    q,
    properties,
    context.catalogState === 'available',
    text,
  );
  // A pergunta é escolhida pelo estado do atendimento, não pelo impulso do modelo de listar campos.
  const withoutQuestions = (value: string) =>
    value
      .split(/(?<=[.!?])\s+|\n+/)
      .filter((sentence) => !sentence.includes('?'))
      .filter((sentence) => {
        const phones =
          sentence.match(
            /(?:\+\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}\b/g,
          ) ?? [];
        return phones.every(
          (phone) =>
            phoneLink(phone) === phoneLink(context.company?.telefone ?? ''),
        );
      })
      .join(' ')
      .trim();
  const answer = withoutQuestions(grounded);
  const question = nextQuestion(messages, q, properties, context);
  return conciseReply(
    [
      answer ||
        withoutQuestions(
          directAnswer(messages, q, properties, context) ?? '',
        ) ||
        'Posso continuar ajudando com sua busca.',
      question,
    ]
      .filter(Boolean)
      .join('\n\n'),
    80,
  );
}

export function turnSuggestions(
  messages: ConversationMessage[],
  q: Qualification,
  properties: AssistantProperty[],
  context: AssistantContext,
): string[] {
  const text = latest(messages);
  if (closing(text)) return [];
  if (context.catalogState !== 'available')
    return ['Como funciona o financiamento?', 'Como escolher um imóvel?'];
  if (!q.objetivo) return ['Quero comprar', 'Quero alugar', 'Quero anunciar'];
  if (!q.tipoImovel) return ['Procuro casa', 'Procuro apartamento'];
  if (properties.length)
    return ['Quero falar com um corretor', 'Quero ajustar minha busca'];
  if (q.bairro)
    return ['Posso ver outros bairros', 'Quero falar com um corretor'];
  return [];
}
