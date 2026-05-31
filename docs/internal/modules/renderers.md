# 렌더러 모듈 (`@topgrid/grid-renderers`)

그리드 셀을 그리는 표준 렌더러 컴포넌트 set. 표시(display) 전용 셀 11종과
인라인 편집(edit) 셀 1종, 그리고 이들을 `type` 키로 자동 매핑하기 위한 렌더러
레지스트리·와이어링을 제공한다.

- 패키지: `@topgrid/grid-renderers`
- 라이선스: **MIT**
- 의존: `react` / `react-dom` / `@tanstack/react-table` 는 모두 peer dependency
  (런타임 의존 0). 외부 아이콘/포맷 라이브러리 의존 없음.
- 스타일: 모든 셀은 Tailwind className 으로만 스타일링한다(인라인 `style` 은
  `ProgressCell` 의 동적 width 1건만 — 아래 설계 결정 참고).

---

## 1. 개요 — 셀 카탈로그

| 셀 | 종류 | 역할 |
|----|------|------|
| `TextCell` | 표시 | 일반 텍스트. 빈 값은 dash, falsy `0` 은 보존 |
| `NumberCell` | 표시 | 로케일 기반 숫자(천 단위·소수점·단위·음수 색상) |
| `DateCell` | 표시 | 로케일 기반 날짜/일시/시각 |
| `StatusBadgeCell` | 표시 | 상태값 → 색상 chip (기본 7-state 색상 맵) |
| `LinkCell` | 표시 | 링크/버튼/텍스트 3분기 |
| `ButtonCell` | 표시 | 액션 버튼(variant·disabled·size) |
| `CheckCell` | 표시 | 네이티브 체크박스 |
| `IconCell` | 표시 | 아이콘(+선택 라벨, 클릭) — 아이콘은 주입형 |
| `TagCell` | 표시 | 문자열 배열 → 태그 chip 목록 |
| `AvatarCell` | 표시 | 아바타 이미지 + 이니셜 fallback |
| `ProgressCell` | 표시 | 진행률 바 + 퍼센트 라벨 |
| `EditableCell` | 편집 | 뷰↔편집 모드 인라인 편집(text/number/date/select/textarea) |

추가 export:

- `formatNumberString`, `formatDateTimeFromDateTimeString` — 순수 포매팅 헬퍼
  (+ `FormatNumberOptions` / `FormatDateTimeOptions` 타입)
- `defaultRendererRegistry`, `registerRenderer`, `getRenderer` — 렌더러 레지스트리
  (+ `CellComponent` / `CellComponentProps` 타입)
- `EditType`, `CellClassNameCallback` — 편집/조건부 스타일 타입

모든 표시 셀은 선언적 컴포넌트로, `ColumnDef.cell` 함수 안에서 호출되거나 레지스트리를
통해 `type` 으로 자동 매핑된다. TanStack 표준 API(`useReactTable` 등)를 직접
사용하지 않으며, 외부 ref/imperative API 도 없다.

---

## 2. 각 셀의 prop 계약

표기: `?` 는 optional, 괄호 안은 기본값.

### TextCell

```ts
interface TextCellProps {
  value: string | number | null | undefined;
  className?: string;
}
```

- `null` / `undefined` / `''` → 회색 dash(`-`) placeholder.
- falsy `0` 은 빈 값으로 취급하지 않고 `"0"` 으로 표시한다.

### NumberCell

```ts
interface NumberCellProps {
  value: number | null | undefined;
  decimals?: number;        // (0)
  unit?: string;            // ('')
  locale?: string;          // ('ko-KR')
  colorNegative?: boolean;  // (false)
  className?: string;
}
```

- `formatNumberString` 으로 천 단위 구분 + 고정 소수점 포매팅.
- `null` / `undefined` / 비유한수(NaN 등) → dash.
- `colorNegative` 가 true 이고 값이 음수면 `text-red-600`. 숫자는 `tabular-nums`.

### DateCell

```ts
interface DateCellProps {
  value: string | number | Date | null | undefined;
  format?: 'date' | 'datetime' | 'time';  // ('date')
  locale?: string;                          // ('ko-KR')
  className?: string;
}
```

- `formatDateTimeFromDateTimeString` 사용.
- `null` / `undefined` / `''` / 유효하지 않은 날짜 → dash.

### StatusBadgeCell

