# PsychBoard

PsychBoard is a modern, mobile-responsive psychology board exam review platform built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives, Supabase, React Hook Form, Zod, Recharts, and TanStack Table.

## Included

- Role-based experience for `admin`, `instructor`, and `student`
- Auth pages for login, registration, and password reset
- Instructor upload workflow with CSV/Excel parsing, validation, preview, and import summary
- Student mock exam and flashcard review flows
- Admin, instructor, and student dashboards with analytics widgets
- Supabase schema with RLS policies and profile bootstrap trigger
- Sample CSV file that matches the required import format

## Project structure

```text
app/
  admin/
  dashboard/
  forgot-password/
  instructor/
    question-bank/
    upload/
  login/
  register/
  student/
    flashcards/
    mock-exams/[id]/
    results/[id]/
components/
  auth/
  charts/
  csv-import/
  exam/
  flashcards/
  tables/
  ui/
lib/
  csv/
  supabase/
  validations/
public/samples/
supabase/schema.sql
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Add your Supabase keys to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Create the database schema in Supabase SQL editor with [`supabase/schema.sql`](./supabase/schema.sql).

5. Start the app:

```bash
npm run dev
```

## Required CSV format

The import system expects these exact columns:

```text
Question
Choice 1
Choice 2
Choice 3
Choice 4
Correct Answer (1-4)
Explanation
Difficulty
Subject
Topic
```

Example:

```csv
Question,Choice 1,Choice 2,Choice 3,Choice 4,Correct Answer (1-4),Explanation,Difficulty,Subject,Topic
What is the primary focus of psychology?,Behavior,Mental processes,Both A and B,None of the above,3,Psychology studies both behavior and mental processes.,easy,General Psychology,Introduction
```

## Import behavior

- Supports `.csv`, `.xlsx`, and `.xls`
- Validates required question text and all four choices
- Converts `Correct Answer (1-4)` into `A/B/C/D`
- Accepts only `easy`, `medium`, or `hard`
- Requires non-empty `Subject` and `Topic`
- Rejects invalid rows and records them in `upload_errors`
- Produces a summary with total, success, and failed rows

## Notes for production

- Wire form submits to Supabase Auth in the auth form components
- Call `persistUploadBatch` from a server action or route handler after preview confirmation
- Add true role-based path authorization by reading `profiles.role` in middleware or server layouts
- Replace demo dashboard data with live Supabase queries
- Add storage upload if raw import files should be retained in Supabase Storage
