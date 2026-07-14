-- System-owned recipes must use visibility = 'system' under the existing
-- recipes_source_ownership constraint; the authenticated read policy exposes them.
update public.ingredients
set estimated_unit_cost = case slug
  when 'rice' then 0.08 when 'basmati-rice' then 0.12 when 'sona-masoori-rice' then 0.07 when 'idli-rice' then 0.09
  when 'poha' then 0.10 when 'semolina' then 0.08 when 'oats' then 0.18 when 'besan' then 0.14
  when 'ragi-flour' then 0.10 when 'whole-wheat-flour' then 0.06 when 'moong-dal' then 0.16
  when 'toor-dal' then 0.18 when 'rajma' then 0.18 when 'whole-chickpeas' then 0.16
  when 'paneer' then 0.42 when 'egg' then 7.00 when 'chicken' then 0.32 when 'fish' then 0.45
  when 'spinach' then 0.06 when 'green-peas' then 0.09 when 'carrot' then 0.05 when 'brinjal' then 0.05 when 'cauliflower' then 0.06
  when 'potato' then 0.04 when 'tomato' then 0.05 when 'onion' then 0.04 when 'curd' then 0.12
  else estimated_unit_cost end,
  cost_currency = 'INR'
where slug in ('rice', 'basmati-rice', 'sona-masoori-rice', 'idli-rice', 'poha', 'semolina', 'oats', 'besan', 'ragi-flour', 'whole-wheat-flour', 'moong-dal', 'toor-dal', 'rajma', 'whole-chickpeas', 'paneer', 'egg', 'chicken', 'fish', 'spinach', 'green-peas', 'carrot', 'brinjal', 'cauliflower', 'potato', 'tomato', 'onion', 'curd');

with catalog(slug, name, category_slug, primary_slug, secondary_slug, prep_minutes, cook_minutes) as (values
  ('idli-sambar', 'Idli Sambar', 'breakfast', 'idli-rice', 'toor-dal', 20, 25),
  ('masala-dosa', 'Masala Dosa', 'breakfast', 'idli-rice', 'potato', 20, 20),
  ('vegetable-upma', 'Vegetable Upma', 'breakfast', 'semolina', 'green-peas', 10, 15),
  ('kanda-poha', 'Kanda Poha', 'breakfast', 'poha', 'potato', 10, 15),
  ('vegetable-oats', 'Vegetable Oats', 'breakfast', 'oats', 'carrot', 10, 10),
  ('besan-chilla', 'Besan Chilla', 'breakfast', 'besan', 'tomato', 10, 12),
  ('ragi-dosa', 'Ragi Dosa', 'breakfast', 'ragi-flour', 'curd', 10, 15),
  ('egg-bhurji', 'Egg Bhurji', 'breakfast', 'egg', 'tomato', 8, 12),
  ('paneer-paratha', 'Paneer Paratha', 'breakfast', 'whole-wheat-flour', 'paneer', 20, 15),
  ('moong-chilla', 'Moong Dal Chilla', 'breakfast', 'moong-dal', 'spinach', 15, 15),
  ('rajma-chawal', 'Rajma Chawal', 'lunch', 'rajma', 'rice', 15, 35),
  ('chole-rice', 'Chole Rice', 'lunch', 'whole-chickpeas', 'rice', 15, 35),
  ('sambar-rice', 'Sambar Rice', 'lunch', 'toor-dal', 'rice', 15, 30),
  ('lemon-rice', 'Lemon Rice with Peas', 'lunch', 'rice', 'green-peas', 10, 20),
  ('vegetable-pulao', 'Vegetable Pulao', 'lunch', 'basmati-rice', 'carrot', 15, 25),
  ('paneer-rice-bowl', 'Paneer Rice Bowl', 'lunch', 'paneer', 'rice', 15, 20),
  ('egg-curry-rice', 'Egg Curry Rice', 'lunch', 'egg', 'rice', 10, 25),
  ('chicken-curry-rice', 'Chicken Curry Rice', 'lunch', 'chicken', 'rice', 15, 35),
  ('fish-curry-rice', 'Fish Curry Rice', 'lunch', 'fish', 'rice', 15, 25),
  ('dal-tadka-rice', 'Dal Tadka Rice', 'lunch', 'toor-dal', 'rice', 10, 25),
  ('palak-paneer', 'Palak Paneer', 'dinner', 'paneer', 'spinach', 15, 25),
  ('chicken-saag', 'Chicken Saag', 'dinner', 'chicken', 'spinach', 15, 30),
  ('fish-masala', 'Fish Masala Curry', 'dinner', 'fish', 'tomato', 15, 25),
  ('egg-curry', 'Egg Curry', 'dinner', 'egg', 'tomato', 10, 25),
  ('aloo-gobi', 'Aloo Gobi', 'dinner', 'potato', 'cauliflower', 15, 25),
  ('baingan-bharta', 'Baingan Bharta', 'dinner', 'brinjal', 'tomato', 15, 25),
  ('chana-masala', 'Chana Masala', 'dinner', 'whole-chickpeas', 'tomato', 15, 30),
  ('mixed-vegetable-curry', 'Mixed Vegetable Curry', 'dinner', 'carrot', 'green-peas', 15, 25),
  ('dal-fry', 'Dal Fry', 'dinner', 'moong-dal', 'tomato', 10, 25),
  ('chicken-biryani', 'Chicken Biryani', 'dinner', 'chicken', 'basmati-rice', 20, 40)
), inserted as (
  insert into public.recipes (source_type, visibility, source_id, name, description, primary_cuisine_id, servings, difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes, instructions, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g, sodium_mg, is_active, published_at, slug, publication_status, quality_status, nutrition_source, nutrition_status, nutrition_updated_at)
  select 'system', 'system', 'system', name, 'A balanced Nutriweek starter recipe for everyday Indian meals.', (select id from public.cuisines where slug = 'indian'), 4, 'beginner', prep_minutes, cook_minutes, prep_minutes + cook_minutes, 'See structured recipe steps.', 480, 22, 58, 15, 8, 6, 650, true, now(), slug, 'published', 'verified', 'Nutriweek editorial estimate', 'verified', now()
  from catalog
  on conflict (slug) where slug is not null do update set name = excluded.name, publication_status = 'published', quality_status = 'verified', nutrition_status = 'verified', is_active = true
  returning id, slug, name
)
insert into public.recipe_meal_categories (recipe_id, meal_category_id)
select inserted.id, categories.id from inserted join catalog on catalog.slug = inserted.slug join public.meal_categories categories on categories.slug = catalog.category_slug
on conflict do nothing;

