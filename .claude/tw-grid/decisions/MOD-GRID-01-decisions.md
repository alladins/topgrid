# MOD-GRID-01 — Architecture Decisions

본 문서는 MOD-GRID-01 (wrapper) Goals 의 ADR(Architecture Decision Record) 를 누적 기록한다.

---

## ADR-MOD-GRID-01-001: G-001 — 외부 라이브러리 추가 없음

**Date**: 2026-05-14
**Status**: Accepted
**Goal**: G-001 (`<Grid data columns>` 단일 API + `enable*` 토글)

### Context

G-001 은 `@tomis/grid-core` 에 단일 `<Grid>` 컴포넌트 + 4 export type 을 추가한다.

### Decision

신규 외부 라이브러리(dependency / devDependency) 를 **추가하지 않는다**. TanStack
Table v8 (`@tanstack/react-table`), React, ReactDOM 은 모두 이미 `package.json`
의 `peerDependencies` 에 선언되어 있다 (G-001 spec Section 9).

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| `@tanstack/react-virtual` 을 본 Goal 에 함께 wiring | spec D6 에 따라 virtualization 은 G-004 범위 — 사용처 영향 0 유지 + 번들 한도 +9 KB 예산 보호 |
| custom `clsx` 등 className 병합 라이브러리 도입 | template literal 로 충분 (조건부 className 는 ternary). C-21 번들 30 KB 한도 보호 |

### Trade-off

- Pro: 신규 dependency 없음 → C-9/C-20 ADR 게이트 영향 최소화. 번들 +6.7 KB
  (실측 17.44 KB / 한도 30 KB) 로 후속 G-002~G-005 예산 21 KB 보장.
- Con: 향후 className 결합/조건부 스타일이 복잡해지면 utility 도입 검토 필요 — G-002 시점에 재평가.

### Consequences

- `package.json` `dependencies` 빈 배열 유지 (peer-only) — C-22 정책 부합.
- `peerDependencies` 4종 (`react`, `react-dom`, `@tanstack/react-table`,
  `@tanstack/react-virtual`) 변경 없음.
- 본 ADR 자체가 C-9/C-20 의 "외부 라이브러리 추가 시 ADR 의무" 요구사항의 negative case
  (= "추가 없음을 명시적 결정") 로 작용 — 추후 Goal 에서 dep 추가 검토 시 비교 기준.

---

## ADR-MOD-GRID-01-002: G-001 self-review — goals.json 경로 prefix 오류 cascade 차단 정책 (C-28 신설)

**Date**: 2026-05-14
**Status**: Accepted
**Goal**: G-001 (self-review)

### Context

G-001 spec writer 가 `wrapper-goals.json` `implementFiles[0]` 의 prefix
(`D:/project/topvel_project/TOMIS/packages/...`) 가 실제 monorepo 위치
(`D:/project/topvel_project/topvel-grid-monorepo/packages/...`) 와 불일치함을 발견 (D2 결정).
self-review 단계에서 다른 모듈도 동일 패턴인지 Grep 검증한 결과, **17개 다른 모듈
goals.json (MOD-GRID-02~16, MOD-GRID-99-A, MOD-GRID-99-B) 모두 동일 잘못된 prefix 잔존**
확인.

### Decision

C-28 (`constraints.md` 신설) 으로 cascade 차단:
1. spec writer 의무 — 잘못된 prefix 발견 시 spec.md D# 표 + Section 7 에 정정 결정 명시
2. Implementer 의무 — spec 본문 우선 (C-27 권위)
3. 메인 오케스트레이터 권장 — 후속 모듈 specify 시작 전 `goals.json` 일괄 정정

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| 17개 `goals.json` 즉시 일괄 정정 (search-replace) | 본 self-review 는 G-001 cascading 분석 단계이며 다른 모듈 변경은 별도 명시적 작업으로 분리 권장 (수술적 변경 — C-1 의 self-review 적용) |
| spec.md 본문에서만 처리하고 C-28 미신설 | 17개 모듈 모두 동일 패턴 확인됨 — 각 모듈 spec writer 가 같은 발견을 반복할 위험. cascading 차단을 위한 정책 강제가 효율적 |
| H-02 의 "외부 디렉토리 예외" 룰만 의존 | H-02 는 spec writer 자가 점검 — 빠뜨릴 위험. 명시적 C-28 으로 메인/spec/Implementer 3 자 모두 의무화 |

### Trade-off

- Pro: 17개 모듈 후속 spec/implement 단계에서 동일 발견 반복 차단. spec writer 가 H-02 self-validation 시 C-28 1줄 인용으로 처리 단순화.
- Con: 후속 모듈 spec writer 가 C-28 미숙지 시 여전히 잘못된 prefix 복사 위험 — Coverage Verifier 가 H-02 NO 처리로 차단 (방어선 2중).

### Consequences

- `constraints.md` 에 C-28 추가 (실제 적용됨).
- 위반 시 처리 표에 C-28 행 추가 (실제 적용됨).
- 17개 다른 모듈 `goals.json` 일괄 정정은 **별도 후속 작업** 으로 분리 — `findings/` 또는 `tasks/` 항목 생성 권장 (본 self-review 범위 외).
- 후속 모듈 spec writer 는 specify-rubric H-02 자가 점검 시 C-28 적용 여부 확인 의무.

---

## ADR-MOD-GRID-01-003: G-002 — Sticky/pinning/resize 통합 결정 (D2/D4/D7)

**Date**: 2026-05-14
**Status**: Accepted
**Goal**: G-002 (sticky header + sticky pinned columns + columnResizing onChange)

### Context

G-002 는 G-001 위에 (a) `<thead>` sticky, (b) pinned column sticky CSS, (c) column
resize handle 3 종을 추가한다. CSS sticky × `border-collapse` 비양립 / 별도
`StickyHeader` 컴포넌트 추출 가치 / G-005 까지 누적 번들 한도 위험 — 3 가지를
사전 결정해야 spec drift 차단 가능.

### Decision

- **D2** — `enableColumnPinning=true` 시 `<table>` className 을
  `border-separate border-spacing-0` 으로 분기. `position: sticky` × `border-collapse: collapse`
  비호환 (셀 border 분리 / sticky offset 점프) 회피. 디폴트 (`enableColumnPinning=false`)
  는 G-001 `divide-y divide-gray-200` 보존 — 기존 외관 회귀 0.
- **D4** — file manifest = NEW 2 (`computePinnedOffset.ts`, `ResizeHandle.tsx`) +
  MODIFY 4 (`Grid.tsx`, `types.ts`, `internal/buildTableOptions.ts`, `index.ts`).
  `internal/StickyHeader.tsx` 는 wrapper-goals.json 에 명시되어 있으나 thead 인라인
  className 만으로 충분 (별도 추출 시 G-001 markup 분리 비용 > 이득). spec 본문
  권위 (C-27).
