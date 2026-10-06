-- E13: aplicar junto da API autenticada de imóveis; a versão antiga do
-- navegador ainda escreve diretamente com a chave anon.
-- A leitura pública permanece disponível para a vitrine e os detalhes (E15).
begin;

alter table public.imoveis enable row level security;

drop policy if exists "imoveis_public_select" on public.imoveis;
create policy "imoveis_public_select"
on public.imoveis for select
to anon, authenticated
using (true);

drop policy if exists "imoveis_public_insert" on public.imoveis;
drop policy if exists "imoveis_public_update" on public.imoveis;
drop policy if exists "imoveis_public_delete" on public.imoveis;

-- No projeto ativo estes papéis receberam também TRUNCATE, TRIGGER,
-- REFERENCES e MAINTAIN. Conservar somente SELECT, em vez de revogar
-- apenas INSERT/UPDATE/DELETE.
revoke all privileges on table public.imoveis from anon, authenticated;
grant select on table public.imoveis to anon, authenticated;

commit;
