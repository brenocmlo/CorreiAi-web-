-- Contato comercial: não utiliza telefone de clientes ou dados de outras empresas.
alter table public.imobiliarias add column telefone text;
alter table public.imobiliarias add constraint imobiliarias_telefone_valido
  check (telefone is null or telefone ~ '^[0-9]{10,15}$');
comment on column public.imobiliarias.telefone is 'Telefone oficial informado pelo administrador da própria imobiliária. Não implica disponibilidade de WhatsApp.';
-- A tabela permanece privada, com RLS e permissões existentes inalteradas.
