import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { assistantFixture } from './helpers/assistant-fixture.mjs';
process.env.JWT_SECRET = 'isolated-guided-flow-secret-123456';
const { setServerSupabaseClientOverride } = await import(
  '../src/lib/supabase.ts'
);
const { POST } = await import('../src/app/api/assistente/route.ts');
const oldFetch = globalThis.fetch;
afterEach(() => {
  setServerSupabaseClientOverride(null);
  globalThis.fetch = oldFetch;
});
function setup(publicPage = false, empty = false) {
  const db = assistantFixture();
  Object.assign(db.state.imobiliarias[0], {
    public_slug: 'horizonte',
    atendimento_publico: true,
  });
  if (empty) db.state.imoveis = [];
  setServerSupabaseClientOverride(db);
  globalThis.fetch = async () => {
    throw new Error('Fluxo de triagem não deve depender do modelo');
  };
  const messages = [];
  return {
    db,
    async say(text) {
      messages.push({ role: 'user', text });
      const response = await POST(
        new NextRequest(
          'https://fixture.invalid/api/assistente' +
            (publicPage ? '?imobiliaria=horizonte' : ''),
          {
            method: 'POST',
            headers: {
              Origin: 'https://fixture.invalid',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
          },
        ),
      );
      assert.equal(response.status, 200, text);
      const data = await response.json();
      messages.push({ role: 'assistant', text: data.reply });
      assert.ok((data.reply.match(/\?/g) || []).length <= 1);
      return data;
    },
  };
}
test('compra sem empresa conduz tipo, orçamento, bairro e acesso ao link, sem inventar falha de consulta', async () => {
  const flow = setup();
  let data = await flow.say('Quero comprar');
  assert.match(data.reply, /casa.*apartamento.*\?/i);
  data = await flow.say('casa');
  assert.match(data.reply, /valor.*máximo|orçamento/i);
  assert.ok(data.reply.endsWith('?'));
  assert.ok(data.sugestoes.some((s) => /mil|orçamento/i.test(s)));
  data = await flow.say('500.000');
  assert.match(data.reply, /bairro.*\?/i);
  data = await flow.say('Centro');
  assert.match(data.reply, /link.*público.*\?/i);
  assert.deepEqual(data.imoveis, []);
  assert.equal(flow.db.state.leads.length, 0);
});
test('pergunta exata do visitante não vira indisponibilidade técnica ou promessa de retorno', async () => {
  const flow = setup();
  await flow.say('Quero comprar');
  await flow.say('casa');
  const data = await flow.say('quais imoveis vc tem');
  assert.match(data.reply, /link.*imobiliária/i);
  assert.ok(data.reply.endsWith('?'));
  assert.doesNotMatch(
    data.reply,
    /não consegui consultar|corretor verificará|encontrei|já encaminhei/i,
  );
  assert.deepEqual(data.imoveis, []);
});
test('orçamento indefinido e qualquer bairro avançam sem repetir perguntas já respondidas', async () => {
  const flow = setup();
  await flow.say('Quero comprar casa');
  let data = await flow.say('Ainda não defini meu orçamento');
  assert.match(data.reply, /bairro.*\?/i);
  assert.equal(data.qualificacao.orcamentoNaoDefinido, true);
  data = await flow.say('Não tenho preferência de bairro');
  assert.match(data.reply, /link.*público.*\?/i);
  assert.equal(data.qualificacao.semPreferenciaBairro, true);
  assert.doesNotMatch(data.reply, /qual.*(?:orçamento|bairro)/i);
});
test('aluguel e anúncio conduzem tipo e localização sem pedir investimento de compra', async () => {
  for (const goal of ['Quero alugar', 'Quero anunciar']) {
    const flow = setup();
    let data = await flow.say(goal);
    assert.match(data.reply, /tipo|casa|apartamento/i);
    data = await flow.say('casa');
    assert.match(data.reply, /bairro.*\?/i);
    assert.doesNotMatch(data.reply, /valor máximo|investir/i);
    data = await flow.say('Centro');
    assert.match(data.reply, /link.*público.*\?/i);
  }
});
test('sem link da imobiliária oferece ajuda possível e não promete encaminhamento', async () => {
  const flow = setup();
  await flow.say('Quais imóveis vocês têm?');
  const data = await flow.say('Não tenho esse link');
  assert.match(data.reply, /peça.*imobiliária|solicite.*imobiliária/i);
  assert.match(data.reply, /\?/);
  assert.doesNotMatch(data.reply, /enviei|encaminhei|verificará/i);
});
test('catálogo vazio conduz ao atendimento e sim continua a coleta de contato', async () => {
  const flow = setup(true, true);
  let data = await flow.say('Quero comprar casa até 500 mil');
  assert.match(data.reply, /sem imóveis|nenhum/i);
  assert.match(data.reply, /preparar.*atendimento.*\?/i);
  data = await flow.say('sim');
  assert.match(data.reply, /chamado|nome/i);
  assert.equal(data.qualificacao.contatoSolicitado, true);
});
test('pedido de telefone sem imobiliária identifica o atendimento em vez de inventar número', async () => {
  const flow = setup();
  const data = await flow.say('Qual o telefone da imobiliária?');
  assert.match(data.reply, /link.*público.*\?/i);
  assert.doesNotMatch(data.reply, /\d{8,}/);
});
test('agradecimento e recusa de perguntas encerram sem pressão mesmo no fluxo guiado', async () => {
  const flow = setup();
  await flow.say('Quero comprar casa');
  const data = await flow.say('Obrigado, vou pensar e volto depois');
  assert.doesNotMatch(data.reply, /\?/);
});
test('variações de pedido de catálogo público mostram opções reais antes de um interrogatório', async () => {
  for (const text of [
    'quais imoveis vc tem',
    'Quais imóveis vocês têm?',
    'Pode listar os imóveis disponíveis?',
  ]) {
    const flow = setup(true);
    const data = await flow.say(text);
    assert.equal(data.imoveis.length, 2, text);
    assert.match(data.reply, /encontrei 2|cartões/i);
    assert.doesNotMatch(data.reply, /não consegui consultar|login|vinculada/i);
  }
});
test('falha real de catálogo oferece tentar novamente, sem confundir com catálogo vazio', async () => {
  const flow = setup(true);
  const from = flow.db.from;
  flow.db.from = function (table) {
    const query = from.call(this, table);
    if (table === 'imoveis')
      query.limit = () =>
        Promise.resolve({
          data: null,
          error: { message: 'fixture database unavailable' },
        });
    return query;
  };
  const data = await flow.say('Quais imóveis vocês têm?');
  assert.equal(data.contexto.catalogState, 'unavailable');
  assert.match(data.reply, /temporariamente indisponível/i);
  assert.match(data.reply, /novamente\?/i);
  assert.doesNotMatch(data.reply, /sem imóveis|não encontrei/i);
});
test('aluguel e anúncio no link público avançam até retorno humano sem prometer preço ou publicação', async () => {
  for (const goal of ['Quero alugar', 'Quero anunciar']) {
    const flow = setup(true);
    let data = await flow.say(goal);
    assert.match(data.reply, /tipo|casa|apartamento/i);
    assert.ok(data.reply.endsWith('?'));
    data = await flow.say('apartamento');
    assert.match(data.reply, /bairro.*\?/i);
    assert.doesNotMatch(data.reply, /não encontrei|valor máximo|investir/i);
    data = await flow.say('Centro');
    assert.match(data.reply, /preparar.*atendimento.*\?/i);
    data = await flow.say('sim');
    assert.match(data.reply, /chamado|nome/i);
    assert.equal(data.qualificacao.contatoSolicitado, true);
    assert.doesNotMatch(
      data.reply,
      /anúncio publicado|aluguel custa|visita confirmada/i,
    );
  }
});
test('resposta sim ao pedido de link pede o endereço; o link verificado vira ação de continuação', async () => {
  const flow = setup();
  await flow.say('Quais imóveis vocês têm?');
  let data = await flow.say('sim');
  assert.match(data.reply, /cole|envie|endereço/i);
  assert.ok(data.reply.endsWith('?'));
  data = await flow.say('https://fixture.invalid/imobiliaria/horizonte');
  assert.equal(data.continuarEm.href, '/imobiliaria/horizonte');
  assert.match(data.continuarEm.label, /Horizonte/);
  assert.deepEqual(data.imoveis, []);
  assert.equal(flow.db.state.leads.length, 0);
});
test('link externo ou empresa não publicada nunca geram botão de acesso', async () => {
  for (const link of [
    'https://evil.invalid/imobiliaria/horizonte',
    'https://fixture.invalid/imobiliaria/desativada',
  ]) {
    const flow = setup();
    const data = await flow.say(link);
    assert.equal(data.continuarEm, undefined);
    assert.match(data.reply, /confir|válido|verificar|publicad/i);
    assert.ok(data.reply.endsWith('?'));
  }
});
test('mudança de orçamento e tipo reaproveita critérios sem reiniciar ou insistir', async () => {
  const flow = setup(true);
  await flow.say('Quero casa até 500 mil');
  let data = await flow.say('Meu limite é 100 mil');
  assert.deepEqual(data.imoveis, []);
  assert.match(data.reply, /100\.000/);
  data = await flow.say('Na verdade prefiro apartamento');
  assert.equal(data.qualificacao.tipoImovel, 'Apartamento');
  assert.equal(data.qualificacao.orcamentoMax, 100000);
  assert.match(data.reply, /outro tipo|corretor/i);
  assert.ok(data.reply.endsWith('?'));
});
test('não autorizar contato não pede dados pessoais nem cria card', async () => {
  const flow = setup(true);
  const data = await flow.say(
    'Quero uma casa até 500 mil, mas não quero passar meus dados nem receber contato',
  );
  assert.equal(data.qualificacao.permiteContato, false);
  assert.equal(flow.db.state.leads.length, 0);
  assert.doesNotMatch(data.reply, /seu nome|seu telefone|seu e-mail/i);
  assert.equal(data.imoveis.length, 2);
});
test('não ao convite de retorno é respeitado; novo pedido explícito permite retomar o atendimento', async () => {
  const flow = setup(true, true);
  await flow.say('Quero comprar casa');
  let data = await flow.say('Não, só estou pesquisando');
  assert.equal(data.qualificacao.permiteContato, false);
  assert.doesNotMatch(data.reply, /seu nome|seu telefone|seu e-mail|\?/i);
  data = await flow.say('Agora quero falar com um corretor');
  assert.equal(data.qualificacao.permiteContato, true);
  assert.match(data.reply, /chamado|nome/i);
});
test('tanto faz ao bairro não gera a mesma pergunta novamente', async () => {
  const flow = setup();
  await flow.say('Quero comprar casa até 500 mil');
  const data = await flow.say('tanto faz');
  assert.equal(data.qualificacao.semPreferenciaBairro, true);
  assert.match(data.reply, /link.*público.*\?/i);
  assert.doesNotMatch(data.reply, /qual bairro|qual.*região/i);
});
test('visita solicitada e depois cancelada não fica confirmada ou exige telefone', async () => {
  const flow = setup(true);
  await flow.say('Quero comprar casa até 500 mil');
  const data = await flow.say('Não quero mais visita nem receber contato');
  assert.equal(data.qualificacao.visitaSolicitada, false);
  assert.equal(data.qualificacao.permiteContato, false);
  assert.doesNotMatch(
    data.reply,
    /visita confirmada|qual.*telefone|qual.*nome/i,
  );
});
test('recusa específica do telefone interrompe a coleta sem bloquear a consulta de imóveis', async () => {
  const flow = setup(true, true);
  await flow.say('Quero comprar casa');
  await flow.say('sim');
  await flow.say('Ana Silva');
  const data = await flow.say('Prefiro não passar meu telefone');
  assert.equal(data.qualificacao.permiteContato, false);
  assert.equal(flow.db.state.leads.length, 0);
  assert.doesNotMatch(data.reply, /qual.*telefone|qual.*nome|seu e-mail/i);
});
