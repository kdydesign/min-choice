# 기성제품 최저가 찾기 MVP 설계

## 1. 문서 목적

이 문서는 베베 초이스에 추가할 **기성 이유식 / 유아식 / 아기반찬 최저가 찾기 1차 MVP**의 제품, UX, 아키텍처, API, DB 설계 초안을 정의합니다.

이 문서는 설계와 구현 추적 문서입니다. 2026-04-28 기준 1차 MVP 코드, Edge Function, DB migration 초안이 반영되었습니다.

관련 문서:

- 제품 범위: [./product-spec.md](./product-spec.md)
- UX 기준: [./ux-spec.md](./ux-spec.md)
- 시스템 구조: [./architecture.md](./architecture.md)
- Figma 구현 기준: [./figma-codex-implementation-guide.md](./figma-codex-implementation-guide.md)
- 운영 기준: [./deployment/vercel-hosting.md](./deployment/vercel-hosting.md)

## 2. 기능 한줄 정의

선택된 아이 정보와 식단 결과를 바탕으로 기성 이유식 / 유아식 / 아기반찬 검색어를 추천하고, 네이버 쇼핑 검색 API 결과를 베베 초이스 도메인에 맞게 정규화 / 필터링 / 랭킹 / 캐시해 가격 확인 흐름으로 연결합니다.

이 기능은 제품 안전성, 전성분, 알레르기, 월령 적합성을 자동으로 보장하지 않습니다.

## 3. 1차 MVP 범위

### 포함 범위

- 네이버 쇼핑 검색 API를 1차 데이터 소스로 사용
- 독립 검색 화면에서 검색어 입력
- 선택된 아이 정보를 기준으로 추천 검색어 칩 제공
- 등록된 알레르기 키워드가 상품명에 포함된 경우 1차 필터 제공
- 오늘 식단 결과 카드에서 비슷한 기성 이유식 검색으로 연결
- 상품명, 이미지, 쇼핑몰명, 가격, 외부 상품 링크 표시
- `가격 확인하기` 버튼으로 네이버 쇼핑 또는 외부 판매처 상품 페이지 이동
- 검색 결과 정규화 / 필터링 / 랭킹 / 캐시
- 검색 요청, 검색 결과, 클릭 로그, 가격 스냅샷 저장 설계
- 가격 / 성분 / 알레르기 / 월령 적합성 고지 표시

### 제외 범위

- 앱 내 주문
- 앱 내 결제
- 배송 처리
- CS 처리
- 장바구니
- 배송비 포함 실질 최저가 계산
- 쿠폰 / 카드 할인 반영
- 전성분 자동 분석
- 월령 적합성 보장
- 품절 여부 실시간 보장
- 네이버 외 쿠팡 / 카카오 / 제휴 API 연동
- 가격 알림
- 장보기 리스트

## 4. 사용자 가치

- 보호자는 직접 만든 식단과 비슷한 기성제품을 빠르게 탐색할 수 있습니다.
- 선택된 아이의 알레르기 키워드를 검색 UX에 반영해 상품명 기준 1차 필터를 사용할 수 있습니다.
- 앱 안에서 결제하지 않고 외부 판매처에서 가격과 상세 정보를 최종 확인할 수 있습니다.
- 베베 초이스는 네이버 API 결과를 그대로 노출하지 않고, 이유식 / 유아식 / 아기반찬 맥락에 맞는 결과를 우선 보여줍니다.

## 5. 핵심 사용자 흐름

### 독립 검색 흐름

1. 사용자가 `기성제품 찾기` 화면에 진입합니다.
2. 검색창에 직접 검색어를 입력합니다.
3. 카테고리, 네이버페이, 알레르기 키워드 제외 필터를 선택합니다.
4. React 클라이언트가 Supabase Edge Function `search-products`를 호출합니다.
5. 서버가 네이버 쇼핑 API 결과를 정규화 / 필터링 / 랭킹 / 캐시합니다.
6. 사용자는 상품 카드에서 가격과 고지를 확인합니다.
7. `가격 확인하기` 버튼을 눌러 외부 상품 페이지로 이동합니다.

### 아이 정보 기반 추천 검색 흐름

