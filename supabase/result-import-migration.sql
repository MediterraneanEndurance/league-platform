drop policy if exists "Public read results" on public.race_results;
drop policy if exists "Public read completed results" on public.race_results;
drop policy if exists "Public read standings" on public.standings;
drop policy if exists "Public read active standings" on public.standings;
drop policy if exists "Public read team standings" on public.team_standings;
drop policy if exists "Public read active team standings" on public.team_standings;

create policy "Public read completed results" on public.race_results
for select using (
  (select public.is_admin())
  or exists (
    select 1 from public.races
    where races.id = race_results.race_id
    and races.status = 'completed'::race_status
  )
);

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

  select championship_id into v_championship_id from public.races where id = p_race_id;
  if v_championship_id is null then
    raise exception 'Selected race does not exist or is not linked to a championship';
  end if;

  perform pg_advisory_xact_lock(('x' || substr(md5(v_championship_id::text), 1, 16))::bit(64)::bigint);

  select count(*) into v_existing_count from public.race_results where race_id = p_race_id;
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
    race_id, driver_id, team_id, position, qualifying_position, points, best_lap, total_time, gap,
    laps_completed, penalties_seconds, penalty_points, dnf, dns, dsq, fastest_lap, import_batch_id
  )
  select
    p_race_id, row_data.driver_id, row_data.team_id, row_data.position, nullif(row_data.qualifying_position, 0),
    row_data.points, nullif(row_data.best_lap, ''), nullif(row_data.total_time, ''), nullif(row_data.gap, ''),
    row_data.laps_completed, row_data.penalties_seconds, row_data.penalty_points, row_data.dnf, row_data.dns,
    row_data.dsq, row_data.fastest_lap, v_batch_id
  from jsonb_to_recordset(p_rows) as row_data(
    driver_id uuid, team_id uuid, position integer, qualifying_position integer, points integer,
    best_lap text, total_time text, gap text, laps_completed integer, penalties_seconds integer,
    penalty_points integer, dnf boolean, dns boolean, dsq boolean, fastest_lap boolean
  );

  delete from public.standings where championship_id = v_championship_id;

  insert into public.standings (
    championship_id, driver_id, team_id, total_points, wins, podiums, fastest_laps,
    races_started, dnf_count, penalty_points, position
  )
  select
    v_championship_id, ranked.driver_id, ranked.team_id, ranked.total_points, ranked.wins,
    ranked.podiums, ranked.fastest_laps, ranked.races_started, ranked.dnf_count,
    ranked.penalty_points, ranked.position
  from (
    select aggregate_results.*,
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
    championship_id, team_id, total_points, wins, podiums, fastest_laps,
    races_started, dnf_count, penalty_points, position
  )
  select
    v_championship_id, ranked.team_id, ranked.total_points, ranked.wins, ranked.podiums,
    ranked.fastest_laps, ranked.races_started, ranked.dnf_count, ranked.penalty_points, ranked.position
  from (
    select aggregate_results.*,
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
      where races.championship_id = v_championship_id and race_results.team_id is not null
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
