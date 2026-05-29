# 5 gap canonical 보강 spec — G-3 ~ G-7

- 작성일: 2026-05-18
- 분석 대상: `D:/project/topvel_project/TOMIS/publish/src/app/personal/commute-manage/organizeSchedule/page.tsx` (Wijmo Pro 풀스택, 669 lines, 5 gap 집중)
- 목적: MIS analyze 보고서 (`mis-wijmo-aggrid-replacement-analysis.md` §5) 의 G-3 ~ G-7 5건에 대해 canonical MOD-GRID-01/05/13/14 보강 또는 application 영역 처리 권고
- 모드: read-only 분석 + spec writer (실 ADR 본문 미수정, 권고만)
- 권위 자료
  - 입력 보고서: `mis-wijmo-aggrid-replacement-analysis.md` §5
  - 현 canonical: `MOD-GRID-01-decisions.md` (ADR-006 last) / `MOD-GRID-05-decisions.md` (ADR-002 last) / `MOD-GRID-13-decisions.md` (ADR-011 last) / `MOD-GRID-14-decisions.md` (ADR-002 last)
  - ID-LEDGER: `decisions/ID-LEDGER.md` (Section 2 ADR lastIssued + Section 7 Goal lastIssued)
  - 실 source: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/{types.ts,Grid.tsx}` + `grid-renderers/src/EditableCell.tsx` + `grid-pro-header/src/{createColumnGroup.ts,MultiRowHeader.tsx}`

---

## 0. Executive Summary

5 gap 검증 결과:

| ID | gap (publish Wijmo API) | 권고 옵션 | 영향 canonical | semver |
|----|------------------------|---------|---------------|--------|
| **G-3** | `formatItem` per-cell DOM mutation | **A amendment** — MOD-GRID-01 신규 `cellClassName` prop (Grid-level wiring) | MOD-GRID-01 G-006 신설 (또는 ADR-007 + F-01-13 신설) | **minor** (additive) |
| **G-4** | 데이터-driven 동적 헤더 | **C application 영역** — `createColumnGroup` 의 `header: string` 은 TanStack 의 `ColumnDef.header` 가 ReactNode/func 도 허용. application 측에서 31개 group 객체 동적 생성 가능 | 변경 없음 (다만 MOD-GRID-14 `header: ReactNode \| (info) => ReactNode` union 으로 확장 권장 — patch-level type widening) | **patch** (type widening 선택) |
| **G-5** | 헤더 행 간 colSpan 병합 (fixed col rowSpan=2) | **D 이미 커버** — TanStack `isPlaceholder` mechanism + MOD-GRID-14 ADR-001 D 전략. fixed columns 를 bare ColumnDef 로, day columns 를 createColumnGroup 으로 혼합 → 자동 처리 | 변경 없음 (마이그레이션 가이드 예제 1 추가 권장) | **없음** |
| **G-6** | `prepareCellForEdit` editor DOM hook | **A amendment** — MOD-GRID-05 `EditableCellProps` 에 `maxLength` / `align` / `stopPropagationOnKeyDown` 3 prop 신규 (또는 더 일반화된 `onEditStart(input)` ref callback) | MOD-GRID-05 G-004 신설 (ADR-003 + F-05-08 신설) | **minor** (additive) |
| **G-7** | `hostElement.addEventListener('keydown')` (char 입력 → startEditing) | **A amendment** — MOD-GRID-01 (a) `onCellKeyDown` callback prop 추가 + (b) `GridHandle.startEditing(rowId, colId)` imperative method 추가 | MOD-GRID-01 G-007 신설 (ADR-008 + F-01-14/15 신설) | **minor** (additive) |

**옵션 분포**: A amendment ×3 (G-3 / G-6 / G-7) + C application ×1 (G-4) + D already covered ×1 (G-5).

**신 Goal 필요 여부**: 3건. MOD-GRID-01 G-006 (cellClassName) + MOD-GRID-01 G-007 (keyboard hook + startEditing) + MOD-GRID-05 G-004 (editor DOM hooks).

**ID-LEDGER 갱신 시 발급 ID**:
- MOD-GRID-01: 신규 Goal G-006 + G-007. ADR-007 (cellClassName wiring) + ADR-008 (keyboard + startEditing).
- MOD-GRID-05: 신규 Goal G-004. ADR-003 (editor customization hooks).
- MOD-GRID-14: ADR 미신설 (option C application 채택 시) — 단 type widening 채택 시 ADR-003 + patch 1줄.

---

## 1. organizeSchedule 페이지 Wijmo API 호출 정확 인용

분석 대상 파일: `D:/project/topvel_project/TOMIS/publish/src/app/personal/commute-manage/organizeSchedule/page.tsx` (669 lines, Wijmo Pro 풀스택 사용).

### 1.1 G-3 — `formatItem` per-cell DOM mutation hook

**위치**: L182-244 (`g.formatItem.addHandler` 본체).

**현 Wijmo 패턴 (Markdown 인용)**:
```typescript
// L182-218 (cells 영역)
g.formatItem.addHandler((s, e) => {
  if (e.panel === s.cells) {
    const col = s.columns[e.col];
    e.cell.style.textAlign = 'center';
    if (col.binding && col.binding.startsWith('d')) {
      const day = Number(col.binding.slice(1));
      const dDate = new Date(ymDate.getFullYear(), ymDate.getMonth(), day);
      const selState = s.getSelectedState(e.row, e.col);
      const isSel = selState !== 0;
      e.cell.style.color = '#111827';
      e.cell.style.background = '';
      if (isSel) {
        e.cell.style.background = '#e0e7ff';
        e.cell.style.outline = '1px solid #6366f1';
      } else {
        if (isWeekend(dDate)) e.cell.style.background = '#f7f9ff';
        const val = s.getCellData(e.row, e.col, true);
        if (val) {
          e.cell.style.background = '#fff6d5';
          e.cell.title = String(val);
        }
      }
      // 시각적 중앙 정렬을 강제 (flex)
      e.cell.style.display = 'flex';
      e.cell.style.justifyContent = 'center';
      // ...
    }
  } else if (e.panel === s.columnHeaders) {
    // L219-243: 요일 색상 (일=빨강, 토=파랑) + 헤더 정렬
    if (row === 1 && col.binding && col.binding.startsWith('d')) {
      const dow = dDate.getDay();
      if (dow === 0) e.cell.style.color = '#ef4444';
      if (dow === 6) e.cell.style.color = '#3b82f6';
      // ...
    }
  }
});
```

**flow**:
- 모든 셀 재렌더 시 cell DOM 직접 mutation.
- 셀 상태별 분기: (a) 선택됨 → 연보라 배경 + outline / (b) 주말 → 옅은 파랑 / (c) 값 있음 → 노랑 배경 + tooltip.
- 헤더 셀: 요일별 색상 (일=red, 토=blue).

**핵심 입력**: `(row, col, value, isSelected, isWeekend)` → output: per-cell className/style.

### 1.2 G-4 — 데이터-driven 동적 헤더 콘텐츠

**위치**: L111-135 (`applyHeaderTwoRows`).

**현 Wijmo 패턴**:
```typescript
// L111-135
const applyHeaderTwoRows = () => {
  const hdr = g.columnHeaders;
  if (hdr.rows.length < 2) {
    hdr.rows.push(new wjGrid.Row());
  }
  hdr.rows[0].height = 28;
  hdr.rows[1].height = 24;
  for (let c = 0; c < g.columns.length; c++) {
    const col = g.columns[c];
    if (col.binding && col.binding.startsWith('d')) {
      const day = Number(col.binding.slice(1));
      const dDate = new Date(ymDate.getFullYear(), ymDate.getMonth(), day);
      hdr.setCellData(0, c, String(day).padStart(2, '0'));       // row 0: "01" "02" ... "31"
      hdr.setCellData(1, c, weekdayKR(dDate.getDay()));            // row 1: "일" "월" ... "토"
    } else {
      hdr.setCellData(0, c, '');                                   // 고정열: row 0 빈칸
      hdr.setCellData(1, c, col.header);                            // 고정열: row 1 에 헤더 표시
    }
  }
  hdr.rows[0].allowMerging = true;
  hdr.rows[1].allowMerging = true;
  for (let c = 0; c < g.columns.length; c++) hdr.columns[c].allowMerging = true;
};
```

**flow**:
- 31 일 컬럼 × 2 행 헤더 (day 번호 + weekday 한글).
- 고정 4 컬럼 (조/직책/성명/기본근무) 은 row 0 빈칸 + row 1 에 헤더 — `allowMerging` 로 row 0+row 1 병합 (rowSpan=2 효과).

**핵심**: per-column header 가 데이터 (year-month, day-of-month) 에서 계산됨. **이 계산은 application-level 의 메모이즈 가능 — 매 데이터 변경 시 새 `columnDef` 트리 재생성으로 표현 가능.**

### 1.3 G-5 — 헤더 행 간 colSpan 병합 (`AllowMerging.ColumnHeaders`)

**위치**: L92 + L133-135.

```typescript
// L92
g.allowMerging = wjGrid.AllowMerging.ColumnHeaders;

