# Logout mobile, imóveis e segurança de rotas

Preparado em 29/10/2026 na branch `fix/mobile-logout-imoveis`, a partir da main `359fddc`. Após o aviso de Gabriel, a correção foi reaplicada sobre a main `1d0f8eb` por rebase, preservando a máscara de telefone do colega, sem conflitos. Integração na main por fast-forward e push normal no commit `7717f32`.

## Correções

- Logout mobile: o menu desmontava o formulário durante o submit, impedindo o POST nativo. O formulário agora permanece montado até a navegação. Confirmados redirecionamento ao login e exclusão dos dois cookies.
- A assistente também oferece navegação e saída para usuários autenticados. A página inicial encaminha cada perfil para sua área correta.
- APIs de alteração verificam Origin/Sec-Fetch-Site no proxy; cada handler continua validando sessão, papel e proprietário. Respostas de APIs e páginas privadas recebem `private, no-store`. A normalização local de `127.0.0.1` pelo Next não provoca rejeição da origem nem troca o host no redirecionamento.
- Imóveis: criar/editar não espera uma nova consulta da lista após a gravação. A lista é consultada pela própria página de destino. Excluir atualiza o estado local.
- O formulário mostra sucesso, progresso de imagem/gravação, erros de validação, falha do servidor e falha de upload. Impede reenvio durante a operação e reutiliza a imagem já enviada se a gravação precisar ser repetida.
- Consultas e gravações possuem limite de 20 segundos; upload, 45 segundos, com cancelamento do fetch. Timeout de gravação orienta conferir a lista antes de repetir, pois o servidor pode ter concluído a operação.
- A tela de edição preserva um erro de consulta visível, em vez de voltar silenciosamente à lista.

## Validação e limites

- 149 testes isolados passaram (143 da suíte versionada + 6 cenários encadeados adicionais), zero falhas/ignorados. TypeScript, ESLint dos arquivos alterados e `git diff --check` passaram. Build de produção compilou e gerou 30 páginas; a validação local de build usou variáveis públicas fictícias, sem comprovar conectividade de produção.
- Testes automatizados usam banco em memória e provedores simulados. O runner adicional em `.git/validation/offline/run.mjs` bloqueia a rede e não carrega `.env`. Nenhum acesso ou alteração no banco real foi necessário.
- Navegador Chrome: componente Navbar, formulário, hook de imóveis, estilos Tailwind e handler de logout reais, servidos em `127.0.0.1:3217`. Autenticação, API de imóveis e Storage simulados, com CSP restrita à origem local.
- Reproduzidos os dois defeitos antes das correções: logout apenas fechava o menu; POST do imóvel concluía, mas GET da lista travado mantinha “Salvando...”. Depois: sucesso de cadastro, timeout de listagem com tentativa disponível, falha de cadastro e falha de upload liberando o formulário. Cadastro sem/com PNG simulado confirmado em 390 px e desktop.
- O seletor de arquivos do Chrome não pôde ser automatizado porque a extensão não permite URLs de arquivos. A fixture gera um PNG em memória; isso valida o fluxo de imagem sem ler arquivos locais. Não equivale a testar câmera/galeria num aparelho físico nem o Storage de produção. Dois testes adicionais exercitam o SDK Supabase real com fetch simulado, incluindo cancelamento de upload.
- Script reproduzível: `node --import tsx scripts/validate-navigation-ui.mjs`. Mobile: `/__mobile?page=property&scenario=success`; desktop: `/__start?page=property&scenario=success`. Cenários: `save-error`, `upload-error`, `list-hang`. O script não carrega credenciais reais.

Esta foi uma revisão focada em sessão, rotas, permissões e imóveis; não substitui uma auditoria completa de segurança.

## Dependências e publicação

O primeiro deploy CLI de `7717f32`, `dpl_7P7t8nb5qHSnU9CG4atX7W4Cw3uZ`, ficou READY em `https://correiai.vercel.app`. As 28 verificações HTTP anônimas passaram: páginas públicas, redirecionamento das privadas, 401 nas APIs privadas, rejeição de origem externa, payloads inválidos e expiração dos cookies. Nenhum cadastro ou gravação no banco foi executado nessa verificação.

O build revelou 11 alertas de dependências, incluindo um crítico no Next.js 16.2.6. Atualizados Next.js e eslint-config-next para **16.4.3**, com correções transitivas compatíveis via `npm audit fix`, sem `--force`. `package-lock.json` e `pnpm-lock.yaml` sincronizados. A auditoria npm após a correção retornou **zero vulnerabilidades conhecidas**. Os 149 testes isolados passaram novamente nessa versão.

Referências primárias para os alertas do Next.js: [otimização de imagens](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [bypass do proxy](https://github.com/advisories/GHSA-6gpp-xcg3-4w24). A presença de um pacote afetado não comprova exploração; as correções foram aplicadas preventivamente.

A versão com dependências corrigidas foi publicada pela CLI a partir de **`3fcd096`**, no deploy **`dpl_6Hud4EWXDpaDA2vrfnQx8YagCP5N`**, com estado **READY** e alias **[correiai.vercel.app](https://correiai.vercel.app)**. O build remoto confirmou Next.js 16.4.3, zero vulnerabilidades conhecidas no `npm ci`, TypeScript aprovado e 30 páginas geradas. As 28 verificações HTTP passaram novamente após a troca do alias.

As variáveis de produção existentes foram preservadas. Não houve migration, criação de contas/imóveis ou alteração de dados do Supabase nesta integração/publicação. A limitação do teste de câmera/galeria e Storage real descrita acima permanece; não confundir as verificações HTTP anônimas com um novo teste autenticado completo de produção.
