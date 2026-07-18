insert into public.ingredients (slug, name, ingredient_category, default_unit_code, estimated_unit_cost, cost_currency) values
  ('roasted-chana', 'Roasted Chana', 'snacks', 'g', 0.16, 'INR'),
  ('sprouted-moong', 'Sprouted Moong', 'pulses', 'g', 0.12, 'INR'),
  ('apple', 'Apple', 'fruits', 'g', 0.16, 'INR'),
  ('banana', 'Banana', 'fruits', 'g', 0.08, 'INR'),
  ('bread', 'Bread', 'bakery', 'count', 4.00, 'INR'),
  ('custard-powder', 'Custard Powder', 'dessert-mixes', 'g', 0.24, 'INR')
on conflict (slug) do nothing;

with catalog(slug, name, category_slug, prep_minutes, cook_minutes, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g) as (values
  ('vegetable-poha', 'Vegetable Poha', 'snacks', 15, 10, 280, 7, 45, 8, 6, 5),
  ('roasted-chana', 'Roasted Chana', 'snacks', 2, 0, 190, 10, 28, 4, 7, 2),
  ('sprouts-chaat', 'Sprouts Chaat', 'snacks', 15, 0, 170, 10, 28, 2, 7, 5),
  ('fruit-chaat', 'Fruit Chaat', 'snacks', 15, 0, 150, 2, 36, 1, 6, 25),
  ('peanut-chaat', 'Peanut Chaat', 'snacks', 15, 0, 240, 10, 16, 16, 5, 4),
  ('vegetable-sandwich', 'Vegetable Sandwich', 'snacks', 15, 10, 290, 8, 44, 9, 6, 6),
  ('fruit-custard', 'Fruit Custard', 'desserts', 15, 15, 260, 7, 45, 7, 4, 30),
  ('kheer', 'Kheer', 'desserts', 10, 35, 310, 8, 52, 9, 1, 31),
  ('suji-halwa', 'Suji Halwa', 'desserts', 10, 20, 350, 5, 56, 13, 2, 32),
  ('rice-payasam', 'Rice Payasam', 'desserts', 10, 35, 300, 8, 51, 8, 1, 30),
  ('shrikhand', 'Shrikhand', 'desserts', 15, 0, 275, 10, 38, 9, 1, 34)
), inserted as (
  insert into public.recipes (source_type, visibility, source_id, name, description, primary_cuisine_id, servings, difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes, instructions, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g, sodium_mg, is_active, published_at, slug, publication_status, quality_status, nutrition_source, nutrition_status, nutrition_updated_at)
  select 'system', 'system', 'system', name, 'A Nutriweek shared recipe for extra snacks and desserts.', (select id from public.cuisines where slug = 'indian'), 4, 'beginner', prep_minutes, cook_minutes, prep_minutes + cook_minutes, 'See structured recipe steps.', calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g, 180, true, now(), slug, 'published', 'verified', 'Nutriweek editorial estimate', 'verified', now()
  from catalog
  on conflict (slug) where slug is not null do update set name = excluded.name, publication_status = 'published', quality_status = 'verified', nutrition_status = 'verified', is_active = true
  returning id, slug
)
insert into public.recipe_meal_categories (recipe_id, meal_category_id)
select inserted.id, categories.id
from inserted
join catalog on catalog.slug = inserted.slug
join public.meal_categories categories on categories.slug = catalog.category_slug
on conflict do nothing;

