# Seed 데이터 안내

## 문서 목적

이 문서는 Supabase 초기 데이터의 역할과 관리 기준을 간단히 설명합니다.

## 현재 기준

이 프로젝트의 기준 데이터는 아래 두 도메인입니다.

- `menus`
- `ingredients`

현재 seed source of truth는 별도 수동 입력 파일보다 **마이그레이션 기반 seed**입니다.

- 메뉴와 재료 기준 데이터는 [../migrations](../migrations)에 반영된 마이그레이션을 기준으로 관리합니다.
- 프론트의 정적 카탈로그는 개발 보조/호환용이며, 서버 기준 데이터와 충돌하면 안 됩니다.

## 관련 문서

- 제품 스펙: [../../docs/product-spec.md](../../docs/product-spec.md)
- 구현 규칙: [../../AGENTS.md](../../AGENTS.md)
