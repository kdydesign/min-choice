# AGENTS.md

## 문서 목적

이 문서는 베베 초이스 프로젝트의 **최종 구현 규칙 문서**입니다.  
구현자와 Codex는 이 문서를 기준으로 구조, 상태 관리, 검증, 보안, AI 연동, 금지사항을 판단합니다.

## 문서 우선순위

문서 역할은 아래처럼 고정합니다.

- 구현 규칙: [./AGENTS.md](./AGENTS.md)
- 제품 범위: [./docs/product-spec.md](./docs/product-spec.md)
- UX 기준: [./docs/ux-spec.md](./docs/ux-spec.md)
- 시스템 구조: [./docs/architecture.md](./docs/architecture.md)
- Figma 구현 가이드: [./docs/figma-codex-implementation-guide.md](./docs/figma-codex-implementation-guide.md)
- 운영 기준: [./docs/deployment/vercel-hosting.md](./docs/deployment/vercel-hosting.md)

판단 원칙:

- 제품 범위 판단은 `docs/product-spec.md`를 따른다.
- UX 판단은 `docs/ux-spec.md`를 따른다.
- 시스템 구조 판단은 `docs/architecture.md`를 따른다.
- Figma 기반 UI 구현은 `docs/figma-codex-implementation-guide.md`를 따른다.
- 구현 방법과 금지사항은 이 문서를 최우선으로 따른다.
- 운영/배포 설정은 `docs/deployment/vercel-hosting.md`를 따른다.

## 프론트엔드 구조 규칙

루트 구조는 아래를 유지합니다.

- `src/app`
- `src/pages`
- `src/components`
- `src/features`
- `src/lib`
- `src/services`
- `src/store`
- `src/styles`
- `src/types`

폴더 책임:

- `src/app`: 앱 엔트리, 라우터, 전역 프로바이더
- `src/pages`: 라우트 단위 화면
- `src/components`: 공용 UI 컴포넌트
- `src/features`: 도메인 기능, API, 타입, 훅, 검증
- `src/lib`: 외부 클라이언트와 공용 유틸
- `src/services`: 브라우저 저장소와 보조 서비스
- `src/store`: 전역 클라이언트 상태
- `src/styles`: 전역 스타일과 토큰
- `src/types`: 공용 타입

구현 원칙:

- 페이지는 화면 조합과 라우트 책임만 가진다.
- 비즈니스 로직은 `features`로 내린다.
- 공통 UI는 `components`로 추출한다.
- 외부 SDK 초기화와 클라이언트 생성은 `lib`에 둔다.
- 관련 없는 로직을 범용 util에 섞지 않는다.

## 도메인 분리 원칙

도메인은 아래를 기준으로 나눕니다.

- `auth`
- `children`
- `ingredients`
- `meal-plans`
- `menus`

규칙:

- 도메인 타입은 해당 도메인 폴더 안에 둔다.
- 도메인 API는 해당 도메인 폴더 안에 둔다.
- 검증 스키마도 가능하면 도메인 폴더 안에 둔다.
- 한 도메인의 저장 규칙을 다른 도메인 util에서 임의로 소유하지 않는다.
- 공통화가 필요하면 먼저 공용 책임인지 확인하고, 맞을 때만 `components` 또는 `lib`로 올린다.

## 상태 관리 규칙

### React Query

서버 상태는 React Query로 다룹니다.

대상:

- 아이 프로필 목록
- 최신 식단 결과
- 최근 식단 이력
- 저장/수정/삭제 mutation 결과

규칙:

- 서버 데이터를 Zustand나 localStorage의 source of truth로 두지 않는다.
- 조회/저장 후 invalidate 또는 갱신 전략을 명시한다.
- 페이지에서 직접 fetch 로직을 늘리지 않는다.

### Zustand

Zustand는 얇은 앱 상태만 관리합니다.

허용 대상:

- 선택한 아이
- 선택한 식단
- 현재 화면 전환에 필요한 보조 상태

금지:

- 서버 데이터 캐시 전체 저장
- 식단 결과 전체 저장
- 프로필 목록 전체 저장

## localStorage 제한 규칙

localStorage는 아래만 허용합니다.

- 선택한 아이
- 작성 중인 식단 draft
- 익명 세션 복원에 필요한 최소 키

금지:

- 아이 프로필 전체를 source of truth로 저장
- 식단 결과 전체를 source of truth로 저장
- 인증 민감 정보 직접 저장
- 서버 데이터 동기화 책임을 localStorage에 넘기기

원칙:

- 로컬 저장은 편의 기능과 세션 복원 용도만 가진다.
- 최종 데이터 기준은 항상 Supabase DB다.

## 인증 / 익명 흐름 구현 규칙

- 로그인 기본 경로는 Google이다.
- 익명 체험은 Supabase 익명 세션을 사용한다.
- 같은 브라우저에서 재진입하면 익명 데이터를 복원해야 한다.
- `시작 화면으로`는 데이터 삭제가 아니라 익명 세션 일시 중단이다.
- Google 로그인 후에는 기존 익명 데이터를 계정에 연결해야 한다.
- 아이 프로필이 하나도 없으면 홈보다 프로필 화면으로 먼저 진입시킨다.
- 인증 redirect는 현재 구현 기준으로 `window.location.origin`을 따른다.

구현 시 주의:

- 로그인 사용자와 익명 사용자의 소유권 기준을 섞지 않는다.
- 계정 연결은 서버 함수로 처리한다.
- 익명 복원을 위해 로컬 저장 예외가 필요해도 최소 키만 허용한다.

## DB / 보안 규칙

주요 테이블:

