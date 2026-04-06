# 베베 초이스 (Bebe Choice)

## 문서 목적

이 문서는 프로젝트를 빠르게 이해하고 실행하기 위한 **가장 짧은 진입 문서**입니다.

## 서비스 한 줄 소개

베베 초이스는 **12개월 전후 아이를 위한 하루 3끼 식단을 추천하는 모바일 우선 PWA**입니다.  
보호자는 아이 프로필을 등록하고, 아침/점심/저녁 재료를 입력한 뒤 하루 식단을 생성할 수 있습니다.

## 현재 구현 범위

- Google 로그인 + 익명 체험
- 아이 프로필 및 알레르기 관리
- 아침 / 점심 / 저녁 재료 입력
- 규칙 기반 메뉴 선택 + 서버사이드 AI 문구 생성
- 최근 식단 조회
- Vercel 배포

## 실행 방법

```bash
npm install
npm run dev
npm run test
npm run build
```

기본 개발 주소는 `http://localhost:4173`입니다.

## 필수 환경 변수

`.env.local` 파일에 아래 값을 설정합니다.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

예시는 [./.env.example](./.env.example)에 있습니다.

## 서버 시크릿

식단 생성 시 AI 문구를 사용하려면 Supabase Edge Function 시크릿에 아래 값을 설정해야 합니다.

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase secrets set OPENAI_MODEL=gpt-4.1
```

`OPENAI_API_KEY`가 없거나 호출이 실패하면 식단 생성은 계속 동작하지만, AI 문구 대신 fallback 문구를 사용합니다.

## 참고 메모

- 인증: `Google 로그인 + 익명 체험`
- 배포 주소: `https://bebe-choice.vercel.app`
- AI 호출: 클라이언트 직접 호출이 아니라 서버사이드 Edge Function 경유

## 관련 문서

- 제품 스펙: [./docs/product-spec.md](./docs/product-spec.md)
- UX 스펙: [./docs/ux-spec.md](./docs/ux-spec.md)
- 시스템 구조: [./docs/architecture.md](./docs/architecture.md)
- 구현 규칙: [./AGENTS.md](./AGENTS.md)
- 배포 문서: [./docs/deployment/vercel-hosting.md](./docs/deployment/vercel-hosting.md)
- 과거 UX 참고: [./docs/archive/ux-requirements-v2.md](./docs/archive/ux-requirements-v2.md)
