-- Custom application sessions: access only through server handlers after live profile checks.
alter table public.leads add column cliente_perfil_id uuid references public.perfis(id);
alter table public.leads add column portal_liberado boolean not null default false;
create index leads_cliente_portal_idx on public.leads(cliente_perfil_id) where cliente_perfil_id is not null;
create table public.cliente_portal_convites (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade,
 codigo_hash text not null unique check (codigo_hash ~ '^[a-f0-9]{64}$'), email text not null,
 expira_em timestamptz not null, usado boolean not null default false, criado_em timestamptz not null default now()
);
create index cliente_portal_convites_lead_idx on public.cliente_portal_convites(lead_id);
create table public.cliente_documentos (
 id uuid primary key, lead_id uuid not null references public.leads(id) on delete restrict,
 enviado_por uuid not null references public.perfis(id), nome text not null check(length(nome) between 1 and 160),
 caminho text not null unique, mime text not null check(mime in ('application/pdf','image/jpeg','image/png')),
 tamanho integer not null check(tamanho between 1 and 3145728),
 status text not null default 'recebido' check(status in ('recebido','em_analise','aprovado','reenviar')),
 observacao text not null default '' check(length(observacao)<=500), criado_em timestamptz not null default now()
);
create index cliente_documentos_lead_idx on public.cliente_documentos(lead_id,criado_em);
create table public.cliente_mensagens (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete restrict,
 autor_id uuid not null references public.perfis(id), mensagem text not null check(length(mensagem) between 1 and 2000),
 criado_em timestamptz not null default now()
);
create index cliente_mensagens_lead_idx on public.cliente_mensagens(lead_id,criado_em);
alter table public.cliente_portal_convites enable row level security;
alter table public.cliente_documentos enable row level security;
alter table public.cliente_mensagens enable row level security;
revoke all on public.cliente_portal_convites,public.cliente_documentos,public.cliente_mensagens from public,anon,authenticated;
grant all on public.cliente_portal_convites,public.cliente_documentos,public.cliente_mensagens to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('cliente_documentos','cliente_documentos',false,3145728,array['application/pdf','image/jpeg','image/png']);
-- Even a permissive policy for a different bucket must not expose client documents.
create policy cliente_documentos_server_only on storage.objects as restrictive for all to anon,authenticated
 using (bucket_id <> 'cliente_documentos') with check (bucket_id <> 'cliente_documentos');

create function public.configurar_cliente_portal(p_usuario uuid,p_lead uuid,p_liberado boolean,p_hash text default null)
 returns void language plpgsql security invoker set search_path = '' as $$
