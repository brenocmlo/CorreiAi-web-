-- A captura pública só pode associar um lead a um corretor ativo.
-- Corretores existentes permanecem ativos ao aplicar a migração.
alter table public.perfis
  add column if not exists ativo boolean not null default true;

create index if not exists perfis_corretores_ativos_criado_em_idx
  on public.perfis (criado_em, id)
  where role = 'corretor' and ativo = true;
