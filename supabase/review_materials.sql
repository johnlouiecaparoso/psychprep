create table if not exists public.review_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  subject_id uuid not null references public.subjects (id) on delete restrict,
  topic_id uuid not null references public.topics (id) on delete restrict,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.review_materials enable row level security;

create policy "authenticated users can read review materials" on public.review_materials
for select to authenticated using (true);

create policy "admins and instructors manage review materials" on public.review_materials
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

insert into storage.buckets (id, name, public)
values ('review-materials', 'review-materials', false)
on conflict (id) do nothing;

create policy "authenticated users can view reviewer files" on storage.objects
for select to authenticated
using (bucket_id = 'review-materials');

create policy "admins and instructors upload reviewer files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'review-materials'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'instructor')
  )
);
