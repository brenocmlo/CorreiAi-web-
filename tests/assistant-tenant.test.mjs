import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  assistantFixture,
  ORG_A,
  ORG_B,
  BROKER_A,
  BROKER_B,
  ADMIN_A,
  CLIENT_A,
} from './helpers/assistant-fixture.mjs';
process.env.JWT_SECRET = 'isolated-assistant-tenant-fixture-secret-123456';
const { signToken } = await import('../src/lib/jwt.ts');
const { setServerSupabaseClientOverride } = await import(
  '../src/lib/supabase.ts'
);
const assistant = await import('../src/app/api/assistente/route.ts'),
  company = await import('../src/app/api/imobiliaria/route.ts');
const originalFetch = globalThis.fetch,
  originalKey = process.env.OPENROUTER_API_KEY;
let db, calls;
function setup() {
  db = assistantFixture();
  setServerSupabaseClientOverride(db);
  calls = [];
  process.env.OPENROUTER_API_KEY = 'fixture-only';
  globalThis.fetch = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({
      choices: [
        {
          message: {
            content:
              'O banco analisa renda e documentação. A aprovação depende da análise. Qual bairro? Qual prazo? Qual nome?',
          },
        },
      ],
    });
  };
  return db;
}
function req(
  path = '/api/assistente',
  {
    id = BROKER_A,
    method = 'POST',
    messages = [
      { role: 'user', text: 'Quero comprar casa no Centro até 300 mil' },
    ],
    body,
    cookie = '',
  } = {},
) {
  const profile = db.state.perfis.find((p) => p.id === id),
    token = profile
      ? signToken({
          uid: id,
          role: profile.role,
          email: profile.email ?? 'fixture@example.invalid',
          nome_completo: profile.nome_completo ?? 'Fixture',
        })
      : null;
  return new NextRequest('https://fixture.invalid' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: [token ? 'auth_token=' + token : '', cookie]
        .filter(Boolean)
        .join('; '),
    },
    ...(!['GET', 'HEAD'].includes(method)
      ? { body: JSON.stringify(body ?? { messages }) }
      : {}),
  });
}
afterEach(() => {
  globalThis.fetch = originalFetch;
  setServerSupabaseClientOverride(null);
  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalKey;
});
test('chat mostra imóveis e telefone somente da empresa validada, incluindo imóveis do colega', async () => {
  setup();
  const data = await (
    await assistant.POST(
      req(undefined, {
        body: {
          messages: [
            { role: 'user', text: 'Quero comprar casa no Centro até 300 mil' },
          ],
          imobiliaria_id: ORG_B,
          proprietario_id: BROKER_B,
        },
      }),
    )
  ).json();
  assert.equal(data.imoveis.length, 2);
  assert.ok(data.imoveis.every((p) => !p.endereco.includes('OUTRA EMPRESA')));
  assert.equal(data.contexto.company.telefone, '85999990000');
  assert.equal(calls.length, 0);
});
test('cliente vinculado consulta o catálogo certo e não revela contato de outra empresa', async () => {
  setup();
  const data = await (
    await assistant.POST(
      req(undefined, {
        id: CLIENT_A,
        messages: [{ role: 'user', text: 'Qual o telefone da imobiliária?' }],
      }),
    )
  ).json();
  assert.match(data.reply, /\(85\) 99999-0000/);
  assert.doesNotMatch(JSON.stringify(data), /11988887777|Outra empresa/);
});
test('visitante e cliente sem vínculo não recebem imóveis ou telefone de empresas', async () => {
  setup();
  db.state.perfis.find((p) => p.id === CLIENT_A).imobiliaria_id = null;
  for (const id of [null, CLIENT_A]) {
    const data = await (await assistant.POST(req(undefined, { id }))).json();
    assert.deepEqual(data.imoveis, []);
    assert.equal(data.contexto.catalogState, 'restricted');
    assert.equal(data.contexto.company, null);
    assert.doesNotMatch(data.reply, /Não encontrei/);
  }
});
test('empresa suspensa não fornece catálogo nem telefone mesmo com token existente', async () => {
  setup();
  const request = req();
  db.state.imobiliarias.find((c) => c.id === ORG_A).ativo = false;
  const data = await (await assistant.POST(request)).json();
  assert.deepEqual(data.imoveis, []);
  assert.equal(data.contexto.company, null);
});
test('ID de imóvel de outra empresa é rejeitado', async () => {
  setup();
  const foreign = db.state.imoveis.find((p) => p.imobiliaria_id === ORG_B);
  assert.equal(
    (
      await assistant.POST(
        req(undefined, {
          body: {
            messages: [{ role: 'user', text: 'Quero visitar esta casa' }],
            imovelId: foreign.id,
          },
        }),
      )
    ).status,
    409,
  );
});
test('modelo recebe apenas os dados do catálogo permitido e faz no máximo uma pergunta', async () => {
  setup();
  const data = await (
    await assistant.POST(
      req(undefined, {
        messages: [
          {
            role: 'user',
            text: 'Como funciona o financiamento para comprar casa no Centro até 300 mil?',
          },
        ],
      }),
    )
  ).json();
  assert.equal(calls.length, 1);
  assert.ok(!JSON.stringify(calls).includes('ENDEREÇO PRIVADO'));
  assert.ok((data.reply.match(/\?/g) || []).length <= 1);
});
test('mudar o vínculo da mesma conta não restaura conversa da empresa anterior', async () => {
  setup();
  const first = await assistant.POST(
    req(undefined, {
      messages: [
        {
          role: 'user',
          text: 'Sou Ana Silva, meu email é ana@example.invalid e meu telefone 85999990000. Quero comprar uma casa no Centro até 300 mil.',
        },
      ],
    }),
  );
  const cookie = first.headers.get('set-cookie').split(';')[0];
  assert.equal(db.state.leads.length, 1);
  db.state.perfis.find((p) => p.id === BROKER_A).imobiliaria_id = ORG_B;
  const restored = await (
    await assistant.GET(req('/api/assistente', { method: 'GET', cookie }))
  ).json();
  assert.equal(restored.atendimento, null);
  assert.equal(restored.contexto.company.telefone, '11988887777');
});
test('somente admin da empresa altera seu telefone, sem aceitar ID de outra empresa', async () => {
  setup();
  for (const id of [BROKER_A, CLIENT_A, BROKER_B])
    assert.equal(
      (
        await company.PATCH(
          req('/api/imobiliaria', {
            id,
            method: 'PATCH',
            body: { telefone: '(85) 98888-7777' },
          }),
        )
      ).status,
      403,
    );
  assert.equal(
    (
      await company.PATCH(
        req('/api/imobiliaria', {
          id: ADMIN_A,
          method: 'PATCH',
          body: { telefone: '85988887777', id: ORG_B },
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await company.PATCH(
        req('/api/imobiliaria', {
          id: ADMIN_A,
          method: 'PATCH',
          body: { telefone: '(85) 98888-7777' },
        }),
      )
    ).status,
    200,
  );
  assert.equal(db.state.imobiliarias[0].telefone, '85988887777');
  assert.equal(db.state.imobiliarias[1].telefone, '11988887777');
});
test('telefone ausente não é substituído pelo de outra empresa', async () => {
  setup();
  db.state.imobiliarias[0].telefone = null;
  const data = await (
    await assistant.POST(
      req(undefined, {
        messages: [{ role: 'user', text: 'Qual o telefone da imobiliária?' }],
      }),
    )
  ).json();
  assert.match(data.reply, /ainda não está cadastrado/);
  assert.doesNotMatch(data.reply, /11988887777/);
});

test('busca, seleção do cartão e visita mantêm imóvel e critérios corretos', async () => {
  setup();
  const messages = [
    { role: 'user', text: 'Quero comprar casa no Centro até 300 mil' },
  ];
  let data = await (await assistant.POST(req(undefined, { messages }))).json();
  const selected = data.imoveis[0].id;
  messages.push(
    { role: 'assistant', text: data.reply },
    { role: 'user', text: 'Quero solicitar uma visita a este imóvel.' },
  );
  data = await (
    await assistant.POST(
      req(undefined, { body: { messages, imovelId: selected } }),
    )
  ).json();
  assert.equal(data.qualificacao.imovelInteresseId, selected);
  assert.equal(data.qualificacao.bairro, 'Centro');
  assert.match(data.reply, /Qual dia e período/);
  assert.doesNotMatch(data.reply, /identificar um imóvel/);
  messages.push(
    { role: 'assistant', text: data.reply },
    { role: 'user', text: 'Sábado à tarde' },
  );
  data = await (
    await assistant.POST(
      req(undefined, { body: { messages, imovelId: selected } }),
    )
  ).json();
  assert.equal(data.qualificacao.visitaPreferencia, 'Sábado à tarde');
  assert.match(data.reply, /Como você prefere ser chamado/);
  assert.equal(calls.length, 0);
});
