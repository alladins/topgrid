# Wave Residual 1 — EditableGrid 처리 신규 ADR Spec

**작성일**: 2026-05-17
**상태**: completed (권고 옵션 **C (자체 구현 deprecation + 삭제)** 채택, ADR-019 본문 작성 권고)
**원본 task**: ADR-004 partial 잔존 — EditableGrid monorepo 동등 부재로 5/5 중 1 미해결
**참조 ADR**: ADR-MOD-GRID-REFACTOR-2026-05-17-004 (5 variant alias, 4/5 partial), ADR-008 (types/tomis/grid.ts re-export), ADR-MOD-GRID-10/G-005 (ChangeTrackingGrid alias)
**실 코드 변경**: 0건 (spec + ADR-019 본문 추가만)

---

## 0. Executive Summary

**결론**: **옵션 C 채택 권고 — EditableGrid 컴포넌트 (252 LOC) 자체 폐기 + 즉시 삭제**. monorepo 신설 (옵션 B) / 영구 보존 (옵션 A) 모두 각하. ADR-019 본문 작성 (결번 marker 아님).

**핵심 근거 (1줄)**:

`Grep "EditableGrid" tw-framework-front/src/` (`-n` `output_mode:content`) 결과 — 모든 hit 이 **자기 파일 (`EditableGrid.tsx`) + types 주석 1건** 으로 제한. `pages/`, `stories/`, `tests/`, 기타 컴포넌트 어디에서도 import 0건. **252 LOC 완전 dead code**.

**Critical 분리 (advisor 권고)**:

- **`EditableGrid.tsx` 컴포넌트 (252 LOC)** = dead code. 삭제 대상.
- **`EditableColumnMeta` 타입 (`types/tomis/grid.ts:24`)** = **alive**. `PayrollEditablePage.tsx:8` 가 사용 (ChangeTrackingGrid 의 column meta 로). **타입 보존 필수** — 컴포넌트와 함께 삭제 시 PayrollEditablePage 빌드 깨짐.

**ADR-017 결번 vs ADR-019 본문 — 형상 차이**:

- ADR-017 = sub-spec `wave2-adr-001-sub-spec.md:738` 의 조건부 retraction 이 사용자 §9.1=B 선택으로 **자동 발효** → 결번. 결정은 이미 ADR-001 본문에 흡수.
- ADR-019 = ADR-004 본문 ("EditableGrid 는 monorepo 대응 부재 — 별도 ADR" `decisions.md:340, 356, 379, 391`) 가 **명시적으로 deferred** — retraction 없음. 본 cycle 에서 실제 결정 필요. **본문 작성 의무**.

**다음 단계**: 본 spec 채택 시 implementer 위임 1건 (252 LOC 파일 삭제 + ADR-019 결과 marker 추가). 권고 옵션 C 의 사용처 영향 = 0 (이미 사용처 0).

---

## 1. tw-front EditableGrid 분석

### 1.1 파일 메타

| 항목 | 값 |
|------|-----|
| 경로 | `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` |
| LOC | 252 (코드 230 + 사용 예시 주석 22) |
| export | `export default EditableGrid` (named export 없음) |
| 의존성 | `react`, `@tanstack/react-table`, `@tomis/grid-renderers` (EditableCell, EditType), `@tomis/grid-pro-tracking` (useChangeTracking), 로컬 types/tomis/grid.ts (EditableColumnMeta, GridPaginationOptions) |

### 1.2 API shape (`EditableGridProps<TData>` L17-35)

```typescript
interface EditableGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  onDataChange?: (rowIndex: number, colId: string, value: unknown) => void;
  pagination?: GridPaginationOptions;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  // G-005 (D8) — additive change-tracking integration
  enableChangeTracking?: boolean;
  rowKey?: keyof TData | ((row: TData) => string);
}
```

### 1.3 내부 state machine (L48-110)

