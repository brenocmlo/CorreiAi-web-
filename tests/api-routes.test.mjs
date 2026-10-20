import assert from 'node:assert/strict';
import test, { beforeEach, afterEach } from 'node:test';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'segredo-de-teste-para-rotas-123456';
const { signToken } = await import('../src/lib/jwt.ts');
const { setServerSupabaseClientOverride } = await import('../src/lib/supabase.ts');
const { POST: loginHandler } = await import('../src/app/api/auth/login/route.ts');
const { POST: cadastroHandler } = await import('../src/app/api/auth/cadastro/route.ts');
const { GET: getLeadsHandler, POST: postLeadsHandler } = await import('../src/app/api/leads/route.ts');
const { POST: publicLeadHandler } = await import('../src/app/api/leads/public/route.ts');

function createRequest(url, { method = 'GET', body = null, token = null } = {}) {
  const headers = new Headers();
  if (body !== null) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('cookie', `auth_token=${token}`);
  }
  return new NextRequest(url, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });
}

function createMockSupabase(handlers = {}) {
  return {
    from(table) {
      const handler = handlers[table] || {};
      const queryState = {
        table,
        filters: [],
        orderBy: null,
        insertedData: null,
      };

      const queryBuilder = {
        select(fields) {
          queryState.selectFields = fields;
          return this;
        },
        eq(col, val) {
          queryState.filters.push({ col, val });
          return this;
        },
        order(field, opts) {
          queryState.orderBy = { field, opts };
          return this;
        },
        limit(count) {
          queryState.limit = count;
          return this;
        },
        insert(data) {
          queryState.insertedData = data;
          return this;
        },
        maybeSingle() {
          if (handler.maybeSingle) return handler.maybeSingle(queryState);
          return Promise.resolve({ data: handler.data ?? null, error: handler.error ?? null });
        },
        single() {
          if (handler.single) return handler.single(queryState);
          return Promise.resolve({ data: handler.data ?? null, error: handler.error ?? null });
        },
        then(onFulfilled, onRejected) {
          const res = handler.execute
            ? handler.execute(queryState)
            : { data: handler.data ?? [], error: handler.error ?? null };
          return Promise.resolve(res).then(onFulfilled, onRejected);
        },
      };

      return queryBuilder;
    },
  };
}

afterEach(() => {
  setServerSupabaseClientOverride(null);
});

// ==========================================
// Testes de /api/auth/login
// ==========================================

test('auth/login rejeita requisição com campos obrigatórios ausentes ou e-mail inválido (400)', async () => {
  const payloadsInvalidos = [
    {},
    { email: 'nao-e-email', senha: '123' },
    { email: 'corretor@teste.com', senha: '' },
    { email: 'corretor@teste.com' },
    { senha: '123' },
  ];

  for (const body of payloadsInvalidos) {
    const req = createRequest('http://localhost/api/auth/login', { method: 'POST', body });
    const res = await loginHandler(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /obrigatórios/i);
  }
});

