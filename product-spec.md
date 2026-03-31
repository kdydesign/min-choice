# 12개월 아이 하루 식단표 생성 앱 스펙

## 1. 프로젝트 개요

### 1.1 프로젝트명

12개월 아이 하루 식단표 생성 모바일 앱

### 1.2 목적

사용자가 보유한 재료를 끼니별로 입력하면, 12개월 된 아이가 먹을 수 있는 음식과 하루 3끼 식단을 추천해주는 모바일 앱을 개발한다.

### 1.3 개발 환경

* IDE: JetBrains Air
* 플랫폼: PWA (iOS / Android 지원)
* 소스 관리: GitHub
* 우선순위: 빠른 MVP 개발 후 기능 확장

---

## 2. 문제 정의

12개월 아이 식단을 매일 구성할 때 아래와 같은 어려움이 있다.

* 집에 있는 재료로 어떤 음식을 만들 수 있는지 바로 떠올리기 어렵다.
* 아이 월령에 맞는 식단 조합을 매 끼니 구성하기 어렵다.
* 하루 세끼를 균형 있게 짜는 데 시간이 걸린다.

본 앱은 사용자가 입력한 재료를 기반으로, 만들 수 있는 메뉴를 추천하고 하루 세끼 식단을 빠르게 구성하도록 돕는다.

---

## 3. 핵심 목표

1. 사용자가 끼니별로 재료를 쉽게 입력할 수 있어야 한다.
2. 입력된 재료를 기반으로 만들 수 있는 유아식 메뉴를 추천해야 한다.
3. 하루 세끼 식단을 자동으로 구성해야 한다.
4. 12개월 아이가 먹기 적절한 메뉴만 추천해야 한다.
5. 사용성이 단순하고 빠른 입력 흐름을 제공해야 한다.

---

## 4. 주요 사용자

### 4.1 대상 사용자

* 12개월 전후 아이를 키우는 부모
* 아이 식단을 매일 직접 준비하는 보호자
* 두 명 이상의 아이 식단을 구분해 관리하고 싶은 보호자

### 4.2 사용자 니즈

* 냉장고에 있는 재료로 만들 수 있는 이유식/유아식을 알고 싶다.
* 하루 세끼를 한 번에 추천받고 싶다.
* 아이별로 식단을 나누어 관리하고 싶다.
* 복잡한 설정 없이 빠르게 식단을 만들고 싶다.

---

## 5. 범위 정의

### 5.1 MVP 포함 범위

* 아이 프로필 생성 및 아이별 식단 관리
* 사용자가 아침, 점심, 저녁 각 끼니별 재료 입력
* 입력 재료 기반 메뉴 추천
* 하루 세끼 식단 생성
* 추천 결과 화면 제공

### 5.2 MVP 제외 범위

* 회원가입/로그인
* 결제 기능
* 쇼핑몰 연동
* 영양 성분 정밀 분석
* 알레르기 진단 기능
* 의사/영양사 상담 기능

---

## 6. 사용자 시나리오

### 시나리오 0: 아이 프로필 생성 및 선택

1. 사용자가 앱을 처음 실행한다.
2. 아이 프로필 생성 화면으로 이동한다.
3. 아이 이름, 개월 수 등 기본 정보를 입력한다.
4. 프로필을 저장한다.
5. 사용자는 식단을 만들 아이 프로필을 선택한다.
6. 이후 식단은 선택된 아이 기준으로 생성 및 관리된다.

### 시나리오 0-1: 아이별 식단 관리

1. 사용자가 프로필 목록 화면으로 이동한다.
2. 등록된 아이 프로필 중 한 명을 선택한다.
3. 선택한 아이의 오늘 식단 또는 최근 식단을 확인한다.
4. 다른 아이를 선택하면 해당 아이의 식단이 별도로 표시된다.

### 시나리오 1: 끼니별 재료 입력 후 식단 생성

1. 사용자가 앱을 실행한다.
2. 아침, 점심, 저녁 섹션을 확인한다.
3. 각 끼니마다 사용할 수 있는 재료를 입력한다.

   * 예: 아침: 소고기, 애호박
   * 점심: 양배추, 두부, 당근
   * 저녁: 소고기, 감자, 브로콜리
4. 사용자가 “식단 생성” 버튼을 누른다.
5. 앱은 입력 재료를 기반으로 끼니별 추천 메뉴를 생성한다.
6. 사용자는 하루 세끼 추천 결과를 확인한다.

### 시나리오 2: 재료 수정 후 재추천

1. 사용자가 생성된 식단을 확인한다.
2. 특정 끼니 메뉴가 마음에 들지 않는다.
3. 재료를 추가/삭제한 뒤 다시 식단 생성 버튼을 누른다.
4. 앱은 변경된 재료 기준으로 새로운 메뉴를 추천한다.

---

## 7. 핵심 기능 요구사항

### 7.0 아이 프로필 관리 기능

* 사용자는 아이 프로필을 생성할 수 있어야 한다.
* 프로필에는 최소 아래 정보가 포함되어야 한다.

  * 아이 이름
  * 개월 수 또는 생년월일
  * 알레르기 재료 목록
* 사용자는 여러 명의 아이 프로필을 등록할 수 있어야 한다.
* 사용자는 현재 식단을 생성할 아이 프로필을 선택할 수 있어야 한다.
* 각 아이의 식단 데이터는 서로 분리되어 관리되어야 한다.
* 특정 아이에 대해 생성한 식단은 다른 아이의 식단과 혼동되지 않아야 한다.
* 사용자는 아이별로 알레르기 재료를 등록, 수정, 삭제할 수 있어야 한다.

### 7.1 재료 입력 기능

* 사용자는 아침, 점심, 저녁 각 끼니별로 재료를 입력할 수 있어야 한다.
* 재료는 텍스트 입력 방식으로 시작한다.
* 재료는 여러 개 입력 가능해야 한다.
* 입력된 재료는 쉼표 또는 태그 형태로 구분된다.
* 각 끼니의 재료는 독립적으로 관리된다.

#### 예시

* 아침: 소고기, 애호박
* 점심: 양배추, 두부, 당근
* 저녁: 닭고기, 감자, 브로콜리

### 7.2 메뉴 추천 기능

