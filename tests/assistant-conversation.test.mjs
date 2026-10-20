import assert from 'node:assert/strict';
import test from 'node:test';
import { qualificationFrom } from '../src/lib/assistant-qualification.ts';
import { conciseReply, groundedReply } from '../src/lib/assistant-prompt.ts';

const user = (text) => ({ role: 'user', text });
const bot = (text) => ({ role: 'assistant', text });
const house = { id: 'house', tipo: 'casa', endereco: 'Rua A', bairro: 'Meireles', valor: 300000, status: 'disponivel' };

test('resposta curta de orçamento usa a pergunta anterior sem confundir telefone', () => {
  const history = [user('Quero comprar apartamento'), bot('Qual é seu orçamento máximo?'), user('350 mil')];
  assert.equal(qualificationFrom(history).orcamentoMax, 350000);
  assert.equal(qualificationFrom([bot('Qual é seu telefone?'), user('85999990000')]).orcamentoMax, null);
});

test('intervalo de valores usa o teto e não interpreta número de quartos como dinheiro', () => {
  assert.equal(qualificationFrom([user('Quero gastar entre 250 e 350 mil')]).orcamentoMax, 350000);
  assert.equal(qualificationFrom([user('Apartamento até 2 quartos')]).orcamentoMax, null);
});

test('negações de objetivo e tipo não sobrescrevem a escolha positiva', () => {
  const q = qualificationFrom([user('Quero comprar apartamento, não alugar casa.')]);
  assert.equal(q.objetivo, 'comprar');
  assert.equal(q.tipoImovel, 'Apartamento');
});

test('comparação e indecisão não viram escolha definitiva de imóvel', () => {
  const previous = qualificationFrom([user('Quero uma casa até 300 mil')]);
  assert.equal(qualificationFrom([user('Qual a diferença entre casa e apartamento?')], {}, previous).tipoImovel, 'Casa');
  assert.equal(qualificationFrom([user('Ainda não sei se quero casa ou apartamento')]).tipoImovel, null);
});

test('quartos e vagas por extenso são compreendidos e bairro pode ser liberado', () => {
  const previous = qualificationFrom([user('Casa no Meireles')], { bairro: 'Meireles' });
  const q = qualificationFrom([user('Preciso de dois quartos e uma vaga. Agora não tenho preferência de bairro.')], {}, previous);
  assert.equal(q.quartosMin, 2);
  assert.equal(q.vagasMin, 1);
  assert.equal(q.bairro, null);
});

test('recusa de dados permite continuar tirando dúvidas sem repetir o aviso inteiro', () => {
  const q = qualificationFrom([user('Não quero passar meus dados nem receber contato.')]);
  const useful = 'Uma casa costuma oferecer mais autonomia. No apartamento, áreas comuns e regras de condomínio podem pesar na decisão.';
  const result = groundedReply(useful, q, [house], true, 'Qual a diferença entre morar em casa e apartamento?');
  assert.match(result, /[Cc]asas?/); assert.match(result, /[Aa]partamentos?/);
  assert.doesNotMatch(result, /não autoriza cadastro|informe seu nome/);
  assert.equal(q.permiteContato, false);
});

test('proteção do catálogo não apaga explicação geral sobre financiamento', () => {
  const q = qualificationFrom([user('Casa até 300 mil')]);
  const useful = 'Para encontrar um financiamento adequado, o banco analisa renda e documentação. A aprovação depende dessa análise.';
  assert.equal(groundedReply(useful, q, [], true, 'Como funciona financiar?'), useful);
});

test('confirmação inventada é removida sem apagar a parte útil da resposta', () => {
  const q = qualificationFrom([user('Quero uma casa')]);
  const result = groundedReply('Seus dados já estão registrados. Sobre a casa: o cadastro não informa condomínio; o corretor precisa confirmar.', q, [house], true, 'Tem condomínio?');
  assert.doesNotMatch(result, /já estão registrados/);
  assert.match(result, /não informa.*condomínio/);
});

test('pergunta geral sobre outros compradores não é tratada como acesso privado', () => {
  const q = qualificationFrom([user('Estou olhando imóveis')]);
  const useful = 'Outros compradores costumam comparar localização, orçamento e custos de manutenção. O que pesa mais para você?';
  assert.equal(groundedReply(useful, q, [], true, 'Como outros clientes escolhem o primeiro imóvel?'), useful);
});

test('comparação não generaliza que casas nunca têm condomínio', () => {
  const q = qualificationFrom([user('Quero uma casa')]);
  const result = groundedReply('Uma casa pode ser mais barata para manter, pois não há taxa de condomínio ou elevador para pagar.', q, [house], true, 'Qual a diferença entre casa e apartamento?');
  assert.doesNotMatch(result, /não há taxa de condomínio/);
  assert.match(result, /casas em condomínio/i);
});

test('comparação não promete que casas aceitam pets sem regras', () => {
  const q = qualificationFrom([user('Quero uma casa')]);
  const result = groundedReply('Em uma casa, você pode ter animais de estimação sem se preocupar com regras de condomínio.', q, [house], true, 'Compare casa e apartamento para trabalhar de casa.');
  assert.doesNotMatch(result, /sem se preocupar com regras/);
  assert.match(result, /pets/); assert.match(result, /trabalhar/);
});

test('perguntas de atributos desconhecidos esclarecem todos os itens perguntados', () => {
  const q = qualificationFrom([user('Quero casa até 350 mil')]);
  q.imovelInteresseId = house.id;
  const result = groundedReply('Não tenho o valor do condomínio.', q, [house], true, 'Tem elevador, aceita pet e qual o condomínio?');
  assert.match(result, /elevador/); assert.match(result, /pets/); assert.match(result, /condomínio/);
  assert.match(result, /confirmar/);
});

test('valor explicitamente recusado não amplia o orçamento', () => {
  const previous = qualificationFrom([user('Casa até 300 mil')]);
  assert.equal(qualificationFrom([user('Não quero gastar até 500 mil, isso fica muito caro.')], {}, previous).orcamentoMax, 300000);
});

test('resposta concisa preserva frases completas e pergunta final, sem cortar uma frase no meio', () => {
  const result = conciseReply('Há vários critérios úteis para comparar imóveis. '.repeat(80)+'Qual é sua prioridade?');
  assert.ok(result.length<=1800); assert.ok(result.split(/\s+/).length<=130);
  assert.ok(result.endsWith('Qual é sua prioridade?'));
  assert.equal(conciseReply('Olá!\nComo posso ajudar?'), 'Olá!\nComo posso ajudar?');
});

test('resposta truncada pelo provider descarta o trecho final incompleto', () => {
  const result = conciseReply('A escolha depende da rotina de cada pessoa. '.repeat(50)+'Portanto, é sempre');
  assert.ok(result.endsWith('.')); assert.doesNotMatch(result,/Portanto, é sempre/);
});
