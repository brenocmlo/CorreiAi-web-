import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import nextTesting from 'next/experimental/testing/server';
const { unstable_doesMiddlewareMatch: doesProxyMatch } = nextTesting;

process.env.JWT_SECRET = 'route-security-offline-fixture-secret-12345';
const { proxy, config } = await import('../src/proxy.ts');
const { signToken } = await import('../src/lib/jwt.ts');
const { setServerSupabaseClientOverride } = await import('../src/lib/supabase.ts');
const { canAccessPage, homeForRole } = await import('../src/lib/auth-policy.ts');
const origin = 'https://correiai.vercel.app';
const org = '22222222-2222-4222-8222-222222222222';

function fixture(role = 'corretor', ativo = true) {
  setServerSupabaseClientOverride({ from(table) {
    return { select() { return this; }, eq() { return this; }, async maybeSingle() {
      return { data: table === 'perfis' ? { id: 'fixture', role, ativo, imobiliaria_id: org } : { id: org, ativo: true }, error: null };
    } };
  } });
  return signToken({ uid: 'fixture', role, email: 'fixture@example.invalid', nome_completo: 'Fixture' });
}
function request(path, { method = 'GET', headers = {}, token } = {}) {
  return new NextRequest(origin + path, { method, headers: { ...headers, ...(token ? { Cookie: `auth_token=${token}` } : {}) } });
}
afterEach(() => setServerSupabaseClientOverride(null));

test('todas as APIs passam pela proteção de origem do proxy', () => {
  for (const path of ['/api/auth/login', '/api/auth/cadastro', '/api/auth/logout', '/api/admin/corretores', '/api/imoveis/fixture', '/api/leads/fixture/etapa', '/api/assistente']) {
    assert.equal(doesProxyMatch({ config, nextConfig: {}, url: origin + path }), true, path);
  }
});

test('alterações rejeitam origens externas antes de consultar o banco', async () => {
  setServerSupabaseClientOverride({ from() { assert.fail('Não consultar banco para origem inválida'); } });
  for (const [method, path] of [['POST', '/api/auth/login'], ['POST', '/api/auth/cadastro'], ['POST', '/api/admin/corretores'], ['PATCH', '/api/leads/fixture/etapa'], ['DELETE', '/api/imoveis/fixture']]) {
    const res = await proxy(request(path, { method, headers: { Origin: 'https://external.invalid' } }));
    assert.equal(res.status, 403, path);
    assert.match(res.headers.get('cache-control'), /no-store/);
  }
});

test('subdomínio e origem null não podem alterar dados por formulário', async () => {
  for (const headers of [{ Origin: 'https://other.correiai.vercel.app' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }, { 'Sec-Fetch-Site': 'same-site' }]) {
    assert.equal((await proxy(request('/api/admin', { method: 'PATCH', headers }))).status, 403);
  }
  assert.equal((await proxy(request('/api/admin', { method: 'PATCH', headers: { Host: 'external.invalid', Origin: 'https://external.invalid' } }))).status, 403);
});

test('API da mesma origem preserva o POST e deixa autenticação para o handler', async () => {
  const res = await proxy(request('/api/auth/logout', { method: 'POST', headers: { Origin: origin, 'Sec-Fetch-Site': 'same-origin' } }));
  assert.equal(res.headers.get('x-middleware-next'), '1');
  assert.equal(res.headers.has('location'), false);
  assert.match(res.headers.get('cache-control'), /no-store/);
});

test('cliente de API sem headers de navegador continua até a autorização do handler', async () => {
  for (const method of ['GET', 'POST']) {
    const res = await proxy(request('/api/leads', { method }));
    assert.equal(res.headers.get('x-middleware-next'), '1');
  }
});

test('área privada sem sessão redireciona para login sem cache', async () => {
  for (const path of ['/dashboard', '/imoveis', '/leads/novo', '/funil', '/admin/imobiliarias']) {
    const res = await proxy(request(path));
    assert.equal(res.headers.get('location'), origin + '/login');
    assert.match(res.headers.get('cache-control'), /no-store/);
  }
});

test('todos os perfis chegam à sua página inicial e respeitam a hierarquia', async () => {
  for (const role of ['lead', 'corretor', 'admin_corretora', 'super_admin']) {
    const token = fixture(role);
    const res = await proxy(request(homeForRole(role), { token }));
    assert.equal(res.headers.get('x-middleware-next'), '1', role);
    for (const path of ['/admin', '/admin/novo-corretor', '/admin/imobiliarias', '/leads', '/funil', '/imoveis/novo']) {
      const response = await proxy(request(path, { token }));
      assert.equal(response.headers.has('location'), !canAccessPage(role, path), `${role}: ${path}`);
    }
  }
});

test('JWT antigo não concede acesso se o perfil foi suspenso ou rebaixado', async () => {
  const token = fixture('admin_corretora');
  fixture('corretor');
  assert.equal((await proxy(request('/admin/novo-corretor', { token }))).headers.get('location'), origin + '/dashboard');
  fixture('corretor', false);
  const res = await proxy(request('/imoveis', { token }));
  assert.equal(res.headers.get('location'), origin + '/login');
  assert.equal(res.cookies.get('auth_token').maxAge, 0);
});
