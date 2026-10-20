-- A vitrine, os detalhes e o formulário já utilizam descricao.
-- Bancos existentes criados antes desse campo precisam da coluna opcional.
alter table public.imoveis
  add column if not exists descricao text;
