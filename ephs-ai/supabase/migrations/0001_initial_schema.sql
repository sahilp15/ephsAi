-- EPHS AI — initial schema
-- Production persistence path: Supabase Postgres + Auth + RLS.
-- The local MVP serves the same data from the versioned JSON dataset; this
-- schema mirrors it 1:1 so `npm run data:import` can load it idempotently.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Catalog versioning
-- ---------------------------------------------------------------------------

create table if not exists course_guide_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null,
  schema_version text not null,
  academic_year text not null,
  source_filename text not null,
  source_sha256 text not null unique,
  is_active boolean not null default false,
  imported_at timestamptz not null default now(),
  import_summary jsonb not null default '{}'::jsonb
);

-- Only one active guide version at a time.
create unique index if not exists one_active_guide
  on course_guide_versions (is_active) where is_active;

create table if not exists courses (
  id text not null,                       -- stable id from the JSON
  guide_version_id uuid not null references course_guide_versions (id) on delete cascade,
  title text not null,
  primary_department text not null,
  description text not null default '',
  prerequisite_raw text,
  grades_raw text,
  grades_allowed int[] not null default '{}',
  credits_raw text,
  term_length_interpretation text,
  college_credit_available boolean not null default false,
  college_credit_raw jsonb not null default '[]'::jsonb,
  flags jsonb not null default '{}'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  graduation_requirement_statements jsonb not null default '[]'::jsonb,
  data_quality jsonb not null default '{}'::jsonb,
  raw_titles_seen jsonb not null default '[]'::jsonb,
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(primary_department, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(prerequisite_raw, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  primary key (guide_version_id, id)
);

create index if not exists courses_search_idx on courses using gin (search_document);
create index if not exists courses_title_trgm_idx on courses using gin (title gin_trgm_ops);
create index if not exists courses_department_idx on courses (guide_version_id, primary_department);

create table if not exists course_departments (
  guide_version_id uuid not null,
  course_id text not null,
  department text not null,
  primary key (guide_version_id, course_id, department),
  foreign key (guide_version_id, course_id) references courses (guide_version_id, id) on delete cascade
);

create table if not exists course_source_appearances (
  guide_version_id uuid not null,
  appearance_id text not null,
  course_id text not null,
  raw_title text not null,
  title text not null,
  department text not null,
  source_page int not null,
  source_column int,
  payload jsonb not null,                 -- full appearance record, preserved verbatim
  primary key (guide_version_id, appearance_id),
  foreign key (guide_version_id, course_id) references courses (guide_version_id, id) on delete cascade
);

create table if not exists course_source_pages (
  guide_version_id uuid not null,
  course_id text not null,
  source_page int not null,
  primary key (guide_version_id, course_id, source_page),
  foreign key (guide_version_id, course_id) references courses (guide_version_id, id) on delete cascade
);

create table if not exists course_aliases (
  guide_version_id uuid not null,
  course_id text not null,
  alias text not null,
  primary key (guide_version_id, course_id, alias),
  foreign key (guide_version_id, course_id) references courses (guide_version_id, id) on delete cascade
);

create index if not exists course_aliases_trgm_idx on course_aliases using gin (alias gin_trgm_ops);

create table if not exists course_flags (
  guide_version_id uuid not null,
  course_id text not null,
  flag text not null,                     -- ap | honors | capstone | skinny | cis | new_course
  primary key (guide_version_id, course_id, flag),
  foreign key (guide_version_id, course_id) references courses (guide_version_id, id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Pathways
-- ---------------------------------------------------------------------------

create table if not exists pathways (
  guide_version_id uuid not null references course_guide_versions (id) on delete cascade,
  id text not null,
  name text not null,
  description text not null default '',
  source_pages int[] not null default '{}',
  primary key (guide_version_id, id)
);

create table if not exists pathway_capstones (
  guide_version_id uuid not null,
  pathway_id text not null,
  name text not null,
  raw_entry text not null,
  markers_raw jsonb not null default '[]'::jsonb,
  resolved_course_id text,
  primary key (guide_version_id, pathway_id, raw_entry),
  foreign key (guide_version_id, pathway_id) references pathways (guide_version_id, id) on delete cascade
);

create table if not exists pathway_supporting_courses (
  guide_version_id uuid not null,
  pathway_id text not null,
  name text not null,
  raw_entry text not null,
  markers_raw jsonb not null default '[]'::jsonb,  -- *, **, TC, •, @ preserved verbatim
  resolved_course_id text,
  primary key (guide_version_id, pathway_id, raw_entry),
  foreign key (guide_version_id, pathway_id) references pathways (guide_version_id, id) on delete cascade
);

create table if not exists pathway_external_or_unresolved_courses (
  guide_version_id uuid not null,
  pathway_id text not null,
  name text not null,
  primary key (guide_version_id, pathway_id, name),
  foreign key (guide_version_id, pathway_id) references pathways (guide_version_id, id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Graduation and program data
-- ---------------------------------------------------------------------------

create table if not exists graduation_rule_sets (
  guide_version_id uuid not null references course_guide_versions (id) on delete cascade,
  id text not null,                       -- class_of_2027 | class_of_2028_and_beyond
  label text not null,
  source_page int,
  payload jsonb not null,
  primary key (guide_version_id, id)
);

create table if not exists graduation_rules (
  guide_version_id uuid not null,
  rule_set_id text not null,
  rule text not null,                     -- e.g. technology_credit_required
  value jsonb not null,
  primary key (guide_version_id, rule_set_id, rule),
  foreign key (guide_version_id, rule_set_id)
    references graduation_rule_sets (guide_version_id, id) on delete cascade
);

create table if not exists arts_requirement_courses (
  guide_version_id uuid not null references course_guide_versions (id) on delete cascade,
  department text not null,
  course_name text not null,
  resolved_course_id text,
  primary key (guide_version_id, department, course_name)
);

create table if not exists school_programs (
  guide_version_id uuid not null references course_guide_versions (id) on delete cascade,
  id text not null,                       -- ep_online | pseo | ...
  payload jsonb not null,
  primary key (guide_version_id, id)
);

create table if not exists guide_source_pages (
  guide_version_id uuid not null references course_guide_versions (id) on delete cascade,
  page int not null,
  title text not null default '',
  raw_layout_text text not null default '',
  primary key (guide_version_id, page)
);

-- ---------------------------------------------------------------------------
-- Users and plans
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'counselor', 'admin')),
  display_name text not null default '',
  graduation_year int,
  current_grade int check (current_grade between 9 and 12),
  interests jsonb not null default '[]'::jsonb,
  career_ideas jsonb not null default '[]'::jsonb,
  rigor text not null default 'balanced' check (rigor in ('standard', 'balanced', 'challenging')),
  ap_interest boolean not null default false,
  pathway_interests jsonb not null default '[]'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists counselor_students (
  counselor_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (counselor_id, student_id)
);

create table if not exists student_course_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  course_id text,                         -- matched catalog id, when matched
  original_course_name text,              -- as entered, when unmatched
  status text not null default 'completed' check (status in ('completed', 'in_progress', 'dropped')),
  grade_level_taken int check (grade_level_taken between 6 and 12),
  term_or_year text,
  credits_earned numeric
);

create index if not exists history_student_idx on student_course_history (student_id);

create table if not exists academic_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My four-year plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_student_idx on academic_plans (student_id);

create table if not exists plan_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references academic_plans (id) on delete cascade,
  course_id text not null,
  grade_year int not null check (grade_year between 9 and 12),
  starting_term int not null check (starting_term between 1 and 4),
  occupied_terms int not null default 1 check (occupied_terms between 1 and 4),
  status text not null default 'planned' check (status in ('planned', 'completed', 'dropped', 'considering')),
  student_note text,
  counselor_note text
);

create index if not exists plan_entries_plan_idx on plan_entries (plan_id);

-- ---------------------------------------------------------------------------
-- AI recommendations
-- ---------------------------------------------------------------------------

create table if not exists recommendation_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('ai', 'smart_match')),
  model text,
  created_at timestamptz not null default now()
);