declare l public.leads%rowtype;
begin
 select * into l from public.leads where id=p_lead for update;
 if not found or not exists(select 1 from public.perfis p join public.imobiliarias i on i.id=p.imobiliaria_id
  where p.id=p_usuario and p.id=l.corretor_id and p.role in ('corretor','admin_corretora') and p.ativo and i.ativo)
 then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_liberado and p_hash is not null and (l.email is null or l.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
 then raise exception 'Informe um email valido no lead'; end if;
 update public.leads set portal_liberado=p_liberado where id=p_lead;
 update public.cliente_portal_convites set usado=true where lead_id=p_lead and not usado;
 if p_liberado and p_hash is not null then
  insert into public.cliente_portal_convites(lead_id,codigo_hash,email,expira_em)
  values(p_lead,p_hash,lower(trim(l.email)),now()+interval '7 days');
 end if;
end; $$;

create function public.vincular_cliente_portal(p_usuario uuid,p_hash text) returns uuid
 language plpgsql security invoker set search_path = '' as $$
declare c public.cliente_portal_convites%rowtype; l public.leads%rowtype; p public.perfis%rowtype; empresa uuid;
begin
 -- Lock order matches portal configuration: lead, then invitation/profile.
 select * into c from public.cliente_portal_convites where codigo_hash=p_hash;
 if not found then raise exception 'Convite indisponivel' using errcode='42501'; end if;
 select * into l from public.leads where id=c.lead_id for update;
 select * into c from public.cliente_portal_convites where codigo_hash=p_hash for update;
 select * into p from public.perfis where id=p_usuario for update;
 select b.imobiliaria_id into empresa from public.perfis b join public.imobiliarias i on i.id=b.imobiliaria_id
 where b.id=l.corretor_id and b.ativo and b.role in ('corretor','admin_corretora') and i.ativo;
 if c.usado or c.expira_em<=now() or not l.portal_liberado or p.id is null or not p.ativo or p.role<>'lead'
  or empresa is null or lower(trim(p.email)) is distinct from c.email or lower(trim(l.email)) is distinct from c.email
  or (p.imobiliaria_id is not null and p.imobiliaria_id<>empresa)
  or (l.cliente_perfil_id is not null and l.cliente_perfil_id<>p_usuario)
 then raise exception 'Convite indisponivel' using errcode='42501'; end if;
 update public.perfis set imobiliaria_id=empresa where id=p_usuario;
 update public.leads set cliente_perfil_id=p_usuario where id=l.id;
 update public.cliente_portal_convites set usado=true where id=c.id;
 return l.id;
end; $$;

create function public.registrar_cliente_portal(p_usuario uuid,p_lead uuid,p_acao text,p_dados jsonb) returns void
 language plpgsql security invoker set search_path = '' as $$
declare l public.leads%rowtype; p public.perfis%rowtype; empresa uuid; staff boolean;
begin
 select * into l from public.leads where id=p_lead for update;
 select * into p from public.perfis where id=p_usuario;
 select b.imobiliaria_id into empresa from public.perfis b join public.imobiliarias i on i.id=b.imobiliaria_id
 where b.id=l.corretor_id and b.ativo and b.role in ('corretor','admin_corretora') and i.ativo;
 staff := p.id=l.corretor_id and p.role in ('corretor','admin_corretora');
 if l.id is null or not l.portal_liberado or p.id is null or not p.ativo or empresa is null
  or p.imobiliaria_id is distinct from empresa or not coalesce((staff or (p.role='lead' and p.id=l.cliente_perfil_id)),false)
 then raise exception 'Portal indisponivel' using errcode='42501'; end if;
 if p_acao='mensagem' then
  if (select count(*) from public.cliente_mensagens where lead_id=p_lead)>=500
  then raise exception 'Limite de mensagens atingido'; end if;
  insert into public.cliente_mensagens(lead_id,autor_id,mensagem) values(p_lead,p_usuario,p_dados->>'mensagem');
 elsif p_acao='documento' then
  if (select count(*) from public.cliente_documentos where lead_id=p_lead)>=50
  then raise exception 'Limite de documentos atingido'; end if;
  if (p_dados->>'caminho') not like p_lead::text || '/%' then raise exception 'Caminho invalido'; end if;
  insert into public.cliente_documentos(id,lead_id,enviado_por,nome,caminho,mime,tamanho)
   values((p_dados->>'id')::uuid,p_lead,p_usuario,p_dados->>'nome',p_dados->>'caminho',p_dados->>'mime',(p_dados->>'tamanho')::integer);
 elsif p_acao='revisao' and staff then
  if p_dados->>'status' not in ('em_analise','aprovado','reenviar') then raise exception 'Status invalido'; end if;
  update public.cliente_documentos set status=p_dados->>'status',observacao=coalesce(p_dados->>'observacao','')
   where id=(p_dados->>'id')::uuid and lead_id=p_lead;
  if not found then raise exception 'Documento indisponivel'; end if;
 else raise exception 'Operacao invalida' using errcode='42501'; end if;
end; $$;
revoke all on function public.configurar_cliente_portal(uuid,uuid,boolean,text),public.vincular_cliente_portal(uuid,text),public.registrar_cliente_portal(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.configurar_cliente_portal(uuid,uuid,boolean,text),public.vincular_cliente_portal(uuid,text),public.registrar_cliente_portal(uuid,uuid,text,jsonb) to service_role;