```ts
interface StatusBadgeCellProps {
  value: string;
  colorMap?: Record<string, string>;  // 미지정 시 기본 7-state 맵
  defaultColor?: string;              // ('bg-gray-100 text-gray-600')
  className?: string;
}
```

- 기본 색상 맵 7종: `active` / `inactive` / `pending` / `error` / `approved` /
  `rejected` / `draft`.
- `colorMap` 에 없는 값은 `defaultColor` fallback.
- 마크업: `rounded-full` chip (`inline-flex items-center px-2 py-0.5 text-xs font-medium`).

### LinkCell

```ts
interface LinkCellProps {
  value?: string;
  label?: string;       // @deprecated — value 사용 권장
  onClick?: () => void;
  href?: string;
  className?: string;
}
```

- 렌더 분기: `href` 지정 → `<a href>`, `onClick` 만 → `<button>`, 둘 다 없음 → `<span>`.
- 표시 텍스트는 `value ?? label`. `value` 가 선호 prop이고 `label` 은 하위호환 별칭(차기
  메이저에서 제거 예정).
- 클릭 핸들러는 `e.stopPropagation()` 으로 행 클릭 전파를 막는다.

### ButtonCell

```ts
interface ButtonCellProps {
  value?: ReactNode;
  label?: ReactNode;     // @deprecated — value 사용 권장
  onClick: () => void;   // required
  variant?: 'default' | 'destructive' | 'ghost';  // ('ghost')
  disabled?: boolean;    // (false)
  size?: 'sm' | 'xs';    // ('xs')
  className?: string;
}
```

- variant별 Tailwind: `default` = 파랑, `destructive` = 빨강, `ghost` = 흰 배경+테두리.
- 클릭은 `e.stopPropagation()` 으로 행 클릭과 분리. `type="button"` 명시(폼 auto-submit 차단).

### CheckCell

```ts
interface CheckCellProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  readOnly?: boolean;    // (false)
  className?: string;
}
```

- 네이티브 `<input type="checkbox">` 사용(아이콘 SVG 아님). 중앙 정렬 flex 컨테이너로 감쌈.
- `readOnly` 시 `onChange` 미연결 + `cursor-default`. onChange/onClick 모두 stopPropagation.

### IconCell

```ts
interface IconCellProps {
  icon: ReactNode;       // required — 아이콘 컴포넌트 인스턴스를 직접 주입
  label?: string;
  onClick?: () => void;
  color?: string;        // ('text-gray-500')
  className?: string;
}
```

- `onClick` 있으면 `<button>`, 없으면 `<span>` 렌더.
- 아이콘은 `ReactNode` 주입형 — 외부 아이콘 라이브러리에 의존하지 않는다(설계 결정 §4 참고).

### TagCell

```ts
interface TagCellProps {
  value: readonly string[];
  colorMap?: Record<string, string>;
  gapClassName?: string;  // ('gap-1')
  className?: string;
}
```

- 빈 배열 → dash placeholder.
- 각 태그를 `rounded-full` chip 으로 렌더. chip 색상은 `colorMap[tag]` 또는 기본 회색.

### AvatarCell

```ts
interface AvatarCellProps {
  name: string;          // 이니셜 fallback의 소스
  src?: string;
  sizeClassName?: string;  // ('w-7 h-7')
  className?: string;
}
```

- `src` 가 있고 로드 성공 시 원형 이미지, 없거나 로드 실패(`onError`) 시 이니셜 원형 chip.
- 이니셜 규칙: 공백으로 분리된 2+ 토큰 → 앞 두 토큰의 첫 글자 대문자(`John Doe` → `JD`),
  단일 토큰(CJK 이름 등) → 앞 2자 보존(`홍길동` → `홍길`), 빈 문자열 → `?`.

### ProgressCell

```ts
interface ProgressCellProps {
  value: number | null | undefined;
  showLabel?: boolean;          // (true)
  barColorClassName?: string;   // ('bg-blue-600')
  className?: string;
}
```

- track(`h-2 bg-gray-200`) + bar + 선택적 퍼센트 라벨.
- 값은 `[0,100]` 정수로 클램프. `null`/`undefined`/비유한수 → 0.

### EditableCell

