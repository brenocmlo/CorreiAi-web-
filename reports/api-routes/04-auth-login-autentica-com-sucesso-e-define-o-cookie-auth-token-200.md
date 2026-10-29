# Relatório de Teste: auth/login autentica com sucesso e define o cookie auth_token (200)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 13:00:36
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida login com sucesso, retorno HTTP 200 { ok: true } e geração do cookie seguro httpOnly.

## 2. Dados de Entrada
```json
{
  "email": "corretor@teste.com",
  "senha": "senha-123"
}
```

## 3. Resultado Esperado
Status HTTP 200 com { ok: true } e cookie auth_token configurado como httpOnly.

## 4. Resultado Obtido
Login concluído com sucesso e cookie auth_token definido com opções seguras.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._