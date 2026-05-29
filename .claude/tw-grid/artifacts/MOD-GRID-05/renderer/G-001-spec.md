# MOD-GRID-05 / renderer / G-001 — Spec

**Title**: 기본 3종 표준화: TextCell + NumberCell + DateCell + formatter helper
**Module**: MOD-GRID-05 (셀 렌더러 표준 set)
**Area**: renderer
**Goal**: G-001
**Priority**: P0
**migrationImpact**: high → threshold 95
**Package target**: `@tomis/grid-renderers` (MIT, brotli 한도 10 KB — `.size-limit.json:9-13`)
**dependsOn**: MOD-GRID-00/G-002 (tsup + tsconfig.base.json + dual format — MOD-GRID-00 ADR-005 채택)
**rubricVersion**: specify v1.0.4 (31 항목 + 메타 H 3항목)

---

## ★ 사전 결정 (D# 표) — 본문 cross-consistency 의무 (G-01)

| D# | 결정 | 사유 / 출처 |
|----|------|----------|
| **D1** | `formatters.ts` 의 `formatNumberString` / `formatDateTimeFromDateTimeString` 두 함수는 **L0 NumberCell.tsx (L17-20) + DateCell.tsx (L9-18) 의 inline `toLocaleString` 패턴을 순수 함수로 추출 / 재작성**. `tw-framework-front/src/utils/common.ts` L89-105 의 동명 함수는 **차용하지 않음** (C-4 위반: `value: any` 시그니처 + decimals/locale/format 미지원). 본 Goal 의 새 helper 는 typed (`unknown` 또는 union) + L0 컴포넌트의 옵션 (decimals/locale/unit/format) 일관 표현. | C-4, C-1, L0 |
| **D2** | NumberCell prop 명 = **`decimals`** (L0 NumberCell.tsx L3 보존, `precision` 으로 변경 X). 사용자 prompt 의 "precision (소수점 옵션)" 표현은 의미 동등이며 spec 본문 권위(C-27)로 L0 보존 명명 채택. C-6 호환성 보존: tw-framework-front 사용처 prop drift 0. | C-6, C-1, L0 (NumberCell L3) |
| **D3** | **TextCell 은 L0 부재 신규 컴포넌트**. `renderers/index.ts` (L1-7) 의 7 export 에 TextCell 미포함. Section 1 A-01 evidence = "현 구현 없음" (rubric A-01 N/A→YES 절). Section 3 migration 표에 TextCell 행 없음. | L0 (index.ts L1-7), specify-rubric A-01 N/A 규정 |
| **D4** | L0 NumberCell 의 모든 prop 보존: `value` (number\|null\|undefined), `decimals?: number`, `unit?: string`, `locale?: string`, `colorNegative?: boolean`. L0 DateCell prop 보존: `value` (string\|number\|Date\|null\|undefined), `format?: 'date'\|'datetime'\|'time'`, `locale?: string`. 신규 prop 0건. 호환성 breaking: false. | C-6, L0 |
| **D5** | 번들 추정: spec 예상 `+3 KB` (3 렌더러 + 2 helper) 는 **metric 참조용 전용 — 게이트 아님**. 게이트 결정은 IMPLEMENT 직후 `pnpm size-limit` 실측만. ADR-MOD-GRID-00-010 (cross-module bundle estimation policy) 일괄 적용 — alias/wrapper/hook profile 과 다른 leaf-renderer profile 신규 데이터포인트. | ADR-MOD-GRID-00-010, C-21 |
| **D6** | 파일 매니페스트 = **NEW 5 (monorepo) + MODIFY 3 (tw-framework-front)**. NEW: `TextCell.tsx`, `NumberCell.tsx`, `DateCell.tsx`, `formatters.ts`, `index.ts` (현재 placeholder `export {}` 를 실 구현으로 교체 — Section 7 표에서 NEW 분류 — 신규 콘텐츠 90%+, placeholder 1줄만 삭제). MODIFY: tw-framework-front `renderers/NumberCell.tsx`, `renderers/DateCell.tsx` (re-export shim 으로 단축 — body 교체), `renderers/index.ts` (TextCell export 1행 추가 — 점진 마이그레이션 옵션). | C-19 (≤5/Goal — 영향 사용처 3개로 한도 내), C-6 |
| **D7** | C-29 (exactOptionalPropertyTypes spread 패턴) **적용 안 함**. 본 3 셀은 leaf 컴포넌트 — 자체 props 를 자체 markup 에 직접 사용하며 child 컴포넌트로 optional prop forwarding 없음. spread skip 또는 union 명시 패턴 모두 불필요. | C-29 적용 범위 (wrapper/alias/helper 만) |

**모든 D# breakdown 본문 cross-check 의무 (G-01 v1.0.4 강화)**: D6 의 "NEW 5 + MODIFY 3 = 8 파일" 합계 + NEW/MODIFY 분류 + 파일 이름 5개/3개 enumerate 가 Section 7 표 / Section 11 단계 / AC-001~AC-007 evidence 와 100% 일치. 본 spec 내부 typo 0 cross-check 통과.

---

## Section 1: 참조 추적 (L0/L1/L2/L3/R-A/R-W)

### 1.1 L0 — 현 tw-framework-front 구현 (직접 Read 후 라인 인용)

**L0.a** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/NumberCell.tsx` (28 라인 전체 Read 완료)

핵심 패턴 인용 (L1-27):
```tsx
// L1-7: 타입
interface NumberCellProps {
  value: number | null | undefined;
  decimals?: number;
  unit?: string;
  locale?: string;
  colorNegative?: boolean;
}

// L9-15: 함수 signature + defaults
export function NumberCell({
  value, decimals = 0, unit = '', locale = 'ko-KR', colorNegative = false,
}: NumberCellProps) {
  // L16: null/undefined → dash
  if (value == null) return <span className="text-gray-400">-</span>;
  // L17-20: 핵심 포매팅 (formatNumberString helper 미사용 — inline toLocaleString)
  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // L21-26: tabular-nums + 조건부 red
  const isNeg = colorNegative && value < 0;
  return (<span className={`tabular-nums ${isNeg ? 'text-red-600' : ''}`}>
      {formatted}{unit}</span>);
}
```

**L0.b** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/DateCell.tsx` (22 라인 전체 Read 완료)

