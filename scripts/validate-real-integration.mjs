// Opt-in: creates temporary rows/files, exercises localhost and removes only its fixtures.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

nextEnv.loadEnvConfig(process.cwd(), true);
assert.equal(process.env.CORREIAI_RUN_REAL_TESTS, '1', 'Set CORREIAI_RUN_REAL_TESTS=1 to authorize temporary fixtures.');
const base = process.env.CORREIAI_TEST_URL || 'http://127.0.0.1:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'The application target must be localhost.');
const project = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(project).hostname, 'sadnfebpklwgxerzgfqc.supabase.co', 'Unexpected Supabase project.');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const db = createClient(project, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anon = createClient(project, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const run = `QA-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
const output = path.resolve(execFileSync('git', ['rev-parse', '--git-path', 'validation'], { encoding: 'utf8' }).trim());
await mkdir(output, { recursive: true });
const reportFile = path.join(output, 'real-integration-latest.json');
const report = { run, startedAt: new Date().toISOString(), target: base, checks: [], cleanup: [], skipped: ['Conversa real OpenRouter adiada pelo usuário; nenhuma chamada paga realizada.'] };
const fixtures = { profiles: [], leads: [], imoveis: [], files: [] };

async function save() {
  await writeFile(reportFile, JSON.stringify({ ...report, fixtures }, null, 2));
}
function check(name, condition, detail) {
  report.checks.push({ name, passed: Boolean(condition), ...(detail ? { detail } : {}) });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}`);
  assert.ok(condition, name);
}
async function api(route, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(base + route, {
    method, redirect: 'manual', signal: AbortSignal.timeout(30_000),
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null; try { data = JSON.parse(text); } catch { /* HTML pages */ }
  return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0], setCookie: response.headers.get('set-cookie') };
}
async function account(role, label) {
  const email = `${run.toLowerCase()}-${label}@example.invalid`;
  const name = `${run} ${label}`;
  const password = randomBytes(24).toString('base64url');
  const payload = { nome_completo: name, email, cpf: randomBytes(6).readUIntBE(0, 6).toString().slice(0, 11).padEnd(11, '0'), creci: role === 'corretor' ? 'TESTE-QA' : null, role, senha: password };
  fixtures.profiles.push({ email, name }); // Registered before HTTP to recover partial signup failures.
  await save();
  const result = await api('/api/auth/cadastro', { method: 'POST', body: payload });
  check(`${label}: cadastro persistido e cookie`, result.status === 200 && Boolean(result.cookie), `HTTP ${result.status}`);
  const session = await api('/api/auth/me', { cookie: result.cookie });
  check(`${label}: sessão sem senha/hash`, session.status === 200 && session.data?.perfil?.email === email && !('senha_hash' in session.data.perfil));
  const id = session.data.perfil.id;
  fixtures.profiles.at(-1).id = id;
  if (role === 'corretor') {
    const { error } = await db.from('perfis').update({ ativo: false }).eq('id', id).eq('email', email);
    assert.ifError(error);
  }
  check(`${label}: senha incorreta recusada`, (await api('/api/auth/login', { method: 'POST', body: { email, senha: password + '-wrong' } })).status === 401);
  const login = await api('/api/auth/login', { method: 'POST', body: { email: email.toUpperCase(), senha: password } });
  check(`${label}: login normaliza e-mail`, login.status === 200 && Boolean(login.cookie));
  check(`${label}: e-mail duplicado recusado`, (await api('/api/auth/cadastro', { method: 'POST', body: payload })).status === 409);
  return { id, email, cookie: login.cookie };
}
async function cleanup() {
  // Every deletion includes the exact ID/path and a marker owned by this run.
  for (const item of fixtures.leads) {
    const { error } = await db.from('leads').delete().eq('id', item.id).eq('email', item.email);
    assert.ifError(error);
  }
  for (const item of fixtures.imoveis) {
    const { error } = await db.from('imoveis').delete().eq('id', item.id).like('endereco', `${run}%`);
    assert.ifError(error);
  }
  if (fixtures.files.length) {
    const { error } = await db.storage.from('imoveis_imagens').remove(fixtures.files);
    assert.ifError(error);
    for (const file of fixtures.files) {
      const folder = path.posix.dirname(file), name = path.posix.basename(file);
      const { data, error: listError } = await db.storage.from('imoveis_imagens').list(folder, { search: name });
      assert.ifError(listError);
      assert.ok(!data.some((item) => item.name === name), 'Storage fixture remains.');
    }
  }
  for (const fixture of fixtures.profiles) {
    const { data: profiles, error } = await db.from('perfis').select('id').eq('email', fixture.email).eq('nome_completo', fixture.name);
    assert.ifError(error);
    for (const profile of profiles) {
      const { count, error: linkError } = await db.from('leads').select('id', { count: 'exact', head: true }).eq('corretor_id', profile.id);
      assert.ifError(linkError);
      assert.equal(count, 0, 'Refusing to delete a profile that has unrelated leads.');
      const { error: deleteError } = await db.from('perfis').delete().eq('id', profile.id).eq('email', fixture.email).eq('nome_completo', fixture.name);
      assert.ifError(deleteError);
    }
    const { count, error: countError } = await db.from('perfis').select('id', { count: 'exact', head: true }).eq('email', fixture.email);
    assert.ifError(countError); assert.equal(count, 0);
  }
  for (const table of ['leads', 'imoveis']) {
    const column = table === 'leads' ? 'nome' : 'endereco';
    const { count, error } = await db.from(table).select('id', { count: 'exact', head: true }).like(column, `${run}%`);
    assert.ifError(error); assert.equal(count, 0);
  }
  report.cleanup.push('Contas, leads, imóveis e objetos temporários removidos; ausência conferida.');
  console.log('PASS limpeza dos registros e objetos temporários');
}

