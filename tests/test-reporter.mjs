import fs from 'node:fs';
import path from 'node:path';

const REPORTS_ROOT = path.resolve(process.env.CORREIA_TEST_REPORT_DIR || 'reports');

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function createSuiteReporter({ suiteKey, suiteTitle, targetFile }) {
  const tests = [];

  function record({ name, description, input, expected, result, status = 'PASSED', error = null }) {
    tests.push({
      name,
      description,
      input,
      expected,
      result,
      status,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  function exportReports() {
    if (!fs.existsSync(REPORTS_ROOT)) {
      fs.mkdirSync(REPORTS_ROOT, { recursive: true });
    }

    const suiteDir = path.join(REPORTS_ROOT, suiteKey);
    if (!fs.existsSync(suiteDir)) {
      fs.mkdirSync(suiteDir, { recursive: true });
    }

    const dataHoraFormatada = new Date().toLocaleString('pt-BR');

    // 1. Exporta relatório individual (.md) para CADA teste
    tests.forEach((t, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const slug = slugify(t.name);
      const filePath = path.join(suiteDir, `${num}-${slug}.md`);

      const mdLines = [
        `# Relatório de Teste: ${t.name}`,
        '',
        `- **Suíte:** ${suiteTitle}`,
        `- **Arquivo testado:** \`${targetFile}\``,
        `- **Data/Hora:** ${dataHoraFormatada}`,
        `- **Status:** ${t.status === 'PASSED' ? '✅ APROVADO' : '❌ REPROVADO'}`,
        '',
        '---',
        '',
        '## 1. Descrição e Objetivo',
        t.description || 'Validação de comportamento esperado.',
        '',
        '## 2. Dados de Entrada',
      ];

      if (t.input !== undefined) {
        mdLines.push('```json');
        mdLines.push(typeof t.input === 'string' ? t.input : JSON.stringify(t.input, null, 2));
        mdLines.push('```');
      } else {
        mdLines.push('_Não aplicável ou definido no corpo do teste._');
      }

      mdLines.push('');
      mdLines.push('## 3. Resultado Esperado');
      mdLines.push(t.expected || 'Comportamento conforme especificação.');
      mdLines.push('');
      mdLines.push('## 4. Resultado Obtido');
      mdLines.push(t.result || 'Execução bem-sucedida sem divergências de asserção.');
      mdLines.push('');

      if (t.error) {
        mdLines.push('## 5. Erro / Falha');
        mdLines.push('```');
        mdLines.push(String(t.error));
        mdLines.push('```');
        mdLines.push('');
      }

      mdLines.push('---');
      mdLines.push('_Relatório gerado automaticamente pela suíte de testes do CorreIA._');

      fs.writeFileSync(filePath, mdLines.join('\n'), 'utf-8');
    });

    // 2. Exporta o relatório consolidado da suíte (.md)
    const suiteFilePath = path.join(REPORTS_ROOT, `relatorio-${suiteKey}.md`);
    const suiteLines = [
      `# Relatório Geral da Suíte: ${suiteTitle}`,
      '',
      `- **Componente / Arquivo testado:** \`${targetFile}\``,
      `- **Data de Execução:** ${dataHoraFormatada}`,
      `- **Total de Testes:** ${tests.length}`,
      `- **Aprovados:** ${tests.filter((t) => t.status === 'PASSED').length}`,
      `- **Reprovados:** ${tests.filter((t) => t.status !== 'PASSED').length}`,
      '',
      '---',
      '',
      '## Resumo dos Testes',
      '',
      '| # | Teste | Status | Relatório Individual |',
      '| :-: | :--- | :-: | :--- |',
    ];

    tests.forEach((t, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const slug = slugify(t.name);
      const relPath = `./${suiteKey}/${num}-${slug}.md`;
      const statusIcon = t.status === 'PASSED' ? '✅ Pass' : '❌ Fail';
      suiteLines.push(`| ${idx + 1} | ${t.name} | ${statusIcon} | [Ver Detalhes](${relPath}) |`);
    });

    suiteLines.push('');
    suiteLines.push('---');
    suiteLines.push('');
    suiteLines.push('## Detalhamento Completo');
    suiteLines.push('');

    tests.forEach((t, idx) => {
      suiteLines.push(`### ${idx + 1}. ${t.name}`);
      suiteLines.push(`- **Status:** ${t.status === 'PASSED' ? '✅ Aprovado' : '❌ Reprovado'}`);
      if (t.description) suiteLines.push(`- **Objetivo:** ${t.description}`);
      if (t.expected) suiteLines.push(`- **Esperado:** ${t.expected}`);
      if (t.result) suiteLines.push(`- **Obtido:** ${t.result}`);
      suiteLines.push('');
    });

    suiteLines.push('---');
    suiteLines.push('_Relatório gerado automaticamente pela suíte de testes do CorreIA._');

    fs.writeFileSync(suiteFilePath, suiteLines.join('\n'), 'utf-8');
  }

  return { record, exportReports };
}