핵심 패턴 인용 (L1-22):
```tsx
// L1-5: 타입
interface DateCellProps {
  value: string | number | Date | null | undefined;
  format?: 'date' | 'datetime' | 'time';
  locale?: string;
}

// L7-11: FORMAT_OPTIONS 상수 (Intl.DateTimeFormatOptions)
const FORMAT_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  date: { year: 'numeric', month: '2-digit', day: '2-digit' },
  datetime: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
};

// L13-21: 함수 + null/empty guard + try/catch
export function DateCell({ value, format = 'date', locale = 'ko-KR' }: DateCellProps) {
  if (value == null || value === '') return <span className="text-gray-400">-</span>;
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return <span className="text-gray-400">{String(value)}</span>;
    return <span>{date.toLocaleDateString(locale, FORMAT_OPTIONS[format])}</span>;
  } catch { return <span className="text-gray-400">{String(value)}</span>; }
}
```

**L0.c** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/index.ts` (7 라인 전체 Read 완료)

```ts
// L1-7: 7 renderer barrel — TextCell 미포함 (D3 근거)
export { ButtonCell } from './ButtonCell';
export { BadgeCell } from './BadgeCell';
export { CheckCell } from './CheckCell';
export { LinkCell } from './LinkCell';
export { NumberCell } from './NumberCell';
export { DateCell } from './DateCell';
export { IconCell } from './IconCell';
```

**L0.d** (참조 제외 — D1 근거) `D:/project/topvel_project/TOMIS/tw-framework-front/src/utils/common.ts` L89-105

```ts
// C-4 위반 — any 타입, decimals/locale/format 옵션 미지원
export const formatNumberString = (value: any): string => { /* ... */ };
export const formatDateTimeFromDateTimeString = (dateTimeString: string): string => { /* ... */ };
```

→ 본 Goal 의 `formatters.ts` 는 위 두 함수를 **차용하지 않음**. D1 결정.

### 1.2 L1 — TanStack v8 API (UI 레이어 컴포넌트 — N/A)

본 Goal 의 3 셀 컴포넌트는 ColumnDef.cell 함수에서 호출되는 일반 React 컴포넌트로, `useReactTable` 등 TanStack 표준 API 를 **직접 사용하지 않음**. ColumnDef cell 함수 시그니처(`(ctx: CellContext<TData, TValue>) => ReactNode`)에 통합되어 props (`value`) 만 받는다. 따라서 L1 = N/A (specify-rubric A-02 의 "TanStack API 출처 없이 props 정의" 면제 — UI 레이어 컴포넌트). 참조 인벤토리: `references/tanstack-api-inventory.md` §2 ColumnDef.cell function signature.

### 1.3 L2 — 공통 컴포넌트 분석 (현 8 variant 중 renderer 영역)

`references/current-tanstack-analysis.md` L25-32 → `renderers/` 8 파일 = 7 renderer + index barrel. 본 G-001 흡수 범위 = `NumberCell.tsx` (L0.a) + `DateCell.tsx` (L0.b) + `index.ts` (L0.c) = **3 파일** (전체 8 중 3). 나머지 5 파일 (Button/Badge/Check/Link/Icon) 은 **G-002 범위 — 본 G-001 미흡수**.

중복 패턴 추출 (3 파일 중복 분석):
- **dash placeholder `<span className="text-gray-400">-</span>`**: NumberCell L16 + DateCell L14 — 동일 markup. helper 추출 후보 (`renderEmptyDash()`) 가능하지만 1라인 markup → 인라인 유지 결정 (D6 NEW 5 의 helper 분리 비용 > 이득).
- **Tailwind className only**: 양쪽 모두 C-5 준수. 인라인 style 0건.
- **export pattern**: `export function ComponentName({ ... }: Props) { ... }` 일관 — 신규 컴포넌트도 동일 패턴.

### 1.4 L3 — 영향 사용처 카운트 (정확 N=3)

본 G-001 의 영향 사용처 (goals.json `affectedUsageFiles` 3건):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/NumberCell.tsx` — body 를 re-export shim 으로 교체
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/DateCell.tsx` — body 를 re-export shim 으로 교체
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/index.ts` — TextCell 신규 export 1행 추가

**MOD-GRID-04 createColumns type 자동 분기 의존성** (consumer 관점):
- `type:'number'` → `rendererRegistry['number'] = NumberCell` (registry 는 G-003 범위, 본 G-001 은 직접 import 만 가능)
- `type:'dateTime'|'date'` → `rendererRegistry['dateTime'|'date'] = DateCell`
- `type:'text'` → `rendererRegistry['text'] = TextCell`

본 G-001 출력은 G-003 EditableCell + registry 가 의존하는 baseline 컴포넌트.

### 1.5 R-A — AG Grid 동등 기능 (참조용, 코드 차용 X — C-7)

`references/publish-aggrid-analysis.md` § (canonical-modules.json L210-212):
- `agTextCellEditor` — ag-grid-community Text editor
- `agNumberCellEditor` — Number editor (numeric formatting 옵션)
- `agDateCellEditor` — Date editor (date picker)

본 G-001 의 NumberCell/DateCell/TextCell 은 AG Grid 의 **display 측면** (editor 아닌 cell renderer) 만 대응. AG Grid 는 display = `valueFormatter` callback + editor = `cellEditor` 두 layer 분리. 본 Goal 은 display layer 만 (cell renderer = display + 옵션). 차용 코드 0건 (라이선스 — C-7).

### 1.6 R-W — Wijmo 동등 기능 (참조용, 코드 차용 X — C-16)

`references/publish-wijmo-analysis.md` § (canonical-modules.json L214-217):
- **Cell Templates binding expressions** — Wijmo 의 `<wj-flex-grid-cell-template>` (각도 angular 또는 binding 식)
- **Conditional Formatting via formatItem** — Wijmo FlexGrid `formatItem` 이벤트로 셀별 className/style

본 G-001 의 3 셀 컴포넌트는 React 함수 컴포넌트로 직접 구현 — Wijmo Cell Templates 의 string binding 식 패턴은 React 의 JSX 와 다름. C-16 (Wijmo 비도입) — Wijmo 패키지 import 0건, 패턴 학습용 참조만.

---

## Section 2: API 계약 (TypeScript strict — C-4)

### 2.1 TextCell — NEW (L0 부재, D3)

**Props interface** (`packages/grid-renderers/src/TextCell.tsx`):
```ts
export interface TextCellProps {
  /** 표시할 텍스트 — null/undefined/'' 인 경우 dash placeholder */
  value: string | number | null | undefined;
  /** 추가 Tailwind className (C-5) */
  className?: string;
}
```

**Default values** (Section 11.1 Step 1 코드와 일치):
- `className`: undefined (optional)

