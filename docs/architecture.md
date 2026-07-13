# Nutriweek Architecture

## Overview

Nutriweek is a Next.js application for AI-assisted weekly meal and grocery planning. The current implementation provides a public marketing site, Supabase email/password authentication, protected dashboard scaffolding, and a production-oriented user profile and household foundation.

The application uses the Next.js App Router. Pages are Server Components by default; interactivity is isolated to Client Components such as authentication and profile forms. Supabase Auth is the identity provider, and PostgreSQL with Row Level Security (RLS) is the application data layer.

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16.2, App Router, Turbopack build pipeline |
| Language | TypeScript with `strict` enabled |
| UI | React 19, Tailwind CSS 4, Lucide icons, Framer Motion |
| Forms | React Hook Form and Zod 4 with `@hookform/resolvers` |
| Accessible controls | Radix UI Select, Popover, and Checkbox primitives, wrapped as local shadcn-style components |
| Authentication and data | Supabase Auth, `@supabase/ssr`, and `@supabase/supabase-js` |
| Database workflow | Supabase CLI, SQL migrations, generated TypeScript database types |
| Quality checks | ESLint and TypeScript no-emit checking |

## Repository Structure

```text
app/
  page.tsx                         Public landing page
  layout.tsx                       Root layout, fonts, and global shell
  globals.css                      Tailwind import, tokens, global styles
  login/page.tsx                   Login route
  signup/page.tsx                  Signup route
  dashboard/
    layout.tsx                     Authenticated dashboard shell
    page.tsx                       Dashboard overview
    profile/page.tsx               Server-rendered Profile page
    loading.tsx                    Dashboard loading UI
    error.tsx                      Dashboard error boundary UI
    [grocery|meal-plans|nutrition|pantry]/page.tsx
                                  Placeholder feature routes

components/
  auth/                            AuthCard, LoginForm, SignupForm
  dashboard/                       Header, sidebar, overview, sign-out, placeholders
  profile/                         Profile form and its layout helpers
  ui/                              Local Radix/shadcn-style Select and MultiSelect
  Hero.tsx, Features.tsx, ...      Landing-page sections

lib/
  auth/                            Browser auth actions, Zod schemas, constants, types
  profile/                         Profile actions, queries, schemas, constants, types
  supabase/                        Browser, server, and proxy Supabase clients; generated types

supabase/
  config.toml                      Supabase CLI project configuration
  migrations/                      Version-controlled SQL migrations

proxy.ts                           Dashboard session-refresh and route-protection proxy
```

## App Router Structure

The application has three top-level route areas:

- `/` is the public landing page.
- `/login` and `/signup` are public authentication pages.
- `/dashboard` and every nested dashboard route are protected.

`app/dashboard/layout.tsx` is an async Server Component. It creates a server Supabase client, reads the current Auth user, redirects unauthenticated users to `/login?next=/dashboard`, and renders the persistent `Sidebar` and `DashboardHeader` around the route content.

`proxy.ts` applies only to `/dashboard/:path*`. It calls `lib/supabase/proxy.ts` to refresh Supabase session cookies and redirects unauthenticated requests to the login route while preserving the requested dashboard path in the `next` parameter. The dashboard layout repeats the identity check as a server-side defense at render time.

Dashboard routes currently include an overview, Profile, and placeholder routes for Meal Plans, Pantry, Grocery, and Nutrition. The sidebar routes to these pages; the Profile item is active and no longer marked as coming soon.

## Authentication Flow

### Browser authentication actions

`lib/auth/actions.ts` contains `login`, `signup`, and `signOut`. These functions use the browser Supabase client from `lib/supabase/client.ts`:

- Login calls `auth.signInWithPassword`.
- Signup calls `auth.signUp` with email and password.
- The signup result detects whether a session was returned, which indicates whether email confirmation is required.
- Sign-out calls `auth.signOut`.

The functions map Supabase errors to user-facing messages defined in `lib/auth/constants.ts` and return a small `AuthActionResult` rather than exposing Supabase error details directly.

### Authentication forms

`LoginForm` and `SignupForm` are Client Components. They validate with their auth Zod schemas before invoking the browser actions. Login validates the optional `next` path so redirects remain internal, then uses `router.replace` and `router.refresh` after a successful login.

### Session handling

Supabase SSR clients use the public project URL and publishable key from:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

The proxy client manages response cookies during navigation and route protection. The Server Component client reads request cookies; it safely ignores cookie writes attempted while rendering, because Server Components cannot mutate response cookies directly.

## Supabase Integration

### Client boundaries

There are three dedicated Supabase integration modules:

| Module | Runtime | Purpose |
| --- | --- | --- |
| `lib/supabase/client.ts` | Browser | Authentication calls from Client Components |
| `lib/supabase/server.ts` | Server only | Server Components and Server Actions; depends on `next/headers` |
| `lib/supabase/proxy.ts` | Next.js proxy | Session refresh and dashboard redirect handling |

Client Components must not import `lib/supabase/server.ts`, `next/headers`, or barrels that transitively export them. The Profile form imports only client-safe constants, Zod schema/types, and its Server Action. The Profile page imports the server-only query directly because the page is a Server Component.

### Database types

`lib/supabase/database.types.ts` is generated from the linked Supabase project. It provides `Database`, `Tables`, `TablesInsert`, `TablesUpdate`, and enum types. It is regenerated after each applied migration with:

```powershell
npx supabase gen types typescript --linked --schema public | Out-File -Encoding utf8 lib/supabase/database.types.ts
```

Feature-level types, such as `Profile` and `ProfileUpdate`, are derived from those generated definitions in `lib/profile/types.ts`.

## Database Foundation

The first application migration is `supabase/migrations/20260713113000_create_profile_household_foundation.sql`. It creates only the foundational profile and household data model.

### Tables and ownership model

```text
auth.users
  ├── profiles                 One profile per user, keyed by Auth user ID
  └── households.created_by    Personal household creator
        └── household_members  User-to-household membership and role
```

`profiles` stores personal, lifestyle, diet, planning, location, budget, and kitchen-equipment preferences. Array columns hold multi-select preferences. `diet_type` is `text` and is constrained by application Zod validation. Stable options use PostgreSQL enums:

- `gender`
- `activity_level`
- `health_goal`
- `household_member_role`

`households` is the future ownership root for pantry items, recipes, meal plans, and grocery lists. It records a `created_by` Auth user but deliberately does not enforce a unique constraint on that column. Creation logic, rather than a database uniqueness constraint, creates one initial personal household per user.

`household_members` is the future-ready many-to-many user/household relationship. Its composite primary key prevents duplicate memberships. The initial membership is assigned the `owner` role.

The migration includes indexes for household creators and membership lookup by user and household. A reusable `set_updated_at` trigger updates timestamps on all three tables.

### Automatic initial records

The migration installs a security-definer trigger on `auth.users` inserts. Its creation function:

1. Creates the profile row if absent.
2. Finds or creates the user’s personal household.
3. Names the household `"<Full Name>'s Household"` when Auth metadata contains a full name, otherwise `"My Household"`.
4. Creates the owner membership if absent.

The migration also invokes this function for all existing Auth users, making the initial setup idempotent for pre-existing accounts.

### Row Level Security

RLS is enabled for all application tables.

- Authenticated users can select and update only their own profile (`profiles.id = auth.uid()`).
- Authenticated users can select households only when they have a matching `household_members` row.
- Authenticated users can select only their own membership rows.
- Direct application writes to households and memberships are not exposed in the current feature; trusted creation logic owns initial creation.

Table grants match those policies: users can select and update profiles, and select households and memberships. The internal creation functions are not executable by `public`, `anon`, or `authenticated` roles.

## Profile Feature

The Profile feature is organized under `lib/profile` and `components/profile`.

| Layer | Files | Responsibility |
| --- | --- | --- |
| Constants | `constants.ts` | Allowed values, display labels, and runtime option guards |
| Validation | `schemas.ts` | Zod schema and `ProfileFormValues` |
| Data types | `types.ts` | Types derived from generated database types |
| Query | `queries.ts` | Server-only current-user profile read |
| Mutation | `actions.ts` | Server Action for authenticated profile updates |
| UI | `ProfileForm.tsx`, `ProfileSection.tsx`, `ProfileField.tsx` | Profile page interaction and presentation |

`app/dashboard/profile/page.tsx` is a Server Component. It loads the profile through `getCurrentUserProfile()` and passes the typed profile data to the client form as props. A missing profile is surfaced through the dashboard error boundary rather than silently rendering an uninitialized form.

## Server Actions and Database Access

`lib/profile/actions.ts` contains the current Server Action, `updateProfile`, and begins with the `"use server"` directive.

The action follows this sequence:

1. Re-validates the received form data with `profileSchema`; client validation is not trusted as the sole validation boundary.
2. Creates the server-only Supabase client and obtains the authenticated user.
3. Converts blank optional strings to `null` and builds a generated-type-derived `ProfileUpdate` payload.
4. Updates `profiles` with an equality condition on the authenticated user ID.
5. Returns a typed success or error result for the form UI.
6. Calls `revalidatePath("/dashboard/profile")` after success.