- `useState<TData[]>(initialData)` — controlled-by-prop 가 아니라 prop 초기값을 internal state 로 복사. `setData` 가 commit 시 호출.
- `useState<SortingState>([])` — sort.
- `useState<CellPosition | null>(editingCell)` — 편집 중인 셀 좌표 (rowIndex + colId).
- `useState<number>(pageIndex)` — pagination.
- `useState<number>(pageSize)` — pagination (init from prop, `setPageSize` 미사용).

`commitEdit(rowIndex, colId, newValue)` 가 핵심: setData 로 internal state 갱신 + `onDataChange?` 콜백 + `enableChangeTracking` 활성 시 `tracking.updateRow(key, patch)` 추가 dispatch (G-005 additive).

### 1.4 monorepo 표준과의 gap

| 측면 | tw-front EditableGrid | monorepo `ChangeTrackingGrid` (`grid-pro-tracking/src/legacy/`) | monorepo `<Grid>` (`grid-core`) |
|------|----------------------|------------------------------------------------------------|--------------------------------|
| state 소유권 | 자체 `useState<TData[]>` | `useChangeTracking` 가 rows 소유 (ref) | controlled — `data` prop |
| 편집 UI 트리거 | 자체 `editingCell` (rowIndex+colId) + EditableCell 렌더 | 셀 클릭 → `useChangeTracking.updateRow` 호출 | n/a (no built-in edit) |
| change tracking | `enableChangeTracking?` opt-in | always-on (default) | n/a |
| imperative API | 없음 (props 만) | `ChangeTrackingAPI<TData> & GridHandle<TData>` ref | `GridHandle<TData>` ref |
| watermark | 없음 | `<div className="relative">` + `<Watermark/>` (ADR-001 사후 추가) | 없음 |
| 사용 layer | tw-front 자체 컴포넌트 | Pro tier (license 필요) | OSS tier |

**핵심 차이**: tw-front EditableGrid 의 "편집 UI + state 소유" 패턴은 monorepo 에 없음. 가장 가까운 것은 `ChangeTrackingGrid` 이나, 이는 cell-edit 트리거가 없는 row-level change tracker (cell 편집은 caller 가 `tracking.updateRow` 호출 의무).

**즉**: monorepo 가 의도적으로 안 만든 것이 아니라, **다른 디자인 선택** — monorepo 는 "cell 편집 = caller 책임 + tracking = wrapper 책임" 분리, tw-front EditableGrid 는 "둘 다 컴포넌트 안" 일체형.

---

## 2. 사용처 인벤토리 (보고서 §13 #2 추가 조사)

### 2.1 컴포넌트 import grep

| Scope | Pattern | 결과 |
|-------|---------|------|
| `tw-framework-front/src/pages/` | `EditableGrid` | **0 files** |
| `tw-framework-front/src/` 전체 (stories/tests 포함) | `**/*.{stories,test,spec}.{ts,tsx}` × `EditableGrid` | **0 files** |
| `tw-framework-front/src/` 전체 | `EditableGrid` (substring) | 자기 파일 `EditableGrid.tsx` 7 hit + `types/tomis/grid.ts:21` 주석 1 hit |

### 2.2 hit 상세 (자기 참조 7건 + 타입 주석 1건)

`Grep "EditableGrid" tw-framework-front/src/ -n`:
- `types/tomis/grid.ts:21` — 주석 `// EditableGrid` (타입 그룹 라벨)
- `components/tomis/Grid/EditableGrid.tsx:17, 37, 47, 65, 230, 246` — 자기 파일
- (이 외 hit 없음)

### 2.3 `EditableColumnMeta` 타입 사용처 (분리 추적)

| 파일 | line | 용도 |
|------|------|------|
| `types/tomis/grid.ts` | 24 | 타입 정의 |
| `components/tomis/Grid/EditableGrid.tsx` | 13, 115 | 컴포넌트 내부 사용 |
| `pages/tomis/payroll/PayrollEditablePage.tsx` | 8, 141 | **ChangeTrackingGrid 의 column meta 로 사용** |

