# MOD-GRID-36 — Data identity & cell feedback (getRowId → cell flash → cell tooltip)

> ⚠ **소급 작성(retroactive backfill, 2026-06-06)**: 구현 이후 state.json·git·MASTER §3 에서 재구성.
> MOD-34~39 정식 specify 건너뜀(→ `docs/internal/WORKFLOW-INTEGRITY-AUDIT.md`). 아래는 실제 구현·검증 기록.

dev-harness 19번째. Community 트랙 2번째(Data identity & cell feedback).

## ★ 검증-우선 (사용자 "하나하나 체크")
getRowId(0건)·cell-flash(0건)·cell-tooltip(셀 title 없음, RangeChart만) **모두 실재 미구현 확인 후** 구현.

## design (advisor)
**getRowId=keystone**(cell-flash/transaction 이 행 식별 필요 → 먼저). `computeChangedCells`=진짜 순수 spine,
getRowId/tooltip=passthrough browser-only 정직(node 안 지어냄).

## Goals (실제 구현 기록)
- **G-1 getRowId 안정 식별**: `getRowId?(row,index)→string` → `buildTableOptions` `options.getRowId`.
  RowSelectionState·expanded 행-키 상태가 인덱스 대신 id(reconciliation).
  - AC: B 선택→맨앞 Z 추가→B(now idx2) 선택 유지(정체성 추종)·Z/A 비선택·정확히 1행(인덱스-키 버그 검출).
- **G-2 cell 변경 flash**: 순수 `computeChangedCells({prev,next,getRowId,columns})`→변경 셀 키[](rowId·colId).
  `enableCellChangeFlash?` + Grid data effect→~0.9s 인라인 amber bg+data-flash. getRowId 없으면 인덱스 fallback.
  - AC: edit=정확 셀·reorder=무(정체성)·reorder 내 edit 추적·새행 제외·Object.is NaN→NaN 무시.
- **G-3 cell 툴팁**: `getCellTooltip?(cell,row)→string|undefined|null` → 본문 td `title`(undefined/'' 미부여).
  AG `tooltipValueGetter` 패턴.
  - AC: title=셀 값 반영(행별 상이)·undefined 컬럼=title 없음.

## constraints
**MIT**(grid-core). 외부 dep 0. LESS-006: computeChangedCells=node spine·getRowId/tooltip=passthrough browser-only 정직.
★keystone 순서(getRowId 먼저→flash 가 그 위 정체성 diff: 인덱스-키면 재정렬마다 전체 점등=버그).

## 의존
grid-core(기존). 신규 dep 0. reuse: 기존 selection·cell 렌더 경로 확장(신규 store 0).

## 분류 (MASTER §2)
computeChangedCells=종결형(순수) · getRowId/tooltip=연결형(passthrough).

## 결과 (완료 — 2026-06-05, §3 이관)
- **G-1**: chromium **1**(B 선택→Z prepend→B[idx2] 유지·Z/A 비선택·정확히 1행=인덱스-키 버그 검출). passthrough browser-only 정직.
- **G-2**: node **7/7**(edit 정확·reorder 무·reorder 내 edit·새행 제외·다중·NaN 무시) + chromium **2**(edit→그 셀만 flash·
  reorder→flash 0개=인덱스-키면 전체 점등될 버그 차단).
- **G-3**: chromium **1**(title=셀 값[사과/바나나 행별]·undefined 컬럼=title 없음). 네이티브 title browser-only.
- **합계**: node 7+chromium 4. 회귀 69/69. typecheck 0.
- **vN**: applyTransaction(증분)·async batching=Community-tier지만 table-stakes 초과(getRowId 토대지만 트랜잭션 API 별도 무게).
