# UX_SPEC.md

# Baby Meal Planner UX Specification
> 12개월 아이 하루 3끼 식단 추천 PWA  
> AI-assisted UI / UX / Design / Frontend Specification  
> For Codex CLI / JetBrains Air / ChatGPT / Frontend implementation

---

# 1. Document Purpose

이 문서는 **12개월 아이 하루 식단 추천 앱**의 UX/UI 설계 기준을 정의한다.

이 문서의 목적:
- 제품의 UX 방향을 일관되게 유지한다.
- AI 도구(Codex CLI / ChatGPT / Air)가 화면을 생성하거나 수정할 때 기준 문서로 사용한다.
- 디자이너와 개발자가 동일한 구조와 의도를 공유하도록 한다.
- 화면 구조, 디자인 시스템, 상태 처리, UX 원칙을 명확히 한다.

이 문서는 **기획 문서(product-spec)** 와 별개로,  
**사용자 경험(UX)과 화면 구조(UI) 구현 관점**에 집중한다.

---

# 2. Product Summary

## 2.1 Product Name
Baby Meal Planner

## 2.2 Product Goal
사용자가 보유한 재료를 아침/점심/저녁별로 입력하면,  
12개월 아이에게 적합한 하루 3끼 식단을 추천해주는 모바일 중심 앱이다.

## 2.3 Core User Problem
부모는 아래 문제를 자주 겪는다:
- 집에 있는 재료로 무엇을 만들 수 있을지 빠르게 떠올리기 어렵다.
- 아이 월령에 맞는 식단 구성이 어렵다.
- 하루 세끼를 균형 있게 짜는 것이 번거롭다.
- 알레르기 재료를 고려한 메뉴 선택이 부담된다.

## 2.4 UX Goal
사용자는 **1분 이내에** 아래 흐름을 완료할 수 있어야 한다:
1. 아이 선택
2. 끼니별 재료 입력
3. 식단 생성
4. 하루 식단 결과 확인

---

# 3. UX Design Principles

이 앱의 UX는 아래 원칙을 반드시 따른다.

## 3.1 Mobile First
- 모든 화면은 모바일 기준으로 설계한다.
- 데스크톱은 보조 환경으로만 고려한다.
- 한 손 사용이 가능한 인터랙션을 우선한다.

## 3.2 Clarity Over Decoration
- 화려함보다 **명확함**을 우선한다.
- 사용자는 “무엇을 해야 하는지” 즉시 이해할 수 있어야 한다.
- 시각적 요소는 기능을 보조해야 하며, 방해하면 안 된다.

## 3.3 Low Cognitive Load
- 사용자가 매 단계에서 **하나의 일**만 하도록 설계한다.
- 한 화면에 너무 많은 정보나 액션을 동시에 보여주지 않는다.
- 입력 흐름은 단순해야 한다.

## 3.4 Calm and Trustworthy
- 육아 앱 특성상 UI는 따뜻하고 안정적인 느낌이어야 한다.
- 과도하게 장난감 같은 디자인은 지양한다.
- “믿고 쓸 수 있는 도구”처럼 보여야 한다.

## 3.5 Reusable and Scalable
- 화면은 반복 가능한 컴포넌트 구조로 설계한다.
- UI 패턴은 일관되게 재사용되어야 한다.
- 향후 개월 수 확장, 주간 식단, 장보기 기능 추가가 가능해야 한다.

## 3.6 Safe by Design
- 알레르기 관련 UX는 명확하고 즉각적이어야 한다.
- 사용자가 위험 요소를 놓치지 않도록 시각적 피드백을 제공해야 한다.
- 안전 관련 경고는 항상 일반 정보보다 우선순위가 높다.

---

# 4. Target Users

## 4.1 Primary Users
- 12개월 전후 아이를 키우는 부모
- 아이 식단을 직접 준비하는 보호자
- 육아 중 시간이 부족한 사용자
- 앱 사용 숙련도가 높지 않은 사용자

## 4.2 User Context
사용자는 대체로 아래 상황에서 앱을 사용한다:
- 부엌/식탁/마트 등 실생활 중간
- 아이를 돌보는 중
- 빠르게 입력하고 바로 결과를 보고 싶어함
- 손이 자유롭지 않거나 집중 시간이 짧을 수 있음

