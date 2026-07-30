-- Replace only the generic starter-catalog cooking steps with editorial,
-- home-style instructions. The existing structured recipe model remains the
-- single source of truth.
with curated(slug) as (values
  ('chicken-biryani'), ('chicken-curry-rice'), ('chicken-saag'), ('paneer-paratha'), ('paneer-rice-bowl'),
  ('rajma-chawal'), ('dal-fry'), ('dal-tadka-rice'), ('egg-curry'), ('egg-bhurji'),
  ('fish-curry-rice'), ('fish-masala'), ('lemon-rice'), ('vegetable-upma'), ('masala-dosa'),
  ('idli-sambar'), ('chole-rice'), ('baingan-bharta'), ('vegetable-pulao'), ('moong-chilla')
)
delete from public.recipe_steps
using public.recipes, curated
where recipe_steps.recipe_id = recipes.id and recipes.slug = curated.slug;

with curated(slug) as (values
  ('chicken-biryani'), ('chicken-curry-rice'), ('chicken-saag'), ('paneer-paratha'), ('paneer-rice-bowl'),
  ('rajma-chawal'), ('dal-fry'), ('dal-tadka-rice'), ('egg-curry'), ('egg-bhurji'),
  ('fish-curry-rice'), ('fish-masala'), ('lemon-rice'), ('vegetable-upma'), ('masala-dosa'),
  ('idli-sambar'), ('chole-rice'), ('baingan-bharta'), ('vegetable-pulao'), ('moong-chilla')
)
delete from public.recipe_ingredients
using public.recipes, curated
where recipe_ingredients.recipe_id = recipes.id and recipes.slug = curated.slug;