- **D7** — `@tomis/grid-core` 번들 한도 30 KB brotli 유지. G-001 17.44 KB +
  G-002 +0.6 KB (실측) ≈ 18 KB. G-003 (+3) / G-004 (+7) / G-005 (+5) 누적 시
  ~33 KB 예상 → **G-004 implement 직전 size-limit 측정 후 25 KB 초과 시 G-005
  alias 를 `@tomis/grid-core/legacy` sub-entry 로 분리** (Option A) 또는 별도
  `@tomis/grid-legacy` 패키지로 분할 (Option B). 본 Goal 은 한도 내 통과.

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| `<table>` 항상 `border-separate` 강제 | 디폴트 (`enableColumnPinning=false`) 외관 회귀 발생 — `divide-y` 미동작. C-1 보존 의무 위반 |
| `<StickyHeader>` 별도 컴포넌트 추출 | G-001 의 `table.getHeaderGroups().map`/`flexRender` 통합 markup 이 분리되어 가독성 손상 + 번들 함수 1 개 추가 (~0.3 KB). spec D4 본문 권위 (C-27) 로 미생성 결정 |
| G-002 단계에서 즉시 `@tomis/grid-core/legacy` 분리 | 본 Goal 은 18 KB / 30 KB (60%) 로 한도 내 — 조기 최적화 (premature optimization). G-004 까지 측정 후 결정이 효율 |

### Trade-off

- Pro: D2 분기로 외관 회귀 0 + sticky 정상 동작. D4 file 6 개로 변경 surface 최소화.
  D7 으로 G-005 까지의 한도 위험을 G-004 시점에 측정 후 결정 → 본 Goal 에서 근거
  없는 분리 회피.
- Con: D2 분기 로직이 `Grid.tsx` 에 `usePinning` 분기 3 곳 (`tableClassName`,
  `tbodyClassName`, `rowBorderClassName`) 생성 — 유지보수 시 한 곳 누락 위험.
  G-005 spec 작성 시 D7 측정 결정 게이트 의무.

### Consequences

- `Grid.tsx` `usePinning` flag 일관 적용 → 렌더 분기 3 곳 (위) + thead/tbody pinned
  cell style 적용 (`getPinnedCellStyle()`). 모든 분기는 D6 (G-001 보존) 조건 — 디폴트
  외관 변동 0 보장.
- `wrapper-goals.json` G-002 `implementFiles[1]` `internal/StickyHeader.tsx` 미사용
  — D4 spec 본문 권위 (C-27). 후속 `goals.json` 정정 권장.
- 번들 측정값 (18 KB / 30 KB) → `decisions/MOD-GRID-01-decisions.md` 또는
  `findings/` 에 G-005 spec 작성 시 재인용. G-004 size-limit 측정 게이트 의무
  (D7 합의).

### Confidence

- **high** — D2 는 브라우저 표준 알려진 비양립 (`position: sticky` × `border-collapse`)
  대응. D4 는 spec 본문 + advisor 사전 검토. D7 은 실측 18 KB 기반 산술.

### Pattern Catalog Note (G-002 self-review 2026-05-14)

**Sticky CSS × border-collapse 분기 패턴** — 본 D2 결정은 1회 발생. **카탈로그 ADR (ADR-MOD-GRID-01-004) 으로 elevate 하지 않음** — single occurrence 는 정책 일반화 근거 부족.

**재발 시 elevate 트리거**: MOD-GRID-04 (column ops) / MOD-GRID-13 (cell merging) / MOD-GRID-14 (header grouping) 중 어디든 sticky CSS + table layout 관련 분기를 다시 적용하면 본 패턴을 ADR-MOD-GRID-00-XX (cross-module pattern catalog) 로 promote. 그 전까지는 본 ADR-003 의 D2 결정 자체가 reference.

**근거**: tw-harness retrospective principle — 1 occurrence = anecdote, 2 occurrences = pattern, 3 occurrences = policy. G-002 self-review 시점 1 occurrence 만 있음 (G-001 외 sticky-related decision 무).

---

## ADR-MOD-GRID-01-004: G-003 — Loading skeleton + empty state slot + autoSelectFirstRow + onCellClick (D2/D5/D9/D12)

**Date**: 2026-05-14
**Status**: Accepted
**Goal**: G-003 (`loading` / `loadingRowCount` / `emptyState` / `autoSelectFirstRow` / `onCellClick` + `onRowClick`/`onRowDoubleClick` 시그니처 확장)

### Context

G-003 은 G-001/G-002 위에 (a) loading skeleton tbody 분기, (b) emptyState slot, (c) autoSelectFirstRow 훅, (d) onCellClick + onRow* event 인자 확장을 추가한다. wrapper-goals.json 의 file manifest (NEW 4) 와 spec 본문 분류 (NEW 3 + MODIFY 2) 가 불일치 + colSpan column count API 결정 + skeleton 적용 범위 (별도 table 회귀 vs tbody 만 치환) — 4 가지를 사전 결정해야 spec drift 차단 가능.

### Decision

- **D2** — file manifest = NEW 3 (`internal/Skeleton.tsx`, `internal/EmptyState.tsx`, `internal/useAutoSelectFirstRow.ts`) + MODIFY 2 (`Grid.tsx`, `types.ts`). `index.ts` 무수정 (신규 internal 모듈 비노출, 신규 prop 은 기존 `GridProps` re-export 로 자동 노출). wrapper-goals.json `implementFiles` (NEW 4 — Grid.tsx 포함) 와 분류 충돌은 spec 본문 권위 (C-27).
- **D5** — Skeleton 적용 범위 = `<tbody>` 만 치환. G-002 의 sticky thead + pinning 외관 보존. BaseGrid L108-137 의 "early-return 별도 `<table>`" 패턴은 채택 안 함 — sort/sticky/pinning 일관성 손상 회피.
- **D9** — `useAutoSelectFirstRow` deps = `[dataLength, enabled, selectionMode]`. AggridTable 의 `[rowData, autoSelectFirstRow]` 와 다름 — length 동일 다른 데이터 (server-side pagination 같은 pageSize) 에서 사용자 선택 보호 (재선택 X). 매 데이터 변경마다 재선택 의도 시 외부에서 `key` prop 권장.
- **D12** — colSpan + skeleton column count = `table.getAllLeafColumns().length`. G-001 inline empty markup 의 `getAllColumns()` 정정. group columns 부재 (현 G-001/G-002 상태) 에서 두 메서드 결과 동일 → 회귀 0. MOD-GRID-14 (multi-row header) 도입 시 `getAllColumns()` 는 group + leaf 모두 카운트 → colSpan 과다 (실제 td 영역 초과). leaf 정확 일치 보장.

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| Skeleton early-return 별도 `<table>` (BaseGrid 패턴 그대로) | G-002 sticky thead/pinning markup 회귀 발생 — D5 보존 의무 위반. C-1 surgical change 정신 위배 |
| `useAutoSelectFirstRow` deps `[data, enabled, selectionMode]` (AggridTable 그대로) | server-side pagination 시 같은 pageSize 다른 page 결과에서 사용자 선택 행이 매번 첫 행으로 reset — UX 회귀. length 정규화 채택 |
| `onRowClick` 시그니처 wrapper 객체 (`(args: { row, event }) => void`) | TanStack 표준 (단일 row 인자) 와 거리 + 호출부 boilerplate 증가. additive 확장 (event 파라미터 추가) 가 함수 contravariance 로 backward-compatible 충족 — wrapper 도입 불필요 |
| `index.ts` 에 internal 모듈 re-export | internal 디렉토리 모듈은 사용자 노출 의도 없음. 신규 prop 은 기존 `GridProps` re-export 로 자동 노출 — 추가 export 불필요 (D2) |

### Trade-off

