alter table public.steward_reports
add column if not exists incident_type text,
add column if not exists corner_name text,
add column if not exists timestamp_in_video text,
add column if not exists penalty_recommendation text,
add column if not exists resolved_at timestamptz,
add column if not exists voided boolean not null default false,
add column if not exists void_reason text,
add column if not exists updated_at timestamptz not null default now();

alter table public.steward_reports
alter column evidence_url set not null;

alter table public.penalties
add column if not exists report_id uuid references public.steward_reports(id) on delete set null,
add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Public read steward reports" on public.steward_reports;
drop policy if exists "Drivers read own submitted reports" on public.steward_reports;
drop policy if exists "Reported drivers read reviewed reports" on public.steward_reports;
drop policy if exists "Stewards read all reports" on public.steward_reports;
drop policy if exists "Drivers submit reports" on public.steward_reports;
drop policy if exists "Stewards manage reports" on public.steward_reports;
drop policy if exists "Admins delete reports" on public.steward_reports;
drop policy if exists "Public read completed race penalties" on public.penalties;
drop policy if exists "Stewards manage penalties" on public.penalties;

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
