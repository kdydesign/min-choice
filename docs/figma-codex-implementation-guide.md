# Figma → Codex 구현 가이드
_Bebe Choice 프로젝트 전용_

## 현재 디자인 기준

- 현재 Figma 디자인 버전: `v38`

## 문서 목적

이 문서는 Bebe Choice 프로젝트에서 Figma 디자인을 Codex + MCP 기반으로 실제 UI 코드에 구현할 때, 일관된 방식으로 작업하기 위한 기준 문서입니다.

이 문서의 목적은 다음과 같습니다.

- Figma 노드와 실제 프로젝트 파일 구조를 안정적으로 연결합니다.
- 공통 컴포넌트와 페이지 컴포넌트의 책임을 명확히 합니다.
- Figma MCP 사용 시 반복되는 구현 오류를 줄입니다.
- 디자인 fidelity를 높이면서도 프로젝트 구조를 유지합니다.
- 향후 Codex가 문맥을 잃지 않고 같은 규칙으로 작업하도록 돕습니다.

## 관련 문서

- 구현 규칙: [../AGENTS.md](../AGENTS.md)
- 제품 스펙: [./product-spec.md](./product-spec.md)
- UX 기준: [./ux-spec.md](./ux-spec.md)
- 시스템 구조: [./architecture.md](./architecture.md)

---

## 1. 프로젝트 구현 원칙

### 1.1 핵심 원칙

- 디자인 기준은 Figma입니다.
- 파일 구조 기준은 현재 프로젝트 구조입니다.
- Figma 구조를 그대로 코드 파일 구조로 옮기지 않습니다.
- 역할과 책임 기준으로 컴포넌트를 나눕니다.

즉:

- **Figma** = 시각적 기준
- **Codex** = 구현
- **현재 프로젝트 구조** = 운영 기준

### 1.2 구현 우선순위

Codex는 아래 우선순위로 판단해야 합니다.

1. 현재 프로젝트 구조 유지
2. 기존 공통 컴포넌트 재사용 우선
3. 필요한 경우에만 새 공통 컴포넌트 생성
4. Figma 디자인 fidelity 유지
5. 비즈니스 로직 최소 변경

### 1.3 스타일 구현 원칙

현재 프로젝트는 Tailwind가 아니라 **기존 CSS 클래스 + `src/styles/global.css` 기반 스타일 시스템**을 사용합니다.

따라서:

- Figma MCP가 React + Tailwind 형태의 예시를 주더라도 그대로 복사하지 않습니다.
- 반드시 현재 프로젝트의 CSS 구조와 클래스 네이밍으로 변환합니다.
- 반복되는 시각 규칙은 `global.css`에 정리하고, 페이지 안에 인라인 스타일을 남발하지 않습니다.

---

## 2. 프로젝트 구조 기준

현재 프로젝트는 아래 구조를 기준으로 유지합니다.

```txt
src/
  app/         = 라우터, providers, 앱 설정
  pages/       = 화면 단위
  components/  = 공통 UI 컴포넌트
  features/    = 도메인 로직
  lib/         = 외부 클라이언트 및 공용 유틸
  services/    = 브라우저 저장소, 보조 서비스
  styles/      = 전역 스타일
```

### 2.1 파일 책임

- `pages/`
  - 라우트 단위 화면
  - 화면 조합과 라우팅 책임만 가집니다.
- `components/`
  - 여러 페이지에서 재사용되는 공통 UI
- `features/`
  - 도메인별 컴포넌트, API, 타입, 검증, 로직
- `app/`
  - 라우터, 전역 Provider, 앱 초기 설정

### 2.2 금지 사항

- Figma 레이어 구조를 그대로 파일 구조로 옮기기
- 페이지 안에 공통 UI를 중복 구현하기
- 기존 구조와 별개로 새로운 병렬 구조 만들기
- 시안이 바뀔 때마다 페이지를 처음부터 갈아엎기

