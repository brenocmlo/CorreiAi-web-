# Publicação do CorreiAi

Projeto Vercel: `gb1440s-projects/correiai`. Domínio: https://correiai.vercel.app. Publicação via CLI, framework Next.js, Node 22, instalação `npm ci`, build `npm run build`, saída automática.

O primeiro deploy usou main `8009b4c`. A atualização de isolamento de dados está documentada em [seguranca-dados.md](seguranca-dados.md). A regra de catálogo público do primeiro deploy foi substituída: nova conta começa vazia, com acesso apenas aos próprios imóveis ou aos da imobiliária verificada. A landing mostra exemplos ilustrativos.

Atualização de segurança publicada em 28/10/2026: `dpl_39mQRwUmvcgDR9cRvq9mjN9FtPoo`, READY, origem de código `6968cb6`. Build remoto aprovado e 43 checks reais passaram no domínio público, incluindo upload e isolamento entre contas.

## Variáveis de Production

- `NEXT_PUBLIC_SUPABASE_URL`: projeto `sadnfebpklwgxerzgfqc`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública, tipo Config.
- `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` e `OPENROUTER_API_KEY`: somente servidor, Secret.
- `OPENROUTER_MODEL`: `mistralai/mistral-nemo`.

Gabriel configurou as chaves privadas manualmente na Vercel. A chave de service role nunca deve receber prefixo público. `GEMINI_API_KEY` extra não é usada pelo fluxo atual. As três chaves de serviços não estão preenchidas no ambiente local; um build local com chave pública fictícia valida compilação/prerender, sem comprovar integração real.

## Publicar

1. Atualizar e revisar main, preservar trabalho local alheio.
2. Executar testes, TypeScript, ESLint dos arquivos alterados e build.
3. Conferir as migrations necessárias antes de publicar; nunca reabrir leitura pública para contornar falha.
4. Executar `npx --yes vercel@65.7.0 deploy --prod --yes --scope gb1440s-projects`.
5. Conferir READY e testar o domínio público. O alias alternativo da equipe pode exigir autenticação Vercel e não deve ter sua proteção desativada.

A migration de isolamento foi aplicada manualmente no SQL Editor do Supabase correto, com verificação de grants/RLS/bucket e preservação das contagens. Vínculos de imobiliária e autoria de registros legados exigem identificação administrativa correta.

A validação publicada usa fixtures exclusivas e registra resultados sem segredos em `.git/validation/`. Não reutilizar os scripts antigos que supõem catálogo público e roteamento global de leads. Um rollback da Vercel não desfaz a migration; manter tabelas e Storage privados.
