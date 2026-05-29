# ADR-010 실행 결과 — SortBadge 중복 제거 (grid-core/internal 단일화)

**실행일**: 2026-05-17
**Wave**: 3
**ADR**: ADR-MOD-GRID-REFACTOR-2026-05-17-010
**상태**: completed

---

## 1. 사용처 인벤토리 (Step 1)

### SortBadge 정의 위치 (이동 전)

| 파일 | 역할 | 비고 |
|------|------|------|
| `grid-core/src/internal/SortBadge.tsx` | Grid.tsx 내부용 — `{ sortIndex: number }` 만 | className 없음 |
| `grid-features/src/multi-sort/SortBadge.tsx` | public export — `SortBadgeProps` (`{ sortIndex, className? }`) | className 있음 |

### API 차이 발견 (advisor §2 예측 정확)

"~95% 동일" 의 5% 부분:
- grid-core 버전: props = `{ sortIndex: number }` (no className)
- grid-features 버전: props = `SortBadgeProps` (sortIndex + optional className)
- JSX output: grid-core 는 `className="..."` 고정, grid-features 는 template literal (`"... ${className}"`)

**결정**: grid-core 버전을 superset 으로 업그레이드 (className 추가). Grid.tsx 호출 `<SortBadge sortIndex={sortIndex} />` 은 prop optional 이므로 무변경.

### SortBadgeProps 위치 (이동 전)

- `grid-features/src/multi-sort/types.ts` 에 정의 (3개 interface 중 1개)
- ADR-009 의 `SortClearButtonProps` 이동 패턴 그대로 적용

### 사용처 (SortBadge consumer)

| 파일 | import 경로 | 변경 필요 여부 |
|------|------------|--------------|
| `grid-core/src/Grid.tsx:47` | `./internal/SortBadge` | 변경 없음 (상대 경로 유지) |
| `grid-features/stories/Features.stories.tsx:27` | `@tomis/grid-features` index 경유 | 변경 없음 (alias 경유 자동 해소) |
| `grid-features/src/multi-sort/SortClearButton.stories.tsx:23` | `../index` 경유 | 변경 없음 |
| `grid-features/src/multi-sort/MultiSortGrid.stories.tsx:28` | `../index` 경유 | 변경 없음 |
| `tw-framework-front/src/**` | — | 0 hits (production 사용자 없음) |

---

## 2. 변경 파일 인덱스

| 파일 | 변경 내용 |
|------|----------|
| `packages/grid-core/src/internal/SortBadge.tsx` | superset 업그레이드 — `SortBadgeProps` import + optional `className` prop + template literal JSX. Rationale 주석 갱신 (ADR-010 canonical source). |
| `packages/grid-core/src/internal/multi-sort/types.ts` | `SortBadgeProps` interface 추가. 상단 주석 갱신 (ADR-010 반영, `SortBadgeProps` 잔류 문구 제거). |
| `packages/grid-core/src/index.ts` | `SortBadge` + `SortBadgeProps` public 승격 (ADR-009 패턴 동일). |
| `packages/grid-features/src/multi-sort/SortBadge.tsx` | deprecation alias 로 치환 (`export { SortBadge } from '@tomis/grid-core'` + `@deprecated` JSDoc). |
| `packages/grid-features/src/multi-sort/types.ts` | `SortBadgeProps` interface 제거 (grid-core 이동). 상단 주석 갱신. |
| `packages/grid-features/src/index.ts` | `SortBadge` export 에 `@deprecated` 추가. `SortBadgeProps` re-export 를 `./multi-sort/types` → `@tomis/grid-core` 로 변경 + `@deprecated`. |
| `packages/grid-core/CHANGELOG.md` | ADR-010 항목 추가 (Unreleased). |
| `packages/grid-features/CHANGELOG.md` | ADR-010 Deprecated 항목 추가 (Unreleased). |
| `.changeset/adr-010-sortbadge-consolidation.md` | 신규 — grid-core minor + grid-features minor. |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | ADR-010 체크박스 + Implementation Note 추가. |

---

## 3. 검증 결과

### Typecheck

| 명령 | 결과 |
|------|------|
| `pnpm --filter @tomis/grid-core typecheck` | PASS (0 errors) |
| `pnpm --filter @tomis/grid-features typecheck` | PASS (0 errors) |
| `pnpm -r typecheck` | **14 packages PASS** |