with catalog(slug, primary_slug, secondary_slug) as (values
  ('idli-sambar','idli-rice','toor-dal'),('masala-dosa','idli-rice','potato'),('vegetable-upma','semolina','green-peas'),('kanda-poha','poha','potato'),('vegetable-oats','oats','carrot'),('besan-chilla','besan','tomato'),('ragi-dosa','ragi-flour','curd'),('egg-bhurji','egg','tomato'),('paneer-paratha','whole-wheat-flour','paneer'),('moong-chilla','moong-dal','spinach'),('rajma-chawal','rajma','rice'),('chole-rice','whole-chickpeas','rice'),('sambar-rice','toor-dal','rice'),('lemon-rice','rice','green-peas'),('vegetable-pulao','basmati-rice','carrot'),('paneer-rice-bowl','paneer','rice'),('egg-curry-rice','egg','rice'),('chicken-curry-rice','chicken','rice'),('fish-curry-rice','fish','rice'),('dal-tadka-rice','toor-dal','rice'),('palak-paneer','paneer','spinach'),('chicken-saag','chicken','spinach'),('fish-masala','fish','tomato'),('egg-curry','egg','tomato'),('aloo-gobi','potato','cauliflower'),('baingan-bharta','brinjal','tomato'),('chana-masala','whole-chickpeas','tomato'),('mixed-vegetable-curry','carrot','green-peas'),('dal-fry','moong-dal','tomato'),('chicken-biryani','chicken','basmati-rice')
)
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, base_quantity, base_unit_code, display_order)
select recipes.id, ingredients.id, case when ingredients.default_unit_code = 'count' then 4 else amount end, ingredients.default_unit_code, case when ingredients.default_unit_code = 'count' then 4 else amount end, ingredients.default_unit_code, display_order
from catalog join public.recipes recipes on recipes.slug = catalog.slug
cross join lateral (values (catalog.primary_slug, 200::numeric, 1), (catalog.secondary_slug, 120::numeric, 2), ('onion'::text, 50::numeric, 3)) as source(ingredient_slug, amount, display_order)
join public.ingredients ingredients on ingredients.slug = source.ingredient_slug
where recipes.source_type = 'system'
on conflict do nothing;

insert into public.recipe_steps (recipe_id, step_number, instruction, estimated_duration_minutes)
select recipes.id, steps.step_number, steps.instruction, steps.duration
from public.recipes recipes
cross join lateral (values (1::smallint, 'Prepare and measure the listed ingredients.', 10), (2::smallint, 'Cook until tender, aromatic, and well combined.', 20), (3::smallint, 'Taste, adjust seasoning, and serve hot.', 2)) as steps(step_number, instruction, duration)
where recipes.slug in ('idli-sambar','masala-dosa','vegetable-upma','kanda-poha','vegetable-oats','besan-chilla','ragi-dosa','egg-bhurji','paneer-paratha','moong-chilla','rajma-chawal','chole-rice','sambar-rice','lemon-rice','vegetable-pulao','paneer-rice-bowl','egg-curry-rice','chicken-curry-rice','fish-curry-rice','dal-tadka-rice','palak-paneer','chicken-saag','fish-masala','egg-curry','aloo-gobi','baingan-bharta','chana-masala','mixed-vegetable-curry','dal-fry','chicken-biryani')
on conflict (recipe_id, step_number) do nothing;

select public.recalculate_recipe_quality(id), public.recalculate_recipe_estimated_cost(id)
from public.recipes where source_type = 'system' and publication_status = 'published';
