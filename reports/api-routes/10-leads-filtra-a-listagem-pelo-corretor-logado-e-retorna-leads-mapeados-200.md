# Relatório de Teste: leads filtra a listagem pelo corretor logado e retorna leads mapeados (200)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida isolamento multitenant: corretores visualizam apenas leads onde corretor_id bate com seu uid.

## 2. Dados de Entrada
```json
{
  "corretorUid": "corretor-42"
}
```

## 3. Resultado Esperado
Filtro corretor_id = "corretor-42" aplicado na query do Supabase e leads retornados.

## 4. Resultado Obtido
Filtro aplicado com sucesso: [{"col":"corretor_id","val":"corretor-42"}]

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._