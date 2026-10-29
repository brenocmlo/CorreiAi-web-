-- Contadores efêmeros, sem IP, contato ou mensagens. Somente o servidor acessa.
create table public.public_attendance_limits (
  company_id uuid not null references public.imobiliarias(id) on delete cascade,
  action text not null check (action in ('chat', 'intake')),
  subject text not null,
  bucket timestamptz not null,
  requests integer not null check (requests > 0),
  expires_at timestamptz not null,
  primary key (company_id, action, subject, bucket)
);
create index public_attendance_limits_expiry on public.public_attendance_limits(expires_at);
alter table public.public_attendance_limits enable row level security;
revoke all on public.public_attendance_limits from public, anon, authenticated;
grant select, insert, update, delete on public.public_attendance_limits to service_role;

create function public.consume_public_attendance(p_company uuid, p_action text, p_subject text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  current_time timestamptz := clock_timestamp();
  affected integer;
  daily_limit integer;
  minute_limit integer;
begin
  if p_action is null or p_action not in ('chat', 'intake') or p_subject is null or p_subject !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid attendance counter';
  end if;
  if not exists(select 1 from public.imobiliarias where id = p_company and ativo and atendimento_publico) then
    return false;
  end if;
  daily_limit := case when p_action = 'chat' then 3000 else 500 end;
  minute_limit := case when p_action = 'chat' then 20 else 5 end;
  delete from public.public_attendance_limits where ctid in (
    select ctid from public.public_attendance_limits where expires_at < current_time limit 100
  );
  insert into public.public_attendance_limits as counter values
    (p_company, p_action, '*', date_trunc('day', current_time, 'UTC'), 1, date_trunc('day', current_time, 'UTC') + interval '1 day')
  on conflict (company_id, action, subject, bucket) do update
    set requests = counter.requests + 1 where counter.requests < daily_limit;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.public_attendance_limits as counter values
    (p_company, p_action, p_subject, date_trunc('minute', current_time), 1, date_trunc('minute', current_time) + interval '1 minute')
  on conflict (company_id, action, subject, bucket) do update
    set requests = counter.requests + 1 where counter.requests < minute_limit;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
revoke all on function public.consume_public_attendance(uuid, text, text) from public, anon, authenticated;
grant execute on function public.consume_public_attendance(uuid, text, text) to service_role;
