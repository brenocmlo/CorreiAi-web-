import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'segredo-de-teste-para-jwt-123456';
const { signToken, verifyToken } = await import('../src/lib/jwt.ts');

const payloadValido = {
  uid: 'corretor-uuid-123',
  email: 'corretor@exemplo.com',
  role: 'corretor',
  nome_completo: 'Carlos Silva',
};

test('geração e validação de token válido preserva payload', () => {
  const token = signToken(payloadValido);
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 0);

  const decodificado = verifyToken(token);
  assert.equal(decodificado.uid, payloadValido.uid);
  assert.equal(decodificado.email, payloadValido.email);
  assert.equal(decodificado.role, payloadValido.role);
  assert.equal(decodificado.nome_completo, payloadValido.nome_completo);
});

test('rejeita token adulterado ou assinado com outro segredo', () => {
  const token = signToken(payloadValido);
  const tokenAdulterado = token.slice(0, -6) + 'abcdef';
  assert.throws(() => verifyToken(tokenAdulterado), {
    name: 'JsonWebTokenError',
  });

  const tokenOutroSegredo = jwt.sign(payloadValido, 'segredo-completamente-diferente');
  assert.throws(() => verifyToken(tokenOutroSegredo), {
    name: 'JsonWebTokenError',
  });
});

test('rejeita token expirado', () => {
  const tokenExpirado = jwt.sign(payloadValido, process.env.JWT_SECRET, {
    expiresIn: -1,
  });

  assert.throws(() => verifyToken(tokenExpirado), {
    name: 'TokenExpiredError',
  });
});

test('rejeita token com role inválido', () => {
  const rolesInvalidos = ['hacker', 'admin', 'visitante', '', null, 123];

  for (const role of rolesInvalidos) {
    const token = jwt.sign({ ...payloadValido, role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    assert.throws(
      () => verifyToken(token),
      { message: 'Token inválido.' },
      `Deveria rejeitar o role ${role}`
    );
  }
});

test('rejeita token sem uid ou com uid de tipo incorreto', () => {
  const tokenSemUid = jwt.sign(
    {
      email: payloadValido.email,
      role: payloadValido.role,
      nome_completo: payloadValido.nome_completo,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  assert.throws(() => verifyToken(tokenSemUid), {
    message: 'Token inválido.',
  });

  const tokenUidNumero = jwt.sign(
    { ...payloadValido, uid: 99999 },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  assert.throws(() => verifyToken(tokenUidNumero), {
    message: 'Token inválido.',
  });
});
