# 베베 초이스 Vercel 호스팅 설계 문서

## 1. 문서 목적

이 문서는 **베베 초이스(Bebe Choice)** 프론트 웹앱을 **Vercel**에 배포하기 위한 현재 기준 설계를 정의한다.

현재 프로젝트의 실제 구현은 아래를 전제로 한다.

- Frontend: Vite + React + TypeScript + PWA
- Backend: Supabase
- Database: Supabase Postgres
- Auth: Supabase Auth (**Google 로그인 + 익명 체험**)
- Server-side Logic: Supabase Edge Functions

즉, 본 프로젝트는 프론트와 백엔드를 분리 배포한다.

- **Vercel** → 프론트 웹앱(PWA)
- **Supabase** → Auth / DB / Edge Functions / Storage

이 문서의 목적은 “실제로 모바일에서 접속 가능한 URL을 빠르게 배포하고, 로그인/식단 생성/저장 흐름이 정상 동작하도록 만드는 것”이다.

---

## 2. 현재 프로젝트 기준 요약

### 2.1 현재 앱 상태

- Google 로그인 지원
- 익명 체험 지원
- 익명 사용자 데이터의 로그인 계정 연결 지원
- 아이 프로필 CRUD 지원
- 식단 생성 / 저장 / 최근 이력 조회 지원
- PWA 지원 (`vite-plugin-pwa`)

### 2.2 현재 프론트 라우트

- `/login`
- `/`
- `/history`
- `/profile`

### 2.3 현재 프론트 런타임 env

실제 코드에서 읽는 env는 아래 두 개다.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

현재는 `VITE_APP_ENV`, `VITE_APP_URL`을 사용하지 않는다.

---

## 3. 배포 아키텍처

### 3.1 최종 권장 구조

```text
[사용자 브라우저 / 모바일]
        ↓
   Vercel Hosting
   (React PWA Frontend)
        ↓
 ┌───────────────────────────────┐
 │          Supabase             │
 │-------------------------------│
 │ Auth (Google / Anonymous)     │
 │ Postgres DB                   │
 │ Edge Functions                │
 │ Storage (optional)            │
 └───────────────────────────────┘
```

### 3.2 역할 분리

#### Vercel 역할

- React 앱 정적 빌드 배포
- HTTPS URL 제공
- 모바일 실기기 접속용 공개 URL 제공
- PWA 정적 자산 서빙
- 프론트 환경변수 주입

#### Supabase 역할

- 사용자 인증
- 아이 / 식단 / 이력 데이터 저장
- 식단 생성 로직 수행
- 재료 정규화 수행
- AI 생성 수행
- 익명 사용자 데이터 연결 수행

---

## 4. 환경 전략

### 4.1 현재 권장 운영안

초기 호스팅 목적은 빠른 실기기 검증이므로 아래를 기본값으로 한다.

- **Production 배포 우선**
- **현재 hosted Supabase 프로젝트 그대로 사용**

### 4.2 Preview 배포에 대한 현재 방침

Preview 배포는 선택 사항이다.

- UI 확인
- 모바일 브라우저 smoke test
- 정적 자산 / 라우팅 확인

위 용도로는 유용하지만, OAuth와 실데이터 검증은 우선 Production URL 기준으로 진행한다.

이유:

- Preview URL은 브랜치마다 달라질 수 있음
- Supabase Redirect URL 관리가 복잡해짐
- 현재 프로젝트 목적은 “빠르게 호스팅해서 모바일에서 실제로 확인”하는 것임

---

## 5. Git / 배포 전략

### 5.1 현재 권장 브랜치 전략

```text
main      → Production 배포
feature/* → 필요 시 Preview 배포
```

`develop` 브랜치는 필수는 아니다. 현재 repo 운영이 단순하면 `main + feature/*`로 충분하다.

### 5.2 Vercel 연동

- GitHub 저장소를 Vercel에 연결
- `main` push → Production 배포
- 필요 시 feature branch → Preview 배포

---

## 6. 프론트 빌드 설계

### 6.1 빌드 명령

현재 프로젝트 기준 실제 빌드 명령:

```bash
npm run build
```

실제 내용:

```bash
tsc --noEmit && vite build
```

### 6.2 산출물 디렉터리

```bash
dist
```

### 6.3 Vercel 프로젝트 설정

- Framework Preset: **Vite**
- Root Directory: 프로젝트 루트
- Build Command: `npm run build`
- Output Directory: `dist`

### 6.4 Node 버전

권장:

```text
Node.js 20 이상
```

로컬 / Vercel / CI에서 가급적 동일하게 맞춘다.

---

## 7. 환경변수 설계

### 7.1 필수 프론트 환경변수

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 7.2 설명

