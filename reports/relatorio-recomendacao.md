# Relatório Geral da Suíte: Motor de Recomendação de Imóveis (recomendarImoveis)

- **Componente / Arquivo testado:** `src/lib/recomendacao.ts`
- **Data de Execução:** 29/10/2026, 13:00:35
- **Total de Testes:** 5
- **Aprovados:** 5
- **Reprovados:** 0

---

## Resumo dos Testes

| # | Teste | Status | Relatório Individual |
| :-: | :--- | :-: | :--- |
| 1 | Calcula pontuação por tipo (+3), faixa de orçamento (+3 ou +1) e bairro (+2) | ✅ Pass | [Ver Detalhes](./recomendacao/01-calcula-pontuacao-por-tipo-3-faixa-de-orcamento-3-ou-1-e-bairro-2.md) |
| 2 | Ordena resultados por pontuação decrescente | ✅ Pass | [Ver Detalhes](./recomendacao/02-ordena-resultados-por-pontuacao-decrescente.md) |
| 3 | Limita o resultado a no máximo 5 recomendações | ✅ Pass | [Ver Detalhes](./recomendacao/03-limita-o-resultado-a-no-maximo-5-recomendacoes.md) |
| 4 | Retorna lista vazia quando o Supabase retorna erro ou dados nulos | ✅ Pass | [Ver Detalhes](./recomendacao/04-retorna-lista-vazia-quando-o-supabase-retorna-erro-ou-dados-nulos.md) |
| 5 | Retorna lista vazia quando nenhum imóvel tem pontuação positiva | ✅ Pass | [Ver Detalhes](./recomendacao/05-retorna-lista-vazia-quando-nenhum-imovel-tem-pontuacao-positiva.md) |

---

## Detalhamento Completo

### 1. Calcula pontuação por tipo (+3), faixa de orçamento (+3 ou +1) e bairro (+2)
- **Status:** ✅ Aprovado
- **Objetivo:** Verifica se a fórmula de pontuação ponderada atribui pesos corretos a tipo (+3), faixa (+3 exato / +1 margem 20%) e bairro (+2), descartando pontuação zero.
- **Esperado:** 4 imóveis recomendados com pontuações 8, 5, 4 e 2.
- **Obtido:** 4 imóveis retornados com pontuações exatas: 1: 8pts, 2: 5pts, 3: 4pts, 4: 2pts.

### 2. Ordena resultados por pontuação decrescente
- **Status:** ✅ Aprovado
- **Objetivo:** Valida se o resultado é ordenado estritamente pela maior pontuação calculada.
- **Esperado:** Ordem decrescente: alto (8), medio (6), baixo (5).
- **Obtido:** Ordem obtida: alto (8pts) > medio (6pts) > baixo (5pts).

### 3. Limita o resultado a no máximo 5 recomendações
- **Status:** ✅ Aprovado
- **Objetivo:** Verifica se a lista de recomendações é truncada em 5 itens mesmo com mais correspondências disponíveis.
- **Esperado:** Exatamente 5 imóveis recomendados.
- **Obtido:** Total retornado: 5 imóveis.

### 4. Retorna lista vazia quando o Supabase retorna erro ou dados nulos
- **Status:** ✅ Aprovado
- **Objetivo:** Valida resiliência da função contra erros de consulta ou retorno vazio/nulo do banco de dados.
- **Esperado:** Array vazio [] retornado em ambos os cenários.
- **Obtido:** Array vazio [] retornado com sucesso sem lançar exceções não tratadas.

### 5. Retorna lista vazia quando nenhum imóvel tem pontuação positiva
- **Status:** ✅ Aprovado
- **Objetivo:** Verifica se imóveis disponíveis sem aderência às preferências do lead são filtrados.
- **Esperado:** Array vazio [].
- **Obtido:** Nenhum imóvel pontuou e lista retornada vazia conforme esperado.

---
_Relatório gerado automaticamente pela suíte de testes do CorreIA._