import test from 'node:test';
import assert from 'node:assert/strict';
import { qualificationFrom } from '../src/lib/assistant-qualification.ts';
import {
  directAnswer,
  directedReply,
  nextQuestion,
} from '../src/lib/assistant-turn.ts';
const user = (text) => ({ role: 'user', text });
const bot = (text) => ({ role: 'assistant', text });
const house = {
  id: '11111111-1111-4111-8111-111111111111',
  tipo: 'casa',
  endereco: 'Rua das Flores, 10',
  bairro: 'Centro',
  valor: 280000,
  quartos: 2,
  vagas: 1,
  status: 'disponivel',
};
const context = {
  catalogState: 'available',
  company: { nome: 'Imobiliária Exemplo', telefone: '85999990000' },
};

test('saudação faz apenas uma pergunta curta, sem pedir dados pessoais', () => {
  const messages = [user('Oi')],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [], context);
  assert.equal((reply.match(/\?/g) || []).length, 1);
  assert.doesNotMatch(reply, /telefone|e-mail|prazo|forma de pagamento/i);
});
test('qualificação entende bairro e nome sem depender de uma chamada extra de IA', () => {
  const q = qualificationFrom([
    user(
      'Sou Ana Silva. Quero comprar uma casa no bairro Centro até 300 mil, com dois quartos.',
    ),
  ]);
  assert.equal(q.nome, 'Ana Silva');
  assert.equal(q.bairro, 'Centro');
  assert.equal(q.orcamentoMax, 300000);
  assert.equal(q.quartosMin, 2);
});
test('resposta curta ao nome e bairro usa a pergunta anterior', () => {
  const q = qualificationFrom([
    bot('Como você prefere ser chamado?'),
    user('Ana Silva'),
    bot('Em qual bairro você procura?'),
    user('Vila Nova'),
  ]);
  assert.equal(q.nome, 'Ana Silva');
  assert.equal(q.bairro, 'Vila Nova');
});
test('orçamento e data não são confundidos com telefone', () => {
  assert.equal(
    qualificationFrom([user('Tenho 1000000000 reais para investir')]).telefone,
    null,
  );
  assert.equal(
    qualificationFrom([user('Visita em 2026-10-29 às 15:00')]).telefone,
    null,
  );
  assert.equal(
    qualificationFrom([
      bot('Qual é seu telefone para retorno?'),
      user('(85) 99999-0000'),
    ]).telefone,
    '85999990000',
  );
});
test('quando já há opções, a IA mostra o resultado sem continuar interrogando', () => {
  const messages = [user('Quero comprar casa no Centro até 300 mil')],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [house], context);
  assert.match(reply, /1.*(?:imóvel|opção)/i);
  assert.doesNotMatch(
    reply,
    /prazo|financia|nome|telefone|email|quantos quartos/i,
  );
});
test('resposta do modelo com várias perguntas é reduzida à próxima ação relevante', () => {
  const messages = [user('Quero comprar uma casa')],
    q = qualificationFrom(messages);
  const reply = directedReply(
    'Posso ajudar. Qual seu bairro? Qual seu orçamento? Quantos quartos? Qual seu nome?',
    messages,
    q,
    [],
    context,
  );
  assert.equal((reply.match(/\?/g) || []).length, 1);
  assert.equal(reply.endsWith(nextQuestion(messages, q, [], context)), true);
});
test('telefone vem só do contato oficial da empresa resolvida pelo servidor', () => {
  const messages = [user('Qual o WhatsApp da imobiliária?')],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [house], context);
  assert.match(reply, /\(85\) 99999-0000/);
  assert.doesNotMatch(reply, /\?/);
  const missing = directAnswer(messages, q, [], {
    ...context,
    company: { nome: 'Outra', telefone: null },
  });
  assert.match(missing, /não.*cadastrad/i);
  assert.doesNotMatch(missing, /99999/);
});
test('catálogo restrito não é apresentado como catálogo vazio', () => {
  const messages = [user('Mostre casas no Centro até 300 mil')],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [], {
    catalogState: 'restricted',
    company: null,
  });
  assert.match(reply, /vinculad|login|conta/i);
  assert.doesNotMatch(reply, /Não encontrei|não há imóveis/i);
});
test('falha de consulta não é apresentada como ausência de imóveis', () => {
  const messages = [user('Tem uma casa até 300 mil?')],
    q = qualificationFrom(messages);
  assert.match(
    directAnswer(messages, q, [], { ...context, catalogState: 'unavailable' }),
    /consultar.*agora|consulta.*indisponível/i,
  );
});
test('dúvida informativa não dispara nova rodada de triagem', () => {
  const messages = [user('Como funciona financiamento?')],
    q = qualificationFrom(messages);
  assert.match(nextQuestion(messages, q, [], context), /busca|dúvida/i);
  const reply = directedReply(
    'O banco avalia renda e documentação. A aprovação depende da análise. Qual seu orçamento? E o bairro?',
    messages,
    q,
    [],
    context,
  );
  assert.match(reply, /banco/);
  assert.equal((reply.match(/\?/g) || []).length, 1);
  assert.doesNotMatch(reply, /qual.{0,20}(?:orçamento|bairro|telefone)/i);
});
test('contato é pedido um campo por vez e só após intenção de falar com corretor', () => {
  const messages = [user('Quero falar com um corretor. Sou Ana Silva.')],
    q = qualificationFrom(messages);
  const question = nextQuestion(messages, q, [house], context);
  assert.match(question, /telefone|WhatsApp/i);
  assert.doesNotMatch(question, /nome|email|e-mail/i);
});
test('recusa e encerramento não recebem novas perguntas nem insistência', () => {
  for (const text of [
    'Não quero passar meus dados.',
    'Obrigado, vou pensar.',
  ]) {
    const messages = [user(text)],
      q = qualificationFrom(messages);
    assert.equal(nextQuestion(messages, q, [house], context), null);
    assert.doesNotMatch(
      directedReply(
        'Qual seu nome? Qual seu telefone?',
        messages,
        q,
        [house],
        context,
      ),
      /\?/,
    );
  }
});
test('locação não transforma preço de venda em aluguel', () => {
  const messages = [user('Quero alugar uma casa até 2000')],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [], context);
  assert.match(reply, /aluguel|locação/i);
  assert.doesNotMatch(reply, /280\.000|visita.*confirmada/i);
});

