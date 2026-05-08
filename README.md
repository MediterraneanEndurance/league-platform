# Mediterranean Endurance League

Professional Le Mans Ultimate sim racing league platform for a European and global sim racing community.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase PostgreSQL, Auth and Storage
- Supabase Row Level Security
- Server-side admin route checks when Supabase is configured
- Vercel deployment

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The first version ships with neutral local seed data in `src/lib/league-data.ts`, so the public site works before Supabase credentials are connected.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Run `supabase/seed.sql` for example data.
4. Add values from Project Settings > API to `.env.local`.
5. Add `SUPABASE_SERVICE_ROLE_KEY` locally and in Vercel for server-only admin/application actions.
6. Create an admin user in Supabase Auth, then update `public.users.role` to `admin`.

If you already ran an older schema, run the incremental migration files instead of resetting the project:

```text
supabase/steward-reports-migration.sql
supabase/result-import-migration.sql
```

## Auth Setup

Auth is handled with Supabase Auth and server actions.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Flow:

1. User signs up at `/signup`.
2. The server action calls Supabase Auth.
3. The server action creates a matching `public.users` row using the service-role key.
4. New users always receive `role = viewer`.
5. Admin and steward roles are never selectable in the client UI.
6. Promote staff manually in Supabase SQL.

Promote the first admin:

```sql
update public.users
set role = 'admin'
where email = 'admin@example.com';
```

Promote a steward:

```sql
update public.users
set role = 'steward'
where email = 'steward@example.com';
```

In production, `/admin` will not render if Supabase environment variables are missing. Local development keeps a fallback so the dashboard shell remains visible before credentials are configured.

Security model:

- Public users can read calendar, standings, results, rules, streams and sponsors.
- Admins manage seasons, championships, races, results, standings, news, streams and sponsors.
- Stewards manage reports and penalties.
- Drivers can update their own profile and submit steward reports.

## Driver Applications

Driver applications use a separate `driver_applications` table. Authenticated users submit or update their own pending application. Admins review pending applications from `/admin`.

Approval flow:

1. Driver submits application with identity, age, Discord, Steam ID, car number, preferred LMU class, preferred car, safety rank and experience details.
2. Server action validates age, class, conditional experience/teammate fields and duplicate car number, Discord username and Steam ID.
3. Application is stored as `pending`.
4. Admin approves or rejects from `/admin`.
5. Approval creates or updates the `drivers` row; rejection keeps the application with a rejection note.

Duplicate checks use `SUPABASE_SERVICE_ROLE_KEY` server-side so the application can safely compare against all approved drivers and all pending applications without exposing those rows to the client.

## Steward Reports

Incident reporting is private by default and uses approved driver profiles.

Driver flow:

1. User signs in.
2. User must have an approved `drivers` row linked to their Auth user.
3. Driver opens `/steward-reports`.
4. Driver selects a race, reported driver, lap number, incident description and evidence URL.
5. The server action verifies the logged-in user and approved driver status before inserting `steward_reports`.
6. Drivers can see their own report history and status only.

Steward flow:

1. Promote a staff account to steward:

```sql
update public.users
set role = 'steward'
where email = 'steward@example.com';
```

2. The steward opens `/steward`.
3. The route checks `public.users.role` server-side and allows only `steward` or `admin`.
4. Stewards can review reports, set status, add decisions, add penalty recommendations and save penalty records.
5. Admins can also void reports. Voided reports are retained for audit history.

Privacy behavior:

- `steward_reports` are not public-readable.
- Report owners can read their own reports.
- Reported drivers can read reviewed reports involving them after the report moves beyond the private pending state.
- Stewards and admins can read and update all reports.
- Only approved drivers can insert reports.
- Normal drivers cannot insert or update penalties.
- Penalties are public-readable only for completed races; staff can read and manage all penalties.

Penalty records are saved to `penalties` and may be linked to `steward_reports.report_id`. This phase intentionally does not recalculate standings.

## Result Imports

The admin dashboard supports CSV/JSON preview and protected persistence for LMU result exports or manually prepared spreadsheets.

