# ADR-009 실행 결과 — grid-core ↔ grid-features layering 정리

**실행일**: 2026-05-17
**Wave**: 2 (옵션 A — grid-features → grid-core/internal 이동)
**ADR**: ADR-MOD-GRID-REFACTOR-2026-05-17-009
**상태**: completed

---

## 1. 사용처 인벤토리 (Step 1)

### 3 export 의 원 정의 위치 (이동 전)

| Export | 정의 파일 | 비고 |
|--------|----------|------|
| `useColumnDrag` | `grid-features/src/column-drag/useColumnDrag.ts` | `useColumnOrderPersist` 의존 |
| `DropIndicator` | `grid-features/src/column-drag/DropIndicator.tsx` | 무의존 |
| `SortClearButton` | `grid-features/src/multi-sort/SortClearButton.tsx` | `SortClearButtonProps` 의존 |

### 부수 의존 (advisor §1 발견)

| 부수 정의 | 정의 파일 | 처리 |
|-----------|----------|------|
| `useColumnOrderPersist` (`useColumnDrag` 내부 호출) | `grid-features/src/column-drag/useColumnOrderPersist.ts` | **동반 이동** (grid-core/internal/) — 미이동 시 inversion 재발생 |
| `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps` | `grid-features/src/column-drag/types.ts` | **파일 전체 이동** (다른 consumer 0건 검증) |
| `UseColumnOrderPersistProps` | `useColumnOrderPersist.ts` 내 | **동반 이동** |
| `SortClearButtonProps` | `grid-features/src/multi-sort/types.ts` (4 interface 중 1개) | **추출 이동** — 나머지 3 interface (`SortBadgeProps`, `UseMultiSortOptions`, `UseMultiSortResult`) 는 grid-features 잔류 |

### grid-core 내 사용처 (3 export 의 내부 consumer)

- `grid-core/src/Grid.tsx:39` — `import { useColumnDrag, DropIndicator, SortClearButton } from '@tomis/grid-features';`
- `Grid.tsx:166` — `useColumnDrag<TData>({ ... })`
- `Grid.tsx:263` — `<SortClearButton onClear={...} />`
- `Grid.tsx:334` — `<DropIndicator ... />`

### 외부 사용자 (`tw-framework-front` 등)

- **0 hits** — `Grep "useColumnDrag|DropIndicator|SortClearButton" tw-framework-front/` → No matches.
- 결론: 외부 마이그레이션 부담 없음. grid-features public alias 1 cycle 동안만 유지 후 다음 major 에서 제거 가능.

### grid-features 내부 사용자 (stories)

- `column-drag/useColumnDrag.stories.tsx` — `from '../index'` 경유 → alias 통해 자동 해소.
- `multi-sort/SortClearButton.stories.tsx` — 동일.
- 직접 변경 불필요 (advisor §3 권고).

---

## 2. 이동된 파일 (grid-features → grid-core/internal)

| from | to |
|------|----|
| `packages/grid-features/src/column-drag/useColumnDrag.ts` | `packages/grid-core/src/internal/column-drag/useColumnDrag.ts` |
| `packages/grid-features/src/column-drag/useColumnOrderPersist.ts` | `packages/grid-core/src/internal/column-drag/useColumnOrderPersist.ts` |
| `packages/grid-features/src/column-drag/DropIndicator.tsx` | `packages/grid-core/src/internal/column-drag/DropIndicator.tsx` |
| `packages/grid-features/src/column-drag/types.ts` | `packages/grid-core/src/internal/column-drag/types.ts` |
| `packages/grid-features/src/multi-sort/SortClearButton.tsx` | `packages/grid-core/src/internal/multi-sort/SortClearButton.tsx` |
| `SortClearButtonProps` (in `multi-sort/types.ts`) | `packages/grid-core/src/internal/multi-sort/types.ts` (추출) |

원 파일들은 deprecation alias 로 변환 (삭제 X — 1 minor cycle 보존).

---

## 3. 변경 파일 인덱스

