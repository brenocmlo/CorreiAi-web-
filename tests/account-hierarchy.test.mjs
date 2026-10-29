import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
process.env.JWT_SECRET='account-hierarchy-fixture-secret-with-32-chars';
const { signToken }=await import('../src/lib/jwt.ts');
const { setServerSupabaseClientOverride }=await import('../src/lib/supabase.ts');
const { parseRegistration }=await import('../src/lib/auth-input.ts');
const signup=await import('../src/app/api/auth/cadastro/route.ts');
const brokers=await import('../src/app/api/admin/corretores/route.ts');
const team=await import('../src/app/api/admin/route.ts');
const ID='11111111-1111-4111-8111-111111111111', ORG='22222222-2222-4222-8222-222222222222';
const OTHER='33333333-3333-4333-8333-333333333333', TARGET='44444444-4444-4444-8444-444444444444';
const input={nome_completo:'Ana Fixture',email:'ana@example.invalid',cpf:'00000000000',creci:'TESTE',senha:'fixture-secret-123'};
function req(path,method='GET',body,role='super_admin') {
 const token=signToken({uid:ID,email:'owner@example.invalid',nome_completo:'Fixture',role});
 return new NextRequest('http://localhost'+path,{method,headers:{Cookie:'auth_token='+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
}
function database({role='super_admin',org=ORG,active=true,companyActive=true,others=[]}={}) {
 const profiles=[{id:ID,role,ativo:active,imobiliaria_id:org},...others]; const calls=[];
 const db={calls,from(table){let action='read',payload;const filters=[];
  const q={select(){return this},order(){return this},limit(){return this},in(k,v){filters.push(r=>v.includes(r[k]));return this},eq(k,v){filters.push(r=>r[k]===v);return this},
   insert(value){action='insert';payload=Array.isArray(value)?value[0]:value;return this},update(value){action='update';payload=value;return this},
   result(single=false){
    let rows=(table==='perfis'?profiles:[{id:ORG,nome:'Fixture',ativo:companyActive},{id:OTHER,nome:'Outra',ativo:true}]).filter(r=>filters.every(f=>f(r)));
    if(action==='insert'){calls.push({table,payload});rows=[{id:TARGET,...payload}];}
    if(action==='update'){calls.push({table,payload,ids:rows.map(r=>r.id)});rows=rows.map(r=>({...r,...payload}));}
    return {data:single?(rows[0]??null):rows,error:null};
   },maybeSingle(){return Promise.resolve(this.result(true))},single(){return Promise.resolve(this.result(true))},then(ok,fail){return Promise.resolve(this.result()).then(ok,fail)}};return q;
 },async rpc(name,args){calls.push({rpc:name,args});return {data:{id:ORG,administrador_id:TARGET},error:null};}};
 setServerSupabaseClientOverride(db);return db;
}
afterEach(()=>setServerSupabaseClientOverride(null));

test('cadastro público aceita somente cliente, inclusive contra payload forjado', async()=>{
 assert.equal(parseRegistration({...input,role:'corretor'}),null);
 for(const role of ['corretor','admin_corretora','super_admin']) {
  setServerSupabaseClientOverride({from(){throw new Error('Não consultar banco para role proibida');}});
  const res=await signup.POST(new NextRequest('http://localhost/api/auth/cadastro',{method:'POST',body:JSON.stringify({...input,role})}));
  assert.equal(res.status,403);
 }
 assert.equal(parseRegistration({...input,role:'lead',imobiliaria_id:ORG}).role,'lead');
 assert.equal('imobiliaria_id' in parseRegistration({...input,role:'lead',imobiliaria_id:ORG}),false);
});
test('administrador geral não cadastra corretor pela API da imobiliária',async()=>{
 const db=database();const res=await brokers.POST(req('/api/admin/corretores','POST',input));
 assert.equal(res.status,403);assert.equal(db.calls.length,0);
});
test('imobiliária cria corretor na própria empresa, ignorando vínculo e role enviados',async()=>{
 const db=database({role:'admin_corretora'});
 const res=await brokers.POST(req('/api/admin/corretores','POST',{...input,role:'super_admin',imobiliaria_id:OTHER},'admin_corretora'));
 assert.equal(res.status,201);
 assert.equal(db.calls[0].payload.role,'corretor');assert.equal(db.calls[0].payload.imobiliaria_id,ORG);
 assert.notEqual(db.calls[0].payload.senha_hash,input.senha);
});
test('administrador da imobiliária não promove usuários nem altera outra empresa',async()=>{
 database({role:'admin_corretora',others:[{id:TARGET,role:'corretor',ativo:true,imobiliaria_id:OTHER}]});
 assert.equal((await team.PATCH(req('/api/admin','PATCH',{userId:TARGET,role:'admin_corretora'},'admin_corretora'))).status,400);
 assert.equal((await team.PATCH(req('/api/admin','PATCH',{userId:TARGET,ativo:false},'admin_corretora'))).status,404);
});
test('empresa suspensa e corretor sem vínculo não mantêm acesso com JWT antigo',async()=>{
 const { getAuthFromRequest }=await import('../src/lib/api-auth.ts');
 database({role:'corretor',companyActive:false});assert.equal(await getAuthFromRequest(req('/api/imoveis','GET',undefined,'corretor')),null);
 database({role:'corretor',org:null});assert.equal(await getAuthFromRequest(req('/api/imoveis','GET',undefined,'corretor')),null);
});
test('somente administrador geral pode criar e suspender imobiliárias',async()=>{
 const companies=await import('../src/app/api/admin/imobiliarias/route.ts');
 database({role:'admin_corretora'});
 assert.equal((await companies.POST(req('/api/admin/imobiliarias','POST',{},'admin_corretora'))).status,403);
 const db=database();
 const res=await companies.POST(req('/api/admin/imobiliarias','POST',{nome:'Imobiliária Fixture',administrador:{...input}}));
 assert.equal(res.status,201);assert.equal(db.calls[0].rpc,'provisionar_imobiliaria');
 assert.equal(db.calls[0].args.p_criado_por,ID);
 assert.notEqual(db.calls[0].args.p_senha_hash,input.senha);
});

test('gestão de equipe consulta somente corretores da própria imobiliária',async()=>{
 database({role:'admin_corretora',others:[{id:TARGET,role:'corretor',ativo:true,imobiliaria_id:OTHER},{id:OTHER,role:'corretor',ativo:true,imobiliaria_id:ORG}]});
 const res=await team.GET(req('/api/admin','GET',undefined,'admin_corretora'));
 assert.equal(res.status,200);assert.deepEqual((await res.json()).map(p=>p.id),[OTHER]);
});

test('imobiliária não acessa lista geral nem suspensão de outra empresa',async()=>{
 const companies=await import('../src/app/api/admin/imobiliarias/route.ts');
 database({role:'admin_corretora'});
 assert.equal((await companies.GET(req('/api/admin/imobiliarias','GET',undefined,'admin_corretora'))).status,403);
 assert.equal((await companies.PATCH(req('/api/admin/imobiliarias','PATCH',{id:OTHER,ativo:false},'admin_corretora'))).status,403);
});

test('provisionamento valida campos e preserva erro de duplicidade sem sucesso falso',async()=>{
 const companies=await import('../src/app/api/admin/imobiliarias/route.ts');
 const db=database();
 assert.equal((await companies.POST(req('/api/admin/imobiliarias','POST',{nome:'A',administrador:input}))).status,400);
 assert.equal(db.calls.length,0);
 db.rpc=async()=>({data:null,error:{code:'23505'}});
 assert.equal((await companies.POST(req('/api/admin/imobiliarias','POST',{nome:'Empresa teste',administrador:input}))).status,409);
});
