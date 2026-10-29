# Relatório de Teste: Rejeita token expirado

- **Suíte:** Autenticação JWT (signToken e verifyToken)
- **Arquivo testado:** `src/lib/jwt.ts`
- **Data/Hora:** 29/10/2026, 18:08:44
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que verifyToken rejeite tokens cujo tempo de expiração já expirou.

## 2. Dados de Entrada
```json
{
  "expiresIn": -1,
  "payload": {
    "uid": "corretor-uuid-123",
    "email": "corretor@exemplo.com",
    "role": "corretor",
    "nome_completo": "Carlos Silva"
  }
}
```

## 3. Resultado Esperado
Disparo de TokenExpiredError.

## 4. Resultado Obtido
Token expirado foi rejeitado corretamente com TokenExpiredError.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
