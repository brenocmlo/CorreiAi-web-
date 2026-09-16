# E04 — Configuração reproduzível do Supabase

Esta entrega versiona a estrutura previamente descrita no README e refatora a leitura da configuração. Não representa uma nova implementação de todo o catálogo existente.

## Instalação

1. Copie `.env.example` para `.env.local` e preencha os valores de um projeto de desenvolvimento.
2. Nunca publique `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` ou `.env.local`. A service role é exclusiva do servidor.
3. Em um projeto Supabase novo de homologação, execute a migration em `supabase/migrations/20260916143000_create_initial_schema.sql` pelo SQL Editor.
4. Em banco existente, primeiro compare colunas, constraints e políticas com a migration. `CREATE TABLE IF NOT EXISTS` não adapta tabelas legadas. Não execute às cegas e não marque a migration como aplicada sem essa comparação.

## Limites de segurança e compatibilidade

A aplicação usa JWT próprio, não sessão Supabase Auth. O CRUD de imóveis e o upload ainda usam a chave anônima no navegador. As políticas públicas desta baseline mantêm esse comportamento, mas permitem escrita anônima: esta migration é apenas para homologação acadêmica isolada, sem dados reais. Não é adequada para produção. Antes de produção, mover escrita de imóveis e upload para API autenticada e remover políticas públicas de escrita.

Perfis e leads possuem RLS habilitada sem políticas públicas. As API Routes acessam essas tabelas com service role; precisam validar autorização por conta própria. RLS não restringe service role.

O bucket `imoveis_imagens` é público, aceita JPEG, PNG e WebP até 5 MiB. Não armazene documentos privados nele. O formulário existente pode salvar o imóvel sem a nova imagem quando o upload falha; portanto, confirme a foto após salvar.

## Validação de aceite

- Confirmar UUID/default nas três tabelas e FK `leads.corretor_id → perfis.id`.
- Cadastrar um perfil de teste através da aplicação, sem armazenar senha em texto puro.
- Criar e consultar um lead vinculado ao perfil.
- Criar, editar e consultar um imóvel.
- Enviar JPEG/PNG/WebP e confirmar URL pública e exibição da imagem.
- Confirmar rejeição de arquivo acima de 5 MiB ou MIME não permitido.
- Executar `npm test`, `npm run lint` e `npm run build`.

Os testes locais de configuração não comprovam que as tabelas e o bucket existem no ambiente remoto. Registrar evidências desses passos antes de concluir a issue #10.

## Recuperação

Teste inicialmente em projeto descartável. Em banco existente, faça backup e revise o plano antes de aplicar. Não há rollback destrutivo automático: remover tabelas ou bucket pode apagar dados e imagens.
