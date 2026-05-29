# MOD-GRID-05 / renderer / G-002 — Spec

**Title**: UI 8종 표준화 — StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell 흡수 + TagCell/AvatarCell/ProgressCell 신규
**Module**: MOD-GRID-05 (셀 렌더러 표준 set)
**Area**: renderer
**Goal**: G-002
**Priority**: P0
**migrationImpact**: high → threshold 95
**Package target**: `@tomis/grid-renderers` (MIT, brotli 한도 10 KB — `.size-limit.json:13` line `"limit": "10 KB"`)
**dependsOn**: MOD-GRID-05/G-001 (TextCell/NumberCell/DateCell + formatters 패키지 베이스라인)
**rubricVersion**: specify v1.0.5 (32 항목 + 메타 H 3항목)

---

## ★ 사전 결정 (D# 표) — 본문 cross-consistency 의무 (G-01 v1.0.4)

| D# | 결정 | 사유 / 출처 |
|----|------|----------|
| **D1** | 흡수 5종은 **L0 파일별 prop 시그니처를 보존**하되, 신 컴포넌트 명명은 **AC-001 ~ AC-007 정의 + Section 2 강제**에 따라 다음과 같이 매핑한다: `ButtonCell.tsx → ButtonCell`, `BadgeCell.tsx → StatusBadgeCell`(★ 이름 변경), `CheckCell.tsx → CheckCell`, `LinkCell.tsx → LinkCell`, `IconCell.tsx → IconCell`. 단, **BadgeCell → StatusBadgeCell** 1건만 컴포넌트 명칭 변경 — tw-framework-front 측 `renderers/BadgeCell.tsx` shim 은 `export { StatusBadgeCell as BadgeCell }` 로 alias 하여 사용처 import drift 0 보장 (C-6). | C-1, C-6, L0, AC-001 |
| **D2** | **L0 ButtonCell variant 명**(`primary\|danger\|ghost`)을 **goals.json AC-003 의 `default\|destructive\|ghost`** 로 변경한다. AC-003 이 spec-authority(C-27) — 본 spec 본문에서 `default\|destructive\|ghost` 채택. 호환성: tw-framework-front shim 은 type 만 re-export — 사용처가 `variant='primary'` 호출 중이면 build error 노출 → IMPLEMENT 단계에서 사용처 grep 후 자동 codemod 시도 또는 documented-deviation 작성 (Section 11.4 R1). | AC-003, C-27, C-6 |
| **D3** | **lucide-react 등 외부 아이콘 라이브러리 import 0건**. L0 IconCell (L1-29) 의 patterns(`icon: ReactNode` prop) 보존 — 사용처가 자신의 아이콘 컴포넌트 instance 를 prop 으로 주입한다. **신규 peer dependency 추가 없음 → ADR-MOD-GRID-05-XXX 작성 불필요** (C-9/C-20 면제). tw-framework-front 는 `react-icons` 사용(package.json L36) 이며, monorepo 는 라이브러리-중립 정책 유지. | C-9, C-20, L0 IconCell.tsx L3 |
| **D4** | **TagCell/AvatarCell/ProgressCell 3종은 신규** — L0 부재. Section 1 A-01 evidence = "현 구현 없음" (rubric A-01 N/A→YES 절). 시각 회귀 비교 baseline 없음 — Storybook stories 만으로 외관 정의. AC-009 시각 회귀 의무는 흡수 5종 (StatusBadge/Link/Button/Check/Icon) 에 한해 적용 — TagCell/AvatarCell/ProgressCell 은 신규로 C-17 의 "마이그레이션 전후 비교" 대상 아님. | F-05-02, AC-009 |
| **D5** | 번들 추정: spec 예상 `+5 KB` (8 컴포넌트 누적) 는 **metric 참조용 — 게이트 아님**. G-001 완료 시점의 실측치 (현 dist/index.mjs.map 산출) 와 더한 누적치가 10 KB 한도에 근접할 수 있음 → IMPLEMENT 직후 `pnpm size-limit` 실측만으로 결정 (ADR-MOD-GRID-00-010 measure-then-decide). 한도 초과 시 sub-entry 분할(예: `@tomis/grid-renderers/ui` vs `@tomis/grid-renderers/basic`) 고려 — IMPLEMENT 결과에 따라 G-003 spec 단계에서 결정. | ADR-MOD-GRID-00-010, C-21 |
| **D6** | 파일 매니페스트 = **NEW 8 (monorepo NEW: StatusBadgeCell/LinkCell/ButtonCell/CheckCell/IconCell/TagCell/AvatarCell/ProgressCell) + MODIFY 1 (index.ts export 추가) + MODIFY 5 (tw-framework-front renderers/{ButtonCell,BadgeCell,CheckCell,LinkCell,IconCell}.tsx → re-export shim)** = **NEW 8 + MODIFY 6 = 14 파일**. Section 7 표 14행 + Section 11.3 Step 1~5 + Section 12.4 fine-grained cross-check 일치. | C-19 (≤5/Goal — 본 Goal affectedUsageFiles = 5 한도 내), C-6 |
| **D7** | **C-29 (exactOptionalPropertyTypes spread 패턴) 적용 평가**: 본 8 셀은 leaf 컴포넌트. 그러나 `className?: string` 등 optional prop 을 child 컴포넌트로 forwarding 하지 않음 (자체 markup 에서 직접 소비). 따라서 C-29 의 wrapper/alias/helper 적용 범위 밖 → 적용 안 함. 단, `className ?? ''` 패턴은 G-001 Section 11.2 AFTER 의 `className ?? ''` 또는 `.filter(Boolean).join(' ')` 일관 적용. | C-29 적용 범위 (wrapper/alias/helper 만 — G-001 D7 동일), 직접 forwarding 0건 |
| **D8** | **AC-009 C-17 시각 회귀 검증 방법**: G-001 finding (`findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md`) Method B 변형 (구조적 동등성 + JSX 토큰 매핑 분석) 패턴 일관 적용. monorepo Storybook 인프라는 G-001 시점 미구비 — 본 Goal 도 동일 deviation 처리 (`findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` 생성 의무 + 5 흡수 컴포넌트 Storybook placeholder stories 생성). ADR-MOD-GRID-00-003 documented-deviation 절차 적용. | C-17, G-001 finding precedent, ADR-MOD-GRID-00-003 |
| **D9** | **D2 variant 명 변경 (primary→default, danger→destructive) 검증 게이트**: IMPLEMENT 단계 진입 직전 `Grep "ButtonCell" tw-framework-front/src --include=*.tsx --include=*.ts` 으로 모든 사용처 검색. 사용처 0건이면 D2 호환 위험 0 — 단순 흡수. 사용처 > 0건이면 `variant=` prop 값 분포 조사 후 documented-deviation 또는 codemod 적용. spec 본문 Section 8.1 에 사용처 카운트 명시. | D2 호환성, C-6 점진 |

**모든 D# breakdown 본문 cross-check 의무 (G-01 v1.0.4 강화)**:
- D6 의 "NEW 8 + MODIFY 6 = 14 파일" 합계 + NEW/MODIFY 분류 + 파일 이름 8개/6개 enumerate 가 Section 7 표 / Section 11 단계 / AC-001~AC-009 evidence 와 100% 일치.
- D1 의 컴포넌트 명칭 매핑 (`BadgeCell.tsx → StatusBadgeCell`) 이 Section 2 + Section 3 + Section 7 + Section 11.2 Before/After 모두 동일 표기.
- D2 의 variant 매핑이 Section 2.3 + AC-003 evidence + Section 11.4 R1 cross-reference.
- D9 의 grep 사용처 카운트 (Section 8.1 명시) 가 Section 11.3 Step 4 진입 게이트로 일관 적용.

---

## Section 1: 참조 추적 (L0/L1/L2/L3/R-A/R-W)

### 1.1 L0 — 현 tw-framework-front 5 파일 (직접 Read 후 라인 인용 — C-1)

**L0.a** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx` (29 라인 전체 Read 완료)

핵심 패턴 인용 (L1-29):
```tsx
// L1: import
import type { ReactNode } from 'react';

// L3-9: props (variant: 'primary' | 'danger' | 'ghost' — ★ D2 매핑 변경)
interface ButtonCellProps {
  label: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'xs';
}

// L11-15: VARIANT_CLASS (Tailwind 매핑 사전)
const VARIANT_CLASS: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300',
};

// L17-28: 함수 컴포넌트 + e.stopPropagation 패턴
export function ButtonCell({ label, onClick, variant = 'ghost', disabled = false, size = 'xs' }: ButtonCellProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={`rounded px-2 py-0.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        size === 'xs' ? 'text-xs' : 'text-sm'
      } ${VARIANT_CLASS[variant]}`}
    >
      {label}
    </button>
  );
}
```

**L0.b** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx` (26 라인 전체 Read 완료)

핵심 패턴 인용 (L1-25):
```tsx
// L1-5: props (colorMap optional + defaultColor)
interface BadgeCellProps {
  value: string;
  colorMap?: Record<string, string>;
  defaultColor?: string;
}

// L7-15: DEFAULT_COLORS 사전 (7 상태)
const DEFAULT_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-500',
};

// L17-25: 함수 컴포넌트 — lookup → fallback default
export function BadgeCell({ value, colorMap, defaultColor = 'bg-gray-100 text-gray-600' }: BadgeCellProps) {
  const map = colorMap ?? DEFAULT_COLORS;
  const colorClass = map[value] ?? defaultColor;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {value}
    </span>
  );
}
```

★ D1 명시: 본 spec 은 컴포넌트 명을 `StatusBadgeCell` 로 변경 (L0 의 `BadgeCell` → `StatusBadgeCell`). tw-framework-front shim 은 `export { StatusBadgeCell as BadgeCell }`.

**L0.c** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/CheckCell.tsx` (22 라인 전체 Read 완료)

핵심 패턴 인용 (L1-21):
```tsx
// L1-5: props — checked + onChange + readOnly
interface CheckCellProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  readOnly?: boolean;
}

