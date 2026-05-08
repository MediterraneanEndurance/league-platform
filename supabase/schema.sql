create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'steward', 'driver', 'viewer');
create type season_status as enum ('upcoming', 'active', 'completed');
create type race_status as enum ('upcoming', 'live', 'completed');
create type registration_status as enum ('open', 'closed', 'waitlist');
create type report_status as enum ('pending', 'under_review', 'accepted', 'rejected');
create type stream_platform as enum ('twitch', 'kick', 'youtube');
create type lmu_class as enum ('Hypercar', 'LMP2', 'LMGT3', 'Multi-class');
create type race_format_option as enum ('Practice', 'Qualifying', 'Sprint Race', 'Endurance Race', 'Multi-class Race', 'Test Race', 'Championship Round', 'Special Event');
create type setup_option as enum ('Fixed setup', 'Open setup');
create type application_status as enum ('pending', 'approved', 'rejected');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  country text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null unique,
  display_name text not null,
  real_name text,
  country text not null,
  region text,
  car_number integer not null unique,
  team_id uuid references public.teams(id) on delete set null,
  discord_username text unique,
  steam_id text unique,
  preferred_class lmu_class not null default 'LMGT3',
  preferred_car text,
  rating integer default 1500,
  safety_rating text default 'R',
  approval_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  real_name text not null,
  age integer not null check (age between 13 and 80),
  country text not null,
  discord_username text not null,
  steam_id text not null,
  car_number integer not null check (car_number between 1 and 999),
  preferred_class lmu_class not null,
  preferred_car text not null,
  safety_rank text not null,
  previous_league_experience boolean not null default false,
  previous_league_experience_details text,
  has_teammate boolean not null default false,
  teammate_info text,
  team_name text,
  admin_notes text,
  status application_status not null default 'pending',
  rejection_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint previous_experience_details_required check (
    previous_league_experience = false or length(coalesce(previous_league_experience_details, '')) >= 5
  ),
  constraint teammate_info_required check (
    has_teammate = false or length(coalesce(teammate_info, '')) >= 2
  )
);

create unique index driver_applications_one_pending_per_user
on public.driver_applications (user_id)
where status = 'pending';

create unique index driver_applications_pending_discord_unique
on public.driver_applications (lower(discord_username))
where status = 'pending';

create unique index driver_applications_pending_steam_unique
on public.driver_applications (steam_id)
where status = 'pending';

create unique index driver_applications_pending_car_number_unique
on public.driver_applications (car_number)
where status = 'pending';

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year integer not null,
  status season_status not null default 'upcoming',
  created_at timestamptz not null default now()
);

create table public.championships (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,
  car_class lmu_class not null,
  description text,
  status season_status not null default 'upcoming',
  created_at timestamptz not null default now()
);

create table public.races (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  track_name text not null,
  race_date timestamptz not null,
  format text not null,
  category race_format_option not null default 'Championship Round',
  setup setup_option not null default 'Fixed setup',
  car_class lmu_class not null,
  registration_status registration_status not null default 'closed',
  status race_status not null default 'upcoming',
  stream_url text,
  replay_url text,
  created_at timestamptz not null default now()
);

create table public.race_results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  position integer not null,
  qualifying_position integer,
  points integer not null default 0,
  best_lap text,
  total_time text,
  gap text,
  laps_completed integer default 0,
  penalties_seconds integer default 0,
  penalty_points integer default 0,
  dnf boolean not null default false,
  dns boolean not null default false,
  dsq boolean not null default false,
  fastest_lap boolean not null default false,
  created_at timestamptz not null default now(),
  unique (race_id, driver_id)
);

create table public.result_import_batches (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  source_filename text,
  row_count integer not null default 0,
  status text not null default 'previewed',
  error_summary text,
  created_at timestamptz not null default now()
);

alter table public.race_results
add column import_batch_id uuid references public.result_import_batches(id) on delete set null;

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  total_points integer not null default 0,
  wins integer not null default 0,
  podiums integer not null default 0,
  fastest_laps integer not null default 0,
  races_started integer not null default 0,
  dnf_count integer not null default 0,
  penalty_points integer not null default 0,
  position integer not null,
  unique (championship_id, driver_id)
);

create table public.team_standings (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  total_points integer not null default 0,
  wins integer not null default 0,
  podiums integer not null default 0,
  fastest_laps integer not null default 0,
  races_started integer not null default 0,
  dnf_count integer not null default 0,
  penalty_points integer not null default 0,
  position integer not null,
  unique (championship_id, team_id)
);

create table public.penalties (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  reason text not null,
  seconds integer not null default 0,
  penalty_points integer not null default 0,
  steward_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.steward_reports (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  reporting_driver_id uuid not null references public.drivers(id) on delete cascade,
  reported_driver_id uuid not null references public.drivers(id) on delete cascade,
  lap_number integer not null check (lap_number > 0),
  description text not null,
  evidence_url text not null,
  incident_type text,
  corner_name text,
  timestamp_in_video text,
  status report_status not null default 'pending',
  steward_decision text,
  penalty_recommendation text,
  resolved_at timestamptz,
  voided boolean not null default false,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drivers_cannot_report_self check (reporting_driver_id <> reported_driver_id)
);

alter table public.penalties
add column report_id uuid references public.steward_reports(id) on delete set null;

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.streams (
  id uuid primary key default gen_random_uuid(),
  race_id uuid references public.races(id) on delete cascade,
  platform stream_platform not null,
  stream_url text,
  replay_url text,
  created_at timestamptz not null default now()
);

create table public.community_visits (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null default current_date,
  visitor_hash text not null,
  path text not null default '/',
  created_at timestamptz not null default now(),
  unique (visit_date, visitor_hash)
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  tier text not null default 'community',
  active boolean not null default true
);

alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_applications enable row level security;
alter table public.seasons enable row level security;
alter table public.championships enable row level security;
alter table public.races enable row level security;
alter table public.race_results enable row level security;
alter table public.result_import_batches enable row level security;
alter table public.standings enable row level security;
alter table public.team_standings enable row level security;
alter table public.penalties enable row level security;
alter table public.steward_reports enable row level security;
alter table public.news_posts enable row level security;
alter table public.streams enable row level security;
alter table public.community_visits enable row level security;
alter table public.sponsors enable row level security;

create or replace function public.current_role()
returns user_role
language sql
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where id = (select auth.uid())), 'viewer'::user_role);
$$;

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

