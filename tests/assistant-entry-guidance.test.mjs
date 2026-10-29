import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantRestriction } from '../src/lib/assistant-restriction.ts';
test('entrada genérica orienta visitante para o link público da imobiliária', () => {
  const result = assistantRestriction('login_required');
  assert.match(result.message, /link.*público.*imobiliária/i);
  assert.equal(result.action.label, 'Já tenho conta');
});
test('cliente sem vínculo também pode usar o atendimento público, sem novo login obrigatório', () => {
  assert.match(assistantRestriction('company_required').message, /link.*público/i);
});
