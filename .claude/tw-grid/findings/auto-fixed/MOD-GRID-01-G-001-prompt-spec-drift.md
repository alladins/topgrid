# Finding: MOD-GRID-01 / G-001 — prompt-spec drift (F-05 obligation report)

**Goal**: G-001 — `<Grid data columns>` 단일 API + `enable*` 토글
**Stage**: implement
**Status**: ✅ RESOLVED — spec values applied (per C-1 + C-27 spec authority)
**Type**: prompt-spec drift (value drift)
**기록일**: 2026-05-14

---

## 컨텍스트

C-27 (Spec 권위) + implement-rubric F-05 에 따라, Implementer 는 prompt 와 spec.md
를 cross-check 하고 불일치 시 spec 값을 우선 적용 + drift 보고 의무가 있다.

본 G-001 implement prompt 와 spec.md 사이에 다음 2건의 value drift 를 발견했고,
모두 spec 우선 적용으로 해결했다.

## Drift Items

### Drift #1: `index.ts` re-export type 갯수

| Field | promptValue | specValue | resolution |
|-------|-------------|-----------|------------|
| `index.ts` re-export types | `export type { GridProps, RowSelectionMode } from './types';` (2종) | `export type { GridProps, GridRowSelectionOptions, GridPaginationOptions, RowSelectionMode } from './types';` (4종) — Section 2.4 | spec applied (4종 모두 export) |

**근거**: spec Section 2.4 명시:
```ts
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
} from './types';
```

**적용 결과**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts`
에 4종 type 모두 re-export. AC-007 ("Public API 명시 — `export type { GridProps,
GridRowSelectionOptions, GridPaginationOptions, RowSelectionMode }` 4종") 충족.

### Drift #2: `enableVirtualization` prop 추가 지시

| Field | promptValue | specValue | resolution |
|-------|-------------|-----------|------------|
| `enableVirtualization` prop in `GridProps<TData>` | "타입만 정의 + TODO 주석 — 실제 wiring은 G-004에서. true면 console.warn(dev-only)" | spec Section 2.1 `GridProps<TData>` 에 `enableVirtualization` 미정의 — D6 ("G-001 범위 외 — G-003/G-004") + Section 2.1 GridProps 8개 enable* (sort/multiSort/filter/pagination/columnPinning/columnResizing/expanding) + rowSelection 만 정의 | spec applied (`enableVirtualization` prop 추가 안 함) |

**근거**:
- spec D6: "본 G-001 범위: sort/filter/selection/pagination/pinning(state만, sticky CSS는 G-002) — virtualization/imperative ref/auto-select/skeleton 등은 G-003/G-004"
- spec Section 2.1 `GridProps<TData>` interface 정의에 `enableVirtualization` 필드 부재
- spec Section 11.2 Step 4 Grid.tsx 본체 코드에도 `enableVirtualization` 처리 없음
- AC-001 ("`interface GridProps<TData>` 정의 — Section 2.1 모든 prop이 명시적 type") 검증 시 prompt 추가 prop 은 spec drift 발생

**적용 결과**: `types.ts` `GridProps<TData>` 에 `enableVirtualization` prop 미추가.
G-004 spec 작성 시 도입. `Grid.tsx` 에 console.warn 코드 미추가 (불필요).

## 점수 처리

- **F-05 결과**: YES (drift 2건 모두 spec 우선 적용 + 본 finding 으로 보고).
- implement-score JSON 의 `promptSpecDrift[]` 필드에 위 2건 기록 권장:
  ```json
  "promptSpecDrift": [
    {
      "field": "index.ts re-export types",
      "promptValue": "{GridProps, RowSelectionMode}",
      "specValue": "{GridProps, GridRowSelectionOptions, GridPaginationOptions, RowSelectionMode}",
      "resolution": "spec applied (Section 2.4)"
    },
    {
      "field": "GridProps.enableVirtualization prop",
      "promptValue": "타입 정의 + console.warn (dev) — wiring은 G-004",
      "specValue": "GridProps에 미정의 (D6: virtualization은 G-004 범위)",
      "resolution": "spec applied (prop 추가 안 함)"
    }
  ]
  ```

## 학습 (다음 Goal 에 적용)

1. **메인 prompt 작성 시 spec.md 직접 Read 필수** — C-27. 구현 전 prompt ↔ spec
   cross-check 해야 한다.
2. **신규 prop 추가 지시는 spec Section 2.1 에 명시 필요**. spec 미정의 prop 은
   Implementer 가 추가하지 않음 (C-1 spec 권위).
3. **G-004 prep**: 본 finding 의 Drift #2 는 G-004 spec 작성 시 `enableVirtualization`
   prop 도입 + console.warn 가 필요한지 재검토 항목으로 등록.