- Pro: D2 file manifest 최소화 (5 파일) → 변경 surface 작음. D5 보존으로 G-002 회귀 0. D9 length 정규화로 server-side pagination 사용자 선택 보호. D12 정정으로 미래 multi-row header 호환 확보.
- Con: D9 deps 가 AggridTable 와 동작 차이 — 마이그레이션 시 사용자 의도 확인 필요 (EC-06 + JSDoc 명시로 완화). `index.ts` 무수정 결정은 D11 보존 의무 충족이지만, 추후 internal 모듈을 직접 사용하려는 외부 사용자에게는 진입점 부재 (현재 의도된 한계).

### Consequences

- 신규 외부 dep / peer 추가 0건 (`Cell`/`MouseEvent`/`ReactNode` 이미 peer 선언). C-9/C-20 ADR 게이트 영향 없음.
- 번들 측정 (G-003 implement 시점): `@tomis/grid-core` 18.35 KB / 30 KB (G-001 17.44 + G-002+G-003 누적 +0.91 KB 실측). spec 예상 누적 24.44 KB 보다 6 KB 여유. G-005 까지의 한도 위험 완화 — G-002 ADR-003 의 D7 measurement gate 는 여전히 유효하나 현재 추세상 분리 트리거 발동 가능성 낮음.
- D12 정정 1곳 적용: `Grid.tsx:173` (EmptyState colSpan). `Skeleton.tsx:45` 도 동일 API 사용 (신규 코드 — 정정이 아닌 직접 적용).
- `EmptyStateProps` 의 `slot`/`text`/`defaultText` 는 `exactOptionalPropertyTypes: true` 환경에서 `Grid.tsx` 의 `props.emptyText`/`props.emptyState` (자체로 `?:` optional) 직접 전달 호환을 위해 `string | undefined` / `ReactNode | undefined` union 명시 — buildTableOptions L104 의 conditional assembly 패턴과 다른 선택 (사용처가 JSX child 라 conditional spread 가독성 손상). 두 패턴 공존 — 내부 헬퍼 props 는 union 명시, TableOptions 는 conditional assembly.

### Confidence

- **high** — D2/D5/D9/D12 모두 spec advisor 사전 검토 + tsc 0 error + size-limit 통과 + 영향 사용처 0 (회귀 가능 표면 자체 부재).

### Pattern Catalog Note (G-003 implement 2026-05-14)

**`exactOptionalPropertyTypes: true` 환경 internal 헬퍼 props union 명시 패턴** — 본 implement 에서 1회 발생 (EmptyStateProps). conditional assembly (buildTableOptions L104) 패턴과 공존. **카탈로그 ADR 으로 elevate 하지 않음** — single occurrence + JSX child 가독성 trade-off 명시. 재발 시 (NEW internal 헬퍼가 optional string/ReactNode prop 을 외부 optional prop 에서 직접 받는 두 번째 사례 등장 시) ADR-MOD-GRID-00-XX 로 promote 검토.

### Pattern Catalog Note (G-003 self-review 2026-05-14) — TanStack v8 column count API 미세 차이

**`table.getAllColumns()` vs `table.getAllLeafColumns()` API 미세 차이** — 본 D12 결정 1회 발생 (G-001 inline empty markup 의 `getAllColumns()` 사용 → G-003 에서 `getAllLeafColumns()` 로 정정). 두 메서드는 group columns 부재 환경에서는 결과 동일하지만 MOD-GRID-14 (multi-row header) 도입 시 colSpan 과다 위험. **카탈로그 ADR 으로 elevate 하지 않음** — single occurrence (1 = anecdote 룰 적용, G-002 self-review 의 sticky CSS 보류 결정과 동일 정책).

**재발 elevate 트리거**: 다음 중 하나 발생 시 ADR-MOD-GRID-00-XX (cross-module pattern catalog) 로 promote:
1. MOD-GRID-14 (multi-row header) spec 작성 시 동일 결정 (group/leaf 구분 필요) 재등장 — 2 occurrences = pattern.
2. 다른 TanStack API 미세 차이(`getAllColumns` 외 `getRowModel().rows` vs `getCoreRowModel().rows` 등)가 별도 모듈에서 발견됨 — 카탈로그 형성 가능.

**현재 단일 occurrence 적용 형태**: D12 본문 + AC-001/AC-002 + Skeleton.tsx L45 + Grid.tsx L173 (EmptyState colSpan) — 본 ADR-004 D12 결정 자체가 reference 역할.

**근거**: tw-harness retrospective principle (1=anecdote, 2=pattern, 3=policy). G-002 self-review 의 사용 정책과 일치 — single occurrence 의 별도 ADR/카탈로그 신설은 가설성 인프라화.

---

## ADR-MOD-GRID-01-005: G-004 — `@tanstack/react-virtual` 첫 runtime wiring + Step 0 workspace devDep 설치 (D2/D5/D6/D7/D9/D10)

**Date**: 2026-05-14
**Status**: Accepted
**Goal**: G-004 (`forwardRef + GridHandle` ref API + `enableVirtualization` opt-in + virtualization wiring)

### Context

G-001 시점 `@tanstack/react-virtual ^3.0.0` 가 `grid-core/package.json:25` `peerDependencies` 에 선언되었으나 **runtime wiring 은 없었다** (G-001 ADR-001 본문 — "virtualization 은 G-004 범위" 명시). G-004 가 본 peer 의 첫 사용처. 또한 monorepo workspace `node_modules/@tanstack/` 디렉토리에 `react-table` 만 존재 (`react-virtual` 미설치) → typecheck 진행을 위해 **Step 0 사전 작업 = workspace devDep 설치** 필요. 본 결정은 (a) `react-virtual` 채택 정당성, (b) virtualization markup 패턴 (single-table padding-row vs 두-`<table>` absolute), (c) `enableVirtualization` 활성 정책 (opt-in vs auto-threshold), (d) Step 0 설치 방법 — 4 가지를 ADR 으로 누적 기록한다.

### Decision

- **D2 — `@tanstack/react-virtual ^3.13.24` Step 0 설치 채택** (workspace root devDep, AS-IS `tw-framework-front/node_modules/@tanstack/react-virtual/package.json:3` 동일 버전 매칭). peer 선언은 G-001 시점 이미 완료 — 본 G-004 는 첫 runtime wiring + workspace devDep 보강. peer 추가 선언 0건.
- **D5 — Single-table padding-row 패턴** 채택 (VirtualGrid.tsx:122-198 의 두-`<table>` + absolute-positioned `<tr>` 패턴 회피). 이유: G-002 sticky thead + pinned column 모델은 single `<table>` 가정 → 두-`<table>` 분리 시 회귀. padding row 는 `<tbody>` 첫/마지막 자식 `<tr>` 의 `height` = `virtualItems[0]?.start` / `totalSize - virtualItems[last]?.end` 로 영역 보존 + `aria-hidden="true"` + 빈 `<td colSpan={leafCount}>` 1개 (시각 영향 0).
- **D6 — `enableVirtualization` opt-in only** (자동 임계값 X). 사용자가 `virtualScrollHeight` 명시 + 의도적 활성. AggridTable `rowBuffer` 같은 자동 임계값은 short list 부적절성 (default container height 에서 unnecessary virtualization overhead) 회피.
- **D7 — `virtualScrollHeight` 미지정 시 default `400` + dev `console.warn` 1회**.
- **D9 — `scrollTo(index, options?)` clamp `[0, dataLength-1]` + dev warn 1회**. virtualizer 우선 + native DOM `scrollIntoView` fallback (data-index attribute querySelector).
- **D10 — 본 ADR 자체가 C-20 의무 충족** (peer 의 첫 wiring + workspace devDep 추가 = "외부 라이브러리 추가 시 ADR 의무" 동일 게이트 재사용).

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| **`react-window`** (가벼움 ≈2 KB) 채택 | (a) TanStack 생태계 일관성 손상 — `@tanstack/react-table` 와 같은 maintainer ecosystem 분리. (b) 동적 행 높이 미지원 (`measureElement` 부재) → 긴 텍스트 셀 대응 불가. (c) `useReactTable` ↔ `useVirtualizer` row index 매핑 패턴이 react-virtual 표준 — 타 라이브러리 매핑 별도 구현 부담 |
| **`virtua`** (최신 라이브러리) 채택 | 생태계 미숙 (npm weekly downloads `react-virtual` 의 5%, GitHub issue 응답 지연). 본 wrapper 의 SLA 보장 위해 maturity 우선 |
| **자체 가상화 구현** (외부 dep 0건) | 유지보수 부담 ↑ (스크롤 이벤트 + ResizeObserver + measureElement 동등성 직접 구현). C-21 번들 한도 초과 위험 (`react-virtual` peer external 시 grid-core 번들 영향 0 vs 자체 구현 시 +3~5 KB 직접 추가) |
| **두-`<table>` absolute 패턴** (VirtualGrid 그대로) | G-002 sticky thead + pinned column 회귀. `position: sticky` 가 두 별도 `<table>` 사이에서 동작 안 함. C-1 보존 의무 위반 |
| **자동 활성 임계값** (`data.length > 1000` → enableVirtualization 자동) | short list (<1000) 가 default container height 에서 사용자 의도 없이 가상화 — `virtualScrollHeight` 미설정 시 부적절. 사용자 책임 + opt-in 명시가 안전 (D6) |

