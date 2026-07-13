\# API \& Server Action Documentation



\## Overview



Nutriweek follows a \*\*Server Action-first architecture\*\*.



Instead of exposing traditional REST APIs for internal operations, the application uses \*\*Next.js Server Actions\*\* to securely handle authenticated mutations.



This keeps business logic on the server, reduces boilerplate, and works naturally with the App Router.



\---



\# Current Architecture



```

Client Component

&#x20;       │

&#x20;       ▼

React Hook Form

&#x20;       │

&#x20;       ▼

Zod Validation

&#x20;       │

&#x20;       ▼

Server Action

&#x20;       │

&#x20;       ▼

Supabase

&#x20;       │

&#x20;       ▼

PostgreSQL

```



\---



\# Authentication



Authentication is handled by Supabase Auth.



Supported operations:



\- Sign Up

\- Login

\- Logout

\- Email Verification

\- Session Refresh



Protected routes are enforced through:



\- Next.js Proxy

\- Server Components

\- Supabase SSR



\---



\# Current Server Actions



\## Login



Responsibilities



\- Validate credentials

\- Authenticate using Supabase

\- Return success or error message



\---



\## Signup



Responsibilities



\- Validate user input

\- Create Supabase Auth user

\- Handle email verification

\- Return user-friendly status messages



\---



\## Logout



Responsibilities



\- Clear authenticated session

\- Redirect user to login



\---



\## Update Profile



Responsibilities



\- Validate profile input using Zod

\- Authorize authenticated user

\- Update profile in PostgreSQL

\- Return success/error state



\---



\# Database Queries



Current feature queries include:



\## Profile



\- Get authenticated user's profile

\- Update authenticated user's profile



Queries remain server-side and use the Supabase server client.



\---



\# Validation Flow



Every write operation follows the same pipeline:



1\. User submits form.

2\. React Hook Form collects values.

3\. Zod validates input.

4\. Server Action executes.

5\. Supabase updates PostgreSQL.

6\. Result is returned to the UI.



\---



\# Error Handling



Server Actions return structured responses instead of throwing uncaught errors.



Typical response shape:



```ts

{

&#x20; success: boolean;

&#x20; message: string;

}

```



This enables consistent UI feedback across the application.



\---



\# Security



All write operations:



\- Require authentication.

\- Respect Row Level Security (RLS).

\- Execute on the server.

\- Never expose service-role credentials.

\- Validate all user input.



\---



\# Future Server Actions



\## Pantry



\- addPantryItem()

\- updatePantryItem()

\- deletePantryItem()



\---



\## Recipes



\- createRecipe()

\- updateRecipe()

\- deleteRecipe()



\---



\## Meal Planner



\- generateMealPlan()

\- regenerateMeal()

\- saveMealPlan()



\---



\## Grocery



\- generateGroceryList()

\- updateGroceryItem()

\- removeGroceryItem()



\---



\## Nutrition



\- calculateNutrition()

\- updateNutritionTargets()



\---



\# Future Integrations



Future server-side integrations may include:



\- OpenAI

\- Blinkit

\- Zepto

\- BigBasket

\- Instamart

\- Google Calendar

\- Apple Health

\- Google Fit



These integrations should remain isolated behind server-side services and never expose sensitive credentials to the client.