* 시스템은 입력된 재료를 바탕으로 만들 수 있는 메뉴를 추천해야 한다.
* 추천 메뉴는 12개월 아이가 먹을 수 있는 수준이어야 한다.
* 각 끼니마다 최소 1개 이상의 추천 메뉴를 제공해야 한다.
* 가능한 경우 주재료가 입력 재료와 일치해야 한다.
* 부족한 부재료가 있어도 기본 조리 가능한 수준이면 추천 가능하다.
* 추천 로직은 기본 메뉴 데이터와 AI 생성 로직을 함께 사용해야 한다.
* 시스템은 재료 매칭 결과를 기반으로 메뉴 후보를 찾고, AI가 최종 추천 문구를 생성해야 한다.
* 시스템은 추천 메뉴에 대해 자연스러운 설명 문구를 생성해야 한다.
* 시스템은 추천 메뉴별로 조리법을 생성할 수 있어야 한다.
* 시스템은 입력 재료로 만들기 위해 부족한 재료를 식별해야 한다.
* 시스템은 부족한 재료에 대해 대체 가능한 재료를 제안해야 한다.
* 부족 재료와 대체 재료 제안은 AI를 활용해 생성할 수 있어야 한다.
* 아이 프로필에 등록된 알레르기 재료는 추천 후보 검색 단계에서 반드시 제외되어야 한다.
* 알레르기 재료가 포함된 메뉴는 추천 결과에서 절대 노출되면 안 된다.
* 시스템은 메뉴의 주재료뿐 아니라 부재료, 소스, 육수, 토핑 등 전체 구성 재료 기준으로 알레르기 포함 여부를 검사해야 한다.
* 사용자가 입력한 재료에 알레르기 재료가 포함된 경우 경고 메시지를 표시하고 해당 재료는 추천 계산에서 제외해야 한다.
* 사용자는 추천 메뉴에 대해 아래 정보를 확인할 수 있어야 한다.

  * 메뉴명
  * 추천 이유
  * 사용 가능한 재료
  * 부족한 재료
  * 대체 가능한 재료
  * 조리법
  * 주의사항 또는 식감 안내
  * 제외된 알레르기 재료 여부

#### 예시

* 입력 재료: 소고기, 애호박
* 추천 메뉴: 소고기 애호박 죽, 소고기 애호박 덮밥
* AI 설명 예시: "지금 있는 소고기와 애호박으로 부드럽게 만들 수 있어 아침 식사로 잘 어울립니다."
* 부족 재료 예시: 쌀
* 대체 재료 예시: 밥, 오트밀
* 알레르기 예시: 두부 알레르기가 등록된 경우 두부가 포함된 모든 메뉴는 후보에서 제외

### 7.3 하루 세끼 식단 생성 기능

* 시스템은 아침, 점심, 저녁 총 3개의 식단을 생성해야 한다.
* 각 끼니는 해당 끼니에 입력된 재료를 우선 사용해야 한다.
* 하루 전체 식단이 너무 중복되지 않도록 구성해야 한다.
* 같은 조리 방식/같은 주재료만 반복되는 조합은 가급적 피해야 한다.

### 7.4 결과 표시 기능

* 생성 결과 화면에는 아침, 점심, 저녁 식단이 구분되어 표시되어야 한다.
* 각 끼니별로 아래 정보가 표시되어야 한다.

  * 추천 메뉴명
  * 추천 문구
  * 사용 재료
  * 부족한 재료
  * 대체 가능한 재료
  * 간단 조리법 또는 상세 조리 단계 진입 버튼
  * 간단한 설명
* 사용자는 한 화면에서 하루 식단 전체를 확인할 수 있어야 한다.
* 사용자는 각 추천 메뉴 카드에서 조리법 상세를 펼쳐볼 수 있어야 한다.

---

## 8. 비기능 요구사항

### 8.1 사용성

* 1분 이내에 하루 식단 생성이 가능해야 한다.
* 입력 흐름은 단순해야 하며 초보 사용자도 이해 가능해야 한다.

### 8.2 성능

* 식단 생성 요청 후 결과는 3초 이내 표시를 목표로 한다.

### 8.3 확장성

* 향후 개월 수별 식단 추천으로 확장 가능해야 한다.
* 향후 재료 즐겨찾기, 알레르기 제외, 영양 밸런스 기능 확장이 가능해야 한다.
* AI 추천 모델, 프롬프트, 메뉴 데이터셋을 교체하거나 고도화할 수 있어야 한다.
* 추천 엔진은 규칙 기반 추천과 AI 생성 결과를 분리된 구조로 설계해야 한다.

### 8.4 안정성

* 재료가 부족하거나 애매한 경우에도 최소 1개 이상의 대체 추천을 제공해야 한다.
* AI 응답이 실패하거나 품질이 낮을 경우에도 기본 추천 결과를 제공할 수 있어야 한다.
* AI가 생성한 조리법과 대체 재료 정보는 월령 적합성 기준을 벗어나지 않도록 검증되어야 한다.

---

## 9. 데이터 저장 정책

* 아이 프로필은 아이별 식단 이력 관리를 위해 서버 DB에 저장한다.
* 생성된 하루 식단과 끼니별 추천 결과는 서버 DB에 저장한다.
* 사용자가 입력한 끼니별 재료 정보는 재사용 및 이력 관리를 위해 서버 DB에 저장한다.
* 사용자가 작성 중인 입력값과 마지막 선택한 아이 정보는 앱 로컬 저장소에 임시 저장한다.
* 로그인 기능이 없는 초기 버전에서는 익명 사용자 식별자를 기반으로 데이터를 관리할 수 있어야 한다.

### 9.1 저장 위치

#### 서버 DB 저장 대상

* 아이 프로필
* 아이별 식단 이력
* 끼니별 입력 재료
* AI 추천 결과
* 조리법
* 부족 재료 및 대체 재료 정보

#### 앱 로컬 저장 대상

* 마지막 선택 아이
* 작성 중인 식단 입력 draft
* 최근 조회 결과 캐시

### 9.2 저장 전략

* 초기 버전은 애플 로그인과 구글 로그인을 지원해야 한다.
* 인증 이후 모든 아이 프로필과 식단 데이터는 사용자 계정 기준으로 서버에 저장되어야 한다.
* 로그인 이전 임시 사용 흐름이 필요한 경우 익명 사용자 ID를 생성하고, 로그인 시 기존 데이터와 계정 연동 가능해야 한다.
* 향후 회원가입/로그인 기능 확장이 가능하도록 사용자 식별 체계를 분리 설계해야 한다.

## 10. 데이터 정의

### 10.1 입력 데이터

* 아이 프로필 ID
* 아이 알레르기 재료 목록
* 끼니 구분: 아침 / 점심 / 저녁
* 재료 목록: 문자열 배열

#### 예시 데이터 구조

```json
{
  "childProfileId": "child_001",
  "allergies": ["두부", "달걀"],
  "breakfast": ["소고기", "애호박"],
  "lunch": ["양배추", "두부", "당근"],
  "dinner": ["소고기", "감자", "브로콜리"]
}
```

### 10.2 출력 데이터

* 아이 프로필 ID
* 끼니별 추천 메뉴명
* 메뉴별 사용 재료
* 부족한 재료
* 대체 가능한 재료
* AI 추천 문구
* 조리법
* 간단한 설명

### 10.3 주요 DB 스키마 초안

#### children

* id
* owner_id
* name
* birth_date
* age_months
* allergies_json
* created_at
* updated_at

#### meal_inputs

* id
* child_id
* input_date
* meal_type
* ingredients_json
* created_at

#### meal_plans

* id
* child_id
* plan_date
* created_at

#### meal_plan_items

* id
* meal_plan_id
* meal_type
* menu_name
* ingredients_json
* missing_ingredients_json
* substitutes_json
* ai_recommendation
* recipe_json
* description
* created_at

#### users

* id
* provider
* provider_user_id
* email
* name
* created_at
* updated_at

#### anonymous_users

* id
* device_key
* created_at

#### user_identity_links

* id
* anonymous_user_id
* user_id
* linked_at