#### `VITE_SUPABASE_URL`

Supabase 프로젝트 URL

예시:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
```

#### `VITE_SUPABASE_ANON_KEY`

브라우저에서 사용하는 Supabase 공개 키

예시:

```env
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 7.3 프론트에 두면 안 되는 값

다음 값은 Vercel 프론트 env에 넣지 않는다.

```env
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GOOGLE_CLIENT_SECRET
```

이 값들은 Supabase secrets 또는 안전한 서버 환경에만 둔다.

---

## 8. Supabase 연동 설계

### 8.1 프론트에서 하는 일

프론트는 `supabase-js`를 사용한다.

허용 범위:

- 로그인 / 로그아웃
- 현재 세션 확인
- 본인 데이터 조회 / 저장
- Edge Function 호출

### 8.2 프론트에서 하면 안 되는 일

- OpenAI API 직접 호출
- service role 사용
- 관리자 권한 처리
- AI 결과 검증 로직을 브라우저에서 source of truth로 사용

### 8.3 주요 Edge Function 호출

- `generate-meal-plan`
- `normalize-ingredients`
- `link-anonymous-user`

---

## 9. Auth 설계

### 9.1 현재 지원 인증 방식

- Google 로그인
- 익명 체험

### 9.2 로그인 플로우

```text
사용자 → Vercel 프론트에서 로그인 버튼 클릭
       → Supabase Auth OAuth 이동
       → 로그인 완료
       → 배포 origin으로 복귀
       → 세션 복원
       → 필요 시 익명 사용자 데이터 연결
       → 앱 사용
```

### 9.3 현재 구현 기준 중요한 점

현재 코드는 별도 `/auth/callback` 라우트를 사용하지 않는다.

OAuth 복귀 주소는 다음 방식이다.

```ts
redirectTo: window.location.origin
```

즉, Supabase Redirect URLs에는 callback path가 아니라 **배포 origin 자체**를 등록해야 한다.

---

## 10. Supabase Redirect URL 설정

### 10.1 등록해야 하는 URL

#### 로컬 개발

```text
http://localhost:4173
```

단, 로컬에서 포트가 바뀌어 실행되면 실제 포트 기준으로 추가 등록이 필요할 수 있다.

#### Preview

```text
https://*.vercel.app
```

초기에는 Preview에서 OAuth까지 강하게 검증하지 않고, UI 확인 용도로 사용하는 것을 권장한다.

#### Production

```text
https://bebechoice.app
https://www.bebechoice.app
```

커스텀 도메인이 없으면 Vercel 기본 도메인을 등록한다.

### 10.2 URL Configuration 권장

Supabase Dashboard에서 아래를 점검한다.

- Site URL = Production 배포 URL
- Redirect URLs = 로컬 / Preview / Production 허용 URL 추가

---

## 11. React Router / SPA 라우팅 설계

### 11.1 문제

React Router 기반 SPA는 브라우저 새로고침 시 서버가 경로를 모르면 404가 날 수 있다.

현재 앱의 실제 보호 대상 경로:

- `/`
- `/history`
- `/profile`
- `/login`

### 11.2 해결 방식

루트에 `vercel.json`을 두고 모든 앱 경로를 `index.html`로 rewrite 한다.

예시:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 11.3 주의사항

PWA 정적 자산은 직접 접근 가능해야 한다.

예:

- `/manifest.webmanifest`
- `/sw.js`
- `/icons/app-icon.svg`

배포 후 이 경로들이 정상 응답하는지 반드시 확인한다.

---

## 12. PWA 배포 설계

### 12.1 현재 구현 방식

이 프로젝트는 `vite-plugin-pwa`를 사용한다.

즉, manifest와 service worker는 별도 수동 파일을 직접 관리하는 구조가 아니라, **Vite 빌드 설정에서 생성되는 구조**다.

### 12.2 현재 주요 설정 포인트

- `registerType: "autoUpdate"`
- `navigateFallback: "index.html"`
- `cleanupOutdatedCaches: true`
- 큰 이미지 자산 캐시 허용 크기 확장

### 12.3 배포 후 확인 항목

- `manifest.webmanifest` 정상 로드
- `sw.js` 정상 응답
- 홈 화면 설치 가능
- 앱 아이콘 정상 표시
- 새 버전 배포 후 서비스 워커 업데이트가 비정상적으로 꼬이지 않는지 확인

---

## 13. Edge Function / CORS 설계

### 13.1 목적

Vercel 도메인에서 Supabase Edge Functions를 호출할 때 CORS가 정상 동작해야 한다.

### 13.2 허용 origin 기준

#### 로컬

```text
http://localhost:4173
```

