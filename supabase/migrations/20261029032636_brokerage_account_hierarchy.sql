begin;
alter table public.imobiliarias
  add column if not exists ativo boolean not null default true,
  add column if not exists cnpj text,
  add column if not exists criado_por uuid references public.perfis(id) on delete set null;
alter table public.perfis add column if not exists criado_por uuid references public.perfis(id) on delete set null;
create unique index if not exists imobiliarias_cnpj_unique_idx on public.imobiliarias(cnpj) where cnpj is not null;

create or replace function public.provisionar_imobiliaria(
  p_nome text, p_cnpj text, p_admin_nome text, p_email text,
  p_cpf text, p_senha_hash text, p_criado_por uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare company_id uuid; admin_id uuid;
begin
  if not exists (select 1 from public.perfis where id=p_criado_por and role='super_admin' and ativo=true) then
    raise insufficient_privilege using message='Somente o administrador geral pode liberar imobiliárias.';
  end if;
  if length(trim(p_nome)) < 2 or length(trim(p_admin_nome)) < 2 or p_email is null or p_senha_hash is null then
    raise invalid_parameter_value using message='Dados de provisionamento inválidos.';
  end if;
  insert into public.imobiliarias(nome,cnpj,ativo,criado_por)
    values(trim(p_nome),nullif(p_cnpj,''),true,p_criado_por) returning id into company_id;
  admin_id := gen_random_uuid();
  insert into public.perfis(id,nome_completo,email,cpf,senha_hash,role,ativo,imobiliaria_id,criado_por)
    values(admin_id,trim(p_admin_nome),lower(trim(p_email)),nullif(p_cpf,''),p_senha_hash,'admin_corretora',true,company_id,p_criado_por);
  return jsonb_build_object('id',company_id,'administrador_id',admin_id);
end $$;
revoke all on function public.provisionar_imobiliaria(text,text,text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.provisionar_imobiliaria(text,text,text,text,text,text,uuid) to service_role;

-- Não promove contas antigas nem cria super_admin por e-mail fixo na migration.
-- O primeiro administrador geral é provisionado separadamente por um responsável.
comment on column public.imobiliarias.ativo is 'Suspensão bloqueia imediatamente o acesso de todos os usuários vinculados, inclusive com JWT válido.';
commit;