1. 사용자가 선택된 아이가 있는 상태로 `기성제품 찾기` 화면에 진입합니다.
2. 화면 상단에 선택된 아이 정보 카드가 표시됩니다.
3. 아이 이름, 개월 수, 알레르기 정보를 바탕으로 추천 검색어 칩을 표시합니다.
4. 사용자가 추천 검색어 칩을 누르면 `source=child_suggestion`으로 검색합니다.
5. 등록된 알레르기 키워드는 상품명 기준 1차 필터에만 사용합니다.

예시:

- 선택된 아이: 서아, 13개월, 알레르기: 달걀, 우유
- 추천 검색어:
  - 소고기 이유식
  - 고구마 퓨레
  - 아기반찬
  - 유아식 간식

### 오늘 식단 결과에서 기성제품 검색 연결 흐름

1. 사용자가 오늘 식단 결과 화면에서 끼니 카드를 확인합니다.
2. 끼니 카드 하단에 `비슷한 기성 이유식 최저가 보기` 보조 CTA를 표시합니다.
3. 사용자가 CTA를 누르면 메뉴명과 사용 재료로 검색어를 생성합니다.
4. `source=meal_result`와 meal context를 포함해 검색 화면으로 이동하거나 즉시 검색합니다.
5. 상품 결과 화면은 가격 / 성분 / 알레르기 / 월령 적합성 고지를 함께 표시합니다.

예시:

- 오늘 점심: 소고기 애호박 무른밥
- CTA: 비슷한 기성 이유식 최저가 보기
- 생성 검색어: 소고기 애호박 이유식
- category: `baby_food`
- source: `meal_result`

## 6. UX 설계

### ShoppingPage 화면 구성

- 상단 헤더
- 선택된 아이 정보 카드
- 추천 검색어 칩
- 검색창
- 카테고리 필터
- 네이버페이 필터
- 알레르기 키워드 제외 필터
- 가격 / 성분 / 알레르기 고지
- 상품 결과 리스트
- 로딩 / 빈 상태 / 오류 상태

### 선택된 아이 정보 카드

- 아이 이름, 개월 수, 등록된 알레르기 키워드를 보여줍니다.
- 아이 정보는 검색어 추천과 상품명 기준 알레르기 키워드 1차 필터에만 사용한다고 안내합니다.
- 숫자 월령은 추천 검색어에 자동 삽입하지 않습니다.

### 추천 검색어 칩

- 선택된 아이 정보와 일반 이유식 카테고리를 바탕으로 생성합니다.
- 추천 검색어는 사용자가 직접 선택해야 검색됩니다.
- 추천 검색어는 안전성 보장 표현을 사용하지 않습니다.

### 검색창

- 사용자가 입력한 query를 최우선으로 사용합니다.
- query가 비어 있으면 추천 검색어 선택 또는 식단 결과 CTA에서 넘어온 검색어를 사용합니다.
- 검색 중에는 중복 제출을 막습니다.

### 카테고리 필터

1차 MVP 카테고리:

- `baby_food`: 이유식 / 무른밥 / 죽
- `baby_side_dish`: 아기반찬 / 아이반찬
- `snack`: 퓨레 / 간식 / 과일 계열
- `all`: 전체

### 네이버페이 필터

- 사용자가 켜면 네이버 쇼핑 API 요청에 `filter=naverpay`를 사용합니다.
- 기본값은 `false`입니다.
- 네이버페이 필터는 결제 기능이 아니라 검색 조건입니다.

### 알레르기 키워드 제외 필터

- 기본값은 `true`입니다.
- 등록된 알레르기 키워드가 상품명에 포함된 상품을 결과에서 숨깁니다.
- 필터를 꺼도 상품 카드에는 `allergyKeywordMatches`와 경고 배지를 표시합니다.
- 이 필터는 상품명 기준이며 전성분 검증이 아닙니다.

### 상품 카드

상품 카드 표시 정보:

- 상품 이미지
- 정규화된 상품명
- 쇼핑몰명
- 최저가
- 가격 기준 시점
- 알레르기 키워드 매칭 경고
- `가격 확인하기` 버튼

버튼 문구는 `가격 확인하기`를 우선합니다. 앱 내에서 주문, 결제, 배송, CS를 처리하지 않습니다.