test('resposta composta apenas por perguntas recebe uma única pergunta útil', () => {
  const messages = [user('Quero comprar uma casa')],
    q = qualificationFrom(messages);
  const reply = directedReply(
    'Qual seu bairro? Qual seu nome?',
    messages,
    q,
    [],
    context,
  );
  assert.equal((reply.match(/\?/g) || []).length, 1);
});

test('objeção recebe uma pergunta contextual sem reiniciar triagem', () => {
  const messages = [
      user('Quero uma casa até 300 mil no Centro'),
      user('Achei caro'),
    ],
    q = qualificationFrom(messages);
  assert.match(
    nextQuestion(messages, q, [house], context),
    /reduzir|localização|espaço/i,
  );
  assert.doesNotMatch(
    nextQuestion(messages, q, [house], context),
    /qual dessas|nome|telefone/i,
  );
});

test('medo de parcela em pergunta aberta mantém próximo passo mesmo com resposta longa do modelo', () => {
  const messages = [
    user('Quero uma casa até 500 mil'),
    bot('Qual opção você quer conhecer?'),
    user(
      'Gostei, mas tenho medo de a parcela ficar pesada. Como avaliar isso?',
    ),
  ];
  const q = qualificationFrom(messages);
  const answer =
    'Entendo sua preocupação. O banco analisa sua renda, documentação e condições do financiamento. As condições variam conforme a instituição e seu perfil. '.repeat(
      6,
    );
  const reply = directedReply(answer, messages, q, [house], context);
  assert.equal((reply.match(/\?/g) || []).length, 1);
  assert.match(reply, /menor valor|financiamento.*\?$/i);
  assert.ok(reply.trim().split(/\s+/).length <= 80);
  assert.doesNotMatch(reply, /qual.{0,20}(?:nome|telefone|bairro|orcamento)/i);
});

test('dúvida de financiamento oferece continuidade sem pedir conta nem vários dados', () => {
  const messages = [user('Como funciona o financiamento?')],
    q = qualificationFrom(messages);
  const reply = directedReply(
    'O banco analisa a proposta e os documentos. A aprovação depende da análise.',
    messages,
    q,
    [],
    context,
  );
  assert.equal((reply.match(/\?/g) || []).length, 1);
  assert.match(reply, /busca|dúvida/i);
});

test('modelo não pode inventar telefone em uma resposta espontânea', () => {
  const messages = [user('Como funciona o financiamento?')],
    q = qualificationFrom(messages);
  const reply = directedReply(
    'O banco analisa a renda. Ligue para (11) 98888-7777 para aprovação garantida.',
    messages,
    q,
    [],
    context,
  );
  assert.doesNotMatch(reply, /98888|7777|garantida/);
  assert.match(reply, /renda/);
});

