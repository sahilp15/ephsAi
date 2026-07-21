-- EPHS AI - migration 0003
-- Administrator-managed clubs overlay and course availability/duration
-- overrides.
--
-- Additive and idempotent: safe to run on top of 0002.
--
--   * `clubs` overlays the official-grounded seed (`data/ephs-clubs.json`).
--     Admin upserts (by id) and soft-deletes (`deleted`) apply instantly to the
--     student Clubs page and the chatbot via `lib/clubs/store.ts`.
--   * `course_overrides` lets an admin deactivate a catalog course or override
--     its duration (term count) without editing the extracted dataset.
--
-- Both tables allow public/anon SELECT (students read active clubs and see the
-- effect of overrides); only administrators may write.

-- ---------------------------------------------------------------------------
-- 1. Clubs overlay.
-- ---------------------------------------------------------------------------

create table if not exists clubs (
  id text primary key,                        -- stable slug id
  name text not null,
  description text not null default '',
  description_source text not null default 'general'
    check (description_source in ('official', 'general')),
  category text not null default '',
  advisor text,
  student_leaders text[] not null default '{}',
  meeting_days text[] not null default '{}',
  meeting_time text,
  meeting_frequency text,
  location text,
  grades text[] not null default '{}',
  membership_requirements text,
  contact_email text,
  join_instructions text,
  website text,
  registration_url text,
  additional_notes text,
  source_url text not null default '',
  active boolean not null default true,
  deleted boolean not null default false,     -- soft delete keeps edit history
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clubs_active_idx on clubs (active) where deleted = false;

-- ---------------------------------------------------------------------------
-- 2. Course availability + duration overrides.
-- ---------------------------------------------------------------------------

create table if not exists course_overrides (
  course_id text primary key,                 -- catalog course id
  active boolean not null default true,
  term_count int,                             -- null = use the guide's duration
  note text,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security. Public read; admin write (service role is RLS-exempt).
-- ---------------------------------------------------------------------------

alter table clubs enable row level security;
alter table course_overrides enable row level security;

-- Clubs: public read (student page + chatbot); admins may create/update/delete.
drop policy if exists clubs_read on clubs;
create policy clubs_read on clubs for select
  to anon, authenticated using (true);
drop policy if exists clubs_admin_write on clubs;
create policy clubs_admin_write on clubs for all
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

-- Course overrides: public read (student catalog reflects deactivations);
-- admins may create/update/delete.
drop policy if exists course_overrides_read on course_overrides;
create policy course_overrides_read on course_overrides for select
  to anon, authenticated using (true);
drop policy if exists course_overrides_admin_write on course_overrides;
create policy course_overrides_admin_write on course_overrides for all
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');
