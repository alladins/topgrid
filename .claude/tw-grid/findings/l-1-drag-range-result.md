# L-1 drag-range + abbreviation 결과

- 작성일: 2026-05-18
- 작업 범위: Phase 3.5 (DEFERRED → COMPLETED) — drag-range cell selection + right-click "apply abbreviation" menu
- 대상 파일: `D:/project/topvel_project/TBIZONE/publish/src/app/personal/commute-manage/organizeSchedule/page.tsx`
- 백업:
  - `page.tsx.before-tw-grid-migration.bak` (Wijmo 원본)
  - `page.tsx.phase-2-end.bak` (Phase 2 종료)
  - `page.tsx.phase-3-4-end.bak` (Phase 3+4 종료)
  - `page.tsx.l-2-end.bak` (본 cycle 시작 시점 = L-2 종료)

---

## 1. 변경 파일

| 파일 | 변경 | 비고 |
|------|------|------|
| `TBIZONE/publish/package.json` | `@tomis/grid-pro-range` file dep 추가 (file:../../topvel-grid-monorepo/...) | 본 cycle 신규 |
| `TBIZONE/publish/package-lock.json` | `npm install` 으로 lockfile 갱신 | 부수 |
| `TBIZONE/publish/.../organizeSchedule/page.tsx` | useCellRange + isInRange wire-up + applyAbbrevToSelection + context menu UI | 본 cycle 핵심 |
| `TBIZONE/publish/.../organizeSchedule/page.tsx.l-2-end.bak` | L-2 종료 시점 백업 (본 cycle 직전) | 본 cycle 신규 |

CSS / 의존성 외 추가 없음. monorepo 의 `grid-pro-range` 패키지는 이미 dist 포함 사전 빌드 상태 (dist/index.{cjs,mjs,d.{c,}ts} 6 파일 존재) — 별도 build 불필요.

---

## 2. 채택 옵션 + 사유

### 2.1 drag-range = 옵션 A `useCellRange` headless hook

`RangeSelectGrid`(옵션 B) 는 자체적으로 `useReactTable`을 호출하는 **완전 대체 그리드 컴포넌트**입니다 (RangeSelectGrid.tsx L88-96). `<Grid>`/`<ChangeTrackingGrid>` 와 합성 불가 — 둘 중 하나만 사용 가능. RangeSelectGrid 채택 시 `useChangeTracking` 의 변경 추적 (added/edited/deleted) 기능 전체를 잃고 재구현 필요.

옵션 A — headless `useCellRange` hook — 은 5 가지를 반환:
- `range: CellRange | null`
- `dragging: boolean`
- `handleMouseDown(row, col, shiftKey)`
- `handleMouseEnter(row, col)`
- `handleMouseUp()`

이를 페이지 레벨에서 호출하고, day 셀 렌더러의 focusable `<div tabIndex={0}>` (Phase 3.3 에서 도입된 것) 에 mouse handler 들을 부착. `<ChangeTrackingGrid>` 자체에는 손대지 않음. **변경 추적 + drag-range 양립 가능**.

→ **옵션 A 채택**.

### 2.2 abbreviation menu = inline JSX (페이지 내)

Wijmo 원본 (bak L611-638) 도 동일하게 페이지 inline. 별도 component 추출 가치 미미 (단일 use site, ~30 lines).

→ **inline 채택**.

---

## 3. 구현 디테일

### 3.1 colIdx mapping

- 정의 순서: `fixedCols (4)` + `dayCols (daysInMonth)` → 첫 day col = index 4.
- 셀 렌더러의 `Array.from(..., (_, i) => ...)` 클로저에서 `colIdx = 4 + i` 로 직접 계산.
- `cell.column.getIndex()` 미사용 — 컬럼 피닝으로 leaf 순서가 재배열될 가능성을 회피.
- `cellClassName` 도 동일 규칙으로 colId → dayNum → `4 + (dayNum - 1)` 역산.
- 검증: 현 `defaultColumnPinning.left: ['team', 'position', 'name', 'baseShift']` 가 정의 순서 (0..3) 와 동일. 픽셀 순서 = 정의 순서. 컬럼 피닝 변경 시 재검토 필요 — known limitation L-8.

### 3.2 cellClassName 의 range 의존성

- 기존: `useCallback(..., [])` (의존성 없음).
- 변경: `useCallback(..., [range])` — drag 중 매 mouseenter 마다 range 변화 → cellClassName 재계산 → 셀들의 inline className 갱신. `bg-indigo-100 ring-1 ring-inset ring-indigo-300` 적용. weekend/has-value bg 위에 시각적으로 winning.

