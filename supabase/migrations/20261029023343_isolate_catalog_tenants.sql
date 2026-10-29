-- JWT próprio: as API Routes verificam perfil ativo e vínculo no banco a cada
-- requisição. Nenhum papel de browser acessa as tabelas privadas diretamente.
begin;

create table if not exists public.imobiliarias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

alter table public.perfis add column if not exists imobiliaria_id uuid
  references public.imobiliarias(id) on delete restrict;
alter table public.imoveis add column if not exists proprietario_id uuid
  references public.perfis(id) on delete restrict;
alter table public.imoveis add column if not exists imobiliaria_id uuid
  references public.imobiliarias(id) on delete restrict;

-- Sem backfill: os registros antigos não têm autoria comprovada. Permanecem
-- preservados e ocultos até o responsável vinculá-los explicitamente.
create index if not exists imoveis_proprietario_id_idx on public.imoveis(proprietario_id);
create index if not exists imoveis_imobiliaria_id_idx on public.imoveis(imobiliaria_id);
create index if not exists perfis_imobiliaria_id_idx on public.perfis(imobiliaria_id);

alter table public.imobiliarias enable row level security;
alter table public.perfis enable row level security;
alter table public.leads enable row level security;
alter table public.imoveis enable row level security;
drop policy if exists imoveis_public_select on public.imoveis;
drop policy if exists imoveis_public_insert on public.imoveis;
drop policy if exists imoveis_public_update on public.imoveis;
drop policy if exists imoveis_public_delete on public.imoveis;
revoke all privileges on table public.imobiliarias, public.perfis, public.leads, public.imoveis from public, anon, authenticated;
grant all privileges on table public.imobiliarias, public.perfis, public.leads, public.imoveis to service_role;

update storage.buckets set public = false where id = 'imoveis_imagens';
drop policy if exists "Permitir Uploads 11dunwl_0" on storage.objects;
drop policy if exists imoveis_imagens_public_insert on storage.objects;
drop policy if exists imoveis_imagens_private_guard on storage.objects;
create policy imoveis_imagens_private_guard on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'imoveis_imagens') with check (bucket_id <> 'imoveis_imagens');

-- Funções internas não são endpoints RPC públicos.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('rls_auto_enable', 'set_atualizado_em')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
  end loop;
end $$;

comment on column public.perfis.imobiliaria_id is 'Vínculo definido exclusivamente pela administração; nunca pelo cadastro público.';
comment on column public.imoveis.proprietario_id is 'Autor do cadastro. NULL em legados sem autoria comprovada; não são exibidos.';
commit;
