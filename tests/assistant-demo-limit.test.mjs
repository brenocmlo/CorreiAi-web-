import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoRequestLimiter } from '../src/lib/assistant-demo-limit.ts';
test('demonstração limita mensagens por origem e libera uma nova janela', () => {
  const limiter = new DemoRequestLimiter(2, 20);
  assert.equal(limiter.allow('origin-a', 0), true);
  assert.equal(limiter.allow('origin-a', 1), true);
  assert.equal(limiter.allow('origin-a', 2), false);
  assert.equal(limiter.allow('origin-b', 2), true);
  assert.equal(limiter.allow('origin-a', 60000), true);
});
test('cota da instância limita também tentativas que alternam a origem', () => {
  const limiter = new DemoRequestLimiter(20, 2);
  assert.equal(limiter.allow('a', 0), true);
  assert.equal(limiter.allow('b', 0), true);
  assert.equal(limiter.allow('c', 60000), false);
  assert.equal(limiter.allow('c', 3600000), true);
});
