# Relatório de Teste: auth/cadastro valida regras de registro e rejeita dados inválidos (400)

- **Suíte:** Rotas de API (auth/login, auth/cadastro e leads)
- **Arquivo testado:** `src/app/api/auth/login/route.ts, src/app/api/auth/cadastro/route.ts, src/app/api/leads/route.ts`
- **Data/Hora:** 29/10/2026, 18:08:45
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que cadastros sem CRECI para corretor, senha fraca ou perfis administrativos proibidos sejam rejeitados.

## 2. Dados de Entrada
```json
[
  {
    "nome_completo": "Ana",
    "email": "ana@teste.com",
    "cpf": "12345678901",
    "senha": "123456",
    "role": "corretor"
  },
  {
    "nome_completo": "Ana",
    "email": "ana@teste.com",
    "cpf": "12345678901",
    "senha": "123",
    "role": "lead"
  },
  {
    "nome_completo": "Admin",
    "email": "admin@teste.com",
    "cpf": "12345678901",
    "senha": "123456",
    "role": "super_admin"
  },
  {
    "nome_completo": "Ana",
    "email": "invalido",
    "cpf": "12345678901",
    "senha": "123456",
    "role": "lead"
  }
]
```

## 3. Resultado Esperado
Status HTTP 400 em todas as tentativas inválidas.

## 4. Resultado Obtido
Validação impediu o cadastro em todos os cenários com HTTP 400.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