## 4.3 UX Implication
따라서 UI는:
- 빠르게 읽히고
- 크게 누를 수 있으며
- 복잡한 설정 없이
- 즉시 반응해야 한다.

---

# 5. Brand / Visual Direction

## 5.1 Brand Tone
앱의 시각적/감성적 톤은 아래를 따른다:

- 따뜻함
- 안정감
- 청결함
- 신뢰감
- 부드러움
- 과하지 않은 귀여움

## 5.2 Avoid
다음 스타일은 피한다:
- 너무 장난감 같은 과도한 키즈앱 느낌
- 지나치게 화려한 애니메이션
- 과도한 일러스트 남용
- 텍스트보다 장식이 많은 화면
- 너무 많은 색상 혼합

## 5.3 Recommended Feel
권장 방향:
- 한국 육아 앱 느낌
- 파스텔 계열
- 여백이 넉넉한 카드형 UI
- 부드러운 둥근 모서리
- 읽기 쉬운 타이포그래피
- 감정적으로 차분한 화면

---

# 6. Design System Foundation

---

# 7. Color Tokens

아래는 권장 디자인 토큰이다.  
실제 구현에서는 Tailwind theme 또는 CSS variables 로 관리한다.

## 7.1 Core Palette

```css
--color-bg: #FFFDF8;
--color-surface: #FFFFFF;
--color-surface-soft: #F8F7F3;

--color-primary: #8BC6A2;
--color-primary-strong: #5FA57E;
--color-primary-soft: #EAF6EE;

--color-secondary: #F6D8AE;
--color-secondary-soft: #FFF4E5;

--color-warning: #F6B8A8;
--color-warning-soft: #FFF1EC;

--color-danger: #E97B7B;
--color-danger-soft: #FDECEC;

--color-success: #78C28A;
--color-success-soft: #ECF8F0;

--color-text: #2F3A33;
--color-text-muted: #6B7280;
--color-text-soft: #9CA3AF;

--color-border: #ECEAE4;
--color-divider: #F1EFE9;
```

## 7.2 Semantic Usage
- `primary`: 주요 CTA, 강조 텍스트, 선택 상태
- `secondary`: 보조 강조, 태그/하이라이트
- `warning`: 알레르기/주의/경고 메시지
- `danger`: 삭제/위험 액션
- `success`: 정상 처리/완료 상태
- `text`: 기본 본문
- `text-muted`: 보조 설명
- `surface`: 카드 배경
- `bg`: 앱 전체 배경

---

# 8. Typography Tokens

## 8.1 Typography Principles
- 모바일에서 읽기 쉬운 크기 우선
- 작은 글씨 남용 금지
- 제목/본문/설명 계층을 명확히 구분
- 줄간격은 답답하지 않게 유지

## 8.2 Recommended Scale

```text
Display: 28 / 32 / Bold
Heading 1: 24 / 30 / Bold
Heading 2: 20 / 28 / Semibold
Heading 3: 18 / 26 / Semibold
Body Large: 16 / 26 / Regular
Body: 15 / 24 / Regular
Body Small: 14 / 22 / Regular
Caption: 12 / 18 / Medium
Tag: 13 / 18 / Medium
Button: 15 / 22 / Semibold
```

## 8.3 Usage Rules
- 화면 제목: `Heading 1`
- 섹션 제목: `Heading 3`
- 본문 설명: `Body`
- 보조 설명/메타 정보: `Body Small`
- 태그/배지: `Tag`
- 버튼 텍스트: `Button`

---

# 9. Spacing Tokens

## 9.1 Base Spacing
```text
4, 8, 12, 16, 20, 24, 32
```

## 9.2 Recommended Usage
- 카드 내부 패딩: `16`
- 화면 좌우 패딩: `16`
- 섹션 간 간격: `16~24`
- 카드 간 간격: `12~16`
- 작은 요소 간 간격: `8`

---

# 10. Radius / Shadow Tokens

## 10.1 Radius
```text
sm: 8
md: 12
lg: 16
xl: 20
2xl: 24
pill: 999
```

## 10.2 Recommended Mapping
- 입력칸: `xl`
- 버튼: `xl`
- 카드: `2xl`
- 태그: `pill`
- 배지: `pill`

