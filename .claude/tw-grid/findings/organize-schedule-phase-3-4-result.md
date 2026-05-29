# organizeSchedule Phase 3+4 마이그레이션 결과

- 작성일: 2026-05-18
- 작업 범위: Phase 3 (5 단계) + Phase 4 (reference-only)
- 대상 파일: `D:/project/topvel_project/TBIZONE/publish/src/app/personal/commute-manage/organizeSchedule/page.tsx`
- 백업: `page.tsx.before-tw-grid-migration.bak` (Wijmo 원본) + `page.tsx.phase-2-end.bak` (Phase 2 종료 스냅샷)

---

## 1. 변경 파일

| 파일 | 변경 | 비고 |
|------|------|------|
| `TBIZONE/publish/.../organizeSchedule/page.tsx` | Phase 3 (cellClassName + onCellKeyDown + tabIndex view-div + frozenColumns) + 3.1 actionType union narrow fix | 본 cycle |
| `TBIZONE/publish/.../organizeSchedule/page.tsx.phase-2-end.bak` | Phase 2 종료 시점 백업 | 본 cycle 신규 |
| `TBIZONE/publish/.../organizeSchedule/page.tsx.before-tw-grid-migration.bak` | Wijmo 원본 | 기존 보존 |

CSS / dependencies / package.json 변경 없음.

---

## 2. Phase 3 단계별 처리

### Phase 3.1 — actionType union narrow (TS2322 fix)

**root cause**: `saveOrganizeSchedule` (organizeScheduleApi.ts:33) 의 `items` 배열은 `actionType: 'INSERT_WORK_SCHEDULE' | 'UPDATE_WORK_SCHEDULE' | 'DELETE_WORK_SCHEDULE'` discriminated union 을 요구하나, Phase 2 의 inline `actionType: 'INSERT_WORK_SCHEDULE'` literal 은 `string` 으로 widen 되어 line 257 에서 TS2322 발생.

**fix**:
1. `WorkScheduleAction` type alias 도입 + `MemberRow.actionType` 좁힘.
2. `handleSave` 안에서 `SaveItem` type + `toSaveItem(row, action)` helper 함수로 mapping. action 인자는 literal type 으로 전달.
3. 추가 정정 — `getChangeSet()` 의 return 은 `ChangeSet { added: MappedRow[]; updated: MappedRow[]; removed: MappedRow[] }` 이며 `MappedRow = {readonly [key: string]: unknown}` (grid-pro-tracking/types.ts:123). 따라서 `MemberRow` 직접 mapping 불가 — `toSaveItem` 의 row 인자 type 을 `{readonly [key: string]: unknown}` 로 두고 `typeof row.X === 'string'` runtime check 후 추출.

**검증**: `npx tsc --noEmit` — line 257 (actionType TS2322) 해결. line 377-379 (MappedRow assignment) 추가 발견 후 동일 cycle 내 해결.

### Phase 3.2 — G-3 cellClassName wire-up

**Wijmo 원본 (bak L182-218)**: `formatItem.addHandler` 가 cell DOM 에 직접 `e.cell.style.background` mutate — 주말 → `#f7f9ff`, 값 있음 → `#fff6d5`, 선택됨 → `#e0e7ff`.

**tw-grid 정합**:
```typescript
const cellClassName = useCallback<CellClassNameCallback<MemberRow>>(
  (cell) => {
    const colId = cell.column.id;
    if (!colId.startsWith('d')) return '';
    const meta = cell.column.columnDef.meta as { dayOfWeek?: number } | undefined;
    const dow = meta?.dayOfWeek;
    const value = cell.getValue() as string | undefined;
    const hasValue = value != null && value !== '';
    const isWeekend = dow === 0 || dow === 6;
    const classes: string[] = [];
    if (isWeekend) classes.push('bg-blue-50');
    if (hasValue) classes.push('bg-yellow-50');
    return classes.join(' ');
  },
  [],
);
```