---

## 3. Figma MCP 사용 규칙

### 3.1 노드의 의미

Figma Dev Mode의 각 노드 URL은 “그 노드를 Codex가 읽을 수 있게 해주는 참조 링크”입니다.  
노드는 단순 구현 대상이 아니라 **디자인 문맥 단위**로 사용해야 합니다.

### 3.2 노드 분류 규칙

#### 페이지 노드

화면 전체 레이아웃 기준입니다.

예:
- 로그인 페이지
- 하루 식단 페이지
- 최근 식단 페이지

#### 공통 컴포넌트 노드

재사용 가능한 UI 기준입니다.

예:
- 헤더
- 하단 메뉴
- 아이 선택 카드
- 최근 식단 카드
- 재료 입력 카드
- 식단 생성 프로그레스

#### 상태 / 세부 노드

특정 상호작용 또는 UI 상태 기준입니다.

예:
- 재료 추가 버튼
- 버튼 클릭 후 상태
- 로딩 / 프로그레스 상태
- 팝업 상태

### 3.3 Codex에게 항상 함께 알려줘야 하는 것

Figma 노드 URL만 전달하면 안 됩니다.  
항상 아래 정보를 같이 전달해야 합니다.

- 이 노드가 페이지인지
- 공통 컴포넌트인지
- 상태 표현용 노드인지
- 프로젝트 안에서 어디에 들어가는지
- 기존 구조 안에서 어떻게 재사용해야 하는지

---

## 4. 페이지 및 Figma 노드 매핑

### 4.1 로그인 페이지

- 역할: 로그인 화면
- 프로젝트 매핑: [`src/pages/login-page.tsx`](../src/pages/login-page.tsx)
- 관련 도메인 컴포넌트: [`src/features/auth/components/auth-action-button.tsx`](../src/features/auth/components/auth-action-button.tsx)

Figma:
- 로그인 페이지: `5:13`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=5-13&m=dev>

### 4.2 우리아이선택 페이지

- 역할: 아이 선택 / 프로필 관리 화면
- 프로젝트 매핑: [`src/pages/profile-page.tsx`](../src/pages/profile-page.tsx)
- 관련 컴포넌트:
  - [`src/features/children/components/child-profiles-section.tsx`](../src/features/children/components/child-profiles-section.tsx)
  - [`src/features/children/components/child-selection-card.tsx`](../src/features/children/components/child-selection-card.tsx)

Figma:
- 우리아이선택 페이지: `5:35`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=5-35&m=dev>

### 4.3 하루 식단 페이지

- 역할: 재료 입력 / 식단 생성 준비 화면
- 프로젝트 매핑:
  - 페이지: [`src/pages/home-page.tsx`](../src/pages/home-page.tsx)
  - 입력 섹션: [`src/features/meal-plans/components/meal-input-section.tsx`](../src/features/meal-plans/components/meal-input-section.tsx)
  - 재료 카드: [`src/features/meal-plans/components/meal-ingredient-card.tsx`](../src/features/meal-plans/components/meal-ingredient-card.tsx)

최신 기준 Figma:
- 하루 식단 페이지: `25:1461`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=25-1461&m=dev>

이전 / 참고 노드:
- 하루 식단 페이지(이전): `1:2`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-2&m=dev>
- 하루 식단 페이지(참고): `1:3`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-3&m=dev>

### 4.4 최근 식단 페이지

- 역할: 최근 식단 히스토리 화면
- 프로젝트 매핑:
  - 페이지: [`src/pages/history-page.tsx`](../src/pages/history-page.tsx)
  - 리스트 섹션: [`src/features/meal-plans/components/meal-history-section.tsx`](../src/features/meal-plans/components/meal-history-section.tsx)
  - 카드: [`src/features/meal-plans/components/meal-history-card.tsx`](../src/features/meal-plans/components/meal-history-card.tsx)