## 10.3 Shadows
```text
card:
0 1px 2px rgba(0,0,0,0.04),
0 6px 18px rgba(0,0,0,0.04)

floating:
0 8px 24px rgba(0,0,0,0.08)
```

원칙:
- 그림자는 매우 약하게 사용
- 과도한 입체감 금지
- “부드러운 깊이감”만 부여

---

# 11. Icon / Illustration Guidelines

## 11.1 Icon Style
- 라인 아이콘 또는 부드러운 filled icon 사용
- 너무 장난감 같은 아이콘은 피한다
- 기능 전달이 우선

추천 아이콘 범주:
- 아이 프로필
- 알레르기 경고
- 식재료 입력
- 식단 결과
- 히스토리
- 수정 / 삭제 / 추가

## 11.2 Illustration Usage
일러스트는 다음 위치에만 사용 권장:
- 로그인 / 온보딩 상단
- 빈 상태
- 결과 없음 상태
- 앱 아이콘 / PWA 아이콘
- 일부 안내 화면

## 11.3 Avoid
다음에는 일러스트를 남용하지 않는다:
- 재료 입력 메인 폼
- 결과 카드 내부
- 히스토리 리스트
- 폼 화면 대부분

---

# 12. Navigation Model

## 12.1 Core Navigation
앱의 기본 구조는 아래 흐름을 따른다:

1. 로그인
2. 아이 목록 / 선택
3. 식단 입력
4. 식단 결과
5. 히스토리
6. 아이 수정

## 12.2 Navigation Principle
- 사용자는 언제나 “지금 어디에 있는지” 알아야 한다.
- Back 동작은 자연스럽고 예측 가능해야 한다.
- 메인 흐름은 가능한 한 짧아야 한다.

## 12.3 Recommended Nav Structure
모바일 기준 권장:
- 상단 헤더 + 뒤로가기
- 핵심 액션은 화면 하단/하단 가까운 위치에 배치
- 전역 탭이 필요하면 추후 추가
- MVP에서는 복잡한 탭 구조보다 단순 라우팅 우선

---

# 13. Core User Flows

---

# 14. Flow 1 — Login / Entry

## Goal
사용자가 빠르게 앱에 진입한다.

## UX Requirements
- 로그인 옵션은 단순해야 한다.
- Google / Apple 로그인 버튼은 명확히 구분되어야 한다.
- 첫 진입 시 앱의 목적이 바로 이해되어야 한다.

## Screen Elements
- 앱 제목
- 짧은 소개 문구
- 상단 일러스트 (선택)
- Google 로그인 버튼
- Apple 로그인 버튼
- 개인정보/약관 안내 텍스트 (작게)

## UX Notes
- 설명은 길게 쓰지 않는다.
- “왜 이 앱이 필요한지”를 한 문장으로 전달한다.
- 버튼은 충분히 크게 제공한다.

---

# 15. Flow 2 — Child Profile Selection

## Goal
사용자가 식단을 만들 아이를 선택한다.

## UX Requirements
- 여러 아이가 있어도 쉽게 구분 가능해야 한다.
- 선택/수정/추가 액션이 명확해야 한다.
- 마지막 선택 아이는 기억되어야 한다.

## Screen Elements
- 화면 제목: 우리 아이
- 아이 카드 리스트
- 아이 이름
- 개월 수 또는 생년월일
- 알레르기 태그
- 선택 버튼
- 수정 버튼
- 새 아이 추가 버튼

## UX Notes
- 카드는 너무 복잡하지 않게 유지한다.
- 선택된 아이는 시각적으로 명확히 강조한다.

---

# 16. Flow 3 — Child Create / Edit

## Goal
사용자가 아이 프로필을 생성하거나 수정한다.

## UX Requirements
- 입력 항목은 최소화한다.
- 필수 항목과 선택 항목을 명확히 구분한다.
- 알레르기 입력은 태그형으로 쉽게 관리 가능해야 한다.

## Fields
- 이름
- 생년월일 또는 개월 수
- 알레르기 재료 태그

## UX Rules
- 입력 필드는 한 번에 이해 가능해야 한다.
- 저장 버튼은 항상 눈에 잘 띄어야 한다.
- 유효성 에러는 즉시 또는 저장 시 명확히 표시한다.

---

# 17. Flow 4 — Meal Input (Main Core Flow)

