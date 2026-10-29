import assert from 'node:assert/strict';
import test from 'node:test';

import { recomendarImoveis } from '../src/lib/recomendacao.ts';

const access = {uid:'fixture-owner',role:'corretor',imobiliariaId:null};
function createMockSupabase({data=null,error=null}={}) {
  const query = { select(){return this}, eq(field,value){
    if(field==='proprietario_id') assert.equal(value,access.uid);
    else { assert.equal(field,'status'); assert.equal(value,'disponivel'); }
    return this;
  }, order(){return this}, then(resolve){return Promise.resolve({data,error}).then(resolve)} };
  return {from(table){assert.equal(table,'imoveis');return query}};
}

const baseImovel = {
  id: 'imovel-1',
  tipo: 'Apartamento',
  endereco: 'Rua das Flores, 100',
  bairro: 'Aldeota',
  valor: 400000,
  metragem: 80,
  quartos: 3,
  vagas: 2,
  imagem_url: 'https://exemplo.com/foto.jpg',
  status: 'disponivel',
};

test('calcula pontuação por tipo (+3), faixa de orçamento (+3 ou +1) e bairro (+2)', async () => {
  const imoveis = [
    // Bate tipo (+3), faixa exata (+3), bairro (+2) => total 8
    { ...baseImovel, id: '1', tipo: 'Apartamento', valor: 400000, bairro: 'Aldeota' },
    // Bate tipo (+3) e bairro (+2) => total 5
    { ...baseImovel, id: '2', tipo: 'Apartamento', valor: 900000, bairro: 'Aldeota' },
    // Bate tipo (+3) e faixa com margem de 20% (faixa máx 500k + 20% = 600k) => 3 + 1 = 4
    { ...baseImovel, id: '3', tipo: 'Apartamento', valor: 550000, bairro: 'Meireles' },
    // Bate apenas bairro (+2) => total 2
    { ...baseImovel, id: '4', tipo: 'Casa', valor: 900000, bairro: 'Aldeota' },
    // Não bate nenhum critério => pontuação 0 (deve ser filtrado)
    { ...baseImovel, id: '5', tipo: 'Terreno', valor: 950000, bairro: 'Centro' },
  ];

  const client = createMockSupabase({ data: imoveis });
  const prefs = {
    tipoImovel: 'Apartamento',
    faixaOrcamento: 'R$ 300 mil – R$ 500 mil',
    bairro: 'Aldeota',
  };

  const recomendados = await recomendarImoveis(prefs, client, access);

  assert.equal(recomendados.length, 4);
  assert.equal(recomendados[0].id, '1');
  assert.equal(recomendados[0].pontuacao, 8);
  assert.equal(recomendados[1].id, '2');
  assert.equal(recomendados[1].pontuacao, 5);
  assert.equal(recomendados[2].id, '3');
  assert.equal(recomendados[2].pontuacao, 4);
  assert.equal(recomendados[3].id, '4');
  assert.equal(recomendados[3].pontuacao, 2);
  assert.ok(!recomendados.some((i) => i.id === '5'));
});

test('ordena resultados por pontuação decrescente', async () => {
  const imoveis = [
    { ...baseImovel, id: 'baixo', tipo: 'Casa', valor: 1000000, bairro: 'Meireles' }, // +2 bairro = 2
    { ...baseImovel, id: 'alto', tipo: 'Casa', valor: 250000, bairro: 'Meireles' }, // +3 tipo, +3 faixa, +2 bairro = 8
    { ...baseImovel, id: 'medio', tipo: 'Casa', valor: 250000, bairro: 'Centro' }, // +3 tipo, +3 faixa = 6
  ];

  const client = createMockSupabase({ data: imoveis });
  const recomendados = await recomendarImoveis(
    { tipoImovel: 'Casa', faixaOrcamento: 'Até R$ 300 mil', bairro: 'Meireles' },
    client, access
  );

  assert.deepEqual(
    recomendados.map((i) => ({ id: i.id, pontuacao: i.pontuacao })),
    [
      { id: 'alto', pontuacao: 8 },
      { id: 'medio', pontuacao: 6 },
      { id: 'baixo', pontuacao: 5 },
    ]
  );
});

test('limita o resultado a no máximo 5 recomendações', async () => {
  const imoveis = Array.from({ length: 8 }, (_, idx) => ({
    ...baseImovel,
    id: `imovel-${idx + 1}`,
    tipo: 'Casa',
    valor: 200000,
    bairro: 'Aldeota',
  }));

  const client = createMockSupabase({ data: imoveis });
  const recomendados = await recomendarImoveis({ tipoImovel: 'Casa' }, client, access);

  assert.equal(recomendados.length, 5);
});

test('retorna lista vazia quando o Supabase retorna erro ou dados nulos', async () => {
  const clientComErro = createMockSupabase({ error: new Error('Erro de conexão com o banco') });
  const resultadoErro = await recomendarImoveis({ tipoImovel: 'Casa' }, clientComErro, access);
  assert.deepEqual(resultadoErro, []);

  const clientComDadosNulos = createMockSupabase({ data: null });
  const resultadoNulo = await recomendarImoveis({ tipoImovel: 'Casa' }, clientComDadosNulos, access);
  assert.deepEqual(resultadoNulo, []);
});

test('retorna lista vazia quando nenhum imóvel tem pontuação positiva', async () => {
  const imoveis = [
    { ...baseImovel, id: '1', tipo: 'Terreno', valor: 900000, bairro: 'Centro' },
  ];

  const client = createMockSupabase({ data: imoveis });
  const resultado = await recomendarImoveis(
    { tipoImovel: 'Apartamento', faixaOrcamento: 'Até R$ 300 mil', bairro: 'Aldeota' },
    client, access
  );

  assert.deepEqual(resultado, []);
});

test('nunca recomenda imóveis indisponíveis ou sem identificador válido', async () => {
  const imoveis = [
    { ...baseImovel, id: 'disponivel', tipo: 'Casa', status: 'disponivel' },
    { ...baseImovel, id: 'vendido', tipo: 'Casa', status: 'vendido' },
    { ...baseImovel, id: 'alugado', tipo: 'Casa', status: 'alugado' },
    { ...baseImovel, id: '', tipo: 'Casa', status: 'disponivel' },
  ];
  const client = createMockSupabase({ data: imoveis });
  const resultado = await recomendarImoveis({ tipoImovel: 'Casa' }, client, access);
  assert.deepEqual(resultado.map((item) => item.id), ['disponivel']);
});

test('sem preferências não consulta o banco nem recomenda imóveis arbitrários', async () => {
  const client = { from: () => { throw new Error('Não deveria consultar o banco'); } };
  assert.deepEqual(await recomendarImoveis({}, client), []);
});