**중요**: PayrollEditablePage 는 `ChangeTrackingGrid` (자체 compat shim, `components/tomis/Grid/ChangeTrackingGrid.tsx`) 를 사용하나, column meta 는 `EditableColumnMeta` 타입을 재활용. 즉 **타입은 EditableGrid 컴포넌트와 독립적으로 live** — 옵션 C 채택 시 타입은 보존 의무.

### 2.4 monorepo doc 참조 (정보 only)

`Grep "EditableGrid" packages/`:
- `grid-pro-datamap/dist/index.d.ts:47` — 주석 ("마이그레이션 alias: EditableGrid의 selectOptions 패턴")
- `grid-pro-datamap/src/types.ts:53` — 동일 주석 (소스)
- `grid-pro-range/README.md:46` — **`export function EditableGrid({ columns, data, onDataChange })`** 예제 코드 (doc-only)
- `grid-renderers/src/EditableCell.tsx:3, 54, 79` — EditableCell JSDoc 이 "absorbs L0 EditableGrid L75-129" 명시 (마이그레이션 정합 기록)
- `grid-renderers/dist/index.d.ts:378, 399, 417` — 동일

**결론**: monorepo 의 doc 참조는 모두 **"EditableCell 가 EditableGrid 의 inline JSX 를 흡수했다"** 라는 마이그레이션 정합 기록. 실 컴포넌트 import 0. doc 의 EditableGrid 예제는 grid-pro-range README 에 1건 — 별도 정리 권고 (본 ADR 부수 정리 가능).

### 2.5 사용처 인벤토리 결론

| 항목 | 수치 |
|------|-----|
| `EditableGrid` 컴포넌트 실 import | **0 (zero)** |
| `EditableColumnMeta` 타입 실 import | **1 file** (PayrollEditablePage.tsx) |
| monorepo 내 EditableGrid 코드 참조 | **0** (doc/주석만) |

---

## 3. Component vs Type 분리 (load-bearing)

### 3.1 분리 사유

advisor 권고: "Critical distinction to surface in the spec — `EditableGrid.tsx` (252 LOC component) is truly dead, deletable. `EditableColumnMeta` type in `types/tomis/grid.ts:24` is alive, used by PayrollEditablePage.tsx:8 for ChangeTrackingGrid column meta. Cannot be deleted with the component."

### 3.2 옵션별 분리 영향

| 옵션 | 컴포넌트 | 타입 |
|------|---------|------|
| A (영구 보존) | 252 LOC 유지 | 보존 |
| B (monorepo 신설) | 252 LOC 유지 (또는 monorepo wrapper alias 로 축소) | 보존 또는 monorepo 로 이동 (ADR-008 정합) |
| **C (deprecation + 삭제)** | **삭제 (0 LOC)** | **`types/tomis/grid.ts` 에 보존** |

옵션 C 채택 시 implementer 가 컴포넌트만 삭제 + 타입 유지 명확히 알도록 ADR 본문 + spec 에서 명시.

### 3.3 타입의 향후 거취 (별도 결정 — 본 ADR 범위 외)

`EditableColumnMeta` 가 monorepo 의 `grid-renderers` (EditableCell 의 column meta 옵션) 또는 `grid-core` (column meta 공용) 으로 이관 가능. 그러나:
- 현재 `EditableColumnMeta` shape = `{ editable?, editType?, selectOptions? }` 는 tw-front 의 자체 정의 — monorepo `EditableCellProps` 의 `selectOptions?: ReadonlyArray<{ label: string; value: string }>` 와 type 정합 (호환).
- ADR-008 (types re-export) 의 후속으로 monorepo 로 이관 가능성 있으나, 본 ADR 의 결정은 **컴포넌트 삭제만**. 타입 이관은 별도 ADR 권고.

---

## 4. 3 옵션 평가

### 4.1 평가 매트릭스

