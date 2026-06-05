# MOD-GRID-38 — Column menu (헤더 드롭다운: 정렬 → pin → hide 액션)

> ⚠ **소급 작성(retroactive backfill, 2026-06-06)**: 구현 이후 state.json·git·MASTER §3 에서 재구성.
> MOD-34~39 정식 specify 건너뜀(→ `docs/internal/WORKFLOW-INTEGRITY-AUDIT.md`). 아래는 실제 구현·검증 기록.

dev-harness 21번째. Community 트랙 4번째(Column menu, advisor 지정·**vacuity-prone**).

## ★ design (advisor — vacuity-prone)
**행동 게이트 규칙**: "정렬 실제 수행·pin 실제 이동·hide 실제 제거", **"메뉴 열림" 금지**. 헤더 상호작용 제약
(col-virt·ARIA·floating filter·기존 multi-sort 클릭 핸들러) 때문에 **독립 모듈** — 소비자가 header 에 배치(MultiFilter
패턴, 헤더 파이프라인 미접촉). native `<details>`(Radix 없음 C-22), 인라인 스타일(P27-1).

## Goals (실제 구현 기록)
- **G-1 정렬 액션**: `ColumnMenu{column}` native `<details>/<summary>` + 정렬(오름/내림/해제)→`column.toggleSorting/
  clearSorting`. ★모든 상호작용 stopPropagation(th sort 핸들러 충돌 방지).
  - AC: 메뉴 열기는 정렬 안 함(stopPropagation 검증)·'오름차순'→실제 행 재정렬 A,B,C+aria-sort·'내림차순'→C,B,A.
- **G-2 pin 액션**: pin 아이템 `column.pin('left'|'right'|false)`, getCanPin/getIsPinned 조건. 핀 DOM 순서
  [pinnedLeft,center,pinnedRight].
  - AC: '왼쪽 고정'→점수가 첫 컬럼으로 실제 이동·'고정 해제'→center 복원.
- **G-3 hide 액션**: hide 아이템 `column.toggleVisibility(false)`, getCanHide 조건.
  - AC: '숨기기'→점수 컬럼 실제 제거(thead th 2→1·행 td 2→1).

## constraints
**MIT**(grid-core). peerDep **0**(native details, Radix 없음 C-22). 인라인 스타일(P27-1 Tailwind-less inert 회피).
★vacuity-prone → 전부 **행동 게이트**(DOM 효과 단언, "메뉴 열림" 금지). 핵심 버그=메뉴가 th 안→stopPropagation.

## 의존
grid-core(기존). 신규 dep 0. 소비자가 header 에 배치(헤더 파이프라인 미접촉).

## 분류 (MASTER §2)
ColumnMenu=연결형+트리거(column API 위임).

## 결과 (완료 — 2026-06-05, §3 이관)
- **G-1**: chromium **1**(메뉴 열기는 정렬 안 함[stopPropagation]·'오름차순'→A,B,C 재정렬+aria-sort·'내림차순'→C,B,A).
- **G-2**: chromium **1**('왼쪽 고정'→점수 첫 컬럼 실제 이동·'고정 해제'→center 복원).
- **G-3**: chromium **1**('숨기기'→점수 컬럼 실제 제거: thead th 2→1·행 td 2→1).
- **합계**: chromium 3(순수 로직 0=browser-only 정직). 회귀 75/75. typecheck 0.
- **vN**: 메뉴 내 filter 액션=floating/multi filter 별도 컴포넌트(메뉴 범위 밖).
