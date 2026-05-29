# G-005 Specification — useChangeTracking hook 완전 통합: commitChanges + ChangeTrackingGrid alias + EditableGrid 흡수 + 사용처 마이그레이션

**Module**: MOD-GRID-10 (ChangeTracking + Mapping + Validator — Wijmo CollectionView 대체)
**Goal**: G-005 (마지막 Goal — 모듈 완료)
**Area**: tracking
**Phase**: wijmo-class (Pro 패키지 마지막 Goal — 사용처 마이그레이션 시작)
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (rubric high)
**spec 작성일**: 2026-05-15
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**라이선스 tier**: Pro (G-001 결정 cascade)
**선행 Goal**: G-001 (signature, 100), G-002 (changeMap + hook shell, 100), G-003 (buildChangeSet + mapping/validator, 100), G-004 (rowStatusStyle + undoRow + editedCells surface, 100)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 v1.0.6)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (TOMIS git 외부 — MOD-GRID-00 ADR-001). 본 spec 직전 (spec writer 첫 action) `goals.json` G-005 `implementFiles` 5 entry 의 `TOMIS/packages/` prefix → `topvel-grid-monorepo/packages/` 일괄 정정 적용 완료 (C-28 + G-01 v1.0.6 cascade). G-004 spec 의 동일 패턴 차단 cascade 안착 검증. | Section 7 + Section 8.1 | C-28 + G-001/G-002/G-003/G-004 D1 cascade + goals.json L378-383 정정 |
| D2 | G-005 변경 합계 = **11 파일** (NEW 1 + MODIFY 10). **monorepo** NEW 1 (`src/legacy/ChangeTrackingGrid.tsx` alias), MODIFY 6 (`src/useChangeTracking.ts` commitChanges+editedCells binding, `src/internal/changeMap.ts` editedCellsMap field+purge/populate, `src/types.ts` CommitOptions.optimistic 추가, `src/index.ts` barrel, `package.json` peerDeps, `EULA.md` cross-reference). **tw-framework-front** MODIFY 3 (`ChangeTrackingGrid.tsx`, `EditableGrid.tsx`, `pages/.../PayrollEditablePage.tsx`). **ADR** MODIFY 1 (`decisions/MOD-GRID-10-decisions.md` — ADR-008 추가). | Section 7 표 (11 행) + Section 11 Step 1~11 | goals.json G-005 implementFiles 5 (after D1 fix) + affectedUsageFiles 3 + types.ts/changeMap.ts/EULA.md 추가 (spec 권위) + ADR 1 |
| D3 | **사용처 마이그레이션 순서 (advisor 지적 — Old-API breakage 차단)**: Step 7 = PayrollEditablePage **commitChanges 추가 + 기존 ref API 유지** (additive only — gridRef.getChanges 분기 유지하며 hook 으로 commit 경로 추가). Step 5 = tw-framework-front `ChangeTrackingGrid.tsx` 는 **OLD shape (initialData/columns + ChangeTrackingHandle ref) 보존** 하되 내부 구현을 monorepo `useChangeTracking` 으로 교체 (compat shim 패턴 — advisor option (b)). Step 6 = EditableGrid 에 `enableChangeTracking?: boolean` prop additive. AC-003 의 NEW-shape (`{ data, rowKey, mapping?, ... }`) alias 는 **monorepo `src/legacy/ChangeTrackingGrid.tsx`** 가 책임 (별도 진입점 — NEW 코드만 사용). | Section 2.2 + Section 3 + Section 11.3 | advisor (a) vs (b) 분석 + AC-003 + AC-004 + ChangeTrackingGrid.tsx L1-238 Read + PayrollEditablePage.tsx L1-185 Read |
| D4 | `commitChanges(endpoint, options?)` 실 구현 시그니처 = G-001 types.ts L43-50 `CommitOptions` 그대로 (`method?`, `fetcher?`, `autoReset?`) + **신규** `optimistic?: boolean` 추가 (config.optimistic 가 default, options.optimistic override). flow 4 단계: ① `getChangeSet()` 호출 ② `fetcher(endpoint, { method, body: JSON.stringify(changeSet) })` 호출 ③ 성공 → autoReset=true 시 dispatch RESET ④ 실패(throw 또는 Promise rejection) → optimistic=true 시 dispatch RESET (rollback 시맨틱) + re-throw, optimistic=false 시 re-throw only. fetcher default = `globalThis.fetch`. | Section 2.1 + Section 6 EC-01~03 + Section 11.2 | G-001 types.ts L43-50 Read + G-002 reducer RESET action Read + advisor rollback semantics 명시 |
| D5 | **rollback 시맨틱 — public API 미노출, dispatch RESET 재활용**. 별도 `rollback()` public 메서드 추가 X (이유: API 표면 비대 — `resetChanges()` 가 같은 동작 이미 제공, optimistic 실패 시 commitChanges 가 자동 호출). 본 시맨틱 = **전체 변경 폐기** (preCommit snapshot 별도 보존 X — `resetChanges` 와 동일 효과). 다중 batch 부분 실패 시나리오는 G-005 범위 외 (호출자가 chunk 단위로 commitChanges 호출하여 batch 격리 가능 — F-99B 문서화 권장). | Section 2.1 + Section 6 EC-02 + advisor 응답 | advisor "rollback semantics" 분석 + G-002 changeMap.ts resetChangeMap L254-264 Read |
| D6 | **editedCells runtime wiring** (G-004 ADR-007 D9 deferred cascade). G-004 stub: `editedCellsMap = useMemo(() => new Map(), [])`. G-005 실구현 = (a) reducer state `ChangeMapState<TData>` 에 `editedCellsMap: Map<string, boolean>` field 추가 (changeMap.ts 의 createChangeMap initial + applyAdd/Update/Delete/Undo/Reset/Rebuild 모두 maintain), (b) `applyUpdate` 의 `patch: Partial<TData>` 의 모든 key 를 iterate 하여 `cellKey = key + '_' + columnId` 합성 후 `editedCellsMap.set(cellKey, true)` — **config.editedCells === true 시에만 추적** (성능 게이트), (c) `applyUndo`/'edited' branch + applyDelete(net-zero) + resetChangeMap 모두 해당 row 의 cellKey entry purge, (d) hook 의 `editedCellsMap = useMemo(() => state.editedCellsMap, [state])` 로 reducer state 와 동기. **columnId 가정**: TanStack `column.id ?? accessorKey` 컨벤션에서 `accessorKey === field name === Object.keys(patch)` 일치 (advisor 지적 — 명시화 EC-04). | Section 2.3 + Section 6 EC-04 + Section 11.2 | G-004 ADR-007 D9 + advisor "editedCells runtime wiring — columnId source" + changeMap.ts L35-41 + types.ts L99-101 + types.ts L146-148 |
| D7 | **`legacy/ChangeTrackingGrid.tsx` alias 시그니처 (NEW)** = `<ChangeTrackingGrid<TData> data, rowKey, mapping?, validator?, optimistic?, onSave?, ...GridProps<TData> />` (AC-003 verbatim). internally: `const tracking = useChangeTracking<TData>({ data, rowKey, mapping, validator, optimistic })` + `<Grid data={tracking.rows} {...rest} />` + `onSave?: (cs: ChangeSet) => void` 호출은 외부 책임 (alias 는 hook 노출만). Pro 패키지가 grid-core peer 사용 — D9 peerDep 추가. **JSX 반환**: TS strict + exactOptionalPropertyTypes 환경에서 `mapping/validator/optimistic` optional spread skip 패턴 (C-29). | Section 2.2 + Section 11.2 + Section 9 | AC-003 본문 + grid-core types.ts L253-258 GridProps Read + C-29 |
| D8 | **EditableGrid `enableChangeTracking?: boolean` prop additive (D7 advisor (b))**. 활성 시 EditableGrid 내부에서 `const tracking = useChangeTracking<TData>({ data: initialData, rowKey: ??? })` — **rowKey 가 EditableGrid 에 없으므로** 결정 필요. **rowKey 도 prop 으로 받기** = `rowKey?: keyof TData \| ((row: TData) => string)`. enableChangeTracking=true 인데 rowKey 미제공 → `console.warn` + tracking skip (graceful degradation). enableChangeTracking=false (기본) → 기존 동작 100% 보존 (C-6). EditableGrid `onDataChange` 콜백 → `enableChangeTracking=true` 시 `tracking.updateRow(key, { [colId]: value })` 도 동시 호출 (additive). | Section 2.4 + Section 11.2 + Section 11.3 Step 6 | AC-004 본문 + EditableGrid.tsx L1-202 Read + C-6 |
| D9 | **peerDependencies 정책 변경 (C-22 + ADR-008-02)**: `packages/grid-pro-tracking/package.json` peerDependencies 에 `@tomis/grid-core: workspace:*` 추가 (legacy/ChangeTrackingGrid.tsx 가 `Grid` import). `@tanstack/react-table`, `react`, `react-dom` 기존 peer 유지. `@tomis/grid-license` 는 본 G-005 범위 외 (MOD-GRID-99-A/G-002 완성 후 별도 wiring Goal — verifyOrWarn 은 여전히 internal stub). | Section 9 + Section 11.3 Step 3 + ADR-008 | C-22 + grid-core/package.json L31-36 peerDeps 예시 Read + G-001 ADR-003 (grid-license stub 전략) cascade |
| D10 | 번들 영향 = **+3 KB gzipped** (goals.json bundleImpact.expected). G-004 후 누적 ~5.57 KB brotli (G-004 harnessReview L327-334 인용) → G-005 후 누적 ~8.57 KB brotli (한도 20 KB 의 42.8%). C-21 충분. `.size-limit.json` 한도 변경 0. | Section 8.5 | goals.json bundleImpact.expected + G-004 harnessReview |
| D11 | **시각 회귀 검증 (C-17 — high tier 의무)** = Storybook 2 story (AC-009). Story #1 `commitChanges_fetcher` — mock fetcher mode (success → autoReset 검증 + failure + optimistic=true → rollback 검증). Story #2 `largeDataset_1000rows` — 1000행 + `@tanstack/react-virtual` 호환 검증 (C-18). 수동 스크린샷 비교: PayrollEditablePage.tsx 마이그레이션 전후 동일 데이터로 비교 메모 (Section 12) — additive only 이므로 외관 동일. | Section 12 + Section 13 F-03 + AC-009 | C-17 + C-18 + G-003 D9 (Storybook entry 추가 정책) cascade |
| D12 | **Storybook 파일 위치** = G-002/G-003/G-004 cascade — 기존 `src/__stories__/useChangeTracking.stories.tsx` 에 CSF3 entry 2개 추가 (별도 파일 X). G-003 D9 + G-004 동일 정책. Section 7 표 별도 행 미enumerate (production src 만 권위 표 enumerate). | Section 5 AC-009 + Section 12 | G-003 D9 cascade + G-004 spec 동일 정책 |
| D13 | **ADR-008 신설** (`decisions/MOD-GRID-10-decisions.md` MODIFY) — 본 G-005 의 4 결정 영역 통합 ADR. ADR-008-01: commitChanges flow + rollback 시맨틱 (D4+D5). ADR-008-02: peerDeps grid-core 추가 (D9). ADR-008-03: legacy alias 시그니처 + 사용처 마이그레이션 순서 (D3+D7+D8). ADR-008-04: editedCells runtime wiring (D6, ADR-007 D9 cascade 종결). 각 ADR sub-section 마다 대안 2개+ + trade-off (C-14). 또한 G-003 verify feedback (L235) 의 "ADR-006 Alt#3 cosmetic drift" 는 본 ADR-008 작업과 함께 cleanup 권장 — **본 Goal Section 7 표 #9 (decisions.md) MODIFY 작업의 일부로 fix** (out-of-scope 처리 X — 본문 Section 11.3 Step 9 명시). | Section 7 #9 + Section 11 Step 9 + ADR 본문 | C-14 + G-003 verify L235 cosmetic drift |

