# MOD-GRID-37 — Sorting options (locale 정렬 → 방향-독립 null 배치 → alwaysMultiSort/sortDescFirst)

> ⚠ **소급 작성(retroactive backfill, 2026-06-06)**: 구현 이후 state.json·git·MASTER §3 에서 재구성.
> MOD-34~39 정식 specify 건너뜀(→ `docs/internal/WORKFLOW-INTEGRITY-AUDIT.md`). 아래는 실제 구현·검증 기록.

dev-harness 20번째. Community 트랙 3번째(Sorting options, advisor: 저blast·sorting 격리).

## design (advisor)
**thin-passthrough 골은 node 지어내지 않고 browser-only 정직, 실 로직 골만 node spine.** G-2 fork=`blankToUndefined`
헬퍼 ship(doc-only 🟡 거부 — 실제 레버 제공).

## Goals (실제 구현 기록)
- **G-1 locale 정렬**: `localeSortingFn`/`makeLocaleSortingFn(locale)`/`compareLocale`(localeCompare numeric+variant).
  `columnDef.sortingFn` 으로 사용.
  - AC(non-vacuous): locale 순서가 code-point 와 **DIFFER** — é 는 e·f 사이(locale) vs z 뒤(code-point)·numeric a2<a10·한글 자모순.
- **G-2 방향-독립 null 배치**: 순수 `isBlank`(null/undefined/''/공백→true, 0/false→false)+`blankToUndefined`(accessor).
  컬럼 accessorFn=blankToUndefined + sortUndefined:'last'.
  - ★fork(advisor): `sortUndefined` 는 `===undefined` 만·방향-독립이나 null 미처리. sortingFn 으론 desc flip 때문에
    방향-독립 불가 → blank→undefined 정규화가 유일 레버. option(b) ship.
  - AC: 0→0·false→false 통과(falsy 버그 차단)·null/''/공백→undefined·null 행 desc/asc 양방향 하단 고정(방향-독립).
- **G-3 alwaysMultiSort/sortDescFirst**: `alwaysMultiSort?`→`isMultiSortEvent:()=>true`(shift 없이 다중 정렬 누적)·
  `sortDescFirst?` passthrough. buildTableOptions.
  - AC: shift 없이 순차 클릭→둘 다 aria-sort 활성(누적, 교체-onclick divergence). browser-only 정직(passthrough).

## constraints
**MIT**(grid-core). 외부 dep 0. LESS-006: G-1 localeCompare·G-2 blank=node spine·G-3 thin-passthrough=browser-only 정직.
★passthrough≠가짜 ✅(G-2 fork 에서 헬퍼 ship 으로 doc-only 🟡 거부).

## 의존
grid-core(기존). 신규 dep 0.

## 분류 (MASTER §2)
compareLocale/isBlank/blankToUndefined=종결형(순수) · alwaysMultiSort/sortDescFirst=연결형(passthrough).

## 결과 (완료 — 2026-06-05, §3 이관)
- **G-1**: node **8/8**(é locale 위치·numeric a2<a10·한글 자모·antisymmetric) + chromium **1**(정렬 후 e,é,f,z=locale).
- **G-2**: node **11/11**(0/false 통과=falsy 버그 차단·null/''/공백→undefined) + chromium **1**(null 행 desc·asc 양방향 하단
  고정=방향-독립·숫자 desc-first).
- **G-3**: chromium **1**(shift 없이 순차 클릭→둘 다 aria-sort 활성=누적). browser-only 정직.
- **합계**: node 19+chromium 3. 회귀 72/72. typecheck 0.
