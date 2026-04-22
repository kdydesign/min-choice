# 식단 생성 개선 Stage 문서

## 문서 목적

이 문서는 최근 진행한 식단 생성 개선 작업을 **stage 단위로 정리하는 구현 추적 문서**입니다.

역할:

- 어떤 stage가 완료됐는지 기록
- 현재 코드 기준 변경 포인트를 정리
- 저장/조회/히스토리 호환 상태를 명시
- 다음 stage 우선순위를 고정

이 문서는 구현 이력과 현재 상태를 정리하는 문서이며, 최종 규칙은 [../AGENTS.md](../AGENTS.md), 제품 범위는 [./product-spec.md](./product-spec.md), 시스템 구조는 [./architecture.md](./architecture.md)를 우선합니다.

## 현재 진행 상태 요약

현재 기준 식단 생성 개선은 아래 단계까지 진행되었습니다.

- `stage 1`: 타입/계약/저장 초안 정리 완료
- `stage 2`: 메뉴 seed 구조 및 후보 탐색 다양화 완료
- `stage 3`: auto supplement / auto recommend 완료
- `stage 4`: AI 입력/출력 계약 및 검증 강화 완료
- `stage 5`: 시스템 규칙 기반 영양/조리시간 추정 완료
- `stage 6`: 결과 화면 정보 구조 확장 및 가독성 개선 완료
- `stage 7`: 최신 식단 조회 / 히스토리 조회 / 저장 호환 정리 완료

아직 남아 있는 핵심 후속 작업:

- DB migration 실제 적용
- generation metadata 컬럼 round-trip 저장 활성화
- 결과 화면 Figma 미세 보정
- 실서비스 QA 시나리오 점검

---

## Stage 1. 타입 / 계약 / 저장 초안 정리

### 목적

식단 생성 로직을 확장하기 전에 프론트 타입, AI 응답 타입, 저장 payload 초안을 먼저 정리합니다.

### 반영 내용

- `GenerationMode`
- `InputStrength`
- `NutritionEstimate`
- `ScoringMetadata`
- `menuFamily`
- `recipeFull`
- `optionalAddedIngredients`
- `allowAutoSupplement`

### 주요 파일

- [../src/types/domain.ts](../src/types/domain.ts)
- [../src/features/meal-plans/types/generation-contract.ts](../src/features/meal-plans/types/generation-contract.ts)
- [../supabase/migrations/20260413163000_add_generation_metadata_draft.sql](../supabase/migrations/20260413163000_add_generation_metadata_draft.sql)

### 현재 상태

- 코드 타입 반영 완료
- migration 초안 작성 완료
- DB 실제 적용 전이라 일부 필드는 `result_payload_json` 기반으로 호환 유지

---

## Stage 2. 메뉴 seed 구조 및 후보 탐색 다양화

### 목적

죽/스튜/매시로 과도하게 반복되는 추천을 줄이고, 규칙 기반 엔진이 먼저 더 다양한 후보를 만들도록 개선합니다.

### 반영 내용

- `menuFamily` 기반 후보 분류
- 연령 적합성 점수 반영
- `mealType` 적합성 점수 반영
- 재료 활용률 우선 점수화
- 같은 조리 방식 / 같은 주재료 반복 패널티 추가
- `diversityScore`
- `ingredientCoverageScore`
- `lowMissingIngredientScore`

### 주요 파일

- [../src/features/menus/data/menu-catalog.ts](../src/features/menus/data/menu-catalog.ts)
- [../src/features/meal-plans/lib/plan-generator.ts](../src/features/meal-plans/lib/plan-generator.ts)
- [../src/features/meal-plans/lib/plan-generator.test.ts](../src/features/meal-plans/lib/plan-generator.test.ts)

### 현재 상태

- 규칙 기반 후보 탐색 로직 반영 완료
- AI는 여전히 후보 설명만 담당
- seed 다양성은 더 확장 가능

---

## Stage 3. auto supplement / auto recommend

### 목적

입력 재료가 적거나 없을 때도 식단 생성이 끊기지 않도록, 시스템이 제한된 기본 연결 재료를 보완하고 자동 추천 모드를 지원합니다.

### 반영 내용

- 입력 0개:
  - `auto_recommend`
- 입력 1~2개:
  - `ingredient_first + auto supplement`
- 입력 3개 이상:
  - 기존 `ingredient_first`
- 자동 보완 재료는 최대 2~3개
- 알레르기 재료는 입력/보완 후보 모두 제외
- 사용자 입력 재료 / 시스템 보완 재료 / 제외된 알레르기 재료를 구분 관리

### 주요 파일

- [../src/features/meal-plans/lib/auto-supplement.ts](../src/features/meal-plans/lib/auto-supplement.ts)
- [../src/features/meal-plans/lib/plan-generator.ts](../src/features/meal-plans/lib/plan-generator.ts)
- [../src/features/meal-plans/components/meal-result-detail-section.tsx](../src/features/meal-plans/components/meal-result-detail-section.tsx)

