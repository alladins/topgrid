# ADR-014 Amendment — Cell Prop 재설계 Spec

**작성일**: 2026-05-17
**상태**: draft (사용자 검토 대기)
**원본 ADR**: MOD-GRID-REFACTOR-2026-05-17-014
**BLOCKED 사유 (요약)**: ADR 본문이 처방한 `CellComponent = ComponentType<{ value: unknown } & Record<string, unknown>>` 는 TypeScript `strictFunctionTypes` 의 contravariance 검사를 통과하지 못함 — `Record<string, unknown>` index signature 가 cell 의 narrow prop (`label: string`, `checked: boolean` 등) 으로 좁힐 수 없기 때문. 실증: `wave1-adr-014-result.md` 14 TS2322 errors. asCell helper 대안은 동일 보고서에서 probe-검증됨.

본 spec 은 사용자가 채택한 옵션 3 ("cell prop 재설계 — 모든 cell 이 value 받도록 통일") 를 **typecheck 가능한 형태로 구체화**한다.

---

## 1. 현 상태 인벤토리 (11 cell + 14 registry entries)

### 1.1 11 cell 의 현재 prop interface (실측)

| Cell | file:line | Required props | Optional props |
|------|-----------|----------------|----------------|
| TextCell | `TextCell.tsx:8-13` | `value: string \| number \| null \| undefined` | `className?: string` |
| NumberCell | `NumberCell.tsx:11-24` | `value: number \| null \| undefined` | `decimals?`, `unit?`, `locale?`, `colorNegative?`, `className?` |
| DateCell | `DateCell.tsx:11-20` | `value: string \| number \| Date \| null \| undefined` | `format?: 'date'\|'datetime'\|'time'`, `locale?`, `className?` |
| StatusBadgeCell | `StatusBadgeCell.tsx:11-20` | `value: string` | `colorMap?`, `defaultColor?`, `className?` |
| TagCell | `TagCell.tsx:12-21` | `value: readonly string[]` | `colorMap?`, `gapClassName?`, `className?` |
| ProgressCell | `ProgressCell.tsx:12-21` | `value: number \| null \| undefined` | `showLabel?`, `barColorClassName?`, `className?` |
| LinkCell | `LinkCell.tsx:12-21` | **`label: string`** | `onClick?: () => void`, `href?`, `className?` |
| ButtonCell | `ButtonCell.tsx:16-29` | **`label: ReactNode`**, **`onClick: () => void`** | `variant?: 'default'\|'destructive'\|'ghost'`, `disabled?`, `size?: 'sm'\|'xs'`, `className?` |
| CheckCell | `CheckCell.tsx:11-20` | **`checked: boolean`** | `onChange?`, `readOnly?`, `className?` |
| IconCell | `IconCell.tsx:12-23` | **`icon: ReactNode`** | `label?: string`, `onClick?`, `color?`, `className?` |
| AvatarCell | `AvatarCell.tsx:13-22` | **`name: string`** | `src?`, `sizeClassName?`, `className?` |

볼드 = `value` 가 아닌 main prop. **6 cell 은 `value`, 5 cell 은 다른 이름.**

### 1.2 현 `CellComponentProps` / `CellComponent` 정의

```typescript
// rendererRegistry.ts:31-41
export interface CellComponentProps {
  value: unknown;
  row?: Row<unknown>;     // TanStack row context (optional)
  column?: Column<unknown, unknown>;  // TanStack column context (optional)
}
export type CellComponent = ComponentType<CellComponentProps>;
```

### 1.3 현 registry (14 entries, 14 `as unknown as CellComponent` cast)

`rendererRegistry.ts:59-74` — 11 unique cell + 3 alias key (`dateTime`/`statusBadge`/`check`). 14회 cast.

---

## 2. CellComponentProps / CellComponent 신 정의

### 2.1 직교 2차원 분석 (advisor 권고 반영)

ADR 본문이 단일 옵션으로 본 "재설계" 는 실제로는 **두 직교 차원의 곱**임:

**Dim-1 — Cell `value` 의 typing 정책:**
- **1a — 좁은 per-cell type 유지** (예: `LinkCell { value: string }`, `CheckCell { value: boolean }`)
  - 사용자가 cell 을 직접 JSX 호출 시 type-narrow 보호