### Trade-off

- **Pro**:
  - `@tanstack/react-virtual` MIT 라이선스 (peer 동일) — C-9/C-24 라이선스 정책 부합.
  - peer + tsup `external` 배열 이미 포함 (`tsup.config.ts:14-23`) → grid-core dist 번들 영향 0. 사용자가 별도 install 시 single shared instance 사용 (이중 번들 X).
  - measureElement 동적 행 높이 + `getVirtualItems`/`getTotalSize` API 가 padding-row 패턴에 직접 매핑 가능.
  - workspace devDep 설치는 monorepo `pnpm-lock.yaml` 1행 변경 — 수술적 변경.
- **Con**:
  - peer 정책 강제 — 사용자가 별도 `pnpm add @tanstack/react-virtual` 의무 (MOD-GRID-99-B 문서에 install 가이드 의무).
  - `enableVirtualization=false` 경로와 `=true` 경로의 markup 분기 (Grid.tsx tbody) → 유지보수 시 두 경로 외관 회귀 위험. EC-05 + Storybook `Grid/VirtualWithPinning` baseline 으로 완화.
  - rules-of-hooks 준수 위해 `useVirtualizer` 항상 호출 (`count=0` 으로 비활성화) → enabled=false 시도 useVirtualizer 실행 cost 발생 (미세). 미래 `react-virtual` API 가 conditional hook 지원 시 재평가.

### Consequences

- **번들 측정 (G-004 implement 직후, 2026-05-14)**:
  - `@tomis/grid-core` brotli **24.207 KB / 30 KB** (한도 80.7%, 여유 5.79 KB).
  - G-001~G-003 누적 18.35 KB → G-004 +5.86 KB (실측). spec D13 의 "trajectory 적용 +1~1.5 KB" 보다 훨씬 크지만 (forwardRef + 두 hook + tbody 분기 boilerplate 영향), 한도 30 KB 내 + G-005 분리 트리거 (25 KB) 미달 → **G-005 grid-core 내부 alias OK 권고**. G-005 spec 단계에서 +5 KB 예상 시 누적 ~29.2 KB → 한도 0.8 KB 여유. Implementer 재측정 의무 (D7 게이트 G-005 시점 재적용).
- **새 외부 dep 추가 0건 (peer 만)** — C-22 정책 부합. monorepo workspace devDep 1건 추가 (`@tanstack/react-virtual ^3.13.24`).
- **GridHandle public API 추가** — `getSelection`/`clearSelection`/`refresh`/`scrollTo`/`addRow`/`deleteRow`/`updateRow` 7 method. C-23 semver minor (forwardRef 변환은 ref optional → backward-compatible).
- **MOD-GRID-99-B 문서 의무 (후속)**: `peerDependencies` 4종 (react/react-dom/@tanstack/react-table/@tanstack/react-virtual) install 가이드 + `enableVirtualization` 사용 예시 + `GridHandle` API reference.
- **MOD-GRID-10 ChangeTrackingGrid alias 영향 0**: internal `trackedRows` state owner 라 base GridHandle 미사용 (자체 `ChangeTrackingHandle` 유지). 본 G-004 `controlled data 정책` (D3) 과 충돌 없음.

### Confidence

- **high** — D2/D5/D6/D7/D9 모두 spec advisor 사전 검토 + tsc 0 error + size-limit 통과 (24.21 KB / 30 KB) + 영향 사용처 0 (회귀 가능 표면 자체 부재).

### Pattern Catalog Note (G-004 implement 2026-05-14) — `process` global 의 minimal local declare 패턴

**`@types/node` 미설치 환경 + `process.env.NODE_ENV` dev 가드 패턴** — 본 implement 에서 2회 발생 (`Grid.tsx` + `useGridImperativeHandle.ts`). 각 파일 top 에 `declare const process: { env: { NODE_ENV?: string } } | undefined;` 1줄 + `typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production'` 가드. 

**카탈로그 ADR 으로 elevate 보류** — 2 occurrences 는 anecdote ↔ pattern 경계. G-005 implement 또는 다른 `internal/` 헬퍼에서 3번째 발생 시 `internal/devMode.ts` 헬퍼로 promotion 검토 (ADR-MOD-GRID-00-XX cross-module pattern catalog).

**근거**: tw-harness retrospective principle (1=anecdote, 2=pattern, 3=policy). 본 G-004 implement 가 2 occurrences 등록 — 다음 occurrence 발생 시 자동 promotion 후보.

### Pattern Catalog Note (G-004 implement 2026-05-14) — `exactOptionalPropertyTypes` union 명시 (재발 1)

**`exactOptionalPropertyTypes: true` 환경 internal 헬퍼 props `| undefined` union 명시** — 본 implement 에서 1회 발생 (`UseGridImperativeHandleParams<TData>` 의 3 callback fields). G-003 ADR-MOD-GRID-01-004 의 동일 패턴 (`EmptyStateProps`) 과 합쳐 **2 occurrences = pattern**.

**현재 적용 형태**: union 명시 + JSDoc 1줄 (G-001 buildTableOptions.ts L207 의 conditional assembly 패턴과 다른 선택 — 사용처가 JSX child 가 아닌 hook params 라 union 명시가 가독성 우수).

**3번째 occurrence 발생 시**: ADR-MOD-GRID-00-XX 로 promote 검토 (cross-module 헬퍼 props 정의 표준).

**근거**: 2 occurrences = pattern (anecdote 경계 통과). G-003 + G-004 모두 internal 헬퍼이라 일관성 가치 있음.

### Confidence — 환경 deviation 보고