// L7-21: input[type=checkbox] markup
export function CheckCell({ checked, onChange, readOnly = false }: CheckCellProps) {
  return (
    <div className="flex justify-center">
      <input
        type="checkbox"
        checked={checked}
        readOnly={readOnly}
        onChange={readOnly ? undefined : (e) => { e.stopPropagation(); onChange?.(e.target.checked); }}
        onClick={(e) => e.stopPropagation()}
        className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
          readOnly ? 'cursor-default' : 'cursor-pointer'
        }`}
      />
    </div>
  );
}
```

★ D9 명시: goals.json AC-007 표현은 `boolean → check icon`이지만 L0 실제 구현은 **HTML `<input type="checkbox">`** — D1 보존 결정에 따라 L0 markup 보존 (icon SVG 으로 대체하지 않음).

**L0.d** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` (16 라인 전체 Read 완료)

핵심 패턴 인용 (L1-16):
```tsx
// L1-5: props — label + onClick + className
interface LinkCellProps {
  label: string;
  onClick: () => void;
  className?: string;
}

// L7-16: button markup (a 태그 아님 — onClick 기반)
export function LinkCell({ label, onClick, className = '' }: LinkCellProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`text-blue-600 hover:text-blue-800 hover:underline text-left ${className}`}
    >
      {label}
    </button>
  );
}
```

★ D1 명시: goals.json AC-002 의 `href? | onClick? union` — L0 는 `onClick` 만. 본 spec 은 **L0 보존 + href prop 추가 (additive)** — Section 2.2 정의. 호환 유지 (`onClick` required → optional 로 약화 시 호환성 점검 필요 — Section 8.1 R 검증).

**L0.e** `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/IconCell.tsx` (29 라인 전체 Read 완료)

핵심 패턴 인용 (L1-29):
```tsx
// L1: ReactNode import
import type { ReactNode } from 'react';

// L3-8: props — icon (ReactNode) + label + onClick + color
interface IconCellProps {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
  color?: string;
}

// L10-28: 컴포넌트 — onClick 유/무에 따라 <button> 또는 <span>
export function IconCell({ icon, label, onClick, color = 'text-gray-500' }: IconCellProps) {
  const content = (
    <span className={`flex items-center gap-1 ${color}`}>
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </span>
  );

  if (onClick) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="hover:opacity-70 transition-opacity"
      >
        {content}
      </button>
    );
  }
  return content;
}
```

★ D3 명시: `icon: ReactNode` prop pattern — 외부 lucide-react/react-icons 라이브러리 import 0건. monorepo 도 동일 패턴 유지 → peer dependency 추가 0.

### 1.2 L1 — TanStack v8 API (UI 레이어 컴포넌트 — N/A)

본 8 셀 컴포넌트는 ColumnDef.cell 함수에서 호출되는 일반 React 컴포넌트로, `useReactTable` 등 TanStack 표준 API 를 **직접 사용하지 않음**. 따라서 L1 = N/A (specify-rubric A-02 의 "TanStack API 출처 없이 props 정의" 면제 — UI 레이어 컴포넌트). 참조 인벤토리: `references/tanstack-api-inventory.md` §2 ColumnDef.cell function signature.

### 1.3 L2 — 공통 컴포넌트 분석 (현 8 variant 중 renderer 영역)

`references/current-tanstack-analysis.md` L25-32 → `renderers/` 8 파일 = 7 renderer + index barrel. **G-001 흡수 완료**: NumberCell + DateCell + TextCell + formatters (3 파일 + helper). **본 G-002 흡수 범위** = ButtonCell + BadgeCell + CheckCell + LinkCell + IconCell = **5 파일** (전체 8 중 5). G-001 미흡수 잔여 0 — 본 G-002 완료 시점에 tw-framework-front `renderers/*.tsx` 8 파일 모두 monorepo shim 으로 전환.

중복 패턴 추출 (5 파일 중복 분석):
- **e.stopPropagation 패턴**: ButtonCell L20 + CheckCell L13/14 + LinkCell L9 + IconCell L21 — 4 파일 동일. row click event 전파 차단 의도. 본 G-002 monorepo 구현도 동일 패턴 보존.
- **Tailwind className only**: 5 파일 모두 C-5 준수. 인라인 style 0건. monorepo 도 동일 정책.
- **export pattern**: `export function ComponentName({ ... }: Props) { ... }` 일관 — G-001 결과 (`TextCell.tsx` L20, `NumberCell.tsx` L31, `DateCell.tsx` L28) 와 동일 패턴.
- **className 합성 패턴**: L0 는 template literal (예: ButtonCell L23-24 `` ` ... ${VARIANT_CLASS[variant]}` ``) 사용. G-001 결과는 `['a', 'b'].filter(Boolean).join(' ')` 또는 `\`${a} ${b ?? ''}\`.trim()` 패턴. monorepo 도 G-001 패턴 일관 채택.

### 1.4 L3 — 영향 사용처 카운트 (정확 N=5)

본 G-002 의 영향 사용처 (goals.json `affectedUsageFiles` 5건):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx` — body 를 re-export shim 으로 교체 (variant 명 변경 D2 — Section 11.4 R1 처리)
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx` — body 를 `export { StatusBadgeCell as BadgeCell }` alias shim 으로 교체
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/CheckCell.tsx` — re-export shim
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` — re-export shim
5. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/IconCell.tsx` — re-export shim

**MOD-GRID-04 createColumns type 자동 분기 의존성** (consumer 관점):
- `type:'badge'` → `rendererRegistry['badge'] = StatusBadgeCell` (registry 는 G-003 범위, 본 G-002 은 직접 import 만 가능)
- `type:'link'` → `rendererRegistry['link'] = LinkCell`
- `type:'icon'` → `rendererRegistry['icon'] = IconCell`
- `type:'checkbox'` → `rendererRegistry['checkbox'] = CheckCell`

본 G-002 출력은 G-003 EditableCell + registry 가 의존하는 baseline 컴포넌트 (G-001 패턴 동일).

### 1.5 R-A — AG Grid 동등 기능 (참조용, 코드 차용 X — C-7)

`references/publish-aggrid-analysis.md` § (canonical-modules.json MOD-GRID-05 L210-212):
- **components prop map (cellRenderer registry)** — AG Grid 의 `components={{ statusBadge: StatusBadgeRenderer, ... }}` 패턴. 본 G-002 의 컴포넌트 export 가 G-003 의 `rendererRegistry` 의 baseline.
- **agTextCellEditor 등 cellEditor** — 본 G-002 는 display 측면만 (editor 는 G-003 EditableCell 범위).

본 G-002 의 5 흡수 + 3 신규 셀은 AG Grid 의 **display 측면** (renderer 아닌 cell renderer) 만 대응. 차용 코드 0건 (라이선스 — C-7).

### 1.6 R-W — Wijmo 동등 기능 (참조용, 코드 차용 X — C-16)

`references/publish-wijmo-analysis.md` § (canonical-modules.json MOD-GRID-05 L214-217):
- **Cell Templates binding expressions** — Wijmo 의 `<wj-flex-grid-cell-template>` (angular binding 식). React JSX 와 다른 paradigm — 본 G-002 는 React 함수 컴포넌트로 직접 구현.
- **Conditional Formatting via formatItem** — Wijmo FlexGrid `formatItem` 이벤트로 셀별 className/style. 본 G-002 의 `StatusBadgeCell.colorMap` prop 이 동등 기능 (값 기반 시각적 분기).

C-16 (Wijmo 비도입) — Wijmo 패키지 import 0건, 패턴 학습용 참조만.

---

## Section 2: API 계약 (TypeScript strict — C-4)

### 2.1 StatusBadgeCell — L0 BadgeCell.tsx 흡수 + 이름 변경 (D1)

**Props interface** (`packages/grid-renderers/src/StatusBadgeCell.tsx`):
```ts
export interface StatusBadgeCellProps {
  /** Status value — colorMap 키로 사용. */
  value: string;
  /** Status → Tailwind class 매핑. 미지정 시 기본 7-state map (L0 L8-15 보존). */
  colorMap?: Record<string, string>;
  /** Map 에 없는 값의 fallback Tailwind class. */
  defaultColor?: string;
  /** 추가 Tailwind className (합성용). */
  className?: string;
}
```

**Default values**:
- `colorMap`: `DEFAULT_COLORS` 상수 (L0 BadgeCell.tsx L8-15 그대로 — `active/inactive/pending/error/approved/rejected/draft` 7 keys) — AC-001 의 "기본 colorMap 제공 (pending/approved/rejected 등)" 충족
- `defaultColor`: `'bg-gray-100 text-gray-600'` (L0 L17 그대로)
- `className`: undefined (신규 — 합성 가능)

**Return type**: `JSX.Element` (`<span>`) — G-001 패턴 일관.

### 2.2 LinkCell — L0 LinkCell.tsx 흡수 + href prop 추가 (D1, AC-002)

**Props interface** (`packages/grid-renderers/src/LinkCell.tsx`):
```ts
export interface LinkCellProps {
  /** 표시 텍스트. */
  label: string;
  /** 클릭 콜백 — href 미지정 시 동작. (L0 L3 보존 — optional 로 약화) */
  onClick?: () => void;
  /** 링크 URL — 지정 시 <a href> 렌더, 미지정 시 <button> (AC-002 union 의도). */
  href?: string;
  /** 추가 Tailwind className. */
  className?: string;
}
```

**Default values**:
- `onClick`: undefined (L0 L3 의 required 에서 약화 — additive ★ Section 8.1 R 검증)
- `href`: undefined (신규 — additive)
- `className`: `''` (L0 L5 보존)

**렌더 분기 (AC-002)**:
- `href` 지정: `<a href={href} className="text-blue-600 hover:text-blue-800 hover:underline">{label}</a>`
- `onClick` 만: `<button onClick={...} className="text-blue-600 ...">{label}</button>` (L0 보존)
- 둘 다 미지정: `<span className="text-blue-600 ...">{label}</span>` (텍스트만 — AC-002 명시 "둘 다 없으면 텍스트만")

**Return type**: `JSX.Element` (`<a>` | `<button>` | `<span>`).

### 2.3 ButtonCell — L0 ButtonCell.tsx 흡수 + variant 매핑 변경 (D1, D2, AC-003)

**Props interface** (`packages/grid-renderers/src/ButtonCell.tsx`):
```ts
import type { ReactNode } from 'react';

