# Relatório de Teste: leads bloqueia acesso de usuários com perfil de lead (403)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida controle de acesso baseado em papel (RBAC): usuários com role lead não acessam gestão de leads.

## 2. Dados de Entrada
```json
{
  "tokenRole": "lead"
}
```

## 3. Resultado Esperado
Status HTTP 403 com erro "Acesso negado." em GET e POST.

## 4. Resultado Obtido
HTTP 403 retornado corretamente impedindo acesso de clientes lead.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
