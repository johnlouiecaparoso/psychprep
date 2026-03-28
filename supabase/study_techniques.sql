create table if not exists public.study_techniques (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  impact_summary text not null,
  dashboard_task_label text not null,
  recommended_href text not null,
  recommended_action_label text not null,
  session_message text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_technique_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  technique_id uuid not null references public.study_techniques (id) on delete cascade,
  selected_at timestamptz not null default now(),
  is_current boolean not null default true
);

create unique index if not exists user_technique_current_idx
on public.user_technique_selections (user_id)
where is_current = true;

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  technique_id uuid references public.study_techniques (id) on delete set null,
  session_kind text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  focus_rounds integer not null default 0,
  score numeric(5,2),
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.study_techniques enable row level security;
alter table public.user_technique_selections enable row level security;
alter table public.study_sessions enable row level security;

create policy "authenticated users can read study techniques" on public.study_techniques
for select to authenticated using (is_active = true);

create policy "admins and instructors manage study techniques" on public.study_techniques
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

create policy "students read own technique selections" on public.user_technique_selections
for select to authenticated
using (user_id = auth.uid());

create policy "students insert own technique selections" on public.user_technique_selections
for insert to authenticated
with check (user_id = auth.uid());

create policy "students update own technique selections" on public.user_technique_selections
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "students manage own study sessions" on public.study_sessions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.set_current_study_technique(p_technique_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_technique_id uuid;
  inserted_selection_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select id
  into selected_technique_id
  from public.study_techniques
  where slug = p_technique_slug and is_active = true
  limit 1;

  if selected_technique_id is null then
    raise exception 'Study technique not found';
  end if;

  update public.user_technique_selections
  set is_current = false
  where user_id = auth.uid() and is_current = true;

  insert into public.user_technique_selections (user_id, technique_id, is_current)
  values (auth.uid(), selected_technique_id, true)
  returning id into inserted_selection_id;

  return inserted_selection_id;
end;
$$;

insert into public.study_techniques (
  slug,
  name,
  description,
  impact_summary,
  dashboard_task_label,
  recommended_href,
  recommended_action_label,
  session_message,
  sort_order
)
values
  (
    'active_recall',
    'Active Recall',
    'Practice remembering first, then check the answer only after you commit to a response.',
    'Flashcards and quick quizzes emphasize memory retrieval before review.',
    'Recall prompts to finish',
    '/student/flashcards',
    'Start recall session',
    'Active Recall mode is on. Answer from memory before you check anything else.',
    1
  ),
  (
    'pomodoro',
    'Pomodoro',
    'Study in focused work blocks with planned short breaks to maintain energy and attention.',
    'Study sessions add a focus-cycle timer and encourage paced work blocks.',
    'Focus rounds to complete',
    '/student/flashcards',
    'Start focus block',
    'Pomodoro mode is on. Stay with one task until the focus block ends, then take a short break.',
    2
  ),
  (
    'practice_test',
    'Practice Test',
    'Simulate board-style review using timed drills, shuffled items, and performance feedback.',
    'Mock exams and quizzes behave like structured board-exam practice.',
    'Practice sets available',
    '/student/mock-exams',
    'Start practice test',
    'Practice Test mode is on. Keep the pace steady and treat this like a board-style drill.',
    3
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  impact_summary = excluded.impact_summary,
  dashboard_task_label = excluded.dashboard_task_label,
  recommended_href = excluded.recommended_href,
  recommended_action_label = excluded.recommended_action_label,
  session_message = excluded.session_message,
  sort_order = excluded.sort_order,
  is_active = true;