#### 예시 데이터 구조

```json
{
  "childProfileId": "child_001",
  "breakfast": {
    "menu": "소고기 애호박 죽",
    "ingredients": ["소고기", "애호박"],
    "missingIngredients": ["쌀"],
    "substitutes": {
      "쌀": ["밥", "오트밀"]
    },
    "aiRecommendation": "지금 있는 소고기와 애호박으로 부드럽게 만들 수 있어 아침 식사로 잘 어울립니다.",
    "recipe": [
      "소고기와 애호박을 잘게 다진다.",
      "쌀 또는 대체 재료를 넣고 부드럽게 끓인다.",
      "아이가 먹기 좋게 한 번 더 으깨서 마무리한다."
    ],
    "description": "부드럽게 끓여 12개월 아이가 먹기 좋은 죽 형태"
  },
  "lunch": {
    "menu": "양배추 두부 볶음밥",
    "ingredients": ["양배추", "두부", "당근"],
    "missingIngredients": ["밥"],
    "substitutes": {
      "밥": ["죽밥", "오트밀"]
    },
    "aiRecommendation": "양배추와 두부가 있어 점심에 가볍고 부드럽게 먹이기 좋은 메뉴입니다.",
    "recipe": [
      "양배추와 당근을 잘게 다진다.",
      "두부를 으깨고 밥과 함께 부드럽게 볶는다.",
      "필요하면 물을 약간 넣어 촉촉하게 마무리한다."
    ],
    "description": "잘게 다진 재료로 만든 부드러운 식감의 메뉴"
  },
  "dinner": {
    "menu": "소고기 감자 브로콜리 무른밥",
    "ingredients": ["소고기", "감자", "브로콜리"],
    "missingIngredients": ["밥"],
    "substitutes": {
      "밥": ["죽", "오트밀"]
    },
    "aiRecommendation": "소고기와 채소 조합으로 저녁에 든든하면서도 무르게 만들기 좋은 메뉴입니다.",
    "recipe": [
      "소고기와 채소를 작게 썬다.",
      "냄비에 재료와 밥을 넣고 충분히 익힌다.",
      "전체적으로 무르게 퍼지도록 끓여 완성한다."
    ],
    "description": "저녁용으로 부담 없는 한 그릇 메뉴"
  }
}
```

---

## 11. 화면 구성 초안

### 11.1 아이 프로필 화면

구성 요소:

* 아이 프로필 목록
* 새 아이 추가 버튼
* 아이 이름 입력
* 개월 수 또는 생년월일 입력
* 알레르기 재료 입력
* 프로필 저장 버튼

### 11.2 홈/입력 화면

구성 요소:

* 선택된 아이 정보
* 화면 제목: 오늘의 식단 만들기
* 아침 재료 입력 영역
* 점심 재료 입력 영역
* 저녁 재료 입력 영역
* 식단 생성 버튼

### 11.3 결과 화면

구성 요소:

* 오늘의 하루 식단
* 아침 추천 메뉴 카드
* 점심 추천 메뉴 카드
* 저녁 추천 메뉴 카드
* 다시 생성 버튼
* 재료 수정 버튼

---

## 12. 추천 로직 초안

### 12.1 기본 로직

1. 끼니별 입력 재료를 수집한다.
2. 아이 프로필에 등록된 알레르기 재료를 조회한다.
3. 사용자가 입력한 재료 중 알레르기 재료가 있는지 검사한다.
4. 알레르기 재료가 입력된 경우 경고 메시지를 표시하고 해당 재료를 추천 계산에서 제외한다.
5. 재료 조합과 매칭되는 메뉴 후보를 찾는다.
6. 후보 메뉴 전체 재료를 기준으로 알레르기 포함 여부를 검사한다.
7. 알레르기 재료가 포함된 메뉴는 후보에서 제거한다.
8. 12개월 아이가 먹기 적절한 메뉴만 필터링한다.
9. 메뉴 중 중복도가 낮고 조합이 다양한 결과를 우선 선택한다.
10. 규칙 기반 추천 엔진이 1차 후보 메뉴를 선정한다.
11. AI가 후보 메뉴별 추천 문구를 생성한다.
12. AI가 메뉴별 조리법을 생성한다.
13. AI가 부족한 재료와 대체 가능한 재료를 생성한다.
14. 아침, 점심, 저녁 식단을 최종 생성한다.

### 12.2 추천 기준

* 월령 적합성
* 입력 재료 활용도
* 조리 난이도 단순성
* 하루 식단의 다양성
* 지나친 중복 방지
* 부족 재료 수 최소화
* 대체 재료의 현실성
* 알레르기 재료 완전 제외

### 12.3 추천 엔진 구조

* 1차: 메뉴 데이터 기반 후보 탐색
* 2차: 점수 기반 정렬 및 최종 후보 선택
* 3차: AI를 통한 설명 문구, 조리법, 부족 재료, 대체 재료 생성
* 4차: 안전성 검증 및 결과 출력

### 12.4 AI 생성 범위

* 추천 이유 문구 생성
* 조리법 단계 생성
* 부족한 재료 식별
* 대체 가능한 재료 제안
* 식감/주의사항 생성

### 12.5 AI 실패 시 처리

* AI 응답이 없거나 품질이 낮으면 기본 템플릿 문구를 사용한다.
* 조리법은 사전 정의된 기본 레시피 템플릿으로 대체 가능해야 한다.
* 대체 재료 정보가 없을 경우 "대체 재료 없음" 또는 "직접 확인 필요"로 표시할 수 있어야 한다.

### 12.6 AI 처리 아키텍처

#### 처리 원칙

* 메뉴 선택은 AI가 아니라 규칙 기반 추천 엔진이 우선 담당한다.
* AI는 후보 메뉴를 바탕으로 사용자에게 보여줄 자연어 결과를 생성하는 역할을 담당한다.
* AI가 생성한 결과는 반드시 검증 후 저장 및 출력되어야 한다.
* AI가 실패하더라도 서비스는 fallback 로직으로 정상 동작해야 한다.

#### AI 처리 흐름

1. 사용자가 아이와 끼니별 재료를 입력한다.
2. 백엔드는 메뉴 데이터베이스에서 후보 메뉴를 조회한다.
3. 후보 메뉴는 월령 적합성, 끼니 적합성, 재료 매칭 점수 기준으로 정렬된다.
4. 상위 후보 메뉴를 AI에 전달한다.
5. AI는 후보 메뉴를 기준으로 아래 정보를 생성한다.

   * 추천 문구
   * 조리법
   * 부족한 재료
   * 대체 가능한 재료
   * 주의사항 또는 식감 설명
6. 백엔드는 AI 응답을 파싱하고 검증한다.
7. 검증이 통과한 결과만 최종 식단 결과로 저장 및 출력한다.
8. 검증 실패 또는 AI 오류 시 fallback 데이터를 사용한다.

#### AI 입력 데이터 예시

* 아이 개월 수
* 아이 알레르기 재료 목록
* 끼니 타입 (아침 / 점심 / 저녁)
* 사용자가 입력한 재료 목록
* 규칙 기반 추천 엔진이 선정한 메뉴 후보 목록
* 메뉴별 필요 재료 목록
* 월령 제한 및 식감 정보