| 옵션 | 설명 | 공수 | semver | 위험 | 사용처 영향 | dead code 잔여 |
|------|------|------|--------|------|------------|---------------|
| **A** | 자체 구현 영구 보존 (현재 상태) | 0h | none | low | 0 (사용처 0) | **+252 LOC 영구** |
| **B** | monorepo 에 신 컴포넌트 신설 (`grid-pro-tracking/src/legacy/EditableGrid.tsx` 등) → tw-front re-export | 6-8h | grid-pro-tracking minor | medium (디자인 충돌 + alias API 합의) | 0 (tw-front 자체 보존) | +252 LOC tw-front + 신설 monorepo LOC |
| **C** | tw-front 자체 구현 즉시 삭제 (`EditableGrid.tsx` 252 LOC → 0 LOC) — 타입 `EditableColumnMeta` 만 보존 | 0.5h (파일 삭제 + grid-pro-range/README.md:46 정리) | none | low | 0 (사용처 0) | **0 LOC** |

### 4.2 옵션별 정직 framing (advisor 권고 — B 부정 framing)

**옵션 A — 권고 부정**:
- ADR-004 partial 상태 = "결정 보류". "보류 영구" 는 결정이 아님. 252 LOC dead code 영구 유지 + 분기 진화 위험 누적 + 신규 페이지에서 잘못 사용 위험.
- POL-MIG-STAGE 의 의도 (사용처 점진 마이그레이션) 미달성.

**옵션 B — 권고 부정 (negative ROI)**:
- 사용자 0 + monorepo consumer 0 + ChangeTrackingGrid 가 PayrollEditablePage 의 실 use case 충족.
- monorepo 에 EditableGrid wrapper 신설 = **존재하지 않는 사용자를 위한 컴포넌트 신설**.
- API 디자인 결정 부담: monorepo 의 ChangeTrackingGrid 와 어떻게 분리하나? "cell 편집 트리거" 기능을 monorepo 가 흡수하는 경우 ChangeTrackingGrid 와의 책임 경계 재정의 의무 (분리된 ADR 필요).
- 공수 6-8h, 사용자 0 → **부정적 ROI 명확**.
- 향후 신규 페이지가 EditableGrid 패턴이 필요해진 시점에 **다시 결정** 하면 됨 (premature 회피).

**옵션 C — 권고**:
- 사용처 0 = 즉시 삭제 가능.
- `EditableColumnMeta` 타입은 PayrollEditablePage 가 ChangeTrackingGrid 의 column meta 로 사용 — **타입 유지 필수**.
- 향후 cell-edit 패턴이 다시 필요해지면: (i) ChangeTrackingGrid + 자체 EditableCell wiring, (ii) 새 monorepo 컴포넌트 신설 (그 때 ADR 신설) — 둘 다 본 ADR 의 후속.
- `grid-pro-range/README.md:46` 의 예제 (doc-only) → `ChangeTrackingGrid` 로 rename 추가 정리 (부수 작업, 본 ADR scope 안).

### 4.3 권고

**옵션 C** — confidence: high, scope-risk: narrow.

---

## 5. ADR-019 본문 draft

decisions.md 의 ADR-018 (line 1404~1599) 끝 → 부록 A (line 1601) 시작 사이에 **ADR-019 본문 삽입**. 결번 marker 아님 — 실 결정.

### 5.1 헤더

```
## ADR-MOD-GRID-REFACTOR-2026-05-17-019: tw-framework-front `EditableGrid` 컴포넌트 폐기 (ADR-004 partial 해소)

**결정일**: 2026-05-17 (Wave residual — ADR-004 의 partial 잔존 해소)
**승인일**: (사용자 결정 대기 — 본 spec 의 §6 D-1)
**상태**: proposed
**연관 ADR**: ADR-004 (4/5 alias 완료, EditableGrid partial), ADR-008 (types re-export), ADR-MOD-GRID-10/G-005 (ChangeTrackingGrid alias)
**연관 finding**: wave5-adr-004-result.md §EditableGrid partial 사유, wave-residual-1-editablegrid-spec.md (본 spec)
**연관 policy/constraint**: POL-MIG-STAGE (사용처 점진 마이그레이션), C-31 (Functional Wiring Audit)
```

