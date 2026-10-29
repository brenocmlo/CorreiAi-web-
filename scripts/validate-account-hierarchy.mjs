// Cria somente empresas/contas técnicas marcadas; suspende seus acessos ao terminar.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import jwt from 'jsonwebtoken';

const origin='https://correiai.vercel.app';
const adminId=process.argv.find(a=>a.startsWith('--admin-id='))?.slice(11);
if (!process.argv.includes('--allow-production-fixtures') || !/^[a-f0-9-]{36}$/i.test(adminId??'') || !process.env.JWT_SECRET) throw new Error('Informe --admin-id=<id verificado>, --allow-production-fixtures e JWT_SECRET no ambiente.');
const runId=`hierarchy-${Date.now()}`;
const rootCookie=`auth_token=${jwt.sign({uid:adminId,email:'validation@example.invalid',role:'super_admin',nome_completo:'Validação'},process.env.JWT_SECRET,{expiresIn:'15m'})}`;
const checks=[], companies=[], staff=[], properties=[], clients=[];
const password=()=>randomBytes(24).toString('base64url');
function check(name,actual,expected){assert.deepEqual(actual,expected,name);checks.push(name);console.log('OK '+name);}
async function call(path,{method='GET',body,cookie=rootCookie}={}){
 const res=await fetch(origin+path,{method,redirect:'manual',signal:AbortSignal.timeout(45000),headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {res,data:await res.clone().json().catch(()=>null)};
}
async function login(email,senha,label){
 const result=await call('/api/auth/login',{method:'POST',cookie:null,body:{email,senha}});check('login '+label,result.res.status,200);
 const cookie=result.res.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);return cookie;
}
async function company(label){
 const email=`${runId}-admin-${label}@example.invalid`,senha=password();
 const result=await call('/api/admin/imobiliarias',{method:'POST',body:{nome:`TESTE ${runId} ${label}`,administrador:{nome_completo:`TESTE ADMIN ${label}`,email,senha}}});
 check('liberar imobiliária '+label,result.res.status,201);
 const row={id:result.data.imobiliaria.id,adminId:result.data.imobiliaria.administrador_id,email};companies.push(row);
 row.cookie=await login(email,senha,'admin '+label);return row;
}
async function broker(company,label){
 const email=`${runId}-broker-${label}@example.invalid`,senha=password();
 const result=await call('/api/admin/corretores',{method:'POST',cookie:company.cookie,body:{nome_completo:`TESTE CORRETOR ${label}`,email,senha,cpf:'00000000000',creci:'TESTE-'+runId,imobiliaria_id:randomUUID(),role:'super_admin'}});
 check('imobiliária cria corretor '+label,result.res.status,201);
 const row={id:result.data.id,email,companyId:company.id,companyCookie:company.cookie};staff.push(row);
 row.cookie=await login(email,senha,'corretor '+label);return row;
}
let failure;
try {
 const me=await call('/api/auth/me');check('administrador geral verificado',me.data?.perfil?.role,'super_admin');
 for(const role of ['corretor','admin_corretora','super_admin']) check('cadastro público proíbe '+role,(await call('/api/auth/cadastro',{method:'POST',cookie:null,body:{nome_completo:'Fixture',email:`${runId}@example.invalid`,cpf:'00000000000',creci:'TESTE',senha:password(),role}})).res.status,403);
 const email=`${runId}-client@example.invalid`,senha=password();
 const client=await call('/api/auth/cadastro',{method:'POST',cookie:null,body:{nome_completo:'TESTE CLIENTE',email,senha,cpf:'00000000000',imobiliaria_id:randomUUID()}});
 check('cadastro público cria cliente',client.res.status,200);const clientCookie=client.res.headers.get('set-cookie').split(';')[0];
 const clientMe=await call('/api/auth/me',{cookie:clientCookie});check('cliente não ganhou função profissional',clientMe.data.perfil.role,'lead');clients.push({id:clientMe.data.perfil.id,email});
 check('cliente sem vínculo tem catálogo vazio',(await call('/api/imoveis',{cookie:clientCookie})).data.imoveis,[]);
 check('cliente não cria imobiliária',(await call('/api/admin/imobiliarias',{method:'POST',cookie:clientCookie,body:{}})).res.status,403);
 const a=await company('A'),b=await company('B');
 const a1=await broker(a,'A1'),a2=await broker(a,'A2'),b1=await broker(b,'B1');
 check('superadmin não cria corretor diretamente',(await call('/api/admin/corretores',{method:'POST',body:{}})).res.status,403);
 check('admin da imobiliária não libera outra empresa',(await call('/api/admin/imobiliarias',{method:'POST',cookie:a.cookie,body:{}})).res.status,403);
 check('corretor não cria equipe',(await call('/api/admin/corretores',{method:'POST',cookie:a1.cookie,body:{}})).res.status,403);
 const listA=await call('/api/admin',{cookie:a.cookie});check('equipe A somente próprios corretores',listA.data.map(u=>u.id).sort(),[a1.id,a2.id].sort());
 check('role do corretor não pode ser forjada',listA.data.every(u=>u.role==='corretor'),true);
 check('admin B não altera corretor A',(await call('/api/admin',{method:'PATCH',cookie:b.cookie,body:{userId:a1.id,ativo:false}})).res.status,404);
 check('admin não promove corretor',(await call('/api/admin',{method:'PATCH',cookie:a.cookie,body:{userId:a1.id,role:'admin_corretora'}})).res.status,400);
 check('suspender corretor da própria equipe',(await call('/api/admin',{method:'PATCH',cookie:a.cookie,body:{userId:a1.id,ativo:false}})).res.status,200);
 check('JWT antigo do corretor suspenso bloqueado',(await call('/api/imoveis',{cookie:a1.cookie})).res.status,401);
 check('reativar corretor',(await call('/api/admin',{method:'PATCH',cookie:a.cookie,body:{userId:a1.id,ativo:true}})).res.status,200);
 const created=await call('/api/imoveis',{method:'POST',cookie:a1.cookie,body:{tipo:'casa',endereco:`TESTE ${runId}`,bairro:'Validação',valor:100000,status:'disponivel',imobiliaria_id:b.id,proprietario_id:b1.id}});
 check('corretor A cria imóvel na empresa A',created.res.status,201);const id=created.data.imovel.id;properties.push({id,cookie:a1.cookie});
 check('colega A2 vê imóvel da mesma imobiliária',(await call('/api/imoveis',{cookie:a2.cookie})).data.imoveis.map(p=>p.id),[id]);
 check('empresa B não vê imóvel de A',(await call('/api/imoveis',{cookie:b1.cookie})).data.imoveis,[]);
 check('empresa B não edita imóvel de A',(await call(`/api/imoveis/${id}`,{method:'PATCH',cookie:b1.cookie,body:{valor:1}})).res.status,404);
 check('empresa B não recomenda imóvel de A',(await call('/api/imoveis/recomendacoes?tipoImovel=Casa',{cookie:b1.cookie})).data.imoveis,[]);
 check('cliente não recebe imóvel da empresa A',(await call('/api/imoveis',{cookie:clientCookie})).data.imoveis,[]);
 check('imobiliária não suspende outra empresa',(await call('/api/admin/imobiliarias',{method:'PATCH',cookie:a.cookie,body:{id:b.id,ativo:false}})).res.status,403);
 check('superadmin suspende empresa A',(await call('/api/admin/imobiliarias',{method:'PATCH',body:{id:a.id,ativo:false}})).res.status,200);
 check('admin A perde acesso com JWT antigo',(await call('/api/admin',{cookie:a.cookie})).res.status,401);
 check('corretor A perde acesso com JWT antigo',(await call('/api/imoveis',{cookie:a1.cookie})).res.status,401);
 check('empresa B segue ativa',(await call('/api/imoveis',{cookie:b1.cookie})).res.status,200);
 check('superadmin reativa empresa A',(await call('/api/admin/imobiliarias',{method:'PATCH',body:{id:a.id,ativo:true}})).res.status,200);
 check('acesso da equipe A restaurado',(await call('/api/imoveis',{cookie:a1.cookie})).res.status,200);
} catch(err){failure=err;console.error(err.message);}
finally {
 for(const row of properties)try{check('limpar imóvel técnico',(await call(`/api/imoveis/${row.id}`,{method:'DELETE',cookie:row.cookie})).res.status,200);}catch(err){failure??=err;}
 for(const row of staff)try{check('suspender corretor técnico',(await call('/api/admin',{method:'PATCH',cookie:row.companyCookie,body:{userId:row.id,ativo:false}})).res.status,200);}catch(err){failure??=err;}
 for(const row of companies)try{check('suspender empresa técnica',(await call('/api/admin/imobiliarias',{method:'PATCH',body:{id:row.id,ativo:false}})).res.status,200);}catch(err){failure??=err;}
 await mkdir('.git/validation',{recursive:true});
 const result={runId,origin,checks,companies:companies.map(({id,adminId,email})=>({id,adminId,email})),staff:staff.map(({id,email,companyId})=>({id,email,companyId})),clients,failure:failure?.message??null};
 await writeFile('.git/validation/account-hierarchy-production.json',JSON.stringify(result,null,2));console.log(JSON.stringify({checks:checks.length,passed:!failure}));
}
if(failure)process.exitCode=1;