**wire-up**: `<ChangeTrackingGrid cellClassName={cellClassName} ... />`. `meta.dayOfWeek` 는 column 정의 시 ymDate 기준 사전 계산.

**선택 상태 (Wijmo `getSelectedState`)**: tw-grid 는 cell-range selection 미제공 (row selection only) — 본 항목은 Phase 3.5 deferred 와 함께 미적용. weekend + has-value 만 적용.

**검증**: typecheck PASS, manual visual 검증은 publish dev server 기동 필요 (사용자 영역).

### Phase 3.3 — G-7 keyboard-driven editing entry

**Wijmo 원본 (bak L252-284)**: `g.hostElement.addEventListener('keydown')` 안에서 (1) char/Backspace/Delete 키 감지 → (2) `g.startEditing(true)` → (3) editor input 에 초기값 setting + 포커스.

**tw-grid 정합 결정 — application-state route 채택**:
- **이유**: `ChangeTrackingGrid.ref` 는 `startEditing` 을 노출하지 **않음** (`@tomis/grid-pro-tracking/legacy/ChangeTrackingGrid.tsx` L111-148 의 `useImperativeHandle` 이 `scrollTo/getSelection/clearSelection/refresh` 만 no-op stub + `addRow/updateRow/deleteRow/undoRow` + tracking surface 만 노출. `startEditing` 부재. types.ts:184-186 의 wrapper policy: "ChangeTrackingGrid / MasterDetailGrid / ContextMenuGrid 등 자체 handle 을 노출하는 wrapper 는 본 method 를 구현하지 않을 수 있음").
- `gridRef.current?.startEditing?.(...)` 호출은 옵셔널 체이닝으로 silently no-op. **false PASS 회피** 위해 application-state route 채택.

**구현**:
```tsx
// day column cell renderer — view mode 시 focusable <div tabIndex={0}>
if (isEditing) {
  return <EditableCell ... />;
}
return (
  <div
    tabIndex={0}
    onClick={enterEdit}
    onKeyDown={(ev) => {
      const isChar = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey;
      const isDel = ev.key === 'Backspace' || ev.key === 'Delete';
      const isEnter = ev.key === 'Enter' || ev.key === 'F2';
      if (isChar || isDel || isEnter) {
        enterEdit();
        if (isEnter) ev.preventDefault();
      }
    }}
    className="w-full h-full flex items-center justify-center cursor-text outline-none focus:ring-1 focus:ring-indigo-400"
  >
    {value ?? ''}
  </div>
);
```

**onCellKeyDown wiring**: Grid prop 으로 `onCellKeyDown` 도 함께 wire (Grid.tsx L421-423/L469-471 의 `<td onKeyDown>` 에 도달). 단 `<td>` 는 default `tabIndex` 부재 (Grid.tsx 비명시) → 직접 focus 불가. 현 implementation 은 focusable 자식 `<div tabIndex={0}>` 에서 처리. onCellKeyDown 은 미래 row-navigation arrow 등 확장 hook 으로 보존.

**초기값 행동**: Wijmo 는 keydown 의 char 를 editor input 의 초기 value 로 inject. 본 implementation 은 EditableCell 마운트 시 기존 cell value 로 시작 — 첫 char keystroke 은 lost. 동등 행동 위해 EditableCell 에 `initialDraft` prop 추가가 필요하나 본 cycle 범위 외 (Phase 4 후 별도 cycle 권장).

### Phase 3.4 — frozenColumns → enableColumnPinning

**Wijmo 원본 (bak L91)**: `g.frozenColumns = 4`.

**tw-grid 정합**:
```tsx
<ChangeTrackingGrid
  enableColumnPinning
  defaultColumnPinning={{
    left: ['team', 'position', 'name', 'baseShift'],
    right: [],
  }}
  ...
/>
```

