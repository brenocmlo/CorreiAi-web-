import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { assistantFixture, ORG_A } from './helpers/assistant-fixture.mjs';
process.env.JWT_SECRET = 'isolated-lead-chat-flow-fixture-secret-123456';
const { setServerSupabaseClientOverride } = await import(
  '../src/lib/supabase.ts'
);
const register = await import('../src/app/api/auth/cadastro/route.ts');
const login = await import('../src/app/api/auth/login/route.ts');
const me = await import('../src/app/api/auth/me/route.ts');
const assistant = await import('../src/app/api/assistente/route.ts');
const properties = await import('../src/app/api/imoveis/route.ts');
const admin = await import('../src/app/api/admin/route.ts');
const origin = 'https://fixture.invalid';
function request(path, method, body, cookie = '') {
  return new NextRequest(origin + path, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test('cliente se cadastra, faz login e conversa; vínculo libera só a empresa certa, sem poderes de corretor', async () => {
  const db = assistantFixture();
  setServerSupabaseClientOverride(db);
  try {
    const credentials = {
      email: 'cliente-fluxo@example.invalid',
      senha: 'senha-isolada-12345',
    };
    const created = await register.POST(
      request('/api/auth/cadastro', 'POST', {
        ...credentials,
        nome_completo: 'Cliente do teste isolado',
        cpf: '12345678901',
        role: 'lead',
        imobiliaria_id: ORG_A,
      }),
    );
    assert.equal(created.status, 200);
    const profile = db.state.perfis.find((p) => p.email === credentials.email);
    assert.equal(profile.role, 'lead');
    assert.equal(profile.imobiliaria_id, null);
    const authenticated = await login.POST(
      request('/api/auth/login', 'POST', credentials),
    );
    assert.equal(authenticated.status, 200);
    const cookie = authenticated.headers.get('set-cookie').split(';')[0];
    const user = await (
      await me.GET(request('/api/auth/me', 'GET', null, cookie))
    ).json();
    assert.equal(user.perfil.role, 'lead');
    assert.equal(user.perfil.senha_hash, undefined);
    const messages = [
      { role: 'user', text: 'Quero comprar casa no Centro até 300 mil' },
    ];
    let data = await (
      await assistant.POST(
        request('/api/assistente', 'POST', { messages }, cookie),
      )
    ).json();
    assert.deepEqual(data.imoveis, []);
    assert.equal(data.contexto.restrictionReason, 'company_required');
    // Simula somente em memória um vínculo legítimo já autorizado pela imobiliária.
    profile.imobiliaria_id = ORG_A;
    data = await (
      await assistant.POST(
        request('/api/assistente', 'POST', { messages }, cookie),
      )
    ).json();
    assert.equal(data.imoveis.length, 2);
    assert.equal(data.contexto.company.telefone, '85999990000');
    assert.ok(data.imoveis.every((p) => !p.endereco.includes('OUTRA EMPRESA')));
    assert.equal(
      (
        await properties.POST(
          request('/api/imoveis', 'POST', { tipo: 'casa' }, cookie),
        )
      ).status,
      403,
    );
    assert.equal(
      (await admin.GET(request('/api/admin', 'GET', null, cookie))).status,
      403,
    );
    const contact = await (
      await assistant.POST(
        request(
          '/api/assistente',
          'POST',
          {
            messages: [
              ...messages,
              { role: 'assistant', text: data.reply },
              { role: 'user', text: 'Quero falar com um corretor' },
            ],
          },
          cookie,
        ),
      )
    ).json();
    assert.match(contact.reply, /telefone/);
    assert.doesNotMatch(contact.reply, /Qual.*nome|Qual.*e-mail/i);
    assert.equal(contact.qualificacao.nome, profile.nome_completo);
    assert.equal(contact.qualificacao.email, profile.email);
  } finally {
    setServerSupabaseClientOverride(null);
  }
});
