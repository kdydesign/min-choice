-- Draft migration for generation metadata.
-- recipe_full_json already exists on meal_plan_items and is currently used.
-- Until this migration is applied, the app keeps these fields round-trippable
-- through result_payload_json and infers top-level generation flags on read.

alter table public.meal_plans
add column if not exists generation_mode text,
add column if not exists allow_auto_supplement boolean;

alter table public.meal_plans
drop constraint if exists meal_plans_generation_mode_check;

alter table public.meal_plans
add constraint meal_plans_generation_mode_check
check (
  generation_mode is null
  or generation_mode in ('ingredient_first', 'auto_recommend')
);

alter table public.meal_plan_items
add column if not exists menu_family text,
add column if not exists optional_added_ingredients_json jsonb,
add column if not exists nutrition_estimate_json jsonb,
add column if not exists scoring_metadata_json jsonb,
add column if not exists input_strength text;

alter table public.meal_plan_items
alter column optional_added_ingredients_json set default '[]'::jsonb;

alter table public.meal_plan_items
alter column nutrition_estimate_json set default '{}'::jsonb;

alter table public.meal_plan_items
alter column scoring_metadata_json set default '{}'::jsonb;

alter table public.meal_plan_items
drop constraint if exists meal_plan_items_input_strength_check;

alter table public.meal_plan_items
add constraint meal_plan_items_input_strength_check
check (
  input_strength is null
  or input_strength in ('none', 'low', 'medium', 'high')
);
