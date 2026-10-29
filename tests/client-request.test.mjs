import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, withRequestTimeout } from '../src/lib/client-request.ts';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('consulta interrompida sai do loading com erro compreensível', async () => {
  let signal;
  await assert.rejects(withRequestTimeout(s => { signal = s; return new Promise(() => {}); }, 10), /demorou/);
  assert.equal(signal.aborted, true);
});
test('timeout de gravação não afirma que o cadastro falhou', async () => {
  globalThis.fetch = async () => new Promise(() => {});
  await assert.rejects(requestJson('/api/imoveis', { method: 'POST' }, 10), /Confira.*lista.*antes/i);
});
test('timeout inclui leitura do corpo, e não só recebimento dos headers', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) });
  await assert.rejects(requestJson('/api/imoveis', {}, 10), /demorou/);
});
test('resposta HTTP de erro mantém mensagem da API', async () => {
  globalThis.fetch = async () => Response.json({ error: 'Não foi possível cadastrar o imóvel.' }, { status: 500 });
  await assert.rejects(requestJson('/api/imoveis', { method: 'POST' }), /Não foi possível cadastrar/);
});
test('resposta inválida não é apresentada como sucesso', async () => {
  globalThis.fetch = async () => new Response('<html>Login</html>');
  await assert.rejects(requestJson('/api/imoveis', { method: 'POST' }), /confirmar/);
});
test('resposta de cadastro confirmado devolve o corpo JSON', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push([url, options.method]); return Response.json({ imovel: { id: 'fixture' } }, { status: 201 }); };
  assert.equal((await requestJson('/api/imoveis', { method: 'POST' })).imovel.id, 'fixture');
  assert.deepEqual(calls, [['/api/imoveis', 'POST']]);
});
test('falha de conexão mostra mensagem em português e orienta contra duplicidade', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(requestJson('/api/imoveis', { method: 'POST' }), /Confira a lista.*evitar duplicidade/);
});