**sticky CSS 확인**: `Grid.tsx` L283-289 (thead) + L455-460 (tbody) 의 `getPinnedCellStyle(header.column, table, 'thead'/'tbody')` 호출. `position: sticky` + `z-index` 적용 + `getIsPinned()` 분기. 사양 (types.ts L356: "본 G-001은 state만 활성화. sticky CSS 외관은 G-002 범위") 는 spec 단계 도큐. 실 source 는 G-002 wiring 완료 상태로 확인.

**검증**: typecheck PASS. visual sticky 동작은 dev server manual 검증.

### Phase 3.5 — drag-range + abbreviation menu (DEFERRED — known limitation)

**Wijmo 원본 (bak L322-403)**:
- mousedown/mousemove/mouseup → `wjGrid.CellRange` selection 추적
- contextmenu → `applyAbbrevToSelection(abbr)` → `g.deferUpdate` 안에서 range loop + `g.setCellData(r, c, abbr)`

**tw-grid 정합 부재**:
- `@tomis/grid-pro-range` 패키지 **존재하지 않음**:
  - `publish/node_modules/@tomis/` 에 `grid-core / grid-license / grid-pro-header / grid-pro-tracking / grid-renderers` 5건만 존재.
  - `publish/package.json` 의 5 file dep 에 `grid-pro-range` 미포함.
  - `D:/project/topvel_project/topvel-grid-monorepo/packages/` glob 결과 0건.
- DIY 옵션 (custom mousedown/move/up + contextmenu + `<div tabIndex>` 셀에 onMouseDown attach + ref.updateRow() 루프) 은 (a) 셀 lookup 의 직접 DOM hit-test, (b) range visualization (Wijmo 의 selection cell drawing), (c) 다중 row across range 의 commit 의 atomic 보장 등 다수 시나리오 — 단일 cycle 16-22h 범위 초과.

**채택**: defer — known limitation L-1 명시. 신 Goal "MOD-GRID-11 grid-pro-range" 가 신설되거나, MOD-GRID-13 (cell merging) 와 별도 cell-range Goal 신설 후 본 페이지에 통합 권장.

---

## 3. Phase 4 — Playwright vs reference screenshot

**publish 시각 회귀 인프라 부재 확인**:
- `D:/project/topvel_project/TBIZONE/publish/playwright.config.{ts,js,mjs,cjs}` 부재 (Glob 결과 0건).
- `publish/package.json` devDependencies 에 `playwright` 또는 `@playwright/test` 부재.
- 본 publish 는 마이그레이션 reference (출발점) 코드베이스 — visual regression 인프라는 신 페이지 작성 위치 (tw-framework-front) 에 도입 후 baseline 작성이 정합.

**채택**: **reference screenshot only** — 사용자가 manual 검증. 별도 자동화 미실행.

**Phase 4 자동화 권고 (별도 cycle)**:
1. publish 자체에 playwright 도입은 reference 코드의 부담 ↑. 권고 X.
2. tw-framework-front 신 페이지 작성 후 거기에 playwright + visual regression 도입. publish/organizeSchedule.bak (Wijmo) vs tw-framework-front 신 페이지 비교 baseline.
3. 또는 reference screenshot 만 검증 — Wijmo 원본 stored bak 페이지 와 tw-grid 신 페이지의 인간 시각 비교.

---

## 4. 검증

| 항목 | 결과 |
|------|------|
| TypeScript typecheck (`npx tsc --noEmit`) | **organizeSchedule 0 errors** — Phase 3.1 line 257 (actionType union TS2322) + 부수 발견된 line 377-379 (MappedRow assignment) 모두 해결. publish 전체 pre-existing 35 errors 보존 (organizeSchedule 무관 — 18 unrelated files). |
| typecheck 명령 | `cd TBIZONE/publish && npx tsc --noEmit 2>&1 \| grep organizeSchedule` → empty (PASS) |
| 브라우저 manual 검증 | 미실행 — 사용자 영역 (`npm run dev` 후 인간 시각) |
| sticky CSS 검증 | 정적 source 확인 (Grid.tsx L283-289 + L455-460 sticky wired) — 동적 manual 검증은 dev server 필요 |
| drag-range visual | N/A — Phase 3.5 deferred |