create index if not exists rec_sessions_student_idx on recommendation_sessions (student_id);

create table if not exists recommendation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references recommendation_sessions (id) on delete cascade,
  role text not null check (role in ('student', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists recommendation_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references recommendation_sessions (id) on delete cascade,
  course_id text not null,
  rank int not null,
  payload jsonb not null                  -- full validated recommendation item
);

create table if not exists recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references recommendation_results (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  helpful boolean,
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auditing
-- ---------------------------------------------------------------------------

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists admin_import_jobs (
  id uuid primary key default gen_random_uuid(),
  guide_version_id uuid references course_guide_versions (id) on delete set null,
  status text not null check (status in ('pending', 'running', 'succeeded', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Catalog tables are public-read; import runs with the service role.
-- Student tables: owner-only; counselors read students shared with them.
-- ---------------------------------------------------------------------------

alter table course_guide_versions enable row level security;
alter table courses enable row level security;
alter table course_departments enable row level security;
alter table course_source_appearances enable row level security;
alter table course_source_pages enable row level security;
alter table course_aliases enable row level security;
alter table course_flags enable row level security;
alter table pathways enable row level security;
alter table pathway_capstones enable row level security;
alter table pathway_supporting_courses enable row level security;
alter table pathway_external_or_unresolved_courses enable row level security;
alter table graduation_rule_sets enable row level security;
alter table graduation_rules enable row level security;
alter table arts_requirement_courses enable row level security;
alter table school_programs enable row level security;
alter table guide_source_pages enable row level security;
alter table profiles enable row level security;
alter table counselor_students enable row level security;
alter table student_course_history enable row level security;
alter table academic_plans enable row level security;
alter table plan_entries enable row level security;
alter table recommendation_sessions enable row level security;
alter table recommendation_messages enable row level security;
alter table recommendation_results enable row level security;
alter table recommendation_feedback enable row level security;
alter table audit_events enable row level security;
alter table admin_import_jobs enable row level security;

-- Public catalog read access (anon + authenticated).
do $$
declare t text;
begin
  foreach t in array array[
    'course_guide_versions','courses','course_departments','course_source_appearances',
    'course_source_pages','course_aliases','course_flags','pathways','pathway_capstones',
    'pathway_supporting_courses','pathway_external_or_unresolved_courses',
    'graduation_rule_sets','graduation_rules','arts_requirement_courses',
    'school_programs','guide_source_pages'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_public_read', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;

-- Helper: current user's role.
create or replace function current_app_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where user_id = auth.uid()), 'student');
$$;

-- Profiles: self read/write; counselors read shared students; admins read all.
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles for select
  using (
    user_id = auth.uid()
    or current_app_role() = 'admin'
    or exists (
      select 1 from counselor_students cs
      where cs.student_id = profiles.user_id and cs.counselor_id = auth.uid()
    )
  );
drop policy if exists profiles_self_upsert on profiles;
create policy profiles_self_upsert on profiles for insert
  with check (user_id = auth.uid());
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Counselor assignments: managed by admins; visible to both parties.
drop policy if exists counselor_students_select on counselor_students;
create policy counselor_students_select on counselor_students for select
  using (counselor_id = auth.uid() or student_id = auth.uid() or current_app_role() = 'admin');
drop policy if exists counselor_students_admin_write on counselor_students;
create policy counselor_students_admin_write on counselor_students for all
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

-- Student-owned rows: owner full access; counselor read when shared.
drop policy if exists history_owner on student_course_history;
create policy history_owner on student_course_history for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists history_counselor_read on student_course_history;
create policy history_counselor_read on student_course_history for select
  using (exists (
    select 1 from counselor_students cs
    where cs.student_id = student_course_history.student_id and cs.counselor_id = auth.uid()
  ));

drop policy if exists plans_owner on academic_plans;
create policy plans_owner on academic_plans for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists plans_counselor_read on academic_plans;
create policy plans_counselor_read on academic_plans for select
  using (exists (
    select 1 from counselor_students cs
    where cs.student_id = academic_plans.student_id and cs.counselor_id = auth.uid()
  ));

drop policy if exists plan_entries_owner on plan_entries;
create policy plan_entries_owner on plan_entries for all
  using (exists (
    select 1 from academic_plans p
    where p.id = plan_entries.plan_id and p.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from academic_plans p
    where p.id = plan_entries.plan_id and p.student_id = auth.uid()
  ));
drop policy if exists plan_entries_counselor_read on plan_entries;
create policy plan_entries_counselor_read on plan_entries for select
  using (exists (
    select 1 from academic_plans p
    join counselor_students cs on cs.student_id = p.student_id
    where p.id = plan_entries.plan_id and cs.counselor_id = auth.uid()
  ));

-- Counselor note updates on shared students' plan entries.
drop policy if exists plan_entries_counselor_note on plan_entries;
create policy plan_entries_counselor_note on plan_entries for update
  using (exists (
    select 1 from academic_plans p
    join counselor_students cs on cs.student_id = p.student_id
    where p.id = plan_entries.plan_id and cs.counselor_id = auth.uid()
  ));

drop policy if exists rec_sessions_owner on recommendation_sessions;
create policy rec_sessions_owner on recommendation_sessions for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists rec_sessions_counselor_read on recommendation_sessions;
create policy rec_sessions_counselor_read on recommendation_sessions for select
  using (exists (
    select 1 from counselor_students cs
    where cs.student_id = recommendation_sessions.student_id and cs.counselor_id = auth.uid()
  ));

drop policy if exists rec_messages_owner on recommendation_messages;
create policy rec_messages_owner on recommendation_messages for all
  using (exists (
    select 1 from recommendation_sessions s
    where s.id = recommendation_messages.session_id and s.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from recommendation_sessions s
    where s.id = recommendation_messages.session_id and s.student_id = auth.uid()
  ));

drop policy if exists rec_results_owner on recommendation_results;
create policy rec_results_owner on recommendation_results for select
  using (exists (
    select 1 from recommendation_sessions s
    where s.id = recommendation_results.session_id and s.student_id = auth.uid()
  ));

drop policy if exists rec_feedback_owner on recommendation_feedback;
create policy rec_feedback_owner on recommendation_feedback for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Audit/admin tables: admin-only (service role bypasses RLS for writes).
drop policy if exists audit_admin_read on audit_events;
create policy audit_admin_read on audit_events for select
  using (current_app_role() = 'admin');
drop policy if exists import_jobs_admin_read on admin_import_jobs;
create policy import_jobs_admin_read on admin_import_jobs for select
  using (current_app_role() = 'admin');