export interface ButtonCellProps {
  /** 버튼 텍스트/내용. */
  label: ReactNode;
  /** 클릭 콜백. */
  onClick: () => void;
  /** 변형 (★ D2 매핑 변경: L0 'primary' → 'default', 'danger' → 'destructive'). */
  variant?: 'default' | 'destructive' | 'ghost';
  /** 비활성 (L0 L7 보존). */
  disabled?: boolean;
  /** 크기 (L0 L8 보존). */
  size?: 'sm' | 'xs';
  /** 추가 Tailwind className. */
  className?: string;
}
```

**VARIANT_CLASS 상수** (L0 L11-15 의 키만 D2 매핑):
```ts
const VARIANT_CLASS: Record<NonNullable<ButtonCellProps['variant']>, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white',       // L0 'primary' 매핑
  destructive: 'bg-red-600 hover:bg-red-700 text-white',     // L0 'danger' 매핑
  ghost: 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300',  // L0 'ghost' 동일
};
```

**Default values**:
- `variant`: `'ghost'` (L0 L17 그대로)
- `disabled`: `false` (L0 L17)
- `size`: `'xs'` (L0 L17)
- `className`: undefined

### 2.4 CheckCell — L0 CheckCell.tsx 흡수 (D1)

**Props interface** (`packages/grid-renderers/src/CheckCell.tsx`):
```ts
export interface CheckCellProps {
  /** 체크 상태 (L0 L2 보존). */
  checked: boolean;
  /** 변경 콜백 (L0 L3 보존). readOnly=true 시 호출되지 않음. */
  onChange?: (checked: boolean) => void;
  /** 읽기 전용 (L0 L4 보존). */
  readOnly?: boolean;
  /** 추가 Tailwind className (자체 markup 의 input 에 합성). */
  className?: string;
}
```

**Default values**:
- `onChange`: undefined (L0 L3)
- `readOnly`: `false` (L0 L7)
- `className`: undefined

**Markup 동일성**: L0 의 `<div className="flex justify-center"><input type="checkbox" .../></div>` markup 그대로 보존. ★ D9: L0 는 native `<input type="checkbox">` — icon SVG 아님 (goals.json AC-007 의 "check icon" 표현은 의미적 — 실제 구현은 native checkbox). spec-authority(C-27) 로 L0 보존 우선.

### 2.5 IconCell — L0 IconCell.tsx 흡수 (D1, D3)

**Props interface** (`packages/grid-renderers/src/IconCell.tsx`):
```ts
import type { ReactNode } from 'react';