---

## 5. 결과 체크리스트

- [x] Phase 3.1 actionType union narrow (TS2322 + 추가 발견 TS2345 모두 해결)
- [x] Phase 3.2 G-3 cellClassName wire-up (weekend + has-value 배경)
- [~] Phase 3.3 G-7 keyboard entry — **partial**. application-state route (`<div tabIndex={0}>` + setEditingCell) 동작하나 **첫 char keystroke lost** (L-2). 사용자가 '키 입력으로 빠른 데이터 입력' 의 Wijmo G-7 본래 UX 가치 미달성. 해소에는 EditableCell `initialDraft` prop 신설 (grid-renderers 신 Goal) 필요.
- [x] Phase 3.4 enableColumnPinning + defaultColumnPinning (left: 4 fixed cols)
- [ ] Phase 3.5 drag-range + abbreviation — **DEFERRED** (L-1)
- [x] Phase 4 reference screenshot only — playwright infra 부재 확인

---

## 6. 알려진 한계

| # | 한계 | 영향 |
|---|------|------|
| **L-1** | **drag-range selection + right-click "apply abbreviation to selection" 메뉴 deferred**. `@tomis/grid-pro-range` 패키지 부재 (publish/node_modules + monorepo 0건). DIY 는 16-22h 단일 cycle 초과 (mousedown/move/up tracking + range visualization + cross-row commit). 사용자 워크플로우 — 1 셀씩 입력하는 fall-back UX 로 일시적 회귀. | **중 — 신 Goal "grid-pro-range" 신설 후 별도 cycle** |
| **L-2** | **char 키 입력 초기값 lost — G-7 의 핵심 UX 가치 미달성**. Wijmo G-7 의 목적은 "셀 선택 후 곧장 키 입력으로 빠른 데이터 입력". 본 implementation 은 (a) keystroke 가 focusable `<div>` 에 발생 → (b) `setEditingCell` 으로 re-render → (c) `<div>` unmount + `<EditableCell>` mount → (d) `useEffect` (NOT `useLayoutEffect`) 로 input focus — 이때 원본 KeyboardEvent 는 이미 consumed. 따라서 enter 모드 전환은 되나 **첫 글자 lost** — 두 번째 키부터 input 에 들어감. 사용자 입장에선 "한 번 클릭/탭 → 다시 타이핑" 의 click-first UX 와 본질적으로 동일 (키보드 fast-path 가치 0). 해소에는 EditableCell 에 `initialDraft` prop 추가 (마운트 시 input value 를 initialDraft 로 시작) 또는 grid-core 측 EditingContext 도입 (focused cell 의 활성 입력 추적) — 본 cycle 범위 외. **체크리스트의 Phase 3.3 표시는 [~] partial.** | **중-상 — G-7 의도된 UX 가치 미달성** |
| L-3 | onCellKeyDown 은 wire 되어 있으나 (Grid.tsx L421-423/L469-471) `<td>` 가 tabIndex 부재 → 실 트리거는 focusable 자식 (현재 view-mode `<div tabIndex={0}>`) 에서 발생. 향후 onCellKeyDown 으로 row-navigation (arrow keys) 추가 시 `<td>` 자체에 tabIndex 부여 또는 grid-core 측 `cellTabIndex` prop 추가 필요. | 작음 — 본 cycle 사용 의도 한정 |
| L-4 | typecheck 통과 + 정적 sticky CSS source 확인. **dev server 기동 + 인간 manual 검증 미실행** — `enableColumnPinning` 실 visual 동작 (스크롤 시 4 col 좌측 고정), cellClassName 의 weekend / has-value 배경 색, view→edit mode 전환 keyboard entry 시각 confirm 은 사용자가 `npm run dev` 후 검증 의무. | 작음 — typecheck + source 확인까지 |
| L-5 | Phase 4 visual regression 자동화 부재. publish 에 playwright 미도입. reference screenshot only 채택. 신 페이지 (tw-framework-front) 마이그레이션 시 visual regression 인프라 도입 권장. | 작음 — 의도된 범위 |
| L-6 | Phase 1+2 의 L-3 (TanStack placeholder vs Wijmo true rowSpan=2 시각 차이) 본 cycle 미해결. row 0 placeholder 의 빈 셀 stacked 시각은 Wijmo true rowSpan=2 단일 셀과 픽셀 차이 가능. Phase 4 visual regression 시 baseline 차이 가능. | 작음 — Phase 1+2 한계 유지 |

