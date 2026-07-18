-- EPHS AI - migration 0002
-- Google-only authentication, role provisioning, onboarding responses,
-- transcript ingestion + review, confirmed academic records, course
-- equivalencies, locked plan courses, and auditing.
--
-- Additive and idempotent: safe to run on top of 0001. Profiles are extended
-- in place; new entities are created with owner-scoped Row Level Security.

-- ---------------------------------------------------------------------------
-- 1. Extend profiles with the verified Google identity + core student fields.
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists email text;
alter table profiles add column if not exists google_sub text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists preferred_first_name text;
alter table profiles add column if not exists current_school text;
alter table profiles add column if not exists counselor_name text;
alter table profiles add column if not exists student_type text
  check (student_type in ('new', 'returning'));
alter table profiles add column if not exists last_login_at timestamptz;

-- Prevent duplicate accounts for the same Google identity / normalized email.
create unique index if not exists profiles_email_unique
  on profiles (lower(email)) where email is not null;
create unique index if not exists profiles_google_sub_unique
  on profiles (google_sub) where google_sub is not null;

-- ---------------------------------------------------------------------------
-- 2. Administrator allowlist (DB-managed, in addition to the env allowlist).
--    Lets admins approve more administrators later without a code change.
-- ---------------------------------------------------------------------------

create table if not exists admin_allowlist (
  email text primary key,                 -- normalized lowercase email
  added_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Extended onboarding responses (1:1 with the student).
-- ---------------------------------------------------------------------------

create table if not exists student_onboarding (
  student_id uuid primary key references auth.users (id) on delete cascade,
  goals text not null default '',
  college_career_interests jsonb not null default '[]'::jsonb,
  favorite_subjects jsonb not null default '[]'::jsonb,
  challenging_subjects jsonb not null default '[]'::jsonb,
  program_interests jsonb not null default '[]'::jsonb,   -- honors|ap|cis|pseo|ep_online
  schedule_preference text not null default 'balanced'
    check (schedule_preference in ('rigorous', 'balanced', 'lighter')),
  commitments jsonb not null default '[]'::jsonb,         -- sports/clubs/jobs/family
  post_grad_plan text
    check (post_grad_plan in
      ('four_year', 'two_year', 'technical', 'workforce', 'military', 'undecided')),
  step_completed int not null default 0,                  -- autosave progress marker
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Transcripts: uploaded files + processing jobs + extracted rows.
-- ---------------------------------------------------------------------------

create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,             -- private bucket path; never exposed to the client
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'processed', 'failed', 'confirmed')),
  error_message text,                     -- safe, user-facing message only
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  confirmed_at timestamptz
);

create index if not exists transcripts_student_idx on transcripts (student_id);

