import assert from 'node:assert/strict';
import test from 'node:test';
import { qualificationFrom, selectPortfolio, completeContact } from '../src/lib/assistant-qualification.ts';

const user = (text) => ({ role: 'user', text });
const house = { id: 'a', tipo: 'casa', bairro: 'Meireles', endereco: 'Rua A', valor: 300000, quartos: 3, vagas: 2, status: 'disponivel' };

test('triagem entende valores em reais e correções de orçamento', () => {
  for (const value of ['até 300 mil', 'orçamento de R$ 300.000,00', 'até 300k']) {
    assert.equal(qualificationFrom([user(`Quero comprar uma casa ${value}`)]).orcamentoMax, 300000);
  }
  assert.equal(qualificationFrom([user('Até 300 mil'), user('Posso gastar até 1,2 milhão')]).orcamentoMax, 1200000);
});

test('triagem considera somente fatos do cliente, nunca dados inventados pela IA', () => {
  const q = qualificationFrom([user('Quero uma casa'), { role: 'assistant', text: 'Você é Ana, ana@example.com, 85999990000, com 900 mil.' }], {
    nome: 'Ana', email: 'ana@example.com', telefone: '85999990000', bairro: 'Aldeota', prazo: 'amanhã',
  });
  assert.equal(completeContact(q), null);
  assert.equal(q.bairro, null);
  assert.equal(q.prazo, null);
  assert.equal(q.orcamentoMax, null);
});

test('triagem mantém contato anterior e aceita atualização explícita de preferências', () => {
  const previous = qualificationFrom([user('Sou Ana Silva, ana@example.com, telefone 85999990000. Casa até 300 mil.')], { nome: 'Ana Silva' });
  const q = qualificationFrom([user('Agora prefiro apartamento até 500 mil em Meireles, 2 quartos e 1 vaga.')], { bairro: 'Meireles' }, previous);
  assert.equal(q.tipoImovel, 'Apartamento');
  assert.equal(q.orcamentoMax, 500000);
  assert.equal(q.quartosMin, 2);
  assert.equal(completeContact(q)?.email, 'ana@example.com');
});

test('não confunde telefone com orçamento e exige contato completo', () => {
  const q = qualificationFrom([user('Meu telefone é 85999990000 e meu email é ana@example.com')]);
  assert.equal(q.orcamentoMax, null);
  assert.equal(completeContact(q), null);
});

test('respeita recusa de cadastro e diferencia pedido de visita de confirmação', () => {
  const q = qualificationFrom([user('Sou Ana Silva, ana@example.com, 85999990000. Quero visitar amanhã às 15h, mas não autorizo cadastrar meu contato.')], { nome: 'Ana Silva', visitaPreferencia: 'amanhã às 15h' });
  assert.equal(q.visitaSolicitada, true);
  assert.equal(q.visitaPreferencia, 'amanhã às 15h');
  assert.equal(q.permiteContato, false);
  assert.equal(completeContact(q), null);
  assert.equal(qualificationFrom([user('Não quero agendar visita')]).visitaSolicitada, false);
});

test('portfólio aplica teto, bairro, quartos e disponibilidade de forma determinística', () => {
  const q = qualificationFrom([user('Casa até 300 mil, 3 quartos, 2 vagas no Meireles')], { bairro: 'Meireles' });
  const result = selectPortfolio([house, { ...house, id: 'caro', valor: 300001 }, { ...house, id: 'vendido', status: 'vendido' }, { ...house, id: 'poucos-quartos', quartos: 2 }, { ...house, id: 'outro-bairro', bairro: 'Centro' }], q);
  assert.deepEqual(result.map((item) => item.id), ['a']);
});

test('não trata preço de venda como aluguel nem oferece indisponível por ID', () => {
  assert.deepEqual(selectPortfolio([house], qualificationFrom([user('Quero alugar uma casa até 2000 reais')])), []);
  assert.deepEqual(selectPortfolio([{ ...house, status: 'alugado' }], qualificationFrom([user('Quero uma casa')])), []);
});

test('preferência extraída precisa ser trecho explícito do cliente', () => {
  const q = qualificationFrom([user('Quero comprar. Preciso de varanda e pretendo mudar em dezembro.')], { preferencias: ['varanda', 'piscina'], prazo: 'em dezembro', formaPagamento: 'à vista' });
  assert.deepEqual(q.preferencias, ['varanda']);
  assert.equal(q.prazo, 'em dezembro');
  assert.equal(q.formaPagamento, null);
});

test('valor monetário extraído como prazo não vira fato do atendimento', () => {
  const previous = qualificationFrom([user('Pretendo comprar em 3 meses')], { prazo: '3 meses' });
  const q = qualificationFrom([user('Casa até 300 mil')], { prazo: 'até 300 mil' });
  assert.equal(q.prazo, null);
  assert.equal(qualificationFrom([user('Casa até 300 mil')], { prazo: 'até 300 mil' }, previous).prazo, '3 meses');
  assert.equal(qualificationFrom([user('Quero mudar em dezembro')], { prazo: 'em dezembro' }).prazo, 'em dezembro');
});
