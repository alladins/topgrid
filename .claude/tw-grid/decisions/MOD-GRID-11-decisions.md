# MOD-GRID-11 결정 로그

**Package**: `@tomis/grid-pro-range`  
**Module**: Cell Range Selection (마우스 드래그 / Shift+Click)  
**Date**: 2026-05-14

---

## ADR-MOD-GRID-11-001: implementFiles 경로 수정 (C-28)

- **결정**: goals.json의 `TOMIS/packages/` 접두사를 `topvel-grid-monorepo/packages/`로 교정
- **사유**: TOMIS repo에 `packages/` 디렉토리가 존재하지 않음. 실제 monorepo root는 `topvel-grid-monorepo/`
- **대안 1**: goals.json 직접 수정 — 채택 (spec 우선, C-28 준수)
- **대안 2**: spec만 수정하고 goals.json 유지 — 미채택 (혼선 유발)
- **trade-off 1**: goals.json 수정 시 discover 단계 산출물과 불일치 — 단기 혼선 vs 장기 정확성. 정확성 우선.
- **trade-off 2**: 경로 수정 미적용 시 Implementer가 미존재 디렉토리에 파일 작성 시도 → F-01 NO 강제. 수정이 더 안전.
- **상태**: G-001 spec 반영. C-28 전파 대상: MOD-GRID-02~16, MOD-GRID-99-A/B (17개 모듈 동일 위험)

---

## ADR-MOD-GRID-11-002: 라이선스 의존성 Option A 선택 (D2)

- **결정**: `verifyGridLicense?.()` 선택적 호출 (Option A)
- **사유**: MOD-GRID-99-A/G-001 미완료. `grid-license/src/index.ts`는 `export {};` stub. Optional-chain 패턴으로 stub→실구현 시 호출부 변경 없음.
- **대안 1 (Option A, 채택)**: namespace import + feature-detect. `(gridLicense as { verifyGridLicense?: () => void }).verifyGridLicense?.()`. stub에서 no-op, 실구현 시 자동 활성.
- **대안 2 (Option B)**: 라이선스 호출 생략 — 미채택. 보안 공백 발생.
- **대안 3 (Option C)**: MOD-GRID-99-A 완료 대기 후 진행 — 미채택. 진행 불가.
- **trade-off 1**: namespace import는 tree-shaking 불리. 그러나 라이선스 검증 코드는 tiny이므로 번들 영향 미미.
- **trade-off 2**: spec 6.5의 `@ts-ignore` + `declare const` 패턴은 C-4 위반 + 런타임 ReferenceError 위험. feature-detect가 더 안전.
- **specCodeDefect 기록** (F-06): spec Section 6.5 `@ts-ignore` → C-4 위반. `declare const verifyGridLicense` → 실제 export 없는 심볼 런타임 ReferenceError. namespace import + feature-detect로 자율 정정.
- **상태**: G-001 useCellRange.ts에 적용

---

## ADR-MOD-GRID-11-003: CellRange 독립 상태 (D3)

- **결정**: TanStack `rowSelection`과 무관한 독립 state로 유지
- **사유**: TanStack `rowSelection`은 row-key 기반 boolean map. CellRange는 2D 직사각형. 겹치지 않는 레이어이므로 독립 state.
- **대안 1 (채택)**: 독립 `useState<CellRange | null>` in useCellRange
- **대안 2**: TanStack `meta` 또는 custom feature로 통합 — 미채택. TanStack 내부 API 강결합(C-2 위반 위험), 필요 이상 복잡도.
- **trade-off 1**: 독립 상태는 TanStack rowSelection과 동시 사용 시 두 state 관리 부담. 그러나 레이어 분리가 유연성 ↑.
- **trade-off 2**: 향후 두 상태 동기화가 필요한 경우 별도 hook 필요. G-001 scope에서는 불필요.
- **상태**: G-001 설계 확정

---

