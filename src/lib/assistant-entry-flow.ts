import type { Qualification } from '../types/assistant';
import { normalize } from './assistant-qualification';

export const asksForCatalog = (value: string) =>
  /(?:quais?|que)\s+(?:imoveis|casas|apartamentos|opcoes)|(?:mostr|ver|list|consult).{0,25}(?:imoveis|casas|apartamentos|catalogo|opcoes)|(?:imoveis|casas|apartamentos).{0,25}(?:voces|vc|tem|disponiv)|(?:voces?|vc).{0,15}(?:tem|oferec).{0,20}(?:imoveis|casas|opcoes)/.test(
    normalize(value),
  );

// A entrada genérica organiza a busca, mas não escolhe uma empresa por conta própria.
// Cada etapa oferece uma ação possível sem alegar consulta ou encaminhamento inexistentes.
export function entryFlow(
  q: Qualification,
  latestMessage: string,
  needsAgency = false,
  previousQuestion = '',
) {
  const last = normalize(latestMessage);
  if (
    /link publico/.test(normalize(previousQuestion)) &&
    /^(?:sim|tenho|tenho sim|claro)[.!\s]*$/.test(last)
  )
    return {
      statement:
        'Ótimo! Cole o endereço aqui para eu verificar o atendimento correto.',
      question: 'Qual é o link público da imobiliária?',
      suggestions: [],
    };
  if (
    /nao (?:tenho|sei|recebi|conheco).{0,25}link|sem.{0,12}link/.test(last) ||
    (/link publico/.test(normalize(previousQuestion)) &&
      /^nao[.!\s]*$/.test(last))
  )
    return {
      statement:
        'Peça à imobiliária o link de atendimento dela para ver imóveis e preços confirmados. Enquanto isso, posso ajudar a organizar sua escolha.',
      question:
        'Você prefere comparar tipos de imóvel ou entender como funciona o financiamento?',
      suggestions: [
        'Compare casa e apartamento',
        'Como funciona o financiamento?',
      ],
    };
  if (
    needsAgency ||
    q.contatoSolicitado ||
    q.visitaSolicitada ||
    (q.tipoImovel &&
      (q.bairro || q.semPreferenciaBairro) &&
      (q.orcamentoMax !== null ||
        q.orcamentoNaoDefinido ||
        q.objetivo === 'alugar' ||
        q.objetivo === 'vender'))
  )
    return {
      statement:
        'Para mostrar ofertas e o contato certo, preciso identificar a imobiliária. Abra o link de atendimento que ela compartilhou; sua busca continua por lá, sem login de corretor.',
      question: 'Você tem o link público de atendimento da imobiliária?',
      suggestions: ['Não tenho esse link', 'Como funciona o financiamento?'],
    };
  if (!q.objetivo)
    return {
      statement: 'Vamos organizar sua busca, uma etapa por vez.',
      question: 'Você quer comprar, alugar ou anunciar um imóvel?',
      suggestions: ['Quero comprar', 'Quero alugar', 'Quero anunciar'],
    };
  if (!q.tipoImovel)
    return {
      statement:
        q.objetivo === 'vender'
          ? 'Posso ajudar a preparar o atendimento para anunciar seu imóvel.'
          : 'Vamos começar pelo tipo de imóvel que faz sentido para você.',
      question:
        q.objetivo === 'vender'
          ? 'Que tipo de imóvel você quer anunciar?'
          : 'Você procura casa, apartamento ou outro tipo de imóvel?',
      suggestions: ['Procuro casa', 'Procuro apartamento'],
    };
  if (
    q.objetivo !== 'alugar' &&
    q.objetivo !== 'vender' &&
    q.orcamentoMax === null &&
    !q.orcamentoNaoDefinido
  )
    return {
      statement: 'Vamos considerar um valor confortável para você.',
      question: 'Qual é o valor máximo que você pretende investir?',
      suggestions: [
        'Até 300 mil',
        'Até 500 mil',
        'Ainda não defini meu orçamento',
      ],
    };
  if (!q.bairro && !q.semPreferenciaBairro)
    return {
      statement:
        q.orcamentoMax !== null
          ? `Vou respeitar seu teto de R$ ${q.orcamentoMax.toLocaleString('pt-BR')}.`
          : 'Podemos continuar sem um orçamento definido.',
      question:
        q.objetivo === 'vender'
          ? 'Em qual bairro fica o imóvel?'
          : 'Em qual bairro ou região você procura?',
      suggestions: ['Não tenho preferência de bairro'],
    };
  return {
    statement:
      'Sua busca já tem os critérios iniciais. Para conferir ofertas reais, precisamos do atendimento da imobiliária.',
    question: 'Você tem o link público de atendimento da imobiliária?',
    suggestions: ['Não tenho esse link'],
  };
}
