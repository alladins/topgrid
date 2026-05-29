# ADR-004 실행 결과 — 5 variant → monorepo legacy alias

**실행일**: 2026-05-17
**Wave**: 5 (시각 baseline 옵션 A 수동 screenshot)
**상태**: partial (4/5 alias 교체 완료, EditableGrid monorepo 대응 부재)

---

## 변경 요약

- 4 variant (BaseGrid, ColumnPinGrid, TreeGrid, VirtualGrid) 자체 구현 → monorepo `@tomis/grid-core` legacy alias 교체
- 905 LOC 절감 (291 + 220 + 174 + 220 = 905; EditableGrid 251 LOC 유지)
- 영향 페이지: **0건** (현재 미사용 컴포넌트)

---

## 5 variant 매핑

| variant | tw-front (before LOC) | monorepo (after alias) | 1:1 동등? |
|---------|----------------------|----------------------|-----------|
| BaseGrid | 291 LOC, useReactTable 직접 | `@tomis/grid-core` → `grid-core/src/legacy/BaseGrid.tsx` (36 LOC) | YES — props API `BaseGridProps` 동일 (ADR-008에서 이미 grid-core re-export 완료) |
| ColumnPinGrid | 220 LOC, useReactTable 직접 | `@tomis/grid-core` → `grid-core/src/legacy/ColumnPinGrid.tsx` (61 LOC) | YES — `ColumnPinGridProps` 동일 shape (pinLeft/pinRight/pagination/rowSelection/onRowClick/loading/emptyText/className) |
| TreeGrid | 174 LOC, useReactTable 직접 | `@tomis/grid-core` → `grid-core/src/legacy/TreeGrid.tsx` (58 LOC) | YES — `TreeGridProps` 동일 (getSubRows/expandAll/onRowClick/loading/emptyText/className) |
| VirtualGrid | 220 LOC, useReactTable+react-virtual 직접 | `@tomis/grid-core` → `grid-core/src/legacy/VirtualGrid.tsx` (49 LOC) | YES — `VirtualGridProps extends BaseGridProps` + rowHeight(40)/containerHeight(500) 동일 defaults |
| EditableGrid | 251 LOC, useReactTable+useChangeTracking 직접 | **없음** (grid-core/src/legacy/ 에 미존재) | **NO — PARTIAL** |

---

## EditableGrid partial 사유

`topvel-grid-monorepo/packages/grid-core/src/legacy/` 에는 아래 5 파일만 존재:
- `BaseGrid.tsx`, `ColumnPinGrid.tsx`, `TreeGrid.tsx`, `VirtualGrid.tsx`, `GroupedHeaderGrid.tsx`

`EditableGrid` 에 대응하는 legacy wrapper 없음. tw-front 의 `EditableGrid` 는:
- `@tomis/grid-renderers` 의 `EditableCell` 사용 (외부 import 유지)
- `@tomis/grid-pro-tracking` 의 `useChangeTracking` 사용 (외부 import 유지)
- 자체 편집 상태 관리 (`editingCell`, `commitEdit`, `cancelEdit`) 포함

유사 컴포넌트로 `grid-pro-tracking/src/legacy/ChangeTrackingGrid.tsx` 가 존재하나, API shape 이 다름 (edit cell 방식 vs change tracking 방식). 1:1 교체 불가.

**권고**: grid-core/legacy 에 `EditableGrid` wrapper 추가 별도 ADR (다음 cycle).

---

## 사용처 인벤토리 (보고서 §13 #2 추가 조사 결과)

grep `(BaseGrid|ColumnPinGrid|TreeGrid|VirtualGrid|EditableGrid)` `tw-framework-front/src/pages/`:

| variant | 사용 페이지 수 |
|---------|--------------|
| BaseGrid | 0 |
| ColumnPinGrid | 0 |
| TreeGrid | 0 |
| VirtualGrid | 0 |
| EditableGrid | 0 |

**총 0건** — 5 variant 모두 pages 에서 미사용. 컴포넌트 파일 자체와 `types/tomis/grid.ts` 에서만 참조.

---

## 변경된 파일