### 3.3 column rebuild 회피 (perf)

cell 렌더러 closure 가 `range`/`dragging` 값을 직접 캡처하면, useMemo `[..., range, dragging]` 가 필요 → drag 마다 columns 재생성 → 모든 셀 재마운트 → 끔찍한 perf.

대신 `rangeRef` / `draggingRef` 로 mutable ref 미러 + 셀 클로저는 ref 만 읽음 → columns 안정. `useMemo` deps 는 `[daysInMonth, ymDate, editingCell]` 유지.

### 3.4 applyAbbrevToSelection — per-row aggregation

`applyUpdate` (changeMap.ts:197) 가 `{ ...existing, ...patch }` 로 merge 함을 확인 (advisor 권고대로 source 검증). multi-call merge 안전. 그러나 명확성 + perf 위해 한 row 당 한 번 `updateRow` 호출 — 해당 row 내 모든 in-range d{n} 컬럼을 한 patch object 에 모음.

```typescript
const patch: Partial<MemberRow> = { actionType: 'UPDATE_WORK_SCHEDULE' };
for (let c = c0; c <= c1; c++) {
  if (c < 4) continue;
  const dayNum = c - 4 + 1;
  (patch as Record<string, unknown>)[`d${dayNum}`] = abbr;
  workDateLast = formatYYYYMMDD(dayNum);
}
patch.workDate = workDateLast;
trackingRef.current.updateRow(row.emplNo, patch);
```

### 3.5 workDate per-column 계산 — 의도된 Wijmo 패리티 개선

Wijmo 원본 `applyAbbrevToSelection` (bak L385-403) 은 `g.setCellData(r, c, abbr)` 만 호출. `row.workDate` 는 set 하지 않음 → 저장 시 워크데이트 누락 → BE 가 `workDate` 필수 → 무시되거나 에러 (잠재적 원본 측 버그).

본 cycle 은 each d{n} 컬럼에 대해 workDate 를 계산하여 patch 에 포함. **다만** BE 가 row 당 단일 `workDate` 만 받음 (organizeScheduleApi.ts 의 SaveItem 구조) → 다중-day 범위 적용 시 **마지막 day 의 workDate 만 보존됨**. 이는 BE 페이로드 한계 — 다중-day range save 의 정합성은 BE/스키마 refactor 필요 (out-of-scope this cycle).

→ known limitation **L-7** (다중-day range save BE 페이로드 한계).

### 3.6 mousedown vs click disambiguation

| 시나리오 | dragHappenedRef | onClick 결과 |
|----------|-----------------|--------------|
| 셀 클릭 (드래그 없음) | false | enterEdit |
| 드래그 (mouseenter 다른 셀) | true | suppressed |
| shift+click 범위 확장 | **true (mouseDown 시 ev.shiftKey)** | suppressed |

`shift+click` 도 drag-like 로 마킹 — 사용자가 의도적으로 범위 확장한 후 edit 가 의도가 아님.

### 3.7 mouseup placement

- wrapper `<div className="schedule-wrap schedule-grid">` 에 `onMouseUp` + `onMouseLeave` 모두 부착.
- mouseup outside 셀 / wrapper 영역 외 release 케이스 모두 커버.

### 3.8 contextmenu 의 range capture

- `menuState.range` 에 click 시점의 range 스냅샷 보관.
- 우클릭이 단일 셀 (현 range 외부) 인 경우 그 단일 셀을 effective range 로 사용 (mirror Wijmo bak L362-370).
- `useEffect(handler, [menuState.visible])` → window click → 메뉴 dismiss.
- 메뉴 자체 click 은 `e.stopPropagation()` 으로 dismiss 방지.

---

## 4. 검증

| 항목 | 결과 |
|------|------|
| `npm install` | PASS — `added 1 package, and changed 1 package in 4s` |
| symlink 생성 | PASS — `publish/node_modules/@tomis/grid-pro-range -> /d/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range` |
| TypeScript typecheck (`npx tsc --noEmit`) — organizeSchedule | **0 errors** |
| publish 전체 errors | **35 (pre-existing, 본 cycle 무관 18 files)** — Phase 3+4 baseline 와 동일 보존 |
| grid-pro-range 관련 import errors | 0 |
| 브라우저 manual 검증 | 미실행 — 사용자 영역 (`npm run dev` 후 인간 시각 검증) |

### 4.1 typecheck 명령 + 결과 정확 인용

```powershell
cd D:\project\topvel_project\TBIZONE\publish
npx tsc --noEmit 2>&1 | Select-String "organizeSchedule"
# (empty output = 0 errors)

npx tsc --noEmit 2>&1 | Select-String "error TS"
# 35 errors (pre-existing in 18 unrelated files)
```

