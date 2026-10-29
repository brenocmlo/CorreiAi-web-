# Relatório de Teste: Rejeita token sem uid ou com uid de tipo incorreto

- **Suíte:** Autenticação JWT (signToken e verifyToken)
- **Arquivo testado:** `src/lib/jwt.ts`
- **Data/Hora:** 29/10/2026, 18:08:44
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Garante que tokens sem identificador de usuário (uid) ou com uid não-string sejam rejeitados.

## 2. Dados de Entrada
```json
{
  "semUid": "payload sem propriedade uid",
  "uidNumero": {
    "uid": 99999
  }
}
```

## 3. Resultado Esperado
Disparo de Error("Token inválido.") em ambos os casos.

## 4. Resultado Obtido
Tokens sem uid ou com uid numérico foram devidamente rejeitados.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