### 5.2 결정

`tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (252 LOC) 를 **삭제**한다. `types/tomis/grid.ts` 의 `EditableColumnMeta` 타입은 **보존** (`PayrollEditablePage.tsx` 가 `ChangeTrackingGrid` 의 column meta 로 사용 — alive).

monorepo 신설 (옵션 B) 도, 영구 보존 (옵션 A) 도 채택하지 않는다.

### 5.3 사유

1. **사용처 0** — `Grep "EditableGrid" tw-framework-front/src/` 결과 자기 파일 외 import 0건 (pages/, stories/, tests/, components/ 모두). 252 LOC 완전 dead code.
2. **PayrollEditablePage 의 실 use case 는 `ChangeTrackingGrid`** (`pages/tomis/payroll/PayrollEditablePage.tsx:5,199`). EditableGrid 가 의도한 "cell 편집 + row tracking" 시나리오를 ChangeTrackingGrid 가 이미 충족 — EditableGrid 미사용은 우연이 아니라 패턴 정합의 결과.
3. **monorepo 디자인 차이는 누락이 아닌 의도** — `grid-renderers/EditableCell` JSDoc (`src/EditableCell.tsx:3` "Absorbs tw-framework-front EditableGrid.tsx L75-129") 가 명시: monorepo 는 EditableGrid 의 inline JSX 를 EditableCell 로 흡수 + cell 편집 트리거를 caller 책임으로 분리. 일체형 컴포넌트는 monorepo 설계 의도 외.
4. **옵션 B (monorepo 신설) 부정 ROI** — 사용자 0 + ChangeTrackingGrid + EditableCell 조합으로 동일 기능 가능. 6-8h 공수에 사용자 0 → premature.
5. **POL-MIG-STAGE 정합** — 마이그레이션 단계 종료 (dead code 잔존 = 단계 미완).

### 5.4 대안 (반드시 2개 이상)

| 대안 | 설명 | 각하 이유 |
|------|------|----------|
| **A. 영구 자체 보존** | 252 LOC 그대로 유지. ADR-004 partial 영구화 | 분기 진화 위험 + dead code 영구 + 결정 보류 = 미결정. 신규 페이지가 잘못 채택 위험. |
| **B. monorepo 에 EditableGrid wrapper 신설** | `grid-pro-tracking/src/legacy/EditableGrid.tsx` 신설 후 tw-front re-export (4 alias 패턴 정합) | 사용자 0 + ChangeTrackingGrid 가 use case 충족 + API 디자인 결정 부담 (ChangeTrackingGrid 와의 책임 경계 재정의 의무, 별도 ADR 필요). 6-8h 공수 negative ROI. |

(C 채택 = 본 ADR 의 결정)

### 5.5 Trade-off

| Pro | Con |
|-----|-----|
| 252 LOC dead code 즉시 제거 — 유지 부담 0 | 향후 cell-edit 일체형 컴포넌트가 필요해지면 재신설 의무 (그 시점 ADR 신설) |
| ADR-004 partial 잔존 완전 해소 (5/5 결론) | 타입 `EditableColumnMeta` 와 컴포넌트 분리 — implementer 가 컴포넌트만 삭제 명확 인지 의무 |
| POL-MIG-STAGE 완결 | `grid-pro-range/README.md:46` 의 EditableGrid 예제 (doc) 부수 정리 의무 (ChangeTrackingGrid 로 rename) |
| 신규 페이지가 EditableGrid 우연 채택 위험 0 | (없음) |

### 5.6 영향 분석

- **영향 패키지**: tw-framework-front (변경). monorepo 변경 0.
- **예상 공수**: 0.5h (파일 삭제 + grid-pro-range/README.md doc 부수 정리).
- **위험**: low — 사용처 0건 검증 완료.
- **semver 영향**: **none (앱 내부 변경)** — tw-framework-front 는 npm publish 대상 아님. monorepo 패키지 자체 변경 0.
- **breaking change 여부**: no (앱 내부, 사용처 0).

### 5.7 실행 조건 (실행 전 충족 필요)

- 사용자 §6 D-1 응답 (옵션 C 채택 확인).
- `EditableColumnMeta` 타입 보존 확인 (implementer 가 컴포넌트 파일만 삭제, 타입 파일 미변경).

### 5.8 결과 (실행 후 검증 항목)

- [ ] `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` 파일 삭제 (252 → 0 LOC).
- [ ] `git status` 에서 본 파일 외 변경 0건.
- [ ] `npx tsc --noEmit -p tsconfig.app.json` — baseline 7 errors (PayReal01EditModal, pre-existing) 유지, 신규 오류 0.
- [ ] `Grep "EditableGrid" tw-framework-front/src/` — 0 hit (자기 파일 삭제 후, 주석 `types/tomis/grid.ts:21` 잔존은 정리 권고 부수 정리).
- [ ] `types/tomis/grid.ts:24` 의 `EditableColumnMeta` 유지 확인 (PayrollEditablePage 빌드 PASS).
- [ ] (부수 정리 권고) `grid-pro-range/README.md:46` 의 `export function EditableGrid(...)` 예제 → `ChangeTrackingGrid` 로 rename (doc-only).
- [ ] (부수 정리 권고) `types/tomis/grid.ts:21` 의 `// EditableGrid` 그룹 주석 → `// EditableColumnMeta (used by ChangeTrackingGrid)` 등 rename.

