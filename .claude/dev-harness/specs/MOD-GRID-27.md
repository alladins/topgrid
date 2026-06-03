# MOD-GRID-27 spec — 컬럼(가로) 가상화 (**MIT**, grid-core 렌더-엔진, partial §10.3)

> dev-harness loop 8번째. MOD-24 에서 분리(컬럼 가상화 = 표시 helper 아닌 grid-core **렌더-엔진 인프라**). weight=Full. **partial(§10.3)**: **본 라운드 = G-1 만**(`computeColumnWindow` 순수 코어). **G-2(Grid.tsx 렌더 재작성)는 별도 세션/사용자 콜**(advisor — 중심 파일 렌더 재작성 + 느린 chromium 매트릭스, 저-컨텍스트 착수 금지).
> reuse-gate: grid-core 가 **행** 가상화 보유(`useGridVirtualizer` = vertical `useVirtualizer`, count=rows, padding-`<tr>` 패턴) + **컬럼 핀** 보유(`enableColumnPinning`, `getPinnedCellStyle`, TanStack `getIsPinned`/`getLeft/Center/RightLeafColumns`). 컬럼(가로) 가상화는 **부재** → 신규. 가로 아날로그: horizontal `useVirtualizer` + 행마다 padding-`<td>`(좌/우) + **핀 컬럼 강제 렌더**.

## ★ 핵심 불변식 (fork 아님 — advisor)
**핀 컬럼은 가상화 집합에 절대 포함되지 않고 항상 렌더된다. padding 은 스킵된 *center* 컬럼 너비만 합산하고, 핀 컬럼 너비는 절대 포함하지 않는다.** 이를 G-1 코어에 인코딩하고 node 로 검증한다(렌더타임 특수처리로 미루지 않음). 핀-컬럼-항상-렌더가 가로 스크롤에서만 드러나는 chromium-only 결함의 원천이므로, 포함 로직을 node 에서 결정적으로 못박으면 chromium 의 일은 "sticky CSS 가 실제 스크롤서 유지되나"로 축소된다.

## Goal
대용량(100+) 컬럼 그리드의 렌더 비용 절감 — 화면 밖 center 컬럼 미렌더(가로 가상화), 핀 컬럼은 항상 렌더. 경쟁: AG Grid column virtualization.

## Scope (모듈 전체 — Goal 단위 partial)
- **In(G-1, 본 라운드)**: `internal/computeColumnWindow`(순수) + (thin) `internal/useColumnVirtualizer`(horizontal `useVirtualizer` wiring, `useGridVirtualizer` mirror). **Grid.tsx 미접촉**.
- **In(G-2, 별도 세션)**: Grid.tsx thead/tbody 가로 가상화 렌더(`[pinned-left][leftPad td][window center][rightPad td][pinned-right]`, 헤더+바디 양쪽), 세로 padding-row 패턴과 공존, `enableColumnVirtualization` opt-in prop. **chromium 매트릭스 검증**(핀-좌/우 유지·헤더↔바디 정렬·세로+가로 동시·resize 중).
- **Out(v1)**: **그룹/다단(multi-row) 헤더 + 컬럼 가상화 비양립** → v1 = **flat leaf 헤더 전용**(그룹 헤더 가상화는 v2 문서화 — group colSpan 회계가 복잡도 배수). 가로 스크롤 sticky CSS 세부(G-2).

## Goals
- **G-1 `computeColumnWindow`(순수) — ★본 라운드**:
  - 입력: `{ leafColumnIds: string[](순서), columnWidths: Record<id,px>, pinnedLeftIds: string[], pinnedRightIds: string[], centerStartIndex: number, centerEndIndex: number(inclusive) }`. (center = leaf − pinned, 순서 보존. start/end = 가로 virtualizer 의 center 인덱스 범위.)
  - 출력: `{ renderedColumnIds: [...pinnedLeftIds, ...windowCenter, ...pinnedRightIds], leftPadPx, rightPadPx }`. leftPad = 윈도 앞 스킵 center 너비 합, rightPad = 윈도 뒤 스킵 center 너비 합. **핀 너비 미포함**.
  - (thin) `useColumnVirtualizer(centerColumnSizes: number[], scrollRef, enabled, options?)`: `useVirtualizer({horizontal:true, count, estimateSize:i=>sizes[i], overscan})` — `useGridVirtualizer` mirror. enabled=false 시 count=0(rules-of-hooks).
  - 종결형(순수).