- **Step 0 설치 환경 변경 보고**: spec D2 prompt 명령은 `pnpm add -DW @tanstack/react-virtual@^3.13.24` 였으나, 본 환경에서 (a) `pnpm` CLI 글로벌 미설치 + (b) corepack EPERM (admin 권한 부재) → `npx -y pnpm@8.15.0 add -D -w @tanstack/react-virtual@^3.13.24` 로 대체 (`-DW` 인식 안 됨 → `-D -w` 분리). 결과 동일 (workspace root devDep 1줄 추가 + pnpm-lock.yaml 업데이트). spec value drift 아님 (수단 변경, 결과 동일) — promptSpecDrift 미기록 (F-05 v1.0.4 structural reference 정책 적용 — 단순 CLI 인자 분리는 value drift 아님).

### Pattern Catalog Note (G-004 self-review 2026-05-14) — 번들 efficiency 는 size profile 의존

**번들 efficiency (실측 / spec 예상) 가 size profile 에 따라 5~8배 차이** — 본 self-review 시점 2 occurrences (정확히는 두 profile group) 입증:

| Profile group | 대표 Goals | spec 예상 평균 | 실측 평균 | efficiency |
|---------------|-----------|---------------|----------|-----------|
| same-profile (CSS class + props + hooks 추가) | G-001 / G-002 / G-003 | +13 KB (4+3+3 추정 합) | +18.35 KB - 17.44 = +0.91 KB | ≈10-15% |
| different-profile (forwardRef + virtual hooks + handle 함수 + tbody 분기 boilerplate) | G-004 | +7 KB | +5.86 KB | ≈84% |

**결론**: 두 profile 의 efficiency 비율이 본질적으로 다름 → **이전 N Goal 평균을 다음 Goal 에 적용하는 추정 룰 거부** (G-003 self-review candidate D + G-004 self-review candidate D 동일 결정). G-005 alias-wrapper profile (props 매핑) 은 위 두 profile 어느 쪽도 아닌 새 profile — 두 trajectory 모두 invalid 추정.

**현재 적용 형태 (G-005 spec writer 의무)**: G-005 spec D# 표 또는 Section 8.5 (번들 영향) 에 다음 1줄 명시 의무:

> "bundle estimation NOT extrapolated from prior Goals (different size profile) — measurement at implement time only per ADR-MOD-GRID-01-005 Pattern Catalog Note + ADR-MOD-GRID-01-003 D7 게이트."

spec 예상 (+5 KB) 인용은 metric 참조용으로만 사용 — 게이트 아님. 25 KB 분리 트리거(ADR-003 D7) 발동 가능성 비낮음 (현재 누적 24.21 + spec +5 = 29.21, 한도 0.79 KB 여유) → G-005 spec writer 가 사전 분리 결정 (legacy sub-entry vs 단일 패키지) 검토 의무.

**3번째 occurrence 발생 시** (예: G-005 implement 후 alias-wrapper profile data 추가, 또는 MOD-GRID-09 EditableGrid 의 inline editor profile data 추가): ADR-MOD-GRID-00-XX (cross-module bundle estimation policy) 로 promote 검토. 현재 2 profile 데이터포인트는 pattern 단계 (1=anecdote, 2=pattern, 3=policy 룰 적용).

**근거**: G-003 self-review 시점 1 occurrence (same-profile only) 였을 때 D 거부 사유 ("same-profile 측정의 다른 profile 일반화 거부") 가 G-004 different-profile 측정으로 empirically 입증. 측정 → 게이트 적용 (D7) 이 추정 룰보다 강한 안전장치. tw-harness retrospective principle 일관 적용.

**★ Promoted to ADR-MOD-GRID-00-010 (2026-05-14, G-005 self-review)** — G-005 alias-wrapper 3rd profile 데이터포인트 추가로 policy 단계 진입 (3 profile data points). cross-module bundle estimation policy 로 promote 완료. MOD-GRID-02+ spec writer 의무는 ADR-MOD-GRID-00-010 참조.

---

## ADR-MOD-GRID-01-006: G-005 — `/legacy` sub-entry + measure-then-decide bundle gate (D7/D8) + tsconfig.app.json paths

**Date**: 2026-05-14
**Status**: Accepted
**Goal**: G-005 (BaseGridProps 호환 alias 5종 — wrapper 모듈 5/5 종결)

### Context

G-005 는 5 alias compatibility shim (BaseGrid/VirtualGrid/ColumnPinGrid/GroupedHeaderGrid/TreeGrid) 을 `legacy/` 디렉토리에 신규 추가한다. 누적 번들 한도 30 KB 의 G-001~G-004 24.21 KB 시작점에서 spec D7 의 measure-then-decide 정책 + D8 의 sub-entry 사전 인프라가 본 ADR 의 핵심 결정.

부수 결정: 사용처 마이그레이션 (3 actual) 의 tsc resolution 보강을 위해 tw-framework-front `tsconfig.app.json` paths 매핑 추가.

### Decision

**1. `/legacy` sub-entry 인프라 사전 구축 (D8)**:
- `package.json` `exports."./legacy"` field 추가 (`./dist/legacy/index.{cjs,mjs,d.ts}`)
- `tsup.config.ts` `entry: ["src/index.ts", "src/legacy/index.ts"]` (multi-entry)
- `src/legacy/index.ts` 5 alias re-export
- main entry `src/index.ts` 도 동일 5 alias re-export (호환 유지 — 사용처 점진 마이그레이션 옵션)

**2. measure-then-decide bundle gate (D7)**:
- IMPLEMENT 직후 `npx size-limit` 실측
- ≤28.5 KB → 단일 entry 유지 (main 에서도 alias re-export 유지)
- > 28.5 KB → main `src/index.ts` 5 alias re-export 제거 → 사용처는 `from "@tomis/grid-core/legacy"` 강제 (분리 트리거)

**3. tsconfig.app.json paths 매핑 (사용처 tsc 충족 — promptSpecDrift)**:
- `tw-framework-front/tsconfig.app.json` 에 `baseUrl: "."` + `paths` 4행 추가 (vite.config.ts L17-30 alias 와 1:1 mirror)
- `@/*` + `@tomis/grid-core` + `@tomis/grid-core/legacy` 매핑

### Measurement (post-IMPLEMENT)

```
@tomis/grid-core (brotli):
  size: 24,518 bytes (24.52 KB)
  sizeLimit: 30,000 bytes (30 KB)
  passed: true
```

- G-001~G-004 baseline: 24.21 KB
- G-005 incremental: **+0.31 KB** (brotli — alias 코드가 prop 위임 패턴 → dedupe 효율 ≈94%)
- D7 결정: **24.52 KB ≤ 28.5 KB → 단일 entry 유지** (main 에서도 alias re-export 보존)

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| `/legacy` 분리 강제 (사용자 import path 강제 변경) | C-19 점진 원칙 위반 — 본 G-005 는 alias 첫 도입, deprecation path 의 entry barrier 낮춰야 (사용자가 main entry 경유 import 도 가능). 측정 후 분리 결정이 더 합리적 |
| 단일 entry 유지 + multi-entry 미적용 (tsup.config.ts 무수정) | sub-entry 사전 인프라 부재 — 향후 D7 게이트 위반 시 즉시 분리 불가, 추가 빌드 시스템 변경 필요. 사전 마련 비용 0 (multi-entry 1줄 변경) vs 후속 비용 큼 |
| `tw-framework-front` 에 `@tomis/grid-core` workspace dependency 추가 (`package.json` + `pnpm-workspace.yaml` 통합) | tw-framework-front 가 monorepo 외부 (TOMIS 저장소) — workspace 통합은 대규모 리팩토링. tsconfig paths + vite alias mirror 로 충분 (런타임/빌드 모두 동작) |
| extrapolation 기반 사전 분리 결정 | ADR-MOD-GRID-01-005 Pattern Catalog Note "different-profile efficiency" 위반 — alias-wrapper profile 은 신규, 사전 추정 거부. spec D7 measure-then-decide 정책 일관 적용 |

