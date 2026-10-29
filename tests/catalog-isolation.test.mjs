import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'catalog-isolation-test-secret-32-characters';
const { signToken } = await import('../src/lib/jwt.ts');
const { setServerSupabaseClientOverride } = await import('../src/lib/supabase.ts');
const list = await import('../src/app/api/imoveis/route.ts');
const detail = await import('../src/app/api/imoveis/[id]/route.ts');
const recommendations = await import('../src/app/api/imoveis/recomendacoes/route.ts');
const images = await import('../src/app/api/imoveis/imagem/route.ts');
const upload = await import('../src/app/api/imoveis/upload-url/route.ts');
const { imageObjectPath } = await import('../src/lib/private-images.ts');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ORG = '33333333-3333-4333-8333-333333333333';
const ID = '44444444-4444-4444-8444-444444444444';
const OTHER = '55555555-5555-4555-8555-555555555555';

function db({ org = null, active = true, role = 'corretor', rows = [] } = {}) {
  return { from(table) {
    const filters = []; let alternatives; let inserted; let update; let deleted;
    const q = {
      select() { return this; }, order() { return this; }, limit() { return this; },
      eq(k,v) { filters.push([k,v]); return this; },
      or(value) { alternatives = value.split(',').map(s => { const [k,,v] = s.split('.'); return [k,v]; }); return this; },
      insert(value) { inserted = value; return this; },
      update(value) { update = value; return this; }, delete() { deleted = true; return this; },
      result() {
        if (table === 'perfis') return { data: {id:A, role, ativo:active, imobiliaria_id:org}, error:null };
        if (inserted) return {data:{id:ID,...inserted},error:null};
        const selected = rows.filter(r => filters.every(([k,v]) => r[k] === v) && (!alternatives || alternatives.some(([k,v]) => r[k] === v)));
        return {data:selected.map(r => update ? {...r,...update} : r), error:null};
      },
      maybeSingle() { const r = this.result(); return Promise.resolve({...r,data:Array.isArray(r.data) ? r.data[0] ?? null : r.data}); },
      single() { return this.maybeSingle(); },
      then(resolve,reject) { return Promise.resolve(this.result()).then(resolve,reject); }
    }; return q;
  }};
}
function req(path = '/api/imoveis', method = 'GET', body, role = 'corretor') {
  const token = signToken({uid:A,email:'fixture@example.invalid',nome_completo:'Fixture',role});
  return new NextRequest(`http://localhost${path}`, {method, headers:{cookie:`auth_token=${token}`,'Content-Type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
}
afterEach(() => setServerSupabaseClientOverride(null));
const property = {id:ID,proprietario_id:B,imobiliaria_id:null,tipo:'casa',endereco:'Fixture',bairro:'Centro',valor:100,status:'disponivel'};
const context = {params:Promise.resolve({id:ID})};

test('catálogo anônimo não expõe imóveis', async () => {
  setServerSupabaseClientOverride(db({rows:[property]}));
  assert.equal((await list.GET(new NextRequest('http://localhost/api/imoveis'))).status,401);
});
test('conta nova sem imobiliária começa vazia, inclusive imóveis legados', async () => {
  setServerSupabaseClientOverride(db({rows:[property,{...property,id:OTHER,proprietario_id:null}]}));
  assert.deepEqual((await (await list.GET(req())).json()).imoveis,[]);
});
test('lista somente próprios ou da imobiliária verificada no banco', async () => {
  setServerSupabaseClientOverride(db({org:ORG,rows:[property,{...property,id:OTHER,imobiliaria_id:ORG},{...property,id:A,proprietario_id:A}]}));
  const res = await list.GET(req());
  assert.deepEqual((await res.json()).imoveis.map(r=>r.id).sort(),[OTHER,A].sort());
});
test('GET, PATCH e DELETE não alcançam imóvel de outra conta', async () => {
  setServerSupabaseClientOverride(db({rows:[property]}));
  for (const method of ['GET','PATCH','DELETE']) {
    assert.equal((await detail[method](req(`/api/imoveis/${ID}`,method,method === 'PATCH' ? {valor:200} : undefined),context)).status,404);
  }
});
test('cadastro ignora proprietário e imobiliária enviados pelo cliente', async () => {
  setServerSupabaseClientOverride(db());
  const res = await list.POST(req('/api/imoveis','POST',{...property,proprietario_id:B,imobiliaria_id:ORG}));
  assert.equal(res.status,201);
  const { imovel } = await res.json();
  assert.equal(imovel.proprietario_id,A);
  assert.equal(imovel.imobiliaria_id,null);
});
test('sessão desativada e role obsoleta no JWT não autorizam escrita', async () => {
  setServerSupabaseClientOverride(db({active:false}));
  assert.equal((await list.GET(req())).status,401);
  setServerSupabaseClientOverride(db({role:'lead'}));
  assert.equal((await list.POST(req('/api/imoveis','POST',property,'super_admin'))).status,403);
});

test('recomendações respeitam proprietário e imobiliária', async () => {
  setServerSupabaseClientOverride(db({rows:[property,{...property,id:OTHER,proprietario_id:A}]}));
  const res = await recommendations.GET(req('/api/imoveis/recomendacoes?tipoImovel=Casa'));
  assert.deepEqual((await res.json()).imoveis.map(r=>r.id),[OTHER]);
});
test('imagem de outra conta não pode obter URL assinada, nem por caminho conhecido', async () => {
  setServerSupabaseClientOverride(db());
  const path = `${B}/${ID}.png`;
  assert.equal((await images.GET(req(`/api/imoveis/imagem?path=${path}`))).status,404);
  assert.equal((await images.GET(new NextRequest(`http://localhost/api/imoveis/imagem?path=${path}`))).status,401);
});
test('imagem própria usa assinatura curta e resposta sem cache público', async () => {
  const client = db(); let signed;
  client.storage = {from(){return {async createSignedUrl(path,seconds){signed={path,seconds};return {data:{signedUrl:'https://storage.example.invalid/signed-image'},error:null};}}}};
  setServerSupabaseClientOverride(client);
  const path = `${A}/${ID}.png`;
  const res = await images.GET(req(`/api/imoveis/imagem?path=${path}`));
  assert.equal(res.status,302);
  assert.deepEqual(signed,{path,seconds:60});
  assert.match(res.headers.get('cache-control'),/private, no-store/);
});
test('upload exige perfil atual de corretor e gera caminho na própria pasta', async () => {
  const client = db(); let path;
  client.storage = {from(){return {async createSignedUploadUrl(value){path=value;return {data:{token:'fixture-upload-token'},error:null};}}}};
  setServerSupabaseClientOverride(client);
  const body = {name:'fixture.png',type:'image/png',size:100};
  assert.equal((await upload.POST(req('/api/imoveis/upload-url','POST',body))).status,200);
  assert.ok(path.startsWith(A+'/'));
  setServerSupabaseClientOverride(db({role:'lead'}));
  assert.equal((await upload.POST(req('/api/imoveis/upload-url','POST',body))).status,403);
});
test('referência de imagem não aceita path traversal nem host externo', () => {
  for (const value of ['/api/imoveis/imagem?path=../segredo.png','/api/imoveis/imagem?path=%2e%2e/segredo.png','https://external.invalid/a.png']) assert.equal(imageObjectPath(value),null);
});