### 가격/성분/알레르기 고지

모든 검색 결과 화면과 상품 카드 근처에 아래 고지를 표시합니다.

- 가격은 검색 시점 기준이며 실제 구매 가격, 배송비, 옵션가는 쇼핑몰에서 달라질 수 있어요.
- 제품 성분, 알레르기, 월령 적합성은 구매 전 상세 페이지에서 꼭 확인해 주세요.

### 로딩/빈 상태/오류 상태

- 로딩: 검색 중임을 짧게 표시하고 필터 변경을 잠급니다.
- 빈 상태: 검색어 변경, 필터 해제, 알레르기 키워드 제외 필터 해제를 제안합니다.
- 오류 상태: 네이버 API 오류, Edge Function 오류, 네트워크 오류를 사용자 문구로 분리합니다.

## 7. 오늘 식단 결과 연결 설계

### 끼니 카드 하단 CTA

오늘 식단 결과의 각 끼니 카드 하단에 보조 CTA를 추가합니다.

- 문구: `비슷한 기성 이유식 최저가 보기`
- 위치: 끼니 카드의 주요 조리 정보 아래
- 우선순위: `재료 다시 입력`, `식단 다시 생성`보다 낮은 보조 액션

### CTA 문구 정책

- 기본 문구는 `비슷한 기성 이유식 최저가 보기`입니다.
- 반찬 카테고리로 확실히 판단되면 `비슷한 아기반찬 최저가 보기`를 허용합니다.
- 외부 이동 버튼은 `가격 확인하기`를 사용합니다.

### 메뉴명/사용재료 기반 검색어 생성 규칙

- 사용 재료는 최대 1~2개만 사용합니다.
- 메뉴명 전체를 그대로 검색하지 않습니다.
- `무른밥`, `죽`, `덮밥` 계열은 상황에 따라 `이유식`으로 정규화합니다.
- `반찬`, `볶음`, `구이` 계열은 `아기반찬`으로 보정합니다.
- `퓨레`, `간식`, `과일` 계열은 `아기 간식` 또는 원래 퓨레 키워드를 유지합니다.
- `12개월`, `13개월` 같은 숫자 월령은 자동 삽입하지 않습니다.

### 예시

- 오늘 점심: 소고기 애호박 무른밥 -> 비슷한 기성 이유식 최저가 보기
- 생성 검색어: 소고기 애호박 이유식
- category: `baby_food`
- source: `meal_result`

반찬 계열:

- 메뉴명: 브로콜리 두부 반찬
- 생성 검색어: 브로콜리 두부 아기반찬
- category: `baby_side_dish`

간식 / 퓨레 계열:

- 메뉴명: 고구마 바나나 퓨레
- 생성 검색어: 고구마 바나나 퓨레
- category: `snack`

## 8. 검색어 생성 정책

우선순위:

1. 사용자가 입력한 query를 최우선으로 사용합니다.
2. query에 이유식 / 유아식 / 아기 / 아기반찬 / 아이반찬 / 퓨레 키워드가 있으면 그대로 사용합니다.
3. 해당 키워드가 없으면 category에 따라 보정합니다.
4. 숫자 월령은 자동 삽입하지 않습니다.

카테고리별 보정:

- `baby_food`: 핵심 재료 1~2개 + `이유식`
- `baby_side_dish`: 핵심 재료 1~2개 + `아기반찬`
- `snack`: 핵심 재료 1~2개 + `퓨레` 또는 `아기 간식`

포함 우선 키워드:

- 이유식
- 유아식
- 아기
- 아이
- 베이비
- 키즈
- 아기반찬
- 아이반찬
- 완료기
- 무른밥
- 죽
- 퓨레
- 간식

제외 우선 키워드:

- 강아지
- 고양이
- 반려동물
- 성인용
- 다이어트
- 헬스
- 영양제
- 건강기능식품
- 이유식 용기
- 이유식 스푼
- 이유식마스터기
- 제조기
- 죽제조기
- 두유제조기
- 두유기
- 메이커
- 믹서기
- 블렌더
- 착즙기
- 기계
- 도구
- 커터
- 칼
- 포크
- 스트로우
- 지퍼백
- 스티커
- 띠지
- 쿠폰
- 아이스팩
- 턱받이
- 보관용기
- 조리기
- 식판
- 빨대컵

