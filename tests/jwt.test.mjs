import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import jwt from 'jsonwebtoken';
import { createSuiteReporter } from './test-reporter.mjs';

process.env.JWT_SECRET = 'segredo-de-teste-para-jwt-123456';
const { signToken, verifyToken } = await import('../src/lib/jwt.ts');

const reporter = createSuiteReporter({
  suiteKey: 'jwt',
  suiteTitle: 'Autenticação JWT (signToken e verifyToken)',
  targetFile: 'src/lib/jwt.ts',
});

after(() => {
  reporter.exportReports();
});

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

  reporter.record({
    name: 'Geração e validação de token válido preserva payload',
    description: 'Valida se signToken gera um token JWT decodificável por verifyToken com todos os campos intactos.',
    input: payloadValido,
    expected: 'Token assinado em string decodificado com os mesmos valores de uid, email, role e nome_completo.',
    result: `Token gerado e validado com sucesso. Decodificado: ${JSON.stringify(decodificado)}`,
    status: 'PASSED',
  });
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

  reporter.record({
    name: 'Rejeita token adulterado ou assinado com outro segredo',
    description: 'Garante que assinaturas adulteradas ou tokens gerados com outra chave secreta disparem JsonWebTokenError.',
    input: { tokenAdulterado, tokenOutroSegredo: 'jwt.sign(..., "outro-segredo")' },
    expected: 'Disparo de JsonWebTokenError para assinatura adulterada ou forjada com chave divergente.',
    result: 'Ambas as tentativas foram bloqueadas com JsonWebTokenError.',
    status: 'PASSED',
  });
});

test('rejeita token expirado', () => {
  const tokenExpirado = jwt.sign(payloadValido, process.env.JWT_SECRET, {
    expiresIn: -1,
  });

  assert.throws(() => verifyToken(tokenExpirado), {
    name: 'TokenExpiredError',
  });

  reporter.record({
    name: 'Rejeita token expirado',
    description: 'Garante que verifyToken rejeite tokens cujo tempo de expiração já expirou.',
    input: { expiresIn: -1, payload: payloadValido },
    expected: 'Disparo de TokenExpiredError.',
    result: 'Token expirado foi rejeitado corretamente com TokenExpiredError.',
    status: 'PASSED',
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

  reporter.record({
    name: 'Rejeita token com role inválido',
    description: 'Valida se roles fora da especificação AppRole são rejeitados defensivamente.',
    input: { rolesTestados: rolesInvalidos },
    expected: 'Disparo de Error("Token inválido.") para qualquer papel não reconhecido.',
    result: 'Todos os 6 papéis inválidos testados foram rejeitados com Error("Token inválido.").',
    status: 'PASSED',
  });
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

  reporter.record({
    name: 'Rejeita token sem uid ou com uid de tipo incorreto',
    description: 'Garante que tokens sem identificador de usuário (uid) ou com uid não-string sejam rejeitados.',
    input: { semUid: 'payload sem propriedade uid', uidNumero: { uid: 99999 } },
    expected: 'Disparo de Error("Token inválido.") em ambos os casos.',
    result: 'Tokens sem uid ou com uid numérico foram devidamente rejeitados.',
    status: 'PASSED',
  });
});
