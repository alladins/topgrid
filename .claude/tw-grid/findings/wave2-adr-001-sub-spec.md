# ADR-001 Sub-Spec — MultiRowHeader Portal + DataMapCell Contract (사용자 §9.1=B)

**작성일**: 2026-05-17
**상태**: draft (사용자 검토 대기 — §9 의 blocking question 해소 필수)
**1차 spec**: `wave2-adr-001-spec.md` (586 lines)
**원본 ADR**: `MOD-GRID-REFACTOR-2026-05-17-001` (옵션 A + 7/7 강제 + minor)
**사용자 결정 컨텍스트**: §9.1=B (7/7 강제) / §9.2=a (wrapper `<div>`) / §9.3=b (하드코드 relative) / §9.4=C (minor + 즉시 Watermark)
**probe typecheck (H-D)**: ✅ `packages/grid-pro-header/src/__probe__/multirow-watermark-row.probe.tsx` — exit 0 (삭제 후 baseline 복구)
**probe typecheck (D-D)**: ✅ `packages/grid-license/src/__probe__/singleton-portal.probe.tsx` — exit 0 (createPortal + SSR guard, 삭제 후 baseline 복구)
**실 코드 변경**: 0건

---

## 0. Executive Summary

본 sub-spec 은 1차 spec 의 클래스 C 2 컴포넌트 (MultiRowHeader, DataMapCell) 의 wiring 정책을 명세한다. 사용자 결정 §9.1=B 의 "7/7 강제" + §9.4=C 의 "minor + 즉시 Watermark" 의 conjunction 만족이 본 sub-spec 의 검증 대상.

### 핵심 발견

1. **MultiRowHeader H-D (advisor 발견 신규 옵션)**: `<thead>` 안에 `<tr><th colSpan=N><Watermark/></th></tr>` 1행을 prepend 하는 방식이 HTML-valid + portal 불필요 + SSR 무관 + minor 호환. probe 통과.
2. **DataMapCell granularity 의문 (advisor 발견 — blocking)**: §9.1=B 의 "7/7" 이 (a) **컴포넌트 단위 enforcement** 인가 (b) **패키지 단위 enforcement** (즉 grid-pro-datamap 패키지가 enforcement 에 참여한다는 의미) 인가 — 사용자 의도 확인 필요. DataMapCell 은 per-cell renderer 라 컴포넌트 단위 시각 enforcement 가 architecturally incoherent (per-cell watermark = UX 재앙, per-row 도 동일).
3. **통합 옵션 D-D / 통합 옵션 H-A' (document-level singleton portal)**: MultiRowHeader + DataMapCell 둘 다 동일 메커니즘 (mount-time `createPortal(<Watermark />, document.body)` 단일 인스턴스 dedup) 으로 enforcement. probe 통과. §9.4=C minor 호환.

### 권고 (final — §6/§12 의 conjunction 재검증 후 §0 와 일치)

- **MultiRowHeader**: **H-D 권고** (advisor 발견, probe 통과, 가장 단순). 사유:
  - 1차 spec §7 Step 4-5 의 5 컴포넌트는 **inline `<Watermark>` inside wrapper `<div>`** 패턴 (portal 아님)
  - 따라서 "H-A + D-D 메커니즘 통일" 주장은 **부정확** — 5 컴포넌트는 inline + 2 컴포넌트 (Header+Cell) 만 portal 이 되어 메커니즘 *분리*
  - H-D 는 **portal 이 architectural 으로 필요한 경우만 사용** 하는 더 깔끔한 분담: DataMapCell 만 portal (host DOM 부재), 나머지 6 컴포넌트는 inline (Header 의 `<tr>` 도 inline 의 한 형태)
- **DataMapCell**: **D-D 권고** (singleton portal) — granularity 의문에 대한 사용자 응답이 (b) 패키지 단위 enforcement 일 경우만 유효. (a) 컴포넌트 단위 일 경우 D-A (contract 변경, MAJOR) 외 선택지 없음 → §9.4 재고 필요.
- **사용자 §9.1 blocking question 1건**: granularity (a)/(b) 명시 응답 필수 (다음 단계 implementer 진입 불가 사유).

---

## 1. MultiRowHeader 인벤토리

### 1.1 정의 파일: `packages/grid-pro-header/src/MultiRowHeader.tsx:96-228`

**Return JSX 구조** (line 104-226):
```tsx
return (
  <thead className="bg-gray-50">           {/* line 105 — 최상위 노드 */}
    {headerGroups.map((headerGroup, rowIndex) => {
      // ... trProps, frozenColumns, enableGroupToggle logic
      return (
        <tr key={headerGroup.id} {...trProps}>
          {headerGroup.headers.map((header) => {
            // ... isPlaceholder / 일반 <th> 분기
            return <th ...>...</th>;
          })}
        </tr>
      );
    })}
  </thead>
);
```

