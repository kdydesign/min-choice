create table if not exists public.product_search_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  anonymous_user_id uuid,
  child_id uuid references public.children(id) on delete set null,
  source text not null default 'manual',
  meal_plan_id uuid references public.meal_plans(id) on delete set null,
  meal_plan_item_id uuid references public.meal_plan_items(id) on delete set null,
  meal_type text,
  origin_menu_name text,
  raw_query text not null,
  normalized_query text not null,
  category text not null default 'all',
  use_child_context boolean not null default false,
  child_age_months integer,
  child_allergies_snapshot_json jsonb not null default '[]'::jsonb,
  provider text not null default 'naver',
  cache_key text not null,
  created_at timestamptz not null default now(),
  check (source in ('manual', 'child_suggestion', 'meal_result')),
  check (category in ('all', 'baby_food', 'toddler_food', 'baby_side_dish', 'snack')),
  check (meal_type is null or meal_type in ('breakfast', 'lunch', 'dinner'))
);

create table if not exists public.product_search_results (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.product_search_queries(id) on delete cascade,
  provider text not null,
  provider_product_id text,
  title text not null,
  normalized_title text,
  image_url text,
  product_url text not null,
  mall_name text,
  price integer not null,
  high_price integer,
  brand text,
  maker text,
  category1 text,
  category2 text,
  category3 text,
  category4 text,
  product_type text,
  relevance_score numeric not null default 0,
  price_rank integer,
  allergy_keyword_matches_json jsonb not null default '[]'::jsonb,
  warning_badges_json jsonb not null default '[]'::jsonb,
  is_hidden_by_allergy_filter boolean not null default false,
  fetched_at timestamptz not null default now(),
  raw_json jsonb not null default '{}'::jsonb
);

create table if not exists public.product_click_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  anonymous_user_id uuid,
  child_id uuid references public.children(id) on delete set null,
  product_result_id uuid references public.product_search_results(id) on delete set null,
  source text not null default 'manual',
  meal_plan_id uuid references public.meal_plans(id) on delete set null,
  meal_plan_item_id uuid references public.meal_plan_items(id) on delete set null,
  provider text not null,
  outbound_url text not null,
  clicked_at timestamptz not null default now(),
  check (source in ('manual', 'child_suggestion', 'meal_result'))
);

create table if not exists public.product_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_product_id text,
  normalized_title text not null,
  price integer not null,
  mall_name text,
  product_url text not null,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_product_search_queries_child_created
on public.product_search_queries(child_id, created_at desc);

create index if not exists idx_product_search_queries_cache_created
on public.product_search_queries(cache_key, created_at desc);

create index if not exists idx_product_search_queries_source_created
on public.product_search_queries(source, created_at desc);

create index if not exists idx_product_search_results_query_id
on public.product_search_results(query_id);

create index if not exists idx_product_search_results_provider_product
on public.product_search_results(provider, provider_product_id);

create index if not exists idx_product_click_logs_child_clicked
on public.product_click_logs(child_id, clicked_at desc);

create index if not exists idx_product_price_snapshots_provider_product_fetched
on public.product_price_snapshots(provider, provider_product_id, fetched_at desc);

create or replace function public.is_product_search_query_owner(target_query_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.product_search_queries product_search_queries
    left join public.children children on children.id = product_search_queries.child_id
    where product_search_queries.id = target_query_id
      and (
        product_search_queries.user_id = auth.uid()
        or children.owner_user_id = auth.uid()
      )
  );
$$;

create or replace function public.is_product_search_result_owner(target_result_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.product_search_results product_search_results
    join public.product_search_queries product_search_queries
      on product_search_queries.id = product_search_results.query_id
    left join public.children children on children.id = product_search_queries.child_id
    where product_search_results.id = target_result_id
      and (
        product_search_queries.user_id = auth.uid()
        or children.owner_user_id = auth.uid()
      )
  );
$$;

alter table public.product_search_queries enable row level security;
alter table public.product_search_results enable row level security;
alter table public.product_click_logs enable row level security;
alter table public.product_price_snapshots enable row level security;

drop policy if exists "product_search_queries_select_own" on public.product_search_queries;
create policy "product_search_queries_select_own"
on public.product_search_queries
for select
to authenticated
using (
  user_id = auth.uid()
  or (child_id is not null and public.is_child_owner(child_id))
);

drop policy if exists "product_search_queries_insert_own" on public.product_search_queries;
create policy "product_search_queries_insert_own"
on public.product_search_queries
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (child_id is null or public.is_child_owner(child_id))
);

drop policy if exists "product_search_results_select_own" on public.product_search_results;
create policy "product_search_results_select_own"
on public.product_search_results
for select
to authenticated
using (public.is_product_search_query_owner(query_id));

drop policy if exists "product_click_logs_select_own" on public.product_click_logs;
create policy "product_click_logs_select_own"
on public.product_click_logs
for select
to authenticated
using (
  user_id = auth.uid()
  or (child_id is not null and public.is_child_owner(child_id))
);

drop policy if exists "product_click_logs_insert_own" on public.product_click_logs;
create policy "product_click_logs_insert_own"
on public.product_click_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (child_id is null or public.is_child_owner(child_id))
  and (
    product_result_id is null
    or public.is_product_search_result_owner(product_result_id)
  )
);

drop policy if exists "product_price_snapshots_select_authenticated" on public.product_price_snapshots;
create policy "product_price_snapshots_select_authenticated"
on public.product_price_snapshots
for select
to authenticated
using (true);

-- Insert/update paths for product_search_results and product_price_snapshots are intentionally
-- limited to Supabase service role via Edge Functions. Do not add public write policies.
