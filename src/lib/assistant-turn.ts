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
import { asksForCatalog, entryFlow } from './assistant-entry-flow';
import { DEMO_AGENCIES } from './assistant-demo';

const latest = (messages: ConversationMessage[]) =>
  normalize(messages.at(-1)?.text ?? '');
const previousQuestion = (messages: ConversationMessage[]) =>
  messages.findLast((message) => message.role === 'assistant')?.text ?? '';
const demoBusinessQuestion = (messages: ConversationMessage[]) =>
  /funil|kanban|correai|correi.?ai|crm|plataforma|sistema|planos|mensalidade/.test(
    latest(messages),
  ) ||
  (/^sim[.!\s]*$/.test(latest(messages)) &&
    /funil/.test(normalize(previousQuestion(messages))));
const asksForAgencies = (text: string) =>
  /(?:quais|outras|mostrar|ver|trocar).{0,25}imobiliarias|qual.{0,15}imobiliaria/.test(
    text,
  );
const adjustmentQuestion = (text: string) =>
  /(?:mudar|alterar).{0,15}tipo/.test(text)
    ? 'Que tipo de imóvel você prefere agora?'
    : /(?:mudar|alterar).{0,15}(?:orcamento|valor)/.test(text) &&
        !/\d/.test(text)
      ? 'Qual é o novo valor máximo que você quer considerar?'
      : /(?:mudar|alterar).{0,15}(?:bairro|localizacao)/.test(text)
        ? 'Em qual bairro ou região você quer buscar agora?'
        : null;
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
  !asksForCatalog(text) &&
  (/como funciona|financiamento|documentacao|documentos|diferenca|compare|tem elevador|aceita pet|condominio|barulho|ruido|silencio|iptu|qual.{0,15}(?:valor|preco|metragem)|quantos quartos/.test(
    text,
  ) ||
    (!searchQuestion(text) &&
      /\?|^(?:como |qual |quanto |tem |aceita |possui |por que )/.test(text)));
const phoneQuestion = (text: string) =>
  /(?:telefone|whatsapp|numero|contato).{0,25}(?:imobiliaria|corretora|empresa)|(?:imobiliaria|corretora|empresa).{0,25}(?:telefone|whatsapp|numero|contato)/.test(
    text,
  );