---

## 5. 결과 체크리스트

- [x] `@tomis/grid-pro-range` file dep 추가 (publish/package.json)
- [x] `npm install` PASS + symlink 생성 확인
- [x] drag-range wire-up — useCellRange + day 셀 mouseDown/mouseEnter/mouseUp
- [x] range 시각 highlight — cellClassName 의 isInRange 적용
- [x] applyUpdate 의 merge 동작 source 확인 (changeMap.ts:197)
- [x] applyAbbrevToSelection per-row aggregation
- [x] right-click context menu UI (inline JSX, mirrors Wijmo bak L611-638)
- [x] 메뉴 dismiss (outside click + esc 미구현 — Wijmo도 미구현)
- [x] mousedown vs click 분리 (dragHappenedRef + shift+click 처리)
- [x] mouseup wrapper level (release outside cells)
- [x] typecheck organizeSchedule 0 errors
- [x] publish 전체 baseline 35 errors 보존 (조회 무관 회귀 0)
- [x] **Phase 3.5 DEFERRED → COMPLETED**

---

## 6. 알려진 한계

| # | 한계 | 영향 |
|---|------|------|
| **L-7** | **다중-day 범위 적용 시 workDate 마지막 day 만 보존**. BE `saveOrganizeSchedule` items[] (organizeScheduleApi.ts:33) 가 row 당 단일 `workDate` 필드만 받음. 한 row × 5개 day 컬럼에 약어 적용 → patch.workDate 가 마지막 day 로 set → BE 저장 시 처음 4 day 의 변경은 workDate 없이 동일 row 로 묶임. Wijmo 원본은 `workDate` 자체를 설정 안 했으므로 **본 implementation 의 동작이 BE 측에서 더 정확** (1/N day 라도 보존됨). 완전 해결에는 BE 페이로드를 (rowKey, dayList, abbr) 형태로 refactor 필요 — 본 cycle 범위 외. | **중 — 다중-day range save 정확성** |
| **L-8** | **`colIdx = 4 + i` 가정의 컬럼 피닝 종속성**. 현 `defaultColumnPinning.left: ['team', 'position', 'name', 'baseShift']` 가 정의 순서 (0..3) 와 동일. left-pin 순서를 변경하거나 day 컬럼을 left-pin 에 추가 / right-pin 적용 시 colIdx 계산이 깨짐. 안전 가드: 사용자가 컬럼 피닝을 동적으로 변경 시 day 컬럼의 colIdx 를 동적으로 lookup 하는 helper 도입 필요. | 작음 — 현 정적 정의 한정 |
| **L-9** | **range visual = `bg-indigo-100`**. weekend (`bg-blue-50`) / has-value (`bg-yellow-50`) 위에 layer. 셀의 outline 시각은 Tailwind class 순서대로 layered. `ring-1 ring-inset ring-indigo-300` 로 outline 추가. dev server manual 검증 시 색상 톤 / 가독성 조정 가능. | 작음 — 시각 디테일 |
| **L-10** | **`dragging` 상태가 `useCellRange` 내부에 있고 외부 unmount 시 mouseup 이 누락되면 stuck 가능**. wrapper `onMouseLeave={handleMouseUp}` 로 wrapper 외 release 커버. **단** 사용자가 mousedown 후 ctrl+탭 으로 윈도우 전환 같은 케이스에서 `mouseup` 이벤트 자체가 발생하지 않음. 다음 mousedown 까지 dragging=true 유지 → 다음 셀 hover 만으로 의도치 않은 범위 확장 가능. window-level mouseup 글로벌 리스너 도입은 본 cycle 범위 외. | 작음 — edge case |
| **L-11** | **shift+click 의 onClick suppression 가 false-negative 가능**. shift+click 후 사용자가 즉시 enter edit 의도라면 회복 불가. workaround: shift+click 후 별도 마우스 클릭 (shift 없이) 또는 키보드 entry. | 매우 작음 — UX 선택 |
| **L-12** | **Phase 3+4 result 의 "@tomis/grid-pro-range 패키지 부재 — 0건" 가 부정확했음**. monorepo 의 `grid-pro-range` 패키지는 dist 포함 사전 빌드 상태로 존재 (May 18 08:41 mtime). 정확한 상황: publish 의 file deps 5건 + node_modules symlink 5건 에 grid-pro-range 미포함이었음. 본 cycle 에서 dep 추가만으로 즉시 통합 가능. Phase 3+4 의 deferral 자체는 RangeSelectGrid ≠ ChangeTrackingGrid 합성 불가의 이유로 여전히 정합 — useCellRange composition 경로 발견 + grid-pro-range build 상태 확인 후에야 진행 가능. | 정보적 — 미래 deferral 분석 시 reference 검증 의무 강화 |
| **L-13** | **`applyAbbrevToSelection` 의 `scheduleData[r]` 인덱싱은 정렬/필터 무전제**. `r` 은 `info.row.index` = TanStack 의 (포스트-정렬) row index. 현 컬럼들 모두 `enableSorting: false` + 필터 wiring 부재 → row index = scheduleData 배열 index. 미래에 정렬 또는 필터 활성화 시 잘못된 row 에 patch 가 적용됨. **안전 가드**: row index 대신 `info.row.original.emplNo` (rowKey) 로 lookup 후 직접 patch 하도록 cell renderer 에서 (emplNo, dayNum) tuple 을 메뉴 state 에 저장하는 refactor 필요. 본 cycle 에서는 정렬/필터 비활성 가정 안전 — 미래 활성화 시 회귀. | **중 — 미래 정렬/필터 활성화 시 회귀** |

