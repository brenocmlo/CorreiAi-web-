# Relatório de Teste: leads não restringe por corretor_id quando o usuário é administrador (200)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 13:00:36
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida que administradores de corretora possuem visão global sem filtro de corretor específico.

## 2. Dados de Entrada
```json
{
  "role": "admin_corretora"
}
```

## 3. Resultado Esperado
Nenhum filtro corretor_id aplicado na query.

## 4. Resultado Obtido
Consulta realizada sem filtro restritivo de corretor.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._