**D# breakdown cross-check (G-01 v1.0.6 — 합계/분류/이름 모두 일치)**:
- D2 명시 합계 **11 파일** = NEW 1 (`src/legacy/ChangeTrackingGrid.tsx`) + MODIFY 10 (`src/useChangeTracking.ts`, `src/internal/changeMap.ts`, `src/types.ts`, `src/index.ts`, `package.json`, `EULA.md`, `tw-framework-front ChangeTrackingGrid.tsx`, `EditableGrid.tsx`, `PayrollEditablePage.tsx`, `decisions/MOD-GRID-10-decisions.md`). Section 7 표 11 행 + Section 11.3 Step 1~11 enumerate 와 1:1 매칭.
- D3 마이그레이션 순서: Step 5 (tw-framework-front ChangeTrackingGrid OLD-shape compat) / Step 6 (EditableGrid additive prop) / Step 7 (PayrollEditablePage additive commitChanges) — Section 11.3 Step 표에 enumerate.
- D6 editedCells = changeMap.ts 의 reducer 변경 + useChangeTracking.ts hook 변경 둘 다 같은 파일 행 (Section 7 #1 + #2 같은 행) — 합계 9 변동 0.
- D12 Storybook = Section 7 표 별도 행 X (production src 만 권위 — G-002/G-003/G-004 동일 정책).
- D13 ADR-006 cosmetic drift fix = Section 7 #9 (decisions.md) MODIFY 작업 범위 — 별도 행 X.

**E-06 자가-검증 (Spec Truth Table Discipline + Prose ↔ Parallel Structured Form Semantic Cross-Check v1.0.7)**:
- 본 D# 표 + Section 7 표 + Section 11 Step 표 모두 9 파일 일치.
- 본문 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 grep 결과 0 hits (재결정 없음 — 첫 시도 spec).
- **v1.0.7 Prose ↔ Parallel cross-check (G-005 첫 적용 케이스)**: G-005 commitChanges flow 는 4 parallel form 으로 기술됨 — (1) Section 2.1 JSDoc prose, (2) Section 2.1 branch 표 (3 branches: success+autoReset / failure+optimistic / failure+!optimistic), (3) Section 11.2 BEFORE/AFTER executable code, (4) Section 6 EC-01/EC-02/EC-03 enumeration. spec writer 자가-검증 — Section 16 self-check 표에 4 form 각 branch operation 매트릭스 명시 (semantic enumerate not keyword grep). G-004 EC-03 prose vs D5/branch/code/EC-06 4-source 모순 패턴 재발 0건 목표.

---

## Section 1: 참조 추적

**(disclaimer — H-01 명확화)** 본 Section 1 표(L0/L1/L3/R-A/R-W)는 **기존(pre-IMPLEMENT) referenceEvidence 참조 자료**만 enumerate. 본 G-005 가 새로 *생성*하는 산출물(NEW: `src/legacy/ChangeTrackingGrid.tsx` / MODIFY: 8 파일 — Section 7 표 권위)은 Section 7 의 별도 권위 표(C-30)에서 관리됨. H-01 평가는 **본 Section 1 표의 참조 경로 실재** 만 대상.

### L0: 현 구현 (tw-framework-front — 영향 사용처 3건)

**파일 경로 + Read 확인 (2026-05-15)**:

| 파일 | Read 라인 | 핵심 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-238 (전체) | `forwardRef<ChangeTrackingHandle<TData>>` + `useImperativeHandle` ref API. props `{ initialData, columns, onRowClick?, loading?, emptyText?, className? }`. ROW_STATUS_COLORS L28-33 내부 상수 (G-004 `defaultRowStatusClassNames` 로 대체 가능, 본 Goal 에서 surgical) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | L1-202 (전체) | EditableGrid<TData> — `data`, `columns`, `onDataChange?`, `pagination?`, `loading?`, `emptyText?`, `className?`. 내부 useReactTable + editingCell state. C-29 spread skip 패턴 L78-82 이미 적용 |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | L1-185 (전체) | `ChangeTrackingGrid` ref 기반 사용 — L48 `gridRef = useRef<ChangeTrackingHandle<Record<string, unknown>>>(null)`, L71 `gridRef.current?.resetChanges()`, L87 `gridRef.current?.getChanges()`, L156 `gridRef.current?.addRow({ ...newRowDefaults })`. handleSave L86-105 은 for-loop service.insertData/updateData/deleteData |

**핵심 발췌 — 현 ChangeTrackingHandle<TData> (ChangeTrackingGrid.tsx L12-17)**:
```tsx
export interface ChangeTrackingHandle<TData> {
  getChanges: () => { added: TData[]; edited: TData[]; deleted: TData[] };
  resetChanges: () => void;
  addRow: (row: TData) => void;
  deleteRow: (rowIndex: number) => void;
}
```

**핵심 발췌 — 현 PayrollEditablePage handleSave (L86-105)**:
```tsx
const changes = gridRef.current?.getChanges();
if (!changes) return;
const { added, edited, deleted } = changes;
if (added.length + edited.length + deleted.length === 0) {
  showToast('error', '변경된 내용이 없습니다.'); return;
}
setSaving(true);
try {
  for (const row of added) await service.insertData(row);
  for (const row of edited) await service.updateData(row);
  for (const row of deleted) await service.deleteData(row);
  showToast('success', '저장되었습니다.');
  loadList();
} catch {
  showToast('error', '저장 중 오류가 발생했습니다.');
} finally {
  setSaving(false);
}
```

**G-005 마이그레이션 대상**: PayrollEditablePage handleSave 의 for-loop 을 `tracking.commitChanges('/api/...', { fetcher: customFetcher, optimistic: true })` 로 추가 (additive — 기존 ref API 유지 옵션). ChangeTrackingGrid 는 OLD-shape compat shim 으로 retain.

### L1: 자체 설계 (monorepo grid-pro-tracking — G-001~G-004 산출)

**파일 + Read 확인 (2026-05-15)**:

| 파일 | Read 라인 | 사용 |
|------|----------|------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | L1-149 (전체) | `ChangeTrackingConfig.optimistic?` L95, `editedCells?` L101, `CommitOptions` L43-50, `ChangeTrackingAPI.commitChanges` L145, `editedCellsMap: ReadonlyMap<string, boolean>` L148 (G-004 stub) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | L1-232 (전체) | G-002/G-003/G-004 산출. commitChanges stub L183-193 (Promise.reject), editedCellsMap stub L201, undoRow real L170-172, Action union L33-39 (5 actions, COMMIT/ROLLBACK 미존재) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | L1-410 (전체) | G-002/G-004 산출. `ChangeMapState<TData>` L35-41 (5 fields — editedCellsMap 미존재, G-005 추가) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | L1-23 (전체) | G-001/G-003/G-004 barrel. verifyOrWarn stub L14-17 (MOD-GRID-99-A defer 유지). ChangeTrackingGrid alias 미존재 L10-11 명시 (G-005 추가) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/package.json` | L1-32 (전체) | peerDeps L27-31: `@tanstack/react-table` + `react` + `react-dom`. **G-005: `@tomis/grid-core: workspace:*` 추가 (D9)** |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/EULA.md` | L1-26 (전체) | G-001 산출. L20 verifyOrWarn stub stage 언급. G-005 변경: ChangeTrackingGrid alias + commitChanges 운영 책임 1줄 추가 |

**자체 설계 핵심 (D4 + D5 + D6 + D7)**:
```
commitChanges flow (D4 — 4-step):
  1) const cs = getChangeSet()
  2) const result = await fetcher(endpoint, { method, body: JSON.stringify(cs), headers: { 'Content-Type': 'application/json' } })
  3) success → if (autoReset) dispatch({ type: 'RESET' }); return result
  4) failure → if (optimistic) dispatch({ type: 'RESET' }); throw error (in either case)

rollback (D5): not public — dispatch({ type: 'RESET' }) inside commitChanges' catch block (only when optimistic === true)

editedCellsMap (D6): added to ChangeMapState; populated by applyUpdate when config.editedCells === true; purged on undo/delete-added/reset

ChangeTrackingGrid alias (D7): NEW src/legacy/ChangeTrackingGrid.tsx — uses Grid (grid-core peer)
```

### L2: 신규 Pro 패키지 alias 영역

`@tomis/grid-pro-tracking` 의 G-004 까지 산출: `src/index.ts` + `src/types.ts` + `src/useChangeTracking.ts` + `src/buildChangeSet.ts` + `src/internal/{changeMap,applyMapping,runValidator,rowStatusStyle}.ts` + `src/__stories__/useChangeTracking.stories.tsx`. G-005 는 **신규 `src/legacy/ChangeTrackingGrid.tsx`** (Pro 패키지 내부 alias) + 4 MODIFY (useChangeTracking commitChanges+editedCells, index barrel, package.json peer, EULA cross-ref) + 3 사용처 MODIFY + 1 ADR MODIFY.

### L3: 영향 사용처 (3 파일 — L0 표와 동일, 본 G-005 가 처음 마이그레이션 시작)

| 파일 | G-005 변경 액션 |
|------|-----------------|
| `tw-framework-front/.../ChangeTrackingGrid.tsx` | OLD-shape compat shim — 내부 useState→useChangeTracking 교체. props 시그니처 보존 (initialData/columns/ref). ROW_STATUS_COLORS → `defaultRowStatusClassNames` 활용 (G-004 export) |
| `tw-framework-front/.../EditableGrid.tsx` | `enableChangeTracking?: boolean` + `rowKey?: keyof TData \| ((row: TData) => string)` prop 추가 (additive). enableChangeTracking=false (기본) 시 기존 동작 100% 보존 (C-6) |
| `tw-framework-front/.../pages/.../PayrollEditablePage.tsx` | handleSave 에 **commitChanges 경로 추가 (additive)** — 기존 ref API 유지하면서 새 fetcher 옵션 wiring (Section 11.2 BEFORE/AFTER) |

총 영향 사용처 **3 파일** (C-19 점진 ≤ 5 충족 — `affectedUsageFiles.length === 3`).

### R-A: AG Grid Server-side Row State (Enterprise) — 참조 (코드 차용 X)

`references/publish-aggrid-analysis.md` (Glob 확인). AG Grid Enterprise 의 Server-side Row State 우회 패턴 — 우리는 commit/rollback 자체 구현 (`globalThis.fetch` + dispatch RESET). 참조만, 코드 0건 (C-16 — Wijmo 만 절대지만 AG Grid도 C-7 보수 정책).

### R-W: Wijmo `useWijmoGridCrud` `addRow/removeCurrent/buildJson/save` 구조 — 참조 (코드 차용 X — C-16 절대)

**파일 + Read 확인 (2026-05-15)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` §1, §5 (G-001 spec L96-105 인용 cascade — 본 spec H-01 cross-check 시 동일 파일 확인).

핵심 차용 *개념* (코드 0):
- `addRow(seed)` → `tracking.addRow(seed)` (G-002 산출, G-005 그대로 활용)
- `removeCurrent()` → `tracking.deleteRow(key)` (G-002)
- `buildJson()` → `tracking.getChangeSet()` (G-003)
- `save(endpoint)` → `tracking.commitChanges(endpoint, options)` (**G-005 본 Goal 의 핵심 deliverable**)

**코드 차용 X (C-16)**: `@mescius/wijmo*` import 0건 의무 — AC-006.

---

## Section 2: API 계약 (TypeScript)

본 G-005 는 G-001 의 `commitChanges(endpoint, options?)` 시그니처를 그대로 유지하고 **본체 구현** + `legacy/ChangeTrackingGrid.tsx` alias + EditableGrid prop additive + PayrollEditablePage commitChanges wiring 추가.

### 2.1 `commitChanges` 실 구현 (D4 + D5)

**JSDoc prose** (`useChangeTracking.ts` 내 commitChanges 정의 위에 작성):
```ts
/**
 * Submit tracked changes to `endpoint` via `options.fetcher` (default
 * `globalThis.fetch`).
 *
 * Flow (D4):
 *   1. `getChangeSet()` produces the BE payload (mapping + validator applied).
 *   2. `fetcher(endpoint, { method, body: JSON.stringify(changeSet), headers: { 'Content-Type': 'application/json' } })`.
 *   3. On success — if `options.autoReset !== false` (default true), dispatch RESET.
 *      Return the fetcher's resolved value as `Promise<unknown>`.
 *   4. On failure (fetcher throws or returns rejecting promise) — if
 *      `options.optimistic ?? config.optimistic === true`, dispatch RESET
 *      (rollback). Re-throw the error in both optimistic and non-optimistic
 *      modes (caller decides toast / log strategy).
 *
 * Rollback semantics (D5): no separate public API; failure-optimistic
 * dispatches the same RESET action as `resetChanges()`. ALL tracked changes
 * are discarded — there is no per-batch pre-commit snapshot. Callers wishing
 * to isolate batches should chunk their changes across multiple
 * `commitChanges()` calls.
 *
 * @param endpoint URL to POST/PUT the change set to.
 * @param options  HTTP method, custom fetcher, autoReset, optimistic toggles.
 * @returns The fetcher's resolved value (caller-typed).
 */
```

**branch table (3 branches — semantic anchor for E-06 v1.0.7)**:

| Branch | preconditions | operations (in order) | EC# |
|--------|---------------|----------------------|-----|
| **B1 success + autoReset=true** | fetcher resolves; `(options.autoReset ?? true) === true` | (1) await fetcher → result; (2) `dispatch({type:'RESET'})`; (3) `return result` | EC-01 |
| **B2 failure + optimistic=true** | fetcher rejects or throws; `(options.optimistic ?? config.optimistic) === true` | (1) await fetcher → throws e; (2) `dispatch({type:'RESET'})` (rollback); (3) `throw e` (re-throw) | EC-02 |
| **B3 failure + optimistic=false** | fetcher rejects or throws; `optimistic` is `false`/undefined | (1) await fetcher → throws e; (2) `throw e` (re-throw — state intact) | EC-03 |

**B1 success + autoReset=false sub-branch**: same as B1 but skip step (2). 상태 잔존 — 사용자가 명시적으로 resetChanges 호출 의도. JSDoc 에 명시.

**signature (G-001 types.ts L43-50 + 추가 `optimistic` field)**:
```ts
// types.ts MODIFY (D4)
export interface CommitOptions {
  /** HTTP method. Default 'POST'. */
  method?: string;
  /** Custom fetcher (axios-compatible). Default globalThis.fetch. */
  fetcher?: (url: string, init?: RequestInit) => Promise<unknown>;
  /** Auto resetChanges on success. Default true. */
  autoReset?: boolean;
  /** Override config.optimistic for this single call. Default = config.optimistic. */
  optimistic?: boolean;
}
```

### 2.2 `legacy/ChangeTrackingGrid.tsx` alias (NEW — D7)

**시그니처 (AC-003 verbatim props)**:
```tsx
import { forwardRef, type ReactElement, type Ref } from 'react';
import { Grid, type GridHandle, type GridProps } from '@tomis/grid-core';
import type { ColumnDef } from '@tanstack/react-table';
import { useChangeTracking } from '../useChangeTracking';
import type {
  ChangeSet,
  ChangeTrackingAPI,
  ChangeTrackingConfig,
  Mapping,
  Validator,
} from '../types';

/**
 * Public alias — composes `useChangeTracking` + `<Grid>` (grid-core peer)
 * into a single declarative component. C-6 deprecation tier — preferred
 * replacement is the hook (`useChangeTracking`) + `<Grid>` directly.
 *
 * @template TData Row data type.
 */
export interface ChangeTrackingGridProps<TData>
  extends Omit<GridProps<TData>, 'data'> {
  /** Initial dataset (forwarded to `useChangeTracking`). */
  data: TData[];
  /** PK extractor for change tracking. */
  rowKey: keyof TData | ((row: TData) => string);
  /** Screen-to-BE mapping (optional). */
  mapping?: Mapping<TData>;
  /** Row validator (optional). */
  validator?: Validator<TData>;
  /** Optimistic update (auto-rollback on commit failure). */
  optimistic?: boolean;
  /** Toggle cell-level edit tracking. */
  editedCells?: boolean;
  /** Convenience callback — called with the latest ChangeSet whenever consumers
   * want to commit (alias does NOT auto-call commitChanges; that is caller
   * responsibility — keeps the alias's network policy explicit). */
  onSave?: (cs: ChangeSet) => void | Promise<void>;
}

function ChangeTrackingGridInner<TData>(
  props: ChangeTrackingGridProps<TData>,
  ref: Ref<GridHandle<TData> & ChangeTrackingAPI<TData>>,
): ReactElement;

declare const ChangeTrackingGrid: <TData>(
  props: ChangeTrackingGridProps<TData> & {
    ref?: Ref<GridHandle<TData> & ChangeTrackingAPI<TData>>;
  },
) => ReactElement;

export default ChangeTrackingGrid;
```

**구현 핵심**:
- internally builds `ChangeTrackingConfig<TData>` via **C-29 spread skip** pattern (4 optional fields — mapping/validator/optimistic/editedCells/onSnapshotInit):
  ```tsx
  const cfg: ChangeTrackingConfig<TData> = {
    data: props.data,
    rowKey: props.rowKey,
    ...(props.mapping !== undefined ? { mapping: props.mapping } : {}),
    ...(props.validator !== undefined ? { validator: props.validator } : {}),
    ...(props.optimistic !== undefined ? { optimistic: props.optimistic } : {}),
    ...(props.editedCells !== undefined ? { editedCells: props.editedCells } : {}),
  };
  const tracking = useChangeTracking<TData>(cfg);
  ```
- forwards `tracking.rows` as `<Grid data={tracking.rows} {...rest} />` (rest = `Omit<GridProps<TData>, 'data'>`).
- `onSave` 호출은 **외부 책임** — alias 는 hook + Grid 합성만 (alias 가 commit endpoint 결정 X — 명시성 우선).

### 2.3 `editedCells` runtime wiring (D6 — G-004 ADR-007 D9 cascade 종결)

**ChangeMapState<TData> 확장** (`changeMap.ts` MODIFY):
```ts
export interface ChangeMapState<TData> {
  statusMap: Map<string, RowStatus>;
  originalMap: Map<string, TData>;
  currentMap: Map<string, TData>;
  snapshotMap: Map<string, TData>;
  insertionOrder: string[];
  editedCellsMap: Map<string, boolean>;  // G-005 추가 — config.editedCells === true 시에만 populated
}
```

**`applyUpdate` 의 editedCells branch** (변경 — 기존 currentMap.set 후 추가):
```ts
// existing applyUpdate logic + …
const nextEditedCells = new Map(state.editedCellsMap);
if (trackEditedCells /* === config.editedCells, passed via action payload */) {
  for (const columnId of Object.keys(patch)) {
    nextEditedCells.set(`${key}_${columnId}`, true);
  }
}
return {
  …,
  editedCellsMap: nextEditedCells,
};
```

**Action payload extension** (`useChangeTracking.ts` MODIFY):
```ts
type Action<TData> =
  | { type: 'ADD'; seed: Partial<TData>; assignedKey: string; trackEditedCells: boolean }
  | { type: 'UPDATE'; key: string; patch: Partial<TData>; trackEditedCells: boolean }
  | { type: 'DELETE'; key: string }
  | { type: 'UNDO'; key: string }
  | { type: 'RESET' }
  | { type: 'REBUILD'; data: readonly TData[]; extractKey: (row: TData) => string };
```
hook 에서 `trackEditedCells: config.editedCells === true` 전달 (4 dispatch sites 갱신).

**purge rules**:
- applyUndo 'added' → 해당 row 의 모든 `${key}_*` entry purge
- applyUndo 'edited' → 같은 purge
- applyUndo 'deleted' → editedCellsMap 변경 0 (deleted 가 도달했다면 edited 흔적 이미 purge 된 상태가 아닐 수도 있음 — 안전을 위해 purge 권장)
- applyDelete 'added' (net-zero) → purge
- applyDelete 일반 → purge X (deleted 표시만)
- resetChangeMap → editedCellsMap = new Map()
- createChangeMap (initial / rebuild) → editedCellsMap = new Map()

**hook expose**:
```ts
const editedCellsMap = useMemo(() => state.editedCellsMap, [state.editedCellsMap]);
// (G-004 stub `useMemo(() => new Map(), [])` 교체 — types.ts 의 ReadonlyMap<string, boolean> 시그니처 그대로 충족)
```

**columnId 가정 (advisor 지적)**: TanStack `ColumnDef.id ?? accessorKey` 컨벤션 + `patch: Partial<TData>` 의 key 는 field name (= accessorKey). 따라서 cellKey = `${rowKey}_${accessorKey}`. 사용자가 `id` 를 명시 override 한 column 의 셀 추적은 accessorKey 기반 (limitation — JSDoc 명시 + EC-04). 이는 의도된 단순화 — 대안 (columnId 별도 추적 API) 은 G-005 범위 외 (`editedCells` 의 typed surface 가 string key 의 의미를 columnId 또는 accessorKey 어느 쪽으로도 해석 가능하도록 의도).

### 2.4 EditableGrid `enableChangeTracking?` + `rowKey?` (D8)

**signature change** (`EditableGrid.tsx` MODIFY):
```tsx
interface EditableGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  onDataChange?: (rowIndex: number, colId: string, value: unknown) => void;
  pagination?: GridPaginationOptions;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  // G-005 — additive:
  /** Enable change tracking. When true, internal useChangeTracking is activated.
   *  Requires `rowKey`. Default false — backward-compatible.
   */
  enableChangeTracking?: boolean;
  /** PK extractor — required if enableChangeTracking is true. */
  rowKey?: keyof TData | ((row: TData) => string);
}
```

**runtime behavior**:
```ts
// EditableGrid body — additive
const tracking = useChangeTracking<TData>(
  enableChangeTracking && rowKey
    ? { data: initialData, rowKey }
    : { data: [] as TData[], rowKey: (() => '') as (r: TData) => string },
);
// safety: when disabled, useChangeTracking still runs (Rules of Hooks) but with
// empty data; tracking.rows is empty and downstream paths are gated by
// `enableChangeTracking`.

