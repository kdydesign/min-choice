# 12개월 아이 하루 식단표

`product-spec.md`와 `AGENTS.md`를 기준으로 리팩토링한 모바일 우선 PWA MVP입니다.

## 현재 구현 범위

- React + TypeScript + Vite 기반 PWA
- 아이 프로필 생성, 수정, 삭제, 선택
- 아이별 알레르기 재료 관리
- 아침 / 점심 / 저녁 재료 태그 입력
- 규칙 기반 메뉴 후보 선택
- Supabase Edge Functions 연동 기반 재료 정규화 / 식단 생성 호출
- 서버사이드 AI 추천 문구 / 조리법 3줄 / 주의사항 생성
- AI 실패 시 fallback 설명 문구, 기본 조리법, 부족 재료 / 대체 재료 유지
- 하루 3끼 식단 생성과 아이별 최근 이력 확인

## 실행

```bash
npm install
npm run dev
```

기본 개발 주소는 `http://localhost:4173`입니다.

## 환경 변수

`.env.local` 파일을 만들고 아래 값을 채워 주세요.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

예시는 `.env.example`에 있습니다.

Edge Functions에서 AI 생성을 사용하려면 Supabase 프로젝트 또는 로컬 개발 환경에 아래 시크릿도 설정해 주세요.

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY`가 없으면 식단 생성은 계속 동작하지만, AI 문구 대신 fallback 문구를 사용합니다.

## Supabase

- `src/lib/env.ts`에서 런타임 env를 정리합니다.
- `src/lib/supabase.ts`에서 브라우저용 Supabase 클라이언트를 생성합니다.
- 앱 시작 시 익명 세션을 먼저 만들고, 기존 localStorage 프로필/식단 이력을 Supabase로 한 번 마이그레이션합니다.
- `supabase/config.toml`은 로컬 Supabase 개발 설정입니다.
- `supabase/migrations`에는 초기 스키마와 RLS 초안이 들어 있습니다.
- `supabase/functions/generate-meal-plan`은 규칙 기반 후보 선택 뒤 OpenAI 호출, 응답 검증, fallback, AI 로그 적재를 담당합니다.
- 아이 프로필 / 식단 이력 CRUD는 Supabase를 우선 사용하고, 아직 스키마가 적용되지 않은 환경에서는 로컬 저장소 fallback으로 동작합니다.

## 구조

- `src/app`: 앱 엔트리, 라우터, 프로바이더
- `src/pages`: 라우트 단위 페이지
- `src/components`: 공용 UI 컴포넌트
- `src/features`: 도메인별 기능
- `src/services`: 브라우저 저장소 등 인프라성 유틸
- `src/store`: Zustand 상태
- `src/types`: 도메인 타입

## 참고

현재 버전은 MVP 범위에 맞춘 프론트엔드 중심 구현입니다. 이번 단계에서 Supabase 클라이언트와 Edge Functions 연결을 먼저 정리했고, 다음 단계에서 익명 사용자 세션 / RLS 기반 CRUD로 넘어가면 됩니다.
