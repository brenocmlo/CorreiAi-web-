import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET='recommendation-route-test-secret-32-chars';
const { signToken } = await import('../src/lib/jwt.ts');
const token=signToken({uid:'fixture-owner',role:'corretor',email:'fixture@example.invalid',nome_completo:'Fixture'});
const { GET } = await import('../src/app/api/imoveis/recomendacoes/route.ts');
const { setServerSupabaseClientOverride } = await import('../src/lib/supabase.ts');

afterEach(() => setServerSupabaseClientOverride(null));

function mockDatabase(rows) {
  return {
    from(table) {
      if(table==='imobiliarias')return {select(){return this},eq(){return this},maybeSingle(){return Promise.resolve({data:{ativo:true},error:null})}};
      if (table==='perfis') return {select(){return this},eq(){return this},maybeSingle(){return Promise.resolve({data:{id:'fixture-owner',role:'corretor',ativo:true,imobiliaria_id:'33333333-3333-4333-8333-333333333333'},error:null})}};
      assert.equal(table, 'imoveis');
      const query = {
        select() { return this; },
        or() { return this; },
        eq() { return this; },
        order() { return this; },
        then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
      };
      return query;
    },
  };
}

test('API de recomendações rejeita filtros desconhecidos', async () => {
  const req = new NextRequest('http://localhost/api/imoveis/recomendacoes?tipoImovel=Fazenda');
  const res = await GET(req);
  assert.equal(res.status, 400);
});

test('API de recomendações retorna somente imóveis disponíveis do banco', async () => {
  const rows = [
    { id: 'casa-1', tipo: 'casa', endereco: 'Rua A', bairro: 'Aldeota', valor: 250000, status: 'disponivel' },
    { id: 'casa-2', tipo: 'casa', endereco: 'Rua B', bairro: 'Aldeota', valor: 250000, status: 'vendido' },
  ];
  setServerSupabaseClientOverride(mockDatabase(rows));
  const req = new NextRequest('http://localhost/api/imoveis/recomendacoes?tipoImovel=Casa&bairro=Aldeota',{headers:{Cookie:`auth_token=${token}`}});
  const res = await GET(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data.imoveis.map((item) => item.id), ['casa-1']);
  assert.equal(data.imoveis[0].pontuacao, 5);
});