Figma:
- 최근 식단 페이지: `11:677`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=11-677&m=dev>

### 4.5 오늘의 식단 페이지

- 역할: 생성 결과 / 오늘의 식단 결과 화면
- 프로젝트 매핑:
  - 결과 컴포넌트: [`src/features/meal-plans/components/today-meal-result-screen.tsx`](../src/features/meal-plans/components/today-meal-result-screen.tsx)
  - 라우트 진입점은 [`src/pages/home-page.tsx`](../src/pages/home-page.tsx) 내부 상태 전환으로 유지

Figma:
- 오늘의 식단 페이지: `5:511`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=5-511&m=dev>

> 주의: 현재 프로젝트는 “하루 식단 입력”과 “오늘의 식단 결과”를 별도 route로 나누지 않고, `home-page` 내부 상태 전환으로 처리합니다.

---

## 5. 공통 컴포넌트 기준

### 5.1 헤더 컴포넌트

- 역할: 상단 공통 헤더
- 공통 컴포넌트로 유지
- 페이지 안에 중복 구현 금지
- 실제 파일: [`src/components/common-header.tsx`](../src/components/common-header.tsx)

Figma:
- 헤더 컴포넌트: `1:83`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-83&m=dev>

### 5.2 하단 메뉴 컴포넌트

- 역할: 하단 공통 네비게이션
- 공통 컴포넌트로 유지
- 페이지 안에 중복 구현 금지
- 실제 파일: [`src/components/common-bottom-menu.tsx`](../src/components/common-bottom-menu.tsx)

Figma:
- 하단 메뉴 컴포넌트: `1:93`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-93&m=dev>

### 5.3 아이 선택 카드 컴포넌트

- 역할: 아이 선택 / 표시용 카드
- 공통 카드 컴포넌트 후보
- 실제 파일: [`src/features/children/components/child-selection-card.tsx`](../src/features/children/components/child-selection-card.tsx)

Figma:
- 아이 선택 카드 컴포넌트: `5:147`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=5-147&m=dev>

### 5.4 최근 식단 카드 컴포넌트

- 역할: 최근 식단 히스토리 카드
- 공통 카드 컴포넌트 후보
- 실제 파일: [`src/features/meal-plans/components/meal-history-card.tsx`](../src/features/meal-plans/components/meal-history-card.tsx)

Figma:
- 최근 식단 카드 컴포넌트: `11:679`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=11-679&m=dev>

---

## 6. 하루 식단 페이지 관련 공통 컴포넌트

### 6.1 재료 입력 카드 컴포넌트

아침 / 점심 / 저녁 재료 입력 UI는 가능하면 각각 별도 컴포넌트 3개로 만들지 말고, 하나의 공통 재료 입력 카드 컴포넌트로 구현합니다.

실제 파일:
- [`src/features/meal-plans/components/meal-ingredient-card.tsx`](../src/features/meal-plans/components/meal-ingredient-card.tsx)

예상 책임:
- `title`
- `mealType`
- `ingredients`
- `placeholder`
- 경고 태그
- 입력 상태 표현

### 6.2 아침 재료 컴포넌트

최신 기준:
- 아침 재료 컴포넌트: `25:1475`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=25-1475&m=dev>

이전 기준:
- 아침 재료 컴포넌트: `1:15`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-15&m=dev>

### 6.3 점심 재료 컴포넌트

최신 기준:
- 점심 재료 컴포넌트: `25:1499`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=25-1499&m=dev>

이전 기준:
- 점심 재료 컴포넌트: `1:35`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-35&m=dev>

### 6.4 저녁 재료 컴포넌트

최신 기준:
- 저녁 재료 컴포넌트: `25:1519`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=25-1519&m=dev>

이전 기준:
- 저녁 재료 컴포넌트: `1:55`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=1-55&m=dev>

### 6.5 재료 추가 버튼