| 파일 | 변경 내용 |
|------|----------|
| `packages/grid-core/src/internal/column-drag/useColumnDrag.ts` | **신규** — useColumnDrag 본체 (`useColumnOrderPersist` 상대 import) |
| `packages/grid-core/src/internal/column-drag/useColumnOrderPersist.ts` | **신규** — 본체 + `UseColumnOrderPersistProps` interface |
| `packages/grid-core/src/internal/column-drag/DropIndicator.tsx` | **신규** — 본체 (의존 0) |
| `packages/grid-core/src/internal/column-drag/types.ts` | **신규** — 3 interface (`UseColumnDragProps/Return`, `DragThProps`) |
| `packages/grid-core/src/internal/multi-sort/SortClearButton.tsx` | **신규** — 본체 (`./types` 상대 import) |
| `packages/grid-core/src/internal/multi-sort/types.ts` | **신규** — `SortClearButtonProps` 만 |
| `packages/grid-core/src/Grid.tsx` (line 39 영역) | grid-features import → 3 internal/ 상대 import 로 교체 |
| `packages/grid-core/src/index.ts` | ADR-009 public exports 추가 (4 runtime + 5 type) |
| `packages/grid-core/package.json` | `dependencies."@tomis/grid-features"` 제거 |
| `packages/grid-features/src/column-drag/useColumnDrag.ts` | alias 로 치환 (`export { useColumnDrag } from '@tomis/grid-core';`) + @deprecated |
| `packages/grid-features/src/column-drag/useColumnOrderPersist.ts` | alias 치환 + @deprecated |
| `packages/grid-features/src/column-drag/DropIndicator.tsx` | alias 치환 + @deprecated |
| `packages/grid-features/src/column-drag/types.ts` | type alias 치환 |
| `packages/grid-features/src/multi-sort/SortClearButton.tsx` | alias 치환 + @deprecated |
| `packages/grid-features/src/multi-sort/types.ts` | `SortClearButtonProps` 제거 (나머지 3 interface 보존) |
| `packages/grid-features/src/index.ts` | column-drag 4 export 에 `@deprecated` JSDoc + `SortClearButtonProps` 를 grid-core 에서 re-export |
| `packages/grid-features/package.json` | `dependencies."@tomis/grid-core": "workspace:*"` 추가 (방향 정상화) |
| `packages/grid-core/CHANGELOG.md` | Unreleased ADR-009 항목 |
| `packages/grid-features/CHANGELOG.md` | Unreleased ADR-009 항목 (Deprecated 섹션) |
| `.changeset/adr-009-layering.md` | 신규 — grid-core minor + grid-features minor |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | ADR-009 본문 amendment (체크박스 + Implementation Note) |

---

## 4. 검증 결과

### Typecheck

| 명령 | 결과 |
|------|------|
| `pnpm --filter @tomis/grid-core typecheck` | PASS (0 errors) |
| `pnpm --filter @tomis/grid-features typecheck` | PASS (0 errors) (단, grid-core build 필요 — alias 가 dist/ 의 d.ts 참조) |
| `pnpm -r typecheck` | 14 packages PASS |

### Build

| 명령 | 결과 |
|------|------|
| `pnpm --filter @tomis/grid-core build` | PASS — `dist/index.mjs` 64.95 KB, `dist/index.d.ts` 33.02 KB |
| `pnpm -r --filter './packages/**' build` | 14 packages PASS |
| `pnpm -r build` | apps/docs FAIL (사전 결함 `customCss: []` C-5 drift — ADR-009 무관) |

### grid-core → grid-features 의존성 제거 확인

- `grid-core/package.json` 의 `dependencies` 키 부재 → 0 hits.
- `Grep "@tomis/grid-features" packages/grid-core/src/` — 0 import (JSDoc 주석만 매치).
- `grid-core/dist/index.mjs` line 1-10 import 검사 — `@tomis/grid-features` import 0건 (이전: line 4 에 import 존재했음).
- 결과: **architectural inversion 완전 해소**.

### grid-features alias 동작 확인