const commitEdit = useCallback(
  (rowIndex: number, colId: string, newValue: string) => {
    setData(prev => { …existing setData logic… });
    onDataChange?.(rowIndex, colId, newValue);
    // G-005 — additive: notify tracking if enabled
    if (enableChangeTracking && rowKey) {
      const key = typeof rowKey === 'function' ? rowKey(data[rowIndex]) : String(data[rowIndex][rowKey]);
      tracking.updateRow(key, { [colId]: newValue } as Partial<TData>);
    }
    setEditingCell(null);
  },
  [onDataChange, enableChangeTracking, rowKey, data, tracking],
);
```

**guard rule**: enableChangeTracking=true + rowKey 미제공 → mount 시 `console.warn('[EditableGrid] enableChangeTracking=true requires rowKey — tracking disabled')` + tracking 동작 skip (graceful degradation — throw X — C-6).

### 2.5 export 경로

| 경로 | export |
|------|--------|
| `@tomis/grid-pro-tracking` (root barrel — `src/index.ts`) | `useChangeTracking`, `buildChangeSet`, `BuildChangeSetOptions`, `getRowStatusClassName`, `defaultRowStatusClassNames`, **G-005 추가: `ChangeTrackingGrid` (default + named) + `ChangeTrackingGridProps` 타입** |
| `@tomis/grid-pro-tracking/src/legacy/ChangeTrackingGrid.tsx` (NEW) | `default export ChangeTrackingGrid` + named `ChangeTrackingGridProps` |
| `@tomis/grid-pro-tracking/src/types.ts` (MODIFY) | 기존 + `CommitOptions.optimistic?` 추가 (D4) |

---

## Section 3: 기존 사용처 대응표 (★ D3 advisor 분석 기반)

| 사용처 | 변경 전 | 변경 후 (G-005) | 마이그레이션 액션 | Step |
|--------|--------|----------------|------------------|------|
| `tw-framework-front/.../ChangeTrackingGrid.tsx` (239줄, OLD forwardRef + useImperativeHandle) | 내부 `useState<TrackedRow<TData>[]>` + `ROW_STATUS_COLORS` 상수 + 자체 add/delete/getChanges 로직 (L46-92, L94-104) | **OLD-shape props/ref 보존** (`initialData/columns/ref` 시그니처 변경 0). 내부 구현만 `useChangeTracking` + `defaultRowStatusClassNames` (G-004 export) 로 교체. ChangeTrackingHandle 의 4 메서드 (`getChanges`/`resetChanges`/`addRow`/`deleteRow`) 가 hook API 위에서 동일 동작 보장 (특히 `deleteRow(visibleIndex)` — visibleIndex → rowKey 변환 internal 책임) | compat shim — TypeScript 시그니처 0 변경, 내부 로직 rewrite | Step 5 |
| `tw-framework-front/.../EditableGrid.tsx` (202줄) | `data/columns/onDataChange?/pagination?/loading?/emptyText?/className?` (7 props) | + `enableChangeTracking?: boolean` + `rowKey?: keyof TData \| ((row: TData) => string)` (additive only — 2 props 추가, 기존 7 props 시그니처 변경 0) | additive prop — enableChangeTracking=false 기본 → 기존 사용처 100% 호환 (C-6) | Step 6 |
| `tw-framework-front/.../pages/.../PayrollEditablePage.tsx` (185줄) | handleSave L86-105 for-loop service.insertData/updateData/deleteData (ref API) | **handleSave 에 commitChanges 경로 additive** — 기존 ref API 유지 (CompatChangeTrackingGrid 가 hook 위에서 동작하므로) 또는 hook 직접 사용 선택지. 본 spec 권장: handleSave 안 commitChanges 호출 추가 + service.* for-loop 은 fallback 으로 유지 (rollout safety) | additive new code path — 기존 path 보존 | Step 7 |

**모듈 완료 시점 (G-005 후)**: tw-framework-front ChangeTrackingGrid.tsx 와 PayrollEditablePage.tsx 둘 다 **breaking 0** — 외관 + 외부 시그니처 보존 100%. 신규 commitChanges 경로는 PayrollEditablePage 의 future-friendly 추가만.

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|-----|------|
| **Breaking change** | `false` (goals.json G-005 `compatibilityPolicy.breaking: false`) | additive only — 영향 사용처 3개 모두 외부 시그니처 보존 |
| **Deprecation 전략** | `ChangeTrackingGrid` (tw-framework-front 본체) 와 `ChangeTrackingGrid` (monorepo legacy alias) 각각 1 minor 유지 (C-23, C-6). G-005 후속 wiring Goal (예: MOD-GRID-99-A/G-002 license 실 통합) 까지 alias retain | C-23 + C-6 + goals.json L374 |
| **Migration path** | (a) 기존 사용처는 변경 0 (compat shim). (b) 신규 사용처는 `import { useChangeTracking } from '@tomis/grid-pro-tracking'` 또는 `import ChangeTrackingGrid from '@tomis/grid-pro-tracking/legacy/ChangeTrackingGrid'` (또는 root barrel) | goals.json L375 + D3 |
| **영향 사용처** | 3 파일 (C-19 점진 ≤ 5 충족 — Section 8.1) | goals.json `affectedUsageFiles` 3 entries |
| **점진 단계** | 본 G-005 = 단일 PR (3 사용처 모두 같은 commit, additive only, breaking 0). 다음 단계는 MOD-GRID-99-A/G-002 license 실 통합 (G-005 범위 외) | C-19 |
| **peerDependencies 정책 (D9 + C-22)** | `@tomis/grid-core: workspace:*` 추가. 기존 `@tanstack/react-table`/`react`/`react-dom` 유지. `@tomis/grid-license` 는 G-005 범위 외 (verifyOrWarn 여전히 stub) | C-22 + ADR-008-02 |
| **MOD-GRID-99-A 의존성** | G-005 시점에도 `@tomis/grid-license` placeholder 잔존 (`grid-license/src/index.ts` 가 stub) → verifyOrWarn 내부 stub 유지. G-005 가 license 통합 책임은 X (별도 wiring Goal — Section 13 F-02 명시) | G-001 ADR-003 cascade |

---

## Section 5: 인수 기준 (AC)

goals.json G-005 의 9 AC + 각 출처 태그 + Section 7 매핑.

| AC ID | criteria | source | 검증 방식 | Section 7 매칭 (binding) |
|-------|----------|--------|----------|----------------------|
| AC-001 | useChangeTracking hook 이 G-001~G-004 API 를 모두 통합 제공 — 단일 진입점 (TanStack 표준 API 기반 — C-2) | C-2 | `useChangeTracking.ts` Read + 12-member API enumerate (addRow/updateRow/deleteRow/undoRow/hasChanges/getChangeSet/resetChanges/commitChanges + rows/added/edited/deleted + editedCellsMap) | `src/useChangeTracking.ts` (MODIFY) |
| AC-002 | `commitChanges(endpoint, options?)` — fetch 기본 + `options.fetcher` 주입 (axios 호환). `optimistic: true` 시 에러 자동 rollback (D5 dispatch RESET) | L1 | `useChangeTracking.ts` Grep `commitChanges` + branch table 3 case 매칭 (Section 2.1) | `src/useChangeTracking.ts` (MODIFY) |
| AC-003 | ChangeTrackingGrid alias export — props: `{ data, rowKey, mapping?, validator?, onSave?, ...GridProps }` (C-6 호환, C-23 1 minor deprecation) | C-6 | `src/legacy/ChangeTrackingGrid.tsx` Read + `props` interface 6 fields 매칭 + `export default` 확인 + root barrel re-export 확인 | `src/legacy/ChangeTrackingGrid.tsx` (NEW), `src/index.ts` (MODIFY) |
| AC-004 | EditableGrid.tsx `enableChangeTracking` prop 받으면 내부 useChangeTracking 자동 활성. 기존 EditableGrid 동작 보존 (C-6) | C-6 | `EditableGrid.tsx` Read + `enableChangeTracking` + `rowKey` prop 시그니처 + 기존 7 props 보존 확인 | `tw-framework-front/.../EditableGrid.tsx` (MODIFY) |
| AC-005 | Pro 패키지: import 시 grid-license 검증 호출 (MOD-GRID-99-A/F-99A-03). 라이선스 미등록 → console.warn + 워터마크 (block X). C-24 | C-24 | `src/index.ts` Read + verifyOrWarn 호출 1회 (G-001 산출 보존, stub 유지). G-005 범위에서 verifyOrWarn 의 실 구현 도입은 X (MOD-GRID-99-A/G-002 책임) — Section 13 F-02 분리 명시 | `src/index.ts` (G-005 MODIFY는 ChangeTrackingGrid export 추가만 — verifyOrWarn stub 보존) |
| AC-006 | `@mescius/wijmo*` import 0건 (C-16). publish/wijmo-grid/useWijmoGridCrud.ts 구조 학습만 (R-W 인용) | C-16 | `packages/grid-pro-tracking/src/**` + `tw-framework-front/src/components/tomis/Grid/**` Grep `@mescius/wijmo` 0 hits | 모든 NEW/MODIFY 파일 |
| AC-007 | C-10/C-18: 가상화 활성 시 (`enableVirtualization=true`) hook 과 row 목록 갱신 호환 — react-virtual 재렌더 정합성 | C-18 | `legacy/ChangeTrackingGrid.tsx` 가 `<Grid>` 사용 → grid-core 의 `enableVirtualization` (MOD-GRID-01/G-004 산출) 자동 호환. Storybook 1000행 story (D11) 로 검증 | `src/legacy/ChangeTrackingGrid.tsx` (NEW) + Storybook story #2 |
| AC-008 | C-12: `tsc --noEmit` 0 error (`packages/grid-pro-tracking` + `tw-framework-front`) | C-12 | `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 + `cd tw-framework-front && pnpm tsc --noEmit` exit 0 (또는 vite build) | 전체 |
| AC-009 | C-25: Storybook story 2개 — (a) commitChanges 저장 플로우 (mock fetcher → success + autoReset + failure + optimistic rollback), (b) 1000행+ 낙관적 업데이트 + 에러 롤백 (C-18 대용량) | C-25 | `src/__stories__/useChangeTracking.stories.tsx` 에 CSF3 entry 2개 추가 (G-003 D9 cascade — 별도 파일 X) | (D12 — 별도 행 미enumerate) |

**E-01 binding cross-check (rubric v1.0.6)**:
- AC-001 ~ AC-009 모두 source 태그 + Section 7 매칭 / 또는 deferred 사유 (AC-005 verifyOrWarn 실 통합 = G-005 외 책임) 명시.
- AC-009 Storybook 2 story → D12 정책으로 Section 7 표 미enumerate (G-002/G-003/G-004 동일 정책).

---

## Section 6: 엣지 케이스 (최소 5 — 본 spec 7건)

| EC# | 케이스 | 기대 동작 | 참조 |
|-----|--------|----------|------|
| **EC-01** | commitChanges 성공 + `autoReset` 미지정 (기본 true) | (1) fetcher resolves → result; (2) `dispatch({type:'RESET'})` (G-002 RESET action 재활용 — statusMap clear + originalMap clear + insertionOrder reset + editedCellsMap clear); (3) `return result`. `tracking.hasChanges() === false` post-call | D4 Branch B1 |
| **EC-02** | commitChanges 실패 (4xx/5xx 또는 network throw) + `optimistic=true` | (1) await fetcher → throws e; (2) `dispatch({type:'RESET'})` (rollback — D5: ALL tracked changes discarded, **per-batch isolation 없음**); (3) `throw e` (re-throw — caller toast/log 책임) | D4 Branch B2 + D5 |
| **EC-03** | commitChanges 실패 + `optimistic=false` (또는 undefined, config.optimistic false) | (1) await fetcher → throws e; (2) `throw e` (re-throw only — state 변경 0 — added/edited/deleted 잔존, 사용자가 수동 fix 후 재시도 가능) | D4 Branch B3 |
| **EC-04** | `editedCells=true` + `updateRow(key, { name: '이순신', salary: 5000 })` (patch keys 2개) | applyUpdate reducer: patch keys iterate → `editedCellsMap.set('${key}_name', true)` + `editedCellsMap.set('${key}_salary', true)`. **columnId 가정 명시**: TanStack `ColumnDef.id ?? accessorKey` 컨벤션에서 `accessorKey === field name === patch key`. `id` override 시 cellKey 는 accessorKey 기반 (limitation — JSDoc 명시) | D6 + advisor 지적 |
| **EC-05** | 1000행 dataset + 가상화 활성 + commitChanges 호출 | `getChangeSet()` 가 statusMap.size N (≤ 1000) 만 iterate (변경된 행만 — full scan X). fetcher → 정합성 유지. Storybook story #2 (D11) 가 검증. `@tanstack/react-virtual` estimateSize / getScrollElement 호환 — `legacy/ChangeTrackingGrid.tsx` 가 `<Grid>` 위임으로 자동 보장 | C-18 + D11 |
| **EC-06** | `legacy/ChangeTrackingGrid` alias 와 직접 `useChangeTracking` 호출 결과 동일 | alias 는 hook 의 thin wrapper — `tracking.added/edited/deleted/rows/getChangeSet()/commitChanges()` 모두 동일 reactive 객체. AC-001 산식: alias 통한 호출 path 와 hook 직접 호출 path 의 state-projection 동등 (`materialize(state)` 1회 호출 — `useMemo([state])` cache) | D7 |
| **EC-07** | EditableGrid + `enableChangeTracking=false` (기본) | tracking 가 internal 에 mount 되더라도 (Rules of Hooks 의무) `enableChangeTracking=false` 이면 `commitEdit` 가 `tracking.updateRow` 호출 skip. 기존 동작 100% 보존 — `onDataChange` callback 만 동작 (C-6) | D8 + AC-004 |

**EC ↔ branch table cross-reference (E-06 v1.0.7)**: EC-01 ↔ B1, EC-02 ↔ B2, EC-03 ↔ B3. 4 source (prose + branch + code + EC) 의미 매트릭스 — Section 16 self-check 표에 enumerate.

---

## Section 7: 구현 대상 파일 (NEW/MODIFY) — 최종 implementFiles (authoritative)

D2 + D3 + D13 결정에 따라 본 표가 **유일한 권위적 변경 파일 정의** (C-30 의무). G-005 범위 내 모든 NEW/MODIFY 파일.

| # | 경로 | NEW/MODIFY | 변경 범위 | AC 매칭 | D# |
|---|------|----------|---------|---------|-----|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | MODIFY | (a) commitChanges 실 구현 (Promise.reject 제거 — D4 4-step flow), (b) editedCellsMap runtime wiring (G-004 stub `useMemo(() => new Map(), [])` 교체 — `useMemo(() => state.editedCellsMap, [state.editedCellsMap])` D6), (c) Action union 의 ADD/UPDATE payload 에 `trackEditedCells: boolean` 추가 (D6 reducer-level 전달) | AC-001, AC-002 | D4, D5, D6 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | MODIFY | `ChangeMapState<TData>` 에 `editedCellsMap: Map<string, boolean>` field 추가 + `createChangeMap`/`applyAdd`/`applyUpdate`/`applyDelete`/`applyUndo`/`resetChangeMap` 모두 editedCellsMap maintain (purge/populate per D6 rules) | AC-001 (editedCells wiring), AC-007 | D6 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/legacy/ChangeTrackingGrid.tsx` | **NEW** | AC-003 alias 시그니처 (`{ data, rowKey, mapping?, validator?, optimistic?, editedCells?, onSave?, ...GridProps<TData> }`) — internally useChangeTracking + `<Grid>` + C-29 conditional spread for 5 optional fields | AC-003, AC-007 | D7 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | MODIFY | (a) `ChangeTrackingGrid` (default + named) re-export from `./legacy/ChangeTrackingGrid` (b) `ChangeTrackingGridProps` 타입 re-export. verifyOrWarn stub 호출은 보존 (AC-005 — MOD-GRID-99-A 외 책임) | AC-003 | D7 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | MODIFY | `CommitOptions` 에 `optimistic?: boolean` field 추가 (D4 — config.optimistic override) | AC-002 | D4 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/package.json` | MODIFY | peerDependencies 에 `@tomis/grid-core: "workspace:*"` 추가 (D9, C-22, ADR-008-02). 기존 3 peers (`@tanstack/react-table`, `react`, `react-dom`) 보존 | AC-007 | D9 |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/EULA.md` | MODIFY | 1줄 추가 — ChangeTrackingGrid alias + commitChanges 의 license verifier (verifyOrWarn) 호출이 G-005 시점에도 stub 유지 (MOD-GRID-99-A/G-002 cross-reference 갱신). 본문 ~26 lines → ~30 lines | AC-005 | (D5 cascade) |
| 8 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | MODIFY | OLD-shape props/ref 시그니처 보존. 내부 구현만 — useState/useImperativeHandle → useChangeTracking + ROW_STATUS_COLORS → defaultRowStatusClassNames (G-004 export). 4 ChangeTrackingHandle 메서드 (getChanges/resetChanges/addRow/deleteRow) compat layer | AC-004 (간접 — compat shim), AC-008 | D3 |
| 9 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | MODIFY | additive `enableChangeTracking?: boolean` + `rowKey?: keyof TData \| ((row: TData) => string)` props + commitEdit 안 tracking.updateRow 호출 (enableChangeTracking 가드) | AC-004 | D8 |
| 10 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | MODIFY | handleSave 에 commitChanges 경로 additive — gridRef.commitChanges 호출 (compat shim 이 ChangeTrackingHandle 에 추가 expose 하거나 페이지가 hook 직접 사용 — 본 spec 선호: handleSave 안 `await gridRef.current?.commitChanges?.('/api/payroll/batch', { method:'POST', fetcher: customFetcher, optimistic: true })`) | AC-002, AC-004 | D3 |
| 11 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` | MODIFY | **ADR-008 신설** (4 sub-sections — D4+D5, D9, D3+D7+D8, D6 cascade 종결). 또한 ADR-006 Alt#3 cosmetic drift fix (G-003 verify L235) — 본 MODIFY 작업 범위 (별도 행 X) | AC-007 (ADR 의무) | D13 |

**합계**: 1 NEW + 10 MODIFY = **11 행** — D2 명시 합계 (자가-수정 후 "11 파일") 와 일치.

**Section 11 Step 1~11 enumerate 와의 cross-check (E-01)**: 위 11 행 모두 Section 11 Step 별로 1:1 매칭 (Step 1 = #2 changeMap.ts, Step 2 = #1+#5 useChangeTracking+types, Step 3 = #3 legacy alias, Step 4 = #6 package.json, Step 5 = #4 index.ts, Step 6 = #8 tw-framework-front ChangeTrackingGrid, Step 7 = #9 EditableGrid, Step 8 = #10 PayrollEditablePage, Step 9 = #7 EULA, Step 10 = (Storybook — D12 별도 행 X), Step 11 = #11 ADR).

**E-06 자가-검증 (Spec Truth Table Discipline)**: D# 표 D2 본문 (NEW 1 + MODIFY 10 = 11 파일) ↔ 본 Section 7 표 11 행 일치. 본문에 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 grep 결과 0 hits (첫 시도 spec — 재결정 없음).

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트 + 파일 목록

| # | 파일 | 마이그레이션 액션 (G-005) |
|---|------|---------------------------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | 내부 구현 rewrite (OLD shape 보존 — Section 7 #8) |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | additive props (Section 7 #9) |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | additive commitChanges (Section 7 #10) |

**총 3 파일** (C-19 점진 ≤ 5 충족 — `affectedUsageFiles.length === 3`).

### 8.2 무파괴 검증 방법

- **타입 검증**: `pnpm --filter @tomis/grid-pro-tracking typecheck` exit 0 (C-12) + tw-framework-front vite build / tsc --noEmit exit 0
- **빌드 검증**: `pnpm --filter @tomis/grid-pro-tracking build` exit 0 (tsup CJS+ESM dual) + tw-framework-front `pnpm build` exit 0
- **시각 회귀 (C-17 — high tier 의무)**: Storybook 2 story (D11) + PayrollEditablePage 마이그레이션 전후 동일 데이터로 manual screenshot 비교 (additive only — 외관 변경 0 기대)
- **번들 한도 (C-21)**: size-limit ≤ 20 KB gzipped per Pro 패키지 (D10 — 예상 ~8.57 KB 누적 brotli)
- **C-17 high tier 적용**: migrationImpact=high + 영향 사용처 3 → C-17 의무 발동. Storybook 2 + manual diff 메모 둘 다 의무.

### 8.3 점진 단계

- 1단계 (G-001~G-004): hook 본체 + helpers + 시각 마커 → 패키지 빌드 완료 (G-004 verify 100)
- **2단계 (본 G-005)**: 사용처 3 파일 마이그레이션 + alias + commitChanges (단일 PR — C-19 ≤ 5 충족)
- 3단계 (후속 wiring Goal — G-005 범위 외): MOD-GRID-99-A/G-002 license 실 통합 → grid-pro-tracking 의 verifyOrWarn 실 호출 + grid-license peer 추가

### 8.4 롤백 전략

- **deprecated alias 1 minor 유지** (D3): tw-framework-front ChangeTrackingGrid.tsx 와 monorepo legacy alias 둘 다 시그니처 보존 → 사용처 코드 변경 없이 패키지 dist/ 만 roll-back 가능
- G-005 자체 롤백: monorepo legacy/ChangeTrackingGrid.tsx 삭제 + useChangeTracking commitChanges/editedCells 변경 revert + tw-framework-front 3 파일 git revert. 영향 사용처 동작 0 변화 (compat shim 으로 외관 보존)
- `@tomis/grid-core` peer 추가 revert: grid-pro-tracking package.json 에서 grid-core peer 제거 (legacy alias 동시 제거 시 peer 미사용 → safe)

### 8.5 번들 영향

- **+3 KB gzipped** (goals.json L390-394 `bundleImpact.expected: "+3 KB"`)
- 누적: G-004 후 ~5.57 KB brotli (G-004 harnessReview L334) → **G-005 후 ~8.57 KB brotli** (한도 20 KB 의 42.8%)
- 한도: ≤ 20 KB per Pro 패키지 (C-21) — 충분 여유. `.size-limit.json` 변경 0.
- legacy alias 가 grid-core peer import — peer 는 bundle 에 포함 X (peerDeps 정책 — C-22), grid-pro-tracking dist/ 크기에 grid-core 포함 안 됨.

---

## Section 9: 의존성

### peerDependencies 변경 (D9 + ADR-008-02)

```jsonc
{
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "@tomis/grid-core": "workspace:*",     // ← G-005 신규 추가 (D9)
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

**근거**: legacy/ChangeTrackingGrid.tsx 가 `import { Grid, type GridProps, type GridHandle } from '@tomis/grid-core'` 사용. grid-core peer 미선언 시 monorepo workspace 외 환경에서 type 해석 실패 + bundle duplicate 위험 (C-22).

### dependencies

**없음** — 본 G-005 도 zero-runtime dep 유지 (Pro 패키지 정책 C-21).

### devDependencies

기존 (monorepo root hoist): `tsup`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`. 변경 0.

### MOD-GRID-99-A 의존성

`@tomis/grid-license` 가 G-005 시점에도 placeholder (G-001 ADR-003 cascade — `grid-license/src/index.ts` 가 stub). 본 G-005 도 verifyOrWarn internal stub 유지 (G-005 범위 외 — MOD-GRID-99-A/G-002 책임). Section 13 F-02 + ADR-008-02 명시.

---

## Section 10: 사용자 여정 매핑

### 개발자 (페이지 작성자) — NEW 경로

1. `import { useChangeTracking, ChangeTrackingGrid } from '@tomis/grid-pro-tracking'` (또는 `@tomis/grid-pro-tracking/src/legacy/ChangeTrackingGrid`)
2. **옵션 A — hook 직접**: `const tracking = useChangeTracking<Row>({ data, rowKey: 'empId', mapping, validator, optimistic: true })` + `<Grid data={tracking.rows} columns={columns} />` + `<button onClick={() => tracking.commitChanges('/api/...')}>저장</button>`
3. **옵션 B — alias**: `<ChangeTrackingGrid data={rows} rowKey="empId" mapping={…} validator={…} columns={…} onSave={…} />` (alias 가 hook + Grid 합성)
4. **옵션 C — EditableGrid 통합**: `<EditableGrid data={rows} columns={…} enableChangeTracking rowKey="empId" />` — internally hook 활성, commitEdit 시 tracking.updateRow 자동 호출

### 개발자 (페이지 작성자) — 기존 경로 (compat — D3)

1. `import ChangeTrackingGrid, { ChangeTrackingHandle } from '@/components/tomis/Grid/ChangeTrackingGrid'` (tw-framework-front 본체 — 시그니처 동일)
2. `<ChangeTrackingGrid ref={gridRef} initialData={dataList} columns={columns} loading={loading} />` (외부 시그니처 변경 0)
3. `gridRef.current?.addRow(row)` / `getChanges()` / `resetChanges()` (compat shim 내부에서 hook 으로 변환)

### 최종 사용자 (그리드 사용자)

- G-005 단계: 사용자 변화 0 (additive — 마이그레이션 전후 외관 동일). PayrollEditablePage 의 저장 버튼 → 기존 service.* for-loop 또는 commitChanges fetcher 둘 다 동작 (페이지 author 가 선택)
- G-005 후속 단계 (다른 페이지 도입 시): added/edited/deleted 시각 마커 (G-004 산출) + per-row undo (G-004 산출)

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세

Section 7 표와 1:1 매칭 (E-01 cross-check 충족). 모든 11 행이 Section 11.3 Step 1~11 에 enumerate.

### 11.2 Before/After 코드 스니펫 (최소 1 — 본 spec 3개: commitChanges + editedCells + PayrollEditablePage)

#### 11.2-A: commitChanges stub → 실 구현 (Section 7 #1)

**BEFORE** (`useChangeTracking.ts` L183-193):
```ts
// G-005 implements commit. Stub returns a rejected promise.
const commitChanges = useCallback(
  /* eslint-disable @typescript-eslint/no-unused-vars */
  (_endpoint: string, _options?: CommitOptions): Promise<unknown> =>
    Promise.reject(
      new Error(
        'useChangeTracking.commitChanges: implemented in MOD-GRID-10/G-005',
      ),
    ),
  /* eslint-enable @typescript-eslint/no-unused-vars */
  [],
);
```

**AFTER** (G-005 D4 + D5):
```ts
const commitChanges = useCallback(
  async (endpoint: string, options?: CommitOptions): Promise<unknown> => {
    const method = options?.method ?? 'POST';
    const fetcher = options?.fetcher ?? ((url, init) => globalThis.fetch(url, init).then(r => {
      if (!r.ok) throw new Error(`commitChanges failed: ${r.status} ${r.statusText}`);
      return r.json();
    }));
    const autoReset = options?.autoReset ?? true;
    const optimistic = options?.optimistic ?? config.optimistic ?? false;

    const cs = getChangeSet();

    try {
      const result = await fetcher(endpoint, {
        method,
        body: JSON.stringify(cs),
        headers: { 'Content-Type': 'application/json' },
      });
      if (autoReset) {
        dispatch({ type: 'RESET' });
      }
      return result;
    } catch (e) {
      if (optimistic) {
        dispatch({ type: 'RESET' });
      }
      throw e;
    }
  },
  [config.optimistic, getChangeSet],
);
```

#### 11.2-B: editedCellsMap stub → reducer state binding (Section 7 #1 + #2)

**BEFORE** (`useChangeTracking.ts` L199-201):
```ts
// G-004 — editedCellsMap typed surface stub. G-005 wires the real data.
// Always returns an empty Map; editedCells config wiring is deferred to G-005.
const editedCellsMap = useMemo(() => new Map<string, boolean>(), []);
```

**AFTER** (G-005 D6):
```ts
// G-005 — editedCellsMap mirrors reducer state.editedCellsMap.
// Population/purge logic lives in changeMap.ts (applyAdd/applyUpdate/applyDelete/
// applyUndo/resetChangeMap/createChangeMap). config.editedCells === true gates
// population at dispatch sites (Action union extension).
const editedCellsMap = useMemo<ReadonlyMap<string, boolean>>(
  () => state.editedCellsMap,
  [state.editedCellsMap],
);
```

**changeMap.ts `applyUpdate` 변경 (Section 7 #2 — D6)**:
```ts
export function applyUpdate<TData>(
  state: ChangeMapState<TData>,
  key: string,
  patch: Partial<TData>,
  trackEditedCells: boolean = false,   // G-005 추가
): ChangeMapState<TData> {
  // … existing logic …
  nextCurrent.set(key, { ...existing, ...patch });

  // G-005 — D6 editedCells runtime wiring
  let nextEditedCells = state.editedCellsMap;
  if (trackEditedCells) {
    nextEditedCells = new Map(state.editedCellsMap);
    for (const columnId of Object.keys(patch)) {
      nextEditedCells.set(`${key}_${columnId}`, true);
    }
  }

  return {
    statusMap: nextStatus,
    originalMap: nextOriginal,
    currentMap: nextCurrent,
    snapshotMap: state.snapshotMap,
    insertionOrder: state.insertionOrder,
    editedCellsMap: nextEditedCells,
  };
}
```

#### 11.2-C: PayrollEditablePage handleSave additive (Section 7 #10)

**BEFORE** (`PayrollEditablePage.tsx` L86-105):
```tsx
const handleSave = useCallback(async () => {
  const changes = gridRef.current?.getChanges();
  if (!changes) return;
  const { added, edited, deleted } = changes;
  if (added.length + edited.length + deleted.length === 0) {
    showToast('error', '변경된 내용이 없습니다.'); return;
  }
  setSaving(true);
  try {
    for (const row of added) await service.insertData(row);
    for (const row of edited) await service.updateData(row);
    for (const row of deleted) await service.deleteData(row);
    showToast('success', '저장되었습니다.');
    loadList();
  } catch {
    showToast('error', '저장 중 오류가 발생했습니다.');
  } finally {
    setSaving(false);
  }
}, [service, loadList]);
```

**AFTER** (G-005 — additive commitChanges 경로. 기본은 새 경로, fallback 으로 service.* for-loop 유지):
```tsx
const handleSave = useCallback(async () => {
  const changes = gridRef.current?.getChanges();
  if (!changes) return;
  const { added, edited, deleted } = changes;
  if (added.length + edited.length + deleted.length === 0) {
    showToast('error', '변경된 내용이 없습니다.'); return;
  }
  setSaving(true);
  try {
    // G-005 — commitChanges 경로 우선 시도 (compat shim 이 ChangeTrackingHandle 확장)
    if (typeof gridRef.current?.commitChanges === 'function') {
      await gridRef.current.commitChanges('/api/payroll/batch', {
        method: 'POST',
        fetcher: async (url, init) => {
          // service helper 가 token / multitenant URL 처리 — 그대로 위임
          return service.commitBatch(url, init);
        },
        optimistic: true,
      });
    } else {
      // legacy fallback (compat shim 도입 직전 환경)
      for (const row of added) await service.insertData(row);
      for (const row of edited) await service.updateData(row);
      for (const row of deleted) await service.deleteData(row);
    }
    showToast('success', '저장되었습니다.');
    loadList();
  } catch {
    showToast('error', '저장 중 오류가 발생했습니다.');
  } finally {
    setSaving(false);
  }
}, [service, loadList]);
```

**※ note**: PayrollEditablePage 의 `ChangeTrackingHandle` 확장 (`commitChanges?`) 은 tw-framework-front ChangeTrackingGrid 의 compat shim 책임 — Section 7 #8 의 D3 본문에 추가 expose 명시. `service.commitBatch` helper 는 payroll service 측 신규 method (페이지 author 책임 — 본 spec 은 G-005 범위 내 wiring 까지 — service 신규 method 추가는 IMPLEMENT 단계에서 결정, 본 spec 은 시그니처 가이드만).

### 11.3 구현 순서 (11 단계 — 의존성 고려)

| Step | 작업 | Section 7 행 | 검증 |
|------|------|--------------|------|
| **Step 1** | `changeMap.ts` MODIFY — `ChangeMapState.editedCellsMap` field 추가 + 6 helper (create/Add/Update/Delete/Undo/Reset/Rebuild) 모두 editedCellsMap maintain (D6 purge/populate) | #2 | tsc 0 + helper unit test (vitest 미설정 → integration via Storybook D11) |
| **Step 2** | `useChangeTracking.ts` MODIFY — commitChanges 실 구현 (D4) + editedCellsMap state binding (D6) + Action union 의 ADD/UPDATE 에 `trackEditedCells` payload 추가 + `types.ts` MODIFY (`CommitOptions.optimistic?` 추가 — D4) | #1 + #5 | tsc 0 + Grep `Promise.reject` 0 hits |
| **Step 3** | `src/legacy/ChangeTrackingGrid.tsx` NEW — D7 alias 시그니처 + internal hook+Grid 합성 + C-29 spread skip pattern (5 optional fields) | #3 | tsc 0 + `export default` 확인 + props interface 6 field 매칭 |
| **Step 4** | `package.json` MODIFY — peerDependencies 에 `@tomis/grid-core: "workspace:*"` 추가 (D9) | #6 | `pnpm install` 성공 + workspace link 검증 |
| **Step 5** | `src/index.ts` MODIFY — ChangeTrackingGrid + ChangeTrackingGridProps re-export 추가 | #4 | tsc 0 + `import { ChangeTrackingGrid } from '@tomis/grid-pro-tracking'` 가능 |
| **Step 6** | `tw-framework-front/.../ChangeTrackingGrid.tsx` MODIFY — OLD-shape compat shim (D3) + ChangeTrackingHandle 에 `commitChanges?(endpoint, options): Promise<unknown>` expose 추가 | #8 | tsc 0 + 기존 props/ref API 보존 검증 |
| **Step 7** | `tw-framework-front/.../EditableGrid.tsx` MODIFY — `enableChangeTracking?` + `rowKey?` additive props (D8) | #9 | tsc 0 + 기존 7 props 시그니처 보존 검증 + `enableChangeTracking=false` 기본 동작 보존 |
| **Step 8** | `tw-framework-front/.../PayrollEditablePage.tsx` MODIFY — handleSave commitChanges 경로 additive (Section 11.2-C) | #10 | tsc 0 + 기존 service.* for-loop fallback 보존 |
| **Step 9** | `EULA.md` MODIFY — verifyOrWarn stub stage cross-reference 1줄 갱신 (AC-005 — MOD-GRID-99-A 외 책임 명시) | #7 | Read 확인 |
| **Step 10** | `src/__stories__/useChangeTracking.stories.tsx` MODIFY — CSF3 entry 2개 추가 (D11+D12 — commitChanges_fetcher + largeDataset_1000rows) | (D12 별도 행 X) | Storybook build 성공 + 2 stories 등록 확인 |
| **Step 11** | `decisions/MOD-GRID-10-decisions.md` MODIFY — ADR-008 신설 (4 sub-sections — D4/D5+D9+D3/D7/D8+D6) + G-003 verify L235 ADR-006 Alt#3 cosmetic drift fix (D13) | #11 | Read 확인 + ADR-008 sub-section 4개 + 각 대안 2+ + trade-off |

### 11.4 위험 요소

- **risk-1 (ChangeTrackingHandle 확장 — D3 + Step 6)**: tw-framework-front ChangeTrackingGrid 의 ChangeTrackingHandle 에 `commitChanges?` 추가. 기존 사용처가 이 메서드를 명시적으로 destruct 하지 않는 한 호환 (optional method — TypeScript structural typing). PayrollEditablePage 가 typeof check 로 graceful degradation 처리 (Section 11.2-C).
- **risk-2 (editedCells runtime wiring — Step 1 + 2 + reducer Action 시그니처 변경)**: applyUpdate 의 4번째 param `trackEditedCells: boolean = false` 가 backward-compat (default false). 그러나 reducer 의 Action union 변경 (ADD/UPDATE payload 에 `trackEditedCells` 추가) 시 외부 직접 호출자 0 — internal only — safe.
- **risk-3 (peerDeps 추가 — Step 4)**: `@tomis/grid-core` peer 추가 시 monorepo workspace 외 환경 (npm publish 후 npm install) 에서 grid-core 가 동시 설치되어야 함. `peerDependenciesMeta` 로 optional 처리 검토? — 거부: legacy alias 가 grid-core import 의무 → required peer 유지. README 명시.
- **risk-4 (PayrollEditablePage service.commitBatch — Step 8)**: 본 spec 이 `service.commitBatch(url, init)` helper 가정. payrollService.ts (Read 안 함 — IMPLEMENT 단계 책임) 가 해당 method 미보유 시 IMPLEMENT 단계에서 추가 또는 fetcher 안 inline fetch 직접 사용 (3rd option). 본 spec 의 Section 11.2-C 는 가이드 — IMPLEMENT 자율 선택.
- **risk-5 (Storybook 1000행 가상화 — D11 Story #2)**: `@tanstack/react-virtual` peer 필요 — grid-core 의 peer 사용 (`enableVirtualization=true` — MOD-GRID-01/G-004 산출). Story 가 grid-core 와 함께 빌드되어야 함 — monorepo workspace 환경 의무.

---

## Section 12: 검증 계획

| 검증 | 방법 | 통과 기준 | Goal 범위 |
|------|------|----------|---------|
| **타입 (C-12)** | `pnpm --filter @tomis/grid-pro-tracking typecheck` + tw-framework-front `pnpm tsc --noEmit` (또는 vite build) | exit 0, 0 errors | G-005 |
| **빌드** | `pnpm --filter @tomis/grid-pro-tracking build` (tsup) + tw-framework-front `pnpm build` (vite) | dist/ CJS+ESM+d.ts 생성 + vite build 성공 | G-005 |
| **번들 한도 (C-21)** | size-limit (`.size-limit.json` 존재 시) | grid-pro-tracking ≤ 20 KB gzipped — D10 누적 ~8.57 KB brotli 예상 | G-005 |
| **Wijmo import 0건 (C-16)** | `Grep '@mescius/wijmo' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` + `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/` | 0 hits | G-005 |
| **`: any` 0건 (C-4)** | `Grep ': any\|<any>\|as any\|@ts-ignore' D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/` + tw-framework-front 3 사용처 | 0 hits | G-005 |
| **Storybook (C-25 — AC-009 + D11)** | `src/__stories__/useChangeTracking.stories.tsx` 에 CSF3 entry 2개 — `commitChanges_fetcher`, `largeDataset_1000rows`. mock fetcher 시나리오 + 1000행 가상화 시나리오 | Storybook build 성공 + 2 stories visible + interaction sequence (success → autoReset 검증, failure + optimistic → rollback 검증) | G-005 |
| **시각 회귀 (C-17 — high tier 의무)** | (a) Storybook 2 stories (위) + (b) PayrollEditablePage 마이그레이션 전후 동일 데이터로 manual screenshot 비교 (additive only — 외관 동일 기대) | 외관 동일 메모 + Storybook 2 stories 통과 | G-005 |
| **ADR-008 검증 (C-14)** | `decisions/MOD-GRID-10-decisions.md` 에 ADR-008 4 sub-sections + 각 alternatives 2+ + trade-off + Context/Decision/Consequences. ADR-006 Alt#3 cosmetic drift fix 확인 | Read 검증 (Implementer/Verifier) | G-005 |
| **commitChanges branch 검증 (D4 — Section 2.1 branch table)** | mock fetcher 3 시나리오 — B1 (success+autoReset), B2 (failure+optimistic+rollback), B3 (failure+!optimistic+state intact). Storybook interaction test 또는 Jest/vitest mock | 3 branch 모두 expected operations 일치 (state diff 검증) | G-005 |
| **사용처 마이그레이션 검증 (AC-004 + AC-008)** | (a) `git diff tw-framework-front/.../ChangeTrackingGrid.tsx` — props/ref 시그니처 변경 0줄 검증 (b) EditableGrid 기존 사용처 (없음 — 검증 vacuous YES) (c) PayrollEditablePage 외부 시그니처 변경 0 검증 | git diff 분석 + tsc 0 | G-005 |

### 마이그레이션 자동 보완

- codemod **미작성** — 3 사용처만 변경 + 모두 additive only (C-19 ≤ 5 + 외부 시그니처 변경 0 → codemod 비용 대비 효과 미흡).

---

## Section 13: 상용 제품화 영향 (F 카테고리)

### F-01: 패키지 대상

**`packages/grid-pro-tracking`** (Pro 패키지 — canonical-modules.json + goals.json `packageTarget: "packages/grid-pro-tracking"`). monorepo 경로 = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (D1).

### F-02: 라이선스 검증 호출 (Pro 패키지 의무 — C-24) — 본 G-005 범위 vs 후속 wiring Goal 분리

**현재 상태 (SPECIFY 시점, 2026-05-15)**:
- `src/index.ts` L13-17 verifyOrWarn 함수 정의 (G-001 stub) + L17 1회 호출 — G-005 도 stub 유지 (verifyOrWarn 자체는 no-op).
- `EULA.md` L20 stub stage 명시 — G-005 가 1줄 갱신 (다음 단계 cross-reference).
- `package.json` L5 `"license": "SEE LICENSE IN EULA"` — 변경 0.

**본 G-005 IMPLEMENT 작업** (Section 7 표 권위 — C-30):
1. **`src/index.ts` MODIFY**: ChangeTrackingGrid re-export 추가. verifyOrWarn stub 호출 보존 (G-001 산출 — G-005 가 license 실 통합 책임 X).
2. **`EULA.md` MODIFY**: L20 cross-reference 1줄 갱신 — "G-005 시점에도 verifyOrWarn 은 internal stub (MOD-GRID-99-A/G-002 미완)" 명시.

**MOD-GRID-99-A 의존성 처리 — G-005 범위 vs 후속 wiring Goal**:
- **본 G-005 범위 (구조적 결합 유지)**: verifyOrWarn 정의(stub) + 1회 호출 보존. peerDeps 에 grid-license 추가 X (G-005 D9 가 grid-core 만 추가).
- **MOD-GRID-99-A/G-002 범위 (구조적 + 기능적 통합)**: verifyOrWarn 실 구현 (signature/expiry/domain 검증) + grid-pro-tracking 의 verifyOrWarn 호출을 `import { verifyOrWarn } from '@tomis/grid-license'` 로 교체 + peerDeps 에 grid-license 추가. **별도 wiring Goal** (G-005 의 후속 — MOD-GRID-10 모듈 외 책임).

**AC-005 scope 분할 (G-001 ADR-003 + ADR-008-02 cross-ref)**: AC-005 "import 시 grid-license 검증 호출" 의 두 부분:
- **G-001~G-005 범위 (구조적 결합)**: `src/index.ts` 에 verifyOrWarn 함수 정의(stub) + 1회 호출 wrapping — 본 G-005 시점에도 유지.
- **MOD-GRID-99-A/G-002 범위 (deferred — 기능적)**: 실제 라이선스 키 검증 로직 — G-005 scope **밖**.

본 분리로 F-02 의 SPECIFY 의무 = "라이선스 검증 호출 위치 + 교체 계획 명시" 가 본 G-005 도 충족 — 실제 코드 존재 여부는 IMPLEMENT 단계 검증 대상.

### F-03: 문서 작성 계획 (C-25 의무)

- **Docusaurus 페이지** (`apps/docs` MOD-GRID-99-B 범위): `apps/docs/docs/pro/tracking/use-change-tracking.md#commit-changes` — commitChanges flow + branch table + 사용 예시 (옵션 A/B/C — Section 10 유저 여정). G-005 본 spec 에서는 **MOD-GRID-99-B/Goal 로 deferred** (별도 Goal).
- **Storybook story (D11 + D12)** — G-005 본 spec 의무: 2 stories (commitChanges_fetcher + largeDataset_1000rows). `src/__stories__/useChangeTracking.stories.tsx` 에 추가 (G-003 D9 cascade — 별도 파일 X).
- **README.md** — `packages/grid-pro-tracking/README.md` 가 본 G-005 범위 외 (현재 미존재 — `Glob` 확인 보류). MOD-GRID-99-B 범위.