drop policy if exists "Public read approved driver profile fields" on public.drivers;
create policy "Public read approved driver profile fields" on public.drivers
for select using (approval_status = 'approved');

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

create policy "Public read teams" on public.teams for select using (true);
create policy "Users read own applications" on public.driver_applications
for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Public read seasons" on public.seasons for select using (true);
create policy "Public read championships" on public.championships for select using (true);
create policy "Public read races" on public.races for select using (true);
create policy "Public read completed results" on public.race_results
for select using (
  (select public.is_admin())
  or exists (
    select 1 from public.races
    where races.id = race_results.race_id
    and races.status = 'completed'::race_status
  )
);
create policy "Admins read import batches" on public.result_import_batches for select using ((select public.is_admin()));
create policy "Public read active standings" on public.standings
for select using (
  (select public.is_admin())
  or exists (
    select 1 from public.races
    where races.championship_id = standings.championship_id
    and races.status = 'completed'::race_status
  )
);
create policy "Public read active team standings" on public.team_standings
for select using (
  (select public.is_admin())
  or exists (
    select 1 from public.races
    where races.championship_id = team_standings.championship_id
    and races.status = 'completed'::race_status
  )
);
create policy "Public read published news" on public.news_posts for select using (published = true or (select public.is_admin()));
create policy "Public read streams" on public.streams for select using (true);
create policy "Admins read community visits" on public.community_visits for select using ((select public.is_admin()));
create policy "Public read sponsors" on public.sponsors for select using (active = true or (select public.is_admin()));
create policy "Drivers read own submitted reports" on public.steward_reports
for select using (
  exists (
    select 1 from public.drivers
    where drivers.id = steward_reports.reporting_driver_id
    and drivers.user_id = (select auth.uid())
  )
);

create policy "Reported drivers read reviewed reports" on public.steward_reports
for select using (
  status in ('under_review'::report_status, 'accepted'::report_status, 'rejected'::report_status)
  and exists (
    select 1 from public.drivers
    where drivers.id = steward_reports.reported_driver_id
    and drivers.user_id = (select auth.uid())
  )
);

create policy "Stewards read all reports" on public.steward_reports
for select using ((select public.is_steward_or_admin()));
create policy "Users read own account" on public.users for select using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage users" on public.users for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Drivers read own profile" on public.drivers
for select using (user_id = (select auth.uid()));
create policy "Staff read drivers" on public.drivers
for select using ((select public.is_steward_or_admin()));
create policy "Users create own pending applications" on public.driver_applications
for insert with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and rejection_note is null
);

create policy "Users edit own pending applications" on public.driver_applications
for update using (user_id = (select auth.uid()) and status = 'pending')
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and rejection_note is null
);

create policy "Admins manage applications" on public.driver_applications
for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage drivers" on public.drivers for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage teams" on public.teams for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage seasons" on public.seasons for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage championships" on public.championships for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage races" on public.races for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage results" on public.race_results for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage import batches" on public.result_import_batches for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage standings" on public.standings for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage team standings" on public.team_standings for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage sponsors" on public.sponsors for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage news" on public.news_posts for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage streams" on public.streams for all using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage community visits" on public.community_visits for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Drivers update own profile" on public.drivers
for update using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

revoke update on public.drivers from authenticated;
grant update (
  display_name,
  real_name,
  country,
  region,
  discord_username,
  steam_id,
  preferred_class,
  preferred_car
) on public.drivers to authenticated;

create policy "Drivers submit reports" on public.steward_reports
for insert with check (
  status = 'pending'::report_status
  and steward_decision is null
  and penalty_recommendation is null
  and resolved_at is null
  and voided = false
  and exists (
    select 1 from public.drivers
    where id = reporting_driver_id
    and user_id = (select auth.uid())
    and approval_status = 'approved'
  )
);

create policy "Stewards manage reports" on public.steward_reports
for update using ((select public.is_steward_or_admin()))
with check ((select public.is_steward_or_admin()));

create policy "Admins delete reports" on public.steward_reports
for delete using ((select public.is_admin()));

create policy "Public read completed race penalties" on public.penalties
for select using (
  (select public.is_steward_or_admin())
  or exists (
    select 1 from public.races
    where races.id = penalties.race_id
    and races.status = 'completed'::race_status
  )
);

create policy "Stewards manage penalties" on public.penalties
for all using ((select public.is_steward_or_admin()))
with check ((select public.is_steward_or_admin()));

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

create trigger penalties_driver_race_participation
before insert or update of race_id, driver_id on public.penalties
for each row execute function public.validate_penalty_driver_race();

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
end;
$$;

revoke all on function public.import_race_results(uuid, boolean, text, jsonb) from public;
grant execute on function public.import_race_results(uuid, boolean, text, jsonb) to authenticated, service_role;