```
tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx
  291 LOC → 6 LOC
  export { BaseGrid } from '@tomis/grid-core';
  export type { BaseGridProps } from '@tomis/grid-core';

tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx
  220 LOC → 6 LOC
  export { ColumnPinGrid } from '@tomis/grid-core';
  export type { ColumnPinGridProps } from '@tomis/grid-core';

tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx
  174 LOC → 6 LOC
  export { TreeGrid } from '@tomis/grid-core';
  export type { TreeGridProps } from '@tomis/grid-core';

tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx
  220 LOC → 6 LOC
  export { VirtualGrid } from '@tomis/grid-core';
  export type { VirtualGridProps } from '@tomis/grid-core';

tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx
  251 LOC — 변경 없음 (monorepo 대응 부재, partial)
```

---

## 검증 결과

### tw-front typecheck

```
npx tsc --noEmit -p tsconfig.app.json
```

- **baseline (변경 전)**: `PayReal01EditModal.tsx` 관련 7 errors (pre-existing, Grid 무관)
- **변경 후**: 동일 7 errors — **신규 오류 0건**

**결론**: typecheck PASS (신규 오류 없음)

### 근거

`@tomis/grid-core` path alias:
- `tsconfig.app.json` L24: `"@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"]`
- `vite.config.ts` L18: `'@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src')`

두 설정이 이미 존재 → 별도 변경 불필요.

---

## 사용자 수동 시각 검증 가이드

현재 5 variant 를 직접 import 하는 페이지가 **0건**이므로 즉각적인 시각 회귀 위험 없음.

향후 페이지에서 아래 경로로 import 시 검증 필요:

| variant | 권장 import 경로 (after) | 검증 포인트 |
|---------|--------------------------|------------|
| BaseGrid | `import { BaseGrid } from '@tomis/grid-core'` 또는 `from '../components/tomis/Grid/BaseGrid'` | sort/filter/pagination 기능, row selection, loading skeleton |
| ColumnPinGrid | `import { ColumnPinGrid } from '@tomis/grid-core'` | 좌/우 고정 컬럼 sticky shadow, scroll 시 pin 유지 |
| TreeGrid | `import { TreeGrid } from '@tomis/grid-core'` | 트리 펼치기/접기 버튼, depth 들여쓰기, expandAll prop |
| VirtualGrid | `import { VirtualGrid } from '@tomis/grid-core'` | 가상 스크롤 성능, containerHeight/rowHeight 기본값 (40/500) 유지 |
| EditableGrid | (미변경, 현행 유지) | 인라인 편집, change tracking 연동 |

**검증 체크리스트**:
- [ ] column-pin: 좌측/우측 고정 컬럼 shadow 렌더
- [ ] tree: 펼치기/접기 토글 + 깊이별 배경색
- [ ] virtual: 대용량 데이터 가상 스크롤 성능 유지
- [ ] editable: 인라인 편집 + Enter/Escape 키 동작

---

## 결과 체크리스트

- [x] 4 variant alias 교체 (BaseGrid, ColumnPinGrid, TreeGrid, VirtualGrid)
- [x] tw-front typecheck PASS (신규 오류 0건)
- [x] 페이지 import 인벤토리 완료 (0건)
- [ ] 사용자 수동 시각 검증 (대기 — 현재 페이지 import 0건)
- [ ] EditableGrid monorepo wrapper 추가 (별도 ADR)

---

## 알려진 한계

1. **EditableGrid 미완**: grid-core/legacy 에 대응 wrapper 없음. 251 LOC 자체 구현 유지. 별도 ADR 에서 처리.
2. **export default 제거**: 원본 tw-front 파일은 `export default Component` 패턴이었으나, monorepo alias 는 named export 전용. 현재 페이지 import 0건으로 영향 없음. 향후 default import 패턴 사용 시 named import 로 변경 필요.
3. **시각 회귀 위험**: 현재 페이지 import 0건이나, 향후 페이지 추가 시 monorepo 컴포넌트 행동 검증 의무.
4. **TreeGridProps 중복**: `tw-framework-front/src/types/tomis/grid.ts` 에 로컬 `TreeGridProps` 정의 존재 (L46-49). monorepo 의 `TreeGridProps` 와 shape 동일하나 별도 정의. 추후 제거 권고 (ADR-008 후속).
