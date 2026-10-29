# Relatório de Teste: leads cria lead associado ao corretor autenticado (201)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 13:00:36
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida criação de lead: dados normalizados, etapa inicial "novo" e corretor_id preenchido a partir do JWT do corretor logado.

## 2. Dados de Entrada
```json
{
  "nome": "Beatriz Costa",
  "telefone": "85988887777",
  "corretorJwt": "corretor-vip"
}
```

## 3. Resultado Esperado
Status HTTP 201 com lead criado e corretor_id = "corretor-vip".

## 4. Resultado Obtido
Lead criado com sucesso com ID lead-gerado-10 vinculado a corretor-vip.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._