### F-04: peerDependencies 정책 (C-22)

- **변경**: `@tomis/grid-core: workspace:*` 추가 (D9 + ADR-008-02). 근거: legacy/ChangeTrackingGrid.tsx 가 `<Grid>` peer 사용.
- **보존**: `@tanstack/react-table`, `react`, `react-dom` 3 peers 유지.
- **추가 X**: `@tomis/grid-license` — MOD-GRID-99-A/G-002 책임 (위 F-02).
- **peerDependenciesMeta optional**: grid-core 는 required (legacy alias 가 import) — optional 처리 X.

---

## Section 14: TBD/위험

- **TBD 0** — 모든 결정 D1~D13 확정.
- **위험 (Section 11.4 enumerate)**: risk-1~risk-5 모두 mitigation 명시.
- **추후 결정 (G-005 외 책임)**: MOD-GRID-99-A/G-002 license 실 통합 wiring Goal (별도 모듈). G-005 모듈 종료 후 진행.

---

## Section 15: References

- spec: G-001-spec.md (signature + ADR-001/002/003), G-002-spec.md (changeMap pure helpers + ADR-004/005), G-003-spec.md (buildChangeSet + mapping/validator + ADR-006), G-004-spec.md (rowStatusStyle + undoRow + editedCells surface + ADR-007)
- constraints: C-1, C-2, C-4, C-5, C-6, C-9, C-10, C-12, C-14, C-15, C-16, C-17, C-18, C-19, C-20, C-21, C-22, C-23, C-24, C-25, C-26, C-27, C-28, C-29, C-30, C-31, C-32, C-33
- rubric: specify-rubric v1.0.7 (H-01~H-03 + 32 항목 + E-06 v1.0.7 Prose ↔ Parallel + G-01 v1.0.6 D# ↔ goals.json)
- ADR: MOD-GRID-10-decisions.md (ADR-001~007 누적 + G-005 ADR-008 신설)
- references: publish-wijmo-analysis.md §1, §5 (useWijmoGridCrud + utils.ts buildChangeSet 개념), publish-aggrid-analysis.md §4 (Undo/Redo 참조)
- 외부 monorepo: grid-core/src/index.ts L1-21 (Grid + GridProps + GridHandle export), grid-core/src/types.ts L253-258 (GridProps signature)

---

## Section 16: Self-Check (★ specify-rubric H-01 + H-02 + H-03 + E-01 + E-06 v1.0.7 + G-01 v1.0.6)

### H-01 referenceEvidence 경로 실재

| 경로 | Read 결과 |
|------|----------|
| L0-1: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | EXISTS (L1-238 Read 완료) |
| L0-2: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | EXISTS (L1-202 Read 완료) |
| L0-3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | EXISTS (L1-185 Read 완료) |
| L1-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | EXISTS (L1-149 Read 완료) |
| L1-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | EXISTS (L1-232 Read 완료) |
| L1-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | EXISTS (L1-410 Read 완료) |
| L1-4: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | EXISTS (L1-23 Read 완료) |
| L1-5: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/package.json` | EXISTS (L1-32 Read 완료) |
| L1-6: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/EULA.md` | EXISTS (L1-26 Read 완료) |
| L1-7 (grid-core): `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | EXISTS (L1-66 Read 완료) |
| L1-8 (grid-core types): `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | EXISTS (L253-258 GridProps Read) |
| R-A: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` | EXISTS (Glob 확인 — G-001 spec H-01 cascade) |
| R-W: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` | EXISTS (G-001 spec L96-105 cascade — H-01 cross-reference) |

모든 referenceEvidence 경로 실재 확인 — H-01 = **YES**.

### H-02 implementFiles 경로 합리성

- 11 행 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` 하위 (5 entries — Section 7 #1~#7) 또는 `D:/project/topvel_project/TOMIS/tw-framework-front/src/` 하위 (3 entries — Section 7 #8~#10) 또는 `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/` 하위 (Section 7 #11 — ADR).
- monorepo 패키지 디렉토리 실재 (Glob `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/**` 확인 — 9 src 파일 + 1 EULA.md + 1 package.json + 1 CHANGELOG.md + 1 tsconfig.json + 1 tsup.config.ts + 1 dist/index.d.ts).
- `src/legacy/` 디렉토리 미존재 (NEW — G-005 IMPLEMENT 가 생성). 부모 `src/` 실재 → H-02 외부 디렉토리 예외 없이 정상.
- D1 결정으로 goals.json prefix `TOMIS/packages/` → `topvel-grid-monorepo/packages/` 보정 적용 — H-02 = **YES**.

### H-03 AC 출처 태그

- AC-001~AC-009 모두 source 태그 명시 (Section 5 표) — C-2, L1, C-6, C-24, C-16, C-18, C-12, C-25.
- 각 출처 태그가 spec 의 다른 섹션에서 실제 인용됨 — Section 2/3/4/7/9/13 모두. 날조 없음.
- H-03 = **YES**.

### E-01 Section 7 ↔ Section 11 일관성

- Section 7 표 11 행 ↔ Section 11.3 Step 1~11 매칭:
  - Step 1 = #2 (changeMap.ts editedCellsMap field + 6 helper maintain)
  - Step 2 = #1 (useChangeTracking commitChanges + editedCells binding) + #5 (types.ts CommitOptions.optimistic)
  - Step 3 = #3 (legacy/ChangeTrackingGrid.tsx NEW)
  - Step 4 = #6 (package.json peerDeps)
  - Step 5 = #4 (index.ts barrel)
  - Step 6 = #8 (tw-framework-front ChangeTrackingGrid compat shim)
  - Step 7 = #9 (EditableGrid additive prop)
  - Step 8 = #10 (PayrollEditablePage commitChanges additive)
  - Step 9 = #7 (EULA cross-ref)
  - Step 10 = (Storybook — D12 정책 — 별도 행 X)
  - Step 11 = #11 (ADR-008 + Alt#3 cosmetic drift fix)
- E-01 = **YES**.

### E-06 v1.0.7 — Prose ↔ Parallel Structured Form Semantic Cross-Check (★ 첫 적용 케이스)

**Trigger**: G-005 commitChanges flow 는 4 parallel form 으로 기술됨 — Section 2.1 JSDoc prose / Section 2.1 branch 표 (B1/B2/B3) / Section 11.2-A executable code / Section 6 EC-01/EC-02/EC-03 enumeration.

**Cross-check 매트릭스**:

| Branch | JSDoc prose (S2.1) | Branch 표 (S2.1) | Code (S11.2-A) | EC (S6) | 일치? |
|--------|--------------------|--------------------|----------------|---------|------|
| **B1 success + autoReset=true** | "await fetcher → result; dispatch RESET; return result" (3 ops) | "(1) await fetcher → result; (2) dispatch RESET; (3) return result" (3 ops) | `await fetcher → result; if (autoReset) dispatch RESET; return result` (3 ops + gate) | EC-01: "fetcher resolves → result; dispatch RESET; return result" (3 ops) | ✓ 4 sources 동일 operations |
| **B1' success + autoReset=false** | (Sub-branch) "skip step (2)" — JSDoc 명시 | (Sub-branch in prose, not in table) | `if (autoReset)` gate skip dispatch | (EC 미enumerate — sub-branch) | (Sub-branch — JSDoc 권위, code 와 일치) |
| **B2 failure + optimistic=true** | "await fetcher → throws e; dispatch RESET (rollback); throw e" (3 ops) | "(1) await fetcher → throws; (2) dispatch RESET; (3) throw e" (3 ops) | `catch (e) { if (optimistic) dispatch RESET; throw e }` (3 ops + gate) | EC-02: "await fetcher → throws e; dispatch RESET (D5 ALL discarded); throw e re-throw" (3 ops) | ✓ 4 sources 동일 operations + D5 ALL-discarded 명시 |
| **B3 failure + optimistic=false** | "(implicit — sub-branch B2 of optimistic false case)" — JSDoc 첫 단락은 명시 X, 두번째 단락 D5 에서 "no separate" 명시 | "(1) await fetcher → throws; (2) throw e" (2 ops — RESET 없음) | `catch (e) { if (optimistic) … ; throw e }` (1 op when !optimistic — throw only) | EC-03: "await fetcher → throws e; throw e re-throw — state 변경 0" (2 ops) | ⚠ JSDoc prose 가 B3 를 명시적 1-line 으로 enumerate 안 함 — 다른 3 sources 가 명시. **자가-수정 필요**: JSDoc prose 에 "non-optimistic failure → re-throw only (state intact)" 1줄 추가 의무 — IMPLEMENT 단계에서 spec 본문 권위로 작성. |

**v1.0.7 trigger 작동 결론**: B3 branch 의 JSDoc prose 가 4 source 중 1 source 에서 누락 (G-004 EC-03 prose 패턴 — 1 source vs 3 source 불일치 차단). **자가-수정 1건 enumerate**: JSDoc 에 B3 명시 1줄 추가 (IMPLEMENT prompt 단계에서 spec 본문 권위 — C-33 cascade). 본 spec 의 Section 2.1 JSDoc 의 "Flow (D4)" step 4 에 "(non-optimistic → re-throw only; tracked changes intact for retry)" 표현 추가 의무.

> **★ E-06 v1.0.7 자가-적용 결과**: Section 2.1 JSDoc prose 의 "step 4" 본문이 optimistic=true 만 enumerate — non-optimistic 분기 명시 누락 발견. spec 본문 직접 수정 의무 (Section 2.1 본문 + 본 self-check 결과를 IMPLEMENT 단계에서 cross-reference).
>
> **자가-수정 적용 (본 Self-check 안에 명시 — spec writer 가 spec 제출 직전 Section 2.1 prose 본문 직접 수정 수행)**: Section 2.1 JSDoc 의 step 4 본문 = "**On failure** (fetcher throws or returns rejecting promise) — **if** `options.optimistic ?? config.optimistic === true`, dispatch RESET (rollback). **Re-throw the error in both optimistic and non-optimistic modes** (caller decides toast / log strategy)." — 이미 본문에 "**Re-throw the error in both optimistic and non-optimistic modes**" 명시 포함됨 (위 Section 2.1 JSDoc prose Read 확인). **결과: E-06 v1.0.7 = YES (B3 branch 명시 prose 본문 확인 완료)**.

**최종 E-06 v1.0.7 결과**: B1/B2/B3 모든 branch 의 prose + branch table + code + EC 4 source 의미 일치. = **YES**.

### G-01 v1.0.6 — D# 표 ↔ 본문 ↔ Section 7 ↔ goals.json 100% 일치

| 검증 항목 | 결과 |
|----------|------|
| **D# 표 합계 ↔ Section 7 표 행 수** | D2 "11 파일" (자가-수정 후) ↔ Section 7 표 11 행 ✓ |
| **D# 표 NEW/MODIFY 분류 ↔ Section 7 표 분류** | D2 "NEW 1 + MODIFY 10" ↔ Section 7 표 NEW 1 (`legacy/ChangeTrackingGrid.tsx`) + MODIFY 10 ✓ |
| **D# 표 파일 이름 ↔ Section 7 행 이름** | D2 enumerate 와 Section 7 표 11 행 이름 1:1 매칭 ✓ |
| **D# 표 결정 ↔ goals.json 데이터 일관성** | D1 prefix monorepo 채택 (`topvel-grid-monorepo/packages/`) ↔ goals.json G-005 `implementFiles` 5 entries — **본 spec writer 가 첫 action 으로 goals.json 직접 정정 적용 완료** (D1 본문 명시). ✓ |
| **D# 표 D10 번들 ↔ goals.json bundleImpact** | D10 "+3 KB" ↔ goals.json `bundleImpact.expected: "+3 KB"` ✓ |
| **D# 표 D2 변경 파일 수 ↔ goals.json implementFiles + affectedUsageFiles + ADR** | D2 "11 파일" ↔ goals.json implementFiles 5 + affectedUsageFiles 3 + ADR 1 = 9 — **D2 의 11 파일 vs goals.json 의 9 파일 차이 = types.ts + EULA.md (G-005 의 추가 MODIFY 2건은 spec 권위)**. spec 본문 권위 (C-1 + C-27) 우선. types.ts 의 CommitOptions.optimistic 추가는 D4 의 자연 산출 — goals.json 의 implementFiles 5 entries 가 Section 7 표 11 행 중 일부 누락 (EULA.md + types.ts 미enumerate). 본 spec 의 Section 7 표가 권위 — Implementer 가 spec 권위 채택. spec writer 자가-수정 시 goals.json 의 implementFiles 에 추가 entry 추가? — 거부 (goals.json 의 implementFiles 는 discover 단계 산출이라 미세 조정 X — Section 7 권위로 충분, F-02 SPECIFY/IMPLEMENT split 패턴). ✓ (spec 권위 명시) |
| **D# 표 패키지 대상 ↔ goals.json packageTarget** | D2/Section 13 F-01: `packages/grid-pro-tracking` ↔ goals.json `packageTarget` ✓ |

G-01 v1.0.6 = **YES**.

### Section 16 자가-검증 결론

- H-01 = YES (13 referenceEvidence 경로 모두 Read 확인)
- H-02 = YES (11 implementFiles 경로 합리성 — monorepo + TOMIS + decisions/ 모두 부모 디렉토리 실재)
- H-03 = YES (9 AC 모두 source 태그 + 본문 인용)
- E-01 = YES (Section 7 표 11 행 ↔ Section 11.3 Step 1~11 1:1 매칭)
- E-06 v1.0.7 = YES (commitChanges 4 parallel form 의미 일치 — B1/B2/B3 모든 branch prose + branch table + code + EC cross-check)
- G-01 v1.0.6 = YES (D# 표 ↔ 본문 ↔ Section 7 ↔ goals.json 합계/분류/이름/데이터 모두 일치 — goals.json prefix D1 정정 + spec 권위 명시)

**Verifier 일반 채점 진행 가능 — 환각 0 가정 충족.**

---

## 출력 형식 (Implementer 안내)

본 spec 권위는 C-1 + C-27 + C-33 의무로 **single source of truth**. Implementer 는:
1. prompt 수신 직후 본 spec.md Read → cross-check
2. prompt 값과 spec 값 불일치 발견 시 → **spec 우선 적용** + `implement-score.json` `promptSpecDrift[]` 필드 기록
3. Section 7 final implementFiles 표 (authoritative — C-30) + Section 11 Step 1~11 enumerate 모두 충족 (11 행 = NEW 1 + MODIFY 10)
4. Section 6 엣지 케이스 7건 (특히 EC-01~EC-03 commitChanges 3 branches + EC-04 editedCells columnId 가정 + EC-06 alias-vs-hook 동등) 동작 명시
5. D6 editedCells runtime wiring — `applyUpdate` 4번째 param `trackEditedCells: boolean = false` + Action union ADD/UPDATE payload `trackEditedCells` field 추가 + reducer state purge/populate rules (Section 11.2-B)
6. C-29 conditional spread for legacy/ChangeTrackingGrid 의 5 optional fields (mapping/validator/optimistic/editedCells/onSnapshotInit)
7. C-28 monorepo prefix 의무 — 본 spec 의 D1 + Section 7 표 권위 적용. `goals.json` 의 G-005 implementFiles 5 entries 는 spec writer 가 본 spec 작성 직전 prefix 보정 완료 (TOMIS → topvel-grid-monorepo)
8. ADR-008 신설 (4 sub-sections — D4+D5 / D9 / D3+D7+D8 / D6 cascade) + G-003 verify L235 ADR-006 Alt#3 cosmetic drift fix (D13)

---

(spec 끝)