#### AI 출력 데이터 예시

* selectedMenu
* recommendation
* missingIngredients
* substitutes
* recipe
* caution

#### AI 프롬프트 정책

* 반드시 12개월 아이에게 적합한 메뉴만 설명해야 한다.
* 위험하거나 부적절한 재료는 추천하지 않아야 한다.
* 알레르기 재료가 포함된 메뉴나 대체 재료는 절대 제안하지 않아야 한다.
* 조리법은 보호자가 바로 따라 할 수 있을 정도로 단순해야 한다.
* 응답은 구조화된 JSON 형식으로 반환되도록 설계해야 한다.
* 메뉴 후보 외의 완전히 새로운 메뉴를 임의 생성하지 않도록 제한해야 한다.

#### AI 응답 검증 규칙

* AI 응답은 JSON 파싱 가능해야 한다.
* 선택한 메뉴는 반드시 후보 메뉴 목록 안에 있어야 한다.
* 부족 재료는 실제 필요 재료와 비교해 검증 가능해야 한다.
* 대체 재료는 허용된 식재료 범위 내에서만 허용해야 한다.
* 조리법은 12개월 아이 기준의 부드러운 식감과 안전성을 만족해야 한다.
* 금지 재료 또는 위험 표현이 포함되면 결과를 차단하거나 fallback 처리해야 한다.
* 알레르기 재료가 메뉴명, 재료, 대체 재료, 조리법 어디에라도 포함되면 결과를 차단해야 한다.

#### Fallback 정책

* 추천 문구는 기본 템플릿 문구를 사용한다.
* 조리법은 사전 정의된 레시피 템플릿으로 대체한다.
* 부족 재료는 시스템 계산 결과를 사용한다.
* 대체 재료는 메뉴 데이터에 정의된 기본 substitute 값을 사용한다.
* fallback 여부는 저장 데이터에 기록되어야 한다.

#### 저장 항목

* AI 추천 문구
* AI 생성 조리법
* 부족 재료
* 대체 재료
* 주의사항
* 사용된 프롬프트 버전
* fallback 여부
* 생성 시각

## 13. 예외 처리

* 사용자가 어떤 끼니에 재료를 입력하지 않은 경우:

  * 해당 끼니는 기본 추천 메뉴 또는 입력 유도 메시지를 표시한다.
* 입력 재료만으로 메뉴 구성이 어려운 경우:

  * 부족 재료가 적은 대체 메뉴를 추천한다.
* 동일 재료만 반복 입력된 경우:

  * 조리 방식이 다른 메뉴를 우선 추천한다.
* 사용자가 입력한 재료에 알레르기 재료가 포함된 경우:

  * 즉시 경고 메시지를 표시한다.
  * 해당 재료는 추천 계산에서 제외한다.
* 후보 메뉴에 알레르기 재료가 포함된 경우:

  * 해당 메뉴는 결과에서 완전히 제외한다.
* AI가 알레르기 재료를 포함한 대체 재료나 조리법을 생성한 경우:

  * 결과를 폐기하고 fallback 처리한다.

## 14. MVP 성공 기준

* 사용자가 아이 프로필을 생성할 수 있다.
* 사용자가 여러 아이를 구분해서 선택할 수 있다.
* 사용자가 아이별 알레르기 재료를 등록하고 수정할 수 있다.
* 사용자가 3개 끼니의 재료를 입력할 수 있다.
* 버튼 한 번으로 선택한 아이 기준 하루 세끼 추천 결과를 받을 수 있다.
* 결과가 12개월 아이용 메뉴로 자연스럽게 보인다.
* 아이별 식단이 서로 분리되어 관리된다.
* 알레르기 재료가 포함된 메뉴는 추천 결과에 노출되지 않는다.
* 전체 흐름이 직관적이며 재사용 가능하다.

## 15. 향후 확장 아이디어

* 아이 개월 수 선택 기능
* 알레르기 재료 제외 기능
* 재료 자동완성 기능
* 식단 저장 기능
* 주간 식단표 생성 기능
* 장보기 리스트 생성 기능
* 조리법 상세 보기 기능
* AI 기반 대체 메뉴 추천 기능
* 아이 기호도 반영
* 자주 쓰는 재료 기반 개인화 추천

## 16. 개발 우선순위

### 1차

* 아이 프로필 생성 및 선택
* 아이별 알레르기 입력 및 관리
* 애플 로그인 / 구글 로그인
* 끼니별 재료 입력
* 메뉴 데이터 seed 설계 및 DB 적재
* 재료 표준 키 정의 및 정규화 로직
* 규칙 기반 메뉴 추천 로직
* AI 추천 문구 생성
* AI 조리법 생성
* AI 부족 재료 및 대체 재료 생성
* 하루 세끼 결과 화면
* 알레르기 완전 제외 필터

### 2차

* 추천 품질 개선
* 재추천 기능
* 재료 입력 UX 개선
* AI 응답 품질 개선 및 검증 로직 추가
* 로그인 전 임시 데이터와 계정 연동

### 3차

* 저장 기능
* 주간 식단 확장
* 개인화 기능
* 운영자용 메뉴 데이터 관리 기능

## 17. 기술 결정 사항

### 17.1 플랫폼 및 저장소

* 앱 형태는 Vite + React 기반 PWA로 개발한다.
* iOS와 Android 모두 브라우저 기반으로 지원한다.
* PWA 구성은 Vite와 vite-plugin-pwa를 사용한다.
* 소스 코드는 GitHub으로 관리한다.

### 17.2 백엔드 및 인프라

* 백엔드는 Supabase를 사용한다.
* 데이터베이스는 Supabase Postgres를 사용한다.
* 인증은 Supabase Auth를 사용한다.
* AI 호출 및 민감 로직 처리는 Supabase Edge Functions 또는 별도 서버 함수에서 수행한다.
* 메뉴 seed 데이터 적재와 DB 마이그레이션은 GitHub 기반 배포 흐름에서 관리한다.

### 17.3 인증

* 인증은 애플 로그인과 구글 로그인을 모두 지원한다.
* 인증 구현은 Supabase Auth의 OAuth 기반 소셜 로그인을 사용한다.
* 필요 시 익명 사용자 흐름을 지원하고 로그인 후 계정 연동 가능해야 한다.

### 17.4 AI 처리

* AI 호출 단위는 끼니별로 처리한다.
* 규칙 기반 추천 엔진이 후보를 정하고, AI가 설명/조리법/대체 재료를 생성한다.
* AI 호출은 클라이언트에서 직접 수행하지 않고 서버 함수에서 수행한다.

### 17.5 메뉴 및 재료 데이터

* 메뉴 데이터는 seed 데이터로 초기 구성하고 DB에 저장한다.
* 재료 표준화는 표준 키 기반으로 처리한다.
* 사용자 입력 재료는 표준 키로 정규화 후 추천 엔진에 전달한다.

### 17.6 알레르기 정책

* 알레르기 재료는 완전 제외 정책을 적용한다.
* 해당 재료가 포함된 메뉴는 추천 후보와 결과에서 모두 제외한다.