with ingredients(slug, ingredient_slug, quantity, display_order) as (values
  ('chicken-biryani', 'chicken', 700::numeric, 1), ('chicken-biryani', 'basmati-rice', 350::numeric, 2), ('chicken-biryani', 'onion', 250::numeric, 3), ('chicken-biryani', 'yogurt', 180::numeric, 4), ('chicken-biryani', 'mint-leaves', 20::numeric, 5),
  ('chicken-curry-rice', 'chicken', 650::numeric, 1), ('chicken-curry-rice', 'rice', 320::numeric, 2), ('chicken-curry-rice', 'onion', 180::numeric, 3), ('chicken-curry-rice', 'tomato', 250::numeric, 4), ('chicken-curry-rice', 'garlic', 20::numeric, 5),
  ('chicken-saag', 'chicken', 650::numeric, 1), ('chicken-saag', 'spinach', 400::numeric, 2), ('chicken-saag', 'onion', 180::numeric, 3), ('chicken-saag', 'tomato', 200::numeric, 4), ('chicken-saag', 'ginger', 20::numeric, 5),
  ('paneer-paratha', 'whole-wheat-flour', 400::numeric, 1), ('paneer-paratha', 'paneer', 300::numeric, 2), ('paneer-paratha', 'onion', 80::numeric, 3), ('paneer-paratha', 'coriander-leaves', 20::numeric, 4), ('paneer-paratha', 'ghee', 30::numeric, 5),
  ('paneer-rice-bowl', 'paneer', 350::numeric, 1), ('paneer-rice-bowl', 'rice', 320::numeric, 2), ('paneer-rice-bowl', 'green-peas', 150::numeric, 3), ('paneer-rice-bowl', 'carrot', 150::numeric, 4), ('paneer-rice-bowl', 'onion', 100::numeric, 5),
  ('rajma-chawal', 'rajma', 300::numeric, 1), ('rajma-chawal', 'rice', 320::numeric, 2), ('rajma-chawal', 'onion', 180::numeric, 3), ('rajma-chawal', 'tomato', 250::numeric, 4), ('rajma-chawal', 'ginger', 20::numeric, 5),
  ('dal-fry', 'moong-dal', 250::numeric, 1), ('dal-fry', 'onion', 120::numeric, 2), ('dal-fry', 'tomato', 200::numeric, 3), ('dal-fry', 'garlic', 25::numeric, 4), ('dal-fry', 'ghee', 30::numeric, 5),
  ('dal-tadka-rice', 'toor-dal', 250::numeric, 1), ('dal-tadka-rice', 'rice', 320::numeric, 2), ('dal-tadka-rice', 'tomato', 180::numeric, 3), ('dal-tadka-rice', 'garlic', 25::numeric, 4), ('dal-tadka-rice', 'ghee', 30::numeric, 5),
  ('egg-curry', 'egg', 8::numeric, 1), ('egg-curry', 'onion', 200::numeric, 2), ('egg-curry', 'tomato', 250::numeric, 3), ('egg-curry', 'ginger', 20::numeric, 4), ('egg-curry', 'garlic', 20::numeric, 5),
  ('egg-bhurji', 'egg', 8::numeric, 1), ('egg-bhurji', 'onion', 150::numeric, 2), ('egg-bhurji', 'tomato', 200::numeric, 3), ('egg-bhurji', 'green-chilli', 10::numeric, 4), ('egg-bhurji', 'coriander-leaves', 15::numeric, 5),
  ('fish-curry-rice', 'fish', 650::numeric, 1), ('fish-curry-rice', 'rice', 320::numeric, 2), ('fish-curry-rice', 'tomato', 200::numeric, 3), ('fish-curry-rice', 'tamarind', 30::numeric, 4), ('fish-curry-rice', 'curry-leaves', 10::numeric, 5),
  ('fish-masala', 'fish', 650::numeric, 1), ('fish-masala', 'onion', 200::numeric, 2), ('fish-masala', 'tomato', 250::numeric, 3), ('fish-masala', 'ginger', 20::numeric, 4), ('fish-masala', 'garlic', 20::numeric, 5),
  ('lemon-rice', 'rice', 350::numeric, 1), ('lemon-rice', 'green-peas', 180::numeric, 2), ('lemon-rice', 'lemon', 80::numeric, 3), ('lemon-rice', 'curry-leaves', 10::numeric, 4), ('lemon-rice', 'peanuts', 60::numeric, 5),
  ('vegetable-upma', 'semolina', 300::numeric, 1), ('vegetable-upma', 'onion', 150::numeric, 2), ('vegetable-upma', 'green-peas', 150::numeric, 3), ('vegetable-upma', 'carrot', 150::numeric, 4), ('vegetable-upma', 'curry-leaves', 10::numeric, 5),
  ('masala-dosa', 'idli-rice', 350::numeric, 1), ('masala-dosa', 'potato', 500::numeric, 2), ('masala-dosa', 'onion', 180::numeric, 3), ('masala-dosa', 'green-chilli', 10::numeric, 4), ('masala-dosa', 'curry-leaves', 10::numeric, 5),
  ('idli-sambar', 'idli-rice', 350::numeric, 1), ('idli-sambar', 'toor-dal', 220::numeric, 2), ('idli-sambar', 'tomato', 180::numeric, 3), ('idli-sambar', 'tamarind', 30::numeric, 4), ('idli-sambar', 'curry-leaves', 10::numeric, 5),
  ('chole-rice', 'whole-chickpeas', 300::numeric, 1), ('chole-rice', 'rice', 320::numeric, 2), ('chole-rice', 'onion', 180::numeric, 3), ('chole-rice', 'tomato', 250::numeric, 4), ('chole-rice', 'ginger', 20::numeric, 5),
  ('baingan-bharta', 'brinjal', 700::numeric, 1), ('baingan-bharta', 'onion', 180::numeric, 2), ('baingan-bharta', 'tomato', 250::numeric, 3), ('baingan-bharta', 'ginger', 20::numeric, 4), ('baingan-bharta', 'coriander-leaves', 20::numeric, 5),
  ('vegetable-pulao', 'basmati-rice', 350::numeric, 1), ('vegetable-pulao', 'carrot', 150::numeric, 2), ('vegetable-pulao', 'green-peas', 150::numeric, 3), ('vegetable-pulao', 'beans', 150::numeric, 4), ('vegetable-pulao', 'ghee', 30::numeric, 5),
  ('moong-chilla', 'moong-dal', 300::numeric, 1), ('moong-chilla', 'spinach', 150::numeric, 2), ('moong-chilla', 'onion', 120::numeric, 3), ('moong-chilla', 'ginger', 20::numeric, 4), ('moong-chilla', 'coriander-leaves', 20::numeric, 5)
)
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, base_quantity, base_unit_code, display_order)
select recipes.id, canonical_ingredients.id, ingredients.quantity, canonical_ingredients.default_unit_code, ingredients.quantity, canonical_ingredients.default_unit_code, ingredients.display_order
from ingredients
join public.recipes on recipes.slug = ingredients.slug
join public.ingredients as canonical_ingredients on canonical_ingredients.slug = ingredients.ingredient_slug;

