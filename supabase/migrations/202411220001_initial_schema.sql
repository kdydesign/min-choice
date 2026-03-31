create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.anonymous_users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.user_identity_links (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null references public.anonymous_users(id) on delete cascade,
  user_id uuid not null,
  linked_at timestamptz not null default now(),
  unique (anonymous_user_id, user_id)
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  owner_anonymous_user_id uuid,
  name text not null,
  birth_date date,
  age_months integer,
  allergies_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_user_id is not null or owner_anonymous_user_id is not null)
);

create index if not exists idx_children_owner_user_id on public.children(owner_user_id);
create index if not exists idx_children_owner_anonymous_user_id on public.children(owner_anonymous_user_id);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null unique,
  display_name text not null,
  aliases_json jsonb not null default '[]'::jsonb,
  category text,
  is_allergen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ingredients_standard_key on public.ingredients(standard_key);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meal_types_json jsonb not null default '[]'::jsonb,
  required_ingredient_keys_json jsonb not null default '[]'::jsonb,
  optional_ingredient_keys_json jsonb not null default '[]'::jsonb,
  substitute_map_json jsonb not null default '{}'::jsonb,
  age_min_months integer not null default 12,
  texture text,
  recipe_template_json jsonb not null default '[]'::jsonb,
  caution_template text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menus_age_min_months on public.menus(age_min_months);
create index if not exists idx_menus_is_active on public.menus(is_active);

create table if not exists public.meal_inputs (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid,
  child_id uuid not null references public.children(id) on delete cascade,
  input_date date not null,
  meal_type text not null,
  original_ingredients_json jsonb not null default '[]'::jsonb,
  normalized_ingredients_json jsonb not null default '[]'::jsonb,
  excluded_allergy_ingredients_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (meal_type in ('breakfast', 'lunch', 'dinner'))
);

create index if not exists idx_meal_inputs_child_id_date on public.meal_inputs(child_id, input_date);
create index if not exists idx_meal_inputs_meal_plan_id on public.meal_inputs(meal_plan_id);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  plan_date date not null,
  created_by_user_id uuid,
  created_by_anonymous_user_id uuid,
  notices_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meal_plans_child_id_date on public.meal_plans(child_id, plan_date);
create index if not exists idx_meal_plans_created_at on public.meal_plans(created_at desc);

alter table public.meal_inputs
drop constraint if exists meal_inputs_meal_plan_id_fkey;

alter table public.meal_inputs
add constraint meal_inputs_meal_plan_id_fkey
foreign key (meal_plan_id) references public.meal_plans(id) on delete cascade;

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  meal_type text not null,
  menu_id uuid references public.menus(id) on delete set null,
  menu_name text not null,
  used_ingredient_keys_json jsonb not null default '[]'::jsonb,
  missing_ingredient_keys_json jsonb not null default '[]'::jsonb,
  substitutes_json jsonb not null default '{}'::jsonb,
  ai_recommendation text,
  recipe_summary_json jsonb not null default '[]'::jsonb,
  recipe_full_json jsonb not null default '[]'::jsonb,
  caution text,
  excluded_allergy_ingredients_json jsonb not null default '[]'::jsonb,
  prompt_version text,
  is_fallback boolean not null default false,
  result_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (meal_type in ('breakfast', 'lunch', 'dinner')),
  unique (meal_plan_id, meal_type)
);

create index if not exists idx_meal_plan_items_meal_plan_id on public.meal_plan_items(meal_plan_id);

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  meal_plan_item_id uuid references public.meal_plan_items(id) on delete cascade,
  meal_type text not null,
  prompt_version text,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_payload_json jsonb not null default '{}'::jsonb,
  validation_status text,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now(),
  check (meal_type in ('breakfast', 'lunch', 'dinner'))
);

create index if not exists idx_ai_generation_logs_meal_plan_item_id on public.ai_generation_logs(meal_plan_item_id);

