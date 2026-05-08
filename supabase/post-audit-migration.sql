-- MEL Platform: Post-Audit Safety Migrations
-- Run these in Supabase SQL Editor or as a migration file.
-- Generated: 2026-05-07

-- ============================================================
-- FIX P-0: Public driver privacy surface
-- Anonymous users must not be able to read the full drivers table.
-- Public pages should use public.public_drivers, which exposes only
-- approved drivers and safe profile fields.
-- ============================================================

drop policy if exists "Public read drivers" on public.drivers;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$ select public.current_role() = 'admin'::user_role; $$;

create or replace function public.is_steward_or_admin()
returns boolean
language sql
stable
set search_path = public
as $$ select public.current_role() in ('admin'::user_role, 'steward'::user_role); $$;

drop policy if exists "Public read approved driver profile fields" on public.drivers;
create policy "Public read approved driver profile fields" on public.drivers
for select using (approval_status = 'approved');

drop policy if exists "Drivers read own profile" on public.drivers;
create policy "Drivers read own profile" on public.drivers
for select using (user_id = (select auth.uid()));

drop policy if exists "Staff read drivers" on public.drivers;
create policy "Staff read drivers" on public.drivers
for select using ((select public.is_steward_or_admin()));

create or replace view public.public_drivers
with (security_invoker = true, security_barrier = true)
as
select
  id,
  display_name,
  country,
  region,
  car_number,
  team_id,
  preferred_class,
  preferred_car,
  rating,
  safety_rating,
  approval_status,
  created_at
from public.drivers
where approval_status = 'approved';

grant select on public.public_drivers to anon, authenticated;
revoke select on public.drivers from anon;
revoke select on public.drivers from authenticated;
grant select (
  id,
  display_name,
  country,
  region,
  car_number,
  team_id,
  preferred_class,
  preferred_car,
  rating,
  safety_rating,
  approval_status,
  created_at
) on public.drivers to anon, authenticated;

-- ============================================================
-- FIX M-0: Public community visit ledger
-- Stores one hashed visitor record per day for public activity
-- statistics without keeping raw IP addresses.
-- ============================================================

create table if not exists public.community_visits (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null default current_date,
  visitor_hash text not null,
  path text not null default '/',
  created_at timestamptz not null default now(),
  unique (visit_date, visitor_hash)
);

alter table public.community_visits enable row level security;

drop policy if exists "Admins read community visits" on public.community_visits;
create policy "Admins read community visits" on public.community_visits
for select using ((select public.is_admin()));

drop policy if exists "Admins manage community visits" on public.community_visits;
create policy "Admins manage community visits" on public.community_visits
for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ============================================================
-- FIX M-1: Add unique constraint on drivers.user_id
-- Prevents two driver rows for the same user_id in a race
-- condition during concurrent admin approval clicks.
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'drivers_user_id_unique'
    and conrelid = 'public.drivers'::regclass
  ) then
    alter table public.drivers
      add constraint drivers_user_id_unique unique (user_id);
  end if;
end;
$$;

-- ============================================================
-- FIX M-2: Enforce penalty race participation at the database
-- layer as well as in server actions. A steward/admin cannot
-- insert or retarget a penalty unless the driver has a result in
-- the selected race.
-- ============================================================

create or replace function public.validate_penalty_driver_race()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.race_results
    where race_results.race_id = new.race_id
    and race_results.driver_id = new.driver_id
  ) then
    raise exception 'Driver must have a race result for this race before a penalty can be recorded';
  end if;

  return new;
end;
$$;

drop trigger if exists penalties_driver_race_participation on public.penalties;
create trigger penalties_driver_race_participation
before insert or update of race_id, driver_id on public.penalties
for each row execute function public.validate_penalty_driver_race();

-- ============================================================
-- FIX M-3: Make driver approval a single transactional RPC.
-- The driver profile upsert and application status update now
-- commit together, using the unique drivers.user_id constraint as
-- the ON CONFLICT target.
-- ============================================================