try {
  check('Schema de imóveis completo e listagem pública', (await api('/api/imoveis')).status === 200);
  check('Sessão anônima recusada', (await api('/api/auth/me')).status === 401);
  check('Cadastro inválido recusado', (await api('/api/auth/cadastro', { method: 'POST', body: {} })).status === 400);
  check('Autocadastro administrativo recusado', (await api('/api/auth/cadastro', { method: 'POST', body: { role: 'super_admin' } })).status === 400);
  const a = await account('corretor', 'broker-a');
  const b = await account('corretor', 'broker-b');
  const client = await account('lead', 'client');
  for (const [route, method] of [['/api/leads', 'GET'], ['/api/imoveis', 'POST'], ['/api/imoveis/upload-url', 'POST']]) {
    check(`${route}: anônimo recusado`, (await api(route, { method, ...(method === 'POST' ? { body: {} } : {}) })).status === 401);
    check(`${route}: perfil lead recusado`, (await api(route, { method, cookie: client.cookie, ...(method === 'POST' ? { body: {} } : {}) })).status === 403);
  }
  check('Corretor sem acesso administrativo', (await api('/api/admin', { cookie: a.cookie })).status === 403);
  check('Corretor não cria outro corretor pelo endpoint administrativo', (await api('/api/admin/corretores', { method: 'POST', cookie: a.cookie, body: {} })).status === 403);
  for (const table of ['perfis', 'leads']) {
    const { data, error } = await anon.from(table).select('id').limit(1);
    check(`${table}: leitura direta anônima protegida`, Boolean(error) || data?.length === 0);
  }

  const svg = Buffer.from('<svg width="640" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="400" fill="#dbeafe"/><path d="M160 210 L320 80 L480 210 V340 H160 Z" fill="#3158ba"/><rect x="285" y="235" width="70" height="105" fill="#fff"/><text x="320" y="380" text-anchor="middle" font-size="22" font-family="sans-serif">IMOVEL DE TESTE - QA</text></svg>');
  const image = await sharp(svg).png().toBuffer();
  await writeFile(path.join(output, 'imovel-teste.png'), image);
  for (const metadata of [{ name: 'bad.gif', type: 'image/gif', size: image.length }, { name: 'big.png', type: 'image/png', size: 5242881 }]) {
    check(`Upload inválido recusado: ${metadata.name}`, (await api('/api/imoveis/upload-url', { method: 'POST', cookie: a.cookie, body: metadata })).status === 400);
  }
  let imageUrl;
  for (const format of ['png', 'jpeg', 'webp']) {
    const bytes = await sharp(image).toFormat(format).toBuffer();
    const signed = await api('/api/imoveis/upload-url', { method: 'POST', cookie: a.cookie, body: { name: `qa.${format}`, type: `image/${format}`, size: bytes.length } });
    check(`Upload ${format}: autorização limitada ao corretor`, signed.status === 200 && signed.data?.path?.startsWith(`${a.id}/`) && Boolean(signed.data.token));
    fixtures.files.push(signed.data.path); await save();
    const { error } = await anon.storage.from('imoveis_imagens').uploadToSignedUrl(signed.data.path, signed.data.token, bytes, { contentType: `image/${format}` });
    check(`Upload ${format}: arquivo enviado com token assinado`, !error, error?.message);
    const url = anon.storage.from('imoveis_imagens').getPublicUrl(signed.data.path).data.publicUrl;
    const downloaded = await fetch(url, { signal: AbortSignal.timeout(15000) });
    check(`Upload ${format}: imagem pública íntegra`, downloaded.status === 200 && Buffer.from(await downloaded.arrayBuffer()).equals(bytes));
    imageUrl ||= url;
  }
  const forbiddenPath = `${a.id}/${run}-anonymous.png`;
  fixtures.files.push(forbiddenPath);
  const denied = await anon.storage.from('imoveis_imagens').upload(forbiddenPath, image, { contentType: 'image/png' });
  check('Storage: upload anônimo sem token recusado', Boolean(denied.error));
  const changed = await anon.storage.from('imoveis_imagens').update(fixtures.files[0], image, { contentType: 'image/png' });
  check('Storage: alteração anônima recusada', Boolean(changed.error));
  await anon.storage.from('imoveis_imagens').remove([fixtures.files[0]]);
  const stillPublic = await fetch(imageUrl);
  check('Storage: exclusão anônima não remove a imagem', stillPublic.status === 200);

  const property = { tipo: 'casa', endereco: `${run} imóvel temporário`, bairro: run, valor: 250000, metragem: 120, quartos: 3, vagas: 2, status: 'disponivel', descricao: `${run} descrição`, imagem_url: imageUrl };
  const created = await api('/api/imoveis', { method: 'POST', cookie: a.cookie, body: property });
  check('Imóvel: cadastro com descrição e imagem', created.status === 201 && Boolean(created.data?.imovel?.id), `HTTP ${created.status}`);
  const propertyId = created.data.imovel.id;
  fixtures.imoveis.push({ id: propertyId }); await save();
  const detail = await api(`/api/imoveis/${propertyId}`);
  check('Imóvel: detalhe público preserva descrição e imagem', detail.status === 200 && detail.data?.imovel?.descricao === property.descricao && detail.data?.imovel?.imagem_url === imageUrl);
  check('Imóvel: listagem pública inclui cadastro', (await api('/api/imoveis')).data?.imoveis?.some((item) => item.id === propertyId));
  check('Imóvel: URL externa recusada', (await api(`/api/imoveis/${propertyId}`, { method: 'PATCH', cookie: a.cookie, body: { imagem_url: 'https://example.com/image.png' } })).status === 400);
  check('Imóvel: valor negativo recusado', (await api(`/api/imoveis/${propertyId}`, { method: 'PATCH', cookie: a.cookie, body: { valor: -1 } })).status === 400);
  check('Imóvel: edição persistida', (await api(`/api/imoveis/${propertyId}`, { method: 'PATCH', cookie: a.cookie, body: { valor: 255000, descricao: `${run} descrição editada` } })).data?.imovel?.valor === 255000);
  check('Imóvel: UUID inválido recusado', (await api('/api/imoveis/invalido')).status === 400);
  const query = new URLSearchParams({ tipoImovel: 'Casa', faixaOrcamento: 'Até R$ 300 mil', bairro: run });
  const recommendations = await api(`/api/imoveis/recomendacoes?${query}`);
  check('Recomendações: imóvel real bem pontuado e limite de cinco', recommendations.status === 200 && recommendations.data.imoveis.length <= 5 && recommendations.data.imoveis.some((item) => item.id === propertyId && item.pontuacao === 8));
  await api(`/api/imoveis/${propertyId}`, { method: 'PATCH', cookie: a.cookie, body: { status: 'vendido' } });
  check('Recomendações: vendido não é recomendado', !(await api(`/api/imoveis/recomendacoes?${query}`)).data.imoveis.some((item) => item.id === propertyId));
  check('Recomendações: filtro desconhecido recusado', (await api('/api/imoveis/recomendacoes?forbidden=true')).status === 400);

  const leadPayload = { nome: `${run} contato`, email: `${run.toLowerCase()}-lead@example.invalid`, telefone: '85900000000', faixaOrcamento: 'Até R$ 300 mil', tipoImovel: 'Casa', corretor_id: b.id };
  const leadCreated = await api('/api/leads', { method: 'POST', cookie: a.cookie, body: leadPayload });
  check('Lead: cadastro autenticado', leadCreated.status === 201 && Boolean(leadCreated.data?.lead?.id));
  const leadId = leadCreated.data.lead.id;
  fixtures.leads.push({ id: leadId, email: leadPayload.email }); await save();
  const owner = await db.from('leads').select('corretor_id').eq('id', leadId).single();
  check('Lead: proprietário definido pelo JWT, não pelo formulário', owner.data?.corretor_id === a.id);
  check('Lead: corretor vê seu contato', (await api('/api/leads', { cookie: a.cookie })).data.leads.some((item) => item.id === leadId));
  check('Lead: outro corretor não vê o contato', !(await api('/api/leads', { cookie: b.cookie })).data.leads.some((item) => item.id === leadId));
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    check(`Lead: ${method} de outro corretor recusado`, (await api(`/api/leads/${leadId}`, { method, cookie: b.cookie, ...(method === 'PATCH' ? { body: { nome: 'invasão' } } : {}) })).status === 404);
  }
  check('Lead: edição parcial válida', (await api(`/api/leads/${leadId}`, { method: 'PATCH', cookie: a.cookie, body: { telefone: '85911111111' } })).data?.lead?.telefone === '85911111111');
  for (const etapa of ['novo', 'em_atendimento', 'visita_agendada', 'proposta', 'fechado']) {
    check(`Funil: transição para ${etapa}`, (await api(`/api/leads/${leadId}/etapa`, { method: 'PATCH', cookie: a.cookie, body: { etapa } })).data?.lead?.etapa === etapa);
  }
  check('Funil: etapa inexistente recusada', (await api(`/api/leads/${leadId}/etapa`, { method: 'PATCH', cookie: a.cookie, body: { etapa: 'invalida' } })).status === 400);
  check('Funil: alteração de dono pela etapa recusada', (await api(`/api/leads/${leadId}/etapa`, { method: 'PATCH', cookie: a.cookie, body: { etapa: 'novo', corretor_id: b.id } })).status === 400);
  const dashboard = await api('/api/dashboard', { cookie: a.cookie });
  check('Dashboard: reflete o lead fechado do corretor', dashboard.status === 200 && dashboard.data.total === 1 && dashboard.data.taxaConversao === 100);
  const publicPayload = { ...leadPayload, nome: `${run} contato público`, email: `${run.toLowerCase()}-public@example.invalid`, etapa: 'fechado', corretor_id: b.id };
  const publicCreated = await api('/api/leads/public', { method: 'POST', body: publicPayload });
  check('Captura pública: cria contato com dados completos', publicCreated.status === 201 && Boolean(publicCreated.data?.lead?.id), `HTTP ${publicCreated.status}`);
  fixtures.leads.push({ id: publicCreated.data.lead.id, email: publicPayload.email }); await save();
  const publicRow = await db.from('leads').select('etapa,corretor_id').eq('id', publicCreated.data.lead.id).single();
  const activeOwner = await db.from('perfis').select('role,ativo').eq('id', publicRow.data.corretor_id).single();
  check('Captura pública: etapa Novo e corretor ativo', publicRow.data.etapa === 'novo' && activeOwner.data?.role === 'corretor' && activeOwner.data?.ativo === true);
  check('Captura pública: dados incompletos recusados', (await api('/api/leads/public', { method: 'POST', body: { nome: 'incompleto' } })).status === 400);
  check('Assistente: histórico inválido recusado sem provider', (await api('/api/assistente', { method: 'POST', body: { messages: [] } })).status === 400);
  if (!process.env.OPENROUTER_API_KEY) {
    check('Assistente: ausência de chave tratada sem erro interno', (await api('/api/assistente', { method: 'POST', body: { messages: [{ role: 'user', text: 'Olá' }] } })).status === 503);
  }
  check('Lead: exclusão pelo proprietário', (await api(`/api/leads/${leadId}`, { method: 'DELETE', cookie: a.cookie })).status === 200);
  check('Lead: excluído retorna 404', (await api(`/api/leads/${leadId}`, { cookie: a.cookie })).status === 404);
  check('Imóvel: exclusão autenticada', (await api(`/api/imoveis/${propertyId}`, { method: 'DELETE', cookie: a.cookie })).status === 200);
  check('Imóvel: excluído retorna 404', (await api(`/api/imoveis/${propertyId}`)).status === 404);
  const logout = await api('/api/auth/logout', { method: 'POST', cookie: a.cookie });
  check('Logout: cookie expirado', logout.status === 303 && /Max-Age=0/i.test(logout.setCookie || ''));
  report.result = 'PASS';
} catch (error) {
  report.result = 'FAIL'; report.error = error.message; process.exitCode = 1;
  console.error(`FAIL ${error.message}`);
} finally {
  try { await cleanup(); } catch (error) { report.cleanup.push({ error: error.message }); report.result = 'FAIL'; process.exitCode = 1; console.error(`FAIL limpeza: ${error.message}`); }
  report.finishedAt = new Date().toISOString(); await save();
  console.log(JSON.stringify({ result: report.result, passed: report.checks.filter((c) => c.passed).length, failed: report.checks.filter((c) => !c.passed).length, reportFile, imageFixture: path.join(output, 'imovel-teste.png') }));
}