export interface IconCellProps {
  /** 아이콘 — React 노드 (사용처가 자신의 아이콘 컴포넌트 instance 주입 — D3). */
  icon: ReactNode;
  /** 보조 텍스트 (L0 L5 보존). */
  label?: string;
  /** 클릭 콜백 — 있으면 <button> 렌더, 없으면 <span> (L0 L6 보존). */
  onClick?: () => void;
  /** 아이콘 색상 Tailwind class (L0 L7 보존 — default 'text-gray-500'). */
  color?: string;
  /** 추가 Tailwind className. */
  className?: string;
}
```

**Default values** (L0 L10 보존):
- `label`: undefined
- `onClick`: undefined
- `color`: `'text-gray-500'`
- `className`: undefined

**peer dependency 추가 0** (D3): 외부 lucide-react/react-icons import 0건. monorepo 라이브러리-중립 유지.

### 2.6 TagCell — 신규 (D4)

**Props interface** (`packages/grid-renderers/src/TagCell.tsx`):
```ts
export interface TagCellProps {
  /** 태그 문자열 배열. 빈 배열 → dash placeholder (EC-08). */
  value: readonly string[];
  /** 태그별 Tailwind class 매핑 (선택 — 미지정 시 기본 회색 chip). */
  colorMap?: Record<string, string>;
  /** chip 사이 gap Tailwind class (default 'gap-1'). */
  gapClassName?: string;
  /** 추가 Tailwind className (root <span> 합성). */
  className?: string;
}
```

**Default values**:
- `colorMap`: undefined → 모든 chip 에 `bg-gray-100 text-gray-700` 적용
- `gapClassName`: `'gap-1'`
- `className`: undefined

**Markup 패턴** (AC-004 "각 item chip 렌더 (Tailwind rounded badge)"):
```tsx
<span className={`inline-flex flex-wrap items-center ${gapClassName} ${className ?? ''}`}>
  {value.map((tag) => (
    <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      colorMap?.[tag] ?? 'bg-gray-100 text-gray-700'
    }`}>
      {tag}
    </span>
  ))}
</span>
```

### 2.7 AvatarCell — 신규 (D4)

**Props interface** (`packages/grid-renderers/src/AvatarCell.tsx`):
```ts
export interface AvatarCellProps {
  /** 사용자 이름 — 이니셜 fallback 의 source. */
  name: string;
  /** 아바타 이미지 URL — 없거나 로드 실패 시 이니셜 fallback. */
  src?: string;
  /** 크기 Tailwind class (default 'w-7 h-7'). */
  sizeClassName?: string;
  /** 추가 Tailwind className (root <span> 합성). */
  className?: string;
}
```

**Default values**:
- `src`: undefined
- `sizeClassName`: `'w-7 h-7'`
- `className`: undefined

**Markup 패턴** (AC-005 "이니셜 fallback 원형 (Tailwind rounded-full)"):
```tsx
<span className={`inline-flex items-center ${className ?? ''}`}>
  {src ? (
    <img src={src} alt={name}
      className={`${sizeClassName} rounded-full object-cover`}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  ) : null}
  {!src && (
    <span className={`${sizeClassName} rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium`}>
      {getInitials(name)}
    </span>
  )}
</span>
```

**Helper**: `getInitials(name)` — 내부 (export 안 함). 한글/영문 첫 2자 추출 (예: "홍길동" → "홍길", "John Doe" → "JD"). null/빈 문자열 → `'?'` fallback (EC-09).

### 2.8 ProgressCell — 신규 (D4)

**Props interface** (`packages/grid-renderers/src/ProgressCell.tsx`):
```ts
export interface ProgressCellProps {
  /** 진행률 (0~100). NaN/null/undefined → 0 으로 클램프 (EC-10). 범위 초과는 [0,100] 클램프 (EC-11). */
  value: number | null | undefined;
  /** 퍼센트 텍스트 표시 (default true). */
  showLabel?: boolean;
  /** bar 색상 Tailwind class (default 'bg-blue-600'). */
  barColorClassName?: string;
  /** 추가 Tailwind className (root 합성). */
  className?: string;
}
```

**Default values**:
- `showLabel`: `true`
- `barColorClassName`: `'bg-blue-600'`
- `className`: undefined

**Markup 패턴** (AC-006 "h-2 bg-primary bar + percentage text"):
```tsx
const pct = clampPercent(value);  // 0~100 클램프, NaN/null → 0
<div className={`flex items-center gap-2 ${className ?? ''}`}>
  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
    <div className={`h-full rounded-full ${barColorClassName}`} style={{ width: `${pct}%` }} />
  </div>
  {showLabel && <span className="text-xs tabular-nums text-gray-700">{pct}%</span>}
</div>
```

★ **C-5 인라인 style 예외 — 동적 값**: `style={{ width: `${pct}%` }}` 는 C-5 의 "인라인 style 금지 (동적 값 제외)" 조항의 동적 값 — Tailwind 임의값 `w-[${pct}%]` 은 JIT 한계로 런타임 변경 안 됨. spec 명시 deviation — risk-bound. C-5 위반 아님.

### 2.9 Export 경로 (B-04)

`packages/grid-renderers/src/index.ts` (MODIFY — G-001 후 현재 5 export + 8 type → 13 export + 21 type 추가):

```ts
// G-001 기존 (보존)
export { TextCell, type TextCellProps } from './TextCell.js';
export { NumberCell, type NumberCellProps } from './NumberCell.js';
export { DateCell, type DateCellProps } from './DateCell.js';
export {
  formatNumberString,
  formatDateTimeFromDateTimeString,
  type FormatNumberOptions,
  type FormatDateTimeOptions,
} from './formatters.js';

// G-002 신규
export { StatusBadgeCell, type StatusBadgeCellProps } from './StatusBadgeCell.js';
export { LinkCell, type LinkCellProps } from './LinkCell.js';
export { ButtonCell, type ButtonCellProps } from './ButtonCell.js';
export { CheckCell, type CheckCellProps } from './CheckCell.js';
export { IconCell, type IconCellProps } from './IconCell.js';
export { TagCell, type TagCellProps } from './TagCell.js';
export { AvatarCell, type AvatarCellProps } from './AvatarCell.js';
export { ProgressCell, type ProgressCellProps } from './ProgressCell.js';
```

**소비자 import**: `@tomis/grid-renderers` (`packages/grid-renderers/package.json:2` `"name": "@tomis/grid-renderers"`).

### 2.10 사용 예시 (최소 2개 — B-02)

**예시 A — 직접 use (ColumnDef cell 함수)**:
```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadgeCell, LinkCell, ButtonCell, ProgressCell } from '@tomis/grid-renderers';

const columns: ColumnDef<Slip>[] = [
  { id: 'status', accessorKey: 'status',
    cell: ({ getValue }) => <StatusBadgeCell value={getValue() as string} /> },
  { id: 'name', accessorKey: 'name',
    cell: ({ getValue, row }) =>
      <LinkCell label={getValue() as string} onClick={() => openDetail(row.original.id)} /> },
  { id: 'progress', accessorKey: 'progressPercent',
    cell: ({ getValue }) => <ProgressCell value={getValue() as number} /> },
  { id: 'action', header: '액션',
    cell: ({ row }) =>
      <ButtonCell label="삭제" variant="destructive"
        onClick={() => deleteRow(row.original.id)} /> },
];
```

**예시 B — createColumns type 분기 use (MOD-GRID-04 dependsOn — G-003 registry 통합 후 가능)**:
```ts
// MOD-GRID-04 createColumns 가 본 G-002 컴포넌트를 직접 import 하여 매핑
import {
  TextCell, NumberCell, DateCell,
  StatusBadgeCell, LinkCell, ButtonCell, CheckCell, IconCell,
  TagCell, AvatarCell, ProgressCell,
} from '@tomis/grid-renderers';
const rendererMap = {
  text: TextCell,
  number: NumberCell,
  dateTime: DateCell,
  badge: StatusBadgeCell,
  link: LinkCell,
  icon: IconCell,
  checkbox: CheckCell,
} as const;
// createColumns([{ id, type: 'badge', ... }]) 호출 시 rendererMap['badge'] 자동 적용
```

### 2.11 ref API (B-05 — N/A)

본 8 셀 컴포넌트는 선언적 display 컴포넌트 — `ref` / `useImperativeHandle` 필요 없음. B-05 = N/A (rubric 명시 면제).

---

## Section 3: 기존 사용처 대응표 (Migration Table — D-02)

| 기존 (L0 — TOMIS tw-framework-front) | 신규 API (monorepo `@tomis/grid-renderers`) | 마이그레이션 액션 |
|--------------------------------------|---------------------------------------------|------------------|
| `renderers/ButtonCell.tsx` (29라인) | `ButtonCell` | body 를 re-export shim 1줄 + 빈 줄 (D2 variant 매핑 변경 — Section 11.4 R1 사용처 검색 게이트) |
| `renderers/BadgeCell.tsx` (26라인) | `StatusBadgeCell` (★ 이름 변경, D1) | body 를 `export { StatusBadgeCell as BadgeCell } from '@tomis/grid-renderers';` alias shim. 사용처 import path 변경 0 (C-6) |
| `renderers/CheckCell.tsx` (22라인) | `CheckCell` | body 를 re-export shim. prop drift 0 (D1 보존) |
| `renderers/LinkCell.tsx` (16라인) | `LinkCell` | body 를 re-export shim. `onClick` required → optional 약화는 additive — 기존 사용처 영향 0 |
| `renderers/IconCell.tsx` (29라인) | `IconCell` | body 를 re-export shim. prop drift 0 (D1 보존) |
| `renderers/index.ts` (8 export, G-001 마지막 상태) | (변경 없음 — barrel 그대로) | 본 G-002 는 index.ts 미수정 — shim 파일들만 body 교체 |

**TagCell/AvatarCell/ProgressCell 3종 — 대응 행 없음 (D4 신규)**.

---

## Section 4: 호환성 정책 (Compatibility — D-03/D-04)

### 4.1 Breaking change

**No breaking — additive** (compatibilityPolicy.breaking = false — goals.json L110).

증거:
- D1: 5 흡수 컴포넌트 prop 시그니처 보존 (BadgeCell→StatusBadgeCell 이름 변경은 shim 의 `as BadgeCell` alias 로 사용처 영향 0)
- D2: ButtonCell variant 매핑 `primary→default, danger→destructive` 변경 — **잠재 breaking** (사용처가 `variant='primary'` 사용 중이면 build error). Section 11.4 R1 사용처 grep 게이트로 사전 차단
- D4: TagCell/AvatarCell/ProgressCell 신규 export — additive
- 사용처 (5 파일) 의 import 경로 = 동일 (re-export shim)

### 4.2 Deprecation 전략 (C-23 의무 — 1 minor alias 유지)

- tw-framework-front `renderers/ButtonCell.tsx` 등 5 파일 body = `export { Component } from '@tomis/grid-renderers';` (1 minor 동안 유지)
- BadgeCell.tsx 만 특수: `export { StatusBadgeCell as BadgeCell } from '@tomis/grid-renderers';` (alias rename)
- MOD-GRID-17 (사용처 마이그레이션) 시점에 사용처가 `from '@tomis/grid-renderers'` 직접 import 로 점진 전환. BadgeCell 사용처는 `StatusBadgeCell` 로 이름 변경 (별도 codemod 필요)
- alias 제거 시점 = 다음 minor (`0.1.x` → `0.2.0`) — Changesets entry 의무 (C-23)

### 4.3 Migration path

```
[현재]
import { ButtonCell, BadgeCell } from '../../../components/tomis/Grid/renderers';
↓ (본 G-002 후 — alias 동작, 사용처 코드 변경 0)
import { ButtonCell, BadgeCell } from '../../../components/tomis/Grid/renderers';  // 그대로
↓ (MOD-GRID-17 점진 마이그레이션)
import { ButtonCell, StatusBadgeCell } from '@tomis/grid-renderers';  // 직접 import + 이름 변경
```

### 4.4 peerDependencies 정책 (C-22)

- `react`, `react-dom`: peer (`packages/grid-renderers/package.json:24-25` `"^18.0.0 || ^19.0.0"`). 기존재 — 본 G-002 변경 0건.
- `@tanstack/react-table`: peer (`package.json:26` `">=8.0.0 <9.0.0"`). 기존재.
- **lucide-react / react-icons**: 신규 peer 추가 **0** (D3) — IconCell 은 `icon: ReactNode` prop 으로 사용처가 컴포넌트 instance 주입.
- C-9/C-20 ADR 추가 필요 0건 — 신규 dependency 0.

---

## Section 5: 인수 기준 (Acceptance Criteria — C-01~C-05)

| ID | Criteria | Source (출처 태그) | migrationImpact 태그 | 검증 방법 |
|----|----------|-------------------|---------------------|----------|
| **AC-001** | StatusBadgeCell — Section 2.1 interface. L0 BadgeCell.tsx (L1-25) 의 colorMap optional + DEFAULT_COLORS 7-state 기본 매핑 보존 (D1). 컴포넌트 명만 StatusBadgeCell 로 변경 — tw-framework-front shim 이 `BadgeCell` alias 유지 | L0 (Section 1.1 L0.b 인용) | high | tsc 통과 + Storybook story (active/pending/approved/rejected variant) + finding 시각 동등성 분석 |
| **AC-002** | LinkCell — Section 2.2 interface. `href?: string \| onClick?: () => void`, 둘 다 미지정 시 `<span>` 텍스트만 렌더. L0 LinkCell.tsx (L1-15) 의 button 분기 보존 + `<a href>` 분기 신규 additive (D1) | L0 (Section 1.1 L0.d 인용) | high | Storybook story (href / onClick / 둘 다 없음 variant) + tsc 통과 |
| **AC-003** | ButtonCell — Section 2.3 interface. variant `'default' \| 'destructive' \| 'ghost'` (D2 매핑 변경, L0 `primary→default, danger→destructive`). `disabled` prop + e.stopPropagation 패턴 보존 (L0 ButtonCell.tsx L1-29) | L0 (Section 1.1 L0.a 인용) + D2 | high | tsc 통과 + Storybook 3 variant story + Section 11.4 R1 사용처 grep 게이트 |
| **AC-004** | TagCell (신규 D4) — Section 2.6 interface. `value: readonly string[]` → 각 item chip 렌더 (Tailwind `rounded-full px-2 py-0.5 text-xs`). 빈 배열 → dash placeholder (EC-08) | F-05-02 (canonical-modules.json MOD-GRID-05 L220) + AC-004 | high | Storybook story (3 tags / 빈 배열 / colorMap variant) + tsc 통과 |
| **AC-005** | AvatarCell (신규 D4) — Section 2.7 interface. `name + src?` → 이니셜 fallback 원형 (Tailwind `rounded-full`). src 로드 실패 시 onError handler 로 이니셜 표시 (EC-09 src 깨짐) | F-05-02 + AC-005 | high | Storybook story (이미지 있음 / 없음 / 깨진 src variant) + tsc 통과 |
| **AC-006** | ProgressCell (신규 D4) — Section 2.8 interface. `value: number (0~100)` → Tailwind `h-2 bg-gray-200` track + `bg-blue-600` bar + percent label. NaN/null/undefined → 0% (EC-10), 범위 초과 → [0,100] 클램프 (EC-11) | F-05-02 + AC-006 | high | Storybook story (0/50/100/null/120 variant) + tsc 통과 |
| **AC-007** | CheckCell — Section 2.4 interface. L0 CheckCell.tsx (L1-21) 의 native `<input type="checkbox">` markup 보존 — icon SVG 으로 대체 X (D9). IconCell — Section 2.5 interface. L0 IconCell.tsx (L1-29) 의 `icon: ReactNode` prop 보존 — lucide-react peer 추가 X (D3) | L0 (Section 1.1 L0.c + L0.e 인용) | high | tsc 통과 + Storybook story + Section 8.2 외관 검증 |
| **AC-008** | Storybook story — 각 renderer (StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell + TagCell + AvatarCell + ProgressCell = 8 컴포넌트) 1개 이상 (C-25). 모든 variant 포함 — 흡수 5종은 시각 회귀 baseline, 신규 3종은 외관 정의 | C-25 (Section 13 문서 의무) | high | Storybook build 통과 — 자동화 인프라 미구비 시 placeholder stories (G-001 패턴 일관 — D8) |
| **AC-009** | C-17 시각 회귀 — 흡수 5종 (StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell) 의 외관 동등 검증. Method B 변형 (구조적 동등성 + JSX 토큰 매핑) 적용 (D8 — G-001 finding 패턴 일관). 신규 3종 (Tag/Avatar/Progress) 은 baseline 없음 → 시각 회귀 N/A | C-17 + G-001 finding precedent (D8) | high (분리 게이트) | `findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` 작성 — JSX 토큰 + className 동등성 분석 |

**호환성 검증 AC** (C-05 의무): AC-001~AC-003 + AC-007 의 "prop 전량 보존" 항목이 영향 사용처 5개 외관 보존 의무를 포함. AC-009 가 외관 회귀 검증의 정식 entry.

**모든 AC 출처 태그 의무 (H-03)**:
- AC-001 → L0 (Section 1.1 L0.b BadgeCell.tsx 인용)
- AC-002 → L0 (Section 1.1 L0.d LinkCell.tsx 인용)
- AC-003 → L0 (Section 1.1 L0.a ButtonCell.tsx 인용) + D2
- AC-004 → F-05-02 (canonical-modules.json MOD-GRID-05 L220 "Tag, Avatar, Progress 3개 신규")
- AC-005 → F-05-02 (canonical-modules.json L220)
- AC-006 → F-05-02 (canonical-modules.json L220)
- AC-007 → L0 (Section 1.1 L0.c CheckCell.tsx + L0.e IconCell.tsx 인용)
- AC-008 → C-25 (Section 13 문서 의무)
- AC-009 → C-17 + G-001 finding (Section 12.2)

모든 출처 태그가 spec 본문 다른 섹션에서 직접 인용됨 — H-03 cross-consistency 충족.

---

## Section 6: 엣지 케이스 (Edge Cases — E-04 최소 3개, 본 spec 12개)

| EC | 시나리오 | 처리 | 출처 |
|----|---------|------|------|
| **EC-01** | `StatusBadgeCell value=''` 또는 colorMap 미매칭 키 | `defaultColor` 적용 (L0 BadgeCell.tsx L19 `map[value] ?? defaultColor`) | L0 BadgeCell.tsx:19 |
| **EC-02** | `StatusBadgeCell value` 가 colorMap 사용자 정의 + DEFAULT_COLORS 둘 다 없음 | `defaultColor` (default `'bg-gray-100 text-gray-600'`) 적용 | L0 BadgeCell.tsx:17 |
| **EC-03** | `LinkCell` href 와 onClick 둘 다 미지정 | `<span>` 텍스트만 렌더 (AC-002 명시) | AC-002 |
| **EC-04** | `LinkCell` href + onClick 둘 다 지정 | `<a href={...} onClick={...}>` — onClick 가 default navigation 제어 가능 | Section 2.2 정의 |
| **EC-05** | `ButtonCell variant='primary'` (D2 변경 전 값) | tsc TS2322 (literal union 위반) build error — Section 11.4 R1 사전 게이트 | D2, AC-003 |
| **EC-06** | `ButtonCell disabled=true` | L0 의 `disabled:opacity-40 disabled:cursor-not-allowed` Tailwind class 보존 | L0 ButtonCell.tsx:22 |
| **EC-07** | `CheckCell readOnly=true` | L0 의 `onChange={undefined}` + `cursor-default` 보존 (편집 차단) | L0 CheckCell.tsx:14 |
| **EC-08** | `TagCell value=[]` (빈 배열) | dash placeholder `<span className="text-gray-400">-</span>` 렌더 — G-001 TextCell EC-01 패턴 일관 | D4 신설 + G-001 TextCell precedent |
| **EC-09** | `AvatarCell src` 깨짐 (load error) | `<img onError={...}>` handler 로 display 숨김 + 이니셜 fallback 표시 | D4 신설 |
| **EC-10** | `ProgressCell value=null \| undefined \| NaN` | `clampPercent` 헬퍼 → 0 으로 클램프 — bar width 0%, label '0%' | D4 신설 |
| **EC-11** | `ProgressCell value=-10 \| 120` | [0,100] 클램프 → -10→0, 120→100 | D4 신설 |
| **EC-12** | `IconCell icon=null` (사용처가 빈 ReactNode 전달) | L0 markup 그대로 `<span>{icon}</span>` — React 가 null 무시 → 빈 컨테이너 (의도된 빈 표시) | L0 IconCell.tsx:13 |

12개 ≥ 3 (E-04 충족).

**환경 의존 AC ↔ EC 매핑** (specify-rubric E-04 권장):
| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-005 (AvatarCell src 로드) | EC-09 (src 깨짐) | 외부 이미지 URL 가용성 의존 — onError fallback 으로 documented-deviation 처리 |
| AC-008 (Storybook story) | (G-001 R3 동일) | monorepo Storybook 인프라 미구비 시 placeholder stories (D8 — ADR-MOD-GRID-00-003) |

---

## Section 7: 구현 대상 파일 (NEW/MODIFY 표 — E-01)

★ C-28 (path prefix) 정합성 — goals.json `implementFiles[]` 의 `topvel-grid-monorepo/packages/grid-renderers/` prefix 가 모노레포 실제 위치와 일치 확인됨 (`D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/` Glob 결과 — G-001 산출물 동일 디렉토리). spec 정정 결정 불필요.

| # | 경로 | 유형 | 변경 범위 | 출처 |
|---|------|------|----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/StatusBadgeCell.tsx` | NEW | Section 2.1 interface + 함수 컴포넌트 (~25 라인 예상) — L0 BadgeCell.tsx 흡수 + 이름 변경 | D1, D6 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/LinkCell.tsx` | NEW | Section 2.2 interface + 함수 컴포넌트 (~30 라인) — href/onClick/span 3 분기 | D1, D6 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/ButtonCell.tsx` | NEW | Section 2.3 interface + 함수 컴포넌트 (~30 라인) — variant 매핑 D2 | D1, D2, D6 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/CheckCell.tsx` | NEW | Section 2.4 interface + 함수 컴포넌트 (~25 라인) — L0 markup 보존 | D1, D6 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/IconCell.tsx` | NEW | Section 2.5 interface + 함수 컴포넌트 (~30 라인) — onClick 분기 보존 | D1, D3, D6 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/TagCell.tsx` | NEW | Section 2.6 interface + 함수 컴포넌트 (~30 라인) — readonly string[] + chip 매핑 | D4, EC-08 |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/AvatarCell.tsx` | NEW | Section 2.7 interface + 함수 컴포넌트 (~35 라인) — getInitials 내부 helper + onError fallback | D4, EC-09 |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/ProgressCell.tsx` | NEW | Section 2.8 interface + 함수 컴포넌트 (~30 라인) — clampPercent 내부 helper + dynamic width | D4, EC-10/EC-11 |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/index.ts` | MODIFY | G-001 5 export + 4 type 보존 + Section 2.9 의 8 신규 export + 16 type 추가 (11 line → 19 line 예상) | D6 (★ MODIFY — G-001 산출 보존) |
| 10 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx` | MODIFY | body 전체 (29 라인) → re-export shim 1줄 + 빈 줄. C-23 1 minor alias | Section 4.2 |
| 11 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx` | MODIFY | body 전체 (26 라인) → `export { StatusBadgeCell as BadgeCell } from '@tomis/grid-renderers';` (★ alias rename) | D1 + Section 4.2 |
| 12 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/CheckCell.tsx` | MODIFY | body 전체 (22 라인) → re-export shim 1줄 | Section 4.2 |
| 13 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` | MODIFY | body 전체 (16 라인) → re-export shim 1줄 | Section 4.2 |
| 14 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/IconCell.tsx` | MODIFY | body 전체 (29 라인) → re-export shim 1줄 | Section 4.2 |

**합계: NEW 8 + MODIFY 6 = 14 파일** (D6 breakdown 정확 일치).

**Section 7 ↔ Section 11 cross-check (E-01 v1.0.3)**: Section 11.3 의 모든 Step 에 위 14 파일이 빠짐없이 등장 — Section 11 진입 시 확인. 본 spec 본문 "재결정" 또는 "대체" 표현 0건 → E-06 위반 잠재성 0.

**부가 자료 (Section 12.2 finding + Storybook stories)**:
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` (NEW — D8, AC-009)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/__stories__/{StatusBadgeCell,LinkCell,ButtonCell,CheckCell,IconCell,TagCell,AvatarCell,ProgressCell}.stories.tsx` (NEW — AC-008, placeholder)

이 부가 자료는 Section 7 표 14 파일과 분리 — implement-report 의 부속 산출물 (G-001 패턴 일관). implementFiles 외 finding+stories 는 verify 단계 보조 증거.

---

## Section 8: 마이그레이션 영향도 Pre-flight (D-01/D-05/D-06)

### 8.1 영향 사용처 카운트 (D-01)

**5 / 23 total** (전체 tw-framework-front 영향 23 페이지 + DataTable 사용처 vs 본 G-002 직접 영향 5 파일).

본 G-002 의 affectedUsageFiles (goals.json L125-130 그대로):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx` (MODIFY — Section 7 #10)
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx` (MODIFY — Section 7 #11)
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/CheckCell.tsx` (MODIFY — Section 7 #12)
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` (MODIFY — Section 7 #13)
5. `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/IconCell.tsx` (MODIFY — Section 7 #14)

5개 ≤ C-19 한도 5 — 점진 마이그레이션 1 Goal 한 번에 가능 (한도 상한).

**MOD-GRID-17 부수 영향** (본 Goal 직접 범위 외): 이 5 renderer 를 import 하는 페이지 파일은 import 경로가 동일 (re-export shim) → 사용처 변경 0건. MOD-GRID-17 점진 마이그레이션 시 import path 만 변경. BadgeCell → StatusBadgeCell 이름 변경은 별도 codemod 필요 (MOD-GRID-17 sub-goal).

**D9 검증 게이트 — ButtonCell variant 사용처 grep**: IMPLEMENT 단계 진입 직전 `Grep "ButtonCell" tw-framework-front/src --include=*.tsx` 으로 변경. 현재 spec writer 검증 결과:
- L0 ButtonCell.tsx 1 파일이 export. import 사용처는 `Grep "import.*ButtonCell" tw-framework-front/src` (Implementer 단계에서 실행).
- 본 spec writer 의 selectivity 추정 — 5 renderer barrel export 의 ButtonCell 은 페이지 그리드 액션 컬럼에서 다수 사용 가능. D2 매핑 변경의 잠재 build error 위험 존재 → Section 11.4 R1 처리.

### 8.2 무파괴 검증 방법 (C-17 — high impact 의무, D8)

- **tsc** (`pnpm typecheck` — monorepo + `tw-framework-front` 양쪽 0 errors)
- **Storybook stories** (AC-008) — 각 컴포넌트 + 모든 variant placeholder stories (D8 — G-001 R3 패턴 일관)
- **Visual regression Method B 변형 (D8)** — `findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` 작성. 흡수 5종 각각의 JSX 토큰 + className 동등성 분석 + 의도된 deviation enumerate (D2 ButtonCell variant 매핑 변경은 의도된 API 개선 — 시각 외관은 동등)

**외부 디렉토리 N/A — H-02 예외 (조부모 실재 입증)**: monorepo 외부 디렉토리 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/` 는 G-001 시점에 이미 생성됨 (Glob 결과: src/*.tsx 5 파일 + index.ts + 3 stories + dist/ 모두 존재 입증). 본 Goal 은 src/ 파일 8개 추가 + index.ts 1개 수정만 — 부모 디렉토리 신규 생성 아님. H-02 외부 디렉토리 예외 절차 (조부모 실재 입증) 불필요.

### 8.3 점진 마이그레이션 vs 일괄 (C-19)

본 Goal 영향 사용처 5개 = 5 (C-19 한도 상한). 1 Goal 한 번에 처리. 분할 불필요 — 동일 카테고리 (UI 흡수) 묶음으로 일관 가능.

### 8.4 롤백 전략 (D-05)

- **신규 파일** (Section 7 #1~#8) 8개: `Remove-Item` 으로 단순 삭제 → monorepo 무손상.
- **MODIFY 파일** (Section 7 #9) `index.ts`: git revert (또는 G-001 마지막 상태로 부분 revert — diff 명확).
- **MODIFY 파일** (Section 7 #10~#14) 5개 tw-framework-front: git revert 1 커밋. 신규 import (`@tomis/grid-renderers`) 가 미적용 상태 → 사용처 코드 변경 0건, 따라서 사용처 회귀 위험 0 (단 D2 ButtonCell variant 사용처가 새 prop 으로 이미 마이그레이션됐다면 revert 후 사용처 build error 가능 — Section 11.4 R1 게이트 사전 차단).

### 8.5 번들 크기 영향 (D-06 + ADR-MOD-GRID-00-010 의무 1줄)

★ **bundle estimation NOT extrapolated from prior Goals (different size profile may apply — UI heavy renderer profile, G-001 leaf renderer profile 보다 무거움 — variant 매핑 사전 + colorMap 사전 + helper 가 합쳐짐) — measurement at IMPLEMENT time only per ADR-MOD-GRID-00-010.**

- spec 예상 (참조용만): **+5 KB** (8 컴포넌트 누적, goals.json bundleImpact)
- 한도: `@tomis/grid-renderers` brotli ≤ **10 KB** (`.size-limit.json:13`)
- G-001 산출 추정 (참고): `dist/index.mjs.map` + `dist/index.d.ts` 4.29 KB (finding 명시) → 본 G-002 추가 후 누적 한도 도달 가능
- 게이트: IMPLEMENT 직후 `pnpm size-limit` exit 0 (AC-008). spec 예상값은 metric 참조용 — 게이트 아님

**한도 초과 시 대응 옵션** (G-003 spec 단계에서 결정 — 본 Goal 범위 외 옵션 명시):
1. sub-entry 분할 (예: `@tomis/grid-renderers/basic` (Text/Number/Date) vs `@tomis/grid-renderers/ui` (Button/Badge/...) — tree-shaking 으로 사용처 별 부분 import)
2. `.size-limit.json` 한도 상향 (사용자 승인 필요 — C-21 +100 KB 초과 시)
3. ButtonCell/StatusBadgeCell 내부 VARIANT_CLASS / DEFAULT_COLORS 사전을 외부 utility 로 추출 후 tree-shaking (minor)

본 G-002 측정 결과는 G-003 spec 의 baseline.

---

## Section 9: 의존성 (peerDeps / deps / devDeps — C-22)

### 9.1 peerDependencies (변경 0건 — 기존재)

`packages/grid-renderers/package.json:23-27` 기존재 — 본 G-002 변경 없음:
```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "@tanstack/react-table": ">=8.0.0 <9.0.0"
}
```

ADR-MOD-GRID-00-008 매트릭스 부합 (3종 peer + range 일치 — G-001 동일).

**D3 명시 — lucide-react / react-icons / @heroicons 등 신규 peer 추가 0건**:
- IconCell 은 `icon: ReactNode` prop (Section 2.5) — 사용처가 자신의 아이콘 컴포넌트 instance 주입
- AvatarCell 은 `src?: string` URL prop + native `<img>` markup — 외부 SVG 라이브러리 0
- 따라서 C-9/C-20 ADR 신설 불필요. ADR-MOD-GRID-05-XXX 작성 면제.

### 9.2 dependencies (없음 — 0건)

본 G-002 의 8 cell 은 React 표준 + Tailwind className 만 사용. 외부 런타임 패키지 0건 → `dependencies: {}` 유지 (또는 미존재).

C-9/C-20 ADR 게이트: 본 Goal 신규 dependency 추가 0건 → 외부 라이브러리 ADR 의무 면제.

### 9.3 devDependencies (변경 0건)

monorepo 루트 devDependencies (`topvel-grid-monorepo/package.json:20-35`) 에 이미 typescript / tsup / @types/react / @types/react-dom / @tanstack/react-table 기존재. 본 Goal 신규 추가 없음.

### 9.4 C-22 정책 부합 검증

- react/react-dom/@tanstack/react-table = peer (위 9.1 그대로) — dep 중복 선언 없음.
- 본 Goal 은 grid-renderers 패키지 — `@tanstack/react-virtual` peer 선언 대상 아님 (grid-core 만). `xlsx`/`jspdf` peer 대상 아님 (grid-export 만). lucide-react peer 대상 아님 (D3 — 본 Goal 에서 import 0건).

---

## Section 10: 사용자 여정 매핑 (User Journey)

### 10.1 개발자 관점 (페이지 작성자)

1. **import**: `import { StatusBadgeCell, LinkCell, ButtonCell, TagCell, AvatarCell, ProgressCell } from '@tomis/grid-renderers';` (Section 2.10 예시 A)
2. **ColumnDef cell 함수에 사용**:
   - `cell: ({ getValue }) => <StatusBadgeCell value={getValue() as string} />`
   - `cell: ({ getValue, row }) => <LinkCell label={getValue() as string} onClick={() => openDetail(row.original.id)} />`
   - `cell: ({ row }) => <ButtonCell label="삭제" variant="destructive" onClick={() => del(row.original.id)} />`
3. **MOD-GRID-04 createColumns 의존 (G-003+ registry 통합 후)**: `createColumns([{ id, type: 'badge', ...meta }])` → registry 가 StatusBadgeCell 자동 매핑
4. **마이그레이션 중 (alias 경유)**: 기존 import path 그대로 사용 가능 — 코드 변경 0. BadgeCell 명칭은 shim alias 유지
5. **점진 전환 (MOD-GRID-17)**: 페이지별 import path 만 `@tomis/grid-renderers` 로 교체. BadgeCell → StatusBadgeCell 별도 codemod

### 10.2 최종 사용자 관점 (그리드 사용 화면)

1. 상태 column → 색상 뱃지로 시각 분류 (예: '승인' → 파란 뱃지, '반려' → 빨간 뱃지)
2. 사용자 column → 아바타 + 이름 (이미지 없으면 이니셜 회색 원형)
3. 진행률 column → 막대 그래프 + 퍼센트 텍스트 (0~100 클램프)
4. 태그 column → 작은 chip 여러 개 (예: ['긴급', '신규', '재무'])
5. 액션 column → 버튼 (variant: default 파란 / destructive 빨간 / ghost 흰)
6. 링크 column → 파란 밑줄 텍스트 — 클릭 시 row navigate 또는 detail open
7. 외관 회귀 0 — 기존 BadgeCell/LinkCell/ButtonCell/CheckCell/IconCell 의 markup 과 동등 (D1 prop 보존 + Section 12 finding 입증). D2 ButtonCell variant 매핑은 사용처가 새 값 ('default') 사용 시 외관 동등 (Tailwind class 동일)

---

## Section 11: 구현 계획 (Implementation Plan — E-01/E-02/E-03)

### 11.1 파일별 변경 명세 (Section 7 표 동일 — cross-consistency)

(Section 7 의 14 행 표 그대로 — 본 섹션은 변경 명세의 단계별 수행 순서 정의)

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개, 본 spec 3개 제공)

**Before/After A — BadgeCell L0 vs 새 StatusBadgeCell**:

```tsx
// BEFORE — D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx (L0 — 26 라인 전체)
interface BadgeCellProps {
  value: string;
  colorMap?: Record<string, string>;
  defaultColor?: string;
}
const DEFAULT_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', /* ... 7 keys */
};
export function BadgeCell({ value, colorMap, defaultColor = 'bg-gray-100 text-gray-600' }: BadgeCellProps) {
  const map = colorMap ?? DEFAULT_COLORS;
  const colorClass = map[value] ?? defaultColor;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {value}
    </span>
  );
}
```

```tsx
// AFTER — D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/StatusBadgeCell.tsx (NEW)
import type { JSX } from 'react';

export interface StatusBadgeCellProps {
  value: string;
  colorMap?: Record<string, string>;
  defaultColor?: string;
  className?: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-500',
};

/** Status badge cell — value 를 colorMap 으로 lookup 한 Tailwind 색상 chip 으로 렌더. */
export function StatusBadgeCell({
  value,
  colorMap,
  defaultColor = 'bg-gray-100 text-gray-600',
  className,
}: StatusBadgeCellProps): JSX.Element {
  const map = colorMap ?? DEFAULT_COLORS;
  const colorClass = map[value] ?? defaultColor;
  const composed = ['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colorClass, className ?? '']
    .filter(Boolean)
    .join(' ');
  return <span className={composed}>{value}</span>;
}
```

**Before/After B — tw-framework-front re-export shim with alias rename** (Section 7 #11):

```tsx
// BEFORE — tw-framework-front/.../renderers/BadgeCell.tsx (L0 — 26 라인 전체 위 동일)
```

```tsx
// AFTER — tw-framework-front/.../renderers/BadgeCell.tsx (shim — 3 라인)
// Re-export shim — Compatible alias (C-23 1 minor). MOD-GRID-05/G-002 흡수 + 이름 변경 (BadgeCell → StatusBadgeCell).
export { StatusBadgeCell as BadgeCell } from '@tomis/grid-renderers';
export type { StatusBadgeCellProps as BadgeCellProps } from '@tomis/grid-renderers';
```

**Before/After C — ButtonCell variant D2 매핑 (잠재 breaking 검증 대상)**:

```tsx
// BEFORE — L0 ButtonCell.tsx L11-15 (variant key: primary/danger/ghost)
const VARIANT_CLASS: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300',
};
```

```tsx
// AFTER — monorepo ButtonCell.tsx (variant key: default/destructive/ghost — D2)
const VARIANT_CLASS: Record<NonNullable<ButtonCellProps['variant']>, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white',       // L0 'primary' → 'default'
  destructive: 'bg-red-600 hover:bg-red-700 text-white',     // L0 'danger' → 'destructive'
  ghost: 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300',  // 동일
};
```

### 11.3 구현 순서 (E-03 — 최소 2단계, 본 spec 5단계)

**Step 1 — 흡수 5종 컴포넌트 NEW (monorepo)**
- 대상: Section 7 #1~#5 (`StatusBadgeCell.tsx`, `LinkCell.tsx`, `ButtonCell.tsx`, `CheckCell.tsx`, `IconCell.tsx`)
- 작업: Section 2.1~2.5 interface + 함수 컴포넌트 (Section 11.2 AFTER 패턴). G-001 패턴 일관 (`import type { JSX } from 'react'`, `: JSX.Element` 반환, className composition `.filter(Boolean).join(' ')`).
- 검증: `tsc --noEmit` (typecheck 만)

**Step 2 — 신규 3종 컴포넌트 NEW (monorepo)**
- 대상: Section 7 #6~#8 (`TagCell.tsx`, `AvatarCell.tsx`, `ProgressCell.tsx`)
- 작업: Section 2.6~2.8 interface + 함수 컴포넌트. AvatarCell `getInitials` 내부 helper, ProgressCell `clampPercent` 내부 helper. EC-08/EC-09/EC-10/EC-11 가드.
- 검증: `tsc --noEmit` + tsup 빌드 시뮬레이션 통과

**Step 3 — index.ts 확장 (MODIFY — G-001 산출 보존)**
- 대상: Section 7 #9 (`index.ts`)
- 작업: G-001 의 5 export + 4 type re-export 보존 + Section 2.9 의 8 신규 export + 16 type 추가
- 검증: `tsup build` 통과 + `dist/index.{cjs,mjs,d.ts}` 산출 확인 + `pnpm size-limit` 측정 (AC 게이트 — D5 measure-then-decide)

**Step 4 — D9 사용처 grep 게이트 (사전 검증)**
- 대상: tw-framework-front/src 전체
- 작업: `Grep "ButtonCell" --include=*.tsx --include=*.ts` 으로 사용처 검색. `variant=` prop 값이 `'primary'` 또는 `'danger'` 로 hardcode 된 사용처 enumerate
- 처리: 
  - 사용처 0건: 단순 흡수 — Step 5 진행
  - 사용처 > 0건 & `variant='primary'/'danger'` hardcode: 단순 sed-style replace (`variant="primary"` → `variant="default"`, `variant="danger"` → `variant="destructive"`) 또는 documented-deviation 작성 (R1)
- 검증: tw-framework-front `tsc --noEmit` 통과 후 Step 5 진행

**Step 5 — tw-framework-front re-export shim (MODIFY)**
- 대상: Section 7 #10~#14 (`renderers/{ButtonCell,BadgeCell,CheckCell,LinkCell,IconCell}.tsx`)
- 작업:
  - `ButtonCell.tsx` body (29 라인) → re-export shim 1줄 + type re-export
  - `BadgeCell.tsx` body (26 라인) → `export { StatusBadgeCell as BadgeCell } from '@tomis/grid-renderers';` (alias rename — Section 11.2 AFTER B)
  - `CheckCell.tsx` body (22 라인) → re-export shim 1줄
  - `LinkCell.tsx` body (16 라인) → re-export shim 1줄
  - `IconCell.tsx` body (29 라인) → re-export shim 1줄
- 검증: tw-framework-front `tsc --noEmit` 통과 + Storybook (있으면) 시각 비교

**Step 6 (필요 시) — Storybook stories + finding** (AC-008 + AC-009 — D8)
- 대상: monorepo `packages/grid-renderers/src/__stories__/` (G-001 패턴 일관)
- 작업: 8 컴포넌트 각 1+ placeholder stories (CSF3 컨벤션, 타입 import 0 — tsc strict 통과 보장). Section 12.2 finding 작성
- 검증: Storybook build 통과 — 자동화 인프라 미구비 시 placeholder stories + finding 으로 documented-deviation (ADR-MOD-GRID-00-003)

### 11.4 위험 요소 (Risks)

- **R1 — D2 ButtonCell variant 매핑 변경**: L0 의 `'primary' | 'danger' | 'ghost'` → 새 `'default' | 'destructive' | 'ghost'`. tw-framework-front 사용처가 `variant='primary'` 또는 `'danger'` hardcode 사용 중이면 build error. **처리**: Step 4 (사전 grep 게이트) — 사용처 enumerate 후 자동 codemod 또는 documented-deviation. 자동 codemod 옵션: `Grep -l "variant=\"primary\"" tw-framework-front/src` 후 sed replace `'primary'→'default'`, `'danger'→'destructive'`. spec 시나리오: codemod 적용 후 사용처 외관 동등.

- **R2 — LinkCell `onClick` required → optional 약화**: L0 LinkCell.tsx L3 `onClick: () => void` (required). 본 spec Section 2.2 는 optional 로 약화. shim 이 monorepo type 으로 re-export 시 type 시그니처 약화 — 기존 사용처가 `onClick` 전달 중이면 영향 0 (additive). 단 tw-framework-front 에서 `LinkCellProps['onClick']` 을 다른 함수 시그니처에 사용 중이면 영향 가능. **처리**: Step 5 진입 전 `Grep "LinkCellProps" tw-framework-front/src` 으로 type 사용처 검증. 0건이면 R2 trivial.

- **R3 — Storybook 인프라 부재**: monorepo 에 Storybook 미구성 (G-001 R3 동일). AC-008 deviation. **처리**: G-001 finding 패턴 일관 (D8) — placeholder stories + finding 작성. ADR-MOD-GRID-00-003 documented-deviation 절차 적용.

- **R4 — 사용처 import path drift**: 본 G-002 의 alias 가 정상 동작하려면 tw-framework-front 의 `tsconfig.app.json` paths + `vite.config.ts` alias 가 `@tomis/grid-renderers` 매핑되어야 함. G-001 implementation 시점에 이 alias 이미 설정됨 (`finding` Section 1.2 #9 명시 — implement-report). 본 G-002 는 alias 사용만, 추가 설정 0. **처리**: Step 5 진입 전 `Grep "@tomis/grid-renderers" tw-framework-front/tsconfig.app.json` 으로 alias 매핑 재확인.

- **R5 — 번들 크기 한도 초과 (D5)**: 8 컴포넌트 + 사전 + helper 누적이 10 KB 초과 위험. G-001 시점 4.29 KB 추정 + 본 G-002 약 +5~7 KB → 누적 9~11 KB. **처리**: Step 3 직후 `pnpm size-limit` 실측. 한도 초과 시 D5 의 옵션 1~3 적용 (sub-entry 분할 vs 한도 상향 vs 사전 추출).

- **R6 — D9 사용처 grep 시 hardcode 사용 다수 발견**: ButtonCell variant 가 페이지 다수에 hardcode 되어 codemod 필요량 ≥ C-19 한도 (5+) 면 본 Goal 범위 초과. **처리**: 그 경우 Goal 분할 — 본 G-002 는 monorepo NEW 만 완료, tw-framework-front shim 5 파일 MODIFY 는 sub-Goal (G-002b) 로 분리. 본 spec 작성 시점에서는 Step 4 결과 따라 결정.

---

## Section 12: 검증 계획 (Verification — E-05)

### 12.1 단위 테스트 시나리오 (10건)

| 대상 | 시나리오 | 기대 |
|------|---------|------|
| `StatusBadgeCell` | value='approved' 기본 colorMap | className 에 `bg-blue-100 text-blue-700` 포함 |
| `StatusBadgeCell` | value='unknown' colorMap 미매칭 | className 에 defaultColor `bg-gray-100 text-gray-600` 포함 (EC-01/EC-02) |
| `LinkCell` | href='/a', onClick=undefined | `<a href="/a">` markup |
| `LinkCell` | href=undefined, onClick=fn | `<button>` markup (L0 보존) |
| `LinkCell` | href=undefined, onClick=undefined | `<span>` markup (EC-03) |
| `ButtonCell` | variant='destructive' | className 에 `bg-red-600 hover:bg-red-700 text-white` 포함 (D2) |
| `CheckCell` | checked=true, readOnly=true | `onChange` 호출 0 (EC-07) + cursor-default |
| `TagCell` | value=['긴급', '신규'] | 2개 chip 렌더 + key={tag} |
| `TagCell` | value=[] | dash placeholder (EC-08) |
| `AvatarCell` | name='홍길동', src=undefined | 이니셜 fallback 원형 — text "홍길" |
| `AvatarCell` | name='', src=undefined | '?' fallback (EC-09 변형) |
| `ProgressCell` | value=null | bar width 0%, label '0%' (EC-10) |
| `ProgressCell` | value=120 | bar width 100%, label '100%' (EC-11) |
| `ProgressCell` | value=50 | bar width 50%, label '50%' |
| `IconCell` | icon=<SomeIcon/>, onClick=fn | `<button>` markup + e.stopPropagation 보존 (L0) |

### 12.2 시각 회귀 (C-17 high 의무 — D8)

- **Method A (자동, 우선)**: Storybook + Chromatic 또는 Playwright screenshot — 인프라 구비 시 (MOD-GRID-99-B 별도 Goal 예정)
- **Method B (수동, fallback)**: 영향 사용처 5 파일 (renderers/ButtonCell.tsx 등) 사용 페이지 마이그레이션 전/후 동일 데이터로 스크린샷 캡처 + 외관 비교 메모
- **Method B 변형 (구조적 동등성 증명) — 본 spec 채택**: G-001 finding (`findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md`) 패턴 일관 (D8). 흡수 5종 (StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell) 각각의 JSX 출력 토큰별 매핑 + prop signature 동등성 + 알고리즘 차이 enumerate (특히 D2 ButtonCell variant 매핑 변경의 외관 동등성 — VARIANT_CLASS 의 Tailwind class 동일)

**finding 파일 의무 (AC-009)**:
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md`
- G-001 finding 구조 일관:
  - Section 1: 적용 방법 (Method B 변형 + monorepo Storybook 인프라 부재 명시)
  - Section 2: 영향 사용처 5 파일 — Before/After 비교 (각 컴포넌트 prop signature 동등성 표 + JSX 출력 동등성 표)
  - Section 3: 타입 동등성 (TypeScript) — implement-report 의 buildResult.twFrameworkFrontTsc 인용
  - Section 4: Render output 동등성 분석 표 (5 컴포넌트 × 입력 도메인 → 외관 동등 여부)
  - Section 5: 의도된 deviation enumerate — D2 ButtonCell variant 명 변경 (외관 동등, API 명만 변경) + AvatarCell EC-09 onError fallback (신규)
  - Section 6: C-27 prompt-spec drift 보고 (defensive)
  - Section 7: 결론 — C-17 충족 근거

**신규 3종 (Tag/Avatar/Progress)** 은 시각 회귀 baseline 없음 → finding 의 Section 4 표에서 N/A 표기 (AC-009 명시: 흡수 5종만).

대상 페이지 (대표 1건씩 — 외관 동등 입증용):
- ButtonCell 사용처: 그리드 액션 column (삭제/편집 버튼) 보유 페이지
- BadgeCell 사용처: 상태 column 보유 페이지 (SlipApprovePage 등)
- CheckCell 사용처: 다중 선택 column 보유 페이지

### 12.3 빌드 검증 (C-12)

- `pnpm -r --filter './packages/grid-renderers' typecheck` exit 0 (tsc --noEmit)
- `pnpm -r --filter './packages/grid-renderers' build` exit 0 (tsup, dist/ 산출)
- monorepo 루트 `pnpm size-limit` exit 0 (D5 게이트, ADR-MOD-GRID-00-010 measurement)
- tw-framework-front `pnpm typecheck` exit 0 (alias 매핑 — Section 11.4 R4)
- monorepo `pnpm size-limit` JSON 결과 → finding Section 3 에 인용

### 12.4 마이그레이션 자동 보완 (영향 사용처 처리)

- tw-framework-front `renderers/index.ts` 의 8 export (G-001 후 상태) — 본 G-002 는 5 흡수 컴포넌트의 shim 만 body 교체. index.ts 자체는 미수정 (Section 7 #9 의 monorepo index.ts MODIFY 와 다름)
- 본 G-002 후 사용처 페이지 (예: `SlipListPage.tsx`) 의 import 는 변경 0 (re-export shim 으로 transparent). BadgeCell→StatusBadgeCell 사용처 이름 변경은 MOD-GRID-17 시점 (별도 Goal — codemod)
- D2 ButtonCell variant 매핑 변경의 사용처 hardcode 검색 결과 (Step 4) — 0건이면 R1 trivial, > 0건이면 자동 sed-style replace 또는 documented-deviation

---

## Section 13: 상용 제품화 영향 (Commercialization — F-01~F-04)

### 13.1 패키지 대상 (F-01)

- **packageTarget**: `@tomis/grid-renderers` (`packages/grid-renderers/package.json:2`)
- **licenseTier**: **MIT** (`packages/grid-renderers/package.json:5` `"license": "MIT"` 기존재) — canonical-modules.json MOD-GRID-05 L198 부합
- 본 Goal 의 모든 산출 (5 흡수 cell + 3 신규 cell) 은 MIT 라이선스로 배포

### 13.2 라이선스 검증 (F-02 — N/A, MIT 패키지)

본 Goal 은 MIT 패키지 → `configureGridLicense()` 호출 (Pro 패키지 전용) 불필요. F-02 = N/A.

### 13.3 문서 작성 계획 (F-03 — C-25 의무)

- **Docusaurus 페이지** (`apps/docs/...` — MOD-GRID-99-B 범위, 본 Goal 은 source 제공): API reference 8 컴포넌트 각각의 JSDoc 기반 자동 생성. 사용 예시 Section 2.10 (예시 A + B) 인용

- **Storybook stories** (`packages/grid-renderers/src/__stories__/` — 본 Goal AC-008, D8 placeholder 패턴):
  - `StatusBadgeCell.stories.tsx`: Default (active) + 7-state variant (active/inactive/pending/error/approved/rejected/draft) + custom colorMap variant
  - `LinkCell.stories.tsx`: WithHref / WithOnClick / TextOnly (둘 다 없음) variant
  - `ButtonCell.stories.tsx`: Default / Destructive / Ghost / Disabled variant
  - `CheckCell.stories.tsx`: Checked / Unchecked / ReadOnly variant
  - `IconCell.stories.tsx`: Default (ReactNode placeholder) / WithLabel / WithOnClick variant
  - `TagCell.stories.tsx`: 단일 tag / 여러 tags / 빈 배열 (EC-08) / custom colorMap variant
  - `AvatarCell.stories.tsx`: WithImage / WithoutImage (이니셜) / 한글 이름 / 빈 이름 (EC-09) variant
  - `ProgressCell.stories.tsx`: 0% / 50% / 100% / null (EC-10) / 120% over (EC-11) variant

  총 8 stories 파일 — AC-008 의 "각 renderer Storybook story 1개 이상 (모든 variant 포함)" 충족.

- **README.md** (`packages/grid-renderers/README.md`): G-001 시점 작성 가능성 있음 — 본 Goal 은 추가 export 만 (8 신규). README 업데이트 (export 명단 + 사용 예시 추가) — C-25 의무 일관

### 13.4 peerDependencies 정책 (F-04 — C-22)

본 Section 9 와 동일 — react/react-dom/@tanstack/react-table peer (변경 0건). C-22 정책 부합. lucide-react / react-icons / @heroicons 등 신규 peer 추가 0 (D3) — IconCell 은 ReactNode prop 패턴으로 library-agnostic 유지.

---

## ★ Spec 작성 완료 검증 (self-check before submission)

1. **H-01 (referenceEvidence 경로 실재)**:
   - L0.a~L0.e (5 파일 — ButtonCell.tsx + BadgeCell.tsx + CheckCell.tsx + LinkCell.tsx + IconCell.tsx) Read 통해 라인 인용 직접 확인 ✓
   - G-001 spec + finding (`findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md`) Read ✓
   - monorepo `packages/grid-renderers/src/` (5 G-001 산출 파일 + index.ts) Glob 결과 실재 입증 ✓

2. **H-02 (implementFiles 경로 합리성)**:
   - 8 NEW (monorepo) 의 부모 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/` 실재 (Glob 결과 — G-001 산출 5 파일 + dist/ 모두 존재) ✓
   - 6 MODIFY (tw-framework-front `renderers/*.tsx` 5개 + monorepo `index.ts` 1개) 실재 ✓
   - 외부 디렉토리 H-02 예외 절차 불필요 (Section 8.2 — G-001 시점 생성 완료)

3. **H-03 (AC 출처 태그)**:
   - 9 AC 모두 source 태그 (L0 / D2 / F-05-02 / C-17 / C-25) ✓
   - spec 본문 Section 1 / 2 / 9 / 12 / 13 에서 인용 ✓

4. **G-01 (TBD 없음 + D# 표 cross-consistency — v1.0.4)**:
   - D1~D9 헤더 표 ↔ 본문 (Section 1.1 L0.a~L0.e + Section 2 + Section 7 표 14행 + Step 1~6) 일치 ✓
   - **Breakdown 일치 (v1.0.4 강화)**: D6 의 "NEW 8 + MODIFY 6 = 14 파일" + NEW/MODIFY 분류 + 파일 이름 8개/6개 enumerate 가 Section 7 표 14행 + AC-001~AC-007 evidence 와 100% 일치 ✓
   - D1 의 `BadgeCell→StatusBadgeCell` 명칭 매핑이 Section 2.1 + Section 3 + Section 7 #1 + Section 11.2 AFTER A/B + Section 11.3 Step 1/5 모두 동일 표기 ✓
   - D2 의 ButtonCell variant 매핑이 Section 2.3 + AC-003 evidence + Section 11.2 AFTER C + Section 11.4 R1 cross-reference ✓
   - "재결정" / "대체" / "수정함" 표현 0건 → E-06 위반 잠재성 0 ✓

5. **E-01 (Section 7 ↔ Section 11)**:
   - Section 7 의 14 파일 모두 Section 11.1 (= Section 7 그대로) + Section 11.3 Step 1~5 에 enumerate ✓
   - Step 1 (#1~#5 NEW) + Step 2 (#6~#8 NEW) + Step 3 (#9 MODIFY) + Step 5 (#10~#14 MODIFY) 일관 ✓

6. **E-06 (Section 7 Re-decision ↔ Final Table)**:
   - 본 spec 본문 "재결정", "변경 대상", "대체", "수정함" 표현 grep 결과:
     - "변경" (D2 variant 매핑, BadgeCell→StatusBadgeCell): 헤더 표 D 행에서 명시 + Section 7 최종 표에 1:1 반영 (D1 → #1 StatusBadgeCell.tsx NEW + #11 BadgeCell.tsx alias MODIFY, D2 → #3 ButtonCell.tsx NEW)
   - 모순 0건 — E-06 통과 ✓

7. **C-28 (path prefix)**: goals.json `implementFiles[]` 가 이미 `topvel-grid-monorepo/packages/...` 으로 정정됨 → spec 추가 정정 D# 불필요. Section 7 의 모든 NEW 경로가 정확 ✓

8. **C-29 (exactOptionalPropertyTypes spread 패턴)**: monorepo `tsconfig.base.json:14` `"exactOptionalPropertyTypes": true` 환경. 본 8 셀은 leaf 컴포넌트 — optional prop 을 child 로 forwarding 0건 (D7 명시). C-29 적용 범위 밖 → 본 Goal 면제 ✓

9. **C-31 (Functional Wiring Audit)**: 본 Goal 은 단독 유틸 함수 또는 헬퍼 NEW 없음 (AvatarCell `getInitials` + ProgressCell `clampPercent` 는 내부 helper, 외부 export X). NEW 컴포넌트 8개는 index.ts (#9 MODIFY) 의 export 추가로 wiring 완료 ✓. Section 7 #9 + Section 2.9 + Section 11.3 Step 3 일관 명시

---

**Spec 완료일**: 2026-05-14
**Spec writer**: tw-grid Spec Writer (opus tier — high migrationImpact)
**Next stage**: Coverage Verifier (haiku tier 별도 Agent 호출 — C-11 + C-15)