- **G-2 Grid.tsx 가로 가상화 렌더(별도 세션)** — planned.

## AC (G-1 — 측정 가능, node 검증)
1. **핀 불변식**: center 윈도가 어떤 핀 컬럼도 포함하지 않아도 `renderedColumnIds` 는 전 pinnedLeft+pinnedRight 를 포함(항상). 핀 컬럼이 center 인덱싱에서 제외됨.
2. **padding = center-only**: leftPad/rightPad 는 스킵된 center 컬럼 너비 합이며 **핀 컬럼 너비 0 기여**.
3. **순서**: `renderedColumnIds` = pinnedLeft(순서) → windowCenter(순서) → pinnedRight(순서).
4. **경계**: 윈도가 center 시작/끝/전체; center 빈 배열(전부 핀); pinnedRight 만; 단일 center.
5. **width 일관**: `columnWidths` 누락 id → 0 취급(또는 명세된 기본). 합산 정확(±0, 정수 px).
6. **MIT**: grid-core 내부(신규 패키지 없음), 외부 dep 0. `tsc` 0 + grid-core build. (G-1 은 Grid.tsx 미접촉 → 회귀 0 자명; opt-in prop 은 G-2.)

## constraints
- **POL-TANSTACK**: center/pinned 분리는 TanStack 컬럼 핀 API(`getLeft/Center/RightLeafColumns`/`getIsPinned`) 기반(G-2 wiring). G-1 코어는 id/width 순수 입력.
- **C-003**: 주석/문서 ↔ 소스 동기. flat-header v1 한계 명시.
- **MIT 경계**: Pro 코드 0. 발행물 금지어 0.
- **AP-001**: G-1 외부 optional peer import 0(react-virtual 은 grid-core 기존 peer — useColumnVirtualizer 만, 기존 useGridVirtualizer 와 동일 peer).

## 의존
grid-core 내부. peer 변경 0(react-virtual 기존). 신규 dependency 0.

## 분류 (MASTER §2)
computeColumnWindow = 종결형(순수) · useColumnVirtualizer = 연동형(react-virtual wiring).

## ★ Commit C 재개 플랜 (새 세션 — 헤더 윈도잉 + chromium 매트릭스)

> **현황**: G-1(순수 코어) + G-2 Commit A·B 완료·커밋. 작업 트리 clean. 남은 것 = Commit C.
> **커밋**: G-1 `6d24d95` · A `346931f`(본문 라우팅, byte-identical 7/7) · B `bfdd804`(opt-in 배선) · 진행기록 `7bdbe3f`.

### 현재 코드 상태 (재개 시 읽을 것)
- `packages/grid-core/src/internal/computeColumnWindow.ts` — 순수 코어. 출력 = `{pinnedLeftIds, windowCenterIds, pinnedRightIds, leftPadPx, rightPadPx, renderedColumnIds}`. node 18건 검증됨.
- `packages/grid-core/src/internal/useColumnVirtualizer.ts` — 가로 virtualizer(center만).
- `packages/grid-core/src/Grid.tsx`:
  - 컬럼 파티션 계산(`visibleLeaf`/`pinnedLeftIds`/`pinnedRightIds`/`columnWidths`/`centerColumns`/`centerSizes`/`fullWindowArgs`) + `columnVirtEnabled`(flat-header 게이트) + `useColumnVirtualizer` 호출 + `columnWindow`(full|virtual) — 약 L257~ 영역.
  - `renderWindowedCells(row, window, {withHandlers, withCellClassName})` — 본문 3경로(virtual/plain/floating)가 사용. **헤더는 아직 미사용**(전 헤더 렌더).
  - `<thead>` L430~ : `getHeaderGroups().map(group => group.headers.map(header => <th>…large block…))` — **이 헤더 블록이 Commit C 대상**.