- **1b — 모든 cell 이 `value: unknown` 수용, 내부 narrow** (defensive cell)
  - 모든 cell 이 `typeof value === '...' ? ... : ...` 패턴
  - registry 슬롯과 cell prop 이 완전 일치 → cast 0건 가능

**Dim-2 — Registry 의 cast 전략:**
- **2a — cast 0건** (만약 cell prop 이 registry 슬롯과 완전 일치 시 가능)
- **2b — `asCell<T>()` helper 1회 cast** (14→1 격리)
- **2c — 14회 individual cast (status quo)**

### 2.2 4 조합의 컴파일 가능성 (probe 실증)

| 조합 | Cell value | Cast | 컴파일? | 비고 |
|------|-----------|------|---------|------|
| **(1a, 2a)** | narrow | 0 | **❌ FAIL** | ADR-014 본문 처방. BLOCKED 보고서 14 TS2322 실증. |
| **(1a, 2b)** | narrow | 1 (asCell) | ✅ PASS | 본 spec probe 실증 (2026-05-17, `__probe_redesign.tsx`). 5/5 cell 실증. |
| **(1b, 2a)** | unknown (defensive) | 0 | ✅ PASS — **단, ButtonCell.onClick REQUIRED 면 FAIL** | 실증: required prop 이 `CellComponentProps` 에 없으면 contravariance fail. ButtonCell.onClick 을 optional 로 약화하면 통과. |
| **(1b, 2b)** | unknown | 1 (asCell) | ✅ PASS | 1b 이 이미 cast 불필요하므로 asCell 도입은 잉여. |
| **(1a, 2c)** | narrow | 14 | ✅ PASS | 현 상태 (목표 미달성 — cast 14건 잔존). |

### 2.3 옵션 비교 (4 옵션 framing)

| 옵션 | 정의 | 컴파일 | 사용자 type-safety | Cast 수 | 비고 |
|------|------|--------|-------------------|---------|------|
| **옵션 A — Generic CellComponent** | `CellComponent<T = unknown> = ComponentType<{ value: T } & ...>` | 부분 | 강함 | 복잡 | registry `Record<string, CellComponent<?>>` 의 `?` widening 필요 — 결국 cast 재발. |
| **옵션 B — index signature** | `& Record<string, unknown>` 추가 | **❌ FAIL** | — | — | ADR-014 본문. BLOCKED 보고서 §근본원인 — required prop 의 contravariance 차단. |
| **옵션 C (task brief 기재) — value: unknown 통일 + 5 cell rename + cast 0** | (1a, 2a) 또는 (1b, 2a) | (1a, 2a) ❌ / (1b, 2a) ✅ (조건부) | (1a) 강 / (1b) 약 | 0 (1b 의 경우) | (1a, 2a) 는 BLOCKED 와 동일 실패. (1b, 2a) 는 cell 내부 narrow 부담 + required prop weakening 필요. |
| **옵션 D — asCell helper 격리** | (1a, 2b) | ✅ PASS | 강함 (호출처) | 1 | wave1-adr-014-result.md §대안 + 본 spec probe 실증. design smell 1개 격리. |

### 2.4 권고 옵션 + 사유

**권고: 옵션 D — `asCell<T>()` helper + 옵션 1a (narrow per-cell value)**

**사유:**
1. **컴파일 확실**: probe 실증 (2026-05-17, 본 spec 작성 중). 5 cell 패턴 모두 typecheck 통과.
2. **사용자 type-safety 보존**: cell 을 직접 JSX 호출 시 (예: `<CheckCell value={true} />`) TS 가 잘못된 type 감지. 옵션 1b 는 이 보호를 포기.
3. **cast 14→1**: ADR-014 의 핵심 목표 (design smell 정리) 달성.
4. **required prop 약화 불필요**: ButtonCell.onClick required 유지 가능. POL-COMPAT §3 (semver) 영향 최소.
5. **asCell 자체가 "registry 슬롯 widening" 의 의도를 자명히 표현**: 1개 cast 가 코드 안에서 의미적으로 정당화됨 (격리된 design smell 1개).

