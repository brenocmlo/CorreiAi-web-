# Relatório de Teste: auth/login rejeita requisição com campos obrigatórios ausentes ou e-mail inválido (400)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Verifica validação de payload no login (e-mail malformado ou senha ausente).

## 2. Dados de Entrada
```json
[
  {},
  {
    "email": "nao-e-email",
    "senha": "123"
  },
  {
    "email": "corretor@teste.com",
    "senha": ""
  },
  {
    "email": "corretor@teste.com"
  },
  {
    "senha": "123"
  }
]
```

## 3. Resultado Esperado
Status HTTP 400 com mensagem "E-mail e senha são obrigatórios."

## 4. Resultado Obtido
Todos os 5 formatos inválidos retornaram HTTP 400 com mensagem de validação.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._