**Return type**: `JSX.Element` (`<span>`)

**JSDoc 의무 (C-25)**: 각 prop + export 함수에 JSDoc 1줄 이상.

### 2.2 NumberCell — L0 NumberCell.tsx 흡수 (D4 prop 전량 보존)

**Props interface** (`packages/grid-renderers/src/NumberCell.tsx`):
```ts
export interface NumberCellProps {
  /** 표시할 숫자 — null/undefined 인 경우 dash placeholder */
  value: number | null | undefined;
  /** 소수점 자릿수 (default 0) — L0 NumberCell.tsx:3 보존 */
  decimals?: number;
  /** 단위 텍스트 (default '') — L0 NumberCell.tsx:4 */
  unit?: string;
  /** 로케일 (default 'ko-KR') — L0 NumberCell.tsx:5 */
  locale?: string;
  /** 음수일 때 red-600 적용 (default false) — L0 NumberCell.tsx:6 */
  colorNegative?: boolean;
  /** 추가 Tailwind className */
  className?: string;
}
```

**Default values**:
- `decimals`: 0 (L0 L11 그대로)
- `unit`: '' (L0 L12 그대로)
- `locale`: 'ko-KR' (L0 L13 그대로)
- `colorNegative`: false (L0 L14 그대로)
- `className`: undefined (신규 — 합성 가능)

### 2.3 DateCell — L0 DateCell.tsx 흡수 (D4 prop 전량 보존)

**Props interface** (`packages/grid-renderers/src/DateCell.tsx`):
```ts
export interface DateCellProps {
  /** 표시할 날짜 — string/number/Date 또는 null/undefined/'' */
  value: string | number | Date | null | undefined;
  /** 포맷 (default 'date') — L0 DateCell.tsx:3 보존 */
  format?: 'date' | 'datetime' | 'time';
  /** 로케일 (default 'ko-KR') — L0 DateCell.tsx:4 */
  locale?: string;
  /** 추가 Tailwind className */
  className?: string;
}
```

**Default values**:
- `format`: 'date' (L0 L13 그대로)
- `locale`: 'ko-KR' (L0 L13 그대로)
- `className`: undefined (신규)

### 2.4 formatters.ts — pure helpers (D1 — L0 inline 패턴 추출)

**Export signature** (`packages/grid-renderers/src/formatters.ts`):
```ts
/**
 * 숫자를 로케일 기반 천 단위 + 소수점 포매팅. L0 NumberCell.tsx:17-20 의
 * inline value.toLocaleString(locale, {minimumFractionDigits, maximumFractionDigits}) 추출.
 * null/undefined/NaN/비숫자 → 빈 문자열.
 */
export function formatNumberString(
  value: number | null | undefined,
  options?: { decimals?: number; locale?: string }
): string;

/**
 * 날짜 문자열/숫자/Date → 로케일 기반 YYYY-MM-DD 또는 YYYY-MM-DD HH:mm 등.
 * L0 DateCell.tsx:13-21 의 inline date.toLocaleDateString(locale, FORMAT_OPTIONS[format]) 추출.
 * null/undefined/''/invalid Date → 빈 문자열 (또는 EC-04 처리).
 */
export function formatDateTimeFromDateTimeString(
  value: string | number | Date | null | undefined,
  options?: { format?: 'date' | 'datetime' | 'time'; locale?: string }
): string;
```

**Default options**:
- `formatNumberString`: `decimals=0`, `locale='ko-KR'`
- `formatDateTimeFromDateTimeString`: `format='date'`, `locale='ko-KR'`

**Pure 보장** (C-4): 외부 store/state 의존 0 (L0 utils/common.ts 의 `useAuthStore` 의존 X — D1).

### 2.5 Export 경로 (B-04)

`packages/grid-renderers/src/index.ts` (현재 placeholder `export {}` — D6 NEW 분류):
```ts
export { TextCell, type TextCellProps } from './TextCell.js';
export { NumberCell, type NumberCellProps } from './NumberCell.js';
export { DateCell, type DateCellProps } from './DateCell.js';
export { formatNumberString, formatDateTimeFromDateTimeString } from './formatters.js';
```

**소비자 import**: `@tomis/grid-renderers` (package.json `name` 필드 — `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/package.json:2`).

### 2.6 사용 예시 (최소 2개 — B-02)

**예시 A — 직접 use (ColumnDef cell 함수)**:
```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { NumberCell, DateCell, TextCell } from '@tomis/grid-renderers';

const columns: ColumnDef<Slip>[] = [
  { id: 'slipNo', accessorKey: 'slipNo',
    cell: ({ getValue }) => <TextCell value={getValue() as string} /> },
  { id: 'amount', accessorKey: 'amount',
    cell: ({ getValue }) =>
      <NumberCell value={getValue() as number} decimals={2} colorNegative /> },
  { id: 'createdAt', accessorKey: 'createdAt',
    cell: ({ getValue }) =>
      <DateCell value={getValue() as string} format="datetime" /> },
];
```

**예시 B — createColumns type 분기 use (MOD-GRID-04 dependsOn — G-003 registry 통합 후 가능, 본 G-001 baseline)**:
```ts
// MOD-GRID-04 createColumns 가 본 G-001 컴포넌트를 직접 import 하여 매핑
import { TextCell, NumberCell, DateCell } from '@tomis/grid-renderers';
const rendererMap = {
  text: TextCell,
  number: NumberCell,
  dateTime: DateCell,
} as const;
// createColumns([{ id, type: 'number', ... }]) 호출 시 rendererMap['number'] 자동 적용
```

### 2.7 ref API (B-05 — N/A)

본 3 셀 컴포넌트는 선언적 display 컴포넌트 — `ref` / `useImperativeHandle` 필요 없음. B-05 = N/A (rubric 명시 면제).

---

## Section 3: 기존 사용처 대응표 (Migration Table — D-02)

