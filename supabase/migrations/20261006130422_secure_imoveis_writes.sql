-- E13: toda mutação de imóveis passa pela API autenticada.
-- A leitura pública fica preservada para a vitrine e a página de detalhes (E15).
drop policy if exists "imoveis_public_insert" on public.imoveis;
drop policy if exists "imoveis_public_update" on public.imoveis;
drop policy if exists "imoveis_public_delete" on public.imoveis;

revoke insert, update, delete on public.imoveis from anon, authenticated;