### Trade-off

- **Pro**: 24.52 KB / 30 KB 여유 5.48 KB 확보 — MOD-GRID-02 이후 모듈을 위한 예산 보존. 사용처 마이그레이션 점진 옵션 (`from "@tomis/grid-core"` main + `from "@tomis/grid-core/legacy"` 권장 모두 동작). multi-entry 인프라가 향후 D7 게이트 발동 시 즉시 적용 가능.
- **Con**: main entry 가 alias 코드를 포함 → main entry 만 사용하는 미래 신규 사용처도 alias 코드 brotli ~+0.31 KB 부담. 사용자가 main 만 import 할 때 tree-shake 가능 (named export 패턴 — `export { Grid }` 만 사용 시 alias re-export 코드 dead).

### Consequences

- **단일 entry 유지** (main + `/legacy` 모두 동일 alias 코드 노출). 사용처 점진 마이그레이션 1 minor 동안 양쪽 path 동작.
- **MOD-GRID-99-B 마이그레이션 가이드** 의무: `from "@tomis/grid-core/legacy"` 권장 명기 (deprecation intent). 1 minor 후 alias 제거 시 `/legacy` sub-entry 와 함께 main entry alias re-export 도 동시 제거.
- **tw-framework-front tsconfig.app.json paths 매핑** 영구 유지. MOD-GRID-17 후속 27 페이지 마이그레이션 시 동일 path 재사용. vite alias 와 mirror 보장 의무 (alias 추가 시 양쪽 동기화).
- **번들 trajectory 데이터 추가**: G-005 alias-wrapper profile = +0.31 KB (brotli efficiency ≈94%). ADR-005 Pattern Catalog Note 의 3rd profile 등록 — 후속 MOD 의 alias-wrapper 추정 baseline (단, ADR-005 정책에 따라 측정 의무 유지, 추정 사용 금지).

### Confidence

- **high** — 측정 기반 결정 (24.52 KB 실측). multi-entry 빌드 + dist 산출 검증 통과. tsc 0 error (grid-core + tw-framework-front 사용처 3 파일 — pre-existing 무관 PayReal01EditModal 7 errors 제외). size-limit JSON passed: true.

### Pattern Catalog Note (G-005 implement 2026-05-14) — alias-wrapper profile bundle data point

**alias-wrapper profile 첫 데이터포인트**: G-005 = 5 함수 컴포넌트 + 1 hook + 1 re-export, 각 함수 ~30~40 LOC, 모두 `<Grid {...mapped}>` 위임 패턴. brotli efficiency = 94% (spec 예상 +5 KB → 실측 +0.31 KB).

**ADR-005 Pattern Catalog Note 3rd profile 추가**:

| Profile group | 대표 Goals | spec 예상 | 실측 | efficiency |
|---------------|-----------|----------|------|-----------|
| same-profile | G-001~G-003 | +13 KB | +0.91 KB | ≈10-15% |
| different-profile | G-004 | +7 KB | +5.86 KB | ≈84% |
| alias-wrapper | **G-005** | **+5 KB** | **+0.31 KB** | **≈94%** |

현재 3 profile 데이터포인트 → ADR-005 의 1=anecdote 2=pattern 3=policy 기준에서 **policy 단계 진입**. 후속 MOD 작업 시점에 다음 정책 elevate 검토:

> "Bundle estimation: spec 예상은 metric 참조용으로만, 모든 게이트 결정은 IMPLEMENT 직후 size-limit 실측 의무. profile 별 efficiency 차이 (10~94%) 는 추정 룰 거부 강한 근거."

→ ADR-MOD-GRID-00-XX (cross-module bundle estimation policy) 로 promote 후보 (G-005 spec writer + verifier 검토).

**★ Promoted to ADR-MOD-GRID-00-010 (2026-05-14, G-005 self-review)** — wrapper-module 3 profile 매트릭스가 cross-module 정책으로 통합. MOD-GRID-02+ spec writer 의무는 본 ADR 대신 ADR-MOD-GRID-00-010 참조.

### Pattern Catalog Note (G-005 implement 2026-05-14) — exactOptionalPropertyTypes spread 패턴 3rd occurrence

**3rd occurrence — policy 단계 진입**:
- G-003 ADR-MOD-GRID-01-004: `EmptyStateProps` (1 hit)
- G-004 ADR-MOD-GRID-01-005: `UseGridImperativeHandleParams` (1 hit, 2 occurrences = pattern)
- **G-005 본 ADR**: 5 alias 의 모든 optional prop spread (대량 hit, 3 occurrences = policy)

현재 5 alias 가 동일 spread 패턴 적용 (`{...(props.X !== undefined ? { X: props.X } : {})}`). 3rd occurrence 가 1 ADR 내 5x 적용 → ADR-005 의 1=anecdote 2=pattern 3=policy 기준 **policy 단계 명확 진입**.

**ADR-MOD-GRID-00-XX (cross-module exactOptionalPropertyTypes optional prop forwarding policy) elevation 강력 권장**:

> "Policy: optional prop 을 wrapper/alias 컴포넌트에서 child 컴포넌트로 forwarding 할 때, 항상 `{...(props.X !== undefined ? { X: props.X } : {})}` spread 패턴 사용. 이유: exactOptionalPropertyTypes 환경 호환 + child 의 default 값 fallback 보존."

→ MOD-GRID-99-A (cross-module standards) 또는 MOD-GRID-00 (root standards) 으로 promote 후보.

**★ Promoted to constraints.md C-29 (2026-05-14, G-005 self-review)** — 3 occurrences (EmptyStateProps + UseGridImperativeHandleParams + 5-alias spread) 입증으로 enforceable code style 정책 (constraints) 진입. spread skip + union 명시 두 패턴 명시 + 위반 시 처리 (B-02 NO + tsc TS2375 자동 fail) 표 행 추가. wrapper 외 신규 컴포넌트도 동일 패턴 의무.

---

## ADR-MOD-GRID-01-007: G-006 — `cellClassName` + `rowClassName` Grid-level callback wiring (D1/D2/D3)

**Date**: 2026-05-18
**Status**: Accepted (implemented)
**Goal**: G-006 (`cellClassName` + `rowClassName` Grid-level callback wiring)
**연관 spec**: `.claude/tw-grid/findings/canonical-gap-supplementation-spec.md` §4.1
**연관 deferred**: ADR-MOD-GRID-05-002 D3 (cellClassName Grid-level wiring 이행)

### Context

ADR-MOD-GRID-05-002 D3 (2026-05-14) 본문 명시: **"cellClassName Grid-level wiring 은 MOD-GRID-01 또는 MOD-GRID-04 로 deferred"**. G-006 이 이 약속 이행.

publish/organizeSchedule:L182-244 (Wijmo `formatItem.addHandler`) 의 per-cell DOM mutation 패턴 — 셀 상태별 (selected / weekend / has-value) 동적 배경/색 변경 — 동등 표현 가능해야 함.

### Decision

- **D1**: `GridProps.cellClassName?: CellClassNameCallback<TData>`.
  - 시그니처: `(cell: Cell<TData, unknown>) => string | undefined`.
  - 매 cell 렌더 시 호출 → 결과 string 을 `<td>` 의 기본 className 에 append.
