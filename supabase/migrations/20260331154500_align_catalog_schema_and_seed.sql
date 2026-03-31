alter table public.menus
add column if not exists source_key text,
add column if not exists pantry_ingredient_keys_json jsonb not null default '[]'::jsonb,
add column if not exists hidden_ingredient_keys_json jsonb not null default '[]'::jsonb,
add column if not exists default_missing_ingredient_keys_json jsonb not null default '[]'::jsonb,
add column if not exists cooking_style text,
add column if not exists main_protein_key text,
add column if not exists description text,
add column if not exists texture_note text;

create unique index if not exists idx_menus_source_key on public.menus(source_key);

insert into public.ingredients (
  standard_key,
  display_name,
  aliases_json,
  category,
  is_allergen
)
values
  ('감자', '감자', '[]'::jsonb, 'vegetable', false),
  ('고구마', '고구마', '[]'::jsonb, 'vegetable', false),
  ('단호박', '단호박', '[]'::jsonb, 'vegetable', false),
  ('달걀', '달걀', '["계란"]'::jsonb, 'protein', true),
  ('닭고기', '닭고기', '["닭가슴살","닭"]'::jsonb, 'protein', false),
  ('당근', '당근', '[]'::jsonb, 'vegetable', false),
  ('두부', '두부', '[]'::jsonb, 'protein', true),
  ('물', '물', '[]'::jsonb, 'liquid', false),
  ('밥', '밥', '[]'::jsonb, 'grain', false),
  ('브로콜리', '브로콜리', '["브로콜리꽃"]'::jsonb, 'vegetable', false),
  ('소고기', '소고기', '["쇠고기"]'::jsonb, 'protein', false),
  ('시금치', '시금치', '[]'::jsonb, 'vegetable', false),
  ('쌀', '쌀', '["흰쌀","이유식용쌀"]'::jsonb, 'grain', false),
  ('애호박', '애호박', '["호박","쥬키니"]'::jsonb, 'vegetable', false),
  ('양배추', '양배추', '[]'::jsonb, 'vegetable', false),
  ('오트밀', '오트밀', '[]'::jsonb, 'grain', false),
  ('올리브유', '올리브유', '[]'::jsonb, 'seasoning', false),
  ('우유', '우유', '[]'::jsonb, 'liquid', true),
  ('육수', '육수', '[]'::jsonb, 'liquid', false),
  ('죽밥', '죽밥', '["죽"]'::jsonb, 'grain', false),
  ('참기름', '참기름', '[]'::jsonb, 'seasoning', false)
on conflict (standard_key) do update
set
  display_name = excluded.display_name,
  aliases_json = excluded.aliases_json,
  category = excluded.category,
  is_allergen = excluded.is_allergen,
  updated_at = now();