- `children`
- `ingredients`
- `menus`
- `meal_inputs`
- `meal_plans`
- `meal_plan_items`
- `ai_generation_logs`
- `anonymous_users`
- `user_identity_links`

데이터 규칙:

- 재료 매칭은 표준 ingredient key 기준으로 처리한다.
- 메뉴 기준 데이터는 DB와 seed를 기준으로 관리한다.
- 하루 식단은 `meal_plans`, 끼니별 결과는 `meal_plan_items`에 저장한다.
- 부족 재료, 대체재, AI 추천 문구, 조리법 요약, fallback 여부, prompt version은 항상 저장한다.

보안 규칙:

- RLS를 유지한다.
- 사용자는 자기 데이터만 읽고 써야 한다.
- `menus`, `ingredients`는 일반 사용자에게 읽기만 허용한다.
- AI 로그는 일반 사용자에게 직접 노출하지 않는다.
- `service_role`과 `OPENAI_API_KEY`는 프론트에 두지 않는다.

## TypeScript / 검증 규칙

### TypeScript

- strict TypeScript를 유지한다.
- `any`를 피한다.
- API payload, 응답, props는 명시적으로 타입을 둔다.
- 숨은 형태 변환보다 명시적 매핑을 우선한다.

### 검증

아래 입력은 반드시 검증합니다.

- 아이 프로필 폼
- 재료 정규화 요청
- 식단 생성 요청
- AI 응답 파싱

아이 프로필 규칙:

- 이름은 필수다.
- 이름은 공백만 입력할 수 없다.
- 개월 수는 기본값 `0`이며 숫자여야 한다.
- 생년월일은 미래 날짜일 수 없다.
- 개월 수와 생년월일은 양방향 동기화해야 한다.

## AI 입력 / 출력 / 검증 / fallback 규칙

### 역할 경계

- AI는 메뉴를 선택하지 않는다.
- 메뉴 후보 선택은 규칙 기반으로 먼저 수행한다.
- AI는 아래만 생성한다.
  - 추천 문구
  - 부족 재료 설명
  - 대체재 표현
  - 3줄 조리법
  - 주의사항

### 입력 규칙

AI 요청에는 아래 정보가 포함되어야 한다.

- 아이 개월 수
- 아이 알레르기
- 끼니 타입
- 정규화된 입력 재료
- 규칙 기반으로 선택된 메뉴
- 부족 재료
- 허용된 대체재
- 후보 메뉴 목록
- 식감/주의 정보

### 출력 규칙

AI는 구조화된 JSON으로 아래 필드를 반환해야 한다.

- `selectedMenu`
- `recommendation`
- `missingIngredients`
- `missingIngredientExplanation`
- `substitutes`
- `recipe`
- `caution`

### 검증 규칙

아래 조건을 통과해야만 AI 결과를 사용한다.

- JSON 파싱 가능
- `selectedMenu`가 미리 선택된 메뉴와 동일
- `missingIngredients`가 백엔드 계산과 동일
- 대체재가 허용 범위 안에 있음
- 알레르기 재료 미포함
- 위험 표현 없음
- 조리법이 짧고 12개월 기준으로 안전함

### fallback 규칙

아래 경우 fallback을 사용한다.

- OpenAI 설정 없음
- OpenAI 호출 실패
- 구조화 응답 검증 실패
- 안전성 가드 실패

원칙:

- AI 실패가 식단 생성 흐름 전체를 막으면 안 된다.
- fallback도 저장 가능한 결과 형태를 유지해야 한다.

## UI 구현 시 주의사항

- 모바일 퍼스트를 유지한다.
- 카드형 구조를 유지한다.
- 디자인 토큰을 우선 재사용한다.
- 알레르기 경고는 일반 정보보다 우선한다.
- 과한 모션을 넣지 않는다.
- 큰 터치 영역을 유지한다.

오늘 식단 생성 화면 규칙:

- 입력 화면과 결과 화면의 역할을 섞지 않는다.
- 재료가 바뀌면 이전 추천 결과는 숨긴다.
- 생성 중에는 현재 화면의 입력과 버튼을 모두 막는다.
- 진행 상태는 실제 단계 기반으로만 보여준다.
- 단계는 `재료 이름 정리 -> 식단 생성 -> 저장` 순서만 사용한다.
- 단계형 progress 값은 `20 / 80 / 100`으로 유지한다.

## 작업 시 응답 규칙

- 변경은 가능하면 점진적으로 진행한다.
- 큰 구조 변경보다 현재 구조를 유지한 개선을 우선한다.
- 구현 후에는 아래를 요약한다.
  1. 무엇을 바꿨는지
  2. 어떤 파일을 수정했는지
  3. 다음에 할 일
- 문서 변경 시 역할 중복이 생기지 않게 함께 정리한다.

## 금지사항

- 클라이언트에서 OpenAI 직접 호출 금지
- 임시 결과를 source of truth처럼 저장 금지
- 도메인 책임이 섞인 대형 컴포넌트 추가 금지
- 문서 반영 없는 구조 변경 금지
- 알레르기 규칙 우회 금지
- 프론트에 서버 시크릿 추가 금지
- 로컬 저장소를 서버 데이터의 진실 원본처럼 취급 금지

## 관련 문서

- 프로젝트 소개 및 실행: [./README.md](./README.md)
- 제품 스펙: [./docs/product-spec.md](./docs/product-spec.md)
- UX 스펙: [./docs/ux-spec.md](./docs/ux-spec.md)
- 시스템 구조: [./docs/architecture.md](./docs/architecture.md)
- 운영 기준: [./docs/deployment/vercel-hosting.md](./docs/deployment/vercel-hosting.md)