**거부 옵션 사유:**
- 옵션 A (Generic): registry 의 단일 슬롯 type 이 필요한데 `Record<string, CellComponent<?>>` 의 `?` 가 결국 unknown → cast 재발생.
- 옵션 B (index signature): BLOCKED 보고서 14 errors 로 실증된 실패.
- 옵션 C 의 (1a, 2a) 변형: BLOCKED 와 동일 실패.
- 옵션 C 의 (1b, 2a) 변형: 가능하나 (a) defensive narrow 부담 11회 추가, (b) ButtonCell/CheckCell onChange 등 required prop 약화 → semver major + 사용자 API 약화. trade-off 가 큼.

### 2.5 신 CellComponentProps / CellComponent 정의 (권고 옵션 D)

```typescript
// rendererRegistry.ts (proposed)
import type { ComponentType } from 'react';
import type { Row, Column } from '@tanstack/react-table';

/**
 * Display-mode cell component contract (registry slot).
 *
 * Each cell's actual prop type can be more specific (e.g. CheckCell.value: boolean)
 * — the {@link asCell} helper bridges the contravariance gap when registering.
 * Registry consumers (createColumns) are responsible for narrowing at the
 * `React.createElement` call site.
 */
export interface CellComponentProps {
  value: unknown;
  row?: Row<unknown>;
  column?: Column<unknown, unknown>;
}

export type CellComponent = ComponentType<CellComponentProps>;

/**
 * Register a cell component under the registry slot type. The widening cast
 * is confined here — call sites pass the original narrow-typed cell.
 *
 * @internal — only `rendererRegistry.ts` uses this. Public consumers do not
 * need it (they register via `registerRenderer(type, component)`).
 */
function asCell<P>(c: ComponentType<P>): CellComponent {
  return c as unknown as CellComponent;
}
```

**`CellComponentProps` 자체는 현재와 동일 shape** (변경 0). 변경 핵심은: **registry 등록부에서 `as unknown as CellComponent` 14회 → `asCell(Cell)` 14회**. 의미적 cast 는 helper 안 1회로 격리.

---

## 3. 11 cell 신 prop contract (권고: 옵션 D — 1a + asCell)

권고 옵션 D 채택 시 **6 cell (TextCell, NumberCell, DateCell, StatusBadgeCell, TagCell, ProgressCell) prop 변경 0건**. **5 cell 만 rename** (`label`/`checked`/`icon`/`name` → `value`):

### 3.1 변경 없음 (6 cell)

TextCell, NumberCell, DateCell, StatusBadgeCell, TagCell, ProgressCell — 현 상태 그대로. cell prop 변경 의무 없음. 단, 보고서 §3 의 "신 prop contract" 권고에 따라 spec 정합성 위해 검토할 수 있는 일관성 항목:

- (선택) `CellComponentProps.row` / `column` 의 TanStack context 를 cell 이 활용 가능 — 현 6 cell 은 미사용. 본 spec 범위 외.

### 3.2 변경 (5 cell — main prop 리네임)

```typescript
// LinkCell — label → value
export interface LinkCellProps {
  value: string;                  // was: label
  onClick?: () => void;
  href?: string;
  className?: string;
}

// ButtonCell — label → value (ReactNode 유지)
export interface ButtonCellProps {
  value: ReactNode;               // was: label
  onClick: () => void;            // REQUIRED 유지 (asCell 이 contravariance 흡수)
  variant?: 'default' | 'destructive' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'xs';
  className?: string;
}

// CheckCell — checked → value
export interface CheckCellProps {
  value: boolean;                 // was: checked
  onChange?: (checked: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

// IconCell — icon → value (label 은 그대로 — 보조 prop)
export interface IconCellProps {
  value: ReactNode;               // was: icon
  label?: string;                 // 그대로 (보조)
  onClick?: () => void;
  color?: string;
  className?: string;
}

// AvatarCell — name → value
export interface AvatarCellProps {
  value: string;                  // was: name
  src?: string;
  sizeClassName?: string;
  className?: string;
}
```

### 3.3 의미 변경 여부 (사용자 확인 필요 지점)

