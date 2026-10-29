# Relatório de Teste: auth/login rejeita credenciais inválidas quando usuário não existe (401)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que tentativa de login com e-mail inexistente retorne 401 sem vazar detalhes.

## 2. Dados de Entrada
```json
{
  "email": "inexistente@teste.com",
  "senha": "senha-qualquer"
}
```

## 3. Resultado Esperado
Status HTTP 401 com erro "E-mail ou senha incorretos."

## 4. Resultado Obtido
HTTP 401 retornado corretamente com mensagem genérica de segurança.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
