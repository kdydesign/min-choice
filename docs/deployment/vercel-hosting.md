# 베베 초이스 Vercel 호스팅 설계 문서

## 문서 목적

이 문서는 베베 초이스 프론트엔드를 Vercel에 호스팅하고, Supabase 백엔드와 안전하게 연결하기 위한 운영 기준을 정리합니다.

## 1. 현재 운영 기준 요약

- 프론트 호스팅: Vercel
- 백엔드: Supabase
- 공개 URL: `https://bebe-choice.vercel.app`
- 인증: Google 로그인 + 익명 체험
- 라우팅: Vite SPA + React Router
- PWA: `vite-plugin-pwa`

## 2. 역할 분리

### 2.1 Vercel 역할

- 정적 프론트 배포
- SPA 라우팅 처리
- PWA 자산 제공
- 공개 HTTPS URL 제공

### 2.2 Supabase 역할

- Auth
- Postgres
- Edge Functions
- 익명 사용자 연동
- AI 호출과 검증
- 네이버 쇼핑 검색 API 호출과 상품 검색 결과 정규화 / 캐시

## 3. 환경 변수

### 3.1 프론트 필수 환경 변수

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3.2 프론트에 두면 안 되는 값

- `OPENAI_API_KEY`
- `service_role`
- `NAVER_SHOPPING_CLIENT_ID`
- `NAVER_SHOPPING_CLIENT_SECRET`
- 기타 서버 전용 시크릿

### 3.3 Supabase Edge Function Secret

서버 함수에서만 사용하는 값은 Supabase Edge Function Secret으로 관리합니다.

- `OPENAI_API_KEY`
- `NAVER_SHOPPING_CLIENT_ID`
- `NAVER_SHOPPING_CLIENT_SECRET`
- `service_role`

기성제품 최저가 찾기 1차 MVP에서 React 클라이언트는 네이버 쇼핑 API를 직접 호출하지 않고, Supabase Edge Function `search-products`만 호출합니다.

## 4. 인증 및 Redirect URL 기준

현재 코드는 별도 `/auth/callback` 페이지를 두지 않고, `window.location.origin`으로 복귀합니다.

### 4.1 Supabase URL Configuration

- `Site URL`
  - `https://bebe-choice.vercel.app/`

- `Redirect URLs`
  - `http://localhost:4173/`
  - `https://bebe-choice.vercel.app/`
  - `https://*.vercel.app/**`

### 4.2 Google OAuth 기준

- `Authorized JavaScript origins`
  - `http://localhost:4173`
  - `https://bebe-choice.vercel.app`

- `Authorized redirect URIs`
  - `https://fxmneyahmryuxtetkmrv.supabase.co/auth/v1/callback`

## 5. 빌드 및 배포 기준

### 5.1 빌드 명령

```bash
npm run build
```

내부적으로는 `tsc --noEmit && vite build`를 사용합니다.

### 5.2 Vercel 설정

- Framework Preset: `Vite`
- Output Directory: `dist`
- Production Branch: `main`
- Node: `>=20`

### 5.3 라우팅 처리

SPA 새로고침 대응을 위해 `vercel.json` rewrite를 사용합니다.

대상 경로:
- `/`
- `/login`
- `/history`
- `/profile`

정적 자산은 rewrite 대상에서 제외해야 합니다.
- `manifest.webmanifest`
- `sw.js`
- `icons/*`
- `assets/*`

## 6. PWA 배포 기준

현재 PWA는 `vite-plugin-pwa`가 manifest와 service worker를 생성합니다.

배포 후 반드시 확인합니다.

- `/manifest.webmanifest`
- `/sw.js`
- `/icons/app-icon.svg`
- browser favicon: `src/assets/favicon-32.png`에서 빌드된 fingerprint asset
- iOS touch icon: `src/assets/apple-touch-icon.png`에서 빌드된 fingerprint asset
- 링크 공유용 `/og-image.png`

현재 asset 기준:

- `src/assets/favicon-32.png`: 브라우저 favicon용 32x32 PNG
- `src/assets/apple-touch-icon.png`: iOS touch icon용 180x180 PNG
- `src/assets/bebe-background.svg`: 전역 배경
- `src/assets/figma-login-art.png`: 로그인 화면 이미지

운영 원칙:

- 사용하지 않는 원본/임시 asset은 `src/assets`에 남기지 않습니다.
- favicon 원본이 다시 필요하면 외부 원본 파일에서 재생성하고, 배포 대상에는 실제 참조되는 크기 파일만 유지합니다.

## 7. 배포 후 확인 항목

### 7.1 기본 동작

- `/login` 진입
- `/`, `/history`, `/profile` 새로고침 정상
- PWA 자산 응답 정상

### 7.2 인증

- Google 로그인 정상
- 익명 체험 정상
- 익명 데이터 복원 정상
- 익명 -> Google 데이터 연결 정상

### 7.3 기능

- 아이 프로필 CRUD 정상
- 재료 입력 정상
- 하루 식단 생성 정상
- OpenAI 실패 시 fallback 정상
- 최근 식단 조회 정상
- 기성제품 검색 도입 시 `search-products` Edge Function 정상
- 기성제품 검색 도입 시 네이버 API 시크릿이 프론트 번들에 포함되지 않는지 확인

## 8. 현재 운영 메모

- GitHub push 후 Vercel production이 자동으로 안 붙을 수 있어 수동 배포를 사용한 이력이 있습니다.
- 대표 alias는 반드시 `bebe-choice.vercel.app`이 최신 deployment를 가리키는지 확인합니다.
- 2026-04-28 기준 최신 수동 배포:
  - GitHub: `main` pushed to `kdydesign/min-choice`
  - 포함 커밋:
    - `f189da8 fix: stabilize profile form on ios keyboard`
    - `5298cf4 chore: update favicon assets`
  - Vercel deployment: `dpl_BBzpfg86Vy43rfNCtUbY8TBL4oBn`
  - Deployment URL: `https://bebe-choice-llss40mu8-kdydesigns-projects.vercel.app`
  - Alias: `https://bebe-choice.vercel.app`
  - 확인 결과: `https://bebe-choice.vercel.app` `HTTP/2 200`

## 관련 문서

- 프로젝트 소개: [../../README.md](../../README.md)
- 제품 스펙: [../product-spec.md](../product-spec.md)
- UX 스펙: [../ux-spec.md](../ux-spec.md)
- 시스템 구조: [../architecture.md](../architecture.md)
- 기성제품 최저가 찾기 MVP 설계: [../shopping-product-search-mvp.md](../shopping-product-search-mvp.md)
- 구현 규칙: [../../AGENTS.md](../../AGENTS.md)