### 17.7 식단 결과 정책

* 같은 아이와 같은 날짜에 대해 여러 번 식단 생성이 가능해야 한다.
* 가장 최신 결과를 기본 표시한다.
* 이전 결과는 히스토리로 보관한다.

### 17.8 조리법 표시 수준

* 결과 카드에는 3줄 요약 조리법만 표시한다.
* 필요 시 상세 조리법 화면으로 확장 가능하도록 설계한다.

## 18. API 명세 초안

### 18.1 인증

* POST /auth/oauth/google

  * 구글 로그인 시작
* POST /auth/oauth/apple

  * 애플 로그인 시작
* POST /auth/link-anonymous

  * 익명 사용자 데이터를 로그인 계정에 연결
* POST /auth/logout

  * 로그아웃 처리
* GET /me

  * 현재 로그인 사용자 정보 조회

### 18.2 아이 프로필

* GET /children

  * 내 아이 프로필 목록 조회
* POST /children

  * 아이 프로필 생성
* GET /children/:childId

  * 아이 프로필 상세 조회
* PATCH /children/:childId

  * 아이 프로필 수정
* DELETE /children/:childId

  * 아이 프로필 삭제

#### 아이 프로필 payload 예시

```json
{
  "name": "민서",
  "birthDate": "2025-03-17",
  "ageMonths": 12,
  "allergies": ["두부", "달걀"]
}
```

### 18.3 재료 표준화

* GET /ingredients/search?q=

  * 재료 자동완성 및 표준 키 검색
* POST /ingredients/normalize

  * 입력 재료를 표준 키로 정규화

#### 정규화 요청 예시

```json
{
  "ingredients": ["쇠고기", "애호박", "계란"]
}
```

#### 정규화 응답 예시

```json
{
  "items": [
    { "input": "쇠고기", "standardKey": "소고기", "displayName": "소고기" },
    { "input": "애호박", "standardKey": "애호박", "displayName": "애호박" },
    { "input": "계란", "standardKey": "달걀", "displayName": "달걀" }
  ]
}
```

### 18.4 식단 생성

* POST /meal-plans/generate

  * 하루 세끼 식단 생성
* GET /meal-plans/latest?childId=

  * 특정 아이의 최신 식단 조회
* GET /meal-plans/history?childId=

  * 특정 아이의 식단 히스토리 조회
* GET /meal-plans/:mealPlanId

  * 식단 상세 조회

#### 식단 생성 요청 예시

```json
{
  "childId": "child_001",
  "date": "2026-03-30",
  "breakfast": ["소고기", "애호박"],
  "lunch": ["양배추", "두부", "당근"],
  "dinner": ["소고기", "감자", "브로콜리"]
}
```

#### 식단 생성 응답 예시

```json
{
  "mealPlanId": "plan_001",
  "childId": "child_001",
  "date": "2026-03-30",
  "warnings": [
    {
      "mealType": "lunch",
      "ingredient": "두부",
      "reason": "알레르기 재료로 등록되어 제외되었습니다."
    }
  ],
  "breakfast": {
    "menu": "소고기 애호박 죽",
    "ingredients": ["소고기", "애호박"],
    "missingIngredients": ["쌀"],
    "substitutes": { "쌀": ["밥", "오트밀"] },
    "aiRecommendation": "지금 있는 소고기와 애호박으로 부드럽게 만들 수 있어 아침 식사로 잘 어울립니다.",
    "recipeSummary": [
      "소고기와 애호박을 잘게 다진다.",
      "쌀 또는 대체 재료와 함께 부드럽게 끓인다.",
      "아이가 먹기 좋게 묽게 마무리한다."
    ],
    "isFallback": false
  },
  "lunch": {
    "menu": "양배추 당근 무른밥",
    "ingredients": ["양배추", "당근"],
    "missingIngredients": ["밥"],
    "substitutes": { "밥": ["죽", "오트밀"] },
    "aiRecommendation": "두부를 제외하고도 부드럽게 만들 수 있는 점심 메뉴입니다.",
    "recipeSummary": [
      "채소를 잘게 다진다.",
      "밥 또는 대체 재료와 함께 충분히 익힌다.",
      "촉촉하고 무르게 마무리한다."
    ],
    "isFallback": false
  },
  "dinner": {
    "menu": "소고기 감자 브로콜리 무른밥",
    "ingredients": ["소고기", "감자", "브로콜리"],
    "missingIngredients": ["밥"],
    "substitutes": { "밥": ["죽", "오트밀"] },
    "aiRecommendation": "저녁에 든든하면서도 무르게 먹이기 좋은 메뉴입니다.",
    "recipeSummary": [
      "재료를 잘게 손질한다.",
      "밥과 함께 충분히 익힌다.",
      "부드럽게 퍼지도록 마무리한다."
    ],
    "isFallback": false
  }
}
```

### 18.5 메뉴 데이터

* GET /menus

  * 메뉴 목록 조회
* GET /menus/:menuId

  * 메뉴 상세 조회
* POST /menus/seed

  * seed 데이터 적재 또는 동기화용 내부 API

### 18.6 에러 처리 원칙

* 알레르기 재료가 입력되면 warning 필드로 반환하고 추천 계산에서 제외한다.
* 후보 메뉴가 없을 경우 사용자에게 재료 추가를 유도하는 빈 결과 메시지를 반환한다.
* AI 실패 시 isFallback=true 와 함께 기본 템플릿 결과를 반환한다.
* 모든 API는 사용자 본인 데이터만 접근 가능하도록 인증 및 권한 검사를 적용한다.

## 19. DB 스키마 SQL 초안