제외 정책:

- 제외 우선 키워드는 포함 우선 키워드보다 먼저 적용합니다.
- 상품명에 `이유식`, `유아식`, `죽`이 포함되어도 `제조기`, `메이커`, `기계`, `도구`, `용기`, `스티커`, `아이스팩` 등 조리기기/도구/포장 부자재 계열이면 결과에서 제외합니다.
- 네이버 카테고리 문자열이 `주방가전`, `조리기구`, `이유용품`, `수유용품`, `문구/사무` 등 식품이 아닌 계열이면 결과에서 제외합니다.
- `맘마밀`, `아이꼬야`, `퓨레`, `진밥`, `무른밥`, `아기반찬`처럼 먹는 기성제품으로 판단되는 상품은 포함 후보로 유지합니다.

## 9. 아이 정보 활용 정책

요청에서 사용할 수 있는 아이 정보:

- `childId`
- `childName`
- `ageMonths`
- `birthDate`
- `allergies`
- `useChildContext`

정책:

- 아이 정보는 검색어 추천과 알레르기 키워드 1차 필터에만 사용합니다.
- `ageMonths`와 `birthDate`는 추천 검색어 표시 맥락에는 사용할 수 있으나, 숫자 월령을 자동 검색어에 삽입하지 않습니다.
- `allergies`는 상품명 기준 키워드 매칭에만 사용합니다.
- 제품 성분, 알레르기, 월령 적합성을 자동 보장하는 표현은 금지합니다.
- 기존 제품 소개의 `12개월 전후` 문맥은 쇼핑 검색어 생성 정책에 적용하지 않습니다.

## 10. 알레르기 키워드 필터 정책

상품명 기준 1차 필터:

- 서버는 상품명에서 등록 알레르기 키워드를 단순 매칭합니다.
- 매칭 결과는 `allergyKeywordMatches`로 응답합니다.
- DB에는 `allergy_keyword_matches_json`으로 저장합니다.
- `excludeAllergyKeywordMatches` 기본값은 `true`입니다.

필터 동작:

- `true`: 매칭 상품은 기본 결과에서 숨기고 `is_hidden_by_allergy_filter=true`로 저장합니다.
- `false`: 매칭 상품을 노출하되 경고 배지를 표시합니다.

고지:

- 이 필터는 상품명 기준이며 전성분 검증이 아닙니다.
- 구매 전 상세 페이지에서 전성분, 알레르기, 월령 적합성을 반드시 확인해야 합니다.

## 11. 네이버 쇼핑 API 연동 설계

### 요청 파라미터

- endpoint: `https://openapi.naver.com/v1/search/shop.json`
- HTTP method: `GET`
- `query`: 검색어
- `display`: 1차 MVP에서는 후처리 품질을 위해 50~100개 범위로 넉넉히 조회
- `start`: 기본 1
- `sort=sim`: 정확도순. 가격 낮은 순은 베베초이스 서버 후처리에서 적용
- `filter=naverpay`: 네이버페이 연동 상품만 보기 옵션
- `exclude=used:rental:cbshop`: 중고 / 렌탈 / 해외직구 / 구매대행 제외

인증 헤더:

- `X-Naver-Client-Id`
- `X-Naver-Client-Secret`

### 응답 필드 매핑

- `title` -> `title`, `normalizedTitle`
- `link` -> `productUrl`
- `image` -> `imageUrl`
- `lprice` -> `price`
- `hprice` -> `highPrice`
- `mallName` -> `mallName`
- `productId` -> `providerProductId`
- `productType` -> `productType`
- `brand` -> `brand`
- `maker` -> `maker`
- `category1` -> `category1`
- `category2` -> `category2`
- `category3` -> `category3`
- `category4` -> `category4`

### 오류 처리

- 인증 오류: 서버 로그에는 원인 기록, 클라이언트에는 검색을 완료하지 못했다는 일반 메시지 표시
- 호출 제한: 캐시 결과가 있으면 캐시를 반환하고, 없으면 잠시 후 재시도 안내
- 네이버 응답 오류: provider error로 기록하고 사용자에게 검색 조건 변경 또는 재시도 안내
- 네트워크 오류: 클라이언트 재시도 가능 상태로 처리

