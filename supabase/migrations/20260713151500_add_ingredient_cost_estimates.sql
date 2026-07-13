alter table public.ingredients add column estimated_unit_cost numeric(12, 2);
alter table public.ingredients add column cost_currency char(3);
alter table public.ingredients add constraint ingredients_estimated_unit_cost_non_negative check (estimated_unit_cost is null or estimated_unit_cost >= 0);
alter table public.ingredients add constraint ingredients_cost_currency_pair check ((estimated_unit_cost is null) = (cost_currency is null));
