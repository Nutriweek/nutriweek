\# Coding Standards



\## Purpose



This document defines the development standards for Nutriweek to ensure consistency, maintainability, and scalability.



\---



\# Technology Stack



\- Next.js 16 App Router

\- TypeScript (Strict Mode)

\- React

\- Tailwind CSS

\- shadcn/ui

\- Radix UI

\- Supabase

\- PostgreSQL

\- React Hook Form

\- Zod



\---



\# TypeScript



\- Always use strict typing.

\- Avoid `any`.

\- Prefer inferred types where appropriate.

\- Share common types through feature modules.



Example:



```

lib/profile/types.ts

```



\---



\# Folder Organization



```

app/

components/

lib/

public/

supabase/

docs/

```



Feature-specific code should live inside:



```

components/<feature>

lib/<feature>

```



\---



\# Server vs Client Components



Default to \*\*Server Components\*\*.



Only use `"use client"` when necessary for:



\- Forms

\- Local state

\- Event handlers

\- Browser APIs



Never import server-only modules into Client Components.



Examples of server-only APIs:



\- next/headers

\- cookies()

\- headers()

\- Supabase server client



\---



\# Server Actions



Use Server Actions for all mutations.



Examples:



\- Login

\- Signup

\- Profile updates

\- Pantry updates

\- Recipe creation



Server Actions should:



\- Validate with Zod

\- Check authorization

\- Return typed results



\---



\# Forms



All forms should use:



\- React Hook Form

\- Zod

\- Accessible validation messages



Loading states should always be displayed while submitting.



\---



\# UI Guidelines



Use:



\- Tailwind CSS

\- shadcn/ui

\- Radix UI



Avoid native `<select>` controls when a reusable Radix component exists.



Maintain a consistent dark theme across the application.



\---



\# Database



All schema changes must use SQL migrations.



Never manually modify production tables in the Supabase Dashboard without creating an equivalent migration.



After every migration:



1\. Run:



```

npx supabase db push

```



2\. Regenerate database types:



```

npx supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts

```



Never manually edit `database.types.ts`.



\---



\# Git Workflow



Each feature must use its own branch.



Examples:



```

feature/profile

feature/pantry

feature/meal-planner

feature/recipes

```



Workflow:



1\. Create feature branch

2\. Implement feature

3\. Run validation

4\. Commit

5\. Push

6\. Create Pull Request

7\. Merge

8\. Delete feature branch



\---



\# Commit Messages



Use Conventional Commit style.



Examples:



```

feat(profile): add profile management



feat(pantry): add pantry CRUD



fix(auth): resolve login redirect



docs: update architecture

```



\---



\# Validation Before Merge



Every Pull Request must pass:



```

npm run lint



npm exec tsc -- --noEmit

```



All features should also be tested manually before merging.



\---



\# Documentation



Major architectural decisions should be documented under the `docs/` directory.



Keep documentation updated whenever new features or database changes are introduced.