### 호출 제한 고려

네이버 공식 문서 기준 검색 API는 일 호출 한도를 고려해야 합니다. 1차 MVP는 동일 query / category / filter 조합에 대해 캐시를 사용해 불필요한 호출을 줄입니다.

## 12. Supabase Edge Function 설계

### `search-products`

React 클라이언트는 네이버 API를 직접 호출하지 않고 Supabase Edge Function `search-products`만 호출합니다.

책임:

- 요청 검증
- 선택된 아이 정보 조회
- 검색어 정규화
- 캐시 조회
- provider adapter 호출
- 결과 정규화
- 포함 / 제외 키워드 필터
- 알레르기 키워드 매칭
- 랭킹
- 검색 query / result / snapshot 저장
- 응답 notices 구성

### provider adapter 구조

Edge Function 내부 provider adapter:

```txt
search-products
  providers/
    naver-shopping.ts
  normalize/
  filters/
  rank/
  cache/
```

### `naver-shopping.ts`

책임:

- 네이버 API endpoint 구성
- 인증 헤더 추가
- query string 구성
- timeout / retry 정책 적용
- 네이버 응답을 provider raw 형태로 반환

### normalize/filter/rank/cache 흐름

1. request schema 검증
2. child context 조회
3. normalizedQuery 생성
4. cache key 계산
5. 유효 캐시가 있으면 cached response 반환
6. 캐시가 없으면 `naver-shopping.ts`에서 `sort=sim`으로 넉넉히 조회
7. raw item 정규화
8. 상품명 / 판매처 / 카테고리 텍스트를 합쳐 HTML 태그 제거 후 정규화
9. 주방용품 / 식기 / 완구 / 도서 / 생활용품 및 비식품 키워드 제거
10. 이유식 / 유아식 / 아기반찬 / 반찬 / 죽 / 무른밥 / 큐브 등 식품 signal과 신뢰 브랜드로 relevance score 계산
11. 알레르기 키워드 매칭
12. relevance score 높은 순, 동점이면 가격 낮은 순으로 rank 계산
13. query / result / price snapshot 저장
14. notices와 items 응답

## 13. 프론트엔드 도메인 설계

신규 도메인은 `src/features/shopping`으로 둡니다.

예상 구조:

```txt
src/features/shopping/
  api/
  components/
  hooks/
  schema/
  types/
  utils/
```

### types

- `ProductSearchCategory`
- `ProductSearchSource`
- `ProductSearchRequest`
- `ProductSearchResponse`
- `ProductSearchItem`
- `ProductSearchFilters`
- `MealProductSearchContext`

### schema

- 검색 요청 schema
- 필터 schema
- meal context schema
- 응답 item schema

### api

- Supabase Edge Function `search-products` 호출
- 클릭 로그 기록 호출
- 에러 매핑

### hooks

- `useProductSearch`
- `useProductSearchSuggestions`
- `useProductClickLog`

### utils

- meal result 기반 검색어 생성
- category 추론
- display price 포맷
- allergy badge helper

### components

- `ProductSearchBar`
- `ProductResultCard`
- `ShoppingDisclaimer`
- `MealProductSearchAction`
- `ProductFilterPanel`

## 14. DB 설계 초안

이 섹션은 설계 초안입니다. 실제 migration 파일은 다음 구현 단계에서 작성합니다.

### `product_search_queries`

- `id`
- `user_id`
- `anonymous_user_id`
- `child_id`
- `source`: `manual | child_suggestion | meal_result`
- `meal_plan_id`
- `meal_plan_item_id`
- `meal_type`
- `origin_menu_name`
- `raw_query`
- `normalized_query`
- `category`
- `use_child_context`
- `child_age_months`
- `child_allergies_snapshot_json`
- `provider`
- `cache_key`
- `created_at`

### `product_search_results`

- `id`
- `query_id`
- `provider`
- `provider_product_id`
- `title`
- `normalized_title`
- `image_url`
- `product_url`
- `mall_name`
- `price`
- `high_price`
- `brand`
- `maker`
- `category1`
- `category2`
- `category3`
- `category4`
- `product_type`
- `relevance_score`
- `price_rank`
- `allergy_keyword_matches_json`
- `warning_badges_json`
- `is_hidden_by_allergy_filter`
- `fetched_at`
- `raw_json`

