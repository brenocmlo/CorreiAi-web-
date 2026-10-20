-- Triagem privada do assistente, lida somente pelas APIs com escopo de corretor.
-- Não altera etapas, proprietários, registros existentes ou permissões de acesso.
alter table public.leads
  add column if not exists qualificacao jsonb,
  add column if not exists assistente_sessao_hash text;

create unique index if not exists leads_assistente_sessao_hash_idx
  on public.leads (assistente_sessao_hash)
  where assistente_sessao_hash is not null;

comment on column public.leads.qualificacao is
  'Preferências, resumo, histórico e solicitação de visita do próprio atendimento.';
comment on column public.leads.assistente_sessao_hash is
  'SHA-256 do token aleatório httpOnly da conversa; nunca expor nas respostas da API.';