```sql
create extension if not exists pgcrypto;

create table if not exists users_profile (
  id uuid primary key,
  email text,
  name text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists anonymous_users (
  id uuid primary key default gen_random_uuid(),
  device_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists user_identity_links (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null references anonymous_users(id) on delete cascade,
  user_id uuid not null,
  linked_at timestamptz not null default now(),
  unique (anonymous_user_id, user_id)
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  owner_anonymous_user_id uuid,
  name text not null,
  birth_date date,
  age_months integer,
  allergies_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_user_id is not null or owner_anonymous_user_id is not null)
);

create index if not exists idx_children_owner_user_id on children(owner_user_id);
create index if not exists idx_children_owner_anonymous_user_id on children(owner_anonymous_user_id);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null unique,
  display_name text not null,
  aliases_json jsonb not null default '[]'::jsonb,
  category text,
  is_allergen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ingredients_standard_key on ingredients(standard_key);

create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meal_types_json jsonb not null default '[]'::jsonb,
  required_ingredient_keys_json jsonb not null default '[]'::jsonb,
  optional_ingredient_keys_json jsonb not null default '[]'::jsonb,
  substitute_map_json jsonb not null default '{}'::jsonb,
  age_min_months integer not null default 12,
  texture text,
  recipe_template_json jsonb not null default '[]'::jsonb,
  caution_template text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menus_age_min_months on menus(age_min_months);
create index if not exists idx_menus_is_active on menus(is_active);

create table if not exists meal_inputs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  input_date date not null,
  meal_type text not null,
  original_ingredients_json jsonb not null default '[]'::jsonb,
  normalized_ingredients_json jsonb not null default '[]'::jsonb,
  excluded_allergy_ingredients_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (meal_type in ('breakfast', 'lunch', 'dinner'))
);

create index if not exists idx_meal_inputs_child_id_date on meal_inputs(child_id, input_date);

create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  plan_date date not null,
  created_by_user_id uuid,
  created_by_anonymous_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meal_plans_child_id_date on meal_plans(child_id, plan_date);
create index if not exists idx_meal_plans_created_at on meal_plans(created_at desc);

create table if not exists meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  meal_type text not null,
  menu_id uuid references menus(id) on delete set null,
  menu_name text not null,
  used_ingredient_keys_json jsonb not null default '[]'::jsonb,
  missing_ingredient_keys_json jsonb not null default '[]'::jsonb,
  substitutes_json jsonb not null default '{}'::jsonb,
  ai_recommendation text,
  recipe_summary_json jsonb not null default '[]'::jsonb,
  recipe_full_json jsonb not null default '[]'::jsonb,
  caution text,
  excluded_allergy_ingredients_json jsonb not null default '[]'::jsonb,
  prompt_version text,
  is_fallback boolean not null default false,
  created_at timestamptz not null default now(),
  check (meal_type in ('breakfast', 'lunch', 'dinner')),
  unique (meal_plan_id, meal_type)
);

create index if not exists idx_meal_plan_items_meal_plan_id on meal_plan_items(meal_plan_id);

create table if not exists ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  meal_plan_item_id uuid references meal_plan_items(id) on delete cascade,
  meal_type text not null,
  prompt_version text,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_payload_json jsonb not null default '{}'::jsonb,
  validation_status text,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now(),
  check (meal_type in ('breakfast', 'lunch', 'dinner'))
);

create index if not exists idx_ai_generation_logs_meal_plan_item_id on ai_generation_logs(meal_plan_item_id);
```

### 19.1 테이블 설계 원칙

* 인증 사용자는 Supabase Auth 사용자 ID를 기준으로 관리한다.
* 로그인 이전 임시 사용자는 anonymous_users 기준으로 관리한다.
* children 은 로그인 사용자 또는 익명 사용자 중 하나에 반드시 연결되어야 한다.
* 재료 검색과 추천 계산은 ingredients.standard_key 기준으로 처리한다.
* menus 는 seed 데이터로 초기 적재하고 이후 DB 기준으로 운영한다.
* meal_plans 는 하루 식단 단위, meal_plan_items 는 끼니 단위 상세 결과를 저장한다.
* AI 생성 결과와 fallback 여부는 meal_plan_items 및 ai_generation_logs 에 저장한다.

### 19.2 RLS 설계 방향

* 사용자는 본인 소유의 children 만 조회/수정 가능해야 한다.
* 사용자는 본인 소유의 meal_inputs, meal_plans, meal_plan_items 만 조회 가능해야 한다.
* menus 와 ingredients 는 인증 사용자에게 읽기 허용, 쓰기는 서버 함수 또는 관리자만 허용한다.
* AI 로그는 일반 사용자 직접 접근 없이 서버 함수만 접근하도록 제한한다.

### 19.3 seed 데이터 예시

```json
{
  "ingredients": [
    {
      "standardKey": "소고기",
      "displayName": "소고기",
      "aliases": ["쇠고기", "한우", "다진 소고기"],
      "category": "meat",
      "isAllergen": false
    },
    {
      "standardKey": "달걀",
      "displayName": "달걀",
      "aliases": ["계란"],
      "category": "egg",
      "isAllergen": true
    }
  ],
  "menus": [
    {
      "name": "소고기 애호박 죽",
      "mealTypes": ["breakfast", "lunch", "dinner"],
      "requiredIngredientKeys": ["소고기", "애호박", "쌀"],
      "optionalIngredientKeys": [],
      "substituteMap": {
        "쌀": ["밥", "오트밀"]
      },
      "ageMinMonths": 12,
      "texture": "soft",
      "recipeTemplate": [
        "소고기와 애호박을 잘게 다진다.",
        "쌀 또는 대체 재료를 넣고 부드럽게 끓인다.",
        "아이가 먹기 좋게 묽게 마무리한다."
      ],
      "cautionTemplate": "재료를 잘게 손질하고 간을 최소화한다."
    }
  ]
}
```

## 20. 프로젝트 폴더 구조 초안

```text
baby-meal-planner/
├─ README.md
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ public/
│  ├─ icons/
│  └─ manifest.webmanifest
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ app/
│  │  ├─ router.tsx
│  │  ├─ providers/
│  │  │  ├─ QueryProvider.tsx
│  │  │  ├─ AuthProvider.tsx
│  │  │  └─ ThemeProvider.tsx
│  │  └─ store/
│  │     ├─ authStore.ts
│  │     ├─ childStore.ts
│  │     └─ mealPlanDraftStore.ts
│  ├─ pages/
│  │  ├─ LoginPage.tsx
│  │  ├─ ChildListPage.tsx
│  │  ├─ ChildFormPage.tsx
│  │  ├─ MealPlannerPage.tsx
│  │  ├─ MealPlanResultPage.tsx
│  │  └─ MealPlanHistoryPage.tsx
│  ├─ components/
│  │  ├─ common/
│  │  ├─ child/
│  │  ├─ ingredient/
│  │  ├─ meal/
│  │  └─ auth/
│  ├─ features/
│  │  ├─ auth/
│  │  │  ├─ api.ts
│  │  │  ├─ hooks.ts
│  │  │  └─ types.ts
│  │  ├─ children/
│  │  │  ├─ api.ts
│  │  │  ├─ hooks.ts
│  │  │  ├─ schema.ts
│  │  │  └─ types.ts
│  │  ├─ ingredients/
│  │  │  ├─ api.ts
│  │  │  ├─ hooks.ts
│  │  │  ├─ normalizer.ts
│  │  │  └─ types.ts
│  │  ├─ meal-plans/
│  │  │  ├─ api.ts
│  │  │  ├─ hooks.ts
│  │  │  ├─ schema.ts
│  │  │  └─ types.ts
│  │  └─ menus/
│  │     ├─ api.ts
│  │     └─ types.ts
│  ├─ lib/
│  │  ├─ supabase.ts
│  │  ├─ env.ts
│  │  ├─ dayjs.ts
│  │  └─ utils.ts
│  ├─ services/
│  │  ├─ pwa/
│  │  │  └─ registerServiceWorker.ts
│  │  └─ local-storage/
│  │     ├─ selectedChildStorage.ts
│  │     └─ mealDraftStorage.ts
│  ├─ styles/
│  │  └─ globals.css
│  └─ types/
│     └─ api.ts
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  ├─ seed/
│  │  ├─ ingredients.seed.json
│  │  └─ menus.seed.json
│  └─ functions/
│     ├─ generate-meal-plan/
│     │  └─ index.ts
│     ├─ normalize-ingredients/
│     │  └─ index.ts
│     └─ link-anonymous-user/
│        └─ index.ts
├─ docs/
│  ├─ product-spec.md
│  ├─ api-spec.md
│  └─ db-schema.md
└─ .github/
   └─ workflows/
      ├─ ci.yml
      └─ deploy.yml
```