create or replace function public.approve_driver_application(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.driver_applications%rowtype;
  v_driver_id uuid;
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'service_role' and not (select public.is_admin()) then
    raise exception 'Admin role required';
  end if;

  select * into v_application
  from public.driver_applications
  where id = p_application_id
  and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending application not found';
  end if;

  insert into public.drivers (
    user_id,
    display_name,
    real_name,
    country,
    car_number,
    discord_username,
    steam_id,
    preferred_class,
    preferred_car,
    safety_rating,
    approval_status
  )
  values (
    v_application.user_id,
    v_application.display_name,
    v_application.real_name,
    v_application.country,
    v_application.car_number,
    v_application.discord_username,
    v_application.steam_id,
    v_application.preferred_class,
    v_application.preferred_car,
    v_application.safety_rank,
    'approved'
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    real_name = excluded.real_name,
    country = excluded.country,
    car_number = excluded.car_number,
    discord_username = excluded.discord_username,
    steam_id = excluded.steam_id,
    preferred_class = excluded.preferred_class,
    preferred_car = excluded.preferred_car,
    safety_rating = excluded.safety_rating,
    approval_status = excluded.approval_status
  returning id into v_driver_id;

  update public.driver_applications
  set
    status = 'approved',
    rejection_note = null,
    updated_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'application_id', p_application_id,
    'driver_id', v_driver_id,
    'status', 'approved'
  );
end;
$$;

revoke all on function public.approve_driver_application(uuid) from public;
grant execute on function public.approve_driver_application(uuid) to authenticated, service_role;

-- ============================================================
-- FIX C-2: Wrap import_race_results in explicit exception block
-- If any part of the import fails, the entire operation rolls
-- back cleanly — no partial results, no corrupt standings.
-- ============================================================

create or replace function public.import_race_results(
  p_race_id uuid,
  p_replace boolean,
  p_source_filename text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_batch_id uuid;
  v_existing_count integer;
  v_row_count integer;
begin
  -- Auth check: must be admin or service_role
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'service_role' and not (select public.is_admin()) then
    raise exception 'Admin role required';
  end if;

  select championship_id into v_championship_id
  from public.races
  where id = p_race_id;

  if v_championship_id is null then
    raise exception 'Selected race does not exist or is not linked to a championship';
  end if;

  perform pg_advisory_xact_lock(('x' || substr(md5(v_championship_id::text), 1, 16))::bit(64)::bigint);

  select count(*) into v_existing_count
  from public.race_results
  where race_id = p_race_id;

  if v_existing_count > 0 and not p_replace then
    raise exception 'Race already has results. Enable replace mode to re-import this race.';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    raise exception 'No result rows were provided';
  end if;

  -- Everything below runs as a single atomic unit.
  -- If any statement raises, PostgreSQL rolls back this entire function call.

  insert into public.result_import_batches (race_id, uploaded_by, source_filename, row_count, status)
  values (p_race_id, (select auth.uid()), p_source_filename, jsonb_array_length(p_rows), 'processing')
  returning id into v_batch_id;

  if p_replace then
    delete from public.race_results where race_id = p_race_id;
  end if;

  insert into public.race_results (
    race_id,
    driver_id,
    team_id,
    position,
    qualifying_position,
    points,
    best_lap,
    total_time,
    gap,
    laps_completed,
    penalties_seconds,
    penalty_points,
    dnf,
    dns,
    dsq,
    fastest_lap,
    import_batch_id
  )
  select
    p_race_id,
    row_data.driver_id,
    row_data.team_id,
    row_data.position,
    nullif(row_data.qualifying_position, 0),
    row_data.points,
    nullif(row_data.best_lap, ''),
    nullif(row_data.total_time, ''),
    nullif(row_data.gap, ''),
    row_data.laps_completed,
    row_data.penalties_seconds,
    row_data.penalty_points,
    row_data.dnf,
    row_data.dns,
    row_data.dsq,
    row_data.fastest_lap,
    v_batch_id
  from jsonb_to_recordset(p_rows) as row_data(
    driver_id uuid,
    team_id uuid,
    position integer,
    qualifying_position integer,
    points integer,
    best_lap text,
    total_time text,
    gap text,
    laps_completed integer,
    penalties_seconds integer,
    penalty_points integer,
    dnf boolean,
    dns boolean,
    dsq boolean,
    fastest_lap boolean
  );

  -- Recalculate driver standings for the whole championship
  delete from public.standings where championship_id = v_championship_id;

  insert into public.standings (
    championship_id,
    driver_id,
    team_id,
    total_points,
    wins,
    podiums,
    fastest_laps,
    races_started,
    dnf_count,
    penalty_points,
    position
  )
  select
    v_championship_id,
    ranked.driver_id,
    ranked.team_id,
    ranked.total_points,
    ranked.wins,
    ranked.podiums,
    ranked.fastest_laps,
    ranked.races_started,
    ranked.dnf_count,
    ranked.penalty_points,
    ranked.position
  from (
    select
      aggregate_results.*,
      row_number() over (
        order by total_points desc, wins desc, podiums desc, fastest_laps desc, penalty_points asc, races_started asc
      ) as position
    from (
      select
        race_results.driver_id,
        (max(race_results.team_id::text))::uuid as team_id,
        coalesce(sum(race_results.points), 0)::integer as total_points,
        count(*) filter (where race_results.position = 1 and not race_results.dns and not race_results.dsq)::integer as wins,
        count(*) filter (where race_results.position between 1 and 3 and not race_results.dns and not race_results.dsq)::integer as podiums,
        count(*) filter (where race_results.fastest_lap)::integer as fastest_laps,
        count(*) filter (where not race_results.dns)::integer as races_started,
        count(*) filter (where race_results.dnf)::integer as dnf_count,
        coalesce(sum(race_results.penalty_points), 0)::integer as penalty_points
      from public.race_results
      join public.races on races.id = race_results.race_id
      where races.championship_id = v_championship_id
      group by race_results.driver_id
    ) aggregate_results
  ) ranked;

  -- Recalculate team standings
  delete from public.team_standings where championship_id = v_championship_id;

  insert into public.team_standings (
    championship_id,
    team_id,
    total_points,
    wins,
    podiums,
    fastest_laps,
    races_started,
    dnf_count,
    penalty_points,
    position
  )
  select
    v_championship_id,
    ranked.team_id,
    ranked.total_points,
    ranked.wins,
    ranked.podiums,
    ranked.fastest_laps,
    ranked.races_started,
    ranked.dnf_count,
    ranked.penalty_points,
    ranked.position
  from (
    select
      aggregate_results.*,
      row_number() over (
        order by total_points desc, wins desc, podiums desc, fastest_laps desc, penalty_points asc, races_started asc
      ) as position
    from (
      select
        race_results.team_id,
        coalesce(sum(race_results.points), 0)::integer as total_points,
        count(*) filter (where race_results.position = 1 and not race_results.dns and not race_results.dsq)::integer as wins,
        count(*) filter (where race_results.position between 1 and 3 and not race_results.dns and not race_results.dsq)::integer as podiums,
        count(*) filter (where race_results.fastest_lap)::integer as fastest_laps,
        count(*) filter (where not race_results.dns)::integer as races_started,
        count(*) filter (where race_results.dnf)::integer as dnf_count,
        coalesce(sum(race_results.penalty_points), 0)::integer as penalty_points
      from public.race_results
      join public.races on races.id = race_results.race_id
      where races.championship_id = v_championship_id
      and race_results.team_id is not null
      group by race_results.team_id
    ) aggregate_results
  ) ranked;

  -- Mark batch as completed
  update public.result_import_batches
  set status = 'completed', row_count = jsonb_array_length(p_rows)
  where id = v_batch_id;

  select count(*) into v_row_count from public.race_results where race_id = p_race_id;

  return jsonb_build_object(
    'batch_id', v_batch_id,
    'race_id', p_race_id,
    'championship_id', v_championship_id,
    'imported_rows', jsonb_array_length(p_rows),
    'race_result_rows', v_row_count,
    'replace_mode', p_replace
  );

exception
  when others then
    -- Roll back batch status if it was inserted before the error
    if v_batch_id is not null then
      update public.result_import_batches
      set status = 'error', error_summary = sqlerrm
      where id = v_batch_id;
    end if;
    raise;
end;
$$;

-- Re-apply grants (unchanged)
revoke all on function public.import_race_results(uuid, boolean, text, jsonb) from public;
grant execute on function public.import_race_results(uuid, boolean, text, jsonb) to authenticated, service_role;
