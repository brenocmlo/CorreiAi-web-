# Validação do atendimento público — 29/10/2026

## Escopo entregue

Landing por imobiliária, catálogo disponível com preços e telefone comercial, cadastro rápido com autorização, lead no Kanban da equipe e chat em diálogo sobre a página. Cadastro de visitante não concede papel de corretor. A página genérica não vira um catálogo de todas as empresas.

## Evidências antes da publicação

- 221 testes passaram, sem falhas ou testes ignorados. Runner isolado em `.git/validation/offline/run.mjs`: ambiente permitido explícito, configurações fictícias, rede bloqueada e banco/provedor/Storage em memória; nenhuma escrita real por essa suíte.
- Build Next.js 16.4.3 aprovado, incluindo TypeScript e as rotas públicas dinâmicas. Build local usa valores públicos fictícios apenas para validação do prerender; a Vercel utiliza suas variáveis próprias.
- ESLint dos arquivos de produção alterados aprovado; `git diff --check` aprovado.
- Chrome, componentes e handlers reais com dados fictícios: cadastro rápido identifica Ana, diálogo mantém a página, cards e preços em desktop e celular (390 × 844), telefone correto, orçamento sem resultados, SQL rejeitado, assunto aleatório redirecionado, detalhe público e ativação/desativação no painel da própria imobiliária.
- O teste de navegador revelou que “meu limite é 100 mil” não substituía o orçamento. Corrigido com regressão incluindo “meu teto é de…” e “só posso investir…”. Também corrigida pergunta de preço de imóvel selecionado acima do teto: informa o valor e a diferença sem mudar o limite da busca.

## Banco real

Aplicadas pelo SQL Editor na sessão autorizada do Chrome, no projeto `sadnfebpklwgxerzgfqc`, as migrations `20261029183512`, `20261029192437` e `20261029193801`, com histórico registrado. A última corrige uma colisão do nome de variável com CURRENT_TIME detectada no primeiro teste SQL. A função corrigida foi validada antes de persistir o ajuste.

Testes SQL em transação com rollback confirmaram as cotas de 20 mensagens/minuto, 5 cadastros/minuto, cota diária e rejeição de empresa inexistente. Após rollback: zero imobiliárias e zero contadores técnicos remanescentes. RLS habilitado; anon/authenticated sem execução da função, anon sem leitura da tabela, service_role autorizado. Nenhuma empresa existente foi publicada automaticamente (zero páginas públicas ativas na conferência).

Security Advisor atualizado: zero erros, zero avisos e três informações de RLS sem políticas em imobiliarias, imoveis e public_attendance_limits. São tabelas acessadas pelo servidor com service_role; ausência de políticas mantém o bloqueio de acesso direto aos papéis comuns. Não abrir políticas públicas para remover essas informações.

## Limites da validação

Os cenários novos de conversa usam provedor simulado na suíte isolada e no navegador local. Não representam medição geral do Mistral NeMo nem garantia contra qualquer formulação de ataque. A proteção principal é o escopo e o conjunto de operações que o servidor permite; o modelo não recebe ferramenta SQL, credenciais ou dados de outros clientes. A qualidade do modelo real precisa ser acompanhada separadamente.

## Uso após publicação

O administrador da imobiliária entra em `/admin`, configura o telefone comercial e ativa a página de atendimento. Compartilha `/imobiliaria/{slug}`. O visitante desse link consulta imóveis e conversa sem login de corretor. Orientação completa em [atendimento público](atendimento-publico-imobiliarias.md).
