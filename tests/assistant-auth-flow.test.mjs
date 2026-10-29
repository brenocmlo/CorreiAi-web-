import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldResumeChat } from '../src/lib/assistant-auth-flow.ts';

test('cliente que veio do chat volta ao atendimento depois de entrar', () => {
  assert.equal(shouldResumeChat('?chat=1', 'lead'), true);
  assert.equal(shouldResumeChat('?chat=1', 'corretor'), true);
  assert.equal(shouldResumeChat('', 'lead'), false);
  assert.equal(shouldResumeChat('?chat=0', 'lead'), false);
  assert.equal(shouldResumeChat('?chat=1', 'super_admin'), false);
});
