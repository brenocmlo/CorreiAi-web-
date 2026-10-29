// Opt-in explícito para fixtures de produção. Não lê nem altera dados de contas existentes.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const origin = process.argv.find(a => a.startsWith('--origin='))?.slice(9);
if (origin !== 'https://correiai.vercel.app' || !process.argv.includes('--allow-production-fixtures')) {
  throw new Error('Use --origin=https://correiai.vercel.app --allow-production-fixtures para autorizar o teste isolado.');
}
const runId = `security-${Date.now()}`;
const checks = []; const accounts = []; const properties = []; const leads = [];
let uploadedFixture = null;
async function publicStorageClient(cookie) {
  const html = await (await fetch(origin+'/imoveis/novo',{headers:{Cookie:cookie}})).text();
  const sources = [...new Set([...html.matchAll(/src="([^\"]+\.js[^\"]*)"/g)].map(m=>m[1]))];
  for (const source of sources.filter(s=>s.startsWith('/_next/static/'))) {
    const code = await (await fetch(origin+source)).text();
    const publishable = code.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
    const anon = [...code.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)].map(m=>m[0]).find(token=>{
      try { return JSON.parse(Buffer.from(token.split('.')[1],'base64url')).role==='anon'; } catch { return false; }
    });
    if (publishable || anon) return createClient('https://sadnfebpklwgxerzgfqc.supabase.co',publishable||anon,{auth:{persistSession:false,autoRefreshToken:false}});
  }
  throw new Error('Não localizei a chave pública no bundle para testar o upload real.');
}
async function call(path, { method = 'GET', body, cookie, redirect = 'follow' } = {}) {
  const res = await fetch(origin + path, { method, redirect, signal: AbortSignal.timeout(45000),
    headers: { ...(body ? {'Content-Type':'application/json'} : {}), ...(cookie ? {Cookie:cookie} : {}) },
    ...(body ? {body:JSON.stringify(body)} : {}) });
  const data = await res.clone().json().catch(() => null);
  return {res, data};
}
function check(name, actual, expected) {
  assert.deepEqual(actual, expected, name); checks.push({name, passed:true}); console.log(`OK ${name}`);
}
async function signup(label) {
  const senha = randomBytes(24).toString('base64url');
  const email = `${runId}-${label}@example.invalid`;
  const {res} = await call('/api/auth/cadastro', {method:'POST', body:{nome_completo:`TESTE ISOLAMENTO ${label}`,email,cpf:'00000000000',creci:`TESTE-${runId}-${label}`,senha,role:'corretor',imobiliaria_id:randomUUID()}});
  check(`cadastro ${label}`,res.status,200);
  const cookie = res.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie);
  const me = await call('/api/auth/me',{cookie}); check(`sessão ${label}`,me.res.status,200);
  const account = {id:me.data.perfil.id,email,cookie}; accounts.push(account);
  const login = await call('/api/auth/login',{method:'POST',body:{email,senha}});check(`login ${label}`,login.res.status,200);
  return account;
}
let failure;
try {
  check('catálogo sem sessão', (await call('/api/imoveis')).res.status,401);
  check('página privada redireciona', (await call('/imoveis',{redirect:'manual'})).res.status,307);
  check('recomendações sem sessão', (await call('/api/imoveis/recomendacoes?tipoImovel=Casa')).res.status,401);
  const a = await signup('A'); const b = await signup('B');
  for (const account of [a,b]) check(`conta ${account === a ? 'A' : 'B'} começa vazia`,(await call('/api/imoveis',{cookie:account.cookie})).data.imoveis,[]);
  const created = await call('/api/imoveis',{method:'POST',cookie:a.cookie,body:{tipo:'casa',endereco:`TESTE ${runId}`,bairro:'Teste isolado',valor:100000,status:'disponivel',proprietario_id:b.id,imobiliaria_id:randomUUID()}});
  check('criar imóvel próprio',created.res.status,201); const id=created.data.imovel.id; properties.push({id,cookie:a.cookie});
  check('dono vê seu imóvel',(await call('/api/imoveis',{cookie:a.cookie})).data.imoveis.map(p=>p.id),[id]);
  check('outra conta continua vazia',(await call('/api/imoveis',{cookie:b.cookie})).data.imoveis,[]);
  for (const method of ['GET','PATCH','DELETE']) check(`${method} de outra conta bloqueado`,(await call(`/api/imoveis/${id}`,{method,cookie:b.cookie,...(method==='PATCH'?{body:{valor:1}}:{})})).res.status,404);
  check('recomendação não vaza para B',(await call('/api/imoveis/recomendacoes?tipoImovel=Casa',{cookie:b.cookie})).data.imoveis,[]);
  check('recomendação própria funciona',(await call('/api/imoveis/recomendacoes?tipoImovel=Casa',{cookie:a.cookie})).data.imoveis.map(p=>p.id),[id]);
  check('editar próprio imóvel',(await call(`/api/imoveis/${id}`,{method:'PATCH',cookie:a.cookie,body:{valor:110000}})).res.status,200);
  const lead = await call('/api/leads',{method:'POST',cookie:a.cookie,body:{nome:`TESTE ${runId}`,email:`${runId}@example.invalid`,telefone:'85000000000',faixaOrcamento:'Até R$ 300 mil',tipoImovel:'Casa'}});
  check('criar lead próprio',lead.res.status,201); const leadId = lead.data.lead.id;leads.push({id:leadId,cookie:a.cookie});
  check('lead de A inacessível para B',(await call(`/api/leads/${leadId}`,{cookie:b.cookie})).res.status,404);
  check('Kanban de A atualiza',(await call(`/api/leads/${leadId}/etapa`,{method:'PATCH',cookie:a.cookie,body:{etapa:'em_atendimento'}})).res.status,200);
  check('Kanban de B bloqueado',(await call(`/api/leads/${leadId}/etapa`,{method:'PATCH',cookie:b.cookie,body:{etapa:'fechado'}})).res.status,404);
  check('cadastro não ganhou admin',(await call('/api/admin',{cookie:a.cookie})).res.status,403);
  check('captura anônima não encaminha para empresa aleatória',(await call('/api/leads/public',{method:'POST',body:{}})).res.status,401);
  const upload = await call('/api/imoveis/upload-url',{method:'POST',cookie:a.cookie,body:{name:'fixture.png',type:'image/png',size:68}});
  check('upload autorizado na própria pasta',upload.res.status,200);
  assert.ok(upload.data.path.startsWith(a.id+'/'));
  check('imagem de A não pode ser assinada por B',(await call(`/api/imoveis/imagem?path=${encodeURIComponent(upload.data.path)}`,{cookie:b.cookie})).res.status,404);
  check('imagem exige sessão',(await call(`/api/imoveis/imagem?path=${encodeURIComponent(upload.data.path)}`)).res.status,401);
  const storage = await publicStorageClient(a.cookie);
  for (const table of ['imoveis','perfis','leads','imobiliarias']) {
    const result = await storage.from(table).select('id').limit(1);
    check(`SDK público sem acesso a ${table}`,Boolean(result.error),true);
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64');
  const sent = await storage.storage.from('imoveis_imagens').uploadToSignedUrl(upload.data.path,upload.data.token,png,{contentType:'image/png'});
  check('upload real de PNG',sent.error,null); uploadedFixture = {path:upload.data.path,bytes:png.length};
  const imageUrl = `/api/imoveis/imagem?path=${encodeURIComponent(upload.data.path)}`;
  check('vincular imagem própria',(await call(`/api/imoveis/${id}`,{method:'PATCH',cookie:a.cookie,body:{imagem_url:imageUrl}})).res.status,200);
  const signed = await call(imageUrl,{cookie:a.cookie,redirect:'manual'});
  check('imagem própria autorizada',signed.res.status,302);
  const image = await fetch(signed.res.headers.get('location'));
  check('download privado da imagem',image.status,200);
  check('conteúdo da imagem',Buffer.from(await image.arrayBuffer()).equals(png),true);
  check('imagem pública antiga bloqueada',(await fetch(`https://sadnfebpklwgxerzgfqc.supabase.co/storage/v1/object/public/imoveis_imagens/${upload.data.path}`)).ok,false);
  check('outra conta não lê imagem vinculada',(await call(imageUrl,{cookie:b.cookie})).res.status,404);
  check('logout',(await call('/api/auth/logout',{method:'POST',cookie:a.cookie})).res.status,200);
} catch (error) { failure = error; console.error(error.message); }
finally {
  for (const row of leads) check('limpar lead exclusivo de validação',(await call(`/api/leads/${row.id}`,{method:'DELETE',cookie:row.cookie})).res.status,200);
  for (const row of properties) check('limpar imóvel exclusivo de validação',(await call(`/api/imoveis/${row.id}`,{method:'DELETE',cookie:row.cookie})).res.status,200);
  await mkdir('.git/validation',{recursive:true});
  await writeFile('.git/validation/catalog-isolation-production.json',JSON.stringify({runId,origin,checks,accounts:accounts.map(({id,email})=>({id,email})),uploadedFixture,failure:failure?.message??null},null,2));
  console.log(JSON.stringify({checks:checks.length,accounts:accounts.map(({id,email})=>({id,email})),passed:!failure}));
}
if (failure) process.exitCode=1;
