-- Enrich the first Nutriweek system catalog with editorial planning metadata.
insert into public.recipe_tags (slug, name, category) values
  ('healthy', 'Healthy', 'nutrition'), ('high-protein', 'High Protein', 'nutrition'),
  ('weight-loss', 'Weight Loss', 'suitability'), ('budget-friendly', 'Budget Friendly', 'workflow'),
  ('quick-meal', 'Quick Meal', 'workflow'), ('home-style', 'Home Style', 'occasion'),
  ('kids-friendly', 'Kids Friendly', 'suitability'), ('cheat-meal', 'Cheat Meal', 'occasion'),
  ('south-indian', 'South Indian', 'general'), ('north-indian', 'North Indian', 'general'),
  ('mixed-indian', 'Mixed Indian', 'general'), ('summer', 'Summer', 'occasion'),
  ('winter', 'Winter', 'occasion'), ('monsoon', 'Monsoon', 'occasion'), ('all-season', 'All Season', 'occasion')
on conflict (slug) do nothing;

insert into public.equipment (slug, name) values
  ('pressure-cooker', 'Pressure Cooker'), ('gas-stove', 'Gas Stove'), ('mixer', 'Mixer'),
  ('air-fryer', 'Air Fryer'), ('oven', 'Oven')
on conflict (slug) do nothing;

update public.recipes
set primary_cuisine_region_id = case
  when slug in ('idli-sambar', 'masala-dosa', 'vegetable-upma', 'ragi-dosa', 'sambar-rice') then (select id from public.cuisine_regions where slug = 'south-indian')
  when slug in ('paneer-paratha', 'rajma-chawal', 'chole-rice', 'paneer-rice-bowl', 'palak-paneer', 'chicken-saag', 'aloo-gobi', 'baingan-bharta', 'chana-masala', 'dal-fry', 'chicken-biryani') then (select id from public.cuisine_regions where slug = 'north-indian')
  else null end,
  difficulty = case
    when slug in ('masala-dosa', 'rajma-chawal', 'chole-rice', 'chicken-curry-rice', 'fish-curry-rice', 'chicken-saag', 'fish-masala', 'chicken-biryani') then 'Hard'
    when slug in ('idli-sambar', 'paneer-paratha', 'moong-chilla', 'sambar-rice', 'vegetable-pulao', 'paneer-rice-bowl', 'egg-curry-rice', 'dal-tadka-rice', 'palak-paneer', 'egg-curry', 'aloo-gobi', 'baingan-bharta', 'chana-masala', 'mixed-vegetable-curry') then 'Medium'
    else 'Easy' end,
  calories_kcal = case
    when slug like '%biryani%' then 620 when slug like '%paratha%' then 540 when slug like '%dosa%' then 430
    when slug like '%chicken%' then 510 when slug like '%fish%' then 460 when slug like '%paneer%' then 480
    when slug like '%egg%' then 390 when slug like '%rice%' or slug like '%chawal%' then 440 else 360 end,
  protein_g = case
    when slug like '%chicken%' then 32 when slug like '%fish%' then 30 when slug like '%paneer%' then 24
    when slug like '%egg%' then 22 when slug like '%rajma%' or slug like '%chole%' or slug like '%dal%' then 17 else 13 end,
  carbohydrates_g = case when slug like '%rice%' or slug like '%chawal%' or slug like '%biryani%' then 65 when slug like '%paratha%' or slug like '%dosa%' then 52 else 40 end,
  fat_g = case when slug like '%biryani%' then 22 when slug like '%paneer%' then 20 when slug like '%paratha%' then 18 else 12 end,
  fiber_g = case when slug like '%rajma%' or slug like '%chole%' or slug like '%dal%' then 10 when slug like '%vegetable%' or slug like '%palak%' or slug like '%aloo-gobi%' then 8 else 5 end,
  sugar_g = case when slug like '%vegetable%' or slug like '%palak%' then 5 else 4 end,
  sodium_mg = 550,
  nutrition_source = 'Nutriweek editorial estimate', nutrition_status = 'reviewed', nutrition_updated_at = now(),
  total_time_minutes = coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0)
where source_type = 'system' and publication_status = 'published';

-- All catalog recipes are suitable for a conventional stovetop; targeted equipment is added below.
insert into public.recipe_equipment_requirements (recipe_id, equipment_id, is_required)
select recipes.id, equipment.id, false from public.recipes recipes cross join public.equipment equipment
where recipes.source_type = 'system' and recipes.publication_status = 'published' and equipment.slug = 'gas-stove'
on conflict do nothing;