test('pedido de corretor continua um campo por vez nas respostas seguintes', () => {
  const messages = [
    user('Quero falar com um corretor'),
    bot('Como você prefere ser chamado?'),
    user('Ana Silva'),
  ];
  let q = qualificationFrom(messages);
  assert.equal(q.contatoSolicitado, true);
  assert.match(nextQuestion(messages, q, [house], context), /telefone/);
  messages.push(
    bot('Qual é seu telefone com DDD para retorno do corretor?'),
    user('85999990000'),
  );
  q = qualificationFrom(messages);
  assert.match(nextQuestion(messages, q, [house], context), /e-mail/);
});

test('preferência de visita responde à pergunta anterior sem nova extração', () => {
  const messages = [
    user('Quero visitar'),
    bot('Qual dia e período você prefere para a visita?'),
    user('Sábado à tarde'),
  ];
  const q = qualificationFrom(messages);
  assert.equal(q.visitaPreferencia, 'Sábado à tarde');
  assert.equal(q.visitaSolicitada, true);
});

test('ruído e IPTU ausentes no cadastro não recebem garantias do modelo', () => {
  const messages = [user('Essa casa é silenciosa e qual o IPTU?')],
    q = qualificationFrom(messages);
  const reply = directedReply(
    'A casa é silenciosa. O IPTU custa R$ 800.',
    messages,
    q,
    [house],
    context,
  );
  assert.match(reply, /não informa.*ruído.*IPTU/i);
  assert.doesNotMatch(reply, /R\$ 800|casa é silenciosa/);
});

test('frustração com histórico privado não vira catálogo vazio', () => {
  const messages = [
    user('Quero comprar casa no Centro até 300 mil'),
    user('Já disse o bairro e orçamento. Não quero repetir perguntas.'),
  ];
  const q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [], {
    catalogState: 'restricted',
    company: null,
  });
  assert.doesNotMatch(reply, /Não encontrei|\?/i);
  assert.match(reply, /catálogo.*privado|vinculad/i);
});

test('objeção não sugere aumentar o orçamento', () => {
  const messages = [
      user('Quero comprar casa até 300 mil'),
      user('Achei caro, não quero aumentar meu orçamento'),
    ],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [house], context);
  assert.match(reply, /manter.*limite|respeitar.*limite/i);
  assert.equal((reply.match(/\?/g) || []).length, 1);
});

test('telefone brasileiro com código do país mantém o número oficial na resposta', () => {
  const messages = [user('Qual o telefone da imobiliária?')],
    q = qualificationFrom(messages),
    ctx = {
      ...context,
      company: { ...context.company, telefone: '5585999990000' },
    };
  const reply = directedReply(
    directAnswer(messages, q, [], ctx),
    messages,
    q,
    [],
    ctx,
  );
  assert.match(reply, /\(85\) 99999-0000/);
});

test('texto longo do modelo é limitado a 80 palavras completas no chat', () => {
  const messages = [user('Como funciona o financiamento?')],
    q = qualificationFrom(messages);
  const reply = directedReply(
    'A documentação depende da análise do banco. '.repeat(20),
    messages,
    q,
    [],
    context,
  );
  assert.ok(reply.trim().split(/\s+/).length <= 80);
  assert.match(reply, /[.?]$/);
});

test('respostas curtas de tipo e orçamento conduzem a busca sem exigir login de corretor', () => {
  const messages = [
    user('Quero comprar'),
    bot('Você procura casa ou apartamento?'),
    user('Casa'),
    bot('Qual seu orçamento máximo para a compra?'),
    user('500.000'),
  ];
  for (const size of [1, 3, 5]) {
    const history = messages.slice(0, size),
      q = qualificationFrom(history);
    const reply = directAnswer(history, q, [], {
      catalogState: 'restricted',
      company: null,
      restrictionReason: 'login_required',
    });
    assert.equal(typeof reply, 'string');
    assert.doesNotMatch(reply, /faça login|entre com uma conta/i);
    assert.equal(
      typeof nextQuestion(history, q, [], {
        catalogState: 'restricted',
        company: null,
      }),
      'string',
    );
  }
});

test('conta sem empresa recebe orientação de vínculo, sem pedido inútil de login', () => {
  const messages = [user('Mostre os valores dos imóveis')],
    q = qualificationFrom(messages);
  const reply = directAnswer(messages, q, [], {
    catalogState: 'restricted',
    company: null,
    restrictionReason: 'company_required',
  });
  assert.match(reply, /identificar a imobiliária|link.*atendimento/i);
  assert.doesNotMatch(reply, /entre em uma conta|faça login/i);
});
