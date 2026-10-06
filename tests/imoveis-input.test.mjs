import assert from 'node:assert/strict';
import test from 'node:test';

import { isUuid, parseImovelInput } from '../src/lib/imoveis-input.ts';

const imovel = {
  tipo: 'casa',
  endereco: ' Rua das Flores, 123 ',
  bairro: ' Centro ',
  valor: 250000,
  metragem: 80,
  quartos: 2,
  vagas: 1,
  status: 'disponivel',
  imagem_url: null,
};

test('aceita imóvel válido, normaliza texto e ignora campos controlados pelo servidor', () => {
  const result = parseImovelInput({ ...imovel, id: 'forjado', criado_em: 'ontem' });

  assert.deepEqual(result, {
    data: { ...imovel, endereco: 'Rua das Flores, 123', bairro: 'Centro' },
  });
});

test('rejeita campos obrigatórios vazios e valores fora do esquema', () => {
  assert.match(parseImovelInput({ ...imovel, endereco: ' ' }).error, /endereço/i);
  assert.match(parseImovelInput({ ...imovel, tipo: 'hotel' }).error, /tipo/i);
  assert.match(parseImovelInput({ ...imovel, status: 'reservado' }).error, /status/i);
  assert.match(parseImovelInput({ ...imovel, valor: -1 }).error, /valor/i);
  assert.match(parseImovelInput({ ...imovel, quartos: 1.5 }).error, /quartos/i);
});

test('edição aceita campos parciais válidos, mas não atualização vazia', () => {
  assert.deepEqual(parseImovelInput({ valor: 300000 }, { partial: true }), {
    data: { valor: 300000 },
  });
  assert.match(parseImovelInput({}, { partial: true }).error, /campo/i);
});

test('identificadores de imóvel inválidos são rejeitados antes da consulta', () => {
  assert.equal(isUuid('9c839930-4d66-4a36-a8b9-96e72253536d'), true);
  assert.equal(isUuid('imovel-qualquer'), false);
});
