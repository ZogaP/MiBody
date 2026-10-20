-- Run once in the SQL Editor of your own Supabase project.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
revoke all on public.user_state from anon, authenticated;
grant select on public.user_state to authenticated;
drop policy if exists "read_own_state" on public.user_state;
create policy "read_own_state" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);

-- All writes use an atomic revision check. No user-id parameter is accepted.
create or replace function public.save_user_state(expected_revision bigint, payload jsonb)
returns setof public.user_state
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); affected integer;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(payload) is distinct from 'object' or expected_revision < 0 then
    raise exception 'Invalid state' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.user_state(user_id, data, revision) values (owner_id, payload, 1)
      on conflict (user_id) do nothing;
  else
    update public.user_state set data = payload, revision = revision + 1, updated_at = now()
      where user_id = owner_id and revision = expected_revision;
  end if;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'State changed on another device' using errcode = '40001'; end if;
  return query select * from public.user_state where user_id = owner_id;
end;
$$;
revoke all on function public.save_user_state(bigint,jsonb) from public, anon;
grant execute on function public.save_user_state(bigint,jsonb) to authenticated;
