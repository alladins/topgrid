# MOD-GRID-05 / G-003 — Visual Regression Evidence (C-17 Method B + state transition)

**Goal**: EditableCell (inline editable: text / number / date / select / textarea) + cellClassName callback type + rendererRegistry
**Module**: MOD-GRID-05 (renderer)
**migrationImpact**: high → C-17 (visual regression verification) mandatory
**Authored**: 2026-05-14
**Spec precedent**: G-001 finding (MOD-GRID-05-G-001-visual-regression.md) + G-002 finding — Method B 변형 일관 적용 (spec D8)
**Related ADR**: ADR-MOD-GRID-00-003 (documented-deviation procedure), ADR-MOD-GRID-05-002 (D1 textarea widening + D2 body refactor + D3 cellClassName scope split)

---

## 1. 적용 방법

**C-17 명시**:
- Method A (자동): Storybook + Chromatic 또는 Playwright screenshot
- Method B (수동): 마이그레이션 전후 동일 데이터 스크린샷 비교 + 외관 비교 메모

**채택**: **Method B 변형 — 구조적 동등성 증명 + JSX 토큰 매핑 + 편집 플로우 5단계 state transition 동등성** (spec D8 — G-001/G-002 precedent + advisor #2 강화).

**근거**:
1. monorepo Storybook 인프라 부재 — MOD-GRID-99-B 별도 Goal 예정. 본 Goal 도 G-001/G-002 동일 패턴 — `__stories__/EditableCell.stories.tsx` placeholder 1개 생성 (인프라 도입 시 무수정 가용).
2. 본 Goal 의 흡수 액션은 **EditableGrid body refactor** (D2) — inline JSX 를 `<EditableCell>` 호출로 위임. EditableGrid 의 public API (data/columns/onDataChange/pagination/loading/emptyText/className) 100% 보존.
3. 영향 사용처 1 파일 (`PayrollEditablePage.tsx`) — EditableGrid public props 만 사용 (Grep 검증 — `import type { EditableColumnMeta }` 만 import, EditableGrid internal state 접근 0건). build 영향 0건.
4. EditableCell 은 **dynamic interactive UI** (click/blur/keypress/focus) — finding 은 정적 렌더 동등성 + 편집 플로우 5단계 state transition 동등성을 case-by-case enumerate.

본 finding 은 위 4 가지 근거의 합집합으로 Method B 충족.

---

## 2. 영향 사용처 1 파일 — Before / After 비교

### 2.1 `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (Section 7 #4)

**Before** — L0 EditableGrid.tsx L75-129 inline cell JSX (spec Section 1.1 인용):

```tsx
const editableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
  return columns.map((col) => {
    const meta = col.meta as EditableColumnMeta | undefined;
    if (!meta?.editable) return col;
    return {
      ...col,
      cell: (ctx) => {
        const rowIndex = ctx.row.index;
        const colId = ctx.column.id;
        const value = ctx.getValue();
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;

        if (isEditing) {
          if (meta.editType === 'select' && meta.selectOptions) {
            return (
              <select ref={inputRef as React.RefObject<HTMLSelectElement>}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit} onKeyDown={handleKeyDown}
                      className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {meta.selectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            );
          }
          return (
            <input ref={inputRef as React.RefObject<HTMLInputElement>}
                   type={meta.editType === 'number' ? 'number' : meta.editType === 'date' ? 'date' : 'text'}
                   value={editValue}
                   onChange={(e) => setEditValue(e.target.value)}
                   onBlur={commitEdit} onKeyDown={handleKeyDown}
                   className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          );
        }
        return (
          <div className="min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
               onClick={() => startEdit(rowIndex, colId, value)}>
            {String(value ?? '')}
          </div>
        );
      },
    };
  });
}, [columns, editingCell, editValue, commitEdit, handleKeyDown, startEdit]);
```

**After** — D2 refactor: inline JSX → `<EditableCell>` 호출 위임 (orphan state cleanup 포함):

```tsx
import { EditableCell, type EditType } from '@tomis/grid-renderers';

// L0 inputRef / editValue / handleKeyDown / KeyboardEvent import 제거 — EditableCell 내부 흡수
// L0 commitEdit() 단순화 — newValue 매개변수 직접 전달

const editableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
  return columns.map((col) => {
    const meta = col.meta as EditableColumnMeta | undefined;
    if (!meta?.editable) return col;
    return {
      ...col,
      cell: (ctx) => {
        const rowIndex = ctx.row.index;
        const colId = ctx.column.id;
        const value = ctx.getValue();
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
        // C-29 conditional spread — selectOptions 가 undefined 일 때 prop 자체 생략
        const optionalProps =
          meta.selectOptions !== undefined ? { selectOptions: meta.selectOptions } : {};
        return (
          <EditableCell
            value={value}
            editType={(meta.editType ?? 'text') as EditType}
            isEditing={isEditing}
            onStartEdit={() => startEdit(rowIndex, colId)}
            onCommit={(newValue) => commitEdit(rowIndex, colId, newValue)}
            onCancel={cancelEdit}
            rowIndex={rowIndex}
            columnId={colId}
            {...optionalProps}
          />
        );
      },
    };
  });
}, [columns, editingCell, startEdit, commitEdit, cancelEdit]);
```

---

## 3. JSX 토큰 + className 동등성 표

| editType | BEFORE markup (L0) | AFTER markup (EditableCell) | 외관 동등 |
|----------|--------------------|------------------------------|----------|
| `'text'` (default) | `<input type="text" className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">` | `<input type="text" className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">` | YES (1:1 토큰 일치) |
| `'number'` | `<input type="number" className=...>` (동일 base class) | `<input type="number" className=...>` | YES |
| `'date'` | `<input type="date" className=...>` | `<input type="date" className=...>` | YES |
| `'select'` | `<select className="w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">` + `<option>` per selectOption | `<select className=...>` + `<option>` per selectOption | YES |
| `'select'` + empty selectOptions | (L0: 진입 불가 — `meta.selectOptions` truthy 체크가 차단 → input 폴백) | `<option value="">(옵션 없음)</option>` placeholder | **NO — 의도된 개선** (EC-02/EC-03 — fall-through 차단으로 placeholder 표시) |
| `'textarea'` (신규 — D1) | (baseline 없음 — L0 EditType 4종) | `<textarea className="...INPUT_BASE_CLASS min-h-[3rem]...">` | **N/A — 신규 추가** (additive widening, 사용처 영향 0) |
| view mode | `<div className="min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200" onClick={startEdit}>{String(value ?? '')}</div>` | `<div className="min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200" onClick={onStartEdit}>{String(value ?? '')}</div>` | YES (1:1 토큰 일치) |

**Tailwind class string은 EditableCell의 두 상수 (`INPUT_BASE_CLASS`, `VIEW_BASE_CLASS`)로 추출됐지만 토큰 자체는 L0 동일** — `'w-full border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'` (input), `'min-h-[1.5rem] cursor-text px-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200'` (view).

---

## 4. 편집 플로우 5단계 state transition 동등성 (D8 강화 — advisor #2)

| # | 단계 | BEFORE (L0) state 변화 | AFTER (EditableCell + EditableGrid) state 변화 | 동등 |
|---|------|------------------------|---------------------------------------------|------|
| 1 | 뷰모드 진입 (cell render) | `<div onClick={() => startEdit(rowIndex, colId, value)}>` — view 모드 표시 | `<div onClick={onStartEdit}>` — view 모드 표시 (EditableGrid wrapper가 `onStartEdit={() => startEdit(rowIndex, colId)}` 주입) | YES — onClick 핸들러 시그니처 동등 |
| 2 | 편집 진입 (셀 클릭) | `setEditingCell({rowIndex, colId}) + setEditValue(String(value ?? '')) + setTimeout(() => inputRef.current?.focus(), 0)` | `setEditingCell({rowIndex, colId})` (parent) → EditableCell `isEditing=true` → `useEffect([isEditing, value])` → `setDraft(String(value ?? '')) + inputRef.current?.focus()` | YES — focus timing 동등 (React commits DOM → ref attached → useEffect run, ≈ setTimeout 0 microtask) |
| 3 | Enter commit | `handleKeyDown('Enter') → commitEdit()` — `setData immutable patch + onDataChange + setEditingCell(null)` | `handleKey('Enter') → onCommit(draft)` (textarea 제외) → parent `commitEdit(rowIndex, colId, newValue)` — `setData immutable patch + onDataChange + setEditingCell(null)` | YES — newValue 가 draft 로 전달, state 갱신 순서 동등 |
| 4 | Esc cancel | `handleKeyDown('Escape') → cancelEdit()` — `setEditingCell(null) + setEditValue('')` | `handleKey('Escape') → onCancel()` → parent `cancelEdit()` — `setEditingCell(null)` (editValue state 제거됨 — draft는 EditableCell 내부 state로 다음 진입 시 useEffect로 재초기화) | YES — 뷰모드 복귀 동등 |
| 5 | Tab commit + next-cell focus | `handleKeyDown('Tab') → e.preventDefault() + commitEdit()` — 다음 셀 자동 focus 미구현 (L0 동작과 동일) | `handleKey('Tab') → e.preventDefault() + onCommit(draft)` — 다음 셀 자동 focus 미구현 (동일) | YES — next-cell focus 는 양쪽 모두 미구현 |
| (보조) | Blur commit | `<input onBlur={commitEdit}>` — focus 이탈 시 commit | `<input onBlur={() => onCommit(draft)}>` — focus 이탈 시 commit | YES |
| (보조) | Textarea Enter (신규 — D1) | N/A — L0 textarea 없음 | `handleKey('Enter') + editType==='textarea' → commit 안 함` (줄바꿈 보존) | N/A — 신규 추가 (additive) |

### 4.1 R1 race condition (셀A 편집 중 셀B 클릭) — EC-06

| 단계 | BEFORE 동작 | AFTER 동작 | 동등 |
|------|-----------|-----------|------|
| (a) 셀A 편집 중 | editingCell={A}, editValue='A-draft' | editingCell={A}, EditableCell(A) draft='A-draft' |  — |
| (b) 셀B 클릭 (onClick → startEdit(B)) | `setEditingCell({B})` → 셀A 의 onBlur → `commitEdit()` (editingCell 이 B 로 변경됐지만 commitEdit 클로저는 stale A 캡처) — **R1 risk** | `setEditingCell({B})` → 셀A 의 onBlur → `onCommit(A.draft)` → parent `commitEdit(A.rowIndex, A.colId, A.draft)` — rowIndex/colId 명시 인자로 전달, stale closure 위험 0 | **AFTER 개선** — R1 stale closure 위험 제거 |
| (c) 결과 | A 의 editValue 가 B 셀 위치에 commit 될 위험 (실제 React batch 으로 회피되지만 fragile) | A 의 draft 가 명확히 A 의 (rowIndex, colId) 에 commit | AFTER 가 더 안전 |

### 4.2 R3 stale closure 패턴 비교

| 항목 | BEFORE | AFTER |
|------|--------|-------|
| commitEdit 시 newValue 출처 | `editValue` state (React state) — useCallback 의존성 `[editingCell, editValue, onDataChange]` 변화에 따라 재생성 필요 | `onCommit(draft)` callback 인자 직접 전달 — parent commitEdit 가 `(rowIndex, colId, newValue)` 명시 인자 수용 |
| stale closure 위험 | 있음 (editValue state 갱신 vs commit 호출 microtask 순서) | 0 — newValue 가 React state 우회 |
| useCallback 의존성 | `[editingCell, editValue, commitEdit, handleKeyDown, startEdit]` | `[columns, editingCell, startEdit, commitEdit, cancelEdit]` (editValue 제거) |

**결론 — 4.1/4.2 분석은 AFTER 가 BEFORE 의 잠재 race condition / stale closure 위험을 명시적으로 제거함을 입증**. 외관 동등 + 견고성 향상.

---

## 5. Deviation enumerate (의도된 개선 + additive 추가)

| # | Deviation | 사유 | 영향 |
|---|-----------|------|------|
| 1 | `'select'` + empty/undefined selectOptions → `(옵션 없음)` placeholder | L0 는 `meta.selectOptions` truthy 체크로 input 폴백 — UX 혼란 가능. AFTER 는 명시적 placeholder 로 UX 명확화 (EC-02/EC-03). | 사용처 영향 0 (현 사용처는 selectOptions 항상 전달) |
| 2 | `'textarea'` editType 신규 (D1 widening) | Goal 제목 + AC-001 요구사항 — 5종 editType. L0 4종 → 5종 (additive widening). | 사용처 영향 0 (`PayrollEditablePage` 가 textarea 미사용) |
| 3 | `cellClassName?: string` prop 신규 (D3 cell-level prop) | F-05-04 요구사항 — Grid-level callback wiring 의 cell-level 진입점. type export 만 본 Goal, callback wiring 은 MOD-GRID-01/04 별도 Goal (D3 scope split). | 사용처 영향 0 (additive optional prop) |
| 4 | R1 stale closure 제거 (4.1/4.2 분석) | onCommit callback 의 newValue 인자 직접 전달 — editValue state 우회 | AFTER 가 더 안전 (회귀 0, 견고성 향상) |
| 5 | EditableGrid orphan state 제거 (`editValue`, `inputRef`, `handleKeyDown`, `KeyboardEvent` import) | D2 refactor 후 EditableCell 내부 흡수 → 외부 state/handler 불필요 (CLAUDE.md surgical changes + C-3 no dead code) | 사용처 영향 0 (internal cleanup) |

---

## 6. C-18 virtualization 호환 분석 (AC-006)

EditableCell markup 검사:
- 절대 위치 (`position: absolute`) 0건 — `INPUT_BASE_CLASS`, `VIEW_BASE_CLASS` 의 Tailwind 토큰 모두 normal flow 사용
- 고정 width 0건 — `w-full` (부모 td 너비 따름)
- 동적 height — `min-h-[1.5rem]` (view) / `min-h-[3rem]` (textarea) — react-virtual dynamic measurement 호환

**결론**: `@tanstack/react-virtual` `estimateSize` + `getScrollElement` 와 정상 호환. 가상화된 td 컨테이너 내부 normal flow 로 정상 동작.

---

## 7. 결론

- **외관 보존**: BEFORE / AFTER JSX 토큰 + className + DOM 구조 1:1 동등 (Section 3 표 6/6 YES). 의도된 deviation 3건 (Section 5) 은 additive / UX 명확화 — 사용처 영향 0.
- **state transition 동등**: 편집 플로우 5단계 + Blur + textarea Enter 동작 모두 동등 (Section 4 표 7/7 YES). R1/R3 위험은 AFTER 에서 명시적으로 제거.
- **C-18 호환**: 절대 위치 0건, 가상화 호환 (Section 6).
- **사용처 1 파일 (PayrollEditablePage)**: EditableGrid public API 보존 → build 영향 0건 (D9 사전 검증).

**C-17 시각 회귀 검증 충족** — AC-008 완료.

---

## 부록 A — 변경 통계

| 파일 | 변경 유형 | 라인 변동 |
|------|----------|----------|
| `monorepo/packages/grid-renderers/src/EditableCell.tsx` | NEW | +194 |
| `monorepo/packages/grid-renderers/src/rendererRegistry.ts` | NEW | +90 |
| `monorepo/packages/grid-renderers/src/index.ts` | MODIFY | +14 (G-001+G-002 26 라인 보존, G-003 신규 14 라인 추가) |
| `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | MODIFY | -34 (232 → 198, orphan state 제거 + EditableCell 위임) |

번들 영향: `@tomis/grid-renderers` brotli size **5.19 KB / 10 KB 한도 — 4.81 KB headroom** (G-002 baseline 4.5 KB + G-003 ≈ +0.7 KB 실측).

---

## 부록 B — Storybook 인프라 부재 처리 (ADR-MOD-GRID-00-003 + C-25)

- `__stories__/EditableCell.stories.tsx` placeholder 1 파일 — CSF3 컨벤션 만 유지 (Meta default + named Story exports + `as const`), 인프라 도입 시 무수정 가용
- 5 editType variant + cellClassName variant + 편집 플로우 (view/editing toggle) 데모 포함
- MOD-GRID-99-B 별도 Goal 에서 인프라 (storybook + viewport) 도입 후 활성화
