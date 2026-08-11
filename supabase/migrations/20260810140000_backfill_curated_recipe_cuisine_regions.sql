-- Persist the editorial South/North assignments already authored in the expanded catalog.
-- The generator reads this existing recipe metadata for strict cuisine eligibility.
with assignments(slug, region_slug) as (
  values
    ('medu-vada', 'south-indian'), ('rava-idli', 'south-indian'), ('ven-pongal', 'south-indian'),
    ('set-dosa', 'south-indian'), ('vegetable-uttapam', 'south-indian'), ('pesarattu', 'south-indian'),
    ('appam-stew', 'south-indian'), ('puttu-kadala', 'south-indian'), ('neer-dosa', 'south-indian'),
    ('akki-roti', 'south-indian'), ('coconut-rice', 'south-indian'), ('tamarind-rice', 'south-indian'),
    ('curd-rice', 'south-indian'), ('tomato-rice', 'south-indian'), ('bisibele-bath', 'south-indian'),
    ('rasam-rice', 'south-indian'), ('avial-rice', 'south-indian'), ('vegetable-sambar', 'south-indian'),
    ('drumstick-sambar', 'south-indian'), ('pepper-rasam', 'south-indian'), ('beans-poriyal', 'south-indian'),
    ('cabbage-thoran', 'south-indian'), ('beetroot-poriyal', 'south-indian'), ('egg-appam', 'south-indian'),
    ('chicken-chettinad', 'south-indian'), ('kerala-fish-curry', 'south-indian'), ('prawn-curry', 'south-indian'),
    ('meen-molee', 'south-indian'), ('vegetable-kuruma', 'south-indian'), ('millet-upma', 'south-indian'),
    ('aloo-paratha', 'north-indian'), ('gobi-paratha', 'north-indian'), ('methi-paratha', 'north-indian'),
    ('stuffed-capsicum', 'north-indian'), ('paneer-bhurji', 'north-indian'), ('matar-paneer', 'north-indian'),
    ('shahi-paneer', 'north-indian'), ('kadai-paneer', 'north-indian'), ('paneer-tikka', 'north-indian'),
    ('dal-makhani', 'north-indian'), ('palak-dal', 'north-indian'), ('masoor-dal', 'north-indian'),
    ('chana-dal-tadka', 'north-indian'), ('kala-chana-curry', 'north-indian'), ('lobia-curry', 'north-indian'),
    ('kadhi-pakora', 'north-indian'), ('aloo-matar', 'north-indian'), ('jeera-rice', 'north-indian'),
    ('peas-pulao', 'north-indian'), ('vegetable-biryani', 'north-indian'), ('chicken-tikka-masala', 'north-indian'),
    ('butter-chicken', 'north-indian'), ('chicken-korma', 'north-indian'), ('mutton-curry', 'north-indian'),
    ('rogan-josh', 'north-indian'), ('fish-tikka', 'north-indian'), ('baingan-masala', 'north-indian'),
    ('bhindi-masala', 'north-indian'), ('mushroom-matar', 'north-indian'), ('malai-kofta', 'north-indian')
)
update public.recipes recipes
set primary_cuisine_region_id = regions.id
from assignments
join public.cuisine_regions regions on regions.slug = assignments.region_slug
where recipes.slug = assignments.slug
  and recipes.source_type = 'system'
  and recipes.primary_cuisine_id = regions.cuisine_id;
