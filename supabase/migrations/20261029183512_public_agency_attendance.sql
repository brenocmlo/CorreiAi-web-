-- A publicação é ativada pelo administrador da própria imobiliária.
alter table public.imobiliarias
  add column public_slug text,
  add column atendimento_publico boolean not null default false,
  add constraint imobiliarias_public_slug_unique unique (public_slug),
  add constraint imobiliarias_public_slug_valid check (
    public_slug is null or (length(public_slug) between 3 and 80 and public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
  ),
  add constraint imobiliarias_public_slug_required check (not atendimento_publico or public_slug is not null);
comment on column public.imobiliarias.atendimento_publico is 'Publica somente os imóveis disponíveis e o contato comercial na página desta imobiliária. Não concede acesso direto às tabelas.';
-- Nenhuma alteração de RLS, grants, contas, imóveis ou dados de visitantes.
