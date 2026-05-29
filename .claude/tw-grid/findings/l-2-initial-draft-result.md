# L-2 EditableCell initialDraft prop + organizeSchedule G-7 복원 결과

- 작성일: 2026-05-18
- 연관 finding: `organize-schedule-phase-3-4-result.md` L-2
- 연관 ADR: ADR-MOD-GRID-05-004 (G-005)

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `topvel-grid-monorepo/packages/grid-renderers/src/EditableCell.tsx` | `initialDraft?: string` prop 추가 + mount wiring (useState lazy init + useEffect guard + cursor end) |
| `TOMIS/.claude/tw-grid/decisions/MOD-GRID-05-decisions.md` | ADR-MOD-GRID-05-004 신설 |
| `TOMIS/.claude/tw-grid/state.json` | MOD-GRID-05 G-005 추가 (overallStatus: completed), totalGoals/completed 79→80 |
| `TOMIS/.claude/tw-grid/decisions/ID-LEDGER.md` | MOD-GRID-05 lastIssued G-004→G-005, 합계 행 갱신 |
| `topvel-grid-monorepo/.changeset/g-005-editable-initial-draft.md` | minor changeset 신설 |
| `TBIZONE/publish/.../organizeSchedule/page.tsx` | editingCell state `initialDraft?` 추가 + onKeyDown initialDraft capture + EditableCell C-29 spread |
| `TBIZONE/publish/.../organizeSchedule/page.tsx.phase-3-4-end.bak` | publish git 부재 — 수정 전 백업 |

---

## 구현 핵심

### EditableCell.tsx 변경

```typescript
// Before
const [draft, setDraft] = useState<string>(String(value ?? ''));
useEffect(() => {
  if (isEditing) {
    setDraft(String(value ?? ''));  // ← initialDraft 를 덮어씀
    inputRef.current?.focus();
  }
}, [isEditing, value]);

// After
const [draft, setDraft] = useState<string>(() => initialDraft ?? String(value ?? ''));
useEffect(() => {
  if (isEditing) {
    if (initialDraft === undefined) {
      setDraft(String(value ?? ''));  // initialDraft 있으면 건너뜀
    }
    const el = inputRef.current;
    if (el) {
      el.focus();
      if ('setSelectionRange' in el) {
        const len = (el as HTMLInputElement).value.length;
        (el as HTMLInputElement).setSelectionRange(len, len);
      }
    }
  }
}, [isEditing]);
```

### organizeSchedule page.tsx 변경

```typescript
// editingCell state — initialDraft 추가
const [editingCell, setEditingCell] = useState<
  { rowId: string; colId: string; initialDraft?: string } | null
>(null);

// enterEdit — initialDraft 인자 추가
const enterEdit = (initialDraft?: string) =>
  setEditingCell({ rowId: row.emplNo, colId, initialDraft });

// view-mode onKeyDown — isChar 시 ev.key 캡처
onKeyDown={(ev) => {
  const isChar = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
  if (isChar) {
    ev.preventDefault();
    enterEdit(ev.key);  // ★ 첫 char captured
  } else if (isDel) {
    enterEdit();
  } else if (isEnter) {
    ev.preventDefault();
    enterEdit();
  }
}}

// EditableCell — C-29 conditional spread
{...(editingCell?.initialDraft !== undefined
  ? { initialDraft: editingCell.initialDraft }
  : {})}
```

---

## probe 결과 (ADR-014 패턴)

- probe 파일: `src/__probe__/g-005-initial-draft.probe.tsx` — 생성 → typecheck PASS → 삭제
- `initialDraft?: string` optional prop: 타입 정합 확인
- `initialDraft="a"` 전달: 타입 수용 확인

---

## 검증

| 항목 | 결과 |
|------|------|
| `pnpm -F @tomis/grid-renderers typecheck` | **PASS** |
| `pnpm -F @tomis/grid-renderers build` | **success** — `dist/index.mjs` 15.87 KB |
| `pnpm -r typecheck` (14 packages) | **PASS** — regression 0 |
| publish organizeSchedule `npx tsc --noEmit \| grep organizeSchedule` | **empty (PASS)** — 0 errors |
| publish 전체 `npx tsc --noEmit` error count | **35** (pre-existing 18 unrelated files, 변화 없음) |
| 브라우저 manual 검증 | 미실행 — 사용자 영역 |

---

## 결과 체크리스트

- [x] EditableCell `initialDraft?: string` prop 추가
- [x] mount focus + value 초기화 (lazy useState + useEffect guard + cursor end)
- [x] C-29 conditional spread — `initialDraft` 전달 시 적용
- [x] ADR-MOD-GRID-05-004 신설 (decisions.md)
- [x] state.json MOD-GRID-05 G-005 added (completed)
- [x] ID-LEDGER MOD-GRID-05 lastIssued G-004→G-005
- [x] Changeset `g-005-editable-initial-draft.md` (minor)
- [x] organizeSchedule onKeyDown initialDraft capture + EditableCell 전달
- [x] organizeSchedule Phase 3.3 PARTIAL → **completed**
- [x] publish 백업 (`page.tsx.phase-3-4-end.bak`)
- [x] probe 삭제 완료 (ADR-014)

---

## 알려진 한계

| # | 한계 | 영향 |
|---|------|------|
| L-2a | **IME (한국어 조합입력)**: `ev.key` 가 composition 중 `'Process'` 또는 단일 자모. `compositionstart/update/end` 이벤트 별도 처리 필요. 본 cycle 범위 외. | 중 — 한국어 환경 첫 char 입력 시 조합 시작 이슈 가능 |
| L-1 | drag-range + abbreviation menu — DEFERRED (Phase 3.5, `@tomis/grid-pro-range` 패키지 부재) | 중 |
| L-4 | dev server manual 검증 미실행 (typecheck + source 확인까지) | 작음 |
| L-5 | Phase 4 visual regression 자동화 부재 | 작음 |