insert into public.menus (
  source_key,
  name,
  meal_types_json,
  required_ingredient_keys_json,
  optional_ingredient_keys_json,
  pantry_ingredient_keys_json,
  hidden_ingredient_keys_json,
  default_missing_ingredient_keys_json,
  substitute_map_json,
  cooking_style,
  main_protein_key,
  description,
  texture,
  texture_note,
  caution_template,
  recipe_template_json,
  age_min_months,
  is_active
)
values
  ('beef-zucchini-porridge', '소고기 애호박 죽', '["breakfast","dinner"]'::jsonb, '["소고기","애호박"]'::jsonb, '[]'::jsonb, '["쌀"]'::jsonb, '["물"]'::jsonb, '["쌀"]'::jsonb, '{"쌀":["밥","오트밀"]}'::jsonb, '죽', '소고기', '부드럽게 끓여 아침이나 저녁에 부담 없이 먹일 수 있는 메뉴', '알갱이를 충분히 익혀 한 번 더 으깨 주면 더 편하게 먹을 수 있어요.', '알갱이를 충분히 익혀 한 번 더 으깨 주면 더 편하게 먹을 수 있어요.', '소고기는 핏물을 제거하고 잘게 다져 사용해 주세요.', '["소고기와 애호박을 아주 잘게 다집니다.","쌀이나 대체 재료를 넣고 충분히 퍼질 때까지 끓입니다.","질감을 확인하고 필요하면 한 번 더 으깨 마무리합니다."]'::jsonb, 12, true),
  ('cabbage-tofu-fried-rice', '양배추 두부 볶음밥', '["lunch"]'::jsonb, '["양배추","두부","당근"]'::jsonb, '[]'::jsonb, '["밥"]'::jsonb, '["참기름"]'::jsonb, '["밥"]'::jsonb, '{"밥":["죽밥","오트밀"]}'::jsonb, '볶음밥', '두부', '양배추와 두부를 부드럽게 볶아 점심 한 그릇으로 좋은 메뉴', '볶기 전에 물을 조금 넣으면 훨씬 촉촉하게 만들 수 있어요.', '볶기 전에 물을 조금 넣으면 훨씬 촉촉하게 만들 수 있어요.', '두부는 수분을 살짝 빼고 으깨서 넣으면 식감이 더 부드러워져요.', '["양배추와 당근을 잘게 다집니다.","두부를 으깨고 밥과 함께 약한 불에서 촉촉하게 볶습니다.","아이가 먹기 좋도록 마지막에 한 번 더 잘게 섞어 마무리합니다."]'::jsonb, 12, true),
  ('beef-potato-broccoli-rice', '소고기 감자 브로콜리 무른밥', '["lunch","dinner"]'::jsonb, '["소고기","감자","브로콜리"]'::jsonb, '[]'::jsonb, '["밥"]'::jsonb, '["육수"]'::jsonb, '["밥"]'::jsonb, '{"밥":["죽밥","오트밀"]}'::jsonb, '무른밥', '소고기', '소고기와 채소를 함께 익혀 든든하게 먹일 수 있는 저녁 메뉴', '브로콜리는 꽃 부분을 잘게 다져야 목 넘김이 부드러워져요.', '브로콜리는 꽃 부분을 잘게 다져야 목 넘김이 부드러워져요.', '감자는 푹 익혀 포슬하게 으깨 주세요.', '["소고기, 감자, 브로콜리를 먹기 좋게 작게 준비합니다.","밥과 함께 냄비에 넣고 물이나 육수를 더해 무르게 끓입니다.","전체 질감이 고르게 퍼지면 한 번 섞어 완성합니다."]'::jsonb, 12, true),
  ('chicken-sweetpotato-porridge', '닭고기 고구마 죽', '["breakfast","dinner"]'::jsonb, '["닭고기","고구마"]'::jsonb, '[]'::jsonb, '["쌀"]'::jsonb, '["물"]'::jsonb, '["쌀"]'::jsonb, '{"쌀":["밥","오트밀"]}'::jsonb, '죽', '닭고기', '달큰한 고구마와 닭고기로 아침에 편하게 시작할 수 있는 죽 메뉴', '고구마는 섬유질이 남지 않도록 곱게 으깨 주세요.', '고구마는 섬유질이 남지 않도록 곱게 으깨 주세요.', '닭고기는 지방이 적은 부위를 사용하고 완전히 익혀 주세요.', '["닭고기를 삶아 잘게 찢고 고구마는 푹 익혀 으깹니다.","쌀 또는 대체 재료와 함께 냄비에 넣고 부드럽게 끓입니다.","한 번 더 저어 걸쭉한 질감을 맞춘 뒤 식혀 제공합니다."]'::jsonb, 12, true),
  ('zucchini-potato-porridge', '애호박 감자 죽', '["breakfast","lunch"]'::jsonb, '["애호박","감자"]'::jsonb, '[]'::jsonb, '["쌀"]'::jsonb, '["물"]'::jsonb, '["쌀"]'::jsonb, '{"쌀":["밥","오트밀"]}'::jsonb, '죽', '채소', '채소 위주로 부드럽게 만들 수 있어 가볍게 먹이기 좋은 메뉴', '감자를 충분히 익혀 전분감이 자연스럽게 풀리게 해 주세요.', '감자를 충분히 익혀 전분감이 자연스럽게 풀리게 해 주세요.', '채소 껍질은 최대한 얇게 제거해 주세요.', '["애호박과 감자를 잘게 썰어 푹 익힙니다.","쌀이나 대체 재료를 넣고 충분히 저어가며 끓입니다.","질감이 남으면 으깨서 부드럽게 마무리합니다."]'::jsonb, 12, true),
  ('broccoli-tofu-rice', '브로콜리 두부 덮밥', '["lunch","dinner"]'::jsonb, '["브로콜리","두부"]'::jsonb, '["당근"]'::jsonb, '["밥"]'::jsonb, '["참기름"]'::jsonb, '["밥"]'::jsonb, '{"밥":["죽밥","오트밀"]}'::jsonb, '덮밥', '두부', '두부와 브로콜리를 촉촉하게 올려 균형 있게 먹이기 좋은 메뉴', '브로콜리는 너무 크게 남지 않도록 잘게 썰어 주세요.', '브로콜리는 너무 크게 남지 않도록 잘게 썰어 주세요.', '두부는 한 번 데쳐 사용하면 더 부드럽게 먹일 수 있어요.', '["브로콜리와 당근을 충분히 익혀 잘게 자릅니다.","두부를 으깨고 채소와 함께 살짝 끓여 소스를 만듭니다.","밥 위에 올려 촉촉하게 섞어 제공합니다."]'::jsonb, 12, true),
  ('pumpkin-chicken-stew', '닭고기 단호박 스튜', '["lunch","dinner"]'::jsonb, '["닭고기","단호박"]'::jsonb, '["감자","양배추"]'::jsonb, '[]'::jsonb, '["육수"]'::jsonb, '["감자"]'::jsonb, '{"감자":["고구마","단호박"]}'::jsonb, '스튜', '닭고기', '부드러운 단호박으로 농도를 내 저녁에 든든하게 먹일 수 있는 메뉴', '국물은 너무 묽지 않게 졸여 숟가락으로 먹기 좋게 해 주세요.', '국물은 너무 묽지 않게 졸여 숟가락으로 먹기 좋게 해 주세요.', '닭고기는 잘게 찢고 단호박 껍질은 제거해 주세요.', '["닭고기와 단호박, 감자를 푹 익힙니다.","재료를 고르게 섞어가며 걸쭉하게 졸입니다.","한입 크기로 정리한 뒤 미지근하게 식혀 제공합니다."]'::jsonb, 12, true),
  ('spinach-potato-egg-scramble', '시금치 감자 달걀 스크램블', '["breakfast","lunch"]'::jsonb, '["시금치","감자","달걀"]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["올리브유"]'::jsonb, '[]'::jsonb, '{}'::jsonb, '스크램블', '달걀', '포슬한 감자와 달걀을 곁들여 아침에 빠르게 준비하기 좋은 메뉴', '달걀은 완전히 익힌 뒤 부드럽게 으깨 주세요.', '달걀은 완전히 익힌 뒤 부드럽게 으깨 주세요.', '달걀 알레르기가 있는 경우 추천에서 제외됩니다.', '["감자와 시금치를 충분히 익혀 잘게 자릅니다.","풀어둔 달걀과 함께 약한 불에서 천천히 익힙니다.","전체 재료를 부드럽게 섞어 수분감을 맞춥니다."]'::jsonb, 12, true),
  ('beef-cabbage-rice', '소고기 양배추 덮밥', '["lunch","dinner"]'::jsonb, '["소고기","양배추"]'::jsonb, '["당근"]'::jsonb, '["밥"]'::jsonb, '["육수"]'::jsonb, '["밥"]'::jsonb, '{"밥":["죽밥","오트밀"]}'::jsonb, '덮밥', '소고기', '소고기와 양배추를 함께 조리해 점심이나 저녁에 활용하기 좋은 메뉴', '양배추는 숨이 푹 죽도록 익혀야 먹기 편해요.', '양배추는 숨이 푹 죽도록 익혀야 먹기 편해요.', '소고기는 질기지 않게 잘게 다져 넣어 주세요.', '["소고기와 양배추를 작게 준비합니다.","당근이 있으면 함께 넣고 부드럽게 익힙니다.","밥 위에 올리거나 함께 끓여 촉촉하게 마무리합니다."]'::jsonb, 12, true),
  ('tofu-zucchini-risotto', '두부 애호박 리조또', '["breakfast","lunch","dinner"]'::jsonb, '["두부","애호박"]'::jsonb, '[]'::jsonb, '["밥","쌀"]'::jsonb, '["육수"]'::jsonb, '["밥"]'::jsonb, '{"밥":["쌀","오트밀"]}'::jsonb, '리조또', '두부', '두부와 애호박을 섞어 부드러운 한 그릇으로 먹이기 좋은 메뉴', '물을 조금 더 넣어 묽게 만들면 씹기 부담이 줄어요.', '물을 조금 더 넣어 묽게 만들면 씹기 부담이 줄어요.', '두부 알레르기가 있으면 다른 단백질로 바꿔 주세요.', '["두부와 애호박을 잘게 썰거나 으깹니다.","밥이나 쌀과 함께 묽은 질감이 될 때까지 끓입니다.","전체 재료가 부드럽게 섞이면 식혀 제공합니다."]'::jsonb, 12, true),
  ('sweetpotato-broccoli-mash', '고구마 브로콜리 매시', '["breakfast","lunch"]'::jsonb, '["고구마","브로콜리"]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["우유"]'::jsonb, '[]'::jsonb, '{}'::jsonb, '매시', '채소', '달큰한 고구마로 맛을 내 가볍게 곁들이기 좋은 채소 메뉴', '브로콜리는 줄기보다 꽃 부분 위주로 넣으면 더 부드러워요.', '브로콜리는 줄기보다 꽃 부분 위주로 넣으면 더 부드러워요.', '수분이 부족하면 따뜻한 물로 농도를 조절해 주세요.', '["고구마를 푹 찌고 브로콜리를 익혀 잘게 다집니다.","둘을 함께 으깨며 부드러운 질감을 만듭니다.","필요하면 물을 넣어 묽기를 조절합니다."]'::jsonb, 12, true),
  ('chicken-carrot-risotto', '닭고기 당근 리조또', '["lunch","dinner"]'::jsonb, '["닭고기","당근"]'::jsonb, '["양배추"]'::jsonb, '["밥"]'::jsonb, '["육수"]'::jsonb, '["밥"]'::jsonb, '{"밥":["쌀","오트밀"]}'::jsonb, '리조또', '닭고기', '당근과 닭고기로 색감과 단백질을 함께 챙길 수 있는 메뉴', '당근은 충분히 익혀 단맛이 올라오게 해 주세요.', '당근은 충분히 익혀 단맛이 올라오게 해 주세요.', '닭고기는 잘게 찢어 목 넘김을 확인해 주세요.', '["닭고기와 당근을 잘게 준비합니다.","밥이나 쌀과 함께 넣고 묽게 끓입니다.","촉촉한 리조또 질감이 되면 식혀 제공합니다."]'::jsonb, 12, true)
on conflict (source_key) do update
set
  name = excluded.name,
  meal_types_json = excluded.meal_types_json,
  required_ingredient_keys_json = excluded.required_ingredient_keys_json,
  optional_ingredient_keys_json = excluded.optional_ingredient_keys_json,
  pantry_ingredient_keys_json = excluded.pantry_ingredient_keys_json,
  hidden_ingredient_keys_json = excluded.hidden_ingredient_keys_json,
  default_missing_ingredient_keys_json = excluded.default_missing_ingredient_keys_json,
  substitute_map_json = excluded.substitute_map_json,
  cooking_style = excluded.cooking_style,
  main_protein_key = excluded.main_protein_key,
  description = excluded.description,
  texture = excluded.texture,
  texture_note = excluded.texture_note,
  caution_template = excluded.caution_template,
  recipe_template_json = excluded.recipe_template_json,
  age_min_months = excluded.age_min_months,
  is_active = excluded.is_active,
  updated_at = now();
