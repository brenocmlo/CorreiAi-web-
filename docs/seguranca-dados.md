# Isolamento de dados do CorreiAi

Regra definida por Gabriel: conta nova começa com catálogo vazio. A conta vê imóveis de sua autoria ou vinculados à imobiliária registrada no seu perfil.

## Controles

- Todas as APIs privadas consultam o perfil ativo e a permissão atual no banco; não aceitam vínculo de imobiliária enviado pelo navegador ou guardado em um JWT antigo.
- Catálogo, detalhes, alterações, exclusão, recomendações, contexto da IA e cálculo do dashboard usam o mesmo escopo de proprietário/imobiliária. O administrador também não recebe catálogo global.
- Leads e Kanban pertencem ao responsável. Administradores de imobiliária consultam somente os usuários da própria empresa.
- Visitante pode conversar com a assistente, sem receber imóveis privados nem ter contato distribuído para o primeiro corretor global. O salvamento no funil requer conta/contexto de imobiliária válido.
- A landing mostra exemplos identificados como ilustrativos.
- O bucket `imoveis_imagens` é privado. A API autoriza a imagem antes de emitir URL com validade de 60 segundos. Upload usa pasta do usuário e token de upload limitado.
- RLS está ativo nas quatro tabelas privadas e os papéis `anon`/`authenticated` não têm acesso direto. Como a aplicação usa JWT próprio, o acesso por usuário é aplicado nas APIs com service role privada; não existe sessão Supabase Auth no navegador.

## Migration e legados

`20261029023343_isolate_catalog_tenants.sql` adiciona `imobiliarias`, `perfis.imobiliaria_id`, `imoveis.proprietario_id` e `imoveis.imobiliaria_id`; fecha leitura pública de imóveis e imagens, preservando todos os registros. Aplicada pelo SQL Editor do projeto `sadnfebpklwgxerzgfqc`.

Os três imóveis anteriores não têm autoria comprovada. Continuam no banco e ficam ocultos até o responsável identificar e vincular o proprietário ou a imobiliária. Não distribuir esses registros para novas contas.

O vínculo de imobiliária é administrativo: o cadastro público não cria vínculo. Não existe ingresso automático por nome, e-mail, domínio ou identificador de empresa. Para provisionar uma empresa, o responsável deve confirmar os IDs corretos e atribuir o vínculo pelo banco. Os cadastros feitos por administrador herdam somente a imobiliária já verificada do próprio administrador.

## Verificação

`npm test` cobre leitura anônima, conta vazia, compartilhamento na mesma imobiliária, bloqueio entre proprietários, tentativa de forjar vínculo, sessão desativada, permissão antiga no JWT, recomendações, assistente e autorização de imagens/upload. Build local validado com chave pública fictícia de prerender; isso não testa o banco real.

O teste publicado é separado: `node scripts/validate-catalog-isolation.mjs --origin=https://correiai.vercel.app --allow-production-fixtures`. Cria duas contas exclusivas, testa autenticação, propriedade, CRUD, recomendações e Kanban; remove somente os imóveis/leads criados pelo teste. Registra IDs das contas para posterior desativação administrativa. Nunca imprime cookies, senhas ou tokens. Também testa upload real de um PNG de 68 bytes, leitura assinada e bloqueio da URL pública. O objeto sintético fica identificado no relatório local; as duas contas devem ser desativadas após o teste.

Uma reversão de código não deve reabrir grants nem tornar o bucket público. Ajustar o código preservando o isolamento; a migration é aditiva e não remove dados.

Referências: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [imagens em buckets privados](https://supabase.com/docs/guides/storage/serving/downloads).
