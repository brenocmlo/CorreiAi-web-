# Validação do atendimento público — 29/10/2026

## Escopo entregue

Landing por imobiliária, catálogo disponível com preços e telefone comercial, cadastro rápido com autorização, lead no Kanban da equipe e chat em diálogo sobre a página. Cadastro de visitante não concede papel de corretor. A página genérica não vira um catálogo de todas as empresas.

## Evidências antes da publicação

- 255 testes passaram, sem falhas ou testes ignorados. Runner isolado em `.git/validation/offline/run.mjs`: ambiente permitido explícito, configurações fictícias, rede bloqueada e banco/provedor/Storage em memória; nenhuma escrita real por essa suíte.
- Build Next.js 16.4.3 aprovado, incluindo TypeScript e as rotas públicas dinâmicas. Build local usa valores públicos fictícios apenas para validação do prerender; a Vercel utiliza suas variáveis próprias.
- ESLint dos arquivos de produção alterados sem erros; aviso preexistente de uso de img na vitrine ilustrativa. `git diff --check` aprovado.
- Chrome, componentes e handlers reais com dados fictícios: cadastro rápido identifica Ana, diálogo mantém a página, cards e preços em desktop e celular (390 × 844), telefone correto, orçamento sem resultados, SQL rejeitado, assunto aleatório redirecionado, detalhe público e ativação/desativação no painel da própria imobiliária.
- O teste de navegador revelou que “meu limite é 100 mil” não substituía o orçamento. Corrigido com regressão incluindo “meu teto é de…” e “só posso investir…”. Também corrigida pergunta de preço de imóvel selecionado acima do teto: informa o valor e a diferença sem mudar o limite da busca.

## Banco real

Aplicadas pelo SQL Editor na sessão autorizada do Chrome, no projeto `sadnfebpklwgxerzgfqc`, as migrations `20261029183512`, `20261029192437` e `20261029193801`, com histórico registrado. A última corrige uma colisão do nome de variável com CURRENT_TIME detectada no primeiro teste SQL. A função corrigida foi validada antes de persistir o ajuste.

Testes SQL em transação com rollback confirmaram as cotas de 20 mensagens/minuto, 5 cadastros/minuto, cota diária e rejeição de empresa inexistente. Após rollback: zero imobiliárias e zero contadores técnicos remanescentes. RLS habilitado; anon/authenticated sem execução da função, anon sem leitura da tabela, service_role autorizado. Nenhuma empresa existente foi publicada automaticamente (zero páginas públicas ativas na conferência).

Security Advisor atualizado: zero erros, zero avisos e três informações de RLS sem políticas em imobiliarias, imoveis e public_attendance_limits. São tabelas acessadas pelo servidor com service_role; ausência de políticas mantém o bloqueio de acesso direto aos papéis comuns. Não abrir políticas públicas para remover essas informações.

## Limites da validação

Os cenários de busca usam provedor simulado na suíte isolada e no navegador local. Na versão candidata da Vercel, o Chrome também confirmou respostas do modelo real sobre financiamento e insegurança com parcelas, sem cadastro nem escrita de leads. A validação identificou e removeu a orientação antiga de login obrigatório na landing genérica; agora ela indica o link público da imobiliária. Esses exemplos não representam medição geral do Mistral NeMo nem garantia contra qualquer formulação de ataque. A proteção principal é o escopo e o conjunto de operações que o servidor permite; o modelo não recebe ferramenta SQL, credenciais ou dados de outros clientes. A qualidade do modelo real precisa de acompanhamento contínuo.

## Uso após publicação

O administrador da imobiliária entra em `/admin`, configura o telefone comercial e ativa a página de atendimento. Compartilha `/imobiliaria/{slug}`. O visitante desse link consulta imóveis e conversa sem login de corretor. Orientação completa em [atendimento público](atendimento-publico-imobiliarias.md).

## Continuidade revisada após os exemplos do usuário

A entrada genérica conduz objetivo, tipo, orçamento e localização, sem consultar catálogo privado. Respostas sobre orçamento indefinido e bairro sem preferência avançam no fluxo. Pedidos diretos de catálogo identificam a imobiliária; link público validado gera botão para abrir a página correta. Aluguel, anúncio, catálogo vazio, falha real, aceite/recusa de retorno e desistência possuem próximos passos distintos. São 19 cenários encadeados adicionais em tests/assistant-guided-flow.test.mjs. Exemplos completos em [cenários de fluxo](cenarios-fluxo-assistente.md).

## Correção de posicionamento da landing

Conforme esclarecimento do usuário, a landing principal vende o sistema. O chat nela agora usa demonstração funcional com duas imobiliárias fictícias, sete imóveis, fotos e valores de exemplo, seleção de empresa e fluxos guiados. Não pede link ou login para testar e não grava leads reais. A vitrine usa a mesma base de exemplos. Os testes do modo demo proíbem qualquer chamada ao banco real e verificam isolamento, ausência de registro, critérios, injeções e reset sem apagar cookie real. O modo demo tem limitação de requisições por processo; os links de imobiliárias reais mantêm cota distribuída no banco. Ver [demonstração comercial](demonstracao-saas.md).
## Ampliação: demonstração SaaS e portal do cliente

- A landing raiz apresenta o CorreAI como software. O chat abre sobre a página e usa duas imobiliárias e sete imóveis fictícios versionados, com preços e fotos ilustrativas. Não exige conta de corretor, não grava leads de demonstração e não consulta o banco para escolher esses exemplos.
- O fluxo trata respostas curtas (`casa`, `500.000`), falta de estoque, troca de critérios, aluguel/anúncio, recusa de contato e perguntas fora do escopo. Cenários encadeados estão nos testes `assistant-guided-flow` e `assistant-demo`.
- Conta de cliente mantida. Novo portal `/cliente`, com convite manual do corretor em qualquer etapa, documentos privados e conversa com responsável. Novas APIs checam sessão, empresa, responsável e liberação atual. Validação de arquivo e rollback de falhas de gravação cobertos por fixtures de Storage.
- **278 testes isolados, zero falhas/ignorados, 35 arquivos**, com bloqueio de rede e configurações fictícias. Build local aprovado com variáveis públicas fictícias somente para prerender; isso não prova integração com credenciais reais. ESLint dos novos handlers sem erros; advertências preexistentes da landing permanecem.
- Migration `20261029210204_client_document_portal` aplicada no Supabase `sadnfebpklwgxerzgfqc` via sessão Chrome autorizada. Testes SQL antes/depois em transações revertidas verificaram destinatário do convite, uso único, expiração, isolamento, conferência exclusiva do corretor, pausa e preservação da etapa. Estado final: migration registrada uma vez, bucket privado, `anon` sem execução do vínculo, `authenticated` sem SELECT nos documentos, zero perfis/arquivos/mensagens de teste persistidos.
- UI isolada: cliente enviou mensagem, corretor respondeu, pausa exibiu confirmação e retirou conteúdo do portal. Seleção de arquivo pelo Chrome bloqueada pela permissão de acesso a URLs de arquivo da extensão; upload não foi comprovado por esse navegador. Nenhum documento pessoal foi usado.
- Auditoria Git por fetch e API do GitHub: `main` em `a2ec038`, zero PRs abertos. Único commit remoto fora da main em `testes-novos` (`697fd43`) trata relatórios e instrumentação de testes; branch preservada. Não confundir divergência histórica dessa branch com regressão do código da aplicação.
