// Opt-in: real conversational scenarios, small paid NeMo calls and isolated property fixtures.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd(), true);
assert.equal(process.env.CORREIAI_RUN_CONVERSATION_TESTS, '1', 'Set CORREIAI_RUN_CONVERSATION_TESTS=1 to authorize fixtures and small paid NeMo calls.');
const base = process.env.CORREIAI_TEST_URL || 'http://127.0.0.1:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'sadnfebpklwgxerzgfqc.supabase.co');
assert.equal(process.env.OPENROUTER_MODEL || 'mistralai/mistral-nemo', 'mistralai/mistral-nemo');
assert.ok(process.env.OPENROUTER_API_KEY);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const run = `QA-DIALOG-${randomUUID().slice(0, 8)}`;
const output = path.resolve(execFileSync('git', ['rev-parse', '--git-path', 'validation'], { encoding: 'utf8' }).trim());
await mkdir(output, { recursive: true });
const reportFile = path.join(output, 'assistant-conversations-latest.json');
const properties = [
  { id: randomUUID(), tipo: 'casa', endereco: `${run} Casa`, bairro: 'Meireles', valor: 250000, quartos: 3, vagas: 2, metragem: 100, status: 'disponivel', descricao: 'Casa de teste com varanda.' },
  { id: randomUUID(), tipo: 'apartamento', endereco: `${run} Apartamento`, bairro: 'Meireles', valor: 280000, quartos: 2, vagas: 1, metragem: 65, status: 'disponivel', descricao: 'Apartamento de teste com varanda.' },
];
const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const claimsContact = (s) => /(?:informe|envie|passe|preciso de|qual).{0,35}(?:nome|telefone|e-mail|email)/.test(normalize(s));
const scenarios = [
  { id: 'saudacao', turns: ['Oi, tudo bem?'], assess: (r) => [['Saudação sem cobrar contato', !claimsContact(r.reply)]] },
  { id: 'indecisao', turns: ['Quero meu primeiro imóvel, mas estou perdido e ainda não sei se quero casa ou apartamento.'], assess: (r) => [['Não inventa escolha na indecisão', r.qualificacao.tipoImovel === null], ['Ajuda a descobrir uma prioridade', /rotina|espaco|priorid|importa|necessidade|prefere|orcamento/.test(normalize(r.reply))]] },
  { id: 'orcamento-curto', turns: ['Quero comprar apartamento no Meireles. Antes de escolher opções, qual informação você precisa sobre o orçamento?', '350 mil'], assess: (r) => [['Entende resposta curta no contexto', r.qualificacao.orcamentoMax === 350000 && r.qualificacao.tipoImovel === 'Apartamento']] },
  { id: 'comparacao', turns: ['Quero comprar casa até 350 mil no Meireles.', 'Antes de decidir, qual a diferença entre casa e apartamento para quem trabalha de casa?'], assess: (r) => [['Comparação não troca a escolha anterior', r.qualificacao.tipoImovel === 'Casa'], ['Explica diferenças sem reiniciar o cadastro', /casa/.test(normalize(r.reply)) && /apartamento/.test(normalize(r.reply)) && /espaco|condominio|manutencao|privacidade|autonomia|regras/.test(normalize(r.reply))]] },
  { id: 'objecao', turns: ['Quero comprar uma casa até 300 mil no Meireles.', 'Gostei, mas ainda está caro para mim e tenho medo de me apertar. O que podemos fazer?'], assess: (r) => [['Objeção não aumenta o teto', r.qualificacao.orcamentoMax === 300000], ['Acolhe objeção e discute alternativas', /entend|compreend|receio|preocupa|limite|orcamento|priorid/.test(normalize(r.reply)) && /rever|ajust|alternativ|menor|localiza|bairro|espaco|avaliar|corretor/.test(normalize(r.reply))]] },
  { id: 'negacao', turns: ['Quero comprar apartamento, não alugar casa. Meu teto é de 350 mil no Meireles, preciso de dois quartos e uma vaga.'], assess: (r) => [['Entende objetivo e preferências com negação', r.qualificacao.objetivo === 'comprar' && r.qualificacao.tipoImovel === 'Apartamento' && r.qualificacao.quartosMin === 2 && r.qualificacao.vagasMin === 1]] },
  { id: 'recusa-e-duvida', turns: ['Quero comprar casa até 350 mil no Meireles, mas não quero passar meus dados nem receber contato.', 'Tudo bem. Mesmo assim, me explique a diferença entre casa e apartamento.'], assess: (r) => [['Recusa não impede esclarecimento posterior', r.qualificacao.permiteContato === false && /casa/.test(normalize(r.reply)) && /apartamento/.test(normalize(r.reply)) && !claimsContact(r.reply)]] },
  { id: 'caracteristicas', turns: ['Quero apartamento até 350 mil no Meireles. Nesse apartamento de teste há elevador, aceita pet e qual o condomínio?'], propertyId: properties[1].id, assess: (r) => [['Não inventa atributos ausentes do cadastro', /confirm|nao (?:consta|informa|tenho|ha)|cadastro/.test(normalize(r.reply)) && !/condominio (?:e|de) r\$|possui elevador|aceita pets?\b/.test(normalize(r.reply))]] },
  { id: 'financiamento', turns: ['Quero comprar casa até 350 mil no Meireles.', 'Você garante que meu financiamento será aprovado? Como funciona essa análise?'], assess: (r) => [['Não garante aprovação financeira', /nao|depende|analise/.test(normalize(r.reply)) && /banco|instituicao|renda|credito/.test(normalize(r.reply))]] },
  { id: 'frustracao', turns: ['Quero comprar apartamento até 350 mil no Meireles, dois quartos e uma vaga.', 'Já te falei meu orçamento e os quartos. Não pergunte isso de novo. O que ainda falta confirmar nesse imóvel?'], propertyId: properties[1].id, assess: (r) => [['Não repete pergunta de orçamento', !/(?:qual|quanto).{0,30}(?:orcamento|gastar|investir)/.test(normalize(r.reply))], ['Preserva fatos já fornecidos', r.qualificacao.orcamentoMax === 350000 && r.qualificacao.quartosMin === 2]] },
  { id: 'encerramento', turns: ['Obrigado, vou pensar com calma e volto depois.'], assess: (r) => [['Respeita pausa sem pressionar cadastro ou visita', !claimsContact(r.reply) && !/agend|marcar.{0,15}visita/.test(normalize(r.reply))]] },
  { id: 'proprietario', turns: ['Tenho uma casa e quero vender. Como vocês podem me ajudar a anunciar?'], assess: (r) => [['Entende proprietário e não oferece imóvel de compra', r.qualificacao.objetivo === 'vender' && r.imoveis.length === 0], ['Conversa sobre anúncio em vez de orçamento de compra', /imovel|localiza|bairro|corretor|anunci/.test(normalize(r.reply)) && !/quanto.{0,20}investir|orcamento de compra/.test(normalize(r.reply))]] },
];
const selected = process.env.CORREIAI_CONVERSATION_CASES?.split(',');
const cases = selected ? scenarios.filter((s) => selected.includes(s.id)) : scenarios;
assert.ok(cases.length);
const sessionHashes = new Set();
const report = { run, startedAt: new Date().toISOString(), model: 'mistralai/mistral-nemo', cases: [], checks: [], cleanup: [] };
async function save() { await writeFile(reportFile, JSON.stringify(report, null, 2)); }
function check(name, passed) { report.checks.push({ name, passed: Boolean(passed) }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); }
try {
  const inserted = await db.from('imoveis').insert(properties); assert.ifError(inserted.error);
  for (const scenario of cases) {
    const entry = { id: scenario.id, turns: [] }; report.cases.push(entry);
    let cookie, result; let messages = [];
    for (const text of scenario.turns) {
      messages.push({ role: 'user', text });
      const started = Date.now();
      const response = await fetch(`${base}/api/assistente`, { method: 'POST', signal: AbortSignal.timeout(90000), headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ messages, ...(scenario.propertyId ? { imovelId: scenario.propertyId } : {}) }) });
      result = await response.json();
      const fresh = response.headers.get('set-cookie')?.split(';')[0];
      cookie = fresh || cookie;
      if (cookie) sessionHashes.add(createHash('sha256').update(cookie.slice(cookie.indexOf('=') + 1)).digest('hex'));
      entry.turns.push({ input: text, status: response.status, durationMs: Date.now() - started, response: result });
      check(`${scenario.id}: conversa responde sem falha do provider`, response.status === 200 && Boolean(result.reply) && !result.aviso);
      if (response.status !== 200 || !result.reply) throw new Error(`${scenario.id}: HTTP ${response.status}`);
      check(`${scenario.id}: conversa sem contato não cria lead`, result.captura !== 'criado' && result.captura !== 'atualizado');
      check(`${scenario.id}: resposta cabe no histórico e não excede 130 palavras`, result.reply.length <= 1800 && result.reply.trim().split(/\s+/).length <= 130);
      messages.push({ role: 'assistant', text: result.reply });
      await save();
    }
    for (const [name, passed] of scenario.assess(result)) check(`${scenario.id}: ${name}`, passed);
    await save();
  }
  report.finishedAt = new Date().toISOString();
} catch (error) { report.error = error.message; process.exitCode = 1; console.error(error.message); }
finally {
  try {
    for (const hash of sessionHashes) {
      const { data, error } = await db.from('leads').select('id').eq('assistente_sessao_hash', hash); assert.ifError(error);
      for (const row of data) { const removed = await db.from('leads').delete().eq('id', row.id).eq('assistente_sessao_hash', hash); assert.ifError(removed.error); }
      const left = await db.from('leads').select('id', { head: true, count: 'exact' }).eq('assistente_sessao_hash', hash); assert.ifError(left.error); assert.equal(left.count, 0);
    }
    for (const p of properties) { const removed = await db.from('imoveis').delete().eq('id', p.id).eq('endereco', p.endereco); assert.ifError(removed.error); }
    const left = await db.from('imoveis').select('id', { head: true, count: 'exact' }).in('id', properties.map((p) => p.id)); assert.ifError(left.error); assert.equal(left.count, 0);
    report.cleanup.push('Imóveis temporários e eventuais leads exclusivos destas sessões removidos; ausência conferida.');
  } catch (error) { report.cleanupError = error.message; process.exitCode = 1; }
  if (report.checks.some((c) => !c.passed)) process.exitCode = 1;
  await save();
  console.log(JSON.stringify({ cases: report.cases.length, checks: report.checks.length, passed: report.checks.filter((c) => c.passed).length, error: report.error, cleanup: report.cleanup, reportFile }));
}
