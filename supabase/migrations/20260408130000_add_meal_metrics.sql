alter table public.menus
add column if not exists estimated_calories_kcal integer,
add column if not exists protein_grams integer,
add column if not exists cook_time_minutes integer;

alter table public.meal_plan_items
add column if not exists calories integer,
add column if not exists protein integer,
add column if not exists cook_time_minutes integer;

update public.menus
set
  estimated_calories_kcal = updates.estimated_calories_kcal,
  protein_grams = updates.protein_grams,
  cook_time_minutes = updates.cook_time_minutes,
  updated_at = now()
from (
  values
    ('beef-zucchini-porridge', 180, 8, 15),
    ('cabbage-tofu-fried-rice', 210, 9, 18),
    ('beef-potato-broccoli-rice', 240, 11, 20),
    ('chicken-sweetpotato-porridge', 190, 9, 16),
    ('zucchini-potato-porridge', 160, 3, 14),
    ('broccoli-tofu-rice', 200, 10, 15),
    ('pumpkin-chicken-stew', 220, 11, 22),
    ('spinach-potato-egg-scramble', 185, 8, 12),
    ('beef-cabbage-rice', 230, 12, 17),
    ('tofu-zucchini-risotto', 195, 9, 16),
    ('sweetpotato-broccoli-mash', 150, 3, 10),
    ('chicken-carrot-risotto', 215, 11, 18)
) as updates(source_key, estimated_calories_kcal, protein_grams, cook_time_minutes)
where public.menus.source_key = updates.source_key;