## Goal
사용자가 아침/점심/저녁 재료를 빠르게 입력한다.

## This is the most important screen in the product.

## UX Requirements
- 한 화면에서 하루 세끼 입력이 가능해야 한다.
- 각 끼니 구분이 매우 명확해야 한다.
- 태그 입력이 쉽고 빠르게 동작해야 한다.
- 알레르기 충돌이 즉시 감지되어야 한다.
- CTA는 강하게 보여야 한다.

## Required Sections
1. 선택된 아이 카드
2. 아침 재료 입력
3. 점심 재료 입력
4. 저녁 재료 입력
5. 알레르기 경고 영역
6. 식단 생성 버튼

## Layout Principle
- 세 끼니는 동일한 UI 패턴으로 반복한다.
- 입력 영역은 카드형 섹션으로 분리한다.
- 경고 영역은 일반 정보보다 시각적으로 더 잘 보여야 한다.
- CTA 버튼은 하단에서 쉽게 누를 수 있어야 한다.

## Tag Input UX Rules
- 재료는 태그 형태로 추가/삭제 가능해야 한다.
- 빠른 입력을 위해 자동완성 구조를 지원한다.
- 입력 완료 후 태그가 즉시 시각화되어야 한다.
- 삭제는 너무 어렵지 않아야 한다.

## Allergy UX Rules
- 사용자가 알레르기 재료를 입력하면 즉시 경고를 보여준다.
- 해당 재료는 추천 계산에서 제외된다는 메시지를 제공한다.
- 경고는 공격적이지 않지만 분명해야 한다.

## CTA Rules
- 버튼 문구 예시:
  - `하루 식단 생성하기`
  - `오늘 식단 추천받기`
- 버튼은 화면 내 가장 강한 시각적 우선순위를 가진다.

---

# 18. Flow 5 — Meal Result

## Goal
사용자가 생성된 하루 식단을 한눈에 이해한다.

## UX Requirements
- 아침/점심/저녁이 명확히 구분되어야 한다.
- 각 끼니 카드의 정보 계층이 명확해야 한다.
- 너무 많은 정보가 한 번에 부담스럽지 않아야 한다.
- “무엇을 만들면 되는지”가 바로 보여야 한다.

## Screen Structure
- 화면 제목
- 날짜 정보
- warning 영역 (있을 경우)
- 아침 카드
- 점심 카드
- 저녁 카드
- 다시 생성 / 재료 수정 CTA

## Meal Card Required Info
각 끼니 카드에는 아래를 표시한다:
- 끼니명
- 메뉴명
- 추천 문구
- 사용 재료
- 부족한 재료
- 대체 재료
- 조리법 3줄 요약
- fallback badge (필요 시)
- 주의사항 / 식감 안내 (필요 시)

## Information Hierarchy
우선순위는 아래 순서를 따른다:
1. 메뉴명
2. 추천 이유
3. 사용 가능한 재료
4. 부족한 재료
5. 대체 재료
6. 조리법 요약
7. 보조 정보

## UX Rules
- 카드 내부는 읽기 쉽게 섹션 분리한다.
- 긴 문장은 지양한다.
- “부족한 재료 없음” 같은 상태도 명확히 보여준다.
- fallback 은 사용자에게 불안하게 보이지 않도록 중립적으로 표현한다.

---

# 19. Flow 6 — Meal History

## Goal
사용자가 이전 식단 결과를 쉽게 다시 확인한다.

## UX Requirements
- 최신 결과가 먼저 보여야 한다.
- 날짜 기준 탐색이 쉬워야 한다.
- 각 기록은 너무 무겁지 않은 요약 카드로 표시한다.

## Screen Elements
- 화면 제목
- 날짜별 리스트
- 아이 이름(필요 시)
- 끼니별 메뉴 요약
- 상세 보기 진입

## UX Notes
- 리스트는 단순해야 한다.
- 카드 또는 섹션형 리스트를 권장한다.
- 사용자는 “오늘/최근/이전” 흐름으로 인지하기 쉽도록 정리한다.

---

# 20. Global UI Components

아래 컴포넌트는 제품 전반에서 재사용한다.

## 20.1 AppHeader
용도:
- 화면 제목
- 뒤로가기
- 선택적 보조 액션

