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
} from './helpers/assistant-fixture.mjs';
process.env.JWT_SECRET = 'isolated-public-agency-fixture-secret-123456';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.invalid';
const { setServerSupabaseClientOverride } = await import(
  '../src/lib/supabase.ts'
);
const catalog = await import(
  '../src/app/api/publico/imobiliarias/[slug]/route.ts'
);
const intake = await import('../src/app/api/leads/public/route.ts');
const assistant = await import('../src/app/api/assistente/route.ts');
const propertyDetails = await import(
  '../src/app/api/publico/imobiliarias/[slug]/imoveis/[id]/route.ts'
);
const image = await import(
  '../src/app/api/publico/imobiliarias/[slug]/imoveis/[id]/imagem/route.ts'
);
const company = await import('../src/app/api/imobiliaria/route.ts');
const { signToken } = await import('../src/lib/jwt.ts');
const oldFetch = globalThis.fetch;
afterEach(() => {
  setServerSupabaseClientOverride(null);
  globalThis.fetch = oldFetch;
});
function setup() {
  const db = assistantFixture();
  Object.assign(db.state.imobiliarias[0], {
    public_slug: 'horizonte',
    atendimento_publico: true,
  });
  Object.assign(db.state.imobiliarias[1], {
    public_slug: 'outra-empresa',
    atendimento_publico: true,
  });
  setServerSupabaseClientOverride(db);
  globalThis.fetch = async () => {
    throw new Error('Unexpected provider request');
  };
  return db;
}
function req(path, body, cookie = '') {
  return new NextRequest('https://fixture.invalid' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: 'https://fixture.invalid',
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const params = (slug) => ({ params: Promise.resolve({ slug }) });
const search = [
  { role: 'user', text: 'Quero comprar casa no Centro até 300 mil' },
];
test('visitante vê imóveis, valores e telefone somente da imobiliária do link', async () => {
  setup();
  const response = await catalog.GET(
    req('/api/publico/imobiliarias/horizonte'),
    params('horizonte'),
  );
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.imoveis.length, 2);
  assert.equal(data.imobiliaria.telefone, '85999990000');
  assert.ok(
    data.imoveis.every(
      (p) =>
        p.valor > 0 && !('proprietario_id' in p) && !('imobiliaria_id' in p),
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(data),
    /OUTRA EMPRESA|11988887777|senha_hash|cnpj/,
  );
});
test('página desativada, inexistente ou empresa suspensa não expõe dados', async () => {
  const db = setup();
  db.state.imobiliarias[0].atendimento_publico = false;
  assert.equal((await catalog.GET(req('/'), params('horizonte'))).status, 404);
  db.state.imobiliarias[0].atendimento_publico = true;
  db.state.imobiliarias[0].ativo = false;
  assert.equal((await catalog.GET(req('/'), params('horizonte'))).status, 404);
  assert.equal((await catalog.GET(req('/'), params('nao-existe'))).status, 404);
});
test('chat público mostra os preços sem login de cliente ou corretor', async () => {
  setup();
  const data = await (
    await assistant.POST(
      req('/api/assistente?imobiliaria=horizonte', {
        messages: search,
        imobiliaria_id: ORG_B,
        corretor_id: BROKER_B,
      }),
    )
  ).json();
  assert.equal(data.contexto.catalogState, 'available');
  assert.equal(data.imoveis.length, 2);
  assert.equal(data.contexto.company.telefone, '85999990000');
  assert.doesNotMatch(JSON.stringify(data), /OUTRA EMPRESA|11988887777/);
});
test('cadastro rápido identifica a pessoa no chat e cria um único lead para a empresa correta', async () => {
  const db = setup();
  const form = {
    nome: 'Ana Cliente',
    email: 'ana-cliente@example.invalid',
    telefone: '(85) 97777-6666',
    consentimento: true,
    corretor_id: BROKER_B,
    imobiliaria_id: ORG_B,
  };
  const created = await intake.POST(
    req('/api/leads/public?imobiliaria=horizonte', form),
  );
  assert.equal(created.status, 201);
  const cookie = created.headers.get('set-cookie').split(';')[0];
  assert.equal(db.state.leads.length, 1);
  assert.equal(db.state.leads[0].corretor_id, BROKER_A);
  assert.equal(db.state.leads[0].etapa, 'novo');
  assert.doesNotMatch(await created.text(), /corretor_id|senha_hash/);
  const restored = await (
    await assistant.GET(
      req('/api/assistente?imobiliaria=horizonte', null, cookie),
    )
  ).json();
  assert.equal(restored.atendimento.nome, 'Ana Cliente');
  assert.equal(restored.atendimento.telefone, '85977776666');
  const data = await (
    await assistant.POST(
      req(
        '/api/assistente?imobiliaria=horizonte',
        { messages: search },
        cookie,
      ),
    )
  ).json();
  assert.equal(data.qualificacao.nome, 'Ana Cliente');
  assert.equal(data.imoveis.length, 2);
  assert.equal(db.state.leads.length, 1);
  assert.equal(db.state.leads[0].etapa, 'novo');
  const other = await (
    await assistant.GET(
      req('/api/assistente?imobiliaria=outra-empresa', null, cookie),
    )
  ).json();
  assert.equal(other.atendimento, null);
  assert.equal(other.contexto.company.telefone, '11988887777');
  assert.equal(db.state.leads.length, 1);
});
test('sem consentimento ou com contato inválido não cria lead público', async () => {
  const db = setup();
  for (const body of [
    {
      nome: 'Ana',
      email: 'ana@example.invalid',
      telefone: '85977776666',
      consentimento: false,
    },
    { nome: 'Ana', email: 'errado', telefone: '123', consentimento: true },
  ])
    assert.equal(
      (await intake.POST(req('/api/leads/public?imobiliaria=horizonte', body)))
        .status,
      400,
    );
  assert.equal(db.state.leads.length, 0);
});
test('sem link de imobiliária, visitante continua sem catálogo global', async () => {
  setup();
  const data = await (
    await assistant.POST(req('/api/assistente', { messages: search }))
  ).json();
  assert.deepEqual(data.imoveis, []);
  assert.equal(data.contexto.catalogState, 'restricted');
});

test('detalhes e imagem públicos validam a empresa, status e ID antes de liberar a foto', async () => {
  const db = setup(),
    own = db.state.imoveis[0],
    foreign = db.state.imoveis.find((p) => p.imobiliaria_id === ORG_B),
    signed = [];
  own.imagem_url = `https://fixture.invalid/storage/v1/object/public/imoveis_imagens/${BROKER_A}/foto.png`;
  db.storage = {
    from: () => ({
      createSignedUrl: async (path, expires) => {
        signed.push({ path, expires });
        return {
          data: { signedUrl: 'https://fixture.invalid/temporary-image' },
          error: null,
        };
      },
    }),
  };
  const detailParams = (id) => ({
    params: Promise.resolve({ slug: 'horizonte', id }),
  });
  assert.equal(
    (await propertyDetails.GET(req('/'), detailParams(foreign.id))).status,
    404,
  );
  assert.equal(
    (await image.GET(req('/'), detailParams(foreign.id))).status,
    404,
  );
  assert.equal(signed.length, 0);
  const photo = await image.GET(
    req('/?path=outra-empresa/foto.png'),
    detailParams(own.id),
  );
  assert.equal(photo.status, 302);
  assert.equal(signed[0].path, `${BROKER_A}/foto.png`);
  assert.equal(signed[0].expires, 60);
  own.status = 'vendido';
  assert.equal((await image.GET(req('/'), detailParams(own.id))).status, 404);
  assert.equal(signed.length, 1);
});

test('outra pessoa no mesmo navegador recebe nova sessão e não altera o lead anterior', async () => {
  const db = setup();
  const one = await intake.POST(
    req('/api/leads/public?imobiliaria=horizonte', {
      nome: 'Ana Cliente',
      email: 'ana@example.invalid',
      telefone: '85977776666',
      consentimento: true,
    }),
  );
  const cookie = one.headers.get('set-cookie').split(';')[0];
  const two = await intake.POST(
    req(
      '/api/leads/public?imobiliaria=horizonte',
      {
        nome: 'Bruno Cliente',
        email: 'bruno@example.invalid',
        telefone: '85966665555',
        consentimento: true,
      },
      cookie,
    ),
  );
  assert.equal(two.status, 201);
  assert.notEqual(two.headers.get('set-cookie').split(';')[0], cookie);
  assert.equal(db.state.leads.length, 2);
  assert.equal(db.state.leads[0].nome, 'Ana Cliente');
  assert.equal(db.state.leads[1].nome, 'Bruno Cliente');
});

test('seleção direta do imóvel público funciona antes de o visitante fornecer critérios', async () => {
  const db = setup();
  const id = db.state.imoveis[0].id;
  const data = await (
    await assistant.POST(
      req('/api/assistente?imobiliaria=horizonte', {
        messages: [{ role: 'user', text: 'Quero visitar este imóvel' }],
        imovelId: id,
      }),
    )
  ).json();
  assert.equal(data.qualificacao.imovelInteresseId, id);
  assert.equal(data.imoveis[0].id, id);
  assert.match(data.reply, /Qual dia e período/);
});

test('somente administrador da própria empresa configura a publicação', async () => {
  const db = setup();
  const cookie = (id) => {
    const p = db.state.perfis.find((p) => p.id === id);
    return `auth_token=${signToken({ uid: id, role: p.role, email: p.email ?? 'fixture@example.invalid', nome_completo: p.nome_completo ?? 'Fixture' })}`;
  };
  const patch = (body, id) =>
    company.PATCH(
      new NextRequest('https://fixture.invalid/api/imobiliaria', {
        method: 'PATCH',
        headers: {
          Origin: 'https://fixture.invalid',
          'Content-Type': 'application/json',
          Cookie: id ? cookie(id) : '',
        },
        body: JSON.stringify(body),
      }),
    );
  assert.equal((await patch({ atendimento_publico: false }, null)).status, 401);
  assert.equal(
    (await patch({ atendimento_publico: false }, BROKER_A)).status,
    403,
  );
  assert.equal(
    (await patch({ atendimento_publico: false, id: ORG_B }, ADMIN_A)).status,
    400,
  );
  assert.equal(
    (await patch({ public_slug: 'slug/invalido' }, ADMIN_A)).status,
    400,
  );
  assert.equal(
    (
      await patch(
        { public_slug: 'horizonte-oficial', atendimento_publico: false },
        ADMIN_A,
      )
    ).status,
    200,
  );
  assert.equal(db.state.imobiliarias[0].public_slug, 'horizonte-oficial');
  assert.equal(db.state.imobiliarias[1].atendimento_publico, true);
  assert.equal(db.state.imobiliarias[1].public_slug, 'outra-empresa');
  assert.equal(
    (
      await assistant.POST(
        req('/api/assistente?imobiliaria=horizonte-oficial', {
          messages: search,
        }),
      )
    ).status,
    404,
  );
});

test('slug com SQL, origem externa e imóvel de outra empresa não atravessam a publicação', async () => {
  const db = setup(),
    before = JSON.stringify(db.state);
  assert.equal(
    (await catalog.GET(req('/'), params("' OR 1=1 --"))).status,
    404,
  );
  const foreign = db.state.imoveis.find((p) => p.imobiliaria_id === ORG_B);
  assert.equal(
    (
      await assistant.POST(
        req('/api/assistente?imobiliaria=horizonte', {
          messages: search,
          imovelId: foreign.id,
        }),
      )
    ).status,
    409,
  );
  const cross = new NextRequest(
    'https://fixture.invalid/api/leads/public?imobiliaria=horizonte',
    {
      method: 'POST',
      headers: {
        Origin: 'https://foreign.invalid',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: 'Ana Cliente',
        email: 'ana@example.invalid',
        telefone: '85977776666',
        consentimento: true,
      }),
    },
  );
  assert.equal((await intake.POST(cross)).status, 403);
  assert.equal(JSON.stringify(db.state), before);
});

test('resposta iniciada antes do cadastro rápido não apaga os dados pessoais recebidos depois', async () => {
  setup();
  const oldKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'fixture-only';
  let release, started;
  const began = new Promise((resolve) => {
    started = resolve;
  });
  globalThis.fetch = async () => {
    started();
    return new Promise((resolve) => {
      release = () =>
        resolve(
          Response.json({
            choices: [
              {
                message: {
                  content:
                    'O banco analisa renda e documentação. As condições dependem da análise.',
                },
              },
            ],
          }),
        );
    });
  };
  try {
    const cookie = `correia_atendimento=${'A'.repeat(43)}`;
    const pending = assistant.POST(
      req(
        '/api/assistente?imobiliaria=horizonte',
        {
          messages: [{ role: 'user', text: 'Como funciona o financiamento?' }],
        },
        cookie,
      ),
    );
    await began;
    assert.equal(
      (
        await intake.POST(
          req(
            '/api/leads/public?imobiliaria=horizonte',
            {
              nome: 'Ana Cliente',
              email: 'ana@example.invalid',
              telefone: '85977776666',
              consentimento: true,
            },
            cookie,
          ),
        )
      ).status,
      201,
    );
    release();
    assert.equal((await pending).status, 200);
    const restored = await (
      await assistant.GET(
        req('/api/assistente?imobiliaria=horizonte', null, cookie),
      )
    ).json();
    assert.equal(restored.atendimento.nome, 'Ana Cliente');
    assert.equal(restored.atendimento.email, 'ana@example.invalid');
    assert.equal(restored.atendimento.telefone, '85977776666');
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = oldKey;
  }
});