insert into public.recipe_equipment_requirements (recipe_id, equipment_id, is_required)
select recipes.id, equipment.id, false from public.recipes recipes cross join public.equipment equipment
where recipes.source_type = 'system' and recipes.publication_status = 'published' and equipment.slug = 'pressure-cooker'
  and recipes.slug in ('idli-sambar', 'rajma-chawal', 'chole-rice', 'sambar-rice', 'dal-tadka-rice', 'chicken-curry-rice', 'chicken-saag', 'chana-masala', 'dal-fry', 'chicken-biryani')
on conflict do nothing;

insert into public.recipe_equipment_requirements (recipe_id, equipment_id, is_required)
select recipes.id, equipment.id, false from public.recipes recipes cross join public.equipment equipment
where recipes.source_type = 'system' and recipes.publication_status = 'published' and equipment.slug = 'mixer'
  and recipes.slug in ('idli-sambar', 'masala-dosa', 'ragi-dosa', 'moong-chilla')
on conflict do nothing;

insert into public.recipe_equipment_requirements (recipe_id, equipment_id, is_required)
select recipes.id, equipment.id, false from public.recipes recipes cross join public.equipment equipment
where recipes.source_type = 'system' and recipes.publication_status = 'published' and equipment.slug = 'air-fryer'
  and recipes.slug in ('fish-masala', 'chicken-saag', 'aloo-gobi')
on conflict do nothing;

insert into public.recipe_equipment_requirements (recipe_id, equipment_id, is_required)
select recipes.id, equipment.id, false from public.recipes recipes cross join public.equipment equipment
where recipes.source_type = 'system' and recipes.publication_status = 'published' and equipment.slug = 'oven'
  and recipes.slug in ('paneer-paratha', 'mixed-vegetable-curry')
on conflict do nothing;

insert into public.recipe_tag_assignments (recipe_id, tag_id)
select recipes.id, tags.id from public.recipes recipes cross join public.recipe_tags tags
where recipes.source_type = 'system' and recipes.publication_status = 'published' and tags.slug = 'all-season'
on conflict do nothing;

insert into public.recipe_tag_assignments (recipe_id, tag_id)
select recipes.id, tags.id from public.recipes recipes cross join public.recipe_tags tags
where recipes.source_type = 'system' and recipes.publication_status = 'published' and (
  (tags.slug = 'healthy' and recipes.slug not in ('masala-dosa', 'paneer-paratha', 'chicken-biryani')) or
  (tags.slug = 'high-protein' and recipes.name ~* 'chicken|fish|egg|paneer|rajma|chole|dal') or
  (tags.slug = 'weight-loss' and recipes.name ~* 'vegetable|palak|dal|fish|moong') or
  (tags.slug = 'budget-friendly' and recipes.name ~* 'poha|upma|dal|chole|rajma|aloo|vegetable') or
  (tags.slug = 'quick-meal' and recipes.total_time_minutes <= 30) or
  (tags.slug = 'home-style') or
  (tags.slug = 'kids-friendly' and recipes.name ~* 'idli|dosa|upma|poha|egg bhurji|paneer|aloo gobi') or
  (tags.slug = 'cheat-meal' and recipes.slug in ('masala-dosa', 'paneer-paratha', 'chicken-biryani')) or
  (tags.slug = 'south-indian' and recipes.primary_cuisine_region_id = (select id from public.cuisine_regions where slug = 'south-indian')) or
  (tags.slug = 'north-indian' and recipes.primary_cuisine_region_id = (select id from public.cuisine_regions where slug = 'north-indian')) or
  (tags.slug = 'mixed-indian' and recipes.primary_cuisine_region_id is null) or
  (tags.slug = 'summer' and recipes.slug in ('lemon-rice', 'fish-curry-rice', 'vegetable-oats')) or
  (tags.slug = 'winter' and recipes.slug in ('palak-paneer', 'chicken-saag', 'aloo-gobi')) or
  (tags.slug = 'monsoon' and recipes.slug in ('idli-sambar', 'dal-tadka-rice', 'chana-masala'))
)
on conflict do nothing;

select public.recalculate_recipe_quality(id), public.recalculate_recipe_estimated_cost(id)
from public.recipes where source_type = 'system' and publication_status = 'published';