**최상위 반환**: `<thead>` 1개. Fragment 아님. wrapper `<div>` 부재 (1차 spec §2.1 #3 확인 — `<thead>` **만** 반환).

**HTML DOM 규칙**: `<thead>` 의 합법적 parent 는 `<table>` 뿐. `<thead>` 의 합법적 children 은 `<tr>` 뿐. 따라서:
- `<thead>` 외부에 `<div>` sibling 추가 = **불가능** (parent `<table>` 의 children 에 `<div>` 허용 안 됨)
- `<thead>` 내부에 `<div>` child 추가 = **불가능** (`<thead>` children 은 `<tr>` 만)
- `<thead>` 내부에 추가 `<tr>` child 추가 = **가능** (HTML-valid, browser 가 정상 렌더)

### 1.2 사용처 인벤토리 (parent JSX 구조)

| # | 위치 | parent 구조 | 비고 |
|---|------|-----------|------|
| 1 | `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx:129` | `<table className="min-w-full text-sm border-collapse"><MultiRowHeader ... /><tbody>...</tbody></table>` (line 128-160) | legacy alias. tw-framework-front `GroupedHeaderGrid.tsx` 가 re-export. |
| 2 | `packages/grid-pro-header/stories/GroupedHeader.stories.tsx:74` | `<div className="overflow-auto border rounded"><table className="w-full border-collapse"><MultiRowHeader .../><tbody>...</tbody></table></div>` (line 71-90) | storybook only. |
| 3 | tw-framework-front 직접 사용 | **0건** — `tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` 가 `@tomis/grid-pro-header` 의 `GroupedHeaderGrid` (legacy) 만 re-export. |

**결론**: 모든 사용처에서 parent 는 항상 `<table>`. `<thead>` 의 sibling 으로 `<div>` 추가 불가능 확정.

### 1.3 사용 패턴 일관성

- production 사용처 0건 — 즉 외부 사용자가 `<MultiRowHeader>` 의 최상위 노드 type (`<thead>`) 에 의존한 코드는 monorepo 내부 GroupedHeaderGrid + stories 뿐.
- `<table>` 내부 `<thead>` 형제로 `<tbody>` 가 항상 존재 → `<thead>` 내부 행 추가는 `<tbody>` 와 무관.

---

## 2. DataMapCell 인벤토리

### 2.1 정의 파일: `packages/grid-pro-datamap/src/DataMapCell.tsx:49-62`

**Return JSX 구조** (line 49-62):
```tsx
export function DataMapCell<TData>(
  info: CellContext<TData, unknown>,
): JSX.Element {
  const value = info.getValue();
  const columnDef = info.column.columnDef as DataMapColumnDef<TData>;
  const resolved = resolveDataMap(columnDef.dataMap, info.row.original);
  const label = resolved?.getDisplay(value);
  const text = label !== undefined ? label : String(value ?? '');
  return <span>{text}</span>;     // line 61 — 단일 <span>
}
```

**최상위 반환**: `<span>` 단일 요소. attribute 없음 (className/style 부재).

**호출 패턴**: TanStack column.cell 의 renderer function. TanStack 이 매 cell 마다 `DataMapCell(cellContext)` 호출 → `<span>` 반환 → `<td>` 안에 삽입.

### 2.2 사용처 인벤토리

| # | 위치 | 사용 패턴 | 비고 |
|---|------|---------|------|
| 1 | `packages/grid-pro-datamap/src/index.ts:11` | `export { DataMapCell }` | public export. |
| 2 | `packages/grid-pro-datamap/src/__stories__/DataMapCell.stories.tsx:16` | `import { DataMapCell }` 후 `column.cell: DataMapCell` (string placeholder, 실 함수 아님 — story args 만) | story placeholder. |
| 3 | `packages/grid-pro-datamap/stories/DataMap.stories.tsx:10,93,102` | `<DataMapCell {...makeMockCellContext('01')} />` — story 에서 직접 렌더 (test fixture 패턴) | mock CellContext 주입 — 비표준 사용. |
| 4 | tw-framework-front 사용 | **0건** — `grep "DataMapCell\|grid-pro-datamap"` 결과 없음. |

### 2.3 표준 사용 패턴 (TanStack 의도)

```tsx
const columns: ColumnDef<MyRow>[] = [
  {
    id: 'statusCode',
    accessorKey: 'statusCode',
    dataMap: statusMap,           // DataMapColumnDef 의 extra field
    cell: DataMapCell,            // ← 함수 reference 등록
  },
];

// TanStack 내부에서 각 row 마다:
// flexRender(column.columnDef.cell, cellContext) → DataMapCell(cellContext) → <span>
```

**핵심**: DataMapCell 은 **컴포넌트가 아닌 함수 reference**. TanStack 의 cell renderer 슬롯에 등록되어 cell 단위로 호출됨. 컴포넌트 단위 시각 enforcement (`<DataMapCell><Watermark/></DataMapCell>`) 는:
- per-cell watermark = 수십~수백 cell 마다 워터마크 = UX 재앙
- per-row watermark = renderer 가 row 컨텍스트를 모름 (row.index 가 있긴 하나 "row 단위 한 번" 결정 메커니즘 부재)
- per-table watermark = renderer 가 table 인스턴스를 모름 (info.table 은 있으나 table 에 watermark 를 mount 할 방법 없음)

---

## 3. Watermark 컴포넌트 spec 확인

### 3.1 정의: `packages/grid-license/src/Watermark.tsx:13-20`

```tsx
export function Watermark({ required }: WatermarkProps): React.ReactElement | null {
  if (!required) return null;
  return (
    <div className="absolute top-0 right-0 opacity-40 pointer-events-none select-none text-sm font-semibold text-gray-500 p-2">
      Unlicensed @tomis/grid
    </div>
  );
}
```

### 3.2 위치 정책 (DOM tree 의존)

- `className="absolute top-0 right-0 ..."` — **부모에 `position: relative` 필요**
- `pointer-events-none` — 클릭 방해 없음
- `opacity-40` — 약한 시각 신호
- 텍스트: "Unlicensed @tomis/grid" 하드코드

### 3.3 portal 호환 여부

- React 19 `createPortal(<Watermark required />, document.body)` 가능 (probe D-D 통과)
- portal target = `document.body` → body 의 default position 은 `static` (relative 아님)
- 따라서 portal 사용 시 Watermark 의 `absolute top-0 right-0` 는 viewport 우상단 기준이 됨 (body 가 reference frame 이 아니라 viewport 기준 fallback)
- **장점**: Watermark 가 화면 우상단에 고정 노출 — 사용자가 의식적으로 확인하기 쉬움
- **단점**: 여러 Pro Grid 가 동시 mount 시 portal 중복 → dedup 필요 (D-D 의 ref-count 메커니즘으로 해결)

### 3.4 SSR 호환

- `useSyncExternalStore` 의 server snapshot 호출 가능 (1차 spec §1.4 — `() => checkLicense()` 동일 fallback)
- `createPortal` 의 `document` 참조는 SSR 환경에서 부재 → `typeof document === 'undefined'` guard 필요 (probe D-D 의 SSR guard 검증됨)
- 현 grid 사용처 모두 CSR (1차 spec §8.1 위험 4) — SSR 시 portal skip 으로 안전

---

## 4. MultiRowHeader 옵션 평가 (H-A / H-B / H-C / H-D)

### 4.1 옵션 H-A: React Portal

`createPortal(<Watermark required />, document.body)` 를 컴포넌트 내부에서 호출.

```tsx
export function MultiRowHeader<TData>({ table, ... }: MultiRowHeaderProps<TData>): JSX.Element {
  const lic = useLicenseStatus();
  const headerGroups = table.getHeaderGroups();
  return (
    <>
      <thead className="bg-gray-50">{/* ... existing rows ... */}</thead>
      {lic.watermarkRequired && typeof document !== 'undefined'
        ? createPortal(<Watermark required />, document.body)
        : null}
    </>
  );
}
```

**문제**: `<MultiRowHeader>` 의 return type 이 `<thead>` 가 아니라 `Fragment` 로 변경 — 그러나 `<MultiRowHeader>` 의 표면 contract 는 보존됨 (parent `<table>` 의 child 로 동작 — portal 은 React tree 에서 분리되어 DOM 만 body 로 이동). **HTML-valid + parent `<table>` 호환**.

| Pro | Con |
|-----|-----|
| `<thead>` 변경 0 — 기존 외부 의존 (스타일/구조) 회귀 0 | grid-pro-header 가 `react-dom` 의 `createPortal` 사용 → react-dom peerDep 필요 (확인: 부재) |
| body 우상단에 노출 — visible enforcement 강 | SSR 환경 미검증 (storybook 부트스트랩 deferred) |
| 다른 옵션 (D-D 통합) 과 메커니즘 통일 가능 | 여러 `<MultiRowHeader>` 동시 mount 시 watermark 중복 (dedup 필요) |

**probe**: D-D probe 가 이 패턴 검증 — typecheck 통과.

### 4.2 옵션 H-B: 반환 JSX 변경 (Fragment 또는 wrapper)

옵션 B-1: `<thead>` 만 반환 → `<Fragment><thead/><div className="absolute">...</div></Fragment>` 로 변경

**문제**: parent 가 `<table>` 인데 Fragment 안의 `<div>` 는 `<table>` 의 invalid child → React 가 hydration warning + browser 가 `<div>` 를 `<table>` 외부로 이동 (table DOM 정리 동작). **HTML-invalid + 시각 회귀 보장**.

옵션 B-2: `<thead>` 만 반환 → `<thead>` wrapper 도입 (`<thead><tr><th>...Watermark...</th></tr></thead>`) — 이것은 본 sub-spec 의 H-D 와 동일 (구분 의미 없음).

옵션 B-3: contract 변경 — `<MultiRowHeader>` 가 `<table>` 자체를 반환

**문제**: public API 변경 = MAJOR. legacy `GroupedHeaderGrid.tsx:128-160` 이 자체 `<table>` 안에 `<MultiRowHeader>` 를 child 로 사용 — 변경 시 GroupedHeaderGrid 도 변경 필요 (legacy alias 도 변경). 사용자 §9.4=C (minor) 와 충돌.

| Pro | Con |
|-----|-----|
| (B-3) 컴포넌트 자체로 enforcement 완결 | MAJOR semver — §9.4=C 충돌 |
| (B-1) | HTML-invalid — browser DOM rewrite 보장 |

**평가**: H-B 의 sub-variants 모두 부적합 (B-1 invalid, B-2 = H-D, B-3 MAJOR).

### 4.3 옵션 H-C: license check 만 (시각 enforcement 0)

```tsx
export function MultiRowHeader<TData>({ ... }: ...): JSX.Element {
  const lic = useLicenseStatus();
  if (lic.watermarkRequired) console.error('[grid-pro-header] Pro license required');
  return <thead>{/* ... */}</thead>;
}
```

| Pro | Con |
|-----|-----|
| 코드 단순 — wrapper/portal 불필요 | 사용자 §9.1=B 의 "7/7 강제" 의도 미달성 (시각 enforcement 0) |
| 1차 spec §3.1 W-1 옵션과 유사 — 단 hook 사용으로 stale UI 해결 | log 만으로 enforcement 충분한가? POL-DOC-LIC §1.2 의도와 정합? — 사용자 §9.1=B 의 강제 의도와 충돌 |

**평가**: §9.1=B 의도 미달성. 채택 시 §9.1 재고 필요.

### 4.4 옵션 H-D: `<thead>` 내 추가 `<tr><th>` watermark 행 (advisor 발견 신규 옵션)

```tsx
export function MultiRowHeader<TData>({ table, ... }: MultiRowHeaderProps<TData>): JSX.Element {
  const lic = useLicenseStatus();
  const headerGroups = table.getHeaderGroups();
  const visibleLeafCount = table.getVisibleLeafColumns().length;
  return (
    <thead className="bg-gray-50">
      {lic.watermarkRequired ? (
        <tr>
          <th colSpan={visibleLeafCount} className="relative bg-yellow-50">
            <Watermark required />
          </th>
        </tr>
      ) : null}
      {headerGroups.map((headerGroup, rowIndex) => {
        /* ... existing rows unchanged ... */
      })}
    </thead>
  );
}
```

**HTML 유효성**: `<thead>` 의 children 으로 `<tr>` 합법. `<tr>` 의 child 로 `<th>` 합법. `<th>` 의 child 로 `<div>` (Watermark 의 출력) 합법. **HTML-valid**.

**Watermark 위치**: `<th className="relative">` 이 부모 stacking context → Watermark 의 `absolute top-0 right-0` 가 `<th>` 우상단 (= `<thead>` 우상단 = grid 우상단) 에 자리잡음. **시각 enforcement 강 + 자연스러운 위치**.

| Pro | Con |
|-----|-----|
| HTML-valid + portal 불필요 + SSR 무관 | watermark 행이 추가됨 → 헤더 row 수가 +1 됨 (sticky/frozen 계산 영향 — `enableStickyHeader` 시 row 0 의 sticky 가 watermark row 가 됨 → 의도된 헤더 row 가 row 1 로 밀림) |
| `<thead>` 변경 0 — return type 동일 (`<thead>`) | 사용자 시각 회귀 — invalid 환경에서 그리드 헤더가 24px 증가 (오히려 enforcement 의도 부합) |
| 추가 dependency 0 (`react-dom` import 0) | sticky/frozen logic 의 rowIndex 가정이 row 0 = 일반 헤더 가정 — watermark row 가 row 0 이 되면 기존 sticky 동작 변경 (D-3 결정 필요) |
| probe typecheck 통과 (`packages/grid-pro-header/src/__probe__/multirow-watermark-row.probe.tsx` → exit 0) | Watermark 의 `top-0 right-0` 가 `<th>` 의 컨텐츠 영역 우상단 (=cell 우상단) 위치 — `<thead>` 우상단과 시각적으로 동일 (advisor 확인 필요) |

**probe 검증**: ✅ `pnpm -F @tomis/grid-pro-header typecheck` → exit 0 (strict + exactOptionalPropertyTypes + verbatimModuleSyntax).

**D-3 결정 필요**: watermark row 가 row 0 인 경우 기존 sticky logic (line 110-120) 의 `rowIndex === 0` 조건이 watermark row 에 적용됨 — 의도 안 맞음. 두 가지 처리:
- (a) watermark row 에 `sticky top-0 z-10` 강제 적용 — 헤더 top 에 고정 + 일반 헤더는 watermark row 아래로 밀림 (top: 24px etc)
- (b) watermark row 는 sticky 안 함 — scroll 시 watermark 가 사라짐 (enforcement 약화)
- (c) `enableStickyHeader` 가 true 일 때만 watermark row 도 sticky 적용 + `--grid-header-row-height` 계산 보정 (복잡도 ↑)

**권고**: H-D 의 D-3 결정 = (a) — 가장 단순 + enforcement 일관.

### 4.5 권고: H-D (기본 — 모든 시나리오)

| 시나리오 | MultiRowHeader 권고 |
|---------|-------------------|
| DataMapCell = D-D (singleton portal) — **기본 권고 경로** | **H-D** — portal 은 architectural 으로 필요한 경우 (DataMapCell — host DOM 부재) 만 사용. MultiRowHeader 는 native `<tr>` 수단. 1차 spec 의 5 inline 컴포넌트와 일관 (5 inline + Header 의 `<tr>` 도 inline 의 한 형태). |
| DataMapCell = D-A (contract 변경, MAJOR) — §9.4 재고 시나리오 | H-D 또는 H-A 무관 — D-A spec 별도 작성 |

**최종 권고**: **H-D (단독)** — H-A 채택 시 5 컴포넌트 (1차 spec 의 inline) + 2 컴포넌트 (Header+Cell portal) 로 메커니즘 *분리* → "메커니즘 통일" 효과 부재. H-D 는 portal 사용을 정말 필요한 케이스 1건 (DataMapCell) 만으로 한정.

---

## 5. DataMapCell 옵션 평가 (D-A / D-B / D-C / D-D)

### 5.1 옵션 D-A: contract 변경 (cell renderer → grid wrapper)

DataMapCell 의 public 시그니처를 `(info: CellContext) => <span>` → `<DataMapGrid table={table}>` wrapper 로 변경.

| Pro | Con |
|-----|-----|
| 완전 enforcement — wrapper 가 `<div className="relative">` + `<Watermark/>` 직접 렌더 가능 | **public contract 변경 = MAJOR semver** (POL-COMPAT §3.1) |
| TanStack column.cell 슬롯에서 분리 — 책임 명확화 | 사용자 §9.4=C (minor) 와 **정면 충돌** → §9.4 재고 필요 |
| storybook stories (D-2) 도 wrapper 패턴으로 변경 | 사용자 코드의 `cell: DataMapCell` 등록 패턴 전부 변경 — 마이그레이션 path 의무 |

**평가**: 완전 enforcement 가능. 단 MAJOR 비용. 사용자 §9.4=C 와 충돌 → 채택 시 사용자 재확인 필수.

### 5.2 옵션 D-B: per-table watermark (DataMapCell 사용 컬럼이 있는 Table 의 wrapper)

DataMapCell 자체는 변경 0. 사용자가 `cell: DataMapCell` 을 등록한 Table 의 wrapper (예: AggregationGrid, MasterDetailGrid 등) 가 자동으로 Watermark 렌더.

| Pro | Con |
|-----|-----|
| DataMapCell 변경 0 — semver 영향 0 | DataMapCell 사용 column 이 있는 Table 을 **누가 감지 하나** — 사용자가 `<AggregationGrid>` 에 columns 으로 `cell: DataMapCell` 등록 시 AggregationGrid 가 이를 자동 인식? — 아니. column 메타데이터 검사 코드 필요 (Table 측에 grid-pro-datamap 의존성 도입 → 패키지 경계 위반) |
| 1차 spec 의 5 컴포넌트 wiring 으로 자연 통합 — 추가 코드 0 | 사용자가 grid-pro-datamap 를 import 했지만 **DataMapCell 사용 column 이 없는** 경우 enforcement 0 (예: createDataMap 만 사용) — §9.1=B 의도 미달성 |
| 사용자 §9.4=C minor 호환 | "DataMapCell 컬럼이 있는 Table" 을 감지하는 메커니즘 부재 — 사용자가 `<NormalTable>` 에 등록 시 enforcement 0 |

**평가**: §9.1=B 의 7/7 강제 의도와 정합 부족 — 패키지 enforcement 가 다른 패키지의 협조에 의존.

### 5.3 옵션 D-C: license check 만 (시각 enforcement 0)

```tsx
// packages/grid-pro-datamap/src/index.ts
import { checkLicense } from '@tomis/grid-license';
const _lic = checkLicense();
if (_lic.watermarkRequired) console.error('[grid-pro-datamap] Pro license required');
```

(현 module load side-effect `checkLicense();` 결과 폐기 패턴의 변형 — 결과를 console 로 expose)

| Pro | Con |
|-----|-----|
| DataMapCell 변경 0 + 코드 ~3 LOC | 시각 enforcement 0 — §9.1=B "강제" 의도 미달성 |
| H-C 와 동일 패턴 — 컴포넌트별 정책 통일 | 사용자가 console 닫으면 enforcement 0 (1차 ADR 대안 1 의 각하 이유 동일) |

**평가**: §9.1=B 의도 미달성.

### 5.4 옵션 D-D: document-level singleton portal Watermark (advisor 발견 신규 옵션)

`grid-license` 에 `useWatermarkEnforcement()` void hook (또는 module-level mount-time portal) 신설 → Pro 패키지의 진입점 (index.ts 또는 컴포넌트) 에서 호출 → invalid license 시 **document.body 에 singleton Watermark 1회** mount (ref-count dedup).

```tsx
// grid-license 내부 (예시)
let _portalMountCount = 0;
let _portalContainer: HTMLDivElement | null = null;
let _portalRoot: Root | null = null;

export function mountWatermarkPortal(): () => void {
  if (typeof document === 'undefined') return () => {};
  _portalMountCount++;
  if (_portalMountCount === 1) {
    _portalContainer = document.createElement('div');
    _portalContainer.setAttribute('data-tomis-watermark', '');
    document.body.appendChild(_portalContainer);
    _portalRoot = createRoot(_portalContainer);
    _portalRoot.render(<Watermark required />);
  }
  return () => {
    _portalMountCount--;
    if (_portalMountCount === 0 && _portalRoot && _portalContainer) {
      _portalRoot.unmount();
      _portalContainer.remove();
      _portalRoot = null;
      _portalContainer = null;
    }
  };
}

// React-friendly **void registration** hook (권고):
export function useWatermarkEnforcement(): void {
  useEffect(() => {
    _portalMountCount++;
    if (_portalMountCount === 1) mountPortal(); // helper from above
    return () => {
      _portalMountCount = Math.max(0, _portalMountCount - 1);
      if (_portalMountCount === 0) unmountPortal();
    };
  }, []);
}
```

**중요 — anti-pattern 회피**: hook 이 `ReactPortal` 을 반환하는 패턴 (`useWatermarkPortal(): ReactPortal | null`) 은 **500 cell mount 시 500 portal 가 같은 document.body 위치에 stacked** — 시각 결함. advisor 권고 따라 **void registration hook** 채택 (return 값 없음, module-level singleton 만 트리거). 자세한 final pseudocode 는 §8 Step 1 참조.

DataMapCell 에서:
```tsx
export function DataMapCell<TData>(info: CellContext<TData, unknown>): JSX.Element {
  useWatermarkEnforcement(); // void — 500 cell = 500 ref-count, portal 은 1개만 mount
  // ... 기존 로직
  return <span>{text}</span>;
}
```

| Pro | Con |
|-----|-----|
| **§9.1=B + §9.4=C conjunction 만족** — minor (기존 cell DOM 변경 0) + 시각 enforcement (body portal) | hook rule — DataMapCell 이 매 cell 마다 호출됨 → hook 호출 횟수 동적 (문제 없음 — DataMapCell 은 function component, 각 cell 인스턴스가 별도 component instance) |
| DataMapCell 의 architectural reality (per-cell renderer, host DOM 부재) 에 정합 — portal 이 합리적인 유일 옵션 | dedup 메커니즘 필요 (ref-count + module-level createRoot) — 구현 디테일 +60 LOC. void hook 패턴 (ReactPortal 반환 안 함) 필수 |
| Pro 패키지 import 만으로 invalid 시 body 우상단 watermark 자동 노출 | DataMapCell 이 hook 호출 → React 가 hook 인식 (function component 인지 검증) — `<DataMapCell />` JSX 호출은 정상 hook context 이지만 `DataMapCell(info)` 함수 직접 호출 (storybook fixture 패턴) 시 hook 규칙 위반 |
| ref-count 로 unmount 시 portal 자동 정리 | singleton 의 pnpm dedup 의존성 (1차 spec §8.2 #6) — 본 monorepo 범위 내 ok |

**probe 검증**: ✅ `packages/grid-license/src/__probe__/singleton-portal.probe.tsx` → exit 0 (createPortal + SSR guard + useEffect 조합 typecheck 통과).

**평가**: §9.1=B 의 "패키지 단위 enforcement" 해석 (advisor §1 의 (b)) 가 채택될 경우 가장 정합. **단 §9.1 의 granularity 의문 (§9 blocking question) 응답 선행 필요**.

### 5.5 권고

| 사용자 §9.1=B 해석 | 권고 옵션 | semver 영향 |
|------------------|----------|-----------|
| (a) **컴포넌트 단위** 시각 enforcement (= DataMapCell 자체가 watermark 렌더) | **D-A** (contract 변경) | **MAJOR** — §9.4=C 재고 필요 |
| (b) **패키지 단위** enforcement (= grid-pro-datamap 패키지가 enforcement 에 참여) | **D-D** (singleton portal) | **minor** — §9.4=C 호환 |

**§9 blocking question (반드시 사용자 응답 후 진행 가능)**: §9.1=B 의 "7/7" 해석을 (a) 또는 (b) 중 명시.

---

## 6. 사용자 결정 §9.1=B + §9.4=C 정합성

### 6.1 §9.1=B + §9.4=C conjunction 매트릭스

| MultiRowHeader 옵션 | DataMapCell 옵션 | §9.1=B 만족? | §9.4=C 만족? | 비고 |
|-------------------|----------------|------------|------------|------|
| H-D | D-A | ✅ | ❌ (MAJOR) | §9.4 재고 필요 |
| H-D | D-B | △ (Table 경유 — Table 가 DataMap 사용 column 인식 필요) | ✅ | 경계 위반 위험 |
| H-D | D-C | ❌ (DataMapCell enforcement 0) | ✅ | §9.1 미달성 |
| H-D | D-D | ✅ | ✅ | **기본 권고** (§9.1=B 의 해석 (b) 가정) — portal 1건 (DataMapCell) 만 |
| H-A | D-D | ✅ | ✅ | 대안 — Header 도 portal. 5 inline 컴포넌트와 메커니즘 *분리* → 통일 효과 없음 |
| H-C | D-C | ❌ (둘 다 시각 enforcement 0) | ✅ | §9.1 미달성 |

### 6.2 권고 conjunction (재검증 — §0 권고와 일치)

**최적 conjunction**: **H-D (extra `<tr>`) + D-D (singleton portal)** — portal 을 **architectural 으로 필요한 경우만** (DataMapCell — host DOM 부재) 사용 + MultiRowHeader 는 native HTML 수단 (`<thead>` 내 `<tr>`) 으로 enforcement.

**1차 spec §7 Step 4-5 와 분담 매트릭스**:

| 컴포넌트 | 1차 spec 클래스 | wiring 메커니즘 |
|---------|--------------|--------------|
| AggregationGrid | A | inline `<Watermark>` inside wrapper `<div>` |
| MasterDetailGrid | A | inline `<Watermark>` inside wrapper `<div>` |
| RangeSelectGrid | A | inline `<Watermark>` inside existing relative `<div>` |
| MergingGrid | B | inline `<Watermark>` inside new wrapper `<div>` |
| ChangeTrackingGrid | B | inline `<Watermark>` inside new wrapper `<div>` |
| **MultiRowHeader** | C | **`<tr><th>` watermark row inside `<thead>` (H-D)** |
| **DataMapCell** | C | **singleton portal `createPortal(<Watermark/>, document.body)` (D-D)** |

**핵심 정당화** (advisor 권고 반영):
- "H-A + D-D 메커니즘 통일" 주장은 **부정확** — 1차 spec 의 5 컴포넌트는 inline + H-A 채택 시 2 컴포넌트는 portal → 메커니즘 *분리* 가 더 커짐
- H-D 채택 시: 6 컴포넌트 (5 클래스 A/B + MultiRowHeader) = inline + 1 컴포넌트 (DataMapCell) = portal. portal 은 정말 필요한 케이스 (per-cell renderer, host DOM 부재) 만 사용.

**차선 conjunction**: **H-A (portal) + D-D** — Header + Cell 둘 다 portal. 단 5 컴포넌트와 메커니즘 분리 (inline vs portal) — 통일 효과 없음. spec 복잡도만 증가.

**비추천**: D-A 채택 시 §9.4 → MAJOR 재고 필요 (사용자 결정 변경 의무).

### 6.3 §9.1=B 의 granularity 의문 — sub-spec 의 blocking question

§9.1=B 의 "7/7 컴포넌트 강제" 의 정확한 의도가 다음 중 어느 것인지 사용자가 명시해야 sub-spec 완성 가능:

| 해석 | 의미 | DataMapCell wiring 결과 |
|------|------|---------------------|
| (a) 컴포넌트 단위 시각 enforcement | `<DataMapCell>` 인스턴스 자체가 시각 enforcement 표현 | D-A (contract 변경, MAJOR) 외 선택지 없음 — §9.4 → MAJOR 재고 |
| (b) 패키지 단위 enforcement | grid-pro-datamap 패키지가 import/mount 시점에 enforcement 메커니즘에 참여 | D-D (singleton portal) — §9.4=C minor 호환 |

**기본 권고**: (b) — DataMapCell 의 architectural reality (per-cell renderer, no grid context) 와 정합. §9.4=C (minor) 보존.

---

## 7. 위험 + 알려진 한계

### 7.1 위험

| 위험 | 옵션 | 영향 | 완화 |
|------|------|------|------|
| `<thead>` 내 watermark `<tr>` 가 `enableStickyHeader` 의 rowIndex 가정 깨뜨림 | H-D | medium | D-3 결정 — watermark row 에 sticky top-0 강제 (권고 (a)) |
| createPortal 의 SSR 환경 미검증 (storybook 부트스트랩 deferred) | H-A, D-D | low | `typeof document === 'undefined'` guard (probe 검증) |
| singleton portal dedup 메커니즘 — pnpm workspace 외 (npm/yarn nested install) 환경 미보장 | D-D | low | 1차 spec §8.2 #6 와 동일 한계 — peer dedup 의무 문서화 |
| DataMapCell 이 storybook fixture 에서 함수 직접 호출 (`DataMapCell(mockCtx)`) 시 hook 규칙 위반 | D-D | low | story 의 비표준 사용 — `<DataMapCell {...mockCtx}/>` 로 변경 필요 (story 측 변경) |
| MultiRowHeader watermark `<tr>` 가 사용자 CSS 의 `thead tr:first-child` 의존 코드와 회귀 | H-D | medium | semver minor 명시 + CHANGELOG |
| H-A (MultiRowHeader portal) 시 `<MultiRowHeader>` 의 return type 이 `<thead>` 가 아닌 `Fragment` 로 변경 — 외부 타입 의존 코드 회귀 | H-A | low | return type `JSX.Element` 동일 — TS 영향 0. 단 사용자 코드에서 직접 `instanceof HTMLTableSectionElement` 검사 시 회귀 (희박) |
| Watermark 의 `top-0 right-0` 가 `<th>` 내부 cell content 영역 기준 위치 — 의도된 `<thead>` 전체 우상단과 시각적 차이 가능 | H-D | low | Storybook 부트스트랩 후 시각 검증 — 본 sub-spec 범위 외 |

### 7.2 알려진 한계

1. **Storybook 시각 검증 deferred** — MOD-GRID-99-B 부트스트랩 후 (1차 spec §8.2 #1 동일).
2. **D-D 의 hook 인지 module-level portal 인지 구현 디테일 미확정** — implementer 단계에서 결정. 본 sub-spec 은 spec 수준 (probe 만).
3. **portal target document.body 의 stacking context 가정** — body 의 transform/filter 등이 적용되어 reference frame 이 변경되면 Watermark 위치 변동. monorepo 사용처 검증 deferred.
4. **react-dom peerDep** — grid-license 가 이미 react-dom peerDep 보유 (peerDependencies 확인됨) → 추가 작업 0.
5. **dedup 의 thread-safety / concurrent React mode** — `useSyncExternalStore` 기반 dedup 시 React 의 concurrent rendering 에서 ref-count race 가능. spec 단계는 단순 atomic counter 가정. 정밀 구현은 implementer.
6. **DataMapCell 이 stories 에서 함수 직접 호출 (mock CellContext)** — `useWatermarkEnforcement()` hook 사용 시 React 외부 호출 → 'Invalid hook call' error. 해결: story 측 `<DataMapCell {...mockCtx} />` JSX 사용 강제 — D-D 채택 시 story 갱신 필요 (별도 작업).
7. **MultiRowHeader 의 D-3 결정**: watermark row 의 sticky 처리 — implementer 단계 (a/b/c 중 권고 (a)).

---

## 8. 통합 구현 단계 (1차 spec §7 의 7/7 확장)

본 sub-spec 의 권고는 다음 구현 단계로 표현 — 1차 spec §7 의 Step 1-7 을 보강한다.

### Step 0 — 사용자 §9 blocking question 응답 수령 (선행 필수)

- §9.1=B 의 granularity (a) / (b) 명시.
- (b) 채택 시 본 sub-spec 진행. (a) 채택 시 §9.4 재고 후 D-A spec 작성 필요 (별도 sub-spec).

### Step 1 — grid-license: subscribe + useLicenseStatus + (D-D 채택 시) singleton portal 추가

1차 spec §7 Step 1-3 동일 + 추가:

**파일**: `packages/grid-license/src/useWatermarkEnforcement.ts` (신규, D-D 채택 시)

**구현 패턴 — module-level singleton (createRoot 1회 mount, ref-counted unmount)**:

핵심 의도: hook 은 **void registration** (portal element 반환 X — module-level mount/unmount 만 트리거). 500 cell mount 시 500 호출 발생하나 portal 은 정확히 1개만 document.body 에 존재.

```ts
import { useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Watermark } from './Watermark.js';
import { subscribeLicense, getLicenseState } from './state.js';
import { checkLicense } from './checkLicense.js';

// Module-level singleton state.
let _activeCount = 0;
let _portalContainer: HTMLDivElement | null = null;
let _portalRoot: Root | null = null;
let _unsubLicense: (() => void) | null = null;

function renderWatermark(): void {
  if (_portalRoot === null || typeof document === 'undefined') return;
  const lic = checkLicense();
  _portalRoot.render(lic.watermarkRequired ? <Watermark required /> : null);
}

function mountPortal(): void {
  if (typeof document === 'undefined') return;
  if (_portalContainer !== null) return; // already mounted
  _portalContainer = document.createElement('div');
  _portalContainer.setAttribute('data-tomis-watermark', '');
  document.body.appendChild(_portalContainer);
  _portalRoot = createRoot(_portalContainer);
  renderWatermark();
  _unsubLicense = subscribeLicense(renderWatermark); // re-render on license change
}

function unmountPortal(): void {
  if (_portalRoot !== null) _portalRoot.unmount();
  if (_portalContainer !== null) _portalContainer.remove();
  if (_unsubLicense !== null) _unsubLicense();
  _portalRoot = null;
  _portalContainer = null;
  _unsubLicense = null;
}

/**
 * Void registration hook. Each mount increments the ref-count; first mount
 * creates the singleton portal at document.body. Last unmount tears it down.
 *
 * - 500 DataMapCells mounted → 500 hook calls → portal rendered ONCE.
 * - License state change (setLicenseKey) → portal re-renders via subscribe.
 * - SSR-safe: portal init skipped when document is undefined.
 */
export function useWatermarkEnforcement(): void {
  useEffect(() => {
    _activeCount++;
    if (_activeCount === 1) mountPortal();
    return () => {
      _activeCount = Math.max(0, _activeCount - 1);
      if (_activeCount === 0) unmountPortal();
    };
  }, []);
}
```

**핵심 차이 vs 1차 sub-spec draft pseudocode**:
- 이전 draft 의 `useWatermarkPortal()` 은 `ReactPortal` 반환 — 500 cell 인 경우 500 portal stacked at same `document.body` location (= rendering 결함). advisor 발견.
- 본 final pseudocode 는 **void hook + module-level createRoot 1회** — singleton 보장. ref-count 0 → unmount + subscribe 정리.
- `createRoot` (React 18+) 사용 — React 19 호환.

**기대 LOC**: +60 (`useWatermarkEnforcement.ts` 신규)

**위험 — concurrent rendering ref-count race**: React 18+ concurrent mode 에서 mount/unmount 순서 비결정성 가능. spec 단계는 atomic counter 가정. 실 구현 시 `useSyncExternalStore` 기반 dedup 도 고려 — implementer 결정.

### Step 2 — grid-license: index.ts export 보강 (D-D 채택 시)

```ts
export { useWatermarkEnforcement } from './useWatermarkEnforcement.js';
```

### Step 3 — 5 클래스 A/B 컴포넌트 wiring (1차 spec §7 Step 4-5 동일)

변경 없음 — 1차 spec 따름.

### Step 4 — MultiRowHeader wiring (H-D 또는 H-A)

**옵션 H-D 채택 시** (`packages/grid-pro-header/src/MultiRowHeader.tsx`):
- import 추가: `import { useLicenseStatus, Watermark } from '@tomis/grid-license';`
- 컴포넌트 본문 첫 줄: `const _lic = useLicenseStatus();`
- `<thead>` 의 children 가장 앞에 conditional watermark row 추가:
  ```tsx
  return (
    <thead className="bg-gray-50">
      {_lic.watermarkRequired ? (
        <tr className={enableStickyHeader === true ? 'sticky top-0 z-10' : ''}>
          <th colSpan={table.getVisibleLeafColumns().length}
              className="relative bg-yellow-50 px-4 py-1 text-center text-xs text-gray-500">
            <Watermark required />
          </th>
        </tr>
      ) : null}
      {headerGroups.map((headerGroup, rowIndex) => { /* ... existing ... */ })}
    </thead>
  );
  ```
- D-3 결정 (a) 적용 — watermark row 에 sticky 강제 (`enableStickyHeader === true` 일 때만 sticky 적용 권고)

**옵션 H-A 채택 시** (대안):
- import 추가: `import { useWatermarkEnforcement } from '@tomis/grid-license';`
- 컴포넌트 본문 첫 줄: `useWatermarkEnforcement();` (void registration — return value 없음)
- return `<thead>` 그대로 — portal 은 document.body 에 singleton mount (외부 사용처와 분리)
- `<MultiRowHeader>` 의 return type 유지 (`<thead>`) — public contract 회귀 0

**probe 권고**: 변경 후 `pnpm -F @tomis/grid-pro-header typecheck` exit 0 확인.

### Step 5 — DataMapCell wiring (D-D 채택 시)

**파일**: `packages/grid-pro-datamap/src/DataMapCell.tsx`

```tsx
import { useWatermarkEnforcement } from '@tomis/grid-license';

export function DataMapCell<TData>(
  info: CellContext<TData, unknown>,
): JSX.Element {
  useWatermarkEnforcement(); // void — module-level singleton portal mount
  const value = info.getValue();
  const columnDef = info.column.columnDef as DataMapColumnDef<TData>;
  const resolved = resolveDataMap(columnDef.dataMap, info.row.original);
  const label = resolved?.getDisplay(value);
  const text = label !== undefined ? label : String(value ?? '');
  return <span>{text}</span>;
}
```

**핵심**: hook 은 void registration. 500 cell 활성 = 500 ref-count 증가 → portal 은 정확히 1회 mount. 마지막 unmount 시 cleanup.

**주의 — story 호환성 회귀**:
- `packages/grid-pro-datamap/stories/DataMap.stories.tsx:93,102` 의 `<DataMapCell {...makeMockCellContext('01')} />` 는 JSX 호출 → 정상 (hook 사용 가능).
- `__stories__/DataMapCell.stories.tsx` 의 column args 는 placeholder string 만 — 영향 없음.
- 단, 외부 사용자가 함수 직접 호출 (`DataMapCell(mockCtx)`) 시 'Invalid hook call' 에러. 본 sub-spec 범위 외 — README 에 JSX 사용 의무 명시 권고.

**probe 권고**: `pnpm -F @tomis/grid-pro-datamap typecheck` exit 0 확인.

### Step 6 — CHANGELOG / Changeset (1차 spec §7 Step 6 보강)

추가 항목:
- `packages/grid-license/CHANGELOG.md` — minor: `useWatermarkEnforcement` void hook 추가 (D-D 채택 시)
- `packages/grid-pro-header/CHANGELOG.md` — minor: invalid license 시 Watermark row (H-D) 또는 portal (H-A)
- `packages/grid-pro-datamap/CHANGELOG.md` — minor: invalid license 시 singleton portal Watermark (D-D)

### Step 7 — 검증 (1차 spec §7 Step 7 보강)

```bash
# 추가 typecheck
pnpm -F @tomis/grid-pro-header typecheck
pnpm -F @tomis/grid-pro-datamap typecheck

# 정적 grep — 7/7 컴포넌트 enforcement 확인
Grep "Watermark|watermarkRequired|useWatermarkEnforcement" packages/ --glob "!**/dist/**" --glob "!**/stories/**"
# 기대: grid-license + 7 Pro 패키지 = 최소 8 패키지
```

---

## 9. 사용자 재확인 지점 (blocking + non-blocking)

### 9.1 **BLOCKING — §9.1=B 의 granularity (a) / (b) 명시**

본 sub-spec 의 implementer 진입 불가 사유. 다음 두 해석 중 사용자 명시 응답 필수:

| 해석 | 의미 | sub-spec 진행 경로 |
|------|------|-----------------|
| **(a) 컴포넌트 단위 시각 enforcement** | `<DataMapCell>` 인스턴스 자체가 시각 enforcement (per-cell or per-row) | **D-A** 채택 → **§9.4 → MAJOR 재고** 별도 결정 필요. 본 sub-spec 무효 → MAJOR 변경 sub-spec 별도 작성 |
| **(b) 패키지 단위 enforcement** | grid-pro-datamap 패키지가 import/mount 시점에 enforcement 메커니즘 참여 (DataMapCell 자체 시각 변경 0) | **D-D** 채택 → 본 sub-spec 진행. §9.4=C 보존 |

**기본 권고**: **(b)** — DataMapCell 의 architectural reality 와 정합 + §9.4=C 보존.

### 9.2 NON-BLOCKING — MultiRowHeader 옵션 H-D vs H-A

| 옵션 | 권고 시나리오 |
|------|-----------|
| **H-D (extra `<tr>`)** | **기본 권고** — portal 은 architectural 으로 필요한 경우만 (DataMapCell), MultiRowHeader 는 native HTML 수단 (`<thead>` 내 `<tr>`) — 1차 spec 의 5 inline 컴포넌트와 동일한 inline 패턴 |
| **H-A (portal)** | H-D 의 watermark row sticky 정책 (D-3) 가 복잡하다고 판단 시 — 단 5 컴포넌트와 메커니즘 *분리* (5 inline vs 2 portal) → 통일 효과 없음 |

**기본 권고**: **H-D + D-D** — portal 사용을 정말 필요한 케이스 (per-cell renderer, host DOM 부재) 만으로 한정.

### 9.3 NON-BLOCKING — H-D 채택 시 watermark row 의 sticky 처리 (D-3)

| 옵션 | 동작 |
|------|------|
| (a) `enableStickyHeader === true` 시 watermark row 도 sticky top-0 — 기존 row 0 은 row 1 로 밀림 | enforcement 일관 + 시각적 자연 |
| (b) watermark row sticky 안 함 — scroll 시 watermark 사라짐 | enforcement 약화 |
| (c) sticky logic 보정 (CSS variable 갱신) | 복잡도 ↑ |

**기본 권고**: **(a)** — 가장 단순 + enforcement 일관.

### 9.4 NON-BLOCKING — D-A 채택 시 사용자 §9.4=C → MAJOR 재고 (cross-check)

**조건**: §9.1 = (a) 컴포넌트 단위 채택 시.

§9.4=C 의 minor + 즉시 Watermark 결정은 D-A 의 MAJOR 비용과 충돌. (a) 채택 시 다음 중 선택:
- D-A + MAJOR — 사용자 §9.4=C 변경 (minor → major) 의무 + migration guide
- D-A 거부 + (a) 해석 폐기 → (b) 채택 → D-D 진행

---

## 10. 다음 단계 권고

### 10.1 implementer 직진 가능 조건

다음 4가지 모두 만족 시 implementer 위임 가능:

1. §9.1 granularity = **(b)** 패키지 단위 — 응답 수령
2. MultiRowHeader = **H-D** (기본 권고) 또는 H-A (대안) — 응답 수령
3. DataMapCell = **D-D** (singleton portal) — 응답 수령
4. §9.4=C 보존 (변경 없음) — 자동 확인

위 4 조건 충족 시:
- 1차 spec §7 Step 1-3 + 본 sub-spec §8 Step 4-5 결합 spec 으로 implementer 위임
- Step 4-5 의 probe (typecheck) 통과 후 build + grep 검증

### 10.2 추가 결정 필요 조건

다음 중 1건이라도 발생 시 추가 sub-spec 또는 결정 사이클 필요:

1. §9.1 = **(a)** 채택 → D-A spec 별도 작성 + §9.4 MAJOR 재고
2. MultiRowHeader = **H-C** 채택 → §9.1 의도 미달성 — §9.1 재고
3. DataMapCell = **D-C** 채택 → 동일 — §9.1 재고

### 10.3 별도 ADR 권고 (변경 없음 — 1차 spec §10.3 동일)

- **ADR-017** (신설 검토 — 본 sub-spec 으로 부분 흡수): MultiRowHeader + DataMapCell 의 license enforcement 정책. 본 sub-spec 채택 후 ADR-001 본문에 흡수 가능 (별도 ADR 불필요).
- **ADR-015**: inline `verifyOrWarn` / `_verifyGridLicenseStub` 잔재 sweep — 1차 spec + 본 sub-spec 의 후행 작업.

---

## 11. 본 sub-spec 의 검증 메타데이터

| 항목 | 값 |
|------|-----|
| 실 코드 변경 | **0건** (모든 probe 삭제 + baseline 복구 확인) |
| probe typecheck (H-D) | ✅ `packages/grid-pro-header/src/__probe__/multirow-watermark-row.probe.tsx` → exit 0 (삭제됨) |
| probe typecheck (D-D) | ✅ `packages/grid-license/src/__probe__/singleton-portal.probe.tsx` → exit 0 (삭제됨) |
| MultiRowHeader 사용처 인벤토리 | 3건 (legacy GroupedHeaderGrid + storybook + tw-framework-front 0 직접 사용) |
| DataMapCell 사용처 인벤토리 | 4건 (public export + 2 stories + tw-framework-front 0 직접 사용) |
| 옵션 평가 | MultiRowHeader 4건 (H-A/H-B/H-C/**H-D**) + DataMapCell 4건 (D-A/D-B/D-C/**D-D**) |
| 사용자 결정 §9.1+§9.4 정합성 | **(b) + H-D + D-D** (기본) 또는 **(b) + H-A + D-D** (대안) = compatible / **(a)** = §9.4 MAJOR 재고 필요 (충돌) |
| 사용자 재확인 지점 | 1건 BLOCKING (§9.1 granularity) + 3건 NON-BLOCKING (§9.2 H-D/H-A, §9.3 D-3 sticky, §9.4 cross-check) |
| advisor 발견 옵션 | H-D (extra `<tr>`) + D-D (singleton portal) — 1차 task 의 3 옵션 (A/B/C) 외 신규 |

---

## 12. Conjunction Summary (한 줄)

**권고 conjunction (final)**: 사용자 §9.1 응답 **(b) 패키지 단위 enforcement** 채택 시 → **H-D (extra `<tr>`) + D-D (singleton portal)** = §9.1=B + §9.4=C 만족 + portal 사용을 architectural 필요 케이스 (DataMapCell — host DOM 부재) 만으로 한정 + 1차 spec 의 5 inline 컴포넌트와 일관 + 두 probe 통과. 대안: **H-A + D-D** (Header 도 portal — 단 5 inline 컴포넌트와 메커니즘 분리 — 통일 효과 없음).

**충돌 시나리오**: 사용자 §9.1 응답 **(a) 컴포넌트 단위 enforcement** 채택 시 → **D-A (contract 변경, MAJOR)** → **§9.4=C → MAJOR 재고 필요**. 본 sub-spec 무효 → 별도 MAJOR sub-spec 작성 필요.

---

**sub-spec writer signed-off**: 사용자 §9.1 BLOCKING question 응답 후 implementer 위임 가능. probe 2건 모두 typecheck exit 0 — 실 코드 변경 0건 + baseline 복구 확인.