Example file: `seed-data/example-race-results.csv`

Supported columns:

```text
driver_name, car_number, team_name, position, qualifying_position, best_lap,
total_time, gap, laps_completed, penalties_seconds, dnf, dns, dsq, fastest_lap
```

Import flow:

1. Admin opens `/admin`.
2. Admin selects a race from Supabase.
3. Admin uploads or pastes CSV/JSON.
4. Preview matches drivers by `car_number`, then `display_name`, then optional `steam_id`.
5. Preview matches teams by `team_name` if present.
6. Admin reviews matched drivers, matched teams, calculated points, warnings and blocking errors.
7. If there are no blocking errors, admin confirms import.
8. A server action re-validates everything server-side and calls the `import_race_results` Supabase RPC.
9. The RPC creates a `result_import_batches` row, writes `race_results`, and recalculates `standings` plus `team_standings`.

Blocking validation:

- Missing required columns
- Duplicate driver in the same race
- Unmatched required driver
- Invalid position
- Negative penalty seconds or penalty points
- Missing or invalid selected race
- Race without a championship

Warnings:

- Blank or unmatched team
- Missing gap
- Missing total time
- Empty laps completed
- Unusual best lap format
- Non-standard boolean values

Duplicate import protection:

- If a race already has results, import is blocked by default.
- Enable “Replace existing results” to delete old rows for that race, import the new rows, and recalculate the full championship standings from all `race_results`.
- Teams are not created automatically from imports.

Default points are P1 25, P2 18, P3 15, P4 12, P5 10, P6 8, P7 6, P8 4, P9 2, P10 1, plus 1 fastest-lap bonus point. Admins can manually override points after review.

DNS and DSQ entries receive no normal finishing points. DNF entries receive no points by default unless `leagueConfig.pointsSystem.allowDnfPoints` is changed.

Transaction safety:

- Result persistence is handled by `public.import_race_results`.
- The function runs as one PostgreSQL transaction.
- If any insert or standings recalculation fails, the transaction rolls back and partial standings are not left behind.
- Failed imports can be recovered by fixing the CSV/JSON and importing again. If a completed import needs correction, use replace mode.

## Pages

- `/` home dashboard
- `/calendar`
- `/standings`
- `/drivers`
- `/teams`
- `/results`
- `/races/[id]`
- `/rules`
- `/steward-reports`
- `/steward`
- `/register`
- `/login`
- `/signup`
- `/sponsors`
- `/live`
- `/admin`

## Future Integration Points

The codebase is structured so these can be added without replacing the platform:

- LMU/rFactor 2 live timing API ingestion
- Discord bot integration
- Driver rating and safety rating jobs
- Automated incident tracking
- Paid entry and prize pool records
- Team applications
- Email notifications
- Season archives

Integration definitions live in `src/lib/integrations.ts`; the live timing contract starts in `src/lib/live-timing.ts`.

## Production Notes

- Keep admin mutations behind server actions or Supabase RPC functions.
- Keep Supabase RLS enabled for every table.
- Use a single import batch transaction for result saves and standings recalculation.
- Store sponsor, team and news images in Supabase Storage or the Next.js `public` directory.
- Avoid direct public writes from client components.
- Use Vercel preview deployments for steward/admin workflow testing before each round.

## Free-Tier Scaling Expectations

This app is mostly static and should comfortably handle a small Season 1 community on free-tier hosting if heavy realtime features are not enabled.

Practical limits to watch:

- Public pages: suitable for thousands of static page views per month.
- Admin imports: keep manual CSV files below 1 MB.
- Supabase free tier: monitor database size, auth users, storage and realtime connections.
- Live streams: embed external platforms; do not proxy video through Vercel.
- Future live timing: batch updates and throttle realtime fanout before enabling public timing screens.

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add environment variables from `.env.example`.
4. Set the production URL in `NEXT_PUBLIC_SITE_URL`.
5. Deploy.

For Supabase Auth redirects, add the Vercel production domain and local development URL to Supabase Auth URL settings.
