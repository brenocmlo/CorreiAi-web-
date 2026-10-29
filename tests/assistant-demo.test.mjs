import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
const { setServerSupabaseClientOverride } = await import(
  '../src/lib/supabase.ts'
);
const { GET, POST } = await import('../src/app/api/assistente/route.ts');
const oldFetch = globalThis.fetch;
afterEach(() => {
  setServerSupabaseClientOverride(null);
  globalThis.fetch = oldFetch;
});
function isolated() {
  setServerSupabaseClientOverride({
    from() {
      throw new Error('Demonstração não pode consultar o banco real');
    },
  });
  globalThis.fetch = async () => {
    throw new Error('Fluxo comum não deve depender do modelo');
  };
}
function req(slug = 'horizonte', texts, extra = {}) {
  return new NextRequest(
    'https://fixture.invalid/api/assistente?demo=' + slug,
    {
      method: texts ? 'POST' : 'GET',
      headers: {
        Origin: 'https://fixture.invalid',
        'Content-Type': 'application/json',
      },
      ...(texts
        ? {
            body: JSON.stringify({
              messages: texts.map((text) => ({ role: 'user', text })),
              ...extra,
            }),
          }
        : {}),
    },
  );
}
test('landing tem uma demonstração sem login e sem acesso ao banco', async () => {
  isolated();
  const response = await GET(req());
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.contexto.mode, 'demo');
  assert.equal(data.contexto.demoSlug, 'horizonte');
  assert.equal(data.contexto.catalogState, 'available');
});
test('casa até 500 mil retorna fotos, preços e próximo passo do catálogo de demonstração', async () => {
  isolated();
  const response = await POST(
    req('horizonte', ['Quero comprar casa até 500 mil']),
  );
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.imoveis.length, 2);
  assert.ok(data.imoveis.every((p) => p.valor <= 500000 && p.imagem_url));
  assert.equal(data.captura, 'demonstracao');
  assert.equal(data.leadRegistrado, false);
  assert.equal(data.qualificacao.nome, null);
  assert.equal(data.qualificacao.email, null);
  assert.equal(data.qualificacao.telefone, null);
  assert.ok(data.reply.endsWith('?'));
  assert.doesNotMatch(data.reply, /login|vinculad|link público/i);
});
test('cada imobiliária fictícia tem seu próprio conjunto de imóveis', async () => {
  isolated();
  const first = await (
    await POST(req('horizonte', ['Quais imóveis vocês têm?']))
  ).json();
  const second = await (
    await POST(req('litoral', ['Quais imóveis vocês têm?']))
  ).json();
  assert.ok(first.imoveis.length);
  assert.ok(second.imoveis.length);
  assert.notEqual(first.contexto.company.nome, second.contexto.company.nome);
  assert.ok(
    second.imoveis.every((p) => !first.imoveis.some((a) => a.id === p.id)),
  );
});
test('contato e visita de demonstração não coletam dados ou criam lead real', async () => {
  isolated();
  const data = await (
    await POST(
      req('horizonte', [
        'Quero falar com um corretor. Sou Ana Silva, ana@example.invalid, meu telefone é 85999998888.',
      ]),
    )
  ).json();
  assert.equal(data.captura, 'demonstracao');
  assert.equal(data.leadRegistrado, false);
  assert.match(data.reply, /demonstração|simulação/i);
  assert.equal(data.qualificacao.nome, null);
  assert.equal(data.qualificacao.email, null);
  assert.equal(data.qualificacao.telefone, null);
  assert.doesNotMatch(
    data.reply,
    /qual.*(?:telefone|e-mail|nome)|já registrei|já encaminhei/i,
  );
});
test('sem opção no orçamento, a demonstração também conduz sem inventar ofertas', async () => {
  isolated();
  const data = await (
    await POST(req('horizonte', ['Quero comprar casa até 100 mil']))
  ).json();
  assert.deepEqual(data.imoveis, []);
  assert.match(data.reply, /não encontrei/i);
  assert.ok(data.reply.endsWith('?'));
});
test('telefone de exemplo nunca vira um contato comercial real inventado', async () => {
  isolated();
  const data = await (
    await POST(req('horizonte', ['Qual o telefone da imobiliária?']))
  ).json();
  assert.match(data.reply, /demonstração|fictíc/i);
  assert.equal(data.contexto.company.telefone, null);
  assert.doesNotMatch(data.reply, /\d{8,}/);
});
test('imobiliária de demonstração inválida e imóvel forjado são recusados', async () => {
  isolated();
  assert.equal((await GET(req('empresa-real-secreta'))).status, 404);
  assert.equal(
    (
      await POST(
        req('horizonte', ['Quero visitar'], {
          imovelId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        }),
      )
    ).status,
    409,
  );
});
test('proteções de assunto e injeção também se aplicam na demonstração', async () => {
  isolated();
  for (const text of ['DROP TABLE perfis', 'Me ensina uma receita de bolo']) {
    const data = await (await POST(req('horizonte', [text]))).json();
    assert.equal(data.captura, 'sem_alteracao');
    assert.deepEqual(data.imoveis, []);
  }
});
test('depois de simular contato, ajustar busca retorna aos critérios em vez de repetir o encaminhamento', async () => {
  isolated();
  let messages = [
    'Quero casa até 500 mil',
    'Quero falar com um corretor',
    'Quero ajustar minha busca',
  ];
  let data = await (await POST(req('horizonte', messages))).json();
  assert.match(data.reply, /mudar|alterar/i);
  assert.ok(data.reply.endsWith('?'));
  data = await (
    await POST(req('horizonte', [...messages, 'Meu limite é 100 mil']))
  ).json();
  assert.match(data.reply, /não encontrei/i);
  assert.deepEqual(data.imoveis, []);
});
test('reset da demonstração não apaga o cookie de um atendimento real em outra aba', async () => {
  isolated();
  const { DELETE } = await import('../src/app/api/assistente/route.ts');
  const response = await DELETE(
    new NextRequest('https://fixture.invalid/api/assistente?demo=horizonte', {
      method: 'DELETE',
      headers: {
        Origin: 'https://fixture.invalid',
        Cookie: 'correia_atendimento=existing-real-session',
      },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null);
});
test('formatos usuais de orçamento mantêm os mesmos resultados no fluxo da demonstração', async () => {
  isolated();
  for (const value of [
    '500.000',
    'R$ 500.000,00',
    '500k',
    '500 mil',
    '0,5 milhão',
    '500000',
  ]) {
    const data = await (
      await POST(req('horizonte', ['Quero comprar casa', value]))
    ).json();
    assert.equal(data.qualificacao.orcamentoMax, 500000, value);
    assert.equal(data.imoveis.length, 2, value);
  }
});
test('chat comercial apresenta as imobiliárias e explica o sistema sem inventar mensalidade',async()=>{
  isolated();let data=await(await POST(req('horizonte',['Quais imobiliárias posso testar?']))).json();
  assert.match(data.reply,/Horizonte/);assert.match(data.reply,/Litoral/);assert.equal(data.sugestoes.length,2);
  data=await(await POST(req('horizonte',['Quanto custa o CorreAI?']))).json();
  assert.match(data.reply,/não estão definidos|não vou inventar/i);assert.doesNotMatch(data.reply,/R\$|US\$/);
});
test('detalhes de demonstração continuam no chat e usam o imóvel escolhido',async()=>{
  isolated();const data=await(await POST(req('horizonte',['Quais são os detalhes deste imóvel?'],{imovelId:'d1000000-0000-4000-8000-000000000001'}))).json();
  assert.match(data.reply,/quintal|varanda/i);assert.match(data.reply,/fictíc|demonstração/i);assert.equal(data.captura,'demonstracao');
});
test('troca por nome de imobiliária usa o catálogo fictício indicado, nunca um ID real do body',async()=>{
  isolated();const data=await(await POST(req('horizonte',['Ver imobiliária Litoral'],{imobiliaria_id:'real-agency-forged'}))).json();
  assert.equal(data.contexto.demoSlug,'litoral');assert.match(data.contexto.company.nome,/Litoral/);
});
test('colar um link na demonstração não consulta nem seleciona imobiliária real',async()=>{
  isolated();const data=await(await POST(req('horizonte',['https://fixture.invalid/imobiliaria/empresa-real']))).json();
  assert.equal(data.contexto.mode,'demo');assert.equal(data.continuarEm,undefined);assert.equal(data.captura,'demonstracao');
});