- **D2**: `GridProps.rowClassName?: RowClassNameCallback<TData>`.
  - 시그니처: `(row: Row<TData>) => string | undefined`.
  - 매 row 렌더 시 호출 → 결과 string 을 `<tr>` 의 기본 className 에 append.
- **D3 (★ Layering 결정)**: `CellClassNameCallback<TData>` + `RowClassNameCallback<TData>` 의 **canonical 정의를 `@tomis/grid-core/types.ts` 로 이전**. `@tomis/grid-renderers/src/EditableCell.tsx:40` 은 **type-only re-export** (`export type { CellClassNameCallback } from '@tomis/grid-core'`).
  - 이유: ADR-MOD-GRID-REFACTOR-2026-05-17-009 (grid-core ↔ grid-features 역의존 제거) 의 정신 동일 적용 — grid-core 가 grid-renderers 의 type 을 import 하면 역의존 재발.

### API

```typescript
// grid-core/src/types.ts
export type CellClassNameCallback<TData> = (
  cell: Cell<TData, unknown>,
) => string | undefined;

export type RowClassNameCallback<TData> = (
  row: Row<TData>,
) => string | undefined;

interface GridProps<TData> {
  // ... 기존 props
  cellClassName?: CellClassNameCallback<TData>;
  rowClassName?: RowClassNameCallback<TData>;
}
```

### 적용 위치

- `Grid.tsx` virtualized branch: `<tr className={... rowClassName?.(row) ?? ''}>` + `<td className={... cellClassName?.(cell) ?? ''}>`.
- `Grid.tsx` non-virtualized branch: 동일.

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| wrapping cellRenderer (사용자가 모든 컬럼에 inline custom cell 작성) | 부담 큼, 보일러플레이트 폭증 — Wijmo formatItem 의 간결성 미보존 |
| `column.meta.cellClassName` (per-column 만) | 셀 상태 (selection/row context) 접근 불가 — 동적 분기 표현 한계 |
| Grid-level `onCellRendered(cell, dom)` post-mount hook | DOM mutation 노출은 C-5 (Tailwind only) 위반 위험 |
| `CellClassNameCallback` canonical 을 grid-renderers 에 유지 | grid-core 가 type-import → ADR-REFACTOR-009 역의존 정책 위반. type-only re-export 가 호환 + 정합 |

### Trade-off

- **Pro**: 1 prop 으로 publish formatItem 동등 표현. Tailwind 만으로 표현 (C-5 부합). EditableCell `cellClassName` (leaf prop, ADR-005 D3) + Grid `cellClassName` (root) 일관 wiring. `CellClassNameCallback<TData>` canonical 정합 (역의존 0).
- **Con**: 매 cell 렌더마다 callback 호출 — 대용량 데이터 시 callback 내부 계산 비용 주의 (사용자 책임). JSDoc 명시.
- **Con (rowClassName + virtualization)**: virtualized branch 에서 `<tr ref={virtualizer.measureElement}>` 가 row height 측정 — dynamic-height rowClassName 사용 시 measureElement reflow 가 반복 발생 (성능 저하). static rowClassName 권장 (JSDoc 명시).

### Consequences

- **번들 영향 (size-limit 측정 2026-05-18, G-006+G-007 합산)**: `@tomis/grid-core` brotli **9.12 KB / 30 KB** (한도 30%, 여유 20.88 KB). G-005 baseline 24.52 KB 보다 작은 이유는 G-005 이후 ADR-MOD-GRID-REFACTOR-2026-05-17-001~019 19건의 리팩토링 (특히 legacy alias 사용처 마이그레이션 + 역의존 제거 + size-limit ignore 정책 통일 [REFACTOR-011]) 누적 결과. ADR-003 D7 25 KB sub-entry split 트리거 미발동 (9.12 KB ≪ 25 KB).
- **MOD-GRID-99-B 마이그레이션 가이드 의무 (후속)**: `cellClassName` 사용 예시 + virtualization 성능 주의사항 명시 + rowClassName + virtualization 의 measure thrash 주의사항.
- **C-5 / C-17 / C-29 적용** — implementer 의무. Storybook 시각 회귀 baseline 추가 (별도 cycle).
- **MOD-GRID-04 (createColumns) 확장 검토**: `column.meta.cellClassName` (per-column static) 도 함께 지원 가능 — 별도 cycle 검토. Grid-level callback 으로 column id 분기 가능하므로 본 G-006 단계에서는 미보강.
- **EditableCell `cellClassName: string` prop (ADR-005 D3) 보존**: 본 ADR 은 Grid-level callback 추가, EditableCell 의 leaf prop (resolved string 수신) 패턴은 그대로 유지. 두 layer 가 자연스럽게 합성 가능 (Grid `cellClassName(cell)` → `<td className=... cellClassName(cell)>` 에 EditableCell 이 자식으로 렌더되면 EditableCell `cellClassName` prop 은 별도).

### Confidence: high

- 명확한 약속 이행 (ADR-MOD-GRID-05-002 D3 deferred).
- publish 의 실제 사용 패턴이 design 검증 입력.
- 측정 기반 결정 (size-limit 통과 + typecheck 0 errors + pre-existing build 무영향).

### Pattern Catalog Note (G-006 implement 2026-05-18) — type ownership 이전 + type-only re-export 패턴

**Type ownership 이전 + type-only re-export 패턴 (역의존 제거)** — 본 ADR 의 D3 결정 1회 발생. ADR-MOD-GRID-REFACTOR-2026-05-17-009 (grid-core ↔ grid-features 역의존 제거) 와 동일 패턴 — 2 occurrences = pattern 단계. 3rd occurrence 발생 시 ADR-MOD-GRID-00-XX (cross-module type ownership policy) 로 promote 검토.

**근거**: tw-harness retrospective principle (1=anecdote, 2=pattern, 3=policy). REFACTOR-009 + 본 ADR-007 D3 가 2 occurrences 등록.

---

## ADR-MOD-GRID-01-008: G-007 — `onCellKeyDown` prop + `GridHandle.startEditing` imperative method (D1/D2)

**Date**: 2026-05-18
**Status**: Accepted (implemented)
**Goal**: G-007 (cell-level keyboard hook + `GridHandle.startEditing(rowId, colId)` imperative method)
**연관 spec**: `.claude/tw-grid/findings/canonical-gap-supplementation-spec.md` §4.5

### Context

publish/organizeSchedule:L252-284 (Wijmo `g.hostElement.addEventListener('keydown', ...)` + `g.startEditing(true)`) 패턴 — 그리드 host 의 키보드 이벤트 노출 + 프로그래밍적 편집 시작.

현 Grid surface:
- `onCellClick` 존재 (types.ts L416), `onCellKeyDown` 부재.
- `GridHandle.scrollTo / addRow / deleteRow / getSelection / clearSelection / refresh` 존재 (G-004), `startEditing` 부재.

본 G-007 이 publish G-7 use case 정확 처리.

### Decision

- **D1**: `GridProps.onCellKeyDown?: (cell: Cell<TData, unknown>, row: TData, event: KeyboardEvent<HTMLTableCellElement>) => void`.
  - 시그니처는 `onCellClick` (ADR-MOD-GRID-01-004 D4) 와 일관: `(cell, row, event)` 3-arg.
  - Grid 가 `<td>` 의 `onKeyDown` 으로 자동 wire.
  - tabindex 미지정 셀은 native focus 받지 못함 — 사용자 의도적 활성 시 cellRenderer 가 `tabIndex={0}` 부여 의무 (JSDoc 명시).