| Cell | 현 main prop | 신 main prop | 의미 변경? |
|------|-------------|--------------|-----------|
| LinkCell | label: string | value: string | **이름만 변경** — 의미 동일 (표시 텍스트) |
| ButtonCell | label: ReactNode | value: ReactNode | **이름만 변경** — 의미 동일 (버튼 라벨/콘텐츠) |
| CheckCell | checked: boolean | value: boolean | **이름만 변경** — 의미 동일 (체크 상태). **HTML `<input checked>` 와의 직관성 손실** — 사용자 검토. |
| IconCell | icon: ReactNode | value: ReactNode | **이름만 변경** — 의미 동일 (아이콘 ReactNode). **`value`라는 이름이 "데이터 값" 의 인상 — 아이콘 ReactNode 와 mismatch** — 사용자 검토. |
| AvatarCell | name: string | value: string | **이름만 변경** — 의미 동일 (사용자 이름 → initials 추출). **`name` 이 의미상 자명 — `value` 는 일반적** — 사용자 검토. |

**한계 인정**: 5 cell 의 `value` 통일은 registry 슬롯의 통일을 위한 **mechanical** rename. CheckCell/IconCell/AvatarCell 의 경우 의미적 명료성이 약간 손실됨. JSDoc 의무.

---

## 4. 사용처 인벤토리

### 4.1 monorepo 내 사용처

**Registry 측 (rendererRegistry.ts:60-73 14 entries)**: 모든 cell 이 1회씩 등록 (`as unknown as CellComponent`). rename 시 정합 변경 필요 0건 (registry 값은 컴포넌트, prop 이름 무관).

**Stories (`packages/grid-renderers/src/__stories__/*.stories.tsx`)**: 11개 (cell 마다 1개). LinkCell.stories `args: { label: '상세 보기' }` 등 5 cell rename 영향:

| Story file | 영향 prop | LOC 위치 |
|-----------|-----------|---------|
| `__stories__/LinkCell.stories.tsx` | `label` → `value` | 4 args 블록 (line 25, 30, 35, 40) |
| `__stories__/ButtonCell.stories.tsx` | `label` → `value` | (확인 미수행, args 블록 추정 4-5건) |
| `__stories__/CheckCell.stories.tsx` | `checked` → `value` | (확인 미수행, 추정 3-5건) |
| `__stories__/IconCell.stories.tsx` | `icon` → `value` | (확인 미수행, 추정 3-5건) |
| `__stories__/AvatarCell.stories.tsx` | `name` → `value` | (확인 미수행, 추정 3-5건) |
| `stories/Cells.stories.tsx` | 통합 stories — line 31 `value: '홍길동'` 등 — TextCell 은 영향 없음 | 5 cell 영향 추정 |

또한 `packages/grid-renderers/README.md:34-60` 의 예제 코드 5개 변경.

**probe-측정 미수행 stories**: 시간 한계 — implementer 가 sweep 권장.

### 4.2 tw-framework-front 측 사용처

**shim re-exports (8 파일)**:
- `tw-framework-front/src/components/tomis/Grid/renderers/{LinkCell,ButtonCell,CheckCell,IconCell,BadgeCell,NumberCell,DateCell}.tsx` — `export { ... } from '@tomis/grid-renderers'` thin re-export.
- `renderers/index.ts` — 8 cell barrel export + TextCell from monorepo.
- 각 shim 의 JSDoc 헤더에 "Migration plan: MOD-GRID-17 will switch usage sites to direct import" 명시.

**Page-level 직접 JSX 사용 (grep `<TextCell|<NumberCell|...` 등)**:
- `tw-framework-front/src/pages/**` 내 0 hits (실측, 본 spec 작성 중 grep).
- `tw-framework-front/src/**` 내 직접 JSX instantiation 0 hits.

**결론**: 5 cell rename 시 tw-framework-front 측 직접 사용자 0건. shim re-export 만 영향 (re-export 자체는 prop 변경에 무영향).

### 4.3 registerRenderer 사용자 인벤토리

`Grep registerRenderer\\(` (production code):
- `packages/grid-renderers/src/rendererRegistry.ts:87` — 정의
- `packages/grid-core/src/column/createColumns.test.ts:172` — 테스트
- 그 외 production code 0건.

**`CellComponent` type 외부 사용자**: 1건 (`packages/grid-renderers/src/index.ts:39` re-export).

### 4.4 영향 평가

| 영향 영역 | 변경 부담 | 자동화 가능 여부 |
|----------|----------|-----------------|
| 11 stories (rename) | 5 cell × 평균 4 args = ~20 site | Yes — sed/codemod |
| README example | 5 example | Yes — manual edit |
| shim re-exports | 0 (re-export 자체 무영향) | N/A |
| page-level JSX | 0 | N/A |
| registerRenderer 호출자 | 0 | N/A |
| ButtonCell variant 호환 (D2 ADR) | 0 (별도 ADR, 미관련) | N/A |

