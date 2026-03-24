create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'instructor', 'student');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');
create type public.choice_key as enum ('A', 'B', 'C', 'D');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid not null references public.mock_exams (id) on delete cascade,
  question_text text not null,
  explanation text not null default '',
  difficulty public.question_difficulty not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  topic_id uuid not null references public.topics (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.exam_questions (id) on delete cascade,
  choice_key public.choice_key not null,
  choice_text text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (question_id, choice_key)
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  mock_exam_id uuid not null references public.mock_exams (id) on delete cascade,
  score numeric(5,2) not null default 0,
  total_items integer not null default 0,
  correct_count integer not null default 0,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts (id) on delete cascade,
  question_id uuid not null references public.exam_questions (id) on delete cascade,
  selected_choice public.choice_key not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  file_name text not null,
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failed_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.upload_errors (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads (id) on delete cascade,
  row_number integer not null,
  error_message text not null,
  raw_data jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.mock_exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_choices enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.uploads enable row level security;
alter table public.upload_errors enable row level security;

create policy "profiles are viewable by authenticated users" on public.profiles
for select to authenticated using (true);

create policy "users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id);

create policy "authenticated users can read review content" on public.subjects
for select to authenticated using (true);

create policy "authenticated users can read topics" on public.topics
for select to authenticated using (true);

create policy "authenticated users can read mock exams" on public.mock_exams
for select to authenticated using (true);

create policy "authenticated users can read questions" on public.exam_questions
for select to authenticated using (true);

create policy "authenticated users can read choices" on public.exam_choices
for select to authenticated using (true);

create policy "students manage own attempts" on public.exam_attempts
for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "students manage own answers" on public.exam_answers
for all to authenticated using (
  exists (
    select 1
    from public.exam_attempts attempts
    where attempts.id = exam_answers.attempt_id and attempts.student_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.exam_attempts attempts
    where attempts.id = exam_answers.attempt_id and attempts.student_id = auth.uid()
  )
);

create policy "admins and instructors manage uploads" on public.uploads
for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);

create policy "admins and instructors manage upload errors" on public.upload_errors
for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);

create policy "admins and instructors manage content" on public.subjects
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);

create policy "admins and instructors manage topics" on public.topics
for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);

create policy "admins and instructors manage exams" on public.mock_exams
for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);

create policy "admins and instructors manage questions" on public.exam_questions
for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);

create policy "admins and instructors manage choices" on public.exam_choices
for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);
