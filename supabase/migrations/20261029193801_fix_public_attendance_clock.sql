-- Evita colisão com a expressão SQL reservada CURRENT_TIME.
create or replace function public.consume_public_attendance(p_company uuid, p_action text, p_subject text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  counter_now timestamptz := clock_timestamp();
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
    select ctid from public.public_attendance_limits where expires_at < counter_now limit 100
  );
  insert into public.public_attendance_limits as counter values
    (p_company, p_action, '*', date_trunc('day', counter_now, 'UTC'), 1, date_trunc('day', counter_now, 'UTC') + interval '1 day')
  on conflict (company_id, action, subject, bucket) do update
    set requests = counter.requests + 1 where counter.requests < daily_limit;
  get diagnostics affected = row_count;
  if affected = 0 then return false; end if;
  insert into public.public_attendance_limits as counter values
    (p_company, p_action, p_subject, date_trunc('minute', counter_now), 1, date_trunc('minute', counter_now) + interval '1 minute')
  on conflict (company_id, action, subject, bucket) do update
    set requests = counter.requests + 1 where counter.requests < minute_limit;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
