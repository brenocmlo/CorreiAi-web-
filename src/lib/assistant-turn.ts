import type {
  AssistantContext,
  AssistantProperty,
  ConversationMessage,
  Qualification,
} from '../types/assistant';
import { normalize, parseMoney } from './assistant-qualification';
import {
  inspectAssistantMessage,
  messagePolicyReply,
} from './assistant-message-policy';
import { conciseReply, groundedReply } from './assistant-prompt';
import { formatPhone, phoneDigits, phoneLink } from './phone';
import { assistantRestriction } from './assistant-restriction';

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
export const propertyQuestion = (value: string) => {
  const text = normalize(value);
  return (
  /valor|preco|quartos|vagas|metragem|endereco|bairro|area/.test(text) &&
  /\?|^(?:qual|quais|quanto|quantos|quantas|onde)/.test(text) &&
  !/condominio|iptu|financi|parcela|entrada|taxa/.test(text)
  );
};

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
  if (factualQuestion(text) && !wantsContact(text))
    return propertyQuestion(text) &&
      properties.length > 1 &&
      !q.imovelInteresseId
      ? 'Sobre qual dos imóveis abaixo você quer saber?'
      : null;
  if (
    context.catalogState === 'available' &&
    context.catalogCount === 0 &&
    !wantsContact(text) &&
    !q.contatoSolicitado
  )
    return null;
  if (
    context.catalogTypes &&
    q.tipoImovel &&
    !context.catalogTypes.some(
      (type) => normalize(type) === normalize(q.tipoImovel!),
    ) &&
    !wantsContact(text) &&
    !q.contatoSolicitado
  )
    return 'Você gostaria de ver outro tipo de imóvel ou prefere falar com um corretor?';
  if (/caro|fora do (?:meu )?orcamento|nao (?:consigo|posso) pagar/.test(text))
    return 'Você prefere reduzir o valor buscando outra localização ou menos espaço?';
  if (/nao sei|indecis|estou perdid/.test(text))
    return 'O que mais importa na sua rotina para escolher o imóvel?';
  if (
    context.catalogState !== 'available' &&
    (q.objetivo ||
      q.tipoImovel ||
      q.orcamentoMax ||
      q.bairro ||
      q.visitaSolicitada ||
      q.contatoSolicitado ||
      wantsContact(text))
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
  if (!q.bairro && q.tipoImovel && !properties.length)
    return 'Você consideraria outro tipo de imóvel dentro desse valor?';
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
  if (
    context.catalogState === 'restricted' &&
    (phoneQuestion(text) ||
      (searchQuestion(text) && !factualQuestion(text)) ||
      (!factualQuestion(text) &&
        !frustrated(text) &&
        (q.objetivo ||
          q.tipoImovel ||
          q.orcamentoMax ||
          q.bairro ||
          q.visitaSolicitada ||
          wantsContact(text))))
  )
    return assistantRestriction(context.restrictionReason).message;
  if (phoneQuestion(text)) {
    const phone = phoneDigits(context.company?.telefone);
    return phone
      ? `O telefone oficial da ${context.company!.nome} é ${formatPhone(phone)}. Você também pode usar o botão de ligação no chat.`
      : 'O telefone oficial da imobiliária ainda não está cadastrado neste atendimento. Não tenho um número confirmado para informar.';
  }
  if (frustrated(text))
    return context.catalogState === 'restricted'
      ? `Vou considerar os critérios que você já informou. ${assistantRestriction(context.restrictionReason).message}`
      : 'Vou considerar os critérios que você já informou, sem pedir tudo novamente. Podemos seguir com sua busca ou esclarecer uma dúvida específica.';
  if (context.catalogState === 'available' && propertyQuestion(text)) {
    const property =
      properties.find((p) => p.id === q.imovelInteresseId) ??
      (properties.length === 1 ? properties[0] : null);
    if (!property)
      return properties.length
        ? `Os cartões mostram os preços e detalhes confirmados das opções.${question ? ' ' + question : ''}`
        : 'Não tenho um imóvel selecionado com essas informações na busca atual. Podemos ajustar a busca ou consultar a equipe da imobiliária.';
    if (/preco|valor/.test(text))
      return `O valor cadastrado para este imóvel é ${property.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.${q.orcamentoMax !== null && property.valor > q.orcamentoMax ? ' Esse valor está acima do limite que você informou; vou manter seu orçamento na busca.' : ' Você pode conferir os demais detalhes no cartão.'}`;
    if (/endereco/.test(text))
      return `O endereço cadastrado é ${property.endereco}, no bairro ${property.bairro}.`;
    if (/bairro/.test(text))
      return `Este imóvel fica no bairro ${property.bairro}. O endereço cadastrado é ${property.endereco}.`;
    const field = /quartos/.test(text)
      ? { value: property.quartos, label: 'quartos' }
      : /vagas/.test(text)
        ? { value: property.vagas, label: 'vagas' }
        : { value: property.metragem, label: 'metragem em m²' };
    return field.value == null
      ? `O cadastro não informa ${field.label} deste imóvel. A equipe precisa confirmar esse detalhe.`
      : `No cadastro deste imóvel constam ${field.value} ${field.label}.`;
  }
  if (
    context.catalogState === 'available' &&
    context.catalogCount === 0 &&
    !factualQuestion(text) &&
    !wantsContact(text) &&
    !q.contatoSolicitado
  )
    return 'No momento, a imobiliária está sem imóveis disponíveis no catálogo. Posso ajudar a definir sua busca ou preparar o atendimento com a equipe para acompanhar novas opções.';
  if (
    context.catalogState === 'available' &&
    context.catalogTypes &&
    q.tipoImovel &&
    !context.catalogTypes.some(
      (type) => normalize(type) === normalize(q.tipoImovel!),
    ) &&
    !factualQuestion(text) &&
    !wantsContact(text) &&
    !q.contatoSolicitado
  )
    return `Não encontrei ${q.tipoImovel.toLowerCase()} disponível no catálogo desta imobiliária no momento.${question ? ' ' + question : ''}`;
  if (
    /caro|fora do (?:meu )?orcamento|nao (?:consigo|posso) pagar/.test(text) &&
    !factualQuestion(text)
  )
    return `${q.orcamentoMax ? 'Vou manter o limite que você informou.' : 'Podemos respeitar um limite confortável para você.'} Podemos comparar opções mais econômicas, sem prometer descontos.${question ? ' ' + question : ''}`;
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
    q.orcamentoMax !== null
  )
    return (
      `Não encontrei ${q.tipoImovel.toLowerCase()} até ${q.orcamentoMax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}${q.bairro ? ` em ${q.bairro}` : ''} no catálogo atual. Vou manter seu limite. ` +
      (question ?? 'Podemos ajustar a busca quando você quiser.')
    );
  return question;
}