```ts
type EditType = 'text' | 'number' | 'date' | 'select' | 'textarea';

interface EditableCellProps {
  value: unknown;
  editType: EditType;
  selectOptions?: ReadonlyArray<{ label: string; value: string }>;
  isEditing: boolean;            // 편집 모드 여부 — 부모(컨테이너)가 소유
  onStartEdit: () => void;       // 뷰 모드 셀 클릭 시
  onCommit: (newValue: string) => void;  // Enter(textarea 제외)/Blur/Tab
  onCancel: () => void;          // Esc
  rowIndex?: number;             // 로깅/디버깅용
  columnId?: string;             // 로깅/디버깅용
  cellClassName?: string;        // Grid-level 조건부 스타일 주입 지점
  maxLength?: number;            // input/textarea의 HTML maxLength
  align?: 'left' | 'center' | 'right';     // ('left') Tailwind text-align
  stopPropagationOnKeyDown?: boolean;       // (false)
  initialDraft?: string;         // 마운트 시 1회 적용되는 초기 draft
}
```

- 뷰 모드는 `<div onClick={onStartEdit}>` 로 `String(value ?? '')` 표시.
- 편집 모드(`isEditing === true`):
  - `select` → `<select>` (옵션 없거나 빈 배열이면 `(옵션 없음)` placeholder)
  - `textarea` → `<textarea>` (Enter 는 줄바꿈, Tab/Blur 로 commit)
  - 그 외 → `<input type={'text'|'number'|'date'}>`
- 키보드: Enter → commit(textarea 제외), Esc → cancel, Tab → preventDefault + commit.
- 편집 진입 시 내부 `draft` 상태가 `String(value ?? '')` 로 초기화되고 입력에 focus.
  `selectOptions` 같은 optional prop 은 컨테이너에서 conditional spread 로 전달한다
  (`exactOptionalPropertyTypes` 호환).
- `editType === 'select'` 에는 `maxLength` 를 전달하지 않는다(`HTMLSelectElement` 미지원).
- `align` 은 인라인 style 대신 Tailwind 클래스(`text-center`/`text-right`)로 적용한다.

---

## 3. 포매팅 헬퍼

```ts
function formatNumberString(
  value: number | null | undefined,
  options?: { decimals?: number; locale?: string },  // decimals 기본 0, locale 'ko-KR'
): string;

function formatDateTimeFromDateTimeString(
  value: string | number | Date | null | undefined,
  options?: { format?: 'date' | 'datetime' | 'time'; locale?: string },  // 기본 'date'/'ko-KR'
): string;
```

- 둘 다 순수 함수(외부 store/state 의존 0, `any` 0).
- `formatNumberString`: `null`/`undefined`/비유한수 → `''`. `decimals` 는 `[0,20]` 으로
  클램프하여 `Intl` RangeError 를 차단한다.
- `formatDateTimeFromDateTimeString`: `null`/`undefined`/`''`/유효하지 않은 Date → `''`.
- 셀(`NumberCell`/`DateCell`)은 빈 문자열을 받으면 dash placeholder 로 표시한다.

---

## 4. 핵심 설계 결정과 근거

### 4.1 ButtonCell variant 명명 — `default` / `destructive` / `ghost`
React 생태계 사실상 표준(shadcn/ui Button 컨벤션)에 맞춰 variant 키를 정했다.
시각 출력(Tailwind 클래스)은 직관적 매핑을 유지한다: `default` = 파랑, `destructive` = 빨강,
`ghost` = 흰 배경+테두리. 표준 어휘를 쓰면 다른 컴포넌트(Badge/Dialog 등)가 같은 vocabulary 를
채택할 때 마찰이 줄고, 별도 변환 레이어가 필요 없다.

### 4.2 아이콘 주입 패턴 — 외부 아이콘 라이브러리 비의존
`IconCell.icon` 은 `ReactNode` 타입으로, 호출하는 쪽이 자신의 아이콘 컴포넌트 인스턴스를
직접 주입한다. 따라서 `lucide-react` / `react-icons` 같은 외부 아이콘 패키지를 peer dependency
로 추가하지 않는다. 렌더러 패키지는 아이콘 라이브러리에 중립적이며, 소비자는 선호하는 어떤
아이콘 set 도 쓸 수 있다.

### 4.3 하위호환 prop 별칭 — `value` 선호, `label` deprecated
`LinkCell` 과 `ButtonCell` 은 표시 텍스트로 `value` 를 선호 prop 으로 받고, 기존 `label` 은
deprecated 별칭으로 유지한다(`value ?? label`). `value`/`label` 둘 다 없으면 빈 요소를
렌더한다. `label` 은 차기 메이저에서 제거 예정이다.