**총 영향 사용처 N**: monorepo 내 **~25 (stories+README)** + tw-framework-front **0**.

---

## 5. Migration shim 옵션 — 5 cell rename 호환성

### 5.1 옵션 A — 신 prop 추가 + 구 prop deprecated 유지 (additive)

```typescript
// LinkCell — Shim A 예
export interface LinkCellProps {
  /** Display text. */
  value?: string;
  /** @deprecated Use `value` instead. Removed in next major. */
  label?: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}
export function LinkCell({ value, label, onClick, href, className }: LinkCellProps): JSX.Element {
  const displayValue = value ?? label;
  if (displayValue === undefined) {
    // EC-XX: both missing → empty fallback
    return <span className={className} />;
  }
  // ... rest unchanged
}
```

**Trade-off**:
- 장점: 사용자 마이그레이션 비용 0 (구 prop 호환). **SEMVER MINOR** 가능.
- 단점: cell 의 type narrowness 약화 (value/label 둘 다 optional → 둘 다 undefined 케이스 fallback 필요). `exactOptionalPropertyTypes` 환경에서 `value?: string` 의 spread 패턴 검토 필요 (C-29).
- 단점: 한 cycle 후 제거 (deprecation lifecycle 관리 부담).
- 단점: ButtonCell.onClick (required) 는 호환 — `label` 만 deprecated. CheckCell.checked (required) → 마찬가지로 둘 중 하나 required 강제 곤란 (둘 다 optional + 런타임 fallback).

**Semver 영향**: MINOR — prop 추가 + 기존 prop deprecated (POL-COMPAT §3.1).

### 5.2 옵션 B — V2 alias type (alias 별도 export)

```typescript
// LinkCellV1 = 현 interface (label)
// LinkCellV2 = 신 interface (value)
export { LinkCellV2 as LinkCell };  // 기본 export 는 V2
export { LinkCellV1 };              // legacy alias
```

**Trade-off**:
- 장점: 명시적 버전 표시. 사용자가 선택.
- 단점: 같은 컴포넌트 2개 구현 유지 — 코드 중복. 5 cell × 2 = 10 컴포넌트.
- 단점: MAJOR — `LinkCell` 의 의미 변경.

**Semver 영향**: MAJOR (default export 의미 변경).

### 5.3 옵션 C — 즉시 breaking (구 prop 즉시 제거)

```typescript
// LinkCell — 신 interface only
export interface LinkCellProps {
  value: string;
  onClick?: () => void;
  // ...
}
```

**Trade-off**:
- 장점: 코드 깨끗. deprecation 부담 0.
- 단점: 사용자가 모든 호출처 즉시 변경 의무. tw-framework-front 측 직접 JSX 0건이므로 **실제 비용 매우 낮음**.

**Semver 영향**: MAJOR — required prop rename.

### 5.4 권고

**권고: 옵션 C (즉시 breaking) — 단, 사용처 인벤토리 결과 (§4) 가 "0 production callers" 인 경우 한정.**

**사유:**
1. tw-framework-front/src/pages 0 hits + tw-framework-front/src 직접 JSX 0 hits — production 영향 0.
2. monorepo stories ~25 site 는 PR 단일 시점 sweep — 1h 추정.
3. README 5 예제 — 동일 PR 에서 1줄씩.
4. shim re-export 는 prop 변경에 무영향 (값만 re-export).
5. 옵션 A 의 deprecation 부담 vs 영향 0건의 비용 균형 — 옵션 C 가 ROI 높음.

**단, 옵션 C 채택 시 semver 영향**: MAJOR (POL-COMPAT §3). 이는 사용자가 §6 의 semver 결정에서 선택해야 함.

---

## 6. semver 권고

ADR-014 의 결과는 5 cell prop 의 main prop rename → public API 변경. 시나리오 별:

| 시나리오 | semver | 사유 |
|---------|--------|------|
| 옵션 A (additive shim) | **MINOR** | 신 prop 추가 + 구 prop deprecated. POL-COMPAT §3.1. |
| 옵션 B (V1/V2 alias) | **MAJOR** | default export 의미 변경. |
| 옵션 C (즉시 breaking) | **MAJOR** | required prop rename. POL-COMPAT §3. |