- 역할: 재료 입력 카드 내부 액션 UI
- 독립 재사용 요소 또는 카드 내부 공통 요소로 유지
- 현재 구현은 [`src/components/tag-input.tsx`](../src/components/tag-input.tsx) 안의 `dashed-add` 상태로 관리

Figma:
- 재료 추가 버튼: `25:1495`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=25-1495&m=dev>

### 6.6 재료 추가 버튼 클릭 후 상태

- 역할: 재료 입력 카드의 상태 변화 UI
- 단순 참고가 아니라 실제 상태 표현으로 반영해야 함
- 현재 구현은 `TagInput` 내부의 접힘 / 펼침 상태로 처리

Figma:
- 재료 추가 버튼 클릭 후 상태: `25:1593`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=25-1593&m=dev>

---

## 7. 식단 생성 / 식단 준비 프로그레스 컴포넌트

### 7.1 식단 준비 프로그레스(이전)

Figma:
- 식단 준비 프로그레스: `18:1031`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=18-1031&m=dev>

### 7.2 식단 생성 프로그레스(최신)

기존 블록형 / 인라인형 구조가 아니라 **레이어드 팝업 구조**로 변경되었습니다.  
즉, 기존 컴포넌트의 역할은 유지하되 UI 표현 구조는 팝업형으로 변경해야 합니다.

실제 파일:
- [`src/features/meal-plans/components/meal-generation-progress.tsx`](../src/features/meal-plans/components/meal-generation-progress.tsx)

Figma:
- 식단 생성 프로그레스(최신): `21:1270`
  - <https://www.figma.com/design/bQjUoNh2muMADHoYQUppHV/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=21-1270&m=dev>

구현 원칙:
- 역할은 유지
- 구조는 팝업형으로 변경 가능
- 상태 흐름은 유지
- 페이지에 하드코딩하지 않고 공통 컴포넌트로 유지

---

## 8. 공통 레이아웃 규칙

### 8.1 헤더와 하단 메뉴 고정 규칙

헤더와 하단 메뉴는 스크롤 시 함께 움직이면 안 됩니다.

필수 동작 규칙:

- 헤더는 화면 상단 고정
- 하단 메뉴는 화면 하단 고정
- 실제 스크롤은 본문 콘텐츠 영역만
- 모바일 앱처럼 `상단 고정 헤더 + 하단 고정 메뉴 + 가운데 콘텐츠만 스크롤` 구조 유지

### 8.2 레이아웃 구현 원칙

Codex는 특정 페이지 임시 수정이 아니라, 가능하면 **공통 레이아웃 구조 차원에서 해결**해야 합니다.

필수 체크:

- 헤더 항상 노출
- 하단 메뉴 항상 노출
- 본문만 스크롤
- 콘텐츠가 헤더 아래 / 하단 메뉴 위에 가려지지 않음
- 모바일 safe area 고려

현재 구현 기준:

- 공통 헤더: [`src/components/common-header.tsx`](../src/components/common-header.tsx)
- 공통 하단 메뉴: [`src/components/common-bottom-menu.tsx`](../src/components/common-bottom-menu.tsx)
- 페이지 루트 및 스크롤 레이아웃: [`src/styles/global.css`](../src/styles/global.css)

---

## 9. Codex 작업 방식 규칙

### 9.1 기본 작업 순서

새 페이지 또는 큰 UI 변경 시 아래 순서를 권장합니다.

1. 분석
2. 구현
3. 보정
4. 필요 시 공통 컴포넌트 추출
5. 필요 시 재보정

### 9.2 공통 컴포넌트를 빼먹었을 때

전체를 다시 하지 않습니다.

원칙:

- 빠진 공통 컴포넌트만 후처리로 추출
- 관련 페이지에 연결
- 필요한 부분만 가볍게 재보정

즉:

- 전체 재구현 ❌
- 누락 컴포넌트 후처리 추가 ✅

### 9.3 디자인이 원하는 대로 반영되지 않을 때

