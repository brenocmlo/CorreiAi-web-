import assert from 'node:assert/strict';
import test from 'node:test';

import { ownerFilter, parseLeadDetails, parseLeadStage } from '../src/lib/lead-input.ts';
import { ETAPAS_FUNIL } from '../src/types/lead.ts';

const valid = {
  nome: ' Ana Souza ',
  telefone: ' 85999999999 ',
  email: ' ana@example.com ',
  faixaOrcamento: 'Até R$ 300 mil',
  tipoImovel: 'Casa',
};

test('cadastro normaliza campos e não aceita corretor informado pelo cliente', () => {
  assert.deepEqual(parseLeadDetails({ ...valid, corretor_id: 'outro-usuario', id: 'forjado' }), {
    data: { ...valid, nome: 'Ana Souza', telefone: '85999999999', email: 'ana@example.com' },
  });
});

test('campos obrigatórios devem ser strings não vazias', () => {
  assert.match(parseLeadDetails({ ...valid, nome: ' ' }).error, /nome/i);
  assert.match(parseLeadDetails({ ...valid, telefone: 123 }).error, /telefone/i);
  assert.match(parseLeadDetails(null).error, /campos/i);
});

test('edição parcial aceita apenas campos de contato e rejeita payload vazio', () => {
  assert.deepEqual(parseLeadDetails({ telefone: ' 85111111111 ', corretor_id: 'outro' }, { partial: true }), {
    data: { telefone: '85111111111' },
  });
  assert.match(parseLeadDetails({ corretor_id: 'outro' }, { partial: true }).error, /campo/i);
});

test('todas as consultas de leads são filtradas pelo corretor do JWT', () => {
  const filters = [];
  const query = { eq(column, value) { filters.push([column, value]); return this; } };
  assert.equal(query.eq(...ownerFilter('uid-do-corretor')), query);
  assert.deepEqual(filters, [['corretor_id', 'uid-do-corretor']]);
});

test('mudança de etapa aceita somente uma etapa conhecida e nenhum outro campo', () => {
  const etapas = ETAPAS_FUNIL.map((etapa) => etapa.id);
  for (const etapa of etapas) {
    assert.deepEqual(parseLeadStage({ etapa }, etapas), { data: etapa });
  }
  assert.match(parseLeadStage({ etapa: 'inexistente' }, etapas).error, /etapa/i);
  assert.match(parseLeadStage({ etapa: 'novo', corretor_id: 'outro' }, etapas).error, /campo/i);
  assert.match(parseLeadStage({}, etapas).error, /etapa/i);
});