---

## 7. ChangeTrackingGrid ↔ useCellRange 호환성 검증 결과

| 조건 | 검증 |
|------|------|
| Grid 가 per-cell mouse events prop 노출하는가 | **NO** — `onCellClick` + `onCellKeyDown` 만 (Grid.tsx L417-423 + L468-471). per-cell mousedown/enter/up 부재. |
| 페이지 측 cell renderer 에서 mouse events 부착 가능? | **YES** — cell 의 `<div>` 자체에 React event handler 부착 가능. <td> 외 child 가 이벤트를 받음 → React event delegation 정상. |
| useCellRange 의 (row, col) 좌표는 어디서 오나? | 페이지 측 cell renderer 의 closure 에서 `info.row.index` + `(4 + i)` 로 직접 제공. hook 은 좌표 의미를 모름 — 좌표를 그대로 저장/비교만 함. |
| applyUpdate 의 patch merge | **MERGE** — `{ ...existing, ...patch }` (changeMap.ts:197). multi-call 안전, 그러나 본 implementation 은 per-row aggregation 으로 한 번만 호출. |
| Column pinning 과 leaf 순서 | `<th>`/`<td>` 렌더 순서 = left-pinned 먼저 + 비-피닝 다음. 본 케이스 에서는 정의 순서 = 피닝 순서 → colIdx 안전. **L-8 참조**. |

---

## 8. 권고 다음 단계

1. **사용자 manual 검증**:
   - `cd TBIZONE/publish && npm run dev` → `/personal/commute-manage/organizeSchedule`
   - (a) 셀 mousedown → drag → mouseup: 범위 셀 `bg-indigo-100` + `ring`
   - (b) shift+click: 기존 시작점 유지 + 새 end 로 범위 확장
   - (c) 우클릭 (day 셀): 메뉴 표시 + 약어 항목 클릭 → 범위 전체 셀 채워짐 + 저장 → BE 전송 시 actionType=UPDATE_WORK_SCHEDULE 확인
   - (d) 단일 셀 클릭: enterEdit 정상 동작 (drag 가 발생하지 않은 경우)

2. **L-7 해소 — BE 페이로드 refactor**: organizeScheduleApi.ts:33 의 SaveItem 을 `{ rowKey, days: [{ dayNum, abbr }] }` 형태로 변경. 다중-day range save 의 BE 측 정합성 확보.

3. **L-8 가드**: column pinning 변경 가능성 대비 — day 컬럼의 colIdx 를 `useMemo(() => Object.fromEntries(dayCols.map((c, i) => [c.columns[0].id, 4 + i])), [...])` 로 lookup 화 (현재는 정의 순서 = 피닝 순서 가정).

4. **organizeSchedule 페이지 → tw-framework-front 옮기기** (별도 cycle):
   - 본 cycle 검증된 Phase 1-5 패턴 (그리드 + EditableCell + ChangeTrackingGrid + cellClassName + onCellKeyDown + columnPinning + useCellRange + abbreviation menu) 전체 이식.

5. **신 ADR** — `MOD-GRID-11-002` (또는 본 cycle 의 amendment): useCellRange + ChangeTrackingGrid 합성 패턴을 canonical 보강. 후속 implementer 가 동일 함정 (RangeSelectGrid 채택 시 변경 추적 손실) 회피.

---

## 부록 A — line 통계

- L-2 종료 (page.tsx.l-2-end.bak): 753 lines
- 본 cycle 종료 (page.tsx): ~865 lines (+112 lines — useCellRange wire-up + applyAbbrevToSelection + context menu UI + 주석)
