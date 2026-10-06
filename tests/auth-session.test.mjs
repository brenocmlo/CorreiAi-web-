import test from 'node:test';
import assert from 'node:assert/strict';
import { publicProfile } from '../src/lib/auth-session.ts';

test('session profile never includes the password hash', () => {
  const result = publicProfile({ id: '1', nome_completo: 'Gabriel', email: 'g@example.com', cpf: '123', creci: null, role: 'corretor', criado_em: '2026-09-29', senha_hash: 'sensitive-hash' });
  assert.equal(result.email, 'g@example.com');
  assert.equal('senha_hash' in result, false);
});