## 20.2 ChildProfileCard
용도:
- 아이 이름 / 개월 수 / 알레르기 요약
- 선택 상태 표시

## 20.3 IngredientTagInput
용도:
- 재료 추가/삭제
- 자동완성 연결
- 태그 렌더링

## 20.4 WarningBanner
용도:
- 알레르기 경고
- 주의 메시지
- 시스템 경고

## 20.5 PrimaryButton
용도:
- 주요 CTA

## 20.6 SecondaryButton
용도:
- 보조 액션

## 20.7 MealCard
용도:
- 끼니 결과 카드

## 20.8 EmptyState
용도:
- 빈 목록 / 결과 없음

## 20.9 LoadingState / Skeleton
용도:
- 데이터 로딩 중 시각적 피드백

## 20.10 ErrorState
용도:
- 네트워크/시스템 실패 시 복구 유도

---

# 21. Interaction Rules

## 21.1 Tap Targets
- 모든 버튼과 인터랙티브 요소는 모바일에서 누르기 쉬워야 한다.
- 작은 텍스트 링크만으로 주요 액션을 제공하지 않는다.

## 21.2 Input Feedback
- 입력 즉시 반응해야 한다.
- 사용자가 입력한 결과가 즉시 시각적으로 반영되어야 한다.

## 21.3 Button States
버튼은 아래 상태를 지원한다:
- default
- pressed
- disabled
- loading

## 21.4 Loading UX
로딩 시 사용자는 기다리는 이유를 이해할 수 있어야 한다.

예:
- `식단을 만드는 중이에요`
- `아이에게 맞는 메뉴를 찾고 있어요`

## 21.5 Success UX
성공 시 과도한 축하보다 **부드러운 완료 피드백**을 준다.

예:
- `오늘 식단이 준비됐어요`
- `추천 결과를 확인해보세요`

---

# 22. States Specification

각 주요 화면은 아래 상태를 반드시 고려한다.

---

# 23. Empty States

## 23.1 No Child Yet
상황:
- 등록된 아이가 없음

표시:
- 안내 일러스트 (선택)
- 짧은 설명
- `아이 추가하기` CTA

## 23.2 No Meal History
상황:
- 식단 히스토리가 없음

표시:
- 간단한 빈 상태 UI
- `오늘 식단 만들기` CTA

## 23.3 No Result / Low Match
상황:
- 재료 조합이 너무 부족해 적절한 결과가 적음

표시:
- 부족한 재료 안내
- 재료 추가 유도
- 다시 시도 CTA

---

# 24. Loading States

## 24.1 Meal Generation Loading
상황:
- 식단 생성 요청 중

표시:
- 스켈레톤 또는 진행 느낌 UI
- 과도한 spinner 남용보다 의미 있는 문구 사용

예시 문구:
- `아침, 점심, 저녁 메뉴를 찾는 중이에요`
- `입력한 재료를 바탕으로 추천 중이에요`

## 24.2 List Loading
상황:
- 아이 목록 / 히스토리 로딩 중

표시:
- 카드 스켈레톤

---

# 25. Error States

## 25.1 Network Error
표시:
- `연결 상태를 확인하고 다시 시도해주세요`
- `다시 시도` 버튼

## 25.2 Generation Failed
표시:
- `식단 생성 중 문제가 발생했어요`
- `다시 생성하기` 버튼
- 가능하면 마지막 입력 유지

## 25.3 Validation Error
표시:
- 어떤 입력이 잘못되었는지 명확히 알려준다.
- 에러는 필드 가까이에 표시한다.

---

# 26. Accessibility Requirements

이 앱은 반드시 기본 접근성을 고려해야 한다.

## 26.1 Text Contrast
- 텍스트와 배경은 충분한 대비를 가져야 한다.
- 경고 배경 위 텍스트도 읽기 쉬워야 한다.

## 26.2 Touch Accessibility
- 버튼/태그/입력 삭제 액션은 충분히 누르기 쉬워야 한다.

## 26.3 Semantic Labels
- 모든 버튼/입력은 의미 있는 label/aria-label을 가져야 한다.
- 아이콘 단독 버튼은 label 필수

## 26.4 Readability
- 너무 작은 글씨 사용 금지
- 지나치게 연한 텍스트 지양