create table if not exists transcript_jobs (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references transcripts (id) on delete cascade,
  provider text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed')),
  attempts int not null default 0,
  error text,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists transcript_jobs_transcript_idx on transcript_jobs (transcript_id);

create table if not exists transcript_extracted_rows (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references transcripts (id) on delete cascade,
  row_index int not null,
  raw_course_name text not null default '',
  raw_course_code text,
  school_year text,
  grade_level int check (grade_level between 6 and 12),
  term text,
  final_grade text,
  credits_attempted numeric,
  credits_earned numeric,
  course_level text,
  is_honors boolean not null default false,
  is_ap boolean not null default false,
  in_progress boolean not null default false,
  is_repeat boolean not null default false,
  is_incomplete boolean not null default false,
  is_transfer boolean not null default false,
  matched_course_id text,                 -- proposed catalog id
  match_confidence text not null default 'needs_review'
    check (match_confidence in ('high', 'possible', 'needs_review', 'none')),
  match_method text,
  confirmed boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists transcript_rows_transcript_idx
  on transcript_extracted_rows (transcript_id);

-- ---------------------------------------------------------------------------
-- 5. Confirmed academic records (structured history, not free text).
-- ---------------------------------------------------------------------------

create table if not exists academic_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  course_id text,                         -- confirmed catalog match, null when transfer/unmatched
  original_course_name text,              -- name as it appeared on the transcript / as entered
  source text not null default 'manual'
    check (source in ('transcript', 'manual')),
  source_transcript_id uuid references transcripts (id) on delete set null,
  source_row_id uuid references transcript_extracted_rows (id) on delete set null,
  record_type text not null default 'completed'
    check (record_type in
      ('completed', 'in_progress', 'transfer', 'manual', 'repeat_needed', 'unmatched')),
  grade_level int check (grade_level between 6 and 12),
  school_year text,
  term text,
  final_grade text,
  credits_earned numeric,
  is_honors boolean not null default false,
  is_ap boolean not null default false,
  is_transfer boolean not null default false,
  confidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_records_student_idx on academic_records (student_id);
create index if not exists academic_records_course_idx on academic_records (course_id);

-- Prevent accidental duplicate completed records for the same student+course+term.
create unique index if not exists academic_records_dedupe
  on academic_records (student_id, coalesce(course_id, original_course_name), coalesce(term, ''), coalesce(school_year, ''))
  where record_type in ('completed', 'in_progress', 'transfer');

-- ---------------------------------------------------------------------------
-- 6. Course equivalencies (admin-managed) to improve transcript matching.
-- ---------------------------------------------------------------------------

create table if not exists course_equivalencies (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,              -- normalized external/renamed/old title
  course_id text,                         -- catalog id it maps to; null = known no-EPHS-equivalent (transfer)
  is_transfer boolean not null default false,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists course_equivalencies_source_unique
  on course_equivalencies (lower(source_name));

-- ---------------------------------------------------------------------------
-- 7. Locked courses + recommendation explanations on plan entries.
-- ---------------------------------------------------------------------------

alter table plan_entries add column if not exists locked boolean not null default false;
alter table plan_entries add column if not exists source text not null default 'student'
  check (source in ('recommended', 'student', 'transcript'));
alter table plan_entries add column if not exists recommendation_reason text;

-- ---------------------------------------------------------------------------
-- 8. Auditing: add filterable columns to the existing audit_events table.
-- ---------------------------------------------------------------------------

alter table audit_events add column if not exists actor_email text;
alter table audit_events add column if not exists target_student_id uuid;

create index if not exists audit_events_actor_idx on audit_events (actor_id);
create index if not exists audit_events_target_idx on audit_events (target_student_id);
create index if not exists audit_events_created_idx on audit_events (created_at desc);

-- ---------------------------------------------------------------------------
-- 9. Row Level Security for the new tables.
-- ---------------------------------------------------------------------------

alter table admin_allowlist enable row level security;
alter table student_onboarding enable row level security;
alter table transcripts enable row level security;
alter table transcript_jobs enable row level security;
alter table transcript_extracted_rows enable row level security;
alter table academic_records enable row level security;
alter table course_equivalencies enable row level security;

-- Admin allowlist: only admins may read/write (service role bypasses RLS).
drop policy if exists admin_allowlist_admin on admin_allowlist;
create policy admin_allowlist_admin on admin_allowlist for all
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

-- Onboarding: owner full access; admins read.
drop policy if exists onboarding_owner on student_onboarding;
create policy onboarding_owner on student_onboarding for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists onboarding_admin_read on student_onboarding;
create policy onboarding_admin_read on student_onboarding for select
  using (current_app_role() = 'admin');

-- Transcripts: owner full access; admins read.
drop policy if exists transcripts_owner on transcripts;
create policy transcripts_owner on transcripts for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists transcripts_admin_read on transcripts;
create policy transcripts_admin_read on transcripts for select
  using (current_app_role() = 'admin');

-- Transcript jobs / rows: scoped through the owning transcript.
drop policy if exists transcript_jobs_owner on transcript_jobs;
create policy transcript_jobs_owner on transcript_jobs for all
  using (exists (
    select 1 from transcripts t
    where t.id = transcript_jobs.transcript_id and t.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from transcripts t
    where t.id = transcript_jobs.transcript_id and t.student_id = auth.uid()
  ));
drop policy if exists transcript_jobs_admin_read on transcript_jobs;
create policy transcript_jobs_admin_read on transcript_jobs for select
  using (current_app_role() = 'admin');

drop policy if exists transcript_rows_owner on transcript_extracted_rows;
create policy transcript_rows_owner on transcript_extracted_rows for all
  using (exists (
    select 1 from transcripts t
    where t.id = transcript_extracted_rows.transcript_id and t.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from transcripts t
    where t.id = transcript_extracted_rows.transcript_id and t.student_id = auth.uid()
  ));
drop policy if exists transcript_rows_admin_read on transcript_extracted_rows;
create policy transcript_rows_admin_read on transcript_extracted_rows for select
  using (current_app_role() = 'admin');

-- Academic records: owner full access; admins read.
drop policy if exists academic_records_owner on academic_records;
create policy academic_records_owner on academic_records for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists academic_records_admin_read on academic_records;
create policy academic_records_admin_read on academic_records for select
  using (current_app_role() = 'admin');

-- Course equivalencies: public read (used by matching); admin write.
drop policy if exists course_equivalencies_read on course_equivalencies;
create policy course_equivalencies_read on course_equivalencies for select
  to anon, authenticated using (true);
drop policy if exists course_equivalencies_admin_write on course_equivalencies;
create policy course_equivalencies_admin_write on course_equivalencies for all
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

-- Admins may write audit events (in addition to service-role writes) and read them.
drop policy if exists audit_admin_insert on audit_events;
create policy audit_admin_insert on audit_events for insert
  with check (current_app_role() = 'admin' or actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 10. Private transcript storage bucket + object policies.
--     Files live under `{student_id}/...`; a student may only touch their own
--     folder. Admins read via the service role (RLS-exempt) with auditing.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('transcripts', 'transcripts', false)
on conflict (id) do nothing;

drop policy if exists transcripts_storage_owner_read on storage.objects;
create policy transcripts_storage_owner_read on storage.objects for select
  using (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists transcripts_storage_owner_write on storage.objects;
create policy transcripts_storage_owner_write on storage.objects for insert
  with check (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists transcripts_storage_owner_delete on storage.objects;
create policy transcripts_storage_owner_delete on storage.objects for delete
  using (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