#### Preview

```text
https://*.vercel.app
```

#### Production

```text
https://bebechoice.app
https://www.bebechoice.app
```

### 13.3 구현 원칙

- OPTIONS preflight 대응
- 공통 CORS 헤더 처리
- 브라우저 호출 대상 함수 3종 모두 동일 정책 적용

---

## 14. 모바일 호스팅 QA 기준

### 14.1 배포 직후 필수 확인

- Production URL 접속 정상
- 모바일 Safari 정상
- 모바일 Chrome 정상
- `/login` 진입 정상
- `/`, `/history`, `/profile` 새로고침 정상

### 14.2 인증 흐름 확인

- Google 로그인 성공
- 로그인 후 세션 유지
- 로그아웃 정상
- 익명 체험 진입 성공
- 익명 사용 후 Google 로그인 시 데이터 연결 정상

### 14.3 기능 확인

- 아이 프로필 생성 / 수정 / 삭제
- 알레르기 입력
- 끼니별 재료 입력
- 식단 생성
- 식단 결과 확인
- 최근 이력 조회

### 14.4 PWA 확인

- `manifest.webmanifest` 응답 정상
- `sw.js` 응답 정상
- 앱 아이콘 정상
- 홈 화면 설치 가능

---

## 15. 배포 전 체크리스트

### 15.1 앱 빌드

- [ ] `npm run build` 성공
- [ ] `npm run test` 성공

### 15.2 Vercel 설정

- [ ] GitHub 저장소 연결
- [ ] Framework Preset = Vite
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`

### 15.3 환경변수

- [ ] `VITE_SUPABASE_URL` 설정
- [ ] `VITE_SUPABASE_ANON_KEY` 설정

### 15.4 Supabase Auth

- [ ] Google provider 활성화
- [ ] Site URL 설정
- [ ] Redirect URLs 설정

### 15.5 라우팅

- [ ] `vercel.json` rewrite 설정
- [ ] 새로고침 시 404 없음

### 15.6 Supabase 연결

- [ ] DB 연결 정상
- [ ] RLS 정상
- [ ] Edge Functions 호출 정상
- [ ] CORS 에러 없음

### 15.7 주요 기능

- [ ] 아이 프로필 생성 가능
- [ ] 알레르기 입력 가능
- [ ] 재료 입력 가능
- [ ] 식단 생성 가능
- [ ] 결과 화면 정상 표시
- [ ] 최근 이력 조회 가능

### 15.8 PWA

- [ ] manifest 로드 정상
- [ ] 서비스 워커 응답 정상
- [ ] 아이콘 정상
- [ ] 홈 화면 설치 가능

---

## 16. 권장 파일 구성

현재 호스팅 준비 관점에서 중요한 파일은 아래다.

```text
/
├─ vercel-hosting-design.md
├─ vercel.json
├─ .env.example
├─ vite.config.ts
├─ public/
│  └─ icons/
├─ src/
│  ├─ app/router.tsx
│  ├─ lib/env.ts
│  ├─ lib/supabase.ts
│  └─ ...
└─ supabase/
   └─ functions/
```

---

## 17. 실제 구현 순서

### Step 1. Vercel 프로젝트 생성

- GitHub 저장소 연결
- Vite preset 선택
- 기본 빌드 설정 확인

### Step 2. 환경변수 등록

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Step 3. SPA rewrite 설정

- `vercel.json` 추가
- 새로고침 404 방지

### Step 4. Supabase Auth URL 설정

- Site URL 등록
- Redirect URLs 등록
- Google provider 최종 점검

### Step 5. Production 배포

- `main` 기준 배포
- 공개 URL 확인

### Step 6. 모바일 실기기 QA

- iPhone Safari
- Android Chrome
- 로그인 / 익명 / 식단 생성 / 저장 / 최근 이력 확인

---

## 18. 후속 확장 항목

이번 호스팅 범위에는 필수는 아니지만, 이후 고려 가능한 항목이다.

- Preview 전용 Supabase 프로젝트 분리
- 커스텀 도메인 연결
- Sentry / PostHog 도입
- GitHub Actions로 build/test 선행 검증
- Kakao 로그인 재개 검토

---

## 19. 결론

현재 베베 초이스의 가장 현실적인 호스팅 구조는 아래다.

- **Vercel**
  - 프론트 SPA / PWA 호스팅
  - 모바일 실기기 접속용 공개 URL 제공

- **Supabase**
  - Google 로그인 / 익명 체험
  - DB
  - Edge Functions
  - AI 연동

이 구조는 현재 구현과 가장 잘 맞고, 추가 구조 변경 없이 바로 모바일 QA까지 이어갈 수 있다.
