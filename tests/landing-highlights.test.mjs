import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {assistantFixture,BROKER_A} from './helpers/assistant-fixture.mjs';
import {setServerSupabaseClientOverride} from '../src/lib/supabase.ts';
import {GET as highlights} from '../src/app/api/imoveis/destaque/route.ts';
import {GET as catalog} from '../src/app/api/imoveis/route.ts';
import {signToken} from '../src/lib/jwt.ts';
import {GET as image} from '../src/app/api/imoveis/imagem/route.ts';
import {storedImageUrl} from '../src/lib/private-images.ts';
afterEach(()=>setServerSupabaseClientOverride(null));
test('vitrine pública mostra somente imóveis disponíveis marcados explicitamente',async()=>{
 const db=assistantFixture();setServerSupabaseClientOverride(db);
 db.state.imoveis[0].destaque_landing=true;
 db.state.imoveis[1].destaque_landing=true;db.state.imoveis[1].status='vendido';
 db.state.imoveis[2].destaque_landing=false;
 const res=await highlights();assert.equal(res.status,200);const body=await res.json();
 assert.deepEqual(body.imoveis.map(p=>p.id),[db.state.imoveis[0].id]);
 assert.equal('proprietario_id' in body.imoveis[0],false);
 assert.equal('imobiliaria_id' in body.imoveis[0],false);
});
test('nenhum destaque autorizado significa vitrine pública vazia',async()=>{
 const db=assistantFixture();setServerSupabaseClientOverride(db);
 assert.deepEqual((await(await highlights()).json()).imoveis,[]);
});
test('catálogo autenticado preserva destaque para edição não despublicar imóvel sem intenção',async()=>{
 const db=assistantFixture();setServerSupabaseClientOverride(db);db.state.imoveis[0].destaque_landing=true;
 const cookie=signToken({uid:BROKER_A,role:'corretor',nome_completo:'Fixture',email:'fixture@example.invalid'});
 const res=await catalog(new NextRequest('https://fixture.invalid/api/imoveis',{headers:{Cookie:'auth_token='+cookie}}));
 assert.equal(res.status,200);const body=await res.json();
 assert.equal(body.imoveis.find(p=>p.id===db.state.imoveis[0].id).destaque_landing,true);
});
test('imagem de destaque é pública também para visitante já autenticado em outra empresa',async()=>{
 const db=assistantFixture();setServerSupabaseClientOverride(db);
 const publicRow=db.state.imoveis[2];publicRow.destaque_landing=true;
 const path=`${publicRow.proprietario_id}/public.jpg`;publicRow.imagem_url=storedImageUrl(path);
 db.storage={from(){return{async createSignedUrl(){return{data:{signedUrl:'https://storage.example.invalid/public.jpg'},error:null}}}}};
 for(const cookie of ['',signToken({uid:BROKER_A,role:'corretor',nome_completo:'Fixture',email:'fixture@example.invalid'})]){
  const res=await image(new NextRequest('https://fixture.invalid/api/imoveis/imagem?path='+encodeURIComponent(path),{headers:{Cookie:'auth_token='+cookie}}));
  assert.equal(res.status,302);
 }
});
test('imagem privada de outra empresa continua bloqueada',async()=>{
 const db=assistantFixture();setServerSupabaseClientOverride(db);
 const row=db.state.imoveis[2];row.destaque_landing=false;
 const path=`${row.proprietario_id}/private.jpg`;row.imagem_url=storedImageUrl(path);
 const cookie=signToken({uid:BROKER_A,role:'corretor',nome_completo:'Fixture',email:'fixture@example.invalid'});
 const res=await image(new NextRequest('https://fixture.invalid/api/imoveis/imagem?path='+encodeURIComponent(path),{headers:{Cookie:'auth_token='+cookie}}));
 assert.equal(res.status,404);
});