## 26.5 Motion
- 애니메이션은 최소화하고, 필수일 때만 사용
- 정보 전달에 도움이 되지 않는 모션은 제거

---

# 27. Motion Guidelines

## 27.1 Principle
모션은 “예쁨”보다 “이해”를 돕기 위해 사용한다.

## 27.2 Allowed Motion
- 카드 진입 시 가벼운 fade/slide
- 버튼 누름 상태
- 태그 추가/삭제 미세 애니메이션
- 페이지 전환의 부드러운 감각

## 27.3 Avoid
- 튀는 바운스
- 과도한 스케일 변화
- 화면 전체를 흔드는 모션
- 장식용 과한 transition

---

# 28. AI-Assisted Design Workflow

이 프로젝트에서 AI는 아래 역할로 사용한다.

## 28.1 AI Allowed Tasks
- 화면 구조 제안
- UI 시안 생성
- React 컴포넌트 코드 생성
- Tailwind 스타일 생성
- 빈 상태/일러스트 프롬프트 생성
- 카피라이팅 초안 생성

## 28.2 AI Not Responsible For
- 최종 UX 판단 전권
- 안전 정책 판단
- 제품 흐름의 핵심 의사결정
- 알레르기 관련 안전 정책 변경

## 28.3 AI Output Rule
AI가 생성하는 UI는 반드시 아래를 만족해야 한다:
- 모바일 퍼스트
- 카드형 구조
- 디자인 토큰 일관성
- 재사용 가능한 컴포넌트 구조
- 접근성 고려
- 복잡한 스타일보다 구조 우선

---

# 29. AI Prompt Templates

아래 프롬프트는 AI UI 생성용 기본 템플릿이다.

---

# 30. Prompt Template — Screen UX Planning

```text
You are designing the UX for a mobile-first baby meal planner app for parents of a 12-month-old child.

Please design the screen structure for: [SCREEN_NAME]

Requirements:
- mobile-first
- one-hand friendly
- clean and calm Korean parenting app feel
- card-based layout
- low cognitive load
- warm but trustworthy
- simple, readable, practical

Please provide:
1. screen goal
2. information hierarchy
3. required sections
4. main CTA
5. edge cases
6. loading / empty / error states
```

---

# 31. Prompt Template — UI Visual Design

```text
Design a mobile-first UI for a baby meal planner app.

Screen:
[SCREEN_NAME]

Style:
- soft pastel
- clean and minimal
- warm Korean parenting app aesthetic
- rounded cards
- calm and trustworthy
- highly readable on mobile

Must include:
[SCREEN_ELEMENTS]

Rules:
- use clear visual hierarchy
- keep touch targets large
- avoid clutter
- prioritize usability over decoration
```

---

# 32. Prompt Template — React Component Generation

```text
Create a React + TypeScript + Tailwind component for [COMPONENT_NAME].

Requirements:
- mobile-first
- reusable
- accessible
- clean and minimal
- aligned with a calm parenting app design system
- rounded cards, soft colors, readable spacing
- no overcomplicated animation
- TypeScript strict-safe

Include:
- props typing
- loading/empty/error handling if relevant
- semantic HTML
```

---

# 33. Prompt Template — Illustration Generation

```text
Create a soft pastel illustration for a baby meal planner app.

Use case:
[USE_CASE]

Style:
- Korean parenting app illustration
- clean vector style
- warm pastel colors
- minimal and trustworthy
- suitable for mobile UI
```

---

# 34. Screen-by-Screen UX Spec

---

# 35. LoginPage Spec

## Goal
사용자가 앱의 목적을 이해하고 빠르게 로그인한다.

## Must Have
- 앱 소개 헤드라인
- 짧은 설명
- Google 로그인
- Apple 로그인
- 선택적 상단 일러스트

## CTA Priority
1. Google 로그인
2. Apple 로그인

## UX Tone
- 친절하지만 과하지 않게
- “바로 시작 가능”한 느낌

---

# 36. ChildListPage Spec

## Goal
사용자가 식단을 만들 아이를 선택한다.

## Must Have
- 아이 리스트
- 이름 / 개월 수
- 알레르기 태그
- 선택 버튼
- 수정 버튼
- 새 아이 추가 버튼

## CTA Priority
1. 아이 선택
2. 새 아이 추가
3. 수정

---