### Build

| 명령 | 결과 |
|------|------|
| `pnpm --filter @tomis/grid-core build` | PASS — `dist/index.mjs` 65.02 KB, `dist/index.d.ts` 33.80 KB |
| `pnpm -r --filter './packages/**' build` | **14 packages PASS** |

### SortBadge grep 불변식

| 검사 | 결과 |
|------|------|
| `grep "export function SortBadge" packages/grid-core/src/internal/SortBadge.tsx` | **1 hit** (단일 정의) |
| `grep "export" packages/grid-features/src/multi-sort/SortBadge.tsx` | alias re-export 만 (`export { SortBadge } from '@tomis/grid-core'`) |
| `grep "SortBadgeProps" packages/grid-core/src/internal/multi-sort/types.ts` | 1 interface 정의 + 1 주석 |
| `grep "SortBadgeProps" packages/grid-features/src/index.ts` | `@tomis/grid-core` re-export (deprecated) |

---

## 4. 파일 배치 결정 (cosmetic deviation)

ADR-009 는 이동된 파일을 `internal/multi-sort/` 아래 배치. 본 ADR 은 `SortBadge.tsx` 를 `internal/` (flat) 에 유지. 이유:
- `SortBadge.tsx` 가 이미 `internal/SortBadge.tsx` 에 존재하고, Grid.tsx 가 해당 경로 참조.
- `internal/multi-sort/SortBadge.tsx` 로 이동 시 Grid.tsx import 경로 변경 + 이동 비용 발생.
- 기능 동작에 영향 없음 — cosmetic 일관성 vs. 이동 비용 trade-off 에서 현 위치 유지 채택.
- 결과 보고서 §4 에 명시 (advisor §Minor decision 권고 준수).

---

## 5. 결과 체크리스트

- [x] grid-core/internal/SortBadge.tsx — superset 업그레이드 (`className?` 추가)
- [x] SortBadgeProps — grid-core/internal/multi-sort/types.ts 로 이동
- [x] grid-core/src/index.ts — SortBadge + SortBadgeProps public 승격
- [x] grid-features/multi-sort/SortBadge.tsx — deprecation alias 로 치환
- [x] grid-features/multi-sort/types.ts — SortBadgeProps 제거 + 주석 갱신
- [x] grid-features/src/index.ts — @deprecated JSDoc + SortBadgeProps re-export 경로 변경
- [x] grid-core/internal/multi-sort/types.ts — 주석 갱신 (stale "SortBadgeProps remain in grid-features" 제거)
- [x] CHANGELOG (grid-core + grid-features) 갱신
- [x] Changeset `.changeset/adr-010-sortbadge-consolidation.md` 작성
- [x] ADR-010 본문 amendment (체크박스 + Implementation Note)
- [x] `pnpm -r typecheck` 14 packages PASS
- [x] `pnpm -r --filter './packages/**' build` 14 packages PASS
- [x] Grid.tsx 내부 import 경로 무변경 (상대 경로 유지)
- [x] 외부 사용자 (tw-framework-front) 영향 0 hits

---

## 6. 알려진 한계 / 후속 작업

### 한계

- **grid-features bundle size 측정 미수행**: ADR-010 체크리스트 항목 3 미완료. ADR-011 (size-limit ignore 정책 통일) 실행 후 재측정 필요.
- **SortBadge.tsx 파일 배치 cosmetic deviation**: `internal/SortBadge.tsx` (flat) vs ADR-009 의 `internal/multi-sort/` nesting. 기능 영향 없음.

### 후속 (별 ADR / Wave)

- **ADR-011 (size-limit ignore 정책 통일)**: Wave 1 accepted. 실행 후 ADR-010 의 bundle size 검증 가능.
- **다음 major 에서 grid-features deprecation alias 제거**: `SortBadge` + `SortBadgeProps` 양쪽.

---

## 7. Rollback 방법

본 결과 보고서 §2 의 파일 인덱스 참조. 변경 전 grid-features/SortBadge.tsx 의 내용은 `SortBadgeProps` (sortIndex + className?) 를 받는 함수 컴포넌트. grid-core/internal/SortBadge.tsx 의 이전 내용은 `{ sortIndex: number }` 만 받는 함수 컴포넌트.