RLS independently enforces profile ownership even if a client attempts to alter the target row. There is no service-role client in the application layer.

## React Hook Form and Zod Validation

The profile form is a Client Component because it contains user interaction and local submit feedback.

1. `useForm<ProfileFormValues>` receives `zodResolver(profileSchema)` and typed defaults from the server-provided profile.
2. Native text, date, and number inputs use `register`; numeric inputs map blank strings to `null` with `setValueAs`.
3. Radix controls use `Controller`, keeping controlled Select and MultiSelect values synchronized with React Hook Form.
4. The schema validates allowed options, non-negative/positive numeric fields, text length, dates, and the requirement that weekly budget and currency code are supplied together.
5. On submit, the form calls the Server Action and renders its success or error message with live-region semantics.
6. The Server Action re-runs the same schema before the database update.

The form supports partial profiles. Optional scalar fields are blank or `null`; array fields default to empty arrays.

## UI Architecture

### Component responsibilities

- Landing components in `components/` implement the public marketing page.
- `components/auth` contains reusable auth-card and client forms.
- `components/dashboard` owns persistent dashboard presentation and placeholder content.
- `components/profile` composes feature sections and error-aware field layout.
- `components/ui` holds reusable low-level UI primitives.

The Profile form is visually grouped into Personal, Lifestyle and goals, Diet preferences, Planning, Location, and Kitchen equipment sections. `ProfileSection` supplies consistent glass panels, while `ProfileField` binds labels and validation errors to the appropriate interactive control.

### Radix UI usage

`components/ui/select.tsx` wraps Radix Select with a keyboard-accessible trigger, portal content, focus styling, option highlighting, and selection indicator. It is used for single-choice profile fields.

`components/ui/multi-select.tsx` composes Radix Popover and Checkbox for multi-choice fields. The trigger summarizes selected labels, opens a focus-managed popover, and lets users toggle checkbox options with keyboard or pointer input. It replaces native multiple-select controls while retaining React Hook Form array values.

### Tailwind styling conventions

Tailwind classes are applied in components rather than through a large component-library theme. The design uses:

- A dark base (`#050505`) with white and zinc text.
- Low-opacity white borders and backgrounds for glass panels.
- Emerald-to-cyan gradients for primary actions.
- Rounded-xl controls and rounded-3xl surfaces.
- Explicit hover, focus, disabled, and invalid states.
- Responsive modifiers such as `sm:` and `lg:` for dashboard and form layouts.

`app/globals.css` defines the background, foreground, accent variables, font variables, smooth scrolling, and landing-page gradient/orb effects. Components preserve accessible focus rings rather than removing focus indication.

## Git Workflow

The repository is hosted at `github.com/Nutriweek/nutriweek`. The current main branch history shows feature branches merged through pull requests, including `feature/auth-ui`, `feature/dashboard`, and `feature/profile`.

The established workflow is:

1. Create a focused `feature/<name>` branch.
2. Keep changes scoped to the feature task.
3. Run lint and TypeScript validation before review.
4. Open a pull request into `main`.
5. Merge the reviewed feature branch.

Database migrations and regenerated database types are committed with the application feature that depends on them.

## Future Scalability Decisions

The current foundation deliberately supports future product work without prematurely implementing it.

- Household ownership is the common parent for future pantry items, recipes, meal plans, grocery lists, and related data. New tables should add a `household_id` foreign key rather than being owned directly by a user.
- `household_members` supports future invitations and shared family plans without replacing the ownership model.
- Profile preferences use arrays for user-selectable multi-value data, while stable fields use enums and flexible diet options remain application-validated text.
- RLS is established before additional household-scoped data is introduced, so later policies can consistently check membership.
- Timestamp trigger reuse keeps auditing fields consistent as new tables are added.
- SQL migrations are version-controlled under `supabase/migrations`; schema changes are pushed with `npx supabase db push`, followed by type generation.
- The Server Component / Client Component split and Server Action pattern keep secrets and `next/headers` dependencies on the server while allowing responsive forms in the browser.
- Placeholder dashboard routes reserve the navigation and routing shape for pantry, meal plans, grocery lists, nutrition, recipes, and AI generation work without adding their database schema prematurely.

## Validation Commands

Run these checks after application changes:

```powershell
npm run lint
npm exec tsc -- --noEmit
```

On Windows installations where PowerShell execution policy blocks the `npm` or `npx` script wrappers, the equivalent `npm.cmd` and `npx.cmd` commands can be used.