### 4.4 번들 한도 정책 — ≤ 10 KB(brotli), 추정 금지·실측
패키지 번들 한도는 brotli 압축 기준 10 KB. 셀이 추가될 때 번들 영향은 이전 작업에서
외삽(extrapolate)하지 않고 추가 직후 실측한다. 셀의 런타임 JS 부피가 작은 이유는 (1) Tailwind
클래스가 소스에 문자열 리터럴로만 존재해 런타임 부피가 0이고, (2) 작은 순수 헬퍼만 쓰며,
(3) tree-shaking 으로 소비처별 fragment 가 가능하기 때문이다.

### 4.5 인라인 style 예외 — ProgressCell 동적 width
`ProgressCell` 의 bar 는 `style={{ width: '${pct}%' }}` 동적 값 1건만 인라인 style 을 쓴다.
Tailwind JIT 의 임의값 클래스는 런타임에 변하는 너비를 표현할 수 없으므로 의도된 예외다.
그 외 모든 셀은 Tailwind className 으로만 스타일링한다.

### 4.6 EditableCell 구조 — 셀은 leaf, 편집 state 는 컨테이너 소유
`EditableCell` 은 leaf 렌더러로, 편집 여부(`isEditing`)와 commit/cancel 콜백을 prop 으로 받는다.
편집 셀의 외부 상태(어느 셀이 편집 중인지 등)는 그리드 컨테이너가 관리하고, 셀 내부는 `draft`
상태만 소유한다. commit 시 새 값은 콜백 인자(`onCommit(newValue)`)로 직접 전달되어, 편집 값이
React state 갱신 타이밍에 묶이지 않는다(빠른 셀 전환 시 stale 값 commit 위험 제거).

### 4.7 EditableCell 추가 편집 기능
- `maxLength` — `<input>`/`<textarea>` 의 HTML `maxLength` 로 전달(`<select>` 제외).
- `align` — Tailwind 클래스로 텍스트 정렬(인라인 style 비사용).
- `stopPropagationOnKeyDown` — true 시 키 처리 후 `e.stopPropagation()` 을 호출해 그리드 호스트의
  키보드 핸들러가 키를 가로채지 않게 한다.
- `initialDraft` — 키 입력으로 편집을 시작할 때 첫 글자가 유실되지 않도록, 마운트 시 1회 draft
  초기값으로 적용한다(이후 prop 변경은 무시; 컴포넌트가 draft 를 소유). 컨트롤드 `value={draft}` 를
  유지하므로 imperative DOM write 가 없다.
  - 알려진 한계: 한국어 등 IME 조합 입력의 첫 글자는 composition 이벤트로 처리되며, 별도 처리
    범위로 남겨져 있다.

### 4.8 조건부 셀 스타일 — `CellClassNameCallback`
`CellClassNameCallback<TData> = (cell: Cell<TData, unknown>) => string` 타입으로 셀 단위 조건부
Tailwind 클래스를 표현한다. `EditableCell` 은 해결된 문자열을 `cellClassName?: string` prop 으로
받아 className 합성에 사용한다. 이 콜백 타입의 정식(canonical) 정의는 `@topgrid/grid-core` 에
있으며, 렌더러 패키지는 하위호환을 위해 type-only 재export 로 노출한다.

---

## 5. 렌더러 레지스트리와 type 디스패치

### 5.1 레지스트리 API

```ts
interface CellComponentProps {
  value: unknown;
  row?: Row<unknown>;
  column?: Column<unknown, unknown>;
}
type CellComponent = ComponentType<CellComponentProps>;

const defaultRendererRegistry: Record<string, CellComponent>;
function registerRenderer(type: string, component: CellComponent): void;
function getRenderer(type: string): CellComponent | undefined;
```

- `defaultRendererRegistry` 에는 표시 셀 11종이 사전 등록되어 있고, 편의를 위한 alias 키 **3종**
  (`dateTime` → DateCell, `statusBadge` → StatusBadgeCell, `check` → CheckCell)을 더한다.