## ADR-MOD-GRID-11-004: ring-1 ring-blue-400 (D4, AC-005)

- **결정**: L0 `border-blue-300`을 `ring-1 ring-blue-400`으로 변경
- **사유**: AC-005 명시 요건. `ring`은 border-box 영향 없음 (outline-safe), 더 명확한 하이라이트.
- **대안 1 (채택)**: Tailwind `ring-1 ring-blue-400`
- **대안 2**: `outline` 유틸 — ring이 더 Tailwind 관용적. 미채택.
- **trade-off 1**: L0 외관 드리프트 발생 — AC-005 요건이므로 의도된 변경. legacy alias도 새 스타일 위임.
- **trade-off 2**: `ring`은 focus-ring과 시각적으로 유사 — 접근성 관점에서 혼동 가능. G-001 scope에서는 허용.
- **상태**: G-001 Section 7 #4 (RangeSelectGrid.tsx), #9 (TOMIS migration) 적용

---

## ADR-MOD-GRID-11-005: Storybook story 포함 (D5, AC-011)

- **결정**: `useCellRange.stories.tsx` NEW 파일 Section 7 필수 포함
- **사유**: AC-011 "Storybook story 1개" 납품 바인딩 AC. E-01(v1.0.6) 규칙에 따라 Section 7 필수 포함.
- **대안 1 (채택)**: Section 7 #6 포함, `Default` story + `Loading`, `Empty`, `LargeDataset` 스토리 제공
- **대안 2**: docs-focused 별도 Goal로 분리 — 미채택. E-01 binding AC이므로 이 Goal에서 납품 의무.
- **trade-off 1**: story 파일 추가로 implementFiles 증가 — AC-011 바인딩이므로 필수.
- **trade-off 2**: Storybook 미설치 환경에서 story 타입 에러 가능 — peerDependency로 선언.
- **상태**: G-001 spec D5 반영

---

## ADR-MOD-GRID-11-006: CellRange Pattern Catalog Note (2026-05-14 self-review 신설)

- **결정**: G-001 spec 이 인용한 AG Grid Enterprise + Wijmo CellRange 패턴의 **개념적 매핑** 을 카탈로그로 명시 — 후속 Goal (G-002 키보드, G-003 drag-fill, G-004 clipboard, G-005 delete, G-006 통합) 에서 동일 참조 일관 적용 + C-16 (Wijmo import 금지) 준수 증거 일원화.
- **사유**: G-001 spec Section 1 L29 (`ag-grid-feature-matrix.md L34`) + Section 3.3 L95-101 (`publish-wijmo-analysis.md §3 L104-117`) 인용. 그러나 결정 로그에는 패턴 매핑이 enumerate 되어 있지 않아 후속 Goal 에서 동일 참조를 어떻게 적용할지 명시적 가이드 부재. catalog 1회 작성으로 G-002~G-006 spec 작성 시 참조 표 재인용 가능.
- **대안 1 (채택)**: ADR-006 단일 항목으로 패턴 카탈로그 enumerate. AG Grid Range Selection API shape + Wijmo `g.selectionMode = CellRange` + `g.selection.clone()` 패턴 매핑.
- **대안 2**: 각 Goal spec 에서 매번 참조 재인용 — 미채택. 중복 + 일관성 보장 어려움.
- **trade-off 1**: ADR catalog 가 커지면 유지보수 부담 ↑. 그러나 cross-Goal 참조 일관성 ↑.
- **trade-off 2**: AG Grid Enterprise 는 상용 (C-7) — 코드 차용 금지. 패턴 shape 만 참조. Wijmo 도 C-16 import 금지, 개념만.

### Pattern Catalog