### 20.1 프론트엔드 구조 원칙

* pages 는 라우트 단위 화면을 담당한다.
* features 는 도메인별 API, 타입, 훅, 검증 로직을 관리한다.
* components 는 재사용 가능한 UI 단위로 구성한다.
* services/local-storage 는 마지막 선택 아이, 작성 중 draft 등 로컬 저장 전용 로직을 담당한다.
* app/providers 는 인증, 데이터 패칭, 전역 상태 초기화를 담당한다.

### 20.2 백엔드 구조 원칙

* Supabase migrations 에 스키마 변경 이력을 관리한다.
* seed 디렉터리에서 ingredients 와 menus 초기 데이터를 관리한다.
* Edge Functions 는 AI 호출, 재료 정규화, 익명 사용자 연동 같은 서버 전용 로직만 담당한다.
* 클라이언트는 민감 로직이나 AI API 키에 직접 접근하지 않는다.

## 21. JetBrains Air 구현 작업 리스트

### 21.1 1차 세팅

* GitHub 저장소 생성
* Vite + React + TypeScript 프로젝트 초기화
* vite-plugin-pwa 설정
* ESLint / Prettier / 기본 코드 스타일 설정
* Supabase 프로젝트 생성 및 연결
* 환경변수 구조 정의
* 기본 라우팅 구조 생성

### 21.2 인증 구현

* Supabase Auth 연동
* Google 로그인 버튼 구현
* Apple 로그인 버튼 구현
* 로그인 상태 유지 처리
* 로그아웃 처리
* 익명 사용자 상태 설계
* 익명 사용자와 로그인 계정 연결 함수 구현

### 21.3 DB 및 seed 작업

* migrations 생성
* users_profile 관련 구조 반영
* children 테이블 생성
* ingredients 테이블 생성
* menus 테이블 생성
* meal_inputs 테이블 생성
* meal_plans 테이블 생성
* meal_plan_items 테이블 생성
* ai_generation_logs 테이블 생성
* RLS 정책 작성
* ingredients seed 데이터 작성
* menus seed 데이터 작성
* seed 적재 스크립트 작성

### 21.4 아이 프로필 기능

* 아이 목록 조회 화면 구현
* 아이 생성 화면 구현
* 아이 수정 기능 구현
* 아이 삭제 기능 구현
* 아이별 알레르기 입력 UI 구현
* 마지막 선택 아이 로컬 저장 구현

### 21.5 재료 입력 및 정규화

* 아침/점심/저녁 입력 UI 구현
* 재료 태그 입력 컴포넌트 구현
* 재료 자동완성 검색 구현
* 재료 표준 키 정규화 API 구현
* 입력 재료 중 알레르기 검사 구현
* 알레르기 경고 메시지 UI 구현
* 작성 중 draft 로컬 저장 구현

### 21.6 식단 생성

* 식단 생성 요청 API 구현
* 메뉴 후보 탐색 로직 구현
* 알레르기 완전 제외 필터 구현
* 부족 재료 계산 로직 구현
* 대체 재료 기본 계산 로직 구현
* 끼니별 AI 호출 함수 구현
* AI 응답 파싱 및 검증 구현
* fallback 로직 구현
* meal_plans / meal_plan_items 저장 구현

### 21.7 결과 및 히스토리

* 식단 결과 카드 UI 구현
* 조리법 3줄 요약 표시 구현
* warning 표시 구현
* 최신 식단 조회 구현
* 식단 히스토리 목록 구현
* 히스토리 상세 조회 구현

### 21.8 품질 및 배포

* 주요 도메인 타입 정리
* 에러 처리 공통화
* 로딩/빈 상태/실패 상태 UI 정리
* 단위 테스트 우선순위 정의
* GitHub Actions CI 설정
* 배포 워크플로우 설정
* PWA 설치성 및 오프라인 기본 동작 점검

## 22. 개발 순서 추천

### Step 1

* 프로젝트 초기화
* Supabase 연결
* DB 마이그레이션 적용
* seed 데이터 적재

### Step 2

* 로그인 구현
* 아이 프로필 CRUD 구현
* 알레르기 입력 기능 구현

### Step 3

* 재료 입력 UI
* 재료 정규화
* draft 저장

### Step 4

* 메뉴 후보 탐색 로직
* 알레르기 제외 로직
* 식단 생성 API

### Step 5

* AI 호출
* 응답 검증
* fallback 처리

### Step 6

* 결과 화면
* 최신 결과/히스토리 화면
* 배포 및 QA

## 23. JetBrains Air 시작용 작업 지시서

### 23.1 Air 첫 실행용 프로젝트 컨텍스트

```text
너는 Vite + React + TypeScript 기반 PWA 프로젝트의 시니어 풀스택 엔지니어다.

프로젝트 목표:
12개월 아이를 위한 하루 3끼 식단 추천 PWA를 개발한다.
사용자는 아이 프로필을 생성하고, 아이별로 알레르기 정보를 관리할 수 있다.
사용자는 아침/점심/저녁 재료를 입력하면 하루 세끼 식단 추천 결과를 받는다.
추천 결과는 메뉴명, 추천 문구, 부족한 재료, 대체 재료, 조리법 요약을 포함한다.
알레르기 재료가 포함된 음식은 절대 추천되면 안 된다.
AI는 끼니별로 호출되며, 추천 문구/조리법/부족 재료/대체 재료를 생성한다.

기술 스택:
- Frontend: Vite + React + TypeScript + PWA
- Backend: Supabase
- DB: Supabase Postgres
- Auth: Supabase Auth (Google / Apple)
- Source Control: GitHub

개발 원칙:
- 타입 안정성을 우선한다.
- UI보다 먼저 구조와 데이터 흐름을 안정적으로 만든다.
- 컴포넌트는 작고 재사용 가능하게 만든다.
- 민감 로직과 AI 호출은 클라이언트가 아닌 서버 함수에서 처리한다.
- 알레르기 재료는 후보 검색과 결과 출력 모두에서 완전 제외한다.
- 구현 시 폴더 구조와 타입 정의를 먼저 맞춘다.
- 작업마다 완료 후 변경 파일과 다음 작업 추천을 요약한다.
```

### 23.2 Air에 처음 요청할 프롬프트

```text
이 프로젝트를 초기 세팅해줘.

요구사항:
1. Vite + React + TypeScript 프로젝트 구조를 기준으로 정리해.
2. vite-plugin-pwa 설정을 포함해.
3. React Router 기반 기본 라우팅 구조를 만들어.
4. 아래 페이지 파일을 생성해.
   - LoginPage
   - ChildListPage
   - ChildFormPage
   - MealPlannerPage
   - MealPlanResultPage
   - MealPlanHistoryPage
5. 아래 폴더 구조를 기준으로 생성해.
   - src/app
   - src/pages
   - src/components
   - src/features
   - src/lib
   - src/services
   - src/types
6. Supabase 클라이언트 초기화 파일을 만들어.
7. 환경변수 사용 구조를 만들어.
8. Zustand 또는 React Context 중 하나를 사용해 auth / selected child / meal draft 상태 구조를 잡아.
9. TypeScript 에러 없이 동작 가능한 최소 골격을 만들어.
10. 작업 후 생성한 파일 목록과 다음 추천 작업을 정리해.

중요:
- 아직 실제 비즈니스 로직은 깊게 구현하지 말고, 확장 가능한 구조를 우선 만들어.
- 더미 데이터로라도 페이지 전환이 가능해야 해.
- CSS는 과하게 하지 말고 깔끔한 기본 UI만 적용해.
```