### 5.9 알려진 한계

1. **타입 향후 거취 미결**: `EditableColumnMeta` 가 monorepo 의 `grid-renderers` 로 이관 가능 (ADR-008 후속). 본 ADR 의 범위 외.
2. **향후 재신설 가능성**: cell-edit 일체형 컴포넌트가 다시 필요해지면 (i) ChangeTrackingGrid + EditableCell wiring (caller code), 또는 (ii) monorepo 에 새 컴포넌트 신설 (그 시점 ADR 신설). 본 ADR 은 "지금 시점에 필요 0" 만 명시.
3. **doc 부수 정리는 monorepo 변경 요구** — `grid-pro-range/README.md:46` 의 rename. monorepo 측 변경이나 doc-only 이므로 semver 영향 0.

---

## 6. 사용자 결정 지점

### 6.1 BLOCKING 결정 (1건)

**D-1. 옵션 채택 (A / B / C)** — 본 spec 권고 옵션 C. 사용자가 옵션 A 또는 B 선택 시 본 spec 의 권고 부정 + 다음 단계 변경:

| 옵션 | 채택 시 다음 단계 |
|------|----------------|
| **A** | ADR-019 본문을 "ADR-004 partial 영구 채택 marker" 로 작성. 코드 변경 0. 252 LOC 영구 보존 명시. |
| **B** | ADR-019 본문을 "monorepo 에 EditableGrid wrapper 신설" 로 작성. 추가 spec writer cycle 필요 (API 디자인 — ChangeTrackingGrid 와의 책임 경계). 별도 implementer 위임 (6-8h). |
| **C (권고)** | 본 spec 의 §5 ADR-019 본문 채택. implementer 위임 1건 (파일 삭제 + 부수 정리, 0.5h). |

### 6.2 NON-BLOCKING (옵션 C 채택 후 — 부수 결정)

**D-2. doc 부수 정리 범위**:
- **D-2a (권고)**: `grid-pro-range/README.md:46` + `types/tomis/grid.ts:21` 주석 rename 을 본 ADR scope 안에서 처리 (1 PR).
- **D-2b**: doc 부수 정리는 별도 cycle 로 분리 (본 ADR 은 코드 삭제만).

**D-3. `EditableColumnMeta` 타입 향후 거취**:
- **D-3a (권고 부정)**: 본 ADR scope 안에서 monorepo 로 이관 (ADR-008 후속 — 동시 처리).
- **D-3b (권고)**: 본 ADR scope 외. 별도 ADR (ADR-008 의 후속 cycle).

