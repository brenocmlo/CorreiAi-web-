# Atendimento da CorreAI — 29/10/2026

## Comportamento entregue

- Chat em janela sobre a página atual; no celular, ocupa a altura disponível. Fechar e reabrir preserva a conversa. `/assistente` mantém compatibilidade abrindo o chat sobre a página inicial apropriada.
- Uma pergunta necessária por resposta, coleta de contato um campo por vez e opções apresentadas assim que houver correspondência. Respostas limitadas a 80 palavras, com frases completas.
- Saudação, busca, contato oficial, objeção de preço e encerramento têm respostas locais, reduzindo custo e espera. Dúvidas abertas continuam usando o modelo configurado no OpenRouter.
- Catálogo e telefone dependem do vínculo ativo da conta com sua imobiliária. Visitantes e clientes sem vínculo continuam sem acesso a esses dados. Nenhum link público por imobiliária foi criado.
- Cartões com preço, localização, características, detalhes e solicitação de visita. Cartões iguais não são repetidos a cada pergunta. Visitas sempre dependem da confirmação do corretor; a IA não avança etapas do Kanban.
- Administrador da imobiliária configura o telefone comercial em `/admin`. Número ausente não recebe substituto inventado; telefone não implica WhatsApp.

## Banco

Migration `20261029175313_assistant_company_contact.sql` aplicada ao projeto CorreiAi. Acrescenta somente `imobiliarias.telefone`, opcional, com validação de formato. Nenhuma conta, imóvel ou telefone real foi criado/alterado pelos testes desta entrega.

Verificação remota confirmou coluna `text` opcional, RLS ativo e acesso à tabela somente pelo papel servidor. Advisors: sem alertas de segurança novos; dois avisos informativos preexistentes de RLS sem políticas correspondem ao bloqueio intencional do acesso direto do navegador.

## Validação isolada

- 182 testes passaram, zero falhas/ignorados. Ambiente com valores fictícios, rede bloqueada e banco, Storage e provider em memória; não carrega `.env`.
- TypeScript e ESLint sem erros. Build local com Next.js 16.4.3 e 31 rotas passou; URL/chave pública fictícias usadas apenas para prerender.
- Navegador em desktop e 390 × 844: abertura sem navegação, fechamento/Escape, retomada, catálogo da empresa correta, contato oficial, seleção do imóvel, preferência de visita, coleta sequencial, gravação simulada no funil e logout mobile.
- Fixture reproduzível: `node --import tsx scripts/validate-assistant-ui.mjs`, em `http://127.0.0.1:3218/__start`; `?role=admin` habilita configuração comercial fictícia. Nenhum acesso ao banco real.

## Repositório e pendência da equipe

`git fetch origin` e comparação de commits foram executados antes da integração e novamente antes do deploy final. Integração por fast-forward, sem conflitos, preservando o trabalho anterior. Nenhum force-push.

Todas as branches dos colegas são ancestrais da main, exceto `origin/testes-novos`: commit `697fd43`, com relatórios e instrumentação de testes, sem alterações em `src/`. Não havia PR aberto no momento da consulta à API do GitHub. Essa branch permanece remota, aguardando integração da equipe. O arquivo local alheio `docs/relatorio-sprint-5.md` foi preservado sem inclusão nos commits.

## Produção

Deploy CLI `dpl_3EbXZFutqngFd7o5JdiWeDRVsfp8`, código `a09abfd`, confirmado `READY`, disponível em https://correiai.vercel.app. A main foi consultada novamente antes dessa publicação e estava sincronizada com origin/main.

Nove cenários reais de conversa, em 11 turnos, passaram: saudação, financiamento, comparação, objeção de preço, recusa, catálogo/telefone privados, frustração, proteção de outros atendimentos e encerramento. Testes anônimos, sem gravação de leads. O primeiro ciclo revelou resposta inadequada sobre catálogo restrito e argumentação de preço; ambos receberam correção e teste de regressão antes do deploy final.

Sete verificações HTTP adicionais confirmaram bloqueio anônimo nas APIs privadas e rejeição de alteração de contato com origem externa. O navegador confirmou o chat real na landing sem mudar a URL, sem erros de console. A consulta de imóveis e telefone por empresa foi validada com fixtures isoladas; não houve simulação com uma conta real de cliente nesta etapa.

Evidências locais em `.git/validation/`: `offline/report.json`, `assistant-production-conversations.json`, `assistant-production-guards.json`, `assistant-repository-check.json` e `assistant-vercel-final.log`.

## Configuração pendente

Cada imobiliária deve cadastrar seu telefone comercial real em `/admin`. O campo foi criado vazio; não foi preenchido com números de teste.