with catalog(recipe_slug, ingredient_slug, amount, display_order) as (values
  ('vegetable-poha', 'poha', 240::numeric, 1), ('vegetable-poha', 'potato', 200::numeric, 2), ('vegetable-poha', 'onion', 100::numeric, 3), ('vegetable-poha', 'green-peas', 100::numeric, 4), ('vegetable-poha', 'peanuts', 40::numeric, 5),
  ('roasted-chana', 'roasted-chana', 200::numeric, 1),
  ('sprouts-chaat', 'sprouted-moong', 300::numeric, 1), ('sprouts-chaat', 'onion', 80::numeric, 2), ('sprouts-chaat', 'tomato', 100::numeric, 3), ('sprouts-chaat', 'lemon', 25::numeric, 4), ('sprouts-chaat', 'coriander-leaves', 15::numeric, 5),
  ('fruit-chaat', 'apple', 300::numeric, 1), ('fruit-chaat', 'banana', 240::numeric, 2), ('fruit-chaat', 'lemon', 25::numeric, 3), ('fruit-chaat', 'black-salt', 5::numeric, 4),
  ('peanut-chaat', 'peanuts', 200::numeric, 1), ('peanut-chaat', 'onion', 80::numeric, 2), ('peanut-chaat', 'tomato', 100::numeric, 3), ('peanut-chaat', 'coriander-leaves', 15::numeric, 4), ('peanut-chaat', 'lemon', 25::numeric, 5),
  ('vegetable-sandwich', 'bread', 8::numeric, 1), ('vegetable-sandwich', 'potato', 250::numeric, 2), ('vegetable-sandwich', 'tomato', 150::numeric, 3), ('vegetable-sandwich', 'cucumber', 150::numeric, 4), ('vegetable-sandwich', 'butter', 30::numeric, 5),
  ('fruit-custard', 'milk', 1000::numeric, 1), ('fruit-custard', 'apple', 250::numeric, 2), ('fruit-custard', 'banana', 240::numeric, 3), ('fruit-custard', 'custard-powder', 100::numeric, 4), ('fruit-custard', 'sugar', 80::numeric, 5),
  ('kheer', 'rice', 200::numeric, 1), ('kheer', 'milk', 1000::numeric, 2), ('kheer', 'sugar', 120::numeric, 3), ('kheer', 'green-cardamom', 5::numeric, 4), ('kheer', 'cashews', 40::numeric, 5),
  ('suji-halwa', 'semolina', 250::numeric, 1), ('suji-halwa', 'ghee', 100::numeric, 2), ('suji-halwa', 'sugar', 250::numeric, 3), ('suji-halwa', 'cashews', 40::numeric, 4),
  ('rice-payasam', 'rice', 200::numeric, 1), ('rice-payasam', 'milk', 1000::numeric, 2), ('rice-payasam', 'sugar', 150::numeric, 3), ('rice-payasam', 'green-cardamom', 5::numeric, 4), ('rice-payasam', 'cashews', 40::numeric, 5),
  ('shrikhand', 'yogurt', 800::numeric, 1), ('shrikhand', 'sugar', 160::numeric, 2), ('shrikhand', 'green-cardamom', 5::numeric, 3), ('shrikhand', 'almonds', 40::numeric, 4)
)
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, base_quantity, base_unit_code, display_order)
select recipes.id, ingredients.id, catalog.amount, ingredients.default_unit_code, catalog.amount, ingredients.default_unit_code, catalog.display_order
from catalog
join public.recipes recipes on recipes.slug = catalog.recipe_slug and recipes.source_type = 'system'
join public.ingredients ingredients on ingredients.slug = catalog.ingredient_slug
where not exists (
  select 1
  from public.recipe_ingredients existing
  where existing.recipe_id = recipes.id
    and existing.ingredient_id = ingredients.id
);

insert into public.recipe_steps (recipe_id, step_number, instruction, estimated_duration_minutes)
select recipes.id, steps.step_number, steps.instruction, steps.duration
from public.recipes recipes
cross join lateral (values
  (1::smallint, 'Prepare and measure the listed ingredients.', 10),
  (2::smallint, 'Cook or combine the ingredients until well prepared.', 15),
  (3::smallint, 'Serve fresh and enjoy.', 2)
) as steps(step_number, instruction, duration)
where recipes.slug in ('vegetable-poha', 'roasted-chana', 'sprouts-chaat', 'fruit-chaat', 'peanut-chaat', 'vegetable-sandwich', 'fruit-custard', 'kheer', 'suji-halwa', 'rice-payasam', 'shrikhand')
  and recipes.source_type = 'system'
on conflict (recipe_id, step_number) do nothing;

select public.recalculate_recipe_quality(id), public.recalculate_recipe_estimated_cost(id)
from public.recipes
where slug in ('vegetable-poha', 'roasted-chana', 'sprouts-chaat', 'fruit-chaat', 'peanut-chaat', 'vegetable-sandwich', 'fruit-custard', 'kheer', 'suji-halwa', 'rice-payasam', 'shrikhand')
  and source_type = 'system';