권고 조합: **D-1=C + D-2=D-2a + D-3=D-3b**.

---

## 7. 다음 단계 권고

### 7.1 옵션 C (D-1=C) 채택 시

- **implementer 위임 1건** — 0.5h:
  - `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` 파일 삭제.
  - (D-2=D-2a 채택 시) `types/tomis/grid.ts:21` 주석 rename + `topvel-grid-monorepo/packages/grid-pro-range/README.md:46` 예제 rename.
- decisions.md ADR-019 본문 추가 (본 spec §5 그대로 + 결과 marker 갱신).
- decisions.md Index 표 (line 9-28) 에 ADR-019 행 1행 추가.
- typecheck PASS 검증 (`npx tsc --noEmit -p tsconfig.app.json` baseline 7 errors 유지).
- `wave-residual-1-editablegrid-result.md` 결과 보고서 작성 (implementer 결과 + git diff 인용).

### 7.2 옵션 A (D-1=A) 채택 시

- ADR-019 본문을 "영구 보존 marker" 로 재작성 (본 spec 권고 부정 — 새 spec writer cycle 권고).
- 코드 변경 0건.
- ADR-004 partial 영구화 — POL-MIG-STAGE 위배 가능성 명시.

### 7.3 옵션 B (D-1=B) 채택 시

- 새 spec writer cycle 필요 — monorepo 측 EditableGrid 디자인 (ChangeTrackingGrid 와의 책임 경계, API shape, 패키지 위치).
- 추가 결정 지점: B-1 (위치: `grid-pro-tracking/legacy/` vs 신 패키지 `grid-pro-editable`), B-2 (API: ChangeTrackingGrid extends vs sibling), B-3 (size-limit 영향).
- implementer 위임 6-8h.

### 7.4 ADR ledger 권고 (메모리 정합)

`memory/feedback-tw-mail-adr-number-collision.md` 의 N=1 사례 (ADR 번호 충돌 — ledger 신설 권고) 와 본 ADR-019 신설 = ADR 번호 ledger 필요성의 두 번째 점진 사례. 본 ADR 은 신 번호 (019) 사용 + ADR-017 결번 정합 — 번호 reuse 0. promotion N=3 도달 시 정책 신설 권고 (별도 cycle).

---

## 8. 본 spec 의 검증 메타데이터

| 항목 | 값 |
|------|-----|
| 실 코드 변경 | **0건** (read-only) |
| ADR 본문 작성 | **§5 draft (약 80 line) — decisions.md 에 추가됨** |
| 권고 옵션 | **C (deprecation + 삭제)** |
| primary source 인용 | `EditableGrid.tsx` (전체), `types/tomis/grid.ts:24`, `PayrollEditablePage.tsx:5,8,141,199`, `wave5-adr-004-result.md:29-41`, `grid-pro-range/README.md:46`, `grid-renderers/src/EditableCell.tsx:3` |
| 사용처 인벤토리 | 컴포넌트 import **0 (pages/stories/tests 모두)**. 타입 `EditableColumnMeta` import 1 file (PayrollEditablePage). |
| 사용자 결정 지점 | **1 BLOCKING (D-1) + 2 NON-BLOCKING (D-2, D-3)** |
| 다음 단계 | **implementer 위임 1건 — 0.5h (옵션 C 채택 시)** |

---

## 9. Conjunction Summary (한 줄)

**ADR-004 partial 의 EditableGrid 잔존 (252 LOC) 은 사용처 0 검증으로 해소 = 옵션 C (즉시 삭제) 채택. `EditableColumnMeta` 타입은 PayrollEditablePage 의 ChangeTrackingGrid column meta 로 alive — 보존 필수 분리 명시. ADR-019 본문 (§5 draft) 작성. 결번 marker 아닌 실 결정. implementer 위임 1건 (0.5h). 옵션 B (monorepo 신설) 는 사용자 0 + ChangeTrackingGrid 충족 = negative ROI 부정.**
