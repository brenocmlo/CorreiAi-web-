# Relatório de Teste: leads valida payload na criação de novo lead e rejeita dados inválidos (400)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 13:00:36
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que tentativa de cadastro de lead sem nome obrigatório seja rejeitada com 400.

## 2. Dados de Entrada
```json
{
  "telefone": "85999990001",
  "email": "cliente@teste.com",
  "faixaOrcamento": "Até R$ 300 mil",
  "tipoImovel": "Casa"
}
```

## 3. Resultado Esperado
Status HTTP 400 com erro indicando campo nome.

## 4. Resultado Obtido
HTTP 400 retornado e mensagem de erro informada ao cliente.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._