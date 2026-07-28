alter table public.weekly_meal_plans
  drop constraint weekly_meal_plans_status_valid,
  add constraint weekly_meal_plans_status_valid check (status in ('draft', 'prepared_for_review', 'approved', 'grocery_generated', 'purchased', 'archived'));
