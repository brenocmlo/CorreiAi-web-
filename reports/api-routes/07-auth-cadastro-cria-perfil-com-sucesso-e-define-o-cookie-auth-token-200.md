# Relatório de Teste: auth/cadastro cria perfil com sucesso e define o cookie auth_token (200)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida fluxo completo de cadastro: hash com bcrypt, inserção no banco e login automático com cookie.

## 2. Dados de Entrada
```json
{
  "nome": "Mariana Lima",
  "email": "mariana@teste.com",
  "role": "corretor",
  "creci": "54321-F"
}
```

## 3. Resultado Esperado
Status HTTP 200 com { ok: true } e perfil inserido no Supabase.

## 4. Resultado Obtido
Perfil criado e autenticado com cookie de sessão válido.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