### 23.3 Air 두 번째 작업 프롬프트

```text
다음 단계로 Supabase 연동과 인증 구조를 구현해줘.

요구사항:
1. Supabase Auth를 연동해.
2. Google 로그인 / Apple 로그인 버튼 UI를 LoginPage에 추가해.
3. 로그인 상태를 전역에서 관리할 수 있게 해.
4. 보호된 라우트 구조를 만들어.
5. 로그인 사용자는 ChildListPage로 이동하도록 해.
6. 비로그인 사용자는 LoginPage로 리다이렉트되게 해.
7. 로그아웃 기능을 구현해.
8. 추후 익명 사용자 연동이 가능하도록 auth 구조를 확장 가능하게 설계해.
9. 필요한 타입과 훅을 정리해.
10. 작업 후 변경 파일과 다음 추천 작업을 요약해.
```

### 23.4 Air 세 번째 작업 프롬프트

```text
이제 DB와 도메인 모델 기준으로 아이 프로필 기능을 구현해줘.

요구사항:
1. children 도메인 타입을 정의해.
2. 아이 목록 조회 / 생성 / 수정 / 삭제 API 레이어를 만들어.
3. ChildListPage, ChildFormPage를 실제 동작하도록 연결해.
4. 아이 프로필에 아래 필드를 반영해.
   - name
   - birthDate
   - ageMonths
   - allergies
5. 알레르기 입력은 태그 형태 UI로 만들어.
6. 마지막 선택 아이를 localStorage에 저장해.
7. React Query 또는 유사한 방식으로 서버 상태를 관리해.
8. 에러/로딩/빈 상태를 기본 처리해.
9. 작업 후 변경 파일과 다음 추천 작업을 정리해.
```

### 23.5 Air 네 번째 작업 프롬프트

```text
이제 식단 생성 전 단계인 재료 입력과 정규화 구조를 구현해줘.

요구사항:
1. MealPlannerPage에 아침/점심/저녁 재료 입력 UI를 만들어.
2. 재료 입력은 태그형 입력 UX로 구현해.
3. 입력값 draft를 localStorage에 저장해.
4. ingredients 도메인 타입과 API 레이어를 만들어.
5. 재료 검색 자동완성 구조를 만들어.
6. 재료 표준화(normalize) API 연동 구조를 만들어.
7. 아이 알레르기 재료와 입력 재료가 겹치면 즉시 경고 UI를 표시해.
8. 식단 생성 버튼 클릭 시 normalize 이후 payload를 구성할 수 있게 해.
9. 작업 후 변경 파일과 다음 추천 작업을 정리해.
```

### 23.6 Air 다섯 번째 작업 프롬프트

```text
이제 핵심인 식단 생성 기능을 구현해줘.

요구사항:
1. meal-plans 도메인 타입과 API 레이어를 구현해.
2. 식단 생성 요청 API를 연결해.
3. 생성 응답을 MealPlanResultPage에 렌더링해.
4. 각 끼니 카드에 아래를 표시해.
   - 메뉴명
   - 추천 문구
   - 사용 재료
   - 부족한 재료
   - 대체 재료
   - 조리법 3줄 요약
   - fallback 여부
5. warning 메시지 UI를 구현해.
6. 결과를 최신 식단과 히스토리 조회 구조와 연결 가능하게 설계해.
7. 타입 안정성을 유지하고, null/empty 응답 처리도 포함해.
8. 작업 후 변경 파일과 다음 추천 작업을 정리해.
```

## 24. README 초안

### 24.1 프로젝트 소개

```md
# Baby Meal Planner

12개월 아이를 위한 하루 3끼 식단 추천 PWA.

사용자는 아이 프로필을 만들고, 아이별 알레르기 재료를 관리하며,
아침/점심/저녁 재료를 입력해 하루 식단을 추천받을 수 있습니다.

추천 결과에는 다음이 포함됩니다:
- 메뉴명
- AI 추천 문구
- 부족한 재료
- 대체 가능한 재료
- 조리법 3줄 요약
- 알레르기 제외 처리 결과
```

### 24.2 주요 기능

```md
## Features

- Apple / Google 로그인
- 아이 프로필 생성 및 관리
- 아이별 알레르기 재료 관리
- 아침 / 점심 / 저녁 재료 입력
- 재료 표준화 및 자동완성
- 하루 세끼 식단 생성
- 알레르기 재료 완전 제외 필터
- AI 기반 추천 문구 / 조리법 / 대체 재료 생성
- 최신 식단 조회 및 히스토리 관리
- PWA 설치 및 모바일 사용 지원
```

### 24.3 기술 스택

```md
## Tech Stack

- Frontend: Vite + React + TypeScript
- PWA: vite-plugin-pwa
- State: Zustand / React Query
- Backend: Supabase
- Database: Supabase Postgres
- Auth: Supabase Auth (Google / Apple)
- AI: Server-side LLM integration
- Source Control: GitHub
```

### 24.4 시작 방법

````md
## Getting Started

### 1. Install

```bash
npm install
````

### 2. Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Dev Server

```bash
npm run dev
```

### 4. Build

```bash
npm run build
```

````

### 24.5 폴더 구조

```md
## Folder Structure

- `src/app` : app providers, router, global state
- `src/pages` : route pages
- `src/components` : reusable UI components
- `src/features` : domain-based modules
- `src/lib` : external clients and utilities
- `src/services` : local storage and side services
- `supabase/migrations` : DB migrations
- `supabase/functions` : edge functions
- `supabase/seed` : initial menu / ingredient data
````

### 24.6 향후 TODO

현재 구현 기준 진행 현황:

- 완료: 8 / 8
- 부분 진행: 0 / 8
- 미진행: 0 / 8

#### TODO 체크리스트

- [x] 아이 프로필 CRUD 구현
- [x] 알레르기 태그 입력 구현
- [x] 재료 정규화 API 구현 _(클라이언트 서비스 + Supabase Edge Function 구현 및 배포 완료)_
- [x] 식단 생성 Edge Function 구현 _(Supabase Edge Function 구현 및 hosted 배포 완료)_
- [x] AI 응답 검증 및 fallback 처리 _(가드 로직, fallback 처리, OpenAI 연동 검증 완료)_
- [x] 히스토리 화면 구현
- [x] GitHub Actions CI 설정
- [x] PWA 설치/오프라인 최적화 _(설치 배너, 오프라인 상태 안내, 캐시 설정 보강 완료)_

## 25. 한 줄 정의

아이 프로필을 만들고, 집에 있는 재료를 끼니별로 입력하면 12개월 아이를 위한 하루 세끼 식단을 아이별로 추천·관리해주는 모바일 앱.