### 현재 상태

- 보완 재료 계산 완료
- 결과 상세 UI 표시 완료
- 플랜 top-level에는 `generationMode`, 끼니 결과에는 `optionalAddedIngredients`로 반영

---

## Stage 4. AI 입력 / 출력 / 검증 강화

### 목적

AI가 끼니별 메뉴 선택까지 담당하되, 최근 이력 / 허용 재료 / 안전성 검증을 통과한 결과만 저장되도록 하이브리드 구조를 확정합니다.

### 반영 내용

- AI 입력 구조화
  - `child.ageMonths`
  - `allergies`
  - `mealType`
  - `generationMode`
  - `normalizedInputIngredients`
  - `allowedSupplements`
  - `knownIngredients`
  - `recentHistory`
  - `currentRequestSelections`
  - `candidateMenus`
  - `rulesFallback`
- AI 출력 구조 확장
  - `selectedMenu`
  - `cookingStyle`
  - `mainProtein`
  - `usedIngredients`
  - `optionalAddedIngredients`
  - `missingIngredients`
  - `recipeSummary`
  - `recipeFull`
  - `textureGuide`
  - `calories`
  - `protein`
  - `cookTimeMinutes`
- 검증 강화
  - valid JSON
  - recent history exact menu 중복 차단
  - 1차 menu family 중복 차단
  - allergy exclusion
  - 위험 표현 차단
  - ingredient whitelist 검사
  - `recipeFull` 단계 수 검사
  - optional added ingredients 허용 범위 검사
  - 2차 재시도 후 fallback

### 주요 파일

- [../supabase/functions/generate-meal-plan/index.ts](../supabase/functions/generate-meal-plan/index.ts)
- [../src/features/meal-plans/lib/ai-menu-selection.ts](../src/features/meal-plans/lib/ai-menu-selection.ts)
- [../src/features/meal-plans/lib/ai-response-guard.ts](../src/features/meal-plans/lib/ai-response-guard.ts)
- [../src/features/meal-plans/lib/meal-narrative.ts](../src/features/meal-plans/lib/meal-narrative.ts)
- [../src/features/meal-plans/api/generate-meal-plan-service.ts](../src/features/meal-plans/api/generate-meal-plan-service.ts)

### 현재 상태

- AI가 메뉴를 고르고, 규칙 엔진은 fallback과 참고 후보를 유지
- 끼니별 최대 2회 재시도
- fallback 경로 유지

---

## Stage 5. 시스템 규칙 기반 영양 / 조리시간 추정

### 목적

칼로리, 단백질, 조리시간은 AI가 임의 생성하지 않고, 메뉴 패밀리 + 연령 + 재료 카테고리 기반 추정 엔진으로 계산합니다.

### 반영 내용

- 재료 영양 참조 데이터 추가
- `ageMonths`별 portion template
- `menuFamily`별 weight distribution
- `caloriesKcal`, `proteinG`, `estimatedCookTimeMin`
- `confidence`
- `basisNote`
- 반올림 규칙
  - kcal 정수
  - protein 소수 1자리
  - cook time 5분 단위

### 주요 파일

- [../src/features/ingredients/data/ingredient-nutrition-reference.ts](../src/features/ingredients/data/ingredient-nutrition-reference.ts)
- [../src/features/meal-plans/lib/nutrition-estimate.ts](../src/features/meal-plans/lib/nutrition-estimate.ts)
- [../src/features/meal-plans/lib/nutrition-estimate.test.ts](../src/features/meal-plans/lib/nutrition-estimate.test.ts)

### 현재 상태

- 결과 카드와 상세 UI는 검증된 영양값을 사용
- AI가 영양/시간을 제안하더라도 허용 오차를 넘으면 시스템 추정으로 저장
- 과거 저장 데이터는 fallback 추정으로 복원

---

## Stage 6. 결과 화면 정보 구조 확장

### 목적

오늘의 식단 결과와 히스토리 상세 화면이 같은 공통 결과 UI를 재사용하면서도, 더 많은 정보를 자연스럽게 보여주도록 확장합니다.

### 반영 내용

- 끼니 카드 공통 구조 유지
- 표시 정보 확장
  - 메뉴명
  - 추천 문구
  - 사용 재료
  - 부족한 재료
  - 대체 재료
  - 자동 보완 재료
  - 칼로리(약)
  - 단백질(약)
  - 조리 시간(약)
  - `recipeSummary`
  - `recipeFull`
  - fallback badge
  - warning / notice
- 상세보기는 기본 접힘 상태 유지

### 주요 파일

- [../src/features/meal-plans/components/today-meal-result-screen.tsx](../src/features/meal-plans/components/today-meal-result-screen.tsx)
- [../src/features/meal-plans/components/meal-result-card.tsx](../src/features/meal-plans/components/meal-result-card.tsx)
- [../src/features/meal-plans/components/meal-result-detail-section.tsx](../src/features/meal-plans/components/meal-result-detail-section.tsx)
- [../src/styles/global.css](../src/styles/global.css)

