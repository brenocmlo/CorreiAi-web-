# Relatório de Teste: Rejeita token adulterado ou assinado com outro segredo

- **Suíte:** Autenticação JWT (signToken e verifyToken)
- **Arquivo testado:** `src/lib/jwt.ts`
- **Data/Hora:** 29/10/2026, 13:00:35
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que assinaturas adulteradas ou tokens gerados com outra chave secreta disparem JsonWebTokenError.

## 2. Dados de Entrada
```json
{
  "tokenAdulterado": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJjb3JyZXRvci11dWlkLTEyMyIsImVtYWlsIjoiY29ycmV0b3JAZXhlbXBsby5jb20iLCJyb2xlIjoiY29ycmV0b3IiLCJub21lX2NvbXBsZXRvIjoiQ2FybG9zIFNpbHZhIiwiaWF0IjoxNzkzMjg5NjM1LCJleHAiOjE3OTMzMTg0MzV9.Xj7R4i_htdEY7vtr6jwfFUesOMIqlIWsOKHzwabcdef",
  "tokenOutroSegredo": "jwt.sign(..., \"outro-segredo\")"
}
```

## 3. Resultado Esperado
Disparo de JsonWebTokenError para assinatura adulterada ou forjada com chave divergente.

## 4. Resultado Obtido
Ambas as tentativas foram bloqueadas com JsonWebTokenError.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._