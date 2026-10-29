# Relatório de Teste: Retorna lista vazia quando o Supabase retorna erro ou dados nulos

- **Suíte:** Motor de Recomendação de Imóveis (recomendarImoveis)
- **Arquivo testado:** `src/lib/recomendacao.ts`
- **Data/Hora:** 29/10/2026, 18:08:44
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Valida resiliência da função contra erros de consulta ou retorno vazio/nulo do banco de dados.

## 2. Dados de Entrada
```json
{
  "cenario1": "error = Error(\"Erro de conexão\")",
  "cenario2": "data = null"
}
```

## 3. Resultado Esperado
Array vazio [] retornado em ambos os cenários.

## 4. Resultado Obtido
Array vazio [] retornado com sucesso sem lançar exceções não tratadas.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._