create or replace function public.is_child_owner(target_child_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.children
    where id = target_child_id
      and owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_meal_plan_owner(target_meal_plan_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.meal_plans meal_plans
    join public.children children on children.id = meal_plans.child_id
    where meal_plans.id = target_meal_plan_id
      and children.owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_meal_plan_item_owner(target_meal_plan_item_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.meal_plan_items meal_plan_items
    join public.meal_plans meal_plans on meal_plans.id = meal_plan_items.meal_plan_id
    join public.children children on children.id = meal_plans.child_id
    where meal_plan_items.id = target_meal_plan_item_id
      and children.owner_user_id = auth.uid()
  );
$$;

drop trigger if exists set_children_updated_at on public.children;
create trigger set_children_updated_at
before update on public.children
for each row
execute function public.set_updated_at();

drop trigger if exists set_ingredients_updated_at on public.ingredients;
create trigger set_ingredients_updated_at
before update on public.ingredients
for each row
execute function public.set_updated_at();

drop trigger if exists set_menus_updated_at on public.menus;
create trigger set_menus_updated_at
before update on public.menus
for each row
execute function public.set_updated_at();

drop trigger if exists set_meal_plans_updated_at on public.meal_plans;
create trigger set_meal_plans_updated_at
before update on public.meal_plans
for each row
execute function public.set_updated_at();

alter table public.anonymous_users enable row level security;
alter table public.user_identity_links enable row level security;
alter table public.children enable row level security;
alter table public.ingredients enable row level security;
alter table public.menus enable row level security;
alter table public.meal_inputs enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.ai_generation_logs enable row level security;

drop policy if exists "children_select_own" on public.children;
create policy "children_select_own"
on public.children
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "children_insert_own" on public.children;
create policy "children_insert_own"
on public.children
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "children_update_own" on public.children;
create policy "children_update_own"
on public.children
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "children_delete_own" on public.children;
create policy "children_delete_own"
on public.children
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "ingredients_read_authenticated" on public.ingredients;
create policy "ingredients_read_authenticated"
on public.ingredients
for select
to authenticated
using (true);

drop policy if exists "menus_read_authenticated" on public.menus;
create policy "menus_read_authenticated"
on public.menus
for select
to authenticated
using (true);

drop policy if exists "meal_inputs_select_own" on public.meal_inputs;
create policy "meal_inputs_select_own"
on public.meal_inputs
for select
to authenticated
using (public.is_child_owner(child_id));

drop policy if exists "meal_inputs_insert_own" on public.meal_inputs;
create policy "meal_inputs_insert_own"
on public.meal_inputs
for insert
to authenticated
with check (public.is_child_owner(child_id));

drop policy if exists "meal_inputs_update_own" on public.meal_inputs;
create policy "meal_inputs_update_own"
on public.meal_inputs
for update
to authenticated
using (public.is_child_owner(child_id))
with check (public.is_child_owner(child_id));

drop policy if exists "meal_inputs_delete_own" on public.meal_inputs;
create policy "meal_inputs_delete_own"
on public.meal_inputs
for delete
to authenticated
using (public.is_child_owner(child_id));

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
on public.meal_plans
for select
to authenticated
using (public.is_child_owner(child_id));

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
on public.meal_plans
for insert
to authenticated
with check (
  public.is_child_owner(child_id)
  and (created_by_user_id is null or created_by_user_id = auth.uid())
);

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
on public.meal_plans
for update
to authenticated
using (public.is_child_owner(child_id))
with check (public.is_child_owner(child_id));

drop policy if exists "meal_plans_delete_own" on public.meal_plans;
create policy "meal_plans_delete_own"
on public.meal_plans
for delete
to authenticated
using (public.is_child_owner(child_id));

drop policy if exists "meal_plan_items_select_own" on public.meal_plan_items;
create policy "meal_plan_items_select_own"
on public.meal_plan_items
for select
to authenticated
using (public.is_meal_plan_owner(meal_plan_id));

drop policy if exists "meal_plan_items_insert_own" on public.meal_plan_items;
create policy "meal_plan_items_insert_own"
on public.meal_plan_items
for insert
to authenticated
with check (public.is_meal_plan_owner(meal_plan_id));

drop policy if exists "meal_plan_items_update_own" on public.meal_plan_items;
create policy "meal_plan_items_update_own"
on public.meal_plan_items
for update
to authenticated
using (public.is_meal_plan_owner(meal_plan_id))
with check (public.is_meal_plan_owner(meal_plan_id));

drop policy if exists "meal_plan_items_delete_own" on public.meal_plan_items;
create policy "meal_plan_items_delete_own"
on public.meal_plan_items
for delete
to authenticated
using (public.is_meal_plan_owner(meal_plan_id));

drop policy if exists "ai_generation_logs_select_own" on public.ai_generation_logs;
create policy "ai_generation_logs_select_own"
on public.ai_generation_logs
for select
to authenticated
using (public.is_meal_plan_item_owner(meal_plan_item_id));

drop policy if exists "ai_generation_logs_insert_own" on public.ai_generation_logs;
create policy "ai_generation_logs_insert_own"
on public.ai_generation_logs
for insert
to authenticated
with check (
  meal_plan_item_id is null
  or public.is_meal_plan_item_owner(meal_plan_item_id)
);

drop policy if exists "ai_generation_logs_delete_own" on public.ai_generation_logs;
create policy "ai_generation_logs_delete_own"
on public.ai_generation_logs
for delete
to authenticated
using (
  meal_plan_item_id is null
  or public.is_meal_plan_item_owner(meal_plan_item_id)
);
