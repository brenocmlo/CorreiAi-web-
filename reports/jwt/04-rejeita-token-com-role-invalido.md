# Relatório de Teste: Rejeita token com role inválido

- **Suíte:** Autenticação JWT (signToken e verifyToken)
- **Arquivo testado:** `src/lib/jwt.ts`
- **Data/Hora:** 29/10/2026, 18:08:44
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida se roles fora da especificação AppRole são rejeitados defensivamente.

## 2. Dados de Entrada
```json
{
  "rolesTestados": [
    "hacker",
    "admin",
    "visitante",
    "",
    null,
    123
  ]
}
```

## 3. Resultado Esperado
Disparo de Error("Token inválido.") para qualquer papel não reconhecido.

## 4. Resultado Obtido
Todos os 6 papéis inválidos testados foram rejeitados com Error("Token inválido.").

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