# 37. ChildFormPage Spec

## Goal
아이 정보를 쉽게 등록/수정한다.

## Must Have
- 이름 입력
- 생년월일 또는 개월 수
- 알레르기 태그 입력
- 저장 버튼

## UX Notes
- 폼은 짧고 부담 없어야 한다.
- 저장 버튼은 항상 명확해야 한다.

---

# 38. MealPlannerPage Spec

## Goal
사용자가 아침/점심/저녁 재료를 빠르게 입력하고 식단을 생성한다.

## Must Have
- 선택된 아이 카드
- 아침 입력 섹션
- 점심 입력 섹션
- 저녁 입력 섹션
- 알레르기 경고 배너
- 식단 생성 버튼

## Most Important UX Requirements
- 세 끼니 구조가 즉시 이해되어야 함
- 태그 입력이 편해야 함
- CTA가 명확해야 함
- 안전 경고가 눈에 띄어야 함

---

# 39. MealPlanResultPage Spec

## Goal
생성된 하루 식단을 빠르게 이해하고 바로 활용한다.

## Must Have
- 날짜
- warning 영역
- 아침 카드
- 점심 카드
- 저녁 카드
- 재생성 / 재료 수정 버튼

## Card Must Have
- 메뉴명
- 추천 문구
- 사용 재료
- 부족한 재료
- 대체 재료
- 조리법 3줄
- fallback 표시

---

# 40. MealPlanHistoryPage Spec

## Goal
이전 식단을 날짜 기준으로 쉽게 다시 본다.

## Must Have
- 날짜 리스트
- 요약 카드
- 상세 진입

## UX Notes
- 최신 결과 우선
- 너무 복잡한 필터는 MVP에서 제외

---

# 41. Frontend Implementation Rules

## 41.1 Preferred Stack
- React
- TypeScript
- Tailwind CSS
- React Router
- React Query
- Zustand

## 41.2 UI Implementation Rules
- UI는 반드시 컴포넌트 단위로 나눈다.
- 같은 패턴은 중복 구현하지 않는다.
- Tailwind class 난립보다 재사용 가능한 패턴을 우선한다.
- 공통 스타일은 토큰/variant 기반으로 관리한다.

## 41.3 Recommended Component Categories
```text
components/
  common/
  child/
  ingredient/
  meal/
  auth/
```

## 41.4 State Handling
- 서버 데이터: React Query
- 로컬 선택/드래프트: Zustand 또는 localStorage wrapper
- UI-only 상태는 로컬 컴포넌트 state

---

# 42. Non-Goals

이 문서는 아래를 다루지 않는다:
- DB 스키마 상세
- AI 프롬프트 안전 정책 상세
- 서버 함수 구현 상세
- 추천 알고리즘 상세
- 인증/권한 세부 로직

이는 별도 product spec / technical spec 에서 관리한다.

---

# 43. Final UX Quality Checklist

AI 또는 개발자가 UI를 생성/수정할 때 아래를 반드시 체크한다.

## 43.1 Usability
- [ ] 첫 사용자가 이해 가능한가?
- [ ] 한 손으로 조작 가능한가?
- [ ] 입력 흐름이 짧은가?
- [ ] CTA가 명확한가?

## 43.2 Clarity
- [ ] 화면 목적이 즉시 이해되는가?
- [ ] 정보 우선순위가 명확한가?
- [ ] 텍스트가 너무 많지 않은가?

## 43.3 Safety
- [ ] 알레르기 관련 경고가 충분히 명확한가?
- [ ] 사용자가 위험 정보를 놓칠 가능성이 낮은가?

## 43.4 Consistency
- [ ] 동일한 카드/버튼/태그 패턴을 재사용하는가?
- [ ] 색상/타이포/간격이 일관적인가?

## 43.5 Implementation Readiness
- [ ] 컴포넌트로 분리 가능한 구조인가?
- [ ] Tailwind / React로 구현하기 쉬운가?
- [ ] 상태별 UI가 정의되어 있는가?

---

# 44. One-Line UX Definition

**“육아 중 바쁜 보호자가 집에 있는 재료만으로 12개월 아이의 하루 세끼 식단을 빠르고 안전하게 만들 수 있도록 돕는, 따뜻하고 신뢰감 있는 모바일 퍼스트 UX.”**