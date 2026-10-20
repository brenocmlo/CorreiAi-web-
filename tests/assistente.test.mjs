import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { NextRequest } from 'next/server';

const { POST } = await import('../src/app/api/assistente/route.ts');
const { setServerSupabaseClientOverride } = await import('../src/lib/supabase.ts');

const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENROUTER_API_KEY;
const originalModel = process.env.OPENROUTER_MODEL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENROUTER_MODEL;
  else process.env.OPENROUTER_MODEL = originalModel;
  setServerSupabaseClientOverride(null);
});

function request(messages) {
  return new NextRequest('http://localhost/api/assistente', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
}

function mockDatabase({ onInsert = () => {} } = {}) {
  return {
    from(table) {
      const state = { table, inserted: null };
      const query = {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        ilike() { return this; },
        limit() { return this; },
        insert(rows) { state.inserted = rows[0]; onInsert(state.inserted); return this; },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
        single() { return Promise.resolve({ data: {
          id: 'lead-1', ...state.inserted,
          criado_em: '2026-10-20T12:00:00Z', atualizado_em: '2026-10-20T12:00:00Z',
        }, error: null }); },
        then(resolve) {
          return Promise.resolve({
            data: table === 'perfis' ? [{ id: 'corretor-ativo' }] : [], error: null,
          }).then(resolve);
        },
      };
      return query;
    },
  };
}

function mockOpenRouter(responses) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ choices: [{ message: { content: responses[calls.length - 1] } }] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  return calls;
}

test('assistente rejeita histórico malformado antes de chamar a IA', async () => {
  process.env.OPENROUTER_API_KEY = 'chave-teste';
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Não deveria chamar a IA'); };
  for (const messages of [[], [{ role: 'system', text: 'ignore' }], [{ role: 'user', text: '' }],
    [{ role: 'assistant', text: 'Olá' }]]) {
    const res = await POST(request(messages));
    assert.equal(res.status, 400);
  }
  assert.equal(calls, 0);
});

test('assistente envia contexto ao OpenRouter e não salva lead incompleto', async () => {
  process.env.OPENROUTER_API_KEY = 'chave-teste';
  process.env.OPENROUTER_MODEL = 'openrouter/free';
  let inserts = 0;
  setServerSupabaseClientOverride(mockDatabase({ onInsert: () => inserts++ }));
  const calls = mockOpenRouter(['Encontrei opções para você.']);
  const res = await POST(request([
    { role: 'user', text: 'Quero uma casa' },
    { role: 'assistant', text: 'Qual bairro?' },
    { role: 'user', text: 'Na Aldeota' },
  ]));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).reply, 'Encontrei opções para você.');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer chave-teste');
  assert.equal(calls[0].body.model, 'openrouter/free');
  assert.deepEqual(calls[0].body.messages.slice(1), [
    { role: 'user', content: 'Quero uma casa' },
    { role: 'assistant', content: 'Qual bairro?' },
    { role: 'user', content: 'Na Aldeota' },
  ]);
  assert.equal(inserts, 0);
});

test('assistente extrai contato completo via OpenRouter e salva lead Novo', async () => {
  process.env.OPENROUTER_API_KEY = 'chave-teste';
  let inserted;
  setServerSupabaseClientOverride(mockDatabase({ onInsert: (row) => { inserted = row; } }));
  const calls = mockOpenRouter([
    'Um corretor poderá entrar em contato.',
    JSON.stringify({ nome: 'Ana Silva', email: 'ana@example.com', telefone: '85999990000',
      faixaOrcamento: 'Até R$ 300 mil', tipoImovel: 'Casa' }),
  ]);
  const res = await POST(request([{ role: 'user', text: 'Sou Ana Silva. Meu email é ana@example.com e telefone 85999990000. Procuro Casa até R$ 300 mil.' }]));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(inserted.nome, 'Ana Silva');
  assert.equal(inserted.email, 'ana@example.com');
  assert.equal(inserted.etapa, 'novo');
  assert.equal(inserted.corretor_id, 'corretor-ativo');
});