---

## 7. 권고 다음 단계

1. **사용자 manual 검증**: publish dev server 기동 (`npm run dev` 또는 `npm run prod`) → `/personal/commute-manage/organizeSchedule` 페이지 → (a) 좌측 4 col sticky, (b) 주말 column 의 light blue background, (c) 값 있는 day cell 의 light yellow background, (d) view mode cell focus + 키보드 입력 시 edit mode 전환. visual 회귀 발견 시 후속 cycle 트리거.

2. **신 Goal 신설 — `grid-pro-range`** (L-1 해소):
   - 단순 cell-range state hook (rangeStart/rangeEnd + onMouseDown/Move/Up wiring on `<td>`) + cell-range 시각 (highlight class) + `getRangeCells()` API.
   - 본 organizeSchedule abbreviation menu use case (~30 줄 application code) 가 첫 consumer.

3. **EditableCell `initialDraft` prop 신설** (L-2 해소):
   - MOD-GRID-05 G-005 (또는 G-004 의 patch) — `<EditableCell initialDraft={char}>` 시 마운트 시 input value 를 `initialDraft` 로 시작 + focus + cursor end. char-input 키보드 entry 의 첫 글자 보존.

4. **organizeSchedule 페이지 → tw-framework-front 옮기기** (별도 cycle):
   - publish 는 reference. 신 실 컬러 페이지는 tw-framework-front 의 `src/pages/tomis/personal/commute-manage/` 또는 동등 디렉토리. 본 cycle 검증된 Phase 1-4 패턴을 옮김 시 visual regression baseline 도입 권고.

5. **신 ADR 본문 (canonical 보강)** — 본 cycle 의 Phase 3.3 결정 ("ChangeTrackingGrid 에서 startEditing 미노출 + application-state route") 을 ADR 본문에 포함. 후속 implementer 가 동일 함정 회피.

---

## 부록 A — typecheck 명령 + 결과 정확 인용

```powershell
cd D:\project\topvel_project\TBIZONE\publish
npx tsc --noEmit
```

본 cycle 직전 (Phase 2 end):
- `src/app/personal/commute-manage/organizeSchedule/page.tsx(257,58): error TS2322: Type '{ actionType: string; }[]' is not assignable to type ...` (organizeSchedule 1 error)

본 cycle 첫 typecheck (Phase 3.1 actionType type 좁힘 + import 갱신 후):
- `src/app/personal/commute-manage/organizeSchedule/page.tsx(377,48): error TS2345: Argument of type 'MappedRow' is not assignable to parameter of type 'MemberRow'.` × 3 (line 377/378/379)
- 분석 후 `toSaveItem` row 인자를 `{readonly [key: string]: unknown}` 으로 변경 (MappedRow 정합).

본 cycle 최종 typecheck:
- organizeSchedule: **0 errors** (PASS).
- publish 전체: 35 errors (18 unrelated files — 본 cycle 무관, Phase 2 end 시점과 동일).

---

## 부록 B — 본 cycle line 통계

- Phase 2 end (page.tsx.phase-2-end.bak): 597 lines
- Phase 3+4 후 (page.tsx): 737 lines (+140 lines — cellClassName + onCellKeyDown callback + WorkScheduleAction type + handleSave 의 SaveItem helper + view-mode focusable `<div tabIndex={0}>` + Phase 3 JSDoc 주석 증가)