export const propertyQuestion = (value: string) => {
  const text = normalize(value);
  return (
    /valor|preco|quartos|vagas|metragem|endereco|bairro|area|detalhes|descricao/.test(
      text,
    ) &&
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
    !q.permiteContato ||
    /(?:nao.{0,15}(?:quero|mais).{0,15}pergunt|pare de perguntar)/.test(text)
  )
    return null;
  if (/ajustar.{0,15}busca|refazer.{0,15}busca/.test(text))
    return 'O que você quer mudar: tipo de imóvel, valor ou localização?';
  if (adjustmentQuestion(text)) return adjustmentQuestion(text);
  if (context.mode === 'demo') {
    if (demoBusinessQuestion(messages))
      return 'Quer continuar uma busca de imóvel ou testar outra imobiliária de exemplo?';
    if (asksForAgencies(text))
      return 'Qual imobiliária de exemplo você quer testar?';
    if (wantsContact(text) || q.contatoSolicitado || q.visitaSolicitada)
      return 'Quer ver como esse pedido apareceria no funil?';
  }
  if (
    context.catalogState === 'restricted' &&
    context.restrictionReason !== 'admin_only' &&
    (asksForCatalog(text) || phoneQuestion(text) || wantsContact(text))
  )
    return entryFlow(q, text, true, previousQuestion(messages)).question;
  if (phoneQuestion(text)) return null;
  if (
    /medo|insegur|preocup|pesad/.test(text) &&
    /parcela|financi|entrada|renda/.test(text)
  )
    return 'Você prefere comparar imóveis de menor valor ou entender melhor o financiamento?';
  if (
    factualQuestion(text) &&
    /financiamento|entrada|parcelas?|juros/.test(text)
  )
    return properties.length
      ? 'Quer comparar imóveis de menor valor dentro do seu limite?'
      : 'Quer seguir com a busca de um imóvel ou esclarecer outra dúvida?';
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
    return 'Posso preparar seu atendimento com a equipe para acompanhar novas opções?';
  if (
    context.catalogTypes &&
    q.objetivo !== 'alugar' &&
    q.objetivo !== 'vender' &&
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
  if (/^(?:ainda )?nao sei[.!\s]*$|indecis|estou perdid/.test(text))
    return 'O que mais importa na sua rotina para escolher o imóvel?';
  if (context.catalogState === 'restricted')
    return context.restrictionReason === 'admin_only'
      ? null
      : entryFlow(q, text, false, previousQuestion(messages)).question;
  if (context.catalogState === 'unavailable')
    return 'Quer tentar consultar os imóveis novamente?';
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
  if (q.objetivo === 'vender' || q.objetivo === 'alugar')
    return !q.tipoImovel
      ? q.objetivo === 'vender'
        ? 'Que tipo de imóvel você quer anunciar?'
        : 'Você procura casa, apartamento ou outro tipo de imóvel para alugar?'
      : !q.bairro && !q.semPreferenciaBairro
        ? q.objetivo === 'vender'
          ? 'Em qual bairro fica o imóvel?'
          : 'Em qual bairro ou região você procura?'
        : 'Posso preparar seu atendimento com um corretor para verificar as condições?';
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
  if (/ajustar.{0,15}busca|refazer.{0,15}busca/.test(text))
    return 'Podemos alterar só o que você preferir, aproveitando os outros critérios que já informou.';
  if (adjustmentQuestion(text))
    return 'Vamos atualizar esse critério e manter os demais.';
  if (context.mode === 'demo') {
    if (demoBusinessQuestion(messages))
      return /preco|custa|plano|mensalidade/.test(text)
        ? 'Esta demonstração mostra o funcionamento do CorreAI. Os valores dos planos não estão definidos aqui, então não vou inventar uma mensalidade.'
        : 'O CorreAI reúne catálogo por imobiliária, atendimento com IA e funil Kanban. No sistema real, o contato autorizado vira um lead com critérios e histórico; a equipe acompanha e confirma visitas. Nesta demonstração, nada é enviado a um corretor real.';
    if (asksForAgencies(text))
      return `Você pode experimentar ${DEMO_AGENCIES.map((agency) => `${agency.nome}, em ${agency.cidade}`).join(' ou ')}. São empresas fictícias, cada uma com seu próprio catálogo. Use o seletor acima ou escreva o nome.`;
    if (phoneQuestion(text))
      return 'Esta imobiliária é fictícia e não tem telefone de atendimento real. No sistema de cada empresa, a assistente mostra o contato comercial configurado por ela.';
    if (wantsContact(text) || q.contatoSolicitado || q.visitaSolicitada)
      return 'Este pedido faz parte da demonstração: não há cadastro de contato ou visita real. Na imobiliária, a IA prepararia o atendimento e o corretor confirmaria os próximos passos. Não precisa informar dados pessoais aqui.';
  }
  if (
    context.catalogState === 'restricted' &&
    (asksForCatalog(text) ||
      phoneQuestion(text) ||
      (searchQuestion(text) && !factualQuestion(text)) ||
      (!factualQuestion(text) && !frustrated(text)))
  )
    return context.restrictionReason === 'admin_only'
      ? assistantRestriction(context.restrictionReason).message
      : entryFlow(
          q,
          text,
          asksForCatalog(text) || phoneQuestion(text) || wantsContact(text),
          previousQuestion(messages),
        ).statement;
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
    if (/detalhes|descricao/.test(text))
      return `${property.tipo} em ${property.bairro}: ${property.descricao || 'O cadastro não informa descrição adicional.'} Os dados de tamanho, quartos e vagas estão no cartão.`;
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
    return 'No momento, a imobiliária está sem imóveis disponíveis no catálogo. Podemos organizar sua busca para a equipe acompanhar novas opções.';
  if (
    context.catalogState === 'available' &&
    context.catalogTypes &&
    q.objetivo !== 'alugar' &&
    q.objetivo !== 'vender' &&
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
    return wantsContact(text) || q.contatoSolicitado
      ? `Vamos preparar o retorno da equipe sobre a locação.${question ? ' ' + question : ''}`
      : q.tipoImovel && (q.bairro || q.semPreferenciaBairro)
        ? 'A equipe precisa confirmar as opções e os valores de aluguel para sua busca.'
        : 'Vamos organizar sua busca por locação.';
  if (
    q.objetivo === 'vender' &&
    !factualQuestion(text) &&
    !wantsContact(text) &&
    !q.contatoSolicitado
  )
    return 'Posso ajudar a preparar as informações do imóvel para o corretor avaliar o anúncio. A publicação e as condições dependem da equipe.';
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
  if (properties.length) {
    const budget = q.orcamentoMax !== null ? ' dentro do seu limite' : '';
    const scope =
      context.mode === 'demo' ? 'deste catálogo de exemplo' : 'da imobiliária';
    return `Separei ${properties.length} ${properties.length === 1 ? 'opção' : 'opções'}${budget}${q.bairro ? ` em ${q.bairro}` : ''} ${scope}. Você pode comparar preço, localização e tamanho nos cartões.${question ? ' ' + question : ''}`;
  }
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
  if (/ajustar.{0,15}busca|refazer.{0,15}busca/.test(text))
    return [
      'Quero mudar o tipo de imóvel',
      'Quero mudar o orçamento',
      'Quero mudar a localização',
    ];
  if (
    context.mode === 'demo' &&
    (asksForAgencies(text) || demoBusinessQuestion(messages))
  )
    return ['Ver imobiliária Horizonte', 'Ver imobiliária Litoral'];
  if (context.mode === 'demo' && (q.contatoSolicitado || q.visitaSolicitada))
    return ['Como funciona o funil?', 'Quero ajustar minha busca'];
  if (context.catalogState === 'restricted')
    return entryFlow(
      q,
      text,
      asksForCatalog(text) || phoneQuestion(text) || wantsContact(text),
      previousQuestion(messages),
    ).suggestions;
  if (context.catalogState !== 'available')
    return ['Como funciona o financiamento?', 'Como escolher um imóvel?'];
  if (context.catalogCount === 0) return ['Quero falar com um corretor'];
  if (
    q.objetivo !== 'alugar' &&
    q.objetivo !== 'vender' &&
    q.tipoImovel &&
    context.catalogTypes &&
    !context.catalogTypes.some(
      (type) => normalize(type) === normalize(q.tipoImovel!),
    )
  )
    return [
      ...context.catalogTypes.slice(0, 2).map((type) => `Quero ver ${type}`),
      'Quero falar com um corretor',
    ];
  if (!q.objetivo) return ['Quero comprar', 'Quero alugar', 'Quero anunciar'];
  if (!q.tipoImovel) return ['Procuro casa', 'Procuro apartamento'];
  if (q.objetivo === 'alugar' || q.objetivo === 'vender')
    return !q.bairro && !q.semPreferenciaBairro
      ? q.objetivo === 'alugar'
        ? ['Não tenho preferência de bairro']
        : []
      : ['Quero falar com um corretor'];
  if (properties.length)
    return ['Quero falar com um corretor', 'Quero ajustar minha busca'];
  if (q.bairro)
    return ['Posso ver outros bairros', 'Quero falar com um corretor'];
  if (q.tipoImovel && q.orcamentoMax !== null)
    return ['Quero falar com um corretor'];
  return [];
}
