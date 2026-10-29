# Relatório de Teste: auth/login rejeita credenciais inválidas quando a senha está incorreta (401)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 13:00:36
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida checagem criptográfica de senha via bcrypt.compare.

## 2. Dados de Entrada
```json
{
  "email": "corretor@teste.com",
  "senhaInformada": "senha-errada"
}
```

## 3. Resultado Esperado
Status HTTP 401 com erro "E-mail ou senha incorretos."

## 4. Resultado Obtido
HTTP 401 retornado e login bloqueado.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._