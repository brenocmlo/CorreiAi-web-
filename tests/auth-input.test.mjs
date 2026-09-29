import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, parseRegistration } from '../src/lib/auth-input.ts';

test('registration accepts public roles and normalizes email', () => {
  assert.deepEqual(parseRegistration({ nome_completo: ' Gabriel ', email: ' GABRIEL@Example.com ', cpf: '123', creci: 'ABC', senha: '123456', role: 'corretor' }), {
    nome_completo: 'Gabriel', email: 'gabriel@example.com', cpf: '123', creci: 'ABC', senha: '123456', role: 'corretor',
  });
  assert.equal(normalizeEmail(' A@B.COM '), 'a@b.com');
});

test('registration rejects privileged roles and incomplete data', () => {
  assert.equal(parseRegistration({ nome_completo: 'Admin', email: 'a@b.com', cpf: '123', senha: '123456', role: 'super_admin' }), null);
  assert.equal(parseRegistration({ nome_completo: 'Lead', email: 'bad-email', cpf: '123', senha: '123456', role: 'lead' }), null);
  assert.equal(parseRegistration({ nome_completo: 'Broker', email: 'a@b.com', cpf: '123', senha: '123456', role: 'corretor' }), null);
});
