# MOD-GRID-39 — Row pinning (사용자 행 고정: top/bottom sticky 3분할)

> ⚠ **소급 작성(retroactive backfill, 2026-06-06)**: 구현 이후 state.json·git·MASTER §3 에서 재구성.
> MOD-34~39 정식 specify 건너뜀(→ `docs/internal/WORKFLOW-INTEGRITY-AUDIT.md`). 아래는 실제 구현·검증 기록.

dev-harness 22번째. Community 트랙 5번째(Row pinning UX).

## ★ scope / 위험관리 (advisor)
**비-가상화 전용**(가상화+핀=vN, 기존 연기 일관 — 가상화 윈도에 핀 행 제외 복잡). **최고위험 파일**(Grid.tsx 본문
렌더) 변경 → `renderDataRow` **추출**로 핀 OFF byte-identical 보장(회귀 75/75 무변 확인 후 진행).

## Goals (실제 구현 기록)
- **G-1 enableRowPinning + sticky**: `enableRowPinning?`→TanStack rowPinning+keepPinnedRows. `renderDataRow` 추출(핀
  행=center 행 동일 마크업, sticky). 핀 ON=getTopRows(sticky)+getCenterRows+getBottomRows(sticky).
  - AC: top 고정→sticky pinned-row=첫행·center 제외.
- **G-2 RowPinButton**: `RowPinButton{row}` 상/하단/해제→`row.pin`. ★stopPropagation(행클릭 선택 충돌 방지). 인라인 스타일.
  - AC: bottom→마지막행+pinned-bottom·unpin→center 복귀.
- **G-3 3분할**: getTopRows/getCenterRows/getBottomRows. center=전체−(top∪bottom).
  - AC: 동시 top+bottom 핀→center=정확히 나머지(두 핀행 제외·중복 없음).

## constraints
**MIT**(grid-core). 외부 dep 0. ★최고위험 파일(Grid.tsx 본문 렌더)=renderDataRow 추출로 핀 OFF byte-identical.
비-가상화 전용. RowPinButton stopPropagation(선택 충돌 방지). 전부 행동 게이트(browser).

## 의존
grid-core(기존). 신규 dep 0. keepPinnedRows=passthrough.

## 분류 (MASTER §2)
renderDataRow/3분할=종결형(렌더) · RowPinButton=연결형+트리거(row.pin 위임).

## 결과 (완료 — 2026-06-05, §3 이관)
- **G-1**: chromium **1**(top 고정→sticky pinned-row=첫행·center 제외).
- **G-2**: chromium **1**(bottom→마지막행+pinned-bottom·unpin→center 복귀).
- **G-3**: chromium **1**(동시 top+bottom 핀→center=정확히 2[두 핀행 제외·중복 없음]).
- **합계**: chromium 3(★renderDataRow 추출로 핀 OFF byte-identical). 회귀 78/78. typecheck 0.
- **vN**: 가상화+핀(가상화 윈도에 핀 행 제외 복잡).