### 현재 상태

- 오늘 결과와 히스토리 상세가 같은 UI를 재사용
- nutrition / summary / detail / fallback / warning 노출 완료
- Figma 미세 보정은 추가 여지 있음

---

## Stage 7. 최신 식단 조회 / 히스토리 저장 / 조회 호환 정리

### 목적

새 결과 필드가 저장, 최신 조회, 히스토리 조회, 상세 재조회 흐름에서 일관되게 유지되도록 마무리합니다.

### 반영 내용

- `recipe_full_json` 실제 저장/복원 사용
- `result_payload_json` 기반 backward-compatible 복원 유지
- migration 전이라 아래 필드는 payload 우선 + 컬럼 fallback 구조 유지
  - `menuFamily`
  - `optionalAddedIngredients`
  - `nutritionEstimate`
  - `scoringMetadata`
  - `inputStrength`
- `generationMode`, `allowAutoSupplement`는 컬럼이 없으면 결과 기반 추론
- 로컬 bootstrap 이관도 같은 persistence helper를 사용하도록 통일

### 주요 파일

- [../src/features/meal-plans/api/meal-plan-repository.ts](../src/features/meal-plans/api/meal-plan-repository.ts)
- [../src/features/meal-plans/lib/meal-plan-persistence.ts](../src/features/meal-plans/lib/meal-plan-persistence.ts)
- [../src/features/auth/api/supabase-bootstrap-service.ts](../src/features/auth/api/supabase-bootstrap-service.ts)
- [../supabase/migrations/20260413163000_add_generation_metadata_draft.sql](../supabase/migrations/20260413163000_add_generation_metadata_draft.sql)

### 현재 상태

- 최신 식단 조회와 히스토리 조회는 새 필드를 최대한 복원
- migration 미적용 상태에서도 동작
- 실제 DB round-trip 컬럼 저장은 migration apply 이후 정식 연결 필요

---

## 현재 남은 TODO

### 1. DB migration 실제 적용

필요 컬럼:

- `meal_plans.generation_mode`
- `meal_plans.allow_auto_supplement`
- `meal_plan_items.menu_family`
- `meal_plan_items.optional_added_ingredients_json`
- `meal_plan_items.nutrition_estimate_json`
- `meal_plan_items.scoring_metadata_json`
- `meal_plan_items.input_strength`

### 2. 저장 경로 컬럼 persist 활성화

현재는 payload 저장 + TODO 주석 상태입니다.

대상:

- [../src/features/meal-plans/lib/meal-plan-persistence.ts](../src/features/meal-plans/lib/meal-plan-persistence.ts)
- [../src/features/meal-plans/api/meal-plan-repository.ts](../src/features/meal-plans/api/meal-plan-repository.ts)
- [../src/features/auth/api/supabase-bootstrap-service.ts](../src/features/auth/api/supabase-bootstrap-service.ts)

### 3. Figma 미세 보정

- 입력 화면 spacing
- 결과 카드 hierarchy
- nutrition row 시각 밀도
- recipe summary / full recipe 위계

### 4. 실서비스 QA

필수 시나리오:

- 입력 재료 0개
- 입력 재료 1개
- 입력 재료 2개
- 입력 재료 3개 이상
- 알레르기 입력 포함
- fallback 발생
- 저장 후 히스토리 상세 재조회

---

## QA 체크리스트

### 생성

- `ingredient_first`가 정상 동작하는가
- `auto_recommend`가 정상 동작하는가
- `auto supplement`가 최대 2~3개 이내로 제한되는가
- 알레르기 재료가 입력/결과/대체재/조리법 어디에도 포함되지 않는가

### UI

- 카드가 모바일에서 깨지지 않는가
- `recipeSummary` 3줄이 항상 노출되는가
- `recipeFull`이 상세보기에서 보이는가
- warning / fallback / 자동 보완 표시가 동시에 들어와도 hierarchy가 유지되는가

### 저장/조회

- 오늘 식단 저장 후 최신 조회가 정상인가
- 히스토리 리스트가 정상인가
- 히스토리 상세가 정상인가
- 과거 저장 데이터도 깨지지 않고 로드되는가

---

## 다음 stage 추천

### stage 8. DB round-trip 정식 반영

- migration 실제 적용
- generation metadata 컬럼 직접 persist
- repository 우선순위를 컬럼 > payload backup으로 정리

### stage 9. 결과/입력 화면 Figma 정밀 보정

- spacing
- typography
- card hierarchy
- mobile viewport
- warning / summary / nutrition row 시각 정리

### stage 10. 운영 QA / 로그 기반 조정

- 추천 다양성 로그 점검
- auto supplement 허용 재료셋 조정
- fallback 발생 비율 점검
- 월령별 부적절 표현 회귀 테스트
