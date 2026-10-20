-- Additive research module. No changes to existing tables or authentication.
create table public.ecg_studies (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 acquired_at timestamptz,
 status text not null default 'unreviewed' check (status = 'unreviewed'),
 signal jsonb not null,
 result jsonb not null,
 interpretation jsonb,
 model_id text
);
alter table public.ecg_studies enable row level security;
create policy ecg_owner_read on public.ecg_studies for select to authenticated using (auth.uid() = user_id);
create policy ecg_owner_insert on public.ecg_studies for insert to authenticated with check (auth.uid() = user_id and status = 'unreviewed' and interpretation is null and model_id is null);
-- Clinical fields may only be written by the authenticated server after validation.
revoke all on public.ecg_studies from anon, authenticated;
grant select on public.ecg_studies to authenticated;
-- Server service role performs inserts after JWT and ownership checks.

create table public.ecg_usage (
 user_id uuid not null references auth.users(id),
 window_start timestamptz not null,
 requests integer not null default 1,
 primary key (user_id, window_start)
);
alter table public.ecg_usage enable row level security;
revoke all on public.ecg_usage from anon, authenticated;
create function public.ecg_take_quota(subject uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare used integer;
begin
 insert into public.ecg_usage(user_id,window_start) values(subject,date_trunc('hour',now()))
 on conflict(user_id,window_start) do update set requests=ecg_usage.requests+1
 returning requests into used;
 return used <= 10;
end;
$$;
revoke all on function public.ecg_take_quota(uuid) from public, anon, authenticated;
grant execute on function public.ecg_take_quota(uuid) to service_role;