test('auth/login rejeita credenciais inválidas quando usuário não existe (401)', async () => {
  const mockSupabase = createMockSupabase({
    perfis: {
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: { email: 'inexistente@teste.com', senha: 'senha-qualquer' },
  });
  const res = await loginHandler(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.match(data.error, /incorretos/i);
});

test('auth/login rejeita credenciais inválidas quando a senha está incorreta (401)', async () => {
  const hashCorreto = bcrypt.hashSync('senha-correta-123', 8);
  const mockSupabase = createMockSupabase({
    perfis: {
      maybeSingle: () =>
        Promise.resolve({
          data: {
            id: 'corretor-1',
            email: 'corretor@teste.com',
            senha_hash: hashCorreto,
            role: 'corretor',
            nome_completo: 'Corretor Silva',
          },
          error: null,
        }),
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: { email: 'corretor@teste.com', senha: 'senha-errada' },
  });
  const res = await loginHandler(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.match(data.error, /incorretos/i);
});

test('auth/login autentica com sucesso e define o cookie auth_token (200)', async () => {
  const hashCorreto = bcrypt.hashSync('senha-123', 8);
  const mockSupabase = createMockSupabase({
    perfis: {
      maybeSingle: () =>
        Promise.resolve({
          data: {
            id: 'corretor-1',
            email: 'corretor@teste.com',
            senha_hash: hashCorreto,
            role: 'corretor',
            nome_completo: 'Corretor Silva',
          },
          error: null,
        }),
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: { email: 'corretor@teste.com', senha: 'senha-123' },
  });
  const res = await loginHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);

  const authCookie = res.cookies.get('auth_token');
  assert.ok(authCookie);
  assert.ok(authCookie.value.length > 0);
  assert.equal(authCookie.httpOnly, true);
});

// ==========================================
// Testes de /api/auth/cadastro
// ==========================================

test('auth/cadastro valida regras de registro e rejeita dados inválidos (400)', async () => {
  const cadastrosInvalidos = [
    // Corretor sem CRECI
    { nome_completo: 'Ana', email: 'ana@teste.com', cpf: '12345678901', senha: '123456', role: 'corretor' },
    // Senha muito curta
    { nome_completo: 'Ana', email: 'ana@teste.com', cpf: '12345678901', senha: '123', role: 'lead' },
    // Role administrativo proibido no cadastro público
    { nome_completo: 'Admin', email: 'admin@teste.com', cpf: '12345678901', senha: '123456', role: 'super_admin' },
    // E-mail inválido
    { nome_completo: 'Ana', email: 'invalido', cpf: '12345678901', senha: '123456', role: 'lead' },
  ];

  for (const body of cadastrosInvalidos) {
    const req = createRequest('http://localhost/api/auth/cadastro', { method: 'POST', body });
    const res = await cadastroHandler(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /inválidos/i);
  }
});

test('auth/cadastro rejeita e-mail já cadastrado (409)', async () => {
  const mockSupabase = createMockSupabase({
    perfis: {
      maybeSingle: () => Promise.resolve({ data: { id: 'existente-1' }, error: null }),
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/auth/cadastro', {
    method: 'POST',
    body: {
      nome_completo: 'Carlos Silva',
      email: 'duplicado@teste.com',
      cpf: '12345678901',
      creci: '12345-F',
      senha: 'senha-segura',
      role: 'corretor',
    },
  });

  const res = await cadastroHandler(req);
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.match(data.error, /já está sendo utilizado/i);
});

test('auth/cadastro cria perfil com sucesso e define o cookie auth_token (200)', async () => {
  let perfilInserido = null;
  const mockSupabase = createMockSupabase({
    perfis: {
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: (state) => {
        perfilInserido = state.insertedData?.[0];
        return Promise.resolve({
          data: {
            ...perfilInserido,
            id: 'novo-id-123',
          },
          error: null,
        });
      },
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/auth/cadastro', {
    method: 'POST',
    body: {
      nome_completo: 'Mariana Lima',
      email: 'mariana@teste.com',
      cpf: '12345678901',
      creci: '54321-F',
      senha: 'minha-senha',
      role: 'corretor',
    },
  });

  const res = await cadastroHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);

  assert.equal(perfilInserido.email, 'mariana@teste.com');
  assert.equal(perfilInserido.role, 'corretor');
  assert.ok(perfilInserido.senha_hash);

  const authCookie = res.cookies.get('auth_token');
  assert.ok(authCookie);
  assert.ok(authCookie.value.length > 0);
});

// ==========================================
// Testes de /api/leads
// ==========================================

test('leads bloqueia requisições sem autenticação em GET e POST (401)', async () => {
  const getReq = createRequest('http://localhost/api/leads', { method: 'GET' });
  const getRes = await getLeadsHandler(getReq);
  assert.equal(getRes.status, 401);
  const getData = await getRes.json();
  assert.match(getData.error, /não autenticado/i);

  const postReq = createRequest('http://localhost/api/leads', { method: 'POST', body: {} });
  const postRes = await postLeadsHandler(postReq);
  assert.equal(postRes.status, 401);
  const postData = await postRes.json();
  assert.match(postData.error, /não autenticado/i);
});

test('leads bloqueia acesso de usuários com perfil de lead (403)', async () => {
  const tokenLead = signToken({
    uid: 'lead-uid-1',
    email: 'lead@teste.com',
    role: 'lead',
    nome_completo: 'Cliente Lead',
  });

  const getReq = createRequest('http://localhost/api/leads', { method: 'GET', token: tokenLead });
  const getRes = await getLeadsHandler(getReq);
  assert.equal(getRes.status, 403);
  const getData = await getRes.json();
  assert.match(getData.error, /acesso negado/i);

  const postReq = createRequest('http://localhost/api/leads', { method: 'POST', body: {}, token: tokenLead });
  const postRes = await postLeadsHandler(postReq);
  assert.equal(postRes.status, 403);
  const postData = await postRes.json();
  assert.match(postData.error, /acesso negado/i);
});

test('leads filtra a listagem pelo corretor logado e retorna leads mapeados (200)', async () => {
  const tokenCorretor = signToken({
    uid: 'corretor-42',
    email: 'corretor42@teste.com',
    role: 'corretor',
    nome_completo: 'Corretor 42',
  });

  let filtrosAplicados = [];
  const mockSupabase = createMockSupabase({
    leads: {
      execute: (state) => {
        filtrosAplicados = state.filters;
        return {
          data: [
            {
              id: 'lead-1',
              nome: 'Lead Um',
              telefone: '85999990001',
              email: 'lead1@teste.com',
              faixa_orcamento: 'Até R$ 300 mil',
              tipo_imovel: 'Apartamento',
              etapa: 'novo',
              criado_em: '2026-10-01T10:00:00Z',
              atualizado_em: '2026-10-01T10:00:00Z',
            },
          ],
          error: null,
        };
      },
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/leads', { method: 'GET', token: tokenCorretor });
  const res = await getLeadsHandler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.leads.length, 1);
  assert.equal(data.leads[0].nome, 'Lead Um');
  assert.equal(data.leads[0].faixaOrcamento, 'Até R$ 300 mil');

  assert.deepEqual(filtrosAplicados, [{ col: 'corretor_id', val: 'corretor-42' }]);
});

test('leads não restringe por corretor_id quando o usuário é administrador (200)', async () => {
  const tokenAdmin = signToken({
    uid: 'admin-1',
    email: 'admin@teste.com',
    role: 'admin_corretora',
    nome_completo: 'Administradora',
  });

  let filtrosAplicados = [];
  const mockSupabase = createMockSupabase({
    leads: {
      execute: (state) => {
        filtrosAplicados = state.filters;
        return { data: [], error: null };
      },
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/leads', { method: 'GET', token: tokenAdmin });
  const res = await getLeadsHandler(req);
  assert.equal(res.status, 200);

  const temFiltroCorretor = filtrosAplicados.some((f) => f.col === 'corretor_id');
  assert.equal(temFiltroCorretor, false);
});

test('leads valida payload na criação de novo lead e rejeita dados inválidos (400)', async () => {
  const tokenCorretor = signToken({
    uid: 'corretor-1',
    email: 'c@teste.com',
    role: 'corretor',
    nome_completo: 'Corretor',
  });

  const payloadSemNome = {
    telefone: '85999990001',
    email: 'cliente@teste.com',
    faixaOrcamento: 'Até R$ 300 mil',
    tipoImovel: 'Casa',
  };

  const req = createRequest('http://localhost/api/leads', {
    method: 'POST',
    body: payloadSemNome,
    token: tokenCorretor,
  });

  const res = await postLeadsHandler(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /nome/i);
});

test('leads cria lead associado ao corretor autenticado (201)', async () => {
  const tokenCorretor = signToken({
    uid: 'corretor-vip',
    email: 'vip@teste.com',
    role: 'corretor',
    nome_completo: 'Corretor VIP',
  });

  let registroInserido = null;
  const mockSupabase = createMockSupabase({
    leads: {
      single: (state) => {
        registroInserido = state.insertedData?.[0];
        return Promise.resolve({
          data: {
            id: 'lead-gerado-10',
            nome: registroInserido.nome,
            telefone: registroInserido.telefone,
            email: registroInserido.email,
            faixa_orcamento: registroInserido.faixa_orcamento,
            tipo_imovel: registroInserido.tipo_imovel,
            etapa: registroInserido.etapa,
            criado_em: '2026-10-15T12:00:00Z',
            atualizado_em: '2026-10-15T12:00:00Z',
          },
          error: null,
        });
      },
    },
  });
  setServerSupabaseClientOverride(mockSupabase);

  const req = createRequest('http://localhost/api/leads', {
    method: 'POST',
    body: {
      nome: 'Beatriz Costa',
      telefone: '85988887777',
      email: 'beatriz@teste.com',
      faixaOrcamento: 'R$ 500 mil – R$ 800 mil',
      tipoImovel: 'Apartamento',
    },
    token: tokenCorretor,
  });

  const res = await postLeadsHandler(req);
  assert.equal(res.status, 201);
  const data = await res.json();

  assert.equal(data.lead.nome, 'Beatriz Costa');
  assert.equal(data.lead.faixaOrcamento, 'R$ 500 mil – R$ 800 mil');
  assert.equal(registroInserido.corretor_id, 'corretor-vip');
  assert.equal(registroInserido.etapa, 'novo');
});

test('captura pública rejeita corpo inválido sem acessar o banco', async () => {
  for (const body of [null, [], {}, { nome: 'Ana' }]) {
    const req = createRequest('http://localhost/api/leads/public', { method: 'POST', body });
    const res = await publicLeadHandler(req);
    assert.equal(res.status, 400);
  }
});

test('captura pública atribui a corretor ativo e sempre inicia em Novo', async () => {
  let filtros = [];
  let inserido;
  setServerSupabaseClientOverride(createMockSupabase({
    perfis: {
      execute: (state) => {
        filtros = state.filters;
        return { data: [{ id: 'corretor-ativo' }], error: null };
      },
    },
    leads: {
      single: (state) => {
        inserido = state.insertedData[0];
        return { data: {
          id: 'lead-publico', ...inserido,
          criado_em: '2026-10-20T12:00:00Z', atualizado_em: '2026-10-20T12:00:00Z',
        }, error: null };
      },
    },
  }));
  const req = createRequest('http://localhost/api/leads/public', { method: 'POST', body: {
    nome: 'Ana Silva', telefone: '85999990000', email: 'ana@example.com',
    faixaOrcamento: 'Até R$ 300 mil', tipoImovel: 'Casa', etapa: 'fechado',
  } });
  const res = await publicLeadHandler(req);
  assert.equal(res.status, 201);
  assert.deepEqual(filtros, [{ col: 'role', val: 'corretor' }, { col: 'ativo', val: true }]);
  assert.equal(inserido.corretor_id, 'corretor-ativo');
  assert.equal(inserido.etapa, 'novo');
});

test('captura pública não insere lead quando não há corretor ativo', async () => {
  let houveInsert = false;
  setServerSupabaseClientOverride(createMockSupabase({
    perfis: { execute: () => ({ data: [], error: null }) },
    leads: { single: () => { houveInsert = true; return { data: null, error: null }; } },
  }));
  const req = createRequest('http://localhost/api/leads/public', { method: 'POST', body: {
    nome: 'Ana Silva', telefone: '85999990000', email: 'ana@example.com',
    faixaOrcamento: 'Até R$ 300 mil', tipoImovel: 'Casa',
  } });
  const res = await publicLeadHandler(req);
  assert.equal(res.status, 503);
  assert.equal(houveInsert, false);
});
