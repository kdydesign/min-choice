# 12개월 아이 하루 식단표

`product-spec.md`와 `AGENTS.md`를 기준으로 리팩토링한 모바일 우선 PWA MVP입니다.

## 현재 구현 범위

- React + TypeScript + Vite 기반 PWA
- 아이 프로필 생성, 수정, 삭제, 선택
- 아이별 알레르기 재료 관리
- 아침 / 점심 / 저녁 재료 태그 입력
- 규칙 기반 메뉴 후보 선택
- fallback 설명 문구, 조리법 3줄, 부족 재료 / 대체 재료 생성
- 하루 3끼 식단 생성과 아이별 최근 이력 확인

## 실행

```bash
npm install
npm run serve
```

기본 개발 주소는 `http://localhost:4173`입니다.

## 구조

- `src/app`: 앱 엔트리, 라우터, 프로바이더
- `src/pages`: 라우트 단위 페이지
- `src/components`: 공용 UI 컴포넌트
- `src/features`: 도메인별 기능
- `src/services`: 브라우저 저장소 등 인프라성 유틸
- `src/store`: Zustand 상태
- `src/types`: 도메인 타입

## 참고

현재 버전은 MVP 범위에 맞춘 프론트엔드 중심 구현입니다. 로그인, Supabase, Edge Functions, 실제 서버 AI 호출은 아직 연결하지 않았고, 이후 확장 가능하도록 구조만 분리해 두었습니다.
