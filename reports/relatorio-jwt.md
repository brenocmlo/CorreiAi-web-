# Relatório Geral da Suíte: Autenticação JWT (signToken e verifyToken)

- **Componente / Arquivo testado:** `src/lib/jwt.ts`
- **Data de Execução:** 29/10/2026, 18:08:44
- **Total de Testes:** 5
- **Aprovados:** 5
- **Reprovados:** 0

---

## Resumo dos Testes

| # | Teste | Status | Relatório Individual |
| :-: | :--- | :-: | :--- |
| 1 | Geração e validação de token válido preserva payload | ✅ Pass | [Ver Detalhes](./jwt/01-geracao-e-validacao-de-token-valido-preserva-payload.md) |
| 2 | Rejeita token adulterado ou assinado com outro segredo | ✅ Pass | [Ver Detalhes](./jwt/02-rejeita-token-adulterado-ou-assinado-com-outro-segredo.md) |
| 3 | Rejeita token expirado | ✅ Pass | [Ver Detalhes](./jwt/03-rejeita-token-expirado.md) |
| 4 | Rejeita token com role inválido | ✅ Pass | [Ver Detalhes](./jwt/04-rejeita-token-com-role-invalido.md) |
| 5 | Rejeita token sem uid ou com uid de tipo incorreto | ✅ Pass | [Ver Detalhes](./jwt/05-rejeita-token-sem-uid-ou-com-uid-de-tipo-incorreto.md) |

---

## Detalhamento Completo

### 1. Geração e validação de token válido preserva payload
- **Status:** ✅ Aprovado
- **Objetivo:** Valida se signToken gera um token JWT decodificável por verifyToken com todos os campos intactos.
- **Esperado:** Token assinado em string decodificado com os mesmos valores de uid, email, role e nome_completo.
- **Obtido:** Token gerado e validado com sucesso. Decodificado: {"uid":"corretor-uuid-123","email":"corretor@exemplo.com","role":"corretor","nome_completo":"Carlos Silva","iat":1793308124,"exp":1793336924}

### 2. Rejeita token adulterado ou assinado com outro segredo
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que assinaturas adulteradas ou tokens gerados com outra chave secreta disparem JsonWebTokenError.
- **Esperado:** Disparo de JsonWebTokenError para assinatura adulterada ou forjada com chave divergente.
- **Obtido:** Ambas as tentativas foram bloqueadas com JsonWebTokenError.

### 3. Rejeita token expirado
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que verifyToken rejeite tokens cujo tempo de expiração já expirou.
- **Esperado:** Disparo de TokenExpiredError.
- **Obtido:** Token expirado foi rejeitado corretamente com TokenExpiredError.

### 4. Rejeita token com role inválido
- **Status:** ✅ Aprovado
- **Objetivo:** Valida se roles fora da especificação AppRole são rejeitados defensivamente.
- **Esperado:** Disparo de Error("Token inválido.") para qualquer papel não reconhecido.
- **Obtido:** Todos os 6 papéis inválidos testados foram rejeitados com Error("Token inválido.").

### 5. Rejeita token sem uid ou com uid de tipo incorreto
- **Status:** ✅ Aprovado
- **Objetivo:** Garante que tokens sem identificador de usuário (uid) ou com uid não-string sejam rejeitados.
- **Esperado:** Disparo de Error("Token inválido.") em ambos os casos.
- **Obtido:** Tokens sem uid ou com uid numérico foram devidamente rejeitados.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._