| 패턴 | 출처 | G-001 적용 | 후속 Goal 적용 후보 |
|------|------|------------|---------------------|
| **anchorCell + currentCell ref 기반 드래그** | Wijmo `currentSelectionRef = g.selection.clone()` (publish-wijmo-analysis.md §3 L104-117) | `useCellRange.ts` `dragStart` useRef + `range` useState | G-003 (drag-fill anchor), G-005 (편집 anchor) |
| **normalize-on-extend (start ≤ end 보장)** | AG Grid Range Selection normalize semantics + Wijmo CellRange auto-normalize | `internal/normalize.ts` `normalizeRange(range)` | G-002 (Shift+Arrow extend), G-003 (fill range), G-004 (clipboard matrix bounds) |
| **Shift+Click → end 갱신, anchor 유지** | AG Grid Range Selection `extendRange` API | `useCellRange.ts` `handleMouseDown` shiftKey 분기 (L82-86) | G-002 (Shift+Arrow keyboard extend) |
| **mousedown/move/up 시퀀스 + drag state ref** | Wijmo `isDraggingRef` 패턴 (publish-wijmo-analysis.md §3) | `useCellRange.ts` `dragging` useState | G-003 (drag-fill mousedown→mouseup) |
| **2D matrix isInRange 체크** | AG Grid Range Selection cell-in-range check | `internal/normalize.ts` `isInRange(row, col, range)` | G-004 (clipboard copy 범위 매트릭스 추출), G-005 (Delete 범위 iteration) |
| **selectionMode enum (CellRange / Row 등)** | Wijmo `g.selectionMode = wjGrid.SelectionMode.CellRange` | G-001 미적용 (단일 모드) | G-006 통합 시 `enableRangeSelection` boolean prop 으로 단순화 |

### C-16 준수 증거 일원화

- **import 0건 확인**: `Grep '@mescius/wijmo\|from [\'"]wijmo' on packages/grid-pro-range/src` → 0 hits (implement-score L78 + implement-verifier-score B-06 확인).
- **AG Grid 미도입 (C-7)**: `ag-grid-community|ag-grid-react|ag-grid-enterprise` 0 dependency. 패턴 shape 만 references/ 에서 학습.
- **재현 명령**: 모든 후속 Goal (G-002~G-006) 의 implement-verifier 는 동일 grep 의무. catalog 출처 인용은 `references/ag-grid-feature-matrix.md` + `references/publish-wijmo-analysis.md` 만 허용.

- **상태**: G-001 사후 카탈로그. G-002~G-006 spec 작성 시 본 ADR 인용 의무 (특히 normalize-on-extend + anchor 유지 패턴은 G-002 키보드 Shift+Arrow 에서 직접 재사용).

---

## ADR-MOD-GRID-11-007: G-006 Capstone 통합 결정 (D4/D5/D6/D9)

- **결정 묶음**: G-006 RangeSelectGrid 완전 통합에서 확정된 4개 핵심 결정
- **상태**: G-006 구현 완료 (2026-05-15)

### D4 — enable* props 설계 (behavior gate)

- **결정**: `enableRangeSelection=true`, `enableKeyboardNav=true`, `enableDragFill=false`, `enableClipboard=false`, `enableKeyboardEdit=false`, `enableVirtualization=false` 기본값.
- **사유**: Backward compat (C-6) — 기존 6-prop 사용자는 변경 없이 동작. 신규 기능은 opt-in.
- **대안 1 (채택)**: enable* 기본값 = 기존 동작 보존 (rangeSelection/keyboardNav=true, 나머지=false)
- **대안 2**: 모든 enable* 기본값=false — 미채택. 기존 사용자 기능 회귀 발생.
- **trade-off 1**: enable* 기본값이 다르면 혼란 유발 — 명시적 문서화(CHANGELOG, JSDoc)로 보완.
- **trade-off 2**: enableRangeSelection=true default 시 기존 L0 사용 코드가 자동으로 5-hook 포함 — 번들 크기 증가 미미 (hook은 peerDep이므로 tree-shaking 유리).

### D5 — Rules of Hooks 엄수

