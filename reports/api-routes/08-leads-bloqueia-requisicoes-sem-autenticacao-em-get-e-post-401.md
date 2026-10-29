# Relatório de Teste: leads bloqueia requisições sem autenticação em GET e POST (401)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 13:00:36
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que requisições sem cookie auth_token recebam 401 Não autenticado.

## 2. Dados de Entrada
```json
{
  "getReq": "sem cookie",
  "postReq": "sem cookie"
}
```

## 3. Resultado Esperado
HTTP 401 com erro "Não autenticado." para ambos os métodos.

## 4. Resultado Obtido
Tanto GET quanto POST bloquearam requisições não autenticadas.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._