export function directedReply(
  reply: string,
  messages: ConversationMessage[],
  q: Qualification,
  properties: AssistantProperty[],
  context: AssistantContext,
): string {
  const unsafeOutput = inspectAssistantMessage(reply);
  if (unsafeOutput === 'technical') return messagePolicyReply('technical');
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
        const amounts =
          sentence.match(/r\$\s*\d[\d.,]*(?:\s*(?:milhao|milhoes|mil))?/gi) ??
          [];
        return amounts.every((amount) => {
          const value = parseMoney(amount.replace(/[.,]+$/, ''));
          return (
            properties.some((p) => p.valor === value) ||
            (value === q.orcamentoMax &&
              /orcamento|teto|limite|investir|nao encontrei.{0,80}ate/.test(
                normalize(sentence),
              ))
          );
        });
      })
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
        (properties.length
          ? 'Os valores confirmados estão nos cartões. Outros custos precisam ser confirmados pela equipe.'
          : 'Posso continuar ajudando com sua busca.'),
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
  if (context.catalogCount === 0) return ['Quero falar com um corretor'];
  if(q.tipoImovel&&context.catalogTypes&&!context.catalogTypes.some(type=>normalize(type)===normalize(q.tipoImovel!)))
    return [...context.catalogTypes.slice(0,2).map(type=>`Quero ver ${type}`),'Quero falar com um corretor'];
  if (!q.objetivo) return ['Quero comprar', 'Quero alugar', 'Quero anunciar'];
  if (!q.tipoImovel) return ['Procuro casa', 'Procuro apartamento'];
  if (properties.length)
    return ['Quero falar com um corretor', 'Quero ajustar minha busca'];
  if (q.bairro)
    return ['Posso ver outros bairros', 'Quero falar com um corretor'];
  if(q.tipoImovel&&q.orcamentoMax!==null)return ['Quero falar com um corretor'];
  return [];
}
