\# Database Documentation



\## Overview



Nutriweek uses \*\*Supabase PostgreSQL\*\* as its primary database.



The database is designed around:



\- Authentication through Supabase Auth

\- Row Level Security (RLS)

\- Version-controlled SQL migrations

\- Strong TypeScript typing

\- Household-based data ownership



All schema changes are managed through SQL migrations under:



```

supabase/migrations/

```



Database types are generated using:



```bash

npx supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts

```



Generated types should never be edited manually.



\---



\# Current Database Schema



\## Profiles



Stores one profile for every authenticated user.



Primary Key



```

id

```



Foreign Key



```

auth.users(id)

```



Important columns



\- full\_name

\- date\_of\_birth

\- gender

\- height\_cm

\- weight\_kg

\- activity\_level

\- goal

\- diet\_type

\- allergies

\- cuisine\_preferences

\- meals\_per\_day

\- family\_size

\- weekly\_grocery\_budget

\- currency\_code

\- country

\- state\_province

\- city

\- kitchen\_equipment

\- created\_at

\- updated\_at



\---



\## Households



Every user owns one personal household.



Columns



\- id

\- name

\- created\_by

\- created\_at

\- updated\_at



\---



\## Household Members



Joins users to households.



Columns



\- household\_id

\- user\_id

\- role

\- created\_at

\- updated\_at



Composite Primary Key



```

(household\_id, user\_id)

```



\---



\# Relationships



```

auth.users

&#x20;     │

&#x20;     │ 1:1

&#x20;     ▼

&#x20;profiles



auth.users

&#x20;     │

&#x20;     │

&#x20;     ▼

households

&#x20;     │

&#x20;     │ 1:N

&#x20;     ▼

household\_members

```



\---



\# Row Level Security



Profiles



\- Read own profile

\- Update own profile



Households



\- Read households the user belongs to



Household Members



\- Read own memberships



No client-side inserts are allowed.



Creation is handled automatically by PostgreSQL triggers.



\---



\# Automatic User Provisioning



When a new user signs up:



1\. Profile is created.

2\. Personal household is created.

3\. Owner membership is created.



This guarantees every authenticated user has a usable foundation immediately after registration.



\---



\# Future Tables



The following tables are planned.



\- pantry\_items

\- grocery\_lists

\- grocery\_list\_items

\- recipes

\- recipe\_ingredients

\- meal\_plans

\- meal\_plan\_items

\- nutrition\_logs

\- shopping\_history



Every household-owned table will contain:



```

household\_id

```



to support collaborative family planning.



\---



\# Migration Strategy



All schema changes must follow this workflow:



1\. Create SQL migration

2\. Review SQL

3\. Apply using Supabase CLI

4\. Regenerate TypeScript types

5\. Commit migration and generated types



Direct production database edits should be avoided.