with steps(slug, step_number, instruction, tip, duration) as (values
  ('chicken-biryani', 1, 'Rinse the basmati rice until the water runs mostly clear. Soak it for 20 minutes, then boil in well-salted water until it is about three-quarters cooked; drain and set aside.', 'The rice should still have a firm centre so it finishes cooking during the dum.', 25),
  ('chicken-biryani', 2, 'Brown sliced onions in oil or ghee until deep golden. Reserve half for layering, then cook the remaining onions with ginger-garlic paste, tomatoes, yogurt, biryani masala and chicken until the masala loses its raw smell.', 'Cook the chicken only until it is nearly done; overcooking before layering will make it dry.', 20),
  ('chicken-biryani', 3, 'Layer half the rice over the chicken, scatter mint, coriander and fried onions, then repeat with the remaining rice. Drizzle saffron milk or warm milk mixed with a little ghee over the top.', 'Keep the layers loose rather than pressing them down.', 5),
  ('chicken-biryani', 4, 'Seal the pot tightly and cook on the lowest heat for 20 to 25 minutes. Rest it for 10 minutes, then lift the biryani gently from the side and serve.', 'Place a tawa under a thin-bottomed pot to protect the bottom layer from scorching.', 30),

  ('chicken-curry-rice', 1, 'Cook the rice until fluffy and keep it covered. Heat oil in a kadhai and soften onions with a pinch of salt.', 'Start the rice first so both parts of the meal are ready together.', 18),
  ('chicken-curry-rice', 2, 'Add ginger-garlic paste, tomatoes, turmeric, coriander powder and chilli powder. Cook until the tomatoes break down and oil begins to show at the edges.', 'A well-cooked masala gives the curry its depth.', 12),
  ('chicken-curry-rice', 3, 'Add chicken, salt and a splash of water. Cover and simmer until the chicken is tender and the gravy coats it well.', 'Stir once or twice and add hot water only if the gravy becomes too dry.', 25),
  ('chicken-curry-rice', 4, 'Finish with garam masala and coriander leaves. Serve the curry hot alongside the rice.', 'Rest the curry for five minutes before serving so the flavours settle.', 5),

  ('chicken-saag', 1, 'Blanch spinach briefly, cool it and blend to a coarse puree. Heat oil and cook onions until soft, then add ginger-garlic paste and green chilli.', 'Do not over-blend the spinach; a little texture keeps the saag homely.', 15),
  ('chicken-saag', 2, 'Add tomatoes, turmeric, coriander powder and salt. Cook until the masala is thick and glossy.', 'Use medium heat so the spices do not catch at the bottom.', 10),
  ('chicken-saag', 3, 'Add chicken and sauté until lightly sealed. Pour in a little hot water, cover and cook until tender.', 'Bone-in chicken gives the gravy extra flavour, though boneless works too.', 25),
  ('chicken-saag', 4, 'Stir in the spinach puree and simmer gently for 5 to 7 minutes. Finish with a little ghee, garam masala and lemon if you like.', 'Avoid boiling hard after adding spinach to preserve its colour.', 8),

  ('paneer-paratha', 1, 'Mix grated paneer with finely chopped onion, coriander, green chilli, cumin, salt and a pinch of amchur or chaat masala. Keep the filling dry and crumbly.', 'Squeeze any watery paneer before mixing so the parathas do not tear.', 10),
  ('paneer-paratha', 2, 'Divide rested whole-wheat dough into balls. Roll one ball into a small disc, add a generous spoonful of filling, gather the edges and seal.', 'Dust lightly with flour; too much dry flour makes the paratha tough.', 10),
  ('paneer-paratha', 3, 'Roll gently into an even round. Cook on a hot tawa until brown spots appear on both sides, adding ghee or oil around the edges.', 'Press the edges lightly with a spatula so they cook through.', 12),
  ('paneer-paratha', 4, 'Serve hot with yogurt, pickle or a simple salad.', 'Cover cooked parathas with a clean cloth to keep them soft.', 3),

  ('paneer-rice-bowl', 1, 'Cook rice until tender and separate the grains with a fork. Pan-sear paneer cubes in a little oil until lightly golden; remove them to a plate.', 'Do not fry paneer too long or it will become chewy.', 18),
  ('paneer-rice-bowl', 2, 'In the same pan, sauté onion, carrot, peas and bell pepper until crisp-tender. Add ginger, garlic, cumin and a pinch of turmeric.', 'Keep the vegetables colourful by cooking them on medium-high heat.', 10),
  ('paneer-rice-bowl', 3, 'Return the paneer, add the cooked rice, salt, pepper and a squeeze of lemon. Toss gently until hot.', 'Use day-old rice if available for the easiest tossing.', 7),
  ('paneer-rice-bowl', 4, 'Top with coriander and serve in bowls with yogurt or raita.', 'A spoonful of mint chutney makes a bright finishing touch.', 3),

  ('rajma-chawal', 1, 'Soak rajma overnight. Drain, then pressure-cook with fresh water, salt and a bay leaf until very tender.', 'Rajma must be soft all the way through; undercooked beans are not pleasant or safe to eat.', 40),
  ('rajma-chawal', 2, 'Cook rice separately until fluffy. Meanwhile, heat oil and brown onions, then add ginger-garlic paste and tomatoes.', 'Mash the tomatoes as they cook for a smooth, clingy gravy.', 15),
  ('rajma-chawal', 3, 'Add turmeric, coriander powder, cumin powder and chilli powder. Cook the masala until oil appears at the edges, then add the cooked rajma with some of its cooking liquid.', 'The bean cooking liquid gives the curry a fuller body.', 15),
  ('rajma-chawal', 4, 'Simmer for 15 minutes, lightly crushing a few beans to thicken. Finish with garam masala and coriander; serve over hot rice.', 'Rajma tastes even better after a short rest before serving.', 18),

  ('dal-fry', 1, 'Rinse moong dal and cook with turmeric and water until soft. Whisk it lightly so it becomes creamy but not completely smooth.', 'A pressure cooker makes this quick, but a saucepan works with a little more time.', 22),
  ('dal-fry', 2, 'Heat ghee, add cumin seeds, garlic and dried red chilli. Let the garlic turn pale golden and fragrant.', 'Keep the heat moderate so the garlic does not burn.', 4),
  ('dal-fry', 3, 'Add onion and tomato, then cook with coriander powder and chilli powder until soft. Stir this masala into the dal with salt and enough hot water for your preferred consistency.', 'Add hot water, not cold, to keep the dal simmering smoothly.', 10),
  ('dal-fry', 4, 'Simmer for a few minutes and finish with lemon and coriander leaves. Serve with roti or steamed rice.', 'A final spoon of ghee just before serving adds a restaurant-style aroma.', 5),

  ('dal-tadka-rice', 1, 'Cook toor dal with turmeric until soft, then mash it lightly. Cook rice separately and keep warm.', 'Rinse the rice until clear for fluffier grains.', 25),
  ('dal-tadka-rice', 2, 'Stir salt, a little hot water and chopped tomato into the dal. Simmer until the tomato softens.', 'Keep the dal pourable enough to spoon over rice.', 8),
  ('dal-tadka-rice', 3, 'For the tadka, heat ghee with cumin, mustard seeds, garlic, dried red chilli and a pinch of hing. When fragrant, add red chilli powder off the heat.', 'Take the pan off the heat before adding chilli powder so it stays bright and does not turn bitter.', 4),
  ('dal-tadka-rice', 4, 'Pour the sizzling tadka over the dal, cover for a minute, then serve with rice and coriander.', 'Serve immediately to enjoy the aroma of the fresh tempering.', 3),

  ('egg-curry', 1, 'Hard-boil the eggs, peel them and make a few shallow slits. Lightly fry them with a pinch of turmeric and salt; set aside.', 'The slits help the eggs absorb the gravy.', 14),
  ('egg-curry', 2, 'Cook onions in oil until golden, then add ginger-garlic paste and tomatoes. Add turmeric, coriander powder and chilli powder and cook until the masala is thick.', 'Cook the tomatoes fully to avoid a raw, sharp gravy.', 15),
  ('egg-curry', 3, 'Add water and salt, bring to a simmer, then slide in the eggs. Cook gently until the gravy coats the eggs.', 'Turn the eggs once so they colour evenly in the gravy.', 10),
  ('egg-curry', 4, 'Finish with garam masala and coriander. Serve with rice, roti or paratha.', 'For a creamier curry, stir in a spoonful of yogurt at the end on low heat.', 3),

  ('egg-bhurji', 1, 'Whisk eggs with salt, pepper and a little turmeric. Heat oil or butter and sauté cumin, onions and green chilli until the onions soften.', 'Whisk just before cooking for a tender scramble.', 7),
  ('egg-bhurji', 2, 'Add tomatoes, ginger and a pinch of chilli powder. Cook until the tomatoes are soft and most of their moisture has evaporated.', 'A dry masala prevents watery bhurji.', 6),
  ('egg-bhurji', 3, 'Pour in the eggs and stir slowly, scraping the pan, until softly set.', 'Switch off while the eggs still look slightly glossy; they will finish from residual heat.', 4),
  ('egg-bhurji', 4, 'Fold in coriander and serve immediately with toast, pav or roti.', 'A squeeze of lemon just before serving brightens the flavour.', 2),

  ('fish-curry-rice', 1, 'Cook rice until fluffy and set aside. Rub fish pieces with turmeric, salt and a little chilli powder, then rest for 10 minutes.', 'Use firm fish pieces so they hold their shape in the curry.', 18),
  ('fish-curry-rice', 2, 'Lightly fry the fish just until the surface sets; remove it from the pan. In the same oil, sauté mustard seeds, curry leaves, onion, ginger and garlic.', 'Do not cook the fish through at this stage.', 10),
  ('fish-curry-rice', 3, 'Add tomato, turmeric, coriander powder and tamarind water or a squeeze of lemon. Simmer until the curry smells cooked and lightly tangy.', 'Taste the sourness before adding the fish; it should be balanced, not sharp.', 12),
  ('fish-curry-rice', 4, 'Slide in the fish and simmer gently for 5 to 7 minutes. Serve with rice and coriander.', 'Shake the pan rather than stirring vigorously so the fish does not break.', 8),

  ('fish-masala', 1, 'Season fish with turmeric, salt and chilli powder. Pan-fry in a little oil until lightly golden and set aside.', 'Pat the fish dry first so it sears instead of steaming.', 10),
  ('fish-masala', 2, 'Sauté onions until golden, then add ginger-garlic paste and tomatoes. Cook with cumin, coriander powder and Kashmiri chilli powder until the masala is rich and thick.', 'Let the onion-tomato base cook slowly for the best colour.', 16),
  ('fish-masala', 3, 'Add a splash of water to loosen the masala, then nestle in the fish. Cover and cook gently until the fish flakes easily.', 'Keep the gravy thick enough to coat the fish rather than drown it.', 8),
  ('fish-masala', 4, 'Finish with garam masala, coriander and a squeeze of lemon. Serve with roti or rice.', 'Rest for two minutes before serving so the fish stays intact.', 3),

  ('lemon-rice', 1, 'Use cooled cooked rice and separate any clumps with your fingers. Heat oil and crackle mustard seeds, then add chana dal, urad dal, peanuts, curry leaves and dried red chilli.', 'Cooled rice stays separate and does not turn mushy while tossing.', 8),
  ('lemon-rice', 2, 'Add green peas, turmeric and salt. Sauté until the peas are hot and tender.', 'Add a splash of water only if using frozen peas and the pan looks dry.', 5),
  ('lemon-rice', 3, 'Lower the heat, add the rice and toss gently until evenly yellow. Switch off the heat and stir in fresh lemon juice.', 'Adding lemon off the heat keeps its flavour fresh.', 5),
  ('lemon-rice', 4, 'Finish with coriander and serve with yogurt, pickle or papad.', 'Taste after the lemon goes in and adjust salt before serving.', 2),

  ('vegetable-upma', 1, 'Dry-roast semolina on low heat until it smells nutty and feels light. Transfer it to a plate.', 'Roasting prevents lumps and gives upma its characteristic aroma.', 8),
  ('vegetable-upma', 2, 'Heat oil, crackle mustard seeds and add curry leaves, green chilli, ginger and onion. Sauté until the onion is soft.', 'Keep the tempering ready before adding water so the semolina goes in smoothly.', 6),
  ('vegetable-upma', 3, 'Add peas, carrot, salt and hot water. Bring to a steady boil.', 'Use hot water to keep the cooking even.', 6),
  ('vegetable-upma', 4, 'Lower the heat and slowly rain in the roasted semolina while stirring continuously. Cover for 3 minutes, then fluff with a fork and finish with lemon and coriander.', 'Stir steadily while adding semolina to avoid lumps.', 7),

  ('masala-dosa', 1, 'Boil potatoes until tender. Temper mustard seeds, curry leaves, chana dal and onions; add turmeric, green chilli and the potatoes, then mash lightly with salt and lemon.', 'Keep the potato masala fairly dry so it does not soften the dosa.', 25),
  ('masala-dosa', 2, 'Heat a well-seasoned tawa until medium-hot. Pour dosa batter in the centre and spread it outward in circles to make a thin round.', 'If the tawa is too hot, wipe it briefly with a damp cloth before spreading the batter.', 3),
  ('masala-dosa', 3, 'Drizzle oil or ghee around the edges and cook until the base turns crisp and releases easily.', 'Do not flip a classic thin dosa; cook it until the top is set.', 4),
  ('masala-dosa', 4, 'Place potato masala in the centre, fold the dosa over it and serve immediately with chutney and sambar.', 'Serve straight from the tawa for the best crispness.', 2),

  ('idli-sambar', 1, 'Steam idlis in greased moulds until puffed and a skewer comes out clean. Let them rest for a minute before unmoulding.', 'Do not over-steam or the idlis can become dry.', 12),
  ('idli-sambar', 2, 'Cook toor dal until soft and mash it. In a pot, simmer vegetables with tamarind water, turmeric and sambar powder until tender.', 'Cook firmer vegetables first so everything finishes together.', 20),
  ('idli-sambar', 3, 'Add the mashed dal, salt and water as needed. Simmer until the sambar is fragrant and lightly thick.', 'Keep the sambar slightly thinner than a curry; it thickens as it sits.', 8),
  ('idli-sambar', 4, 'Temper mustard seeds, curry leaves, dried red chilli and hing in oil, then pour over the sambar. Serve hot with idlis.', 'Cover the pot for one minute after tempering to trap the aroma.', 3),

  ('chole-rice', 1, 'Soak chickpeas overnight and pressure-cook them with salt until tender. Cook rice separately and keep warm.', 'The chickpeas should crush easily between your fingers before they go into the gravy.', 40),
  ('chole-rice', 2, 'Brown onions in oil, add ginger-garlic paste and tomatoes, then cook with chole masala, coriander powder and chilli powder until thick.', 'A little tea bag in the chickpea cooker is optional for a deeper traditional colour.', 16),
  ('chole-rice', 3, 'Add chickpeas and some cooking liquid. Simmer, mashing a few chickpeas against the side of the pan to thicken the gravy.', 'Keep the curry moist enough to spoon over rice.', 15),
  ('chole-rice', 4, 'Finish with garam masala, crushed kasuri methi and coriander. Serve over rice with onion and lemon.', 'Let the chole rest for five minutes for a fuller flavour.', 5),

  ('baingan-bharta', 1, 'Roast the whole brinjal directly over a flame or under a grill until the skin is charred and the flesh collapses. Cool, peel and mash the flesh.', 'Pierce the brinjal once or twice before roasting so steam can escape.', 25),
  ('baingan-bharta', 2, 'Heat oil and sauté cumin, onion, ginger, garlic and green chilli until the onion is golden.', 'The smoky brinjal is the star, so keep the aromatics finely chopped.', 10),
  ('baingan-bharta', 3, 'Add tomatoes, turmeric, coriander powder and chilli powder. Cook until soft and jammy.', 'Cook out the tomato moisture before adding the brinjal.', 10),
  ('baingan-bharta', 4, 'Fold in the mashed brinjal, salt and coriander. Cook for a few minutes until well combined, then serve with roti.', 'A spoonful of mustard oil at the end adds a lovely rustic aroma.', 6),

  ('vegetable-pulao', 1, 'Rinse basmati rice and soak for 15 minutes. Heat ghee, add whole spices, then sauté onion until translucent.', 'Soaking helps the rice cook into long, separate grains.', 18),
  ('vegetable-pulao', 2, 'Add carrot, peas, beans and potato with salt and a pinch of garam masala. Sauté for a few minutes.', 'Cut vegetables to similar sizes so they cook evenly.', 7),
  ('vegetable-pulao', 3, 'Add drained rice and gently fry for a minute. Pour in hot water, bring to a boil, then cover and cook on the lowest heat until the water is absorbed.', 'Use the correct water ratio for your rice variety; too much water makes pulao sticky.', 15),
  ('vegetable-pulao', 4, 'Rest covered for 10 minutes, fluff gently and finish with coriander. Serve with raita.', 'Do not stir while the pulao cooks; fluff only after resting.', 12),

  ('moong-chilla', 1, 'Soak moong dal for at least 3 hours, then blend with ginger, green chilli, cumin and enough water to make a pourable batter.', 'The batter should coat a spoon but still spread easily on the tawa.', 15),
  ('moong-chilla', 2, 'Stir in salt, chopped onion, spinach and coriander. Heat a lightly greased tawa over medium heat.', 'Add salt just before cooking if the batter will sit for a while.', 5),
  ('moong-chilla', 3, 'Pour a ladleful of batter and spread it gently into a round. Drizzle oil around the edge and cook until the underside is golden.', 'Keep the chilla a little thicker than a dosa so it stays soft inside.', 5),
  ('moong-chilla', 4, 'Flip and cook the second side until set. Serve hot with mint chutney or yogurt.', 'For extra protein, sprinkle crumbled paneer on top before flipping.', 4)
)
insert into public.recipe_steps (recipe_id, step_number, instruction, tip, estimated_duration_minutes)
select recipes.id, steps.step_number, steps.instruction, steps.tip, steps.duration
from steps join public.recipes on recipes.slug = steps.slug
on conflict (recipe_id, step_number) do update set
  instruction = excluded.instruction,
  tip = excluded.tip,
  estimated_duration_minutes = excluded.estimated_duration_minutes;
