# ADR-013 실행 결과 — dead public API 정리

**실행일**: 2026-05-17
**Wave**: 3
**상태**: completed

## 변경 요약

- 5 dead API `@deprecated` alias 패턴 적용 (JSDoc + index.ts re-export 주석)
- `ColumnVisibilityMenuProps` 도 함께 deprecate (advisor 권고 — Props 타입은 컴포넌트 없이 의미 없음)
- grid-core minor bump (CHANGELOG + Changeset)
- 다음 major 에서 제거
- `console.warn (dev only)` 는 미적용 (task spec JSDoc-only. 결과 보고서 "다음 단계" 참조)

## 변경 파일 목록

| 파일 | 변경 |
|------|------|
| `packages/grid-core/src/column/createTomisColumnHelper.ts` | `@deprecated` JSDoc 추가 |
| `packages/grid-core/src/column/createGroupedColumns.ts` | `@deprecated` JSDoc 추가 (파일 top, `TomisColumnGroup` interface, `createGroupedColumns` function) |
| `packages/grid-core/src/column/useColumnPersistence.ts` | `@deprecated` JSDoc 추가 |
| `packages/grid-core/src/column/ColumnVisibilityMenu.tsx` | `@deprecated` JSDoc 추가 (`ColumnVisibilityMenuProps` + `ColumnVisibilityMenu` 함수) |
| `packages/grid-core/src/index.ts` | 5 API + `ColumnVisibilityMenuProps` re-export 에 `/** @deprecated ... */` inline 주석 추가 |
| `packages/grid-core/CHANGELOG.md` | Deprecated 섹션 추가 (6 항목) |
| `.changeset/adr-013-dead-api-deprecation.md` | `@tomis/grid-core: minor` changeset 생성 |

## 사용처 인벤토리 재확인

grep 범위: packages/ + TOMIS/tw-framework-front/src/ (--exclude-dir=dist,node_modules)

| API | 정의 | 외부 사용 (import) |
|-----|------|--------------------|
| `createTomisColumnHelper` | `packages/grid-core/src/column/createTomisColumnHelper.ts:38` | **0** (정의 + index.ts export 만) |
| `useColumnPersistence` | `packages/grid-core/src/column/useColumnPersistence.ts:87` | **0** (Grid.tsx 내부 사용만 — 외부 import 0) |
| `ColumnVisibilityMenu` | `packages/grid-core/src/column/ColumnVisibilityMenu.tsx:64` | **0** (Grid.tsx 내부 사용만 — 외부 import 0) |
| `createGroupedColumns` | `packages/grid-core/src/column/createGroupedColumns.ts:101` | **0** (storybook + test 내부만) |
| `TomisColumnGroup` | `packages/grid-core/src/column/createGroupedColumns.ts:42` | **0** (storybook + test 내부만) |

- `useColumnPersistence` / `ColumnVisibilityMenu` 는 `Grid.tsx:135,260` 에서 내부 사용 중 — `@deprecated` 는 IDE hint 수준. typecheck/build 영향 없음 (TypeScript `@deprecated` 는 informational).

## 검증 결과

- `pnpm -F @tomis/grid-core typecheck`: **PASS** (exit 0, 0 errors)
- `pnpm -F @tomis/grid-core build`: **PASS** (ESM+CJS+DTS 모두 success)
- `@deprecated` JSDoc: 5 API 모두 적용 (정의 파일 + index.ts re-export)
- 다른 agent 변경 (ADR-002 coreRegister export, ADR-007 storage export) 충돌: **없음** — index.ts 편집 전 Read 수행, 충돌 없음 확인

## 결과 체크리스트

- [x] 5 API `@deprecated` marker (정의 파일)
- [x] 5 API `@deprecated` marker (index.ts re-export)
- [x] `ColumnVisibilityMenuProps` 함께 deprecate (advisor 권고)
- [x] alias 보존 (export 유지 — 다음 major 에서 제거)
- [x] CHANGELOG Deprecated 섹션 추가
- [x] Changeset minor 생성
- [x] typecheck PASS
- [x] build PASS
- [ ] `console.warn (dev only)` — 미적용 (task spec 범위 외)
- [ ] `pnpm -r typecheck` 전체 — Wave 3 동시 진행 중인 다른 agent (ADR-002, ADR-007, ADR-008, ADR-016) 와 격리하여 grid-core 단독 typecheck + build 만 수행

## 다음 단계

- 다음 major release 시 5 API 실 제거 (ADR-013 후속)
- `useColumnPersistence`: ADR-007 storage adapter 완료 후 "superseded by storage adapter" 문구를 구체적 대체 API 명 으로 업데이트
- `console.warn (dev only)` 추가: ADR-013 체크리스트 미완 항목 — 다음 minor cycle 에서 추가 가능. 구현 시 `process.env.NODE_ENV === 'development'` guard 사용
- ADR-003 (`@tomis/grid` 메타 facade) 작업 시 본 5 API 를 메타 facade 에서 re-export 하지 않도록 주의 (ADR-013 §실행 조건 정렬)