- 셀의 좁은 prop 타입을 `CellComponent` 로 넓히는 캐스트는 단일 헬퍼 한 곳으로 격리한다(반복 캐스트 회피).
- `registerRenderer` 로 외부에서 커스텀 type 을 등록·덮어쓸 수 있고(의도된 커스터마이즈),
  `getRenderer` 는 미등록 type 에 `undefined` 를 반환해 소비자가 fallback 을 결정하게 한다.
- `EditableCell` 은 레지스트리에 등록하지 않는다 — 편집 모드는 `meta.editable` 로 트리거되며 표시
  type 과 직교하기 때문이다.

### 5.2 createColumns 자동 와이어링(side-effect)
`@topgrid/grid-renderers` 를 import 하면 side-effect 로 일부 표시 셀이 `@topgrid/grid-core` 의
렌더러 레지스트리에 어댑터로 자동 등록된다. 이를 통해 `createColumns({ type: 'number' | ... })`
가 실제 셀 컴포넌트로 디스패치된다(패키지 `sideEffects` 로 보존, import 시점 평가).

- 와이어되는 type(8): `text` / `number` / `date` / `dateTime`(format `'datetime'` bespoke) /
  `badge` / `link`(null 처리 bespoke) / `tag` / `progress`.
- 어댑터는 `value`만 받는 셀을 `(cellContext) => createElement(Cell, { value })` 형태로 감싼다.
  `tag` 는 비배열 값을 `[]` 로 강제(빈 배열 → dash), `progress` 는 클램프 헬퍼로 NaN/범위 초과를 처리.
- 의도적으로 와이어하지 않는 type 과 이유:
  - `boolean` — grid-core 의 Y/N 기본 표시 유지(렌더러 패키지에 BooleanCell 없음).
  - `icon` — `icon` 이 필수 `ReactNode` 라 value만으로 만드는 어댑터가 불가.
  - `checkbox` — createColumns 가 별도 DisplayColumnDef 분기로 처리(레지스트리 우회).
  - `button` / `avatar` — `onClick`/`name` 등 value 가 아닌 필수 prop 필요. value-only 어댑터로는
    런타임에 거짓이 되므로 `column.cell` 직접 와이어링을 쓴다.
  - alias 키(`statusBadge`/`check`) — 렌더러 패키지 자체 레지스트리에서는 접근 가능하지만,
    grid-core 의 type-keyed 맵에서는 동의어라 부가가치가 없어 제외한다.

---

## 6. 엣지 케이스 동작 요약

| 셀 | 입력 | 동작 |
|----|------|------|
| TextCell | `null`/`undefined`/`''` | dash. 단 `0` 은 `"0"` 표시 |
| NumberCell | `null`/`undefined`/NaN | dash |
| DateCell | `''`/유효하지 않은 날짜 | dash |
| StatusBadgeCell | colorMap 미매칭 값 | `defaultColor` fallback |
| LinkCell | `href`/`onClick` 모두 없음 | `<span>` 텍스트만 |
| TagCell | 빈 배열 | dash |
| AvatarCell | `src` 로드 실패 | 이니셜 fallback |
| ProgressCell | `null`/NaN/범위 초과 | `[0,100]` 클램프 |
| EditableCell | `select` + 빈/미지정 옵션 | `(옵션 없음)` placeholder |
| EditableCell | `textarea` + Enter | 줄바꿈(commit 안 함) |

---

## 7. 패키징·사용

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { NumberCell, DateCell, StatusBadgeCell, ButtonCell } from '@topgrid/grid-renderers';

const columns: ColumnDef<Slip>[] = [
  { id: 'amount', accessorKey: 'amount',
    cell: ({ getValue }) => <NumberCell value={getValue() as number} decimals={2} colorNegative /> },
  { id: 'createdAt', accessorKey: 'createdAt',
    cell: ({ getValue }) => <DateCell value={getValue() as string} format="datetime" /> },
  { id: 'status', accessorKey: 'status',
    cell: ({ getValue }) => <StatusBadgeCell value={getValue() as string} /> },
  { id: 'action', header: '액션',
    cell: ({ row }) => <ButtonCell value="삭제" variant="destructive" onClick={() => removeRow(row.original.id)} /> },
];
```

`type` 기반 자동 매핑을 쓰는 경우, `@topgrid/grid-renderers` 를 import 하면 `createColumns` 가
`type: 'number' | 'date' | 'badge' | ...` 를 해당 셀로 디스패치한다(§5.2).