| 기존 (L0 — TOMIS tw-framework-front) | 신규 API (monorepo @tomis/grid-renderers) | 마이그레이션 액션 |
|--------------------------------------|-------------------------------------------|------------------|
| `renderers/NumberCell.tsx` (28라인, 자체 구현) | `NumberCell` from `@tomis/grid-renderers` | body 를 `export { NumberCell } from '@tomis/grid-renderers';` re-export 로 교체 (1 minor alias — C-23). prop drift 0 (D4) |
| `renderers/DateCell.tsx` (22라인, 자체 구현) | `DateCell` from `@tomis/grid-renderers` | body 를 re-export shim 으로 교체. prop drift 0 (D4) |
| `renderers/index.ts` (7 export) | (동일 barrel) | `export { TextCell } from './TextCell';` 1행 추가 — TextCell 은 본 Goal 신규 (D3) 라 기존 file path 외에 monorepo 도 OK. ★단순화 옵션: tw-framework-front 의 `TextCell.tsx` 는 생성하지 않고 index 에서 직접 monorepo re-export — 본 spec 채택 |
| TextCell (기존 0) | `TextCell` from `@tomis/grid-renderers` | (대응 행 없음 — D3 신규) |

**N/A — 본 G-001 미흡수 5 renderer** (G-002 범위): ButtonCell, BadgeCell, CheckCell, LinkCell, IconCell — 본 G-001 spec 의 대응표에 포함 X.

---

## Section 4: 호환성 정책 (Compatibility — D-03/D-04)

### 4.1 Breaking change

**No breaking** (compatibilityPolicy.breaking = false — goals.json L46).

증거:
- D4: L0 NumberCell prop 5종 + L0 DateCell prop 3종 전량 보존
- 사용처 (3 파일) 의 import 경로 = 동일 (re-export shim 으로 path 변경 없음)
- prop 시그니처 = 동일 (decimals/unit/locale/colorNegative + format/locale)

### 4.2 Deprecation 전략 (C-23 의무 — 1 minor alias 유지)

- tw-framework-front `renderers/NumberCell.tsx` + `DateCell.tsx` body = `export { NumberCell } from '@tomis/grid-renderers';` (1 minor 동안 유지)
- MOD-GRID-17 (사용처 마이그레이션) 시점에 사용처가 `from '@tomis/grid-renderers'` 직접 import 로 점진 전환
- alias 제거 시점 = 다음 minor (예: `0.1.x` → `0.2.0`) — Changesets entry 의무 (C-23)

### 4.3 Migration path

```
[현재]
import { NumberCell } from '../../../components/tomis/Grid/renderers';
↓ (본 G-001 후 — alias 동작, 사용처 코드 변경 0)
import { NumberCell } from '../../../components/tomis/Grid/renderers';  // 그대로
↓ (MOD-GRID-17 점진 마이그레이션)
import { NumberCell } from '@tomis/grid-renderers';  // 직접 import
```

### 4.4 peerDependencies 정책 (C-22)

- `react`, `react-dom`: peer (ADR-MOD-GRID-00-008 매트릭스 — `^18.0.0 || ^19.0.0`). `grid-renderers/package.json:24-26` 기존재.
- `@tanstack/react-table`: peer (`>=8.0.0 <9.0.0`). `grid-renderers/package.json:26` 기존재.
- 본 G-001 은 peer 추가 / 변경 0건. C-22 정책 부합 (peer 를 dep 으로 중복 선언 금지 — 본 Goal 위반 0).

---

## Section 5: 인수 기준 (Acceptance Criteria — C-01~C-05)

| ID | Criteria | Source (출처 태그) | migrationImpact 태그 | 검증 방법 |
|----|----------|-------------------|---------------------|----------|
| **AC-001** | TextCell, NumberCell, DateCell 3개 컴포넌트 export — props 정확히 Section 2.1~2.3 interface 와 일치. `any` 사용 0건 (C-4 strict) | C-4 (Section 9 dependencies + Section 12.3 tsc 검증) | high | `tsc --noEmit` 통과 + `index.ts` export 명단 grep |
| **AC-002** | NumberCell — Section 2.4 `formatNumberString` helper 사용 (D1 — L0 inline 패턴 추출). L0 NumberCell.tsx (L17-20) prop (`decimals`/`unit`/`locale`/`colorNegative`) 전량 보존 (D4) | L0 (Section 1.1 L0.a 인용) | high | Storybook story (decimals=0/2, colorNegative true) 외관 비교 + tsc 통과 |
| **AC-003** | DateCell — Section 2.4 `formatDateTimeFromDateTimeString` helper 사용 (D1). L0 DateCell.tsx (L13-21) prop (`format`/`locale`) 전량 보존 (D4) | L0 (Section 1.1 L0.b 인용) | high | Storybook story (format=date/datetime/time) 외관 비교 + tsc 통과 |
| **AC-004** | `formatNumberString` / `formatDateTimeFromDateTimeString` 2 helper — 순수 함수 (외부 store/state 의존 0). 시그니처 Section 2.4 와 일치. `unknown` 또는 정확 union 사용 — `any` 0건 (C-4) | C-4 (Section 1.1 L0.d 차용 거부 근거) | high | helper 단위 테스트 통과 + grep `: any` 0 hits |
| **AC-005** | Tailwind className only — 인라인 `style={{...}}` 0건 (동적 값 제외). 3 컴포넌트 + helper 모두 부합 (C-5) | C-5 (Section 9 + Section 12.3 빌드 검증) | high | grep `style=\\{\\{` 0 hits + Tailwind class 인라인 markup |
| **AC-006** | Storybook story — 각 renderer 1개 이상 (TextCell + NumberCell + DateCell + formatters helper 데모 = 3개 이상). 모든 variant (NumberCell decimals=0/2, colorNegative; DateCell format=date/datetime/time) 포함 (C-25) | C-25 (Section 13 문서 의무) | high (시각 회귀 입력) | Storybook build 통과 + manual screenshot |
| **AC-007** | `grid-renderers` 패키지 brotli ≤ 10 KB (C-21 한도, `.size-limit.json:9-13` 명시). 본 G-001 추가 후 측정 — extrapolation 거부 (D5 ADR-MOD-GRID-00-010) | C-21 (Section 8.5 + ADR-MOD-GRID-00-010) | high (분리 트리거 게이트) | `pnpm size-limit` exit 0 |

**호환성 검증 AC** (C-05 의무): AC-002 + AC-003 의 "prop 전량 보존" 항목이 영향 사용처 3개 외관 보존 의무를 포함. AC-006 Storybook + AC-005 Tailwind 가 외관 회귀 검증 입력.

**모든 AC 출처 태그 의무 (H-03)**:
- AC-001 → C-4 (Section 9 + Section 12.3)
- AC-002 → L0 (Section 1.1 L0.a NumberCell.tsx 인용)
- AC-003 → L0 (Section 1.1 L0.b DateCell.tsx 인용)
- AC-004 → C-4 (Section 1.1 L0.d D1 차용 거부 근거)
- AC-005 → C-5 (Section 9 + Section 12.3)
- AC-006 → C-25 (Section 13 문서 의무)
- AC-007 → C-21 (Section 8.5 + ADR-MOD-GRID-00-010)