**권고**: **옵션 C + MAJOR**. 사용처 인벤토리 0건이므로 MAJOR 의 의미는 형식적 — 실제 사용자 영향 0.

**대안 사용자 결정 지점**:
- 옵션 A (MINOR) 선택 시: cell prop interface 가 약간 약화 (optional value + optional label) 되나 호환성 보존. semver 정책상 깔끔.
- 옵션 C (MAJOR) 선택 시: API 가 깨끗하나 MAJOR bump 부담.

**원본 ADR-014 의 semver 명시는 "none"** (refactor-analysis §12 #14 인용) — 그러나 본 amendment 는 5 cell prop rename 을 포함하므로 ADR 본문의 "semver none" 주장은 무효. semver bump 의무.

---

## 7. 구현 단계 (implementer agent 위임용 체크리스트)

### Step 1 — CellComponentProps / CellComponent 신 정의 + asCell helper

- [ ] `packages/grid-renderers/src/rendererRegistry.ts:31-41` 의 `CellComponentProps` / `CellComponent` 유지 (변경 0).
- [ ] 같은 파일에 `asCell<P>()` helper 추가 (§2.5 의 정의). `@internal` JSDoc.
- [ ] `as unknown as CellComponent` 14회 → `asCell(Cell)` 14회 변환.
- [ ] 검증: `grep "as unknown as CellComponent" packages/grid-renderers/` → 0 hits.
- [ ] 검증: `grep "asCell(" packages/grid-renderers/src/rendererRegistry.ts` → 14 hits.

### Step 2 — 5 cell prop interface rename (옵션 C 채택 시)

- [ ] `LinkCell.tsx`: `label` → `value`. `LinkCellProps` interface + destructure + JSDoc 갱신.
- [ ] `ButtonCell.tsx`: `label` → `value` (ReactNode 유지).
- [ ] `CheckCell.tsx`: `checked` → `value`. JSX 의 `<input checked={value}>` 매핑.
- [ ] `IconCell.tsx`: `icon` → `value`. JSDoc 명시 — `value` 는 ReactNode (아이콘 컴포넌트).
- [ ] `AvatarCell.tsx`: `name` → `value`. JSDoc 명시 — `value` 는 사용자 이름 (initials 추출 소스).
- [ ] 검증: 각 cell file 내 `label|checked|icon|name` 중 rename 된 main prop 명 등장 0 (단, ButtonCell.label JSDoc 잔재 / IconCell.label 보조 prop 은 유지 — naming 충돌 명확화).

### Step 3 — Stories sweep

- [ ] `packages/grid-renderers/src/__stories__/LinkCell.stories.tsx` — `label:` → `value:` (전 args 블록).
- [ ] `packages/grid-renderers/src/__stories__/ButtonCell.stories.tsx` — `label:` → `value:`.
- [ ] `packages/grid-renderers/src/__stories__/CheckCell.stories.tsx` — `checked:` → `value:`.
- [ ] `packages/grid-renderers/src/__stories__/IconCell.stories.tsx` — `icon:` → `value:`.
- [ ] `packages/grid-renderers/src/__stories__/AvatarCell.stories.tsx` — `name:` → `value:`.
- [ ] `packages/grid-renderers/stories/Cells.stories.tsx` — 5 cell 영향 sweep.

### Step 4 — README + tw-framework-front shim 정합

- [ ] `packages/grid-renderers/README.md:34-60` — 5 예제 변경.
- [ ] `tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` 외 4 shim — type re-export 변경 0 (prop 자동 따라옴). **단, shim 의 JSDoc 코멘트 검토** ("`onClick` weakened" 등) — 사용자 결정 (코멘트 갱신 의무 여부).

### Step 5 — CHANGELOG + 마이그레이션 가이드

- [ ] `packages/grid-renderers/CHANGELOG.md` — semver bump entry. **권고 시나리오 (옵션 C, MAJOR)** 시:
  ```
  ## [X.0.0] — 2026-05-17
  
  ### BREAKING
  - `LinkCell`/`ButtonCell`: `label` prop renamed to `value`
  - `CheckCell`: `checked` prop renamed to `value`
  - `IconCell`: `icon` prop renamed to `value`
  - `AvatarCell`: `name` prop renamed to `value`
  
  ### Internal
  - `as unknown as CellComponent` cast 14→1 via `asCell<P>()` helper (ADR-014 amendment).
  ```
- [ ] codemod 또는 sed 패턴 제공 (선택):
  ```sh
  # 사용자 마이그레이션용 (사용처 0이지만 외부 사용자 대비)
  sed -i 's/<LinkCell label=/<LinkCell value=/g' src/**/*.tsx
  sed -i 's/<ButtonCell label=/<ButtonCell value=/g' src/**/*.tsx
  # ... 등
  ```

### Step 6 — Changeset (Wave 1 거버넌스)

- [ ] `.changeset/*.md` 추가 — `@tomis/grid-renderers: major` (옵션 C) 또는 `minor` (옵션 A).

### Step 7 — Typecheck + 검증

- [ ] `cd packages/grid-renderers && npx tsc --noEmit` → 0 errors.
- [ ] `pnpm -F @tomis/grid-renderers build` → success (dist 갱신).
- [ ] 단위 테스트 — **부재** (현 grid-renderers 0 .test.tsx). 회귀 위험 14/14 cell 미커버 — 실증 한계.
- [ ] Storybook 시각 검증 — MOD-GRID-99-B/G-002 부트스트랩 deferred (refactor-analysis §10.2 참조). 본 ADR 범위 외.

### Step 8 — ADR-014 본문 amendment

- [ ] `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` 의 ADR-014 절에 **Amendment 섹션 추가** (옵션 D + 채택 사유 + probe 결과 인용).
- [ ] 본 spec 파일 참조 추가.
- [ ] semver "none" → 채택 옵션에 따라 "minor"/"major" 정정.

---

## 8. 위험 + 알려진 한계

### 8.1 시간 한계로 미검증 항목

| 항목 | 한계 | 권고 |
|------|------|------|
| 11 cell × N stories args 블록 정확 카운트 | LinkCell만 정확 측정 (4건). 나머지 4 cell stories file 미 inspect | implementer 가 sweep 시 실측 |
| ButtonCell `variant: 'default'\|'destructive'\|'ghost'` rename (D2 ADR) 와의 정합 | 본 spec 범위 외 | 별도 ADR 검토 |
| `CellComponentProps.row`/`column` (TanStack context) 의 cell 활용 여부 | 현 11 cell 모두 미사용 | 본 spec 범위 외 |
| Cells.stories.tsx 통합 stories 내 args | grep 만 수행, line 단위 inspect 미수행 | implementer sweep |
| TanStack TableMeta integration | task brief §Step 2 언급 — 본 spec 범위 초과 (별도 ADR) | 향후 ADR |

### 8.2 테스트 부재 — 회귀 위험

- `packages/grid-renderers/src/*.test.*` 0건 (BLOCKED 보고서 인용).
- 14 cell rename 의 런타임 회귀 (예: CheckCell 의 `checked` 매핑 잘못) 컴파일타임 보호만 의존.
- 권고: Storybook 부트스트랩 후 시각 회귀 검증 추가 (MOD-GRID-99-B 후속).

### 8.3 createColumns 측 unwiring (refactor-analysis §3.1 P0)

- 본 ADR-014 amendment 는 `grid-renderers` 내부 만 변경.
- `createColumns` 가 grid-core 의 placeholder registry 를 읽는 P0 결함은 **별도 ADR (refactor-analysis §3.1, Wave roadmap #2)**. 본 amendment 와 직교.
- 본 amendment 후에도 5 cell 의 page-level 직접 JSX 사용은 0 — 실 효과는 stories + 향후 wiring 시점에 나타남.

### 8.4 옵션 D 의 cast 1건 — design smell 격리

- `asCell` 내부의 `as unknown as CellComponent` 는 design smell 잔재 (C-4 명시 cast).
- 단, 14 → 1 로 격리. 향후 cell 추가 시 정당화는 helper 안 JSDoc 으로 유지.
- 완전 0 cast 는 옵션 1b (defensive cell) 필요 — 사용자 type-safety trade-off.

### 8.5 ADR 본문과 차이

- 원본 ADR-014 본문의 "semver: none" → 본 amendment 는 옵션에 따라 minor/major.
- 원본 ADR-014 의 "결정" 절 (index signature 추가) → 본 amendment 는 asCell helper.
- ADR 본문 amendment 또는 supersede 결정 필요 (§7 Step 8).

---

## 9. 사용자 검토 지점

본 spec 은 implementer agent 가 따라할 수 있는 형태로 작성되었으나, 다음 4가지는 **사용자 명시 결정 필수**:

### 9.1 ★ 헤드라인 — Cell value typing 정책

**Dim-1=1a (narrow per-cell) vs 1b (defensive unknown)** — advisor 권고 인용:

- **1a (권고)**: cell 을 직접 JSX 호출 시 type-narrow 보호. asCell helper 1회 cast.
- **1b**: cell 이 unknown 수용, 내부 narrow. cast 0 가능하나 required prop weakening + defensive 부담.

**현 사용처 0건이므로 type-narrow 보호의 즉시 가치는 낮음. 그러나 향후 사용자 (외부 lib 사용자 + tw-framework-front 페이지 마이그레이션 후) 에게는 1a 가 안전.**

### 9.2 semver bump 정책

| 옵션 | semver | 사용자 영향 |
|------|--------|------------|
| 옵션 A (additive shim) | MINOR | 호환 — 구 prop 1 cycle 유지 |
| 옵션 C (즉시 breaking) | MAJOR | 사용처 0건이므로 실 영향 0, 형식적 MAJOR |

**권고: 옵션 C + MAJOR** (사용처 0건 + 코드 깨끗함). 단, **시장 신호 측면에서 MAJOR 가 과도하다 판단되면 옵션 A + MINOR**.

### 9.3 Migration shim 채택 여부

옵션 9.2 와 연결. 옵션 A 채택 시 5 cell 의 prop interface 가 `{ value?: T; /** @deprecated */ label?: T; ... }` 형태 → optional 둘 다 + runtime fallback. `exactOptionalPropertyTypes` (C-29) 환경에서 추가 typecheck 검증 필요 (본 spec 미수행).

### 9.4 5 cell rename 의 의미 명확성

| Cell | 의문 |
|------|------|
| CheckCell | `checked` (HTML 직관) → `value` (registry 통일) — OK? |
| IconCell | `icon` (의미 명료) → `value` (ReactNode 의 일반화) — OK? |
| AvatarCell | `name` (의미 명료) → `value` (initials 소스의 일반화) — OK? |
| LinkCell | `label` → `value` — OK? |
| ButtonCell | `label` → `value` (ReactNode) — OK? |

5 cell 모두 의미 동일, **이름만 변경**. 단, IconCell/AvatarCell 은 의미적 명료성 약간 손실. JSDoc 으로 보완 가능.

**사용자 결정**: 5 cell 일괄 rename OK? 또는 일부 cell 만 (예: LinkCell/ButtonCell 만 — label 의 의미 공통) rename 하고 IconCell/AvatarCell/CheckCell 은 원 prop 유지 + cell 내부에서 unknown 우회?

---

## 10. 부록 — Probe 실증 결과

본 spec 의 옵션 평가는 다음 probe 로 실증됨 (`__probe_redesign.tsx`, 작성 후 삭제):

**Probe 1: (1a, 2b) — 권고 옵션 D**

5 cell (TextCell, LinkCell, ButtonCell, CheckCell, IconCell, AvatarCell) 각각 narrow value type + asCell registry — **`npx tsc --noEmit` PASS (0 errors)**. ButtonCell.onClick required 보존 가능.

**Probe 2: (1b, 2a) — 옵션 C 의 한 변형**

5 cell defensive (`value: unknown`) + cast 0 registry. **ButtonCell.onClick required 일 때 FAIL** (TS2322: contravariance — `CellComponentProps` 에 onClick 없음). onClick 을 optional 로 약화 시 PASS. → required prop 약화 의무는 추가 semver MAJOR 비용.

**Probe 3: (1a, 2a) — ADR-014 본문 처방**

BLOCKED 보고서 §증거 인용 — 14 TS2322 errors. 실증 미수행 (이미 보고된 결과).

**환경**: TypeScript 5.x, `strict: true`, `strictFunctionTypes: true`, `exactOptionalPropertyTypes: true`, `noImplicitAny: true`.

---

**END SPEC**