### `product_click_logs`

- `id`
- `user_id`
- `anonymous_user_id`
- `child_id`
- `product_result_id`
- `source`
- `meal_plan_id`
- `meal_plan_item_id`
- `provider`
- `outbound_url`
- `clicked_at`

### `product_price_snapshots`

- `id`
- `provider`
- `provider_product_id`
- `normalized_title`
- `price`
- `mall_name`
- `product_url`
- `fetched_at`

### SQL 초안

```sql
-- 설계 초안입니다. 실제 migration으로 적용하지 않습니다.

create table product_search_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  anonymous_user_id uuid null,
  child_id uuid null,
  source text not null check (source in ('manual', 'child_suggestion', 'meal_result')),
  meal_plan_id uuid null,
  meal_plan_item_id uuid null,
  meal_type text null,
  origin_menu_name text null,
  raw_query text not null,
  normalized_query text not null,
  category text not null,
  use_child_context boolean not null default false,
  child_age_months integer null,
  child_allergies_snapshot_json jsonb not null default '[]'::jsonb,
  provider text not null default 'naver',
  cache_key text not null,
  created_at timestamptz not null default now()
);

create table product_search_results (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references product_search_queries(id) on delete cascade,
  provider text not null,
  provider_product_id text not null,
  title text not null,
  normalized_title text not null,
  image_url text null,
  product_url text not null,
  mall_name text null,
  price integer null,
  high_price integer null,
  brand text null,
  maker text null,
  category1 text null,
  category2 text null,
  category3 text null,
  category4 text null,
  product_type text null,
  relevance_score numeric null,
  price_rank integer null,
  allergy_keyword_matches_json jsonb not null default '[]'::jsonb,
  warning_badges_json jsonb not null default '[]'::jsonb,
  is_hidden_by_allergy_filter boolean not null default false,
  fetched_at timestamptz not null,
  raw_json jsonb not null default '{}'::jsonb
);

create table product_click_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  anonymous_user_id uuid null,
  child_id uuid null,
  product_result_id uuid not null references product_search_results(id) on delete cascade,
  source text not null,
  meal_plan_id uuid null,
  meal_plan_item_id uuid null,
  provider text not null,
  outbound_url text not null,
  clicked_at timestamptz not null default now()
);

create table product_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_product_id text not null,
  normalized_title text not null,
  price integer null,
  mall_name text null,
  product_url text not null,
  fetched_at timestamptz not null
);
```

## 15. API 계약

### Request

```json
{
  "query": "소고기 애호박 이유식",
  "category": "baby_food",
  "childId": "child_001",
  "useChildContext": true,
  "source": "meal_result",
  "mealContext": {
    "mealPlanId": "plan_001",
    "mealPlanItemId": "item_002",
    "mealType": "lunch",
    "originMenuName": "소고기 애호박 무른밥"
  },
  "filters": {
    "onlyNaverPay": false,
    "excludeUsed": true,
    "excludeRental": true,
    "excludeOverseas": true,
    "excludeAllergyKeywordMatches": true
  },
  "limit": 20
}
```

### Response

```json
{
  "query": "소고기 애호박 이유식",
  "normalizedQuery": "소고기 애호박 이유식",
  "provider": "naver",
  "fetchedAt": "2026-04-28T12:00:00+09:00",
  "cacheTtlSeconds": 1800,
  "notices": [
    "가격은 검색 시점 기준이며 실제 구매 가격, 배송비, 옵션가는 쇼핑몰에서 달라질 수 있어요.",
    "제품 성분, 알레르기, 월령 적합성은 구매 전 상세 페이지에서 꼭 확인해 주세요."
  ],
  "items": [
    {
      "id": "result_001",
      "provider": "naver",
      "providerProductId": "123456789",
      "title": "소고기 애호박 이유식",
      "imageUrl": "https://...",
      "productUrl": "https://...",
      "mallName": "OO몰",
      "price": 3500,
      "displayPrice": "3,500원",
      "priceRank": 1,
      "allergyKeywordMatches": [],
      "warningBadges": [],
      "fetchedAt": "2026-04-28T12:00:00+09:00"
    }
  ]
}
```