- **결정**: 5개 hook 전부 무조건 호출. enable* 는 동작 게이팅(콜백 조건부 전달)에만 사용.
- **사유**: React Rules of Hooks — 조건부 hook 호출 금지. enable*=false 시 hook 내부 no-op.
- **구현**: `useCellRange(enableRangeSelection ? onRangeChange : undefined)` — hook 호출은 항상, 콜백만 조건부.
- **대안 1 (채택)**: 항상 호출 + 조건부 콜백 전달
- **대안 2**: `if (enableDragFill) useDragFill(...)` — 미채택. Rules of Hooks 위반.
- **trade-off 1**: 모든 hook 호출 시 약간의 런타임 비용 — hook 내부 early return으로 최소화.
- **trade-off 2**: DragFillHandle은 컴포넌트이므로 조건부 렌더 허용 (hook이 아님).

### D6 — L0 usage file zero-touch

- **결정**: `tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` 수정 없음.
- **사유**: `RangeSelectGridAllProps`가 `RangeSelectGridProps`를 extends하므로 기존 6-prop 사용 코드 호환. contextMenu 복사 버튼 wiring은 이 Goal scope 밖.
- **대안 1 (채택)**: zero-touch. 기본값이 기존 동작 보존.
- **대안 2**: L0 파일 수정하여 새 props 활용 — 미채택. D6b scope 외.
- **trade-off 1**: L0이 `Parameters<typeof ProRangeSelectGrid<TData>>[0]` type aliasing 사용 — `RangeSelectGridAllProps` 자동 반영. 호환성 검증은 tsc --noEmit으로 확인.

### D9 — onKeyDown 합성 순서

- **결정**: editKeyDown(e) → navKeyDown(e) → clipKeyDown(e) 순서.
- **사유**: G-005 Enter key가 편집 시작 (onEditStart)과 내비게이션(다음 행 이동)이 충돌. edit가 먼저 처리하고 e.preventDefault() 시 nav skip.
- **대안 1 (채택)**: G-005 → G-002 → G-004. edit 우선.
- **대안 2**: G-002 → G-005 → G-004 — 미채택. Enter 키 내비게이션 우선 시 editStart 미발동.
- **trade-off 1**: Ctrl+C/V는 nav/edit와 키 충돌 없으므로 clipboard 순서는 마지막이 자연스럽다.
- **trade-off 2**: 합성 체인에서 early return(defaultPrevented) 패턴 사용 — hook마다 반드시 호출되어야 하는 side-effect가 있으면 위험. G-006 각 hook은 key match 시에만 side-effect — 안전.

### F-06 specCodeDefects (G-006 구현 중 자율 정정)

| # | 위치 | 문제 | 정정 내용 |
|---|------|------|----------|
| 1 | Section 3.2 useCellRange 호출 | spec: `useCellRange({ rowCount, colCount, onRangeChange, disabled })` — 실제 시그니처: `useCellRange(onRangeChange?)` 단일 인자 | `useCellRange(enableRangeSelection ? onRangeChange : undefined)` 로 정정 |
| 2 | Section 5.1 DragFillHandle | spec: `getCellValue ?? (() => undefined)` — `DragFillHandleProps.getCellValue`는 non-optional이므로 type 오류 | render condition `getCellValue !== undefined` 추가, fallback 제거 |
| 3 | Section 3.2/5.1 data-row/col | spec: `containerRef` querySelector 사용하나 기존 RangeSelectGrid.tsx에 data-row/col attribute 없음 | `<td data-row={rowIdx} data-col={colIdx}>` 추가 |
| 4 | Section 3.2 useVirtualizer `enabled` prop | spec: `enabled: enableVirtualization` — useVirtualizer v3에 `enabled` option 없음 | `count: enableVirtualization ? rowCount : 0` 로 대체 |

---

*ADR 형식: 결정 / 사유 / 대안 2개+ / trade-off 2개+ / 상태*
*rubric version: v1.0.9 | generated: 2026-05-14 | updated: 2026-05-15 (ADR-007 G-006 capstone 신설)*
