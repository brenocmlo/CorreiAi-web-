-- Permite que um corretor marque um imóvel para aparecer na vitrine
-- pública da landing page. O catálogo geral continua privado por
-- imobiliária; isto é uma exceção explícita, por item, feita pelo dono
-- do imóvel — nunca expõe o catálogo inteiro.
begin;

alter table public.imoveis add column if not exists destaque_landing boolean not null default false;

create index if not exists imoveis_destaque_landing_idx
  on public.imoveis(destaque_landing)
  where destaque_landing = true;

commit;