- `grid-features/dist` 미빌드 (검증 시점 미실행) — 그러나 src typecheck PASS 로 alias 정합 확정.
- `grid-features` 의 4 runtime + 5 type export 가 `@tomis/grid-core` 경유 re-export. Public API 사양 불변.

### ADR-010 정합 (참고)

- `grid-core/src/internal/SortBadge.tsx` 미수정 (advisor §5 권고). ADR-010 의 Wave 3 영역 — ADR-009 의 결과로 unblocked.

---

## 5. 결과 체크리스트

- [x] 3 export (실제 4 export — `useColumnOrderPersist` 동반) + 5 type 을 grid-core/internal 로 이동
- [x] grid-core/package.json `dependencies` 제거
- [x] grid-core/src/index.ts 에 public 승격 (4 runtime + 5 type export)
- [x] grid-features 의 5 export 파일 deprecation alias 로 치환 (`@deprecated` JSDoc 포함)
- [x] grid-features/package.json 에 `@tomis/grid-core: workspace:*` 추가 (의존성 방향 정상화)
- [x] CHANGELOG (grid-core + grid-features) 갱신
- [x] Changeset (`.changeset/adr-009-layering.md`) 작성
- [x] ADR-009 본문 amendment + Implementation Note
- [x] `pnpm -r typecheck` PASS
- [x] `pnpm -r --filter './packages/**' build` PASS
- [x] Grid.tsx import 경로 갱신
- [x] 외부 사용자 (tw-framework-front) 영향 grep — 0 hits

---

## 6. 알려진 한계 / 후속 작업

### 한계

- **번들 사이즈 측정 미수행**: `pnpm size` 미실행 (ADR-009 본문 의무 #5: "grid-features bundle size 측정 — 감소 확인"). `.size-limit.json` 의 ignore 정책 (ADR-011 미실행) 이 grid-features ignore 7개 / 나머지 0개 비일관 → 측정 신뢰성 ↓. ADR-011 (Wave 1 accepted) 실행 후 재측정 필요.
- **순환 의존성 발견 X**: grid-features → grid-core 단방향 (이전: grid-core → grid-features). pnpm install 시 ERR_PNPM_RECURSIVE 등 없음. clean topological order 확정.
- **`@tomis/grid-features` 의 dist (빌드 산출물)** 가 ADR-009 변경 반영 전 상태로 commit 가능 — 향후 release 시 재빌드.

### 후속 (별 ADR / Wave)

- **ADR-010 (SortBadge 중복 제거)**: ADR-009 의 옵션 A 결과를 따라 `grid-core/internal/SortBadge.tsx` 가 canonical, `grid-features/multi-sort/SortBadge.tsx` 가 deprecation alias 로 정리되어야 함. ADR-009 의 패턴 정합. Wave 3 영역.
- **ADR-011 (size-limit ignore 정책 통일)**: Wave 1 accepted. 실행 후 ADR-009 의 bundle size 검증 가능.
- **다음 major 에서 grid-features 의 deprecation alias 제거**: 본 ADR 의 결정에 따라 1 minor cycle 후 cleanup.
- **`grid-features` dist 재빌드 + size-limit 측정**: deprecation alias 가 grid-core 경유로 tree-shake 되어야 — bundle 영향 측정 + ADR-011 후속.

---

## 7. Rollback 방법

검증 완료 후 `.adr-009-backup/` 정리됨 (advisor §1 권고). 모노레포는 git repo 미초기화 상태 — rollback 이 필요한 경우 본 결과 보고서 §2/§3 의 파일 인덱스를 참조하여 수동 복원 가능.

추가 검증 (advisor 최종 권고):
- `Grep "function useColumnDrag" packages/grid-features/dist/index.mjs` → 0 hits 확인.
- `head -1 packages/grid-features/dist/index.mjs` → `export { DropIndicator, SortClearButton, useColumnDrag, useColumnOrderPersist } from '@tomis/grid-core';` — alias chain 이 runtime tree-shake 까지 통과한 passthrough 임을 확정.