// L133-135
hdr.rows[0].allowMerging = true;
hdr.rows[1].allowMerging = true;
for (let c = 0; c < g.columns.length; c++) hdr.columns[c].allowMerging = true;
```

**flow**:
- Wijmo 모드: 헤더 셀 중 동일 값 인접 셀 자동 colSpan 병합.
- 본 페이지는 **고정 4 컬럼만** rowSpan 효과 (row 0 빈칸 + row 1 헤더 텍스트, 같은 컬럼 내 2 row 가 merge 되는 패턴, 정확히는 row 0 이 모두 ""로 동일하여 colSpan=4 merge — 즉 fixed 4 cols 가 row 0 영역에서 colSpan=4 빈 셀로 병합되고 row 1 에 4 개 개별 헤더가 보임).
- day 컬럼은 cell 별로 다른 day 번호 → colSpan 병합 없음.

### 1.4 G-6 — `prepareCellForEdit` editor DOM hook

**위치**: L287-300.

```typescript
g.prepareCellForEdit.addHandler((s, e) => {
  const editor = s.activeEditor as HTMLInputElement | HTMLTextAreaElement | null;
  const col = s.columns[e.col];
  if (editor) {
    editor.style.textAlign = 'center';
    if (col.binding && col.binding.startsWith('d')) {
      (editor as HTMLInputElement).maxLength = 4;     // 최대 4자리 (예: 1019)
    }
    // 편집 중 키 입력이 그리드로 전파되어 커서가 이동/편집 종료되는 것을 방지
    editor.addEventListener('keydown', (evt) => {
      evt.stopPropagation();
    });
  }
});
```

**flow**: 편집 모드 진입 시 editor DOM (`<input>`) 직접 customization. 3 가지 동작:
1. `textAlign: center`
2. `maxLength: 4`
3. `keydown stopPropagation` (grid host 의 keydown handler 와 분리)

### 1.5 G-7 — `hostElement` 키보드 event wiring (char → startEditing)

**위치**: L252-284.

```typescript
g.hostElement.addEventListener('keydown', (ev: KeyboardEvent) => {
  if (!gridRef.current) return;
  const g2 = gridRef.current;
  if (g2.activeEditor) return;
  const sel = g2.selection;
  if (!sel) return;
  const colIndex = sel.col;
  if (colIndex < g2.frozenColumns) return;
  const col = g2.columns[colIndex];
  const isDayCol = col.binding && col.binding.startsWith('d');
  const isChar = ev.key.length === 1;
  const isDel = ev.key === 'Backspace' || ev.key === 'Delete';
  if (isDayCol && (isChar || isDel)) {
    g2.startEditing(true);
    const editor = g2.activeEditor as HTMLInputElement | null;
    if (editor) {
      editor.style.textAlign = 'center';
      editor.maxLength = 4;
      const initVal = isDel ? '' : (isChar ? ev.key : '');
      if (initVal) editor.value = initVal;
      else if (isDel) editor.value = '';
      try { editor.setSelectionRange(editor.value.length, editor.value.length); } catch {}
      editor.focus();
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
});
```

**flow**: 키 입력 시 자동 편집 모드 진입.
- 가드: editor 활성 X + selection 있음 + 고정 컬럼 아님 + day 컬럼.
- 동작: `startEditing(true)` 호출 + editor 의 초기값을 입력 키로 채움 + focus + selectionRange 끝으로.

**핵심 wiring 요구**: (a) grid host 의 키보드 이벤트 노출 + (b) 프로그래밍적 `startEditing(row, col)` 호출.

---

## 2. canonical 모듈 현 API 범위 (verified, 실 source 확인)

### 2.1 MOD-GRID-01 (`@tomis/grid-core`)

검증 source: `grid-core/src/types.ts` + `grid-core/src/Grid.tsx`.

| 항목 | 현 상태 | gap 영향 |
|------|---------|---------|
| `GridProps.cellClassName?` | **부재** (`grep cellClassName grid-core/src` → 0 hits in types.ts) | G-3 영향 |
| `GridProps.rowClassName?` | **부재** | G-3 영향 (행 단위) |
| `GridProps.onCellKeyDown?` | **부재** | G-7 영향 |
| `GridHandle.startEditing?` | **부재** | G-7 영향 |
| `GridHandle.getActiveCell?` | **부재** | G-7 영향 |
| `onCellClick` | **존재** (types.ts L416-420, ADR-004 D4) | (참고) — 키보드 wiring 만 부재 |

ADR-MOD-GRID-05-002 D3 (2026-05-14) 본문 명시: **"cellClassName Grid-level wiring 은 MOD-GRID-01 또는 MOD-GRID-04 로 deferred"**. 본 spec 의 G-3 처리는 이 약속 이행.

### 2.2 MOD-GRID-05 (`@tomis/grid-renderers`)

검증 source: `grid-renderers/src/EditableCell.tsx` (L40-198).

| 항목 | 현 상태 | gap 영향 |
|------|---------|---------|
| `EditableCellProps.cellClassName` | **존재** (L67) | G-6 부분 — className 만, behavioral hook 아님 |
| `EditableCellProps.maxLength` | **부재** | G-6 영향 |
| `EditableCellProps.align` | **부재** (현 default 좌측, INPUT_BASE_CLASS L70-71) | G-6 영향 |
| `EditableCellProps.onEditStart(input)` ref callback | **부재** (현재 `inputRef` 는 internal) | G-6 영향 |
| keydown stopPropagation 옵션 | **부분** — `handleKey` 가 Enter/Esc/Tab 만 처리, 그 외 키는 native 전파 (publish 의 grid host keydown 과 충돌 위험) | G-6 영향 |
| `CellClassNameCallback<TData>` type export | **존재** (L40) | G-3 callback 시그니처 재사용 가능 |

### 2.3 MOD-GRID-13 (`@tomis/grid-pro-merging`)

검증 source: 본 cycle 직접 source 미독, ADR-MOD-GRID-13-001~011 본문 인용.

| 항목 | 현 상태 | gap 영향 |
|------|---------|---------|
| `column.mergeRows: boolean \| compareFn` | **존재** (ADR-001) — body cell rowSpan 자동 병합 | G-5 무관 (G-5 는 헤더 영역, MOD-GRID-13 은 body 영역) |
| 헤더 영역 merging | **부재** — MOD-GRID-13 은 body cell 한정 | G-5 는 MOD-GRID-14 영역 |

→ **MOD-GRID-13 은 G-3 / G-6 처리 후보가 아님.** MIS 분석 보고서의 "G-3 → MOD-GRID-13 또는 grid-core" 기재는 정확하나, ADR-001 본문 ("body cell rowSpan") 으로 분명히 grid-core/grid-renderers 영역.

### 2.4 MOD-GRID-14 (`@tomis/grid-pro-header`)

검증 source: `grid-pro-header/src/createColumnGroup.ts` + `grid-pro-header/src/MultiRowHeader.tsx`.

| 항목 | 현 상태 | gap 영향 |
|------|---------|---------|
| `createColumnGroup({ header: string, columns })` | **존재** (L26-31, header **string only**) | G-4 부분 — `string` 만 허용 (ReactNode/func 불가) |
| 다단 헤더 자동 렌더 | **존재** — `MultiRowHeader` (ADR-001 D 전략: TanStack placeholder) | G-5 **이미 커버** |
| `frozenColumns` + sticky | **존재** (MultiRowHeader L100-102) | (참고) |
| header cell custom render | **부분** — TanStack `ColumnDef.header` 자체는 `string \| (info) => ReactNode` 허용 (L226: `flexRender(header.column.columnDef.header, ...)`). `createColumnGroup` wrapper 만 `header: string` 으로 제한 | G-4 영향 (wrapper 의 type widening 권장) |

### 2.5 ID-LEDGER 현 상태

| 모듈 | ADR lastIssued | Goal lastIssued |
|------|----------------|----------------|
| MOD-GRID-01 | 006 (다음: 007) | G-005 (다음: G-006) |
| MOD-GRID-05 | 002 (다음: 003) | G-003 (다음: G-004) |
| MOD-GRID-13 | 011 (다음: 012) | G-003 — gap 영향 외 |
| MOD-GRID-14 | 002 (다음: 003) | G-003 — option C 채택 시 변경 없음 |

---

## 3. 보강 옵션 평가 — gap 별 A/B/C/D 비교

| gap | A: ADR amendment | B: 신 ADR | C: application 영역 | D: 이미 커버 / 영구 미커버 |
|-----|-----------------|-----------|---------------------|-------------------------|
| **G-3** formatItem | ❌ 단순 amendment 어려움 (신 prop 추가는 minor 신 ADR 의 형태) | **✅ 선정** — MOD-GRID-01 G-006 신설 + ADR-007 (`cellClassName` Grid-level wiring) | 가능하나 사용자 모든 페이지 inline custom cellRenderer 작성 부담 큼 | ❌ — `cellClassName` 은 EditableCell 만 leaf prop, Grid-level wiring 부재 |
| **G-4** dynamic header | ❌ `createColumnGroup` type 시그니처 변경은 patch + 신 ADR (작은) | 가능하나 작은 변경 (`header: ReactNode \| (info) => ReactNode` union 확장) | **✅ 선정** — application 측에서 31 createColumnGroup 객체 동적 생성. TanStack `ColumnDef.header` 자체가 ReactNode/func 허용 — `createColumnGroup` wrapper 만 보강 (선택, patch 수준) | 가능 — wrapper 미보강 시 사용자가 TanStack 리터럴 직접 사용 |
| **G-5** colSpan merging | ❌ 부적합 | ❌ 부적합 | ❌ — TanStack placeholder 자동 처리, 추가 작업 불요 | **✅ 선정** — TanStack `isPlaceholder` mechanism (ADR-MOD-GRID-14-001 D 전략 명시) + MultiRowHeader L196-205 의 placeholder rendering 으로 자동 커버 |
| **G-6** prepareCellForEdit | ❌ EditableCellProps 변경은 신 prop, ADR 의무 | **✅ 선정** — MOD-GRID-05 G-004 신설 + ADR-003 (editor customization hooks) | 가능하나 사용자가 EditableCell 직접 wrapping 부담 큼 | ❌ — 현 EditableCellProps 부족 |
| **G-7** hostElement keyboard | ❌ 부적합 | **✅ 선정** — MOD-GRID-01 G-007 신설 + ADR-008 ((a) `onCellKeyDown` prop + (b) `GridHandle.startEditing(rowId, colId)`) | 가능하나 imperative API 의 `startEditing` 노출 없으면 사용자 직접 호출 경로 자체 부재 | ❌ — 현 GridHandle / Grid surface 부족 |

**최종 옵션 분포**: A/B (신 ADR 의무) ×3 (G-3 / G-6 / G-7) + C application ×1 (G-4) + D already covered ×1 (G-5).

---

## 4. 권고 + spec draft (gap 별 design)

### 4.1 G-3 — `cellClassName` Grid-level wiring (MOD-GRID-01 G-006 신설)

#### 4.1.1 신 Goal — MOD-GRID-01 G-006

- **Goal ID**: G-006 (ID-LEDGER §7 MOD-GRID-01 `lastIssued: G-005` → 다음 G-006).
- **Title**: `cellClassName` + `rowClassName` Grid-level callback wiring (G-006).
- **Priority**: P0.
- **Description**: MOD-GRID-05 G-003 ADR-MOD-GRID-05-002 D3 의 약속 이행 — EditableCell leaf prop 으로 export 된 `CellClassNameCallback<TData>` 을 Grid 단계에서 모든 셀에 자동 invocation.

#### 4.1.2 신 ADR — ADR-MOD-GRID-01-007

```markdown
## ADR-MOD-GRID-01-007: G-006 — cellClassName + rowClassName Grid-level callback wiring (D1/D2)

**Date**: TBD
**Status**: Accepted (pending implement)
**Goal**: G-006

### Context
ADR-MOD-GRID-05-002 D3 (2026-05-14) 에서 `CellClassNameCallback<TData>` type 만 export 하고
Grid-level invocation 은 "MOD-GRID-01 또는 MOD-GRID-04" 로 deferred. 본 G-006 이 이 약속 이행.

publish/organizeSchedule:L182-244 (formatItem) 의 per-cell DOM mutation 패턴 — 셀 상태별
(selected / weekend / has-value) 동적 배경/색 변경 — 이 동등 표현 가능해야 한다.

### Decision
- **D1**: `GridProps.cellClassName?: CellClassNameCallback<TData> | string`.
  - function 시그니처: `(cell: Cell<TData, unknown>) => string` (MOD-GRID-05 export 재사용)
  - string 시그니처: 모든 셀에 동일 Tailwind class 추가 (편의 단축).
- **D2**: `GridProps.rowClassName?: ((row: Row<TData>) => string) | string`.
  - 행 단위 className — selected/zebra/error 행 marking 표현.
- **D3**: 적용 위치 — `<td>` 의 className 합성:
  `[baseClasses, props.cellClassName?.(cell) ?? '', meta.align className].join(' ')`.
  Tailwind only (C-5 의무 — 인라인 style 금지).

### API Sketch
\`\`\`typescript
// types.ts 추가
import type { CellClassNameCallback } from '@tomis/grid-renderers';

interface GridProps<TData> {
  // ... 기존 props
  cellClassName?: CellClassNameCallback<TData> | string;
  rowClassName?: ((row: Row<TData>) => string) | string;
}
\`\`\`

### publish/organizeSchedule 등가 표현 예시
\`\`\`tsx
<Grid
  data={scheduleData}
  columns={columns}
  cellClassName={(cell) => {
    if (!cell.column.id.startsWith('d')) return '';
    const day = Number(cell.column.id.slice(1));
    const dDate = new Date(year, month, day);
    const isWeekend = [0, 6].includes(dDate.getDay());
    const isSelected = cell.getContext().table.getState().rowSelection[cell.row.id];
    const hasValue = cell.getValue() != null && cell.getValue() !== '';
    return [
      isSelected && 'bg-indigo-100 outline outline-1 outline-indigo-500',
      !isSelected && isWeekend && 'bg-blue-50',
      !isSelected && hasValue && 'bg-yellow-50',
    ].filter(Boolean).join(' ');
  }}
/>
\`\`\`

### Alternatives Considered
- **wrapping cellRenderer** (사용자가 모든 컬럼에 inline custom cell 작성) — 부담 큼, 보일러플레이트 폭증.
- **`column.meta.cellClassName`** (per-column 만) — 셀의 상태 (selection/row context) 접근 불가.
- **Grid-level `onCellRendered(cell, dom)` post-mount hook** — DOM mutation 노출은 C-5 (Tailwind only) 위반 위험.

### Trade-off
- Pro: 1 prop 으로 publish formatItem 동등 표현. Tailwind 만으로 표현 (C-5 부합). EditableCell `cellClassName` (leaf) + Grid `cellClassName` (root) 일관 wiring.
- Con: 매 cell 렌더마다 callback 호출 — 대용량 데이터 시 memo dependency 주의 필요 (사용자 책임). JSDoc 명시 의무.

### Consequences
- MOD-GRID-04 createColumns 의 `meta.cellClassName` (column 단위) 도 함께 지원 검토 (G-007 또는 별도 cycle).
- 번들 영향: callback resolution 코드 추가 ~+0.3 KB (alias-wrapper profile baseline ADR-005 Pattern Catalog).
- C-5 / C-17 / C-29 적용 — implementer 의무 (Storybook 시각 회귀 baseline 추가).
- **★ Layering 주의 (ADR-MOD-GRID-REFACTOR-2026-05-17-009 cross-ref)**: 현재 `CellClassNameCallback<TData>` 는
  `@tomis/grid-renderers/src/EditableCell.tsx:40` 에서 export. ADR-REFACTOR-009 (grid-core ↔ grid-features 역의존 제거)
  적용 후 grid-core 가 grid-renderers 의 type 을 import 하면 역의존 재발 위험. **권고**: 본 ADR-007 implement 시
  `CellClassNameCallback<TData>` 의 canonical 정의를 **grid-core/types.ts 로 이전 + grid-renderers 는 type-only re-export**.
  Implementer 결정 항목 — spec D# 표에 명시 의무.

### Confidence: high
- 명확한 약속 이행 (ADR-MOD-GRID-05-002 D3 deferred).
- publish 의 실제 사용 패턴이 design 검증 입력.
```

#### 4.1.3 사용자 결정 지점
- semver: **minor** (additive prop).
- ID-LEDGER 갱신: MOD-GRID-01 G-006 (G-005 → G-006) + ADR-007 (ADR-006 → ADR-007).

---

### 4.2 G-4 — 데이터-driven 동적 헤더 (option C application 영역)

#### 4.2.1 핵심 판단
TanStack `ColumnDef.header` 는 `string | ColumnDefTemplate<HeaderContext<TData, TValue>>` 허용 (MultiRowHeader.tsx L226: `flexRender(header.column.columnDef.header, ...)`). 즉 ReactNode + function 모두 가능. **`createColumnGroup` wrapper 의 `header: string` 만 좁혀져 있음.**

#### 4.2.2 application 측 권고 (canonical 변경 X)

publish/organizeSchedule:L111-135 의 `applyHeaderTwoRows` 는 다음과 같이 application 레벨에서 메모이즈된 columnDef 트리로 표현 가능:

```typescript
import { createColumnGroup } from '@tomis/grid-pro-header';

const columns = useMemo(() => {
  const fixedCols = [
    { id: 'team', header: '조' },
    { id: 'position', header: '직책' },
    { id: 'name', header: '성명' },
    { id: 'baseShift', header: '기본\n근무' },
  ];

  const dayCols = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dDate = new Date(year, month, day);
    const dow = dDate.getDay();
    return createColumnGroup({
      header: String(day).padStart(2, '0'),  // row 0 = day 번호
      columns: [
        {
          id: `d${day}`,
          // row 1 = weekday 한글 — TanStack func header 로 색상 동적 적용
          header: () => (
            <span className={
              dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : ''
            }>
              {['일','월','화','수','목','금','토'][dow]}
            </span>
          ),
        },
      ],
    });
  });

  return [...fixedCols, ...dayCols];
}, [year, month, daysInMonth]);
```

#### 4.2.3 옵션: `createColumnGroup` type widening (선택, patch)

만약 위 application 측 코드에서 `createColumnGroup({ header: <CustomHeader/> })` 처럼 ReactNode 직접 전달 의도라면 — 현재는 `header: string` 만 허용. **선택적으로** 다음 widening:

```typescript
// grid-pro-header/src/createColumnGroup.ts
export interface ColumnGroupConfig<TData> {
  header: ColumnDef<TData>['header'];  // TanStack union 그대로 — string | ReactNode | func
  columns: ColumnDef<TData>[];
}
```

ADR-MOD-GRID-14-003 (patch) — type widening 의 single-line 결정.

#### 4.2.4 사용자 결정 지점
- semver:
  - option C application 만 채택 → **변경 없음**.
  - type widening 선택 → **patch** (backward-compatible).
- ID-LEDGER 갱신: option C 만 → 변경 없음. type widening → MOD-GRID-14 ADR-002 → ADR-003.

---

### 4.3 G-5 — 헤더 행 간 colSpan 병합 (option D 이미 커버)

#### 4.3.1 핵심 판단

ADR-MOD-GRID-14-001 명시: **"렌더링 전략 D (TanStack placeholder 신뢰)"** 채택. MultiRowHeader.tsx L196-205:
```typescript
if (header.isPlaceholder) {
  return (
    <th key={header.id} colSpan={effectiveColSpan} className={...} />
  );
}
```

이 mechanism 은 publish/organizeSchedule 의 "fixed 4 columns row 0 빈 셀 colSpan=4, row 1 에 4 개 헤더" 패턴을 정확히 처리한다.

#### 4.3.2 publish 패턴 → TanStack 표현 등가성

publish:
- header row 0: `'', '', '', '', '01', '02', ...`
- header row 1: `'조', '직책', '성명', '기본', '일', '월', ...`
- `AllowMerging.ColumnHeaders` → row 0 의 인접 동일값('') 자동 colSpan 병합 → row 0 첫 4 셀이 colSpan=4 빈 셀로.

TanStack 표현:
- fixed cols (`team`, `position`, `name`, `baseShift`) 를 **bare ColumnDef** (group 없음) 로 정의.
- day cols 를 **createColumnGroup** 으로 정의 (`{ header: '01', columns: [{ id: 'd1', header: '일' }] }` 등).
- TanStack `getHeaderGroups()` 가 자동으로:
  - row 0: bare fixed cols 는 `isPlaceholder` 로, day group cells 는 실제 header.
  - row 1: fixed cols 의 실제 header + day leaf cols 의 weekday header.
- MultiRowHeader 의 placeholder 분기 (L196-205) 로 row 0 의 fixed-col placeholders 가 빈 `<th>` 로 렌더.

추가로 rowSpan 효과 (fixed col 이 2 row 차지) 가 필요하면 — TanStack 의 default 동작은 isPlaceholder 셀이 colSpan=1 의 빈 셀로 렌더. 시각적으로 row 0 의 빈 셀 + row 1 의 헤더 텍스트 2 row 합치는 것과 동일 (visual stack). 만약 사용자가 명시적 rowSpan 필요 시 — placeholder 셀에 visibility:hidden + row 1 header 에 rowSpan=2 등 CSS 처리 (어플리케이션 별 design choice).

#### 4.3.3 사용자 결정 지점
- semver: **없음**.
- ID-LEDGER 갱신: 없음.
- 추가 권장: MOD-GRID-99-B 마이그레이션 가이드에 "Wijmo AllowMerging.ColumnHeaders → bare ColumnDef + createColumnGroup 혼합 패턴" 예시 1건 추가 (문서 작업).

---

### 4.4 G-6 — `prepareCellForEdit` editor DOM hook (MOD-GRID-05 G-004 신설)

#### 4.4.1 신 Goal — MOD-GRID-05 G-004

- **Goal ID**: G-004 (ID-LEDGER §7 MOD-GRID-05 `lastIssued: G-003` → 다음 G-004).
- **Title**: EditableCell editor DOM customization hooks (G-004).
- **Priority**: P0.

#### 4.4.2 신 ADR — ADR-MOD-GRID-05-003

```markdown
## ADR-MOD-GRID-05-003: G-004 — EditableCell editor customization hooks (D1/D2)

**Date**: TBD
**Status**: Accepted (pending implement)
**Goal**: G-004

### Context
publish/organizeSchedule:L287-300 의 `prepareCellForEdit.addHandler` 는 편집 모드 진입 시
editor (`<input>`) DOM 에 3가지 customization:
1. `textAlign: center`
2. `maxLength: 4`
3. `keydown stopPropagation` (grid host 키보드 wiring 과 분리)

현 EditableCellProps (L47-68) 는 이 use case 미지원. 본 G-004 가 보강.

### Decision
EditableCellProps 에 3 prop 신규 추가 (additive, backward-compatible):

- **D1**: `maxLength?: number` — `<input type="text">` `<input type="number">` `<textarea>` 에 그대로 전달.
- **D2**: `align?: 'left' | 'center' | 'right'` (default `'left'`) — Tailwind class 분기 (`text-center` / `text-right`).
  C-5 의무 — 인라인 style 금지, Tailwind only.
- **D3**: `stopPropagationOnKeyDown?: boolean` (default `false`) — `true` 시 `handleKey` 본체 처리 후 `e.stopPropagation()` 추가 호출. host keyboard wiring (G-7) 과 분리.

### API Sketch
\`\`\`typescript
export interface EditableCellProps {
  // ... 기존 props (value, editType, isEditing, onStartEdit, onCommit, onCancel, cellClassName)
  maxLength?: number;
  align?: 'left' | 'center' | 'right';
  stopPropagationOnKeyDown?: boolean;
}
\`\`\`

### Application 등가 표현
\`\`\`tsx
<EditableCell
  value={cell.getValue()}
  editType="text"
  isEditing={isEditing}
  onStartEdit={...}
  onCommit={...}
  onCancel={...}
  maxLength={4}
  align="center"
  stopPropagationOnKeyDown
/>
\`\`\`

### Alternatives Considered
- **`onEditStart(input: HTMLInputElement)` ref callback** — DOM 직접 노출. 강력하나 (a) Tailwind only 정책 (C-5) 회피 통로 위험, (b) shape 추상화 손상. 정형 prop 3종 (D1/D2/D3) 가 type-safe + Tailwind-only 부합.
- **`onKeyDown(e)` callback prop** — Enter/Esc/Tab 의 기본 처리와 충돌 우려. `stopPropagationOnKeyDown` 1 boolean 이 publish use case (host 와 분리) 정확 처리.

### Trade-off
- Pro: 3 prop 으로 publish prepareCellForEdit 동등 표현. C-4 / C-5 / C-29 모두 부합.
- Con: editor 의 모든 DOM customization 을 prop 으로 노출하려면 N prop 폭증 위험. 본 ADR 의 3 prop 은 publish 의 실 use case 한정. 추가 prop 은 후속 Goal 에서 demand-driven 결정.

### Consequences
- MOD-GRID-04 createColumns 의 `editConfig` (있다면) 와 1:1 매핑 검토.
- Storybook story `WithMaxLength`, `WithAlign`, `WithStopPropagation` 추가 (C-25 의무).
- 번들 영향: 3 prop 추가 + 분기 ~+0.2 KB.

### Confidence: high
```

#### 4.4.3 사용자 결정 지점
- semver: **minor** (additive prop).
- ID-LEDGER 갱신: MOD-GRID-05 G-004 (G-003 → G-004) + ADR-003 (ADR-002 → ADR-003).

---

### 4.5 G-7 — `hostElement` 키보드 + `startEditing(row, col)` (MOD-GRID-01 G-007 신설)

#### 4.5.1 신 Goal — MOD-GRID-01 G-007

- **Goal ID**: G-007 (ID-LEDGER §7 MOD-GRID-01 `lastIssued: G-005` → G-006 (cellClassName, §4.1) → 다음 G-007).
- **Title**: Cell-level keyboard event hook + `GridHandle.startEditing(rowId, colId)` imperative method (G-007).
- **Priority**: P0.

#### 4.5.2 신 ADR — ADR-MOD-GRID-01-008

```markdown
## ADR-MOD-GRID-01-008: G-007 — onCellKeyDown prop + GridHandle.startEditing (D1/D2)

**Date**: TBD
**Status**: Accepted (pending implement)
**Goal**: G-007

### Context
publish/organizeSchedule:L252-284 의 `g.hostElement.addEventListener('keydown', ...)` + `g.startEditing(true)`
패턴 — 그리드 host 의 키보드 이벤트 노출 + 프로그래밍적 편집 시작.

현 Grid surface:
- `onCellClick` 존재 (types.ts L416), `onCellKeyDown` 부재.
- `GridHandle.scrollTo / addRow / deleteRow / getSelection / clearSelection / refresh` 존재 (types.ts L71-136),
  `startEditing` / `getActiveCell` 부재.

본 G-007 이 publish G-7 use case 정확 처리.

### Decision
- **D1**: `GridProps.onCellKeyDown?: (cell: Cell<TData, unknown>, row: TData, event: KeyboardEvent<HTMLTableCellElement>) => void`.
  - `onCellClick` 시그니처 (ADR-MOD-GRID-01-004 D4) 와 일관: `(cell, row, event)` 3 arg.
  - Grid 가 `<td>` 의 `onKeyDown` 으로 자동 wire.
  - tabindex 미지정 셀은 native focus 받지 못함 — 사용자 의도적 활성 시 `meta.tabIndex` (별도 추후) 또는 cellRenderer 가 `tabIndex={0}` 부여 의무 (JSDoc 명시).
- **D2**: `GridHandle.startEditing(rowId: string \| number, colId: string): void`.
  - EditableCell 또는 inline edit-able 컬럼에 대해 프로그래밍적 편집 시작.
  - 내부 implementation: editingCellState (MOD-GRID-01 internal) 의 setEditingCell 호출.
  - rowId / colId 부정 → dev mode console.warn + no-op.
  - selection 자동 동기화 (해당 cell selection 으로 set).

### API Sketch
\`\`\`typescript
interface GridProps<TData> {
  // ... 기존 props
  onCellKeyDown?: (
    cell: Cell<TData, unknown>,
    row: TData,
    event: KeyboardEvent<HTMLTableCellElement>,
  ) => void;
}

interface GridHandle<TData> {
  // ... 기존 method
  startEditing: (rowId: string | number, colId: string) => void;
}
\`\`\`

### Application 등가 표현 (publish G-7)
\`\`\`tsx
const gridRef = useRef<GridHandle<MemberRow>>(null);
<Grid
  ref={gridRef}
  data={scheduleData}
  columns={columns}
  onCellKeyDown={(cell, row, event) => {
    if (gridRef.current && !cell.column.getCanEdit?.()) return;
    const isChar = event.key.length === 1;
    const isDel = event.key === 'Backspace' || event.key === 'Delete';
    if (cell.column.id.startsWith('d') && (isChar || isDel)) {
      gridRef.current?.startEditing(row.id, cell.column.id);
      // initial value 전달은 EditableCell 의 별도 prop (G-008 또는 application state 활용)
    }
  }}
/>
\`\`\`

### Alternatives Considered
- **hostElement ref 직접 노출** (`<Grid hostRef={hostRef}>` + `hostRef.current.addEventListener`) — DOM 노출은
  (a) abstraction 손상, (b) cleanup 책임 사용자, (c) C-5 의 Tailwind only 정신 미세 위반 (DOM mutation 자유).
- **`onKeyDown` (Grid root)** — 셀 단위 분기 어렵고, focus management 책임 사용자. Cell-level 이 명확.
- **`startEditing()` cell-active 의존** — 현재 active cell 미관리, `(rowId, colId)` 명시 인자가 명확.

### Trade-off
- Pro: 2 prop 으로 publish hostElement keyboard wiring 동등 표현. Cell-level abstraction 보존. Tailwind only 정합.
- Con: cell-level focus management 사용자 의무 (tabIndex={0} 또는 default focus 정책). JSDoc 명시 + Storybook `KeyboardEdit` 시나리오 추가. `startEditing` 은 EditableCell 통합 의존 — MOD-GRID-05 와 cross-package wiring 필요 (rendererRegistry 또는 EditingContext).

### Consequences
- MOD-GRID-05 `EditableCell` 의 `isEditing` prop 외부 controlled 옵션 명확화 필요 (`startEditing` 호출 시 어떻게 EditableCell 의 isEditing=true 가 setting 되는가).
- Storybook story `KeyboardEditStart` 추가.
- 번들 영향: callback 2 prop + GridHandle 1 method ~+0.5 KB.
- 사용처 마이그레이션: publish/organizeSchedule 의 G-7 wiring 코드 30 줄 → onCellKeyDown 5 줄 + startEditing 1 줄로 축소.

### Confidence: medium-high
- API design 명확하나 cross-package wiring (Grid → EditableCell 의 isEditing 제어) 의 detail 은 implementer 가 명시 필요.
- Implementer 단계에서 EditingContext (Grid scope 의 editingCellState) 패턴 결정 의무.
```

#### 4.5.3 사용자 결정 지점
- semver: **minor** (additive prop + handle method).
- ID-LEDGER 갱신: MOD-GRID-01 G-007 (G-006 cellClassName 이어서) + ADR-008 (ADR-007 cellClassName 이어서).

---

## 5. Cross-impact 분석 — 5 gap 정합 + 다른 canonical 영향

### 5.1 grid-pro-tracking (MOD-GRID-10) 의 EditableGrid 와 정합

MOD-GRID-10 의 ChangeTrackingGrid 는 EditableCell 을 사용 (ADR-MOD-GRID-05-002 D2). G-6 의 `maxLength / align / stopPropagationOnKeyDown` 신 prop 은 ChangeTrackingGrid 에도 자동 노출 가능 (column.meta 또는 wrapper prop 으로 전달). G-7 의 `startEditing(rowId, colId)` 은 ChangeTrackingHandle 도 함께 노출 검토 (ADR-MOD-GRID-13-009 dep 미영향).

→ **MOD-GRID-10 영향**: minor (additive). 별도 cycle 또는 G-007 implement 단계에서 ChangeTrackingGrid 노출 확장.

### 5.2 grid-pro-merging (MOD-GRID-13) 와 정합

MOD-GRID-13 은 body cell rowSpan 자동 병합 (ADR-001). G-3 cellClassName 와 정합 — merged cell 도 cellClassName 적용 (TanStack cell 단위 적용이라 merge spans 내 모든 cell 호출). 시각적 일관성 위해 — merged cell 의 spanned td 만 className 받음 (TanStack rowSpan rendering 표준). 별도 결정 불요.

### 5.3 grid-pro-header (MOD-GRID-14) 의 colSpan 신 기능과 MOD-GRID-13 Cell Merging 중복?

검토 결과 — **중복 없음**:
- MOD-GRID-13: body cell rowSpan (수직 병합).
- MOD-GRID-14: 헤더 영역 colSpan (수평 group + isPlaceholder).

G-5 publish 패턴 (헤더 fixed col 의 row 0 빈 셀 colSpan=4) 은 MOD-GRID-14 의 placeholder mechanism 으로 자동 처리.

### 5.4 MOD-GRID-04 createColumns 와 G-3 cellClassName 정합

createColumns 의 `meta.cellClassName` (per-column) 와 Grid-level `cellClassName` (per-cell function) 는 보완. Grid-level 이 callback 으로 column id 분기 가능 → meta-level 미보강 가능. 단 column 단위 정적 className 만 필요한 경우 meta-level 이 더 명확 — 별도 cycle 검토.

---

## 6. organizeSchedule 마이그레이션 Phase 계획 (보강 후)

### Phase 1 — 기본 Grid + Multi-row Header (G-5 이미 커버)

| 단계 | 작업 | 패키지 | 검증 |
|------|------|--------|------|
| 1.1 | fixed 4 cols + day cols × createColumnGroup 동적 생성 (application 측 useMemo) | grid-core + grid-pro-header | TanStack placeholder 가 row 0 fixed cols 자동 처리 (G-5 D) |
| 1.2 | weekday 색상 — `header: () => <span className={...}>` 함수 형 (G-4 application) | grid-pro-header | 색상 visual 회귀 baseline |
| **★ 1.3** | **TanStack placeholder vs Wijmo rowSpan=2 visual 보정** — placeholder 의 default 는 row 0 빈 셀 + row 1 헤더 (stacked 2 row), Wijmo 는 rowSpan=2 단일 셀. 정확한 시각 등가 위해 row 0 placeholder 에 `visibility: hidden` Tailwind 또는 row 1 fixed col header 에 rowSpan=2 트릭 (CSS) 필요. **조건부 필수** — organizeSchedule visual baseline 매칭 시. | grid-pro-header + application CSS | Playwright 시각 회귀 baseline |
| 1.4 | typecheck + Storybook baseline | — | tsc 0 errors |

**의존**: MOD-GRID-01 G-001~G-005 (existing) + MOD-GRID-14 G-001 (existing).
**canonical 변경**: 없음.

### Phase 2 — Editing + Range Selection + Change Tracking

| 단계 | 작업 | 패키지 | 의존 ADR |
|------|------|--------|----------|
| 2.1 | EditableCell 인라인 편집 — text 입력 | grid-renderers | ADR-MOD-GRID-05-002 (existing) |
| 2.2 | CellRange selection (Shift+드래그) | grid-pro-range | existing MOD-GRID-11 |
| 2.3 | CollectionView trackChanges → useChangeTracking | grid-pro-tracking | existing MOD-GRID-10 |
| 2.4 | maxLength=4 + align=center + stopPropagationOnKeyDown (G-6 신 prop) | grid-renderers | **신 ADR-MOD-GRID-05-003** |

**의존**: 본 spec 의 G-6 신 Goal MOD-GRID-05 G-004 완료 필수.
**canonical 변경**: MOD-GRID-05 G-004 신설.

### Phase 3 — Cell-level cellClassName + 키보드 wiring

| 단계 | 작업 | 패키지 | 의존 ADR |
|------|------|--------|----------|
| 3.1 | cellClassName callback (selected / weekend / has-value 배경) — G-3 등가 | grid-core | **신 ADR-MOD-GRID-01-007** |
| 3.2 | onCellKeyDown + GridHandle.startEditing — G-7 등가 | grid-core | **신 ADR-MOD-GRID-01-008** |
| 3.3 | EditableCell isEditing 외부 controlled 통합 (cross-package wiring) | grid-core ↔ grid-renderers | G-7 implement 단계 결정 |

**의존**: 본 spec 의 G-3 신 Goal MOD-GRID-01 G-006 + G-7 신 Goal MOD-GRID-01 G-007 완료 필수.
**canonical 변경**: MOD-GRID-01 G-006 + G-007 신설.

### Phase 4 — 시각 회귀 + 마이그레이션 가이드

| 단계 | 작업 | 패키지 | 의존 |
|------|------|--------|------|
| 4.1 | Playwright 시각 회귀 baseline (Wijmo vs tw-grid 등가) — C-13 / C-17 의무 | grid-docs (MOD-99-B) | — |
| 4.2 | publish/organizeSchedule → tw-framework-front 신 페이지로 옮기는 마이그레이션 가이드 (5 gap 패턴 catalog) | grid-docs (MOD-99-B) | MOD-99-B G-005 (existing) |

### 추정 작업량

| Phase | 추정 | 비고 |
|-------|------|------|
| Phase 1 | 4~6h | application 측 dynamic columnDef 작성 + Storybook |
| Phase 2 | 6~8h | 신 Goal MOD-GRID-05 G-004 (3 prop, ~+0.2 KB) + Storybook 3 stories |
| Phase 3 | 12~16h | 신 Goal MOD-GRID-01 G-006 + G-007 (cellClassName + onCellKeyDown + startEditing + EditableCell controlled wiring) |
| Phase 4 | 4~6h | 시각 회귀 + 마이그레이션 가이드 |
| **합계** | **26~36h** | Phase 1~2 는 application + 신 G-004 단일, Phase 3 가 다수 cross-package 작업 (가장 무거운 단계) |

---

## 7. 사용자 결정 지점

§6 정책 평가: critical 5 해당 여부.

| 결정 | critical 5 | 자체 결정 vs 사용자 surface | 추천 |
|------|-----------|------------------------|------|
| **D-1**. 5 gap 권고 옵션 분포 (A×3 + C×1 + D×1) 채택 여부 | A (canonical spec 변경) | **사용자 surface 권고** | 보고서 검토 후 별도 cycle (G-006 / G-007 / G-004 신설) 트리거 |
| **D-2**. 신 ADR ID 발급 (ADR-007 + 008 + 003) | A | **자체 결정 (ID-LEDGER 룰 적용 권한)** | ID-LEDGER §1.1 룰 따라 `lastIssued + 1` 자동 발급 |
| **D-3**. 신 Goal ID 발급 (MOD-GRID-01 G-006 + G-007, MOD-GRID-05 G-004) | A | **자체 결정 (ID-LEDGER §1.1)** | 본 spec 의 ID 가 정확 (G-005 → G-006 → G-007 / G-003 → G-004) |
| **D-4**. semver 영향 (minor ×3 + patch ×1 + none ×1) 일관 적용 | A + C (라이선스/배포) | **사용자 surface** | minor patch release plan 별도 cycle |
| **D-5**. MOD-GRID-14 createColumnGroup type widening (option) | A (작은 변경) | **사용자 surface 권고** | application 측에서 TanStack 리터럴 직접 사용 가능 → wrapper widening 은 선택 (값 작음) |

→ **사용자 surface 항목**: D-1 + D-4 + D-5 (3건). 본 spec 작성 자체는 **read-only 분석 + 보고서 작성** 으로 §6 정책상 critical 5 비해당.

후속 조치 (G-006 / G-007 / G-004 신설 implement) 는 별도 cycle 트리거 필요. 본 spec 은 사전 검토 자료.

---

## 8. 알려진 한계

| # | 한계 | 영향 |
|---|------|------|
| L-1 | publish/organizeSchedule 1 페이지 외 동일 패턴 페이지 존재 여부 미확인 (mis-wijmo-aggrid-replacement-analysis.md L-4 동일 한계). 본 spec 의 5 gap 보강은 organizeSchedule 1 페이지 use case 기반. 향후 다른 페이지가 다른 형태의 formatItem / prepareCellForEdit / hostElement keyboard 사용 시 spec 보강 필요 가능. | 작음 |
| L-2 | G-7 의 cross-package wiring (Grid → EditableCell `isEditing` 외부 controlled) 의 detail design 미완 — implementer 단계에서 EditingContext 또는 column.meta.editable 패턴 결정 의무. spec 본문은 `startEditing(rowId, colId)` API 만 명시, 내부 implementation 은 implementer 결정 영역. | 중 — implementer 의 자체 결정 의무 |
| L-3 | G-4 application 측 코드 예시 (§4.2.2) 는 가설 — 실 implementer 가 tw-framework-front 신 페이지로 옮길 때 검증 필요. TanStack `header: () => ReactNode` 가 실제로 MultiRowHeader 의 `flexRender` 와 정합 (L226) 임은 확인했으나, 모든 edge case (sorting indicator 와 충돌 등) 는 baseline 시점 미검증. | 작음 — implementer 단계 typecheck + Storybook 으로 보강 |
| L-4 | G-6 의 `stopPropagationOnKeyDown` prop 은 publish 의 host keydown wiring (G-7) 과 분리 의도. G-7 신 Goal 의 cell-level onCellKeyDown 채택 시 publish 의 host-level 분리 의도 자체가 무의미 — `stopPropagationOnKeyDown` 의 필요성 재검토 가능. | 작음 — G-7 implement 후 G-6 prop 의 use case 재확인 |
| L-5 | 본 spec 은 `mis-wijmo-aggrid-replacement-analysis.md` 의 5 gap 만 다룸. 동 보고서의 G-1 (Globalize), G-2 (DataType), G-8 (updatedLayout) 은 application 영역 (peer dep 또는 어플리케이션 측 ResizeObserver) 으로 본 spec 범위 외. | 작음 |

---

## 부록 A — 인용된 source line 정확 인덱스

### A.1 publish/organizeSchedule/page.tsx
- L92: `g.allowMerging = wjGrid.AllowMerging.ColumnHeaders` (G-5)
- L111-135: `applyHeaderTwoRows` (G-4)
- L182-244: `g.formatItem.addHandler` (G-3)
- L252-284: `g.hostElement.addEventListener('keydown', ...)` (G-7)
- L287-300: `g.prepareCellForEdit.addHandler` (G-6)

### A.2 grid-core/src/types.ts
- L71-136: `GridHandle<TData>` interface (startEditing/getActiveCell 부재 확인)
- L386-420: `onCellClick` callback (ADR-MOD-GRID-01-004 D4)
- (전체) `cellClassName / rowClassName / onCellKeyDown` 부재 확인

### A.3 grid-renderers/src/EditableCell.tsx
- L40: `CellClassNameCallback<TData>` type export
- L47-68: `EditableCellProps` (maxLength / align / stopPropagationOnKeyDown 부재 확인)
- L115-127: `handleKey` (Enter/Esc/Tab native, stopPropagation 부재)

### A.4 grid-pro-header/src/createColumnGroup.ts
- L26-31: `ColumnGroupConfig<TData> { header: string; columns: ... }` (string only)

### A.5 grid-pro-header/src/MultiRowHeader.tsx
- L196-205: `isPlaceholder` 분기 (G-5 D 전략 증거)
- L226: `flexRender(header.column.columnDef.header, ...)` — TanStack 의 header function 자동 처리 (G-4 application 측 표현 가능 증거)

### A.6 ADR / Goal ID-LEDGER 인용
- ID-LEDGER §2.2 MOD-GRID-01 lastIssued ADR-006 (다음: 007)
- ID-LEDGER §7 MOD-GRID-01 lastIssued G-005 (다음: G-006)
- ID-LEDGER §7 MOD-GRID-05 lastIssued G-003 (다음: G-004)
- ADR-MOD-GRID-05-002 D3 (deferred to MOD-GRID-01/04) — G-3 처리 약속 이행 근거

---

## 부록 B — 본 spec 의 §6 advisor 우선 정책 적용

본 task 자체는 read-only 분석 + spec writer (실 ADR 본문 미수정). §6 정책상 critical 5 비해당:
- A 비즈니스 정책: 영향 X (canonical 보강 권고만, 실 변경 X)
- B 외부 사용자: 영향 X
- C 비용: 영향 X (spec 작성, 라이선스/배포 변경 X)
- D 비가역: 영향 X (보고서 작성, undo 가능)
- E 환경: 영향 X

→ advisor 우선 (자체 결정), 사용자 surface 안 함.

사용자 surface 가 필요한 시점은 본 spec 의 권고 (D-1 / D-4 / D-5) 채택 결정 단계 — 별도 cycle.

---

**spec writer**: 본 보고서는 보강 권고 sketch. 신 ADR 본문 / Goal 신설 작성은 별도 implementer cycle 트리거 의무.