- `props.enableColumnVirtualization`(types.ts, experimental 표기).

### Commit C 작업 (순서)
1. **헤더 윈도잉**:
   - `<th>` 렌더 블록(L433~471 sort/drag/resize/colSpan)을 컴포넌트 내 `renderHeaderCell(header)` 클로저로 **verbatim 추출**.
   - flat 헤더(`columnVirtEnabled` 且 `getHeaderGroups().length===1`)일 때만 윈도잉: 단일 헤더그룹의 `headers` 로 `Map<column.id, header>` 구성 → `renderWindowedCells` 와 동일 세그먼트 순서(`columnWindow.pinnedLeftIds`→leftPad `<th>`→`windowCenterIds`→rightPad `<th>`→`pinnedRightIds`)로 `<th>` 방출. pad `<th>` = `aria-hidden` + `style={{width: leftPadPx/rightPadPx}}`.
   - 그룹 헤더 또는 off → 기존 `headers.map(renderHeaderCell)` 그대로(byte-identical).
   - **게이트**: OFF byte-identical 재확인(아래 하네스). 헤더 추출이 출력 안 바꿈을 증명.
2. **스토리**: `packages/grid-core/stories/Grid.floating-rows.stories.tsx` 또는 신규 — 20+ 컬럼(`createColumns([{id,name,type}…])` — **`{accessorKey,header}` 금지**: render throw, MOD-24 spike 교훈) + 핀(좌/우) + `enableColumnVirtualization: true` + 가로 스크롤 컨테이너(폭 제한). 세로+가로 동시 케이스도.
3. **chromium 매트릭스**(`tests/visual/*.spec.ts`): 가로 스크롤 후 ①off-screen center 컬럼 미렌더(DOM에 없음) ②핀 좌/우 항상 존재 ③헤더↔바디 같은 컬럼 집합·정렬 ④pad 폭 합 일관 ⑤세로+가로 동시 ⑥resize 중. **non-vacuous** 단언(윈도잉 안 되면 실패).

### chromium 실행 절차 (LESS-002 기록 — 검증됨)
```
pnpm -F docs build-storybook                              # storybook-static/ 생성(~40s)
node <static-server> apps/docs/storybook-static 6006      # :6006 정적 서빙 (또는 pnpm -F docs storybook 개발서버)
pnpm -F docs exec playwright test -c ../../playwright.config.ts <filter> --reporter=list
#   ↑ @playwright/test 는 apps/docs cwd 에서만 resolve. story 는 #storybook-root 아래, iframe ?viewMode=story.
#   서버 종료: PowerShell Get-NetTCPConnection -LocalPort 6006 → Stop-Process.
```

### OFF byte-identity 하네스 (Commit C 게이트 — 재생성용)
node `renderToStaticMarkup` 로 grid-core 마운트(react 단일 resolve, LESS-002). committed 상태를 `git stash` 로 baseline 저장 → 편집 → 비교. 7케이스(basic/sortable/pinned/floating/virtual/pinnedFloating/empty) + 컬럼-virt-on 케이스. (이전 세션 `.bineq.mjs` 패턴 — 커밋 안 함, 재생성.)

## 수확 예상 (capture 시 검증 — G-1)
reuse = **PAT-001**(순수 helper) + `useGridVirtualizer` 패턴(mirror) + TanStack 핀 API. floating-rows(MOD-24 G-2)·findReplace(MOD-23 G-3)에 이은 **"위험·가치를 순수 함수로 집중 → node 검증, 렌더는 thin"** 반복(PAT 후보? N 점검). 신규 lesson 후보 미정(클린일 수 있음). **partial**: G-1 코어 commit 후 **G-2 는 별도 세션**(advisor — 중심 파일 렌더 재작성, chromium 매트릭스).
