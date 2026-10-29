# Relatório de Teste: Calcula pontuação por tipo (+3), faixa de orçamento (+3 ou +1) e bairro (+2)

- **Suíte:** Motor de Recomendação de Imóveis (recomendarImoveis)
- **Arquivo testado:** `src/lib/recomendacao.ts`
- **Data/Hora:** 29/10/2026, 13:00:35
- **Status:** ✅ APROVADO

---

## 1. Descrição e Objetivo
Verifica se a fórmula de pontuação ponderada atribui pesos corretos a tipo (+3), faixa (+3 exato / +1 margem 20%) e bairro (+2), descartando pontuação zero.

## 2. Dados de Entrada
```json
{
  "preferencias": {
    "tipoImovel": "Apartamento",
    "faixaOrcamento": "R$ 300 mil – R$ 500 mil",
    "bairro": "Aldeota"
  },
  "totalImoveisBanco": 5
}
```

## 3. Resultado Esperado
4 imóveis recomendados com pontuações 8, 5, 4 e 2.

## 4. Resultado Obtido
4 imóveis retornados com pontuações exatas: 1: 8pts, 2: 5pts, 3: 4pts, 4: 2pts.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._