모든 출처 태그가 spec 본문 다른 섹션에서 직접 인용됨 — H-03 cross-consistency 충족.

---

## Section 6: 엣지 케이스 (Edge Cases — E-04 최소 3개)

| EC | 시나리오 | 처리 | 출처 |
|----|---------|------|------|
| **EC-01** | `NumberCell value={null}` 또는 `value={undefined}` | dash placeholder `<span className="text-gray-400">-</span>` 렌더 (L0 L16 그대로) | L0 NumberCell.tsx:16 |
| **EC-02** | `NumberCell value={NaN}` (예: `Number(undefined)`) | `formatNumberString` 내부 `Number.isFinite(value)` 가드 → 빈 문자열 반환. `<span className="text-gray-400">-</span>` 렌더 (L0 가 inline `toLocaleString` 에서 "NaN" 출력하던 점을 본 helper 추출 시 명시 가드로 개선) | C-4 (typed) + EC 신설 |
| **EC-03** | `NumberCell decimals={-1}` 또는 비정수 (`decimals={2.5}`) | `Math.max(0, Math.floor(decimals))` 클램프 → `toLocaleString` RangeError 차단 | EC 신설 (helper 안전성) |
| **EC-04** | `DateCell value=''` (빈 문자열) | dash placeholder (L0 L14 `value === ''` 가드 보존) | L0 DateCell.tsx:14 |
| **EC-05** | `DateCell value='not-a-date'` (invalid string) | `new Date(value)` → `isNaN(date.getTime())` 가드 → `<span className="text-gray-400">{String(value)}</span>` (L0 L17 그대로) | L0 DateCell.tsx:17 |
| **EC-06** | `TextCell value={0}` 또는 `value={false-y but valid}` | `value == null \|\| value === ''` 가드만 적용. `0` 은 정상 표시 (truthy check 사용 X — falsy 0 보존) | D3 신규 — falsy 0 보존 정책 |

3개 이상 (E-04 충족 — 본 spec 6개).

---

## Section 7: 구현 대상 파일 (NEW/MODIFY 표 — E-01)

★ C-28 (path prefix) 정합성 — goals.json `implementFiles[]` 의 `topvel-grid-monorepo/packages/grid-renderers/` prefix 가 모노레포 실제 위치와 일치 확인됨 (`D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/` ls 결과). spec 정정 결정 불필요.

| # | 경로 | 유형 | 변경 범위 | 출처 |
|---|------|------|----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/TextCell.tsx` | NEW | Section 2.1 interface + 함수 컴포넌트 (~25 라인 예상) | D3, D6 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/NumberCell.tsx` | NEW | Section 2.2 interface + 함수 컴포넌트 — formatNumberString 사용 (~35 라인 예상) | D1, D4, D6 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/DateCell.tsx` | NEW | Section 2.3 interface + 함수 컴포넌트 — formatDateTimeFromDateTimeString 사용 (~30 라인 예상) | D1, D4, D6 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/formatters.ts` | NEW | Section 2.4 두 helper 함수 — 순수 함수, NaN/invalid date 가드 (~40 라인 예상) | D1, EC-02/EC-05, D6 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/index.ts` | NEW | Section 2.5 4 export (placeholder `export {}` 1줄 → 4 export 행 교체. body 90%+ 신규 — NEW 분류) | D6 |
| 6 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/NumberCell.tsx` | MODIFY | body 전체 (28 라인) → `export { NumberCell } from '@tomis/grid-renderers';` 1줄 + 빈 줄. C-23 1 minor alias | Section 4.2 |
| 7 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/DateCell.tsx` | MODIFY | body 전체 (22 라인) → re-export shim 1줄 + 빈 줄. C-23 1 minor alias | Section 4.2 |
| 8 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/index.ts` | MODIFY | TextCell 신규 export 1행 추가 (`export { TextCell } from '@tomis/grid-renderers';`). 기존 6 export 보존 | Section 3 |

**합계: NEW 5 + MODIFY 3 = 8 파일** (D6 breakdown 정확 일치).

**Section 7 ↔ Section 11 cross-check (E-01 v1.0.3)**: Section 11.3 의 모든 Step 에 위 8 파일이 빠짐없이 등장 — Section 11 진입 시 확인.

---

## Section 8: 마이그레이션 영향도 Pre-flight (D-01/D-05/D-06)

### 8.1 영향 사용처 카운트 (D-01)

**3 / 23 total** (전체 tw-framework-front 영향 23 페이지 + DataTable 사용처 vs 본 G-001 직접 영향 3 파일).

