# Relatório de Teste: auth/cadastro rejeita e-mail já cadastrado (409)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida verificação de e-mail duplicado retornando conflito HTTP 409.

## 2. Dados de Entrada
```json
{
  "email": "duplicado@teste.com"
}
```

## 3. Resultado Esperado
Status HTTP 409 com erro "Este e-mail já está sendo utilizado por outra conta."

## 4. Resultado Obtido
HTTP 409 retornado e criação bloqueada.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
