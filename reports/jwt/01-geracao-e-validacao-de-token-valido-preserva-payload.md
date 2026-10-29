# Relatório de Teste: Geração e validação de token válido preserva payload

- **Suíte:** Autenticação JWT (signToken e verifyToken)
- **Arquivo testado:** `src/lib/jwt.ts`
- **Data/Hora:** 29/10/2026, 13:00:35
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida se signToken gera um token JWT decodificável por verifyToken com todos os campos intactos.

## 2. Dados de Entrada
```json
{
  "uid": "corretor-uuid-123",
  "email": "corretor@exemplo.com",
  "role": "corretor",
  "nome_completo": "Carlos Silva"
}
```

## 3. Resultado Esperado
Token assinado em string decodificado com os mesmos valores de uid, email, role e nome_completo.

## 4. Resultado Obtido
Token gerado e validado com sucesso. Decodificado: {"uid":"corretor-uuid-123","email":"corretor@exemplo.com","role":"corretor","nome_completo":"Carlos Silva","iat":1793289635,"exp":1793318435}

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._