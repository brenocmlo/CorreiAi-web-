-- Políticas criadas pelo editor visual antes do fluxo de upload assinado.
-- O JWT próprio da aplicação não é uma sessão do Supabase Auth: somente
-- a API com service_role pode emitir o token limitado de upload.
-- A leitura pública das imagens permanece disponível.
drop policy if exists "Permitir Uploads 11dunwl_1" on storage.objects;
drop policy if exists "Permitir Uploads 11dunwl_2" on storage.objects;
drop policy if exists "Permitir Uploads 11dunwl_3" on storage.objects;