### notices

응답에는 항상 아래 notices를 포함합니다.

- 가격은 검색 시점 기준이며 실제 구매 가격, 배송비, 옵션가는 쇼핑몰에서 달라질 수 있어요.
- 제품 성분, 알레르기, 월령 적합성은 구매 전 상세 페이지에서 꼭 확인해 주세요.

### items

`items`는 네이버 쇼핑 API 결과를 그대로 보여주는 객체가 아닙니다. 베베 초이스 서버에서 정규화 / 필터링 / 랭킹한 결과만 포함합니다.

## 16. 캐시 정책

### cache key

cache key 구성 요소:

- provider
- normalizedQuery
- category
- onlyNaverPay
- excludeUsed
- excludeRental
- excludeOverseas
- excludeAllergyKeywordMatches
- allergy keyword hash
- limit

### TTL

- 1차 기본값: `1800초`
- 가격 변동성과 호출량을 확인한 뒤 조정합니다.
- TTL이 남아 있는 캐시는 네이버 API를 재호출하지 않습니다.

### 가격 기준 시점 표시

- 응답과 상품 카드에는 `fetchedAt`을 표시합니다.
- 사용자는 가격이 검색 시점 기준임을 확인할 수 있어야 합니다.

## 17. 클릭 로그/분석 설계

클릭 로그는 외부 상품 페이지 이동을 분석하기 위해 저장합니다.

source:

- `manual`
- `child_suggestion`
- `meal_result`

meal result source에서 추가 기록:

- `mealPlanId`
- `mealPlanItemId`
- `originMenuName`
- `mealType`

기록 목적:

- 검색어별 클릭률 확인
- 오늘 식단 결과 CTA 사용량 확인
- 외부 이동 전환 분석
- 향후 제휴 API 또는 실제 구매 전환 분석 기반 확보

## 18. 위험 요소와 방어 정책

### 가격 불일치

- 가격은 검색 시점 기준입니다.
- 실제 구매 가격, 배송비, 옵션가는 쇼핑몰에서 달라질 수 있다고 고지합니다.

### 배송비 미반영

- 1차 MVP는 배송비 포함 실질 최저가를 계산하지 않습니다.
- 상품 카드에는 배송비 포함 최저가처럼 보이는 표현을 사용하지 않습니다.

### 품절

- 네이버 API 결과가 품절 상태를 완전히 보장하지 않을 수 있습니다.
- 구매 가능 여부는 외부 상세 페이지에서 확인하도록 안내합니다.

### 알레르기/성분 오판

- 알레르기 키워드 필터는 상품명 기준입니다.
- 전성분 검증이 아니며, 상세 페이지 확인 고지를 항상 표시합니다.

### 월령 적합성 오해

- 숫자 월령을 검색어에 자동 삽입하지 않습니다.
- 월령 적합성은 외부 상세 페이지에서 확인하도록 안내합니다.

### 외부 링크 신뢰

- 외부 링크 이동 전 사용자가 외부 판매처로 이동함을 인지할 수 있어야 합니다.
- 앱 내 결제나 배송 처리를 제공하는 것처럼 보이면 안 됩니다.

## 19. 구현 Stage

### Stage 1: 설계 문서 확정

- 이 문서와 제품 / UX / 아키텍처 / Figma / 운영 문서를 확정합니다.
- 금지 표현, 제외 범위, 보류 결정을 점검합니다.
- 상태: 완료

### Stage 2: 검색 엔진 골격

- `src/features/shopping` 도메인 골격을 만듭니다.
- Supabase Edge Function `search-products` 골격을 만듭니다.
- 네이버 provider adapter 구조를 추가합니다.
- 상태: 완료
- 주요 파일:
  - `src/features/shopping/types.ts`
  - `src/features/shopping/schema.ts`
  - `src/features/shopping/api.ts`
  - `src/features/shopping/hooks.ts`
  - `supabase/functions/search-products/index.ts`
  - `supabase/functions/search-products/providers/naver-shopping.ts`

### Stage 3: 캐시/로그