- **D2**: `GridHandle.startEditing(rowId: string | number, colId: string): void` + `GridProps.onStartEditing?: (rowId, colId) => void`.
  - **★ callback-delegating 패턴** (ADR-005 D3 + G-004 addRow/deleteRow/updateRow 와 동일): Grid 는 editing state 를 소유하지 않음.
  - `useGridImperativeHandle` 의 `startEditing` 이 `params.onStartEditing` 으로 위임.
  - 콜백 미제공 시 dev mode `console.warn` 1회 + no-op (production silent).

### API

```typescript
// grid-core/src/types.ts
interface GridProps<TData> {
  // ... 기존 props
  onCellKeyDown?: (
    cell: Cell<TData, unknown>,
    row: TData,
    event: KeyboardEvent<HTMLTableCellElement>,
  ) => void;
  onStartEditing?: (rowId: string | number, colId: string) => void;
}

interface GridHandle<TData> {
  // ... 기존 7 method
  startEditing: (rowId: string | number, colId: string) => void;
}
```

### 적용 위치

- `Grid.tsx` virtualized + non-virtualized 양쪽 branch 의 `<td>` 에 `onKeyDown={(event) => props.onCellKeyDown?.(cell, row.original, event)}` 추가.
- `useGridImperativeHandle.ts` 에 `startEditing` method 추가 — `params.onStartEditing` callback-delegating (dev warn + no-op).
- `Grid.tsx` 의 `useGridImperativeHandle` 호출에 `onStartEditing: props.onStartEditing` 전달.

### Application 등가 표현 (publish G-7)

```tsx
const gridRef = useRef<GridHandle<MemberRow>>(null);
const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

<Grid
  ref={gridRef}
  data={scheduleData}
  columns={columns}
  onStartEditing={(rowId, colId) => setEditingCell({ rowId: String(rowId), colId })}
  onCellKeyDown={(cell, _row, event) => {
    const isChar = event.key.length === 1;
    const isDel = event.key === 'Backspace' || event.key === 'Delete';
    if (cell.column.id.startsWith('d') && (isChar || isDel)) {
      gridRef.current?.startEditing(cell.row.id, cell.column.id);
    }
  }}
/>
```

### Alternatives Considered

| 대안 | 채택 안 된 이유 |
|------|----------------|
| **hostElement ref 직접 노출** (`<Grid hostRef={hostRef}>` + `hostRef.current.addEventListener`) | DOM 노출 — (a) abstraction 손상, (b) cleanup 책임 사용자, (c) C-5 의 Tailwind only 정신 미세 위반 |
| **`onKeyDown` (Grid root)** | 셀 단위 분기 어렵고, focus management 책임 사용자. Cell-level 이 명확 |
| **`startEditing()` cell-active 의존** (현재 active cell 의 selection 사용) | 현재 active cell 미관리, `(rowId, colId)` 명시 인자가 명확. AG `api.startEditingCell({rowIndex, colKey})` 패턴 부합 |
| **Grid-scoped editingCellState 추가** (Grid 가 editing state 소유) | EditableCell `isEditing` controlled wiring + EditingContext 도입 부담 큼 (별도 cycle 의무). G-004 D3 callback-delegating 패턴과 정합성 손상. application 측 controlled state 가 더 깨끗 |
| **시그니처 `(event, info: CellContext)`** (task prose) | 기존 `onCellClick` (ADR-004 D4) 의 `(cell, row, event)` 3-arg 와 불일관 — 두 callback 의 mental model 차이 발생. C-27 (spec 권위) 적용 → `(cell, row, event)` 채택 |

### Trade-off

- **Pro**: 2 prop + 1 handle method 로 publish hostElement keyboard wiring 동등 표현. Cell-level abstraction 보존. Tailwind only 정합. G-004 D3 callback-delegating 패턴 일관 (addRow/deleteRow/updateRow/startEditing 모두 동일 정책).
- **Con**: cell-level focus management 사용자 의무 (tabIndex={0} 또는 default focus 정책). JSDoc 명시.
- **Con (cross-package wiring)**: `startEditing` callback 호출 시 application 이 EditableCell `isEditing` 갱신 책임 — EditableCell controlled state 패턴 자체는 별도 cycle 결정 (limit acknowledged below).

### Consequences

- **번들 영향 (size-limit 측정 2026-05-18, G-006+G-007 합산)**: ADR-007 의 측정 결과와 동일 (9.12 KB / 30 KB).
- **MOD-GRID-99-B 마이그레이션 가이드 의무 (후속)**: `onCellKeyDown` + `onStartEditing` + `startEditing()` 통합 예시 (publish/organizeSchedule G-7 패턴) + EditableCell controlled `isEditing` 통합 패턴.
- **MOD-GRID-10 ChangeTrackingGrid 영향**: `ChangeTrackingHandle` 에 `startEditing` 추가 가능 (별도 cycle). 본 ADR 은 base GridHandle 만 다룸.

### 알려진 한계

- **L-1 (Cross-package wiring detail)**: `startEditing(rowId, colId)` 호출 시 EditableCell 의 `isEditing=true` setting 메커니즘은 본 ADR 범위 외 — application 책임 (controlled `isEditing` state). EditingContext / column.meta.editable 패턴 통합은 별도 cycle 결정.
- **L-2 (Focus 정책)**: `<td>` 가 default tabIndex 부재 → native focus 불가. `onCellKeyDown` 사용 시 cellRenderer 가 focus-able 자식 (input / tabIndex={0} div 등) 부여 의무. AS-IS Wijmo 의 `hostElement.addEventListener` 는 grid root 한 곳에 등록 → 모든 키보드 입력 자동 receive. tw-grid 는 cell-level 등록 → cell focus 필요. JSDoc 명시.

### Confidence: medium-high

- API design 명확 — `(cell, row, event)` 시그니처는 기존 `onCellClick` 와 일관 + callback-delegating 패턴이 G-004 D3 와 일관.
- cross-package wiring detail 은 implementer 가 명시 결정 미완 (L-1) — application 측 controlled isEditing 패턴 채택 (낮은 위험, 점진적 cross-cycle 확장 가능).
- 측정 기반 결정 (size-limit 통과 + typecheck 0 errors).

### Pattern Catalog Note (G-007 implement 2026-05-18) — callback-delegating 패턴 2nd occurrence (pattern 단계)

**callback-delegating imperative API 패턴** — 본 implement 에서 **2nd occurrence 등록**:
- 1st occurrence: G-004 ADR-MOD-GRID-01-005 D3 (addRow/deleteRow/updateRow 3 method 를 단일 unified decision 으로 결정 — 1 occurrence).
- 2nd occurrence: 본 ADR-008 D2 (startEditing 1 method, callback-delegating).

**2 occurrences = pattern** (1=anecdote, 2=pattern, 3=policy 룰).

3rd occurrence 발생 시 (예: MOD-GRID-10 ChangeTrackingHandle 의 `commit`/`rollback` callback-delegating 등) ADR-MOD-GRID-00-XX `GridHandle callback-delegating policy` 로 promote 검토. 그 전까지는 본 ADR-008 D2 + G-004 ADR-005 D3 본문 자체가 reference.

**근거**: tw-harness retrospective principle. G-004 의 3 method 추가는 단일 unified decision (ADR-005 D3) — 1 occurrence 카운트.