import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessPage } from '../src/lib/auth-policy.ts';

test('private routes enforce role boundaries', () => {
  assert.equal(canAccessPage('lead', '/dashboard'), true);
  assert.equal(canAccessPage('lead', '/imoveis/abc'), true);
  assert.equal(canAccessPage('lead', '/leads'), false);
  assert.equal(canAccessPage('lead', '/imoveis/novo'), false);
  assert.equal(canAccessPage('corretor', '/admin'), false);
  assert.equal(canAccessPage('admin_corretora', '/admin'), true);
  assert.equal(canAccessPage('super_admin', '/admin'), true);
});