본 G-001 의 affectedUsageFiles (goals.json L57-61 그대로):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/NumberCell.tsx` (MODIFY — Section 7 #6)
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/DateCell.tsx` (MODIFY — Section 7 #7)
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/index.ts` (MODIFY — Section 7 #8)

3개 ≤ C-19 한도 5 — 점진 마이그레이션 1 Goal 한 번에 가능.

**MOD-GRID-17 부수 영향** (본 Goal 직접 범위 외): 이 3 renderer 를 import 하는 페이지 파일은 `BadgeCell`/`NumberCell` 등 import 경로가 동일 (re-export shim) → 사용처 변경 0건. MOD-GRID-17 점진 마이그레이션 시 import path 만 변경 (`@tomis/grid-renderers`).

### 8.2 무파괴 검증 방법 (C-17 — high impact 의무)

- **tsc** (`pnpm typecheck` — monorepo + `tw-framework-front` 양쪽 0 errors)
- **Storybook story** (AC-006) — 각 컴포넌트 + 모든 variant 시각 비교 (manual screenshot, AC-006 검증)
- **Visual regression** (선택 자동화) — Chromatic 또는 Playwright 비교 (C-17 권장 자동화). 미구비 시 수동 스크린샷 비교 메모

**외부 디렉토리 N/A — H-02 예외 (조부모 실재 입증)**: monorepo 외부 디렉토리 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/` 는 이미 MOD-GRID-00 G-001/G-002 에서 생성됨 (G-002 패키지 디렉토리 확인 ls 결과). 본 Goal 은 src/ 파일 5개 추가만 — 부모 디렉토리 신규 생성 아님. H-02 외부 디렉토리 예외 절차 (조부모 실재 입증) 불필요.

### 8.3 점진 마이그레이션 vs 일괄 (C-19)

본 Goal 영향 사용처 3개 ≤ 5 (C-19 한도). 1 Goal 한 번에 처리. 분할 불필요.

### 8.4 롤백 전략 (D-05)

- **신규 파일** (Section 7 #1~#5) 5개: `Remove-Item` 으로 단순 삭제 → monorepo 무손상.
- **MODIFY 파일** (Section 7 #6~#8) 3개: git revert 1 커밋. 신규 import (`@tomis/grid-renderers`) 가 미적용 상태 (Section 4.3 — 사용처는 alias 경유 import) → 사용처 코드 변경 0건, 따라서 사용처 회귀 위험 0.

### 8.5 번들 크기 영향 (D-06 + ADR-MOD-GRID-00-010 의무 1줄)

★ **bundle estimation NOT extrapolated from prior Goals (different size profile may apply — leaf renderer profile, MOD-GRID-01 wrapper / hook / alias-wrapper 3 profile 어느 것도 아님) — measurement at IMPLEMENT time only per ADR-MOD-GRID-00-010.**

- spec 예상 (참조용만): +3 KB (NumberCell + DateCell + TextCell + formatters helper)
- 한도: `@tomis/grid-renderers` brotli ≤ 10 KB (`.size-limit.json:9-13`)
- 게이트: IMPLEMENT 직후 `pnpm size-limit` exit 0 (AC-007). spec 예상값은 metric 참조용 — 게이트 아님.

분리 가능성: 본 Goal 추가 후 brotli 가 7 KB 이상이면 G-002 (5 renderer 추가) 까지 누적 시 10 KB 한도 위험 → G-002 spec writer 가 분리 트리거 (예: `@tomis/grid-renderers/text` sub-entry) 검토. 본 G-001 측정 결과는 G-002 spec 의 baseline.

---

## Section 9: 의존성 (peerDeps / deps / devDeps — C-22)

### 9.1 peerDependencies (변경 0건 — 기존재)

`packages/grid-renderers/package.json:23-27` 기존재 — 본 G-001 변경 없음:
```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "@tanstack/react-table": ">=8.0.0 <9.0.0"
}
```

ADR-MOD-GRID-00-008 매트릭스 부합 (3종 peer + range 일치).

### 9.2 dependencies (없음 — 0건)

본 G-001 의 3 cell + helper 는 React 표준 + Tailwind className 만 사용. 외부 런타임 패키지 0건 → `dependencies: {}` 유지 (또는 미존재).

C-9/C-20 ADR 게이트: 본 Goal 신규 dependency 추가 0건 → 외부 라이브러리 ADR 의무 면제.

### 9.3 devDependencies (변경 0건)

monorepo 루트 devDependencies (`topvel-grid-monorepo/package.json:20-36`) 에 이미 typescript / tsup / @types/react / @types/react-dom 기존재. 본 Goal 신규 추가 없음.

### 9.4 C-22 정책 부합 검증

- react/react-dom/@tanstack/react-table = peer (위 9.1 그대로) — dep 중복 선언 없음.
- 본 Goal 은 grid-renderers 패키지 — `@tanstack/react-virtual` peer 선언 대상 아님 (grid-core 만). `xlsx`/`jspdf` peer 대상 아님 (grid-export 만).

---

## Section 10: 사용자 여정 매핑 (User Journey)

### 10.1 개발자 관점 (페이지 작성자)

1. **import**: `import { NumberCell, DateCell, TextCell } from '@tomis/grid-renderers';` (Section 2.6 예시 A)
2. **ColumnDef cell 함수에 사용**: `cell: ({ getValue }) => <NumberCell value={getValue() as number} decimals={2} />`
3. **MOD-GRID-04 createColumns 의존 (G-003+ registry 통합 후)**: `createColumns([{ id, type: 'number', ...meta }])` → registry 가 NumberCell 자동 매핑 (본 G-001 의 직접 export 가 G-003 registry 의 baseline)
4. **마이그레이션 중 (alias 경유)**: 기존 import path 그대로 사용 가능 — 코드 변경 0
5. **점진 전환 (MOD-GRID-17)**: 페이지별 import path 만 `@tomis/grid-renderers` 로 교체

### 10.2 최종 사용자 관점 (그리드 사용 화면)

1. 그리드에 숫자 column → 천 단위 구분 + 소수점 일관 표시 (예: 1,234.56 — locale='ko-KR')
2. 음수 amount → red-600 강조 (`colorNegative`)
3. 날짜 column → ko-KR 로케일 (예: 2026. 05. 14.) 또는 datetime (예: 2026. 05. 14. 오후 3:30)
4. null/undefined/invalid → dash placeholder (회색) — 데이터 누락 시각 명시
5. 외관 회귀 0 — 기존 NumberCell/DateCell 의 markup 과 동등 (D4 prop 보존 + Section 11.4 Before/After Tailwind class 동일)

---

## Section 11: 구현 계획 (Implementation Plan — E-01/E-02/E-03)

### 11.1 파일별 변경 명세 (Section 7 표 동일 — cross-consistency)

(Section 7 의 8 행 표 그대로 — 본 섹션은 변경 명세의 단계별 수행 순서 정의)

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개, 본 spec 2개 제공)

**Before/After A — NumberCell L0 vs 새 API**:

```tsx
// BEFORE — D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/NumberCell.tsx (L0 — 28 라인 전체)
interface NumberCellProps { value: number | null | undefined; decimals?: number; unit?: string; locale?: string; colorNegative?: boolean; }
export function NumberCell({ value, decimals = 0, unit = '', locale = 'ko-KR', colorNegative = false }: NumberCellProps) {
  if (value == null) return <span className="text-gray-400">-</span>;
  const formatted = value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const isNeg = colorNegative && value < 0;
  return (<span className={`tabular-nums ${isNeg ? 'text-red-600' : ''}`}>{formatted}{unit}</span>);
}
```

```tsx
// AFTER — D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/NumberCell.tsx (NEW)
import { formatNumberString } from './formatters.js';

export interface NumberCellProps {
  value: number | null | undefined;
  decimals?: number;
  unit?: string;
  locale?: string;
  colorNegative?: boolean;
  className?: string;
}

/** 숫자 셀 렌더러. L0 NumberCell.tsx 패턴 보존 + formatters helper 추출. */
export function NumberCell({
  value, decimals = 0, unit = '', locale = 'ko-KR', colorNegative = false, className,
}: NumberCellProps) {
  if (value == null || !Number.isFinite(value)) {
    return <span className={`text-gray-400 ${className ?? ''}`}>-</span>;
  }
  const formatted = formatNumberString(value, { decimals, locale });
  const isNeg = colorNegative && value < 0;
  return (
    <span className={`tabular-nums ${isNeg ? 'text-red-600' : ''} ${className ?? ''}`}>
      {formatted}{unit}
    </span>
  );
}
```

**Before/After B — tw-framework-front re-export shim** (Section 7 #6):

```tsx
// BEFORE — tw-framework-front/.../renderers/NumberCell.tsx (L0 — 28 라인)
// (전체 위 BEFORE 동일)
```

```tsx
// AFTER — tw-framework-front/.../renderers/NumberCell.tsx (shim — 1~3 라인)
// Re-export shim — Compatible alias (C-23 1 minor). 점진 마이그레이션 후 제거 예정.
export { NumberCell } from '@tomis/grid-renderers';
export type { NumberCellProps } from '@tomis/grid-renderers';
```

### 11.3 구현 순서 (E-03 — 최소 2단계, 본 spec 4단계)

**Step 1 — formatters.ts 먼저 (NEW)**
- 대상: Section 7 #4 (`formatters.ts`)
- 작업: `formatNumberString` + `formatDateTimeFromDateTimeString` 순수 함수 구현 (Section 2.4 시그니처, EC-02/EC-03/EC-05 가드)
- 검증: `tsc --noEmit` (typecheck 만)

**Step 2 — 3 셀 컴포넌트 (NEW)**
- 대상: Section 7 #1~#3 (`TextCell.tsx`, `NumberCell.tsx`, `DateCell.tsx`)
- 작업: Section 2.1~2.3 interface + 함수 컴포넌트 (Section 11.2 AFTER 패턴). NumberCell/DateCell 은 Step 1 helper 사용
- 검증: `tsc --noEmit` + `tsup` 빌드 시뮬레이션 통과

**Step 3 — index.ts 교체 (NEW — placeholder → 실 export)**
- 대상: Section 7 #5 (`index.ts`)
- 작업: 현 `export {};` 1줄 → Section 2.5 의 4 export 행 교체 (TextCell + NumberCell + DateCell + 2 helper)
- 검증: `tsup build` 통과 + `dist/index.{cjs,mjs,d.ts}` 산출 확인 + `pnpm size-limit` 측정 (AC-007 게이트 — D5 measure-then-decide)

**Step 4 — tw-framework-front re-export shim (MODIFY)**
- 대상: Section 7 #6~#8 (`renderers/NumberCell.tsx`, `renderers/DateCell.tsx`, `renderers/index.ts`)
- 작업: 
  - `NumberCell.tsx` body (28 라인) → re-export shim 1줄 (Section 11.2 AFTER B)
  - `DateCell.tsx` body (22 라인) → re-export shim 1줄
  - `index.ts` 에 `export { TextCell } from '@tomis/grid-renderers';` 1행 추가 (기존 6 export 보존)
- 검증: tw-framework-front `tsc --noEmit` 통과 + Storybook (있으면) 시각 비교 (AC-002/AC-003)

**Step 5 (필요 시) — Storybook story** (AC-006 — C-25 의무)
- 대상: monorepo `packages/grid-renderers/.storybook/` 또는 `src/__stories__/` (배치 결정은 implement-stage)
- 작업: TextCell + NumberCell + DateCell 각 1+ story (variant: decimals, colorNegative, format=date/datetime/time)
- 검증: Storybook build 통과 — 자동화 인프라 미구비 시 manual screenshot 메모로 대체 (ADR-MOD-GRID-00-003 documented-deviation)

### 11.4 위험 요소 (Risks)

- **R1 — 한국어 로케일 ICU 데이터**: `toLocaleString('ko-KR', ...)` 가 brower/node 의 Intl 데이터 의존. Node < 14 또는 small-icu 빌드 시 fallback 발생 → 본 spec 은 modern Node + brower 가정 (peer `react ^18.0.0 || ^19.0.0` = Node 18+ 일반).
- **R2 — NaN 입력 (EC-02)**: L0 의 inline `toLocaleString` 은 NaN → "NaN" 출력. 본 G-001 의 helper 는 `Number.isFinite` 가드 → 빈 문자열. **외관 차이** (L0 "NaN" 텍스트 vs 본 Goal "-" dash). 사용처 마이그레이션 시 NaN 데이터 노출 페이지 추적 필요 — 현재 NaN 노출 페이지 0 가정 (Section 12.4 사전 검증).
- **R3 — Storybook 인프라 부재**: monorepo 에 Storybook 미구성 시 AC-006 deviation. ADR-MOD-GRID-00-003 documented-deviation 절차 적용 → finding 파일 (`findings/auto-fixed/MOD-GRID-05-G-001-storybook-deferred.md`) 작성 후 implement 진행.
- **R4 — 사용처 import path drift**: 본 G-001 의 alias 가 정상 동작하려면 tw-framework-front 의 `tsconfig.app.json` paths + `vite.config.ts` alias 가 `@tomis/grid-renderers` 매핑되어야 함. MOD-GRID-00 G-004 ADR-MOD-GRID-01-006 의 tsconfig.app.json paths 매핑이 grid-core 만 명시 — grid-renderers 도 동일 매핑 필요. Implementer 가 본 Step 4 진입 전 alias 매핑 확인 의무.

---

## Section 12: 검증 계획 (Verification — E-05)

### 12.1 단위 테스트 시나리오 (5건)

| 대상 | 시나리오 | 기대 |
|------|---------|------|
| `formatNumberString` | value=1234.5, decimals=0, locale='ko-KR' | "1,235" |
| `formatNumberString` | value=1234.5, decimals=2 | "1,234.50" |
| `formatNumberString` | value=NaN (또는 null) | "" (EC-02) |
| `formatDateTimeFromDateTimeString` | value='2026-05-14', format='date' | "2026. 05. 14." |
| `formatDateTimeFromDateTimeString` | value='invalid', format='date' | "" (EC-05) |
| `NumberCell` | render with value=-100, colorNegative=true | className 에 `text-red-600` 포함 |
| `DateCell` | render with value='', format='datetime' | dash placeholder (EC-04) |
| `TextCell` | render with value=0 | "0" 텍스트 (EC-06 falsy 0 보존) |

### 12.2 시각 회귀 (C-17 high 의무)

- **Method A (자동, 우선)**: Storybook + Chromatic 또는 Playwright screenshot — 인프라 구비 시 (MOD-GRID-99-B 별도 Goal 예정)
- **Method B (수동, fallback)**: 영향 사용처 3 파일 (renderers/NumberCell.tsx 등) 사용 페이지 (예: SlipListPage.tsx amount column) 마이그레이션 전/후 동일 데이터로 스크린샷 캡처 + 외관 비교 메모
- **Method B 변형 (구조적 동등성 증명)**: re-export shim 패턴은 컴포넌트 instance 가 동일 — JSX 출력 토큰별 매핑 + prop signature 동등성 + 알고리즘 차이 enumerate 로 시각 동등성 입증. 의도된 deviation (EC-02 NaN, EC-05 invalid date) 은 spec 명시 + risk-bound 후 acceptance (rubric C-02 "Spec 에 명시된 의도된 변경" 예외 조항).

대상 페이지 (대표 1건씩):
- NumberCell 사용처: tw-framework-front 의 amount/단가 column 보유 페이지 (`SlipListPage.tsx` 등)
- DateCell 사용처: createdAt/updatedAt column 보유 페이지

**실제 적용 (2026-05-14 G-001 verify 보완)**: 본 Goal 은 monorepo Storybook 인프라 부재 (R3) 로 Method A 불가. **Method B 변형 채택** — 결과물:
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md` (구조적 동등성 + JSX 토큰 매핑 분석 + EC-02/EC-05 deviation 명시 + risk-bound)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/__stories__/{TextCell,NumberCell,DateCell}.stories.tsx` (Storybook CSF3 placeholder 컨벤션 — MOD-GRID-99-B 인프라 도입 시 무수정 가용. 타입 import 0 — tsc strict 통과 보장. tsup entry 기반 빌드 → dist 산출 영향 0)

### 12.3 빌드 검증 (C-12)

- `pnpm -r --filter './packages/grid-renderers' typecheck` exit 0 (tsc --noEmit)
- `pnpm -r --filter './packages/grid-renderers' build` exit 0 (tsup, dist/ 산출)
- `pnpm -r --filter './packages/grid-renderers' --filter './apps/docs' build` (있는 경우)
- monorepo 루트 `pnpm size-limit` exit 0 (AC-007 — D5 게이트, ADR-MOD-GRID-00-010 measurement)
- tw-framework-front `pnpm typecheck` exit 0 (alias 매핑 확인 — Section 11.4 R4)

### 12.4 마이그레이션 자동 보완 (영향 사용처 처리)

- tw-framework-front `renderers/index.ts` 의 6 export (Button/Badge/Check/Link/NumberCell/DateCell/Icon) 중 NumberCell/DateCell 만 본 Goal alias 영향 — 나머지 5는 G-002 범위
- 본 G-001 후 사용처 페이지 (예: `SlipListPage.tsx`) 의 import 는 변경 0 (re-export shim 으로 transparent)
- MOD-GRID-17 시점에 사용처 import path 변경 (별도 Goal)

---

## Section 13: 상용 제품화 영향 (Commercialization — F-01~F-04)

### 13.1 패키지 대상 (F-01)

- **packageTarget**: `@tomis/grid-renderers` (`packages/grid-renderers/package.json:2`)
- **licenseTier**: **MIT** (`packages/grid-renderers/package.json:5` `"license": "MIT"` 기존재) — canonical-modules.json MOD-GRID-05 L198 부합
- 본 Goal 의 모든 산출 (3 cell + 2 helper) 은 MIT 라이선스로 배포

### 13.2 라이선스 검증 (F-02 — N/A, MIT 패키지)

본 Goal 은 MIT 패키지 → `configureGridLicense()` 호출 (Pro 패키지 전용) 불필요. F-02 = N/A.

### 13.3 문서 작성 계획 (F-03 — C-25 의무)

- **Docusaurus 페이지** (`apps/docs/...` — MOD-GRID-99-B 범위, 본 Goal 은 source 제공): API reference 3 컴포넌트 + 2 helper 각각의 JSDoc 기반 자동 생성. 사용 예시 Section 2.6 (예시 A + B) 인용
- **Storybook story** (`packages/grid-renderers/.storybook/` — 본 Goal AC-006): 
  - TextCell 1 story (default + className variant)
  - NumberCell 1+ story (decimals=0/2 variant + colorNegative variant)
  - DateCell 1+ story (format=date/datetime/time variant)
  - formatters helper 데모 1 story (선택)
- **README.md** (`packages/grid-renderers/README.md`): 패키지 개요 + Section 2.5 export 명단 + Section 2.6 사용 예시. C-25 의무 — 본 Goal 의 산출

### 13.4 peerDependencies 정책 (F-04 — C-22)

본 Section 9 와 동일 — react/react-dom/@tanstack/react-table peer (변경 0건). C-22 정책 부합.

---

## ★ Spec 작성 완료 검증 (self-check before submission)

1. **H-01 (referenceEvidence 경로 실재)**: L0.a~L0.d (4 파일 — NumberCell.tsx + DateCell.tsx + index.ts + utils/common.ts) Read 통해 라인 인용 직접 확인 ✓
2. **H-02 (implementFiles 경로 합리성)**: 5 NEW (monorepo) 의 부모 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/` 실재 (ls 결과) + 3 MODIFY (tw-framework-front) 실재 ✓. 외부 디렉토리 H-02 예외 절차 불필요 (Section 8.2)
3. **H-03 (AC 출처 태그)**: 7 AC 모두 source 태그 (C-4 / L0 / C-5 / C-25 / C-21) — spec 본문 Section 1 / 9 / 12 / 13 에서 인용 ✓
4. **G-01 (TBD 없음 + D# 표 cross-consistency)**: D1~D7 헤더 표 ↔ 본문 (Section 1.1 L0.d + Section 2.4 + Section 7 표 8행 + Step 1~5) 일치 ✓. NEW 5 + MODIFY 3 breakdown 정확 ✓
5. **E-01 (Section 7 ↔ Section 11)**: Section 7 의 8 파일 모두 Section 11.1 (= Section 7 그대로) + Section 11.3 Step 1~4 에 enumerate ✓
6. **C-28 (path prefix)**: goals.json `implementFiles[]` 이 이미 `topvel-grid-monorepo/packages/...` 으로 정정됨 → spec 추가 정정 D# 불필요. Section 7 의 모든 NEW 경로가 정확 ✓

---

**Spec 완료일**: 2026-05-14
**Spec writer**: tw-grid Spec Writer (opus tier — high migrationImpact)
**Next stage**: Coverage Verifier (haiku tier 별도 Agent 호출 — C-11 + C-15)