- 검색 query / result / click log / price snapshot migration을 작성합니다.
- cache key와 TTL을 적용합니다.
- RLS 정책을 설계에 맞게 적용합니다.
- 상태: 완료
- migration: `supabase/migrations/20260428143000_create_product_search_tables.sql`

### Stage 4: ShoppingPage UI

- 검색 화면, 추천 검색어, 필터, 상품 카드, 고지 UX를 구현합니다.
- 기존 CSS + `global.css` 기반 스타일 시스템을 유지합니다.
- 상태: 완료
- route: `/shopping`
- 하단 탭 라벨: `찾기`

### Stage 5: 오늘 식단 결과 CTA 연결

- 끼니 카드 하단에 `MealProductSearchAction`을 연결합니다.
- 메뉴명과 사용 재료 기반 검색어 생성 유틸을 적용합니다.
- 상태: 완료
- CTA는 route query string으로 `query`, `category`, `source`, `childId`, `mealPlanId`, `mealType`, `originMenuName`을 전달합니다.

### Stage 6: QA

- 독립 검색, 아이 정보 기반 추천 검색, 식단 결과 CTA 검색을 점검합니다.
- 알레르기 키워드 필터와 고지 표시를 점검합니다.
- 외부 링크 클릭 로그와 캐시 동작을 점검합니다.
- 상태: 부분 완료
- 자동 검증: `npm run build` 통과
- 실제 네이버 API 호출, Supabase migration 적용, 시크릿 설정 후 수동 QA가 필요합니다.

## 20. QA 시나리오

- 수동 검색어 `소고기 이유식`으로 검색하면 관련도 높은 식품 결과 중 가격 낮은 순 결과가 표시되는가
- `아기반찬` 검색에서 그릇 / 식기 / 용기 / 책 / 조리도구가 제외되는가
- `onlyNaverPay=true`일 때 네이버페이 필터가 요청에 반영되는가
- `exclude=used:rental:cbshop` 조건이 네이버 요청에 반영되는가
- 선택된 아이가 서아, 13개월, 알레르기 달걀 / 우유일 때 추천 검색어 예시가 표시되는가
- 등록 알레르기 키워드가 상품명에 포함된 상품이 기본값에서 숨겨지는가
- 알레르기 키워드 제외 필터를 끄면 경고 배지와 함께 노출되는가
- 오늘 점심 `소고기 애호박 무른밥`에서 `소고기 애호박 이유식` 검색어가 생성되는가
- `브로콜리 두부 반찬`에서 `브로콜리 두부 아기반찬` 검색어가 생성되는가
- `고구마 바나나 퓨레`에서 퓨레 키워드가 유지되는가
- 숫자 월령이 자동 검색어에 삽입되지 않는가
- 상품 카드와 검색 결과 화면에 가격 / 성분 / 알레르기 / 월령 적합성 고지가 표시되는가
- 외부 이동 버튼 문구가 `가격 확인하기`인가
- 앱 내 주문, 결제, 배송, CS, 장바구니 UI가 없는가
- 캐시 TTL 안에서 동일 요청이 네이버 API를 재호출하지 않는가
- 네이버 API 오류 시 사용자에게 이해 가능한 오류 상태가 표시되는가

## 21. 향후 확장

- 쿠팡 / 카카오 / 제휴 API
- 가격 알림
- 장보기 리스트
- 단위가격 비교
- 성분 DB 연동
- 실제 구매 전환 분석
- 배송비 포함 가격 비교
- 품절 / 옵션 가격 정교화
- 추천 검색어 개인화 고도화

## 보류 결정사항

- 하단 탭 라벨은 1차 구현에서 `찾기`로 적용했습니다. Figma 확정 시 조정할 수 있습니다.
- cache TTL은 `1800초`를 1차 기본값으로 두고 운영 데이터로 조정합니다.
- DB 테이블 migration 파일은 작성했으나, 원격 Supabase 적용 여부는 별도 배포 단계에서 확인해야 합니다.
- 네이버 외 provider 연동과 성분 DB 연동은 1차 MVP 이후로 둡니다.
- 쇼핑 관련 Figma 노드는 아직 없으므로 추후 Figma 노드가 필요합니다.
