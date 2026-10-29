# Logout mobile, imóveis e segurança de rotas

Preparado em 29/10/2026 na branch `fix/mobile-logout-imoveis`, a partir da main `359fddc` (atualização por fast-forward, sem conflitos). A publicação aguarda o novo merge do colega, conforme solicitado por Gabriel.

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

## Próxima publicação

Após confirmação do merge do colega: buscar a main atualizada, conciliar esta branch preservando as duas alterações, repetir testes/build, integrar e só então publicar na Vercel. Não houve push, merge desta correção na main ou deploy durante esta preparação.