단순 보정으로 해결되지 않으면 아래처럼 판단합니다.

#### 보정으로 해결 가능한 경우

- spacing
- typography
- alignment
- component sizing
- padding / margin
- visual hierarchy

#### 재구현 / 재정렬이 필요한 경우

- 페이지 구조 자체가 Figma와 다름
- 공통 컴포넌트 연결이 잘못됨
- wrapper / layout이 디자인을 덮어씀
- 상태 변화 UI가 반영되지 않음

---

## 10. Codex가 항상 지켜야 할 구현 규칙

### 10.1 구조 규칙

- 기존 프로젝트 구조 유지
- 페이지 안에 공통 UI 중복 구현 금지
- 공통 컴포넌트는 반드시 분리
- 기존 유사 컴포넌트가 있으면 통합 우선 검토

### 10.2 스타일 규칙

- 현재 프로젝트의 스타일링 방식을 따릅니다.
- Tailwind를 새로 도입하지 않습니다.
- Figma 디자인을 최대한 충실하게 반영합니다.
- 반복되는 값은 재사용 가능하게 정리합니다.
- 시각 보정은 먼저 공통 컴포넌트와 wrapper/layout 기준으로 검토합니다.

### 10.3 로직 규칙

- 비즈니스 로직 최소 수정
- 상태 흐름 유지
- UI 구조 / 표현 위주 수정
- 임시 데모 코드처럼 만들지 않음

### 10.4 작업 시 필수 점검 항목

Codex는 구현 전후로 아래를 반드시 점검해야 합니다.

- 현재 페이지가 실제로 어떤 컴포넌트를 렌더링하는지 확인했는가
- 페이지 안에 예전 마크업이 남아 있지 않은가
- wrapper / layout / global CSS가 새 디자인을 덮어쓰고 있지 않은가
- 공통 컴포넌트로 분리할 수 있는 요소를 페이지 안에 중복 구현하지 않았는가
- build 기준으로 최소 검증을 마쳤는가

---

## 11. 현재 구현 기준 참고 컴포넌트

주요 공통 UI:

- [`src/components/common-header.tsx`](../src/components/common-header.tsx)
- [`src/components/common-bottom-menu.tsx`](../src/components/common-bottom-menu.tsx)
- [`src/components/tag-input.tsx`](../src/components/tag-input.tsx)

주요 도메인 컴포넌트:

- [`src/features/auth/components/auth-action-button.tsx`](../src/features/auth/components/auth-action-button.tsx)
- [`src/features/children/components/child-selection-card.tsx`](../src/features/children/components/child-selection-card.tsx)
- [`src/features/children/components/child-profiles-section.tsx`](../src/features/children/components/child-profiles-section.tsx)
- [`src/features/meal-plans/components/meal-input-section.tsx`](../src/features/meal-plans/components/meal-input-section.tsx)
- [`src/features/meal-plans/components/meal-ingredient-card.tsx`](../src/features/meal-plans/components/meal-ingredient-card.tsx)
- [`src/features/meal-plans/components/meal-history-card.tsx`](../src/features/meal-plans/components/meal-history-card.tsx)
- [`src/features/meal-plans/components/meal-generation-progress.tsx`](../src/features/meal-plans/components/meal-generation-progress.tsx)
- [`src/features/meal-plans/components/today-meal-result-screen.tsx`](../src/features/meal-plans/components/today-meal-result-screen.tsx)

---

## 12. 문서 유지 원칙

- 이 문서는 Figma 노드와 실제 구현 파일 사이의 연결 규칙을 기록합니다.
- 새로운 Figma 노드를 도입했으면 여기에도 최신 기준을 추가합니다.
- 기존 노드가 더 이상 기준이 아니면 “참고” 또는 “이전 기준”으로 낮춥니다.
- 실제 구현 파일이 바뀌면 링크도 함께 갱신합니다.
