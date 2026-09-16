-- E04 - Estrutura inicial do banco e Storage do CorreIA.
-- Esta migration torna o ambiente reproduzível sem depender de SQL copiado do README.

create extension if not exists pgcrypto;

create table if not exists public.perfis (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  email text not null unique,
  cpf text,
  creci text,
  senha_hash text not null,
  role text not null default 'corretor'
    check (role in ('corretor', 'lead', 'admin_corretora', 'super_admin')),
  criado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text not null,
  faixa_orcamento text not null,
  tipo_imovel text not null,
  etapa text not null default 'novo'
    check (etapa in ('novo', 'em_atendimento', 'visita_agendada', 'proposta', 'fechado')),
  corretor_id uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default timezone('utc', now()),
  atualizado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.imoveis (
  id uuid primary key default gen_random_uuid(),
  tipo text not null
    check (tipo in ('casa', 'apartamento', 'terreno', 'comercial')),
  endereco text not null,
  bairro text not null,
  valor numeric(14, 2) not null check (valor >= 0),
  metragem numeric(10, 2) check (metragem is null or metragem >= 0),
  quartos integer check (quartos is null or quartos >= 0),
  vagas integer check (vagas is null or vagas >= 0),
  status text not null default 'disponivel'
    check (status in ('disponivel', 'vendido', 'alugado')),
  imagem_url text,
  criado_em timestamptz not null default timezone('utc', now())
);

create index if not exists leads_corretor_id_idx on public.leads(corretor_id);
create index if not exists leads_etapa_idx on public.leads(etapa);
create index if not exists imoveis_status_idx on public.imoveis(status);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists leads_set_atualizado_em on public.leads;
create trigger leads_set_atualizado_em
before update on public.leads
for each row execute function public.set_atualizado_em();

-- Perfis e leads contêm dados sensíveis e só são acessados pelas API Routes
-- com a service role. Sem políticas públicas, clientes anônimos não os leem.
alter table public.perfis enable row level security;
alter table public.leads enable row level security;

-- O módulo atual de imóveis usa o cliente anônimo no navegador. As políticas
-- abaixo mantêm esse contrato até o CRUD migrar para API Routes autenticadas.
alter table public.imoveis enable row level security;

create policy "imoveis_public_select"
on public.imoveis for select
to anon, authenticated
using (true);

create policy "imoveis_public_insert"
on public.imoveis for insert
to anon, authenticated
with check (true);

create policy "imoveis_public_update"
on public.imoveis for update
to anon, authenticated
using (true)
with check (true);

create policy "imoveis_public_delete"
on public.imoveis for delete
to anon, authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imoveis_imagens',
  'imoveis_imagens',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "imoveis_imagens_public_insert"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'imoveis_imagens'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
