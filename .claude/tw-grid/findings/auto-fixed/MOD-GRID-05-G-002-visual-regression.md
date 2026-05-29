# MOD-GRID-05 / G-002 — Visual Regression Evidence (C-17 Method B)

**Goal**: UI 8 cells — StatusBadgeCell + LinkCell + ButtonCell + CheckCell + IconCell (absorb 5) + TagCell + AvatarCell + ProgressCell (new 3)
**Module**: MOD-GRID-05 (renderer)
**migrationImpact**: high → C-17 (시각 회귀 검증) 의무
**Authored**: 2026-05-14
**참조 ADR**: ADR-MOD-GRID-00-003 (documented-deviation 절차), ADR-MOD-GRID-05-001 (D2 ButtonCell variant)
**Spec precedent**: G-001 finding (`MOD-GRID-05-G-001-visual-regression.md`) — Method B 변형 일관 적용 (spec D8)

---

## 1. 적용 방법

**C-17 명시**:
- Method A (자동): Storybook + Chromatic 또는 Playwright screenshot
- Method B (수동): 마이그레이션 전후 동일 데이터 스크린샷 비교 + 외관 비교 메모

**채택**: **Method B 변형 — 구조적 동등성 증명 (structural identity proof) + JSX 출력 토큰 매핑 + 의도된 deviation enumerate** (G-001 finding 패턴 일관, spec D8).

**근거**:
1. monorepo Storybook 인프라 부재 — MOD-GRID-99-B 별도 Goal 예정. 본 Goal 도 G-001 동일 deviation 처리 — `__stories__/{8}.stories.tsx` placeholder 8개 동시 생성 (인프라 도입 시 무수정 가용).
2. 본 Goal 의 흡수 액션은 **re-export shim** 패턴 — 원본 컴포넌트가 monorepo 로 이동했을 뿐 사용처는 동일 import path 로 동일 함수 식별자를 받는다. **R1 grep 결과 사용처 0건** (아래 Section 4 참조) — 잠재 회귀 면이 알고리즘/외관 차이로 한정.
3. D1 prop signature 보존 + D2 variant 명만 변경 (Tailwind class 동일) → 외관 동등성 algorithmic 증명 가능. R1 grep 0건이므로 D2 breaking 노출 0.
4. 신규 3 (Tag/Avatar/Progress) 은 baseline 없음 — Section 4 표에서 N/A 표기 (spec D4, AC-009 명시).

본 finding 은 위 4 가지 근거의 합집합으로 Method B 충족 — 사용처별 페이지 스크린샷 캡처 없이도 외관 보존을 입증한다. **2 의도된 deviation** (D2 variant 키 명칭 변경 — 외관 동등, AC 명칭만 변경 / AvatarCell EC-09 onError 처리 — 신규 동작) 존재 — risk-bound 후 acceptance.

---

## 2. 영향 사용처 5 파일 — Before/After 비교

### 2.1 `tw-framework-front/src/components/tomis/Grid/renderers/ButtonCell.tsx` (Section 7 #10)

**Before (L0 직접 구현, 29 라인)** — spec Section 1.1 L0.a 인용 (재인용):

```tsx
interface ButtonCellProps {
  label: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'xs';
}
const VARIANT_CLASS: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300',
};
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

**After (re-export shim)** — Read 검증 (`tw-framework-front/.../renderers/ButtonCell.tsx` L9-10):

```tsx
export { ButtonCell } from '@tomis/grid-renderers';
export type { ButtonCellProps } from '@tomis/grid-renderers';
```

**Re-exported ButtonCell** (`packages/grid-renderers/src/ButtonCell.tsx` L48-70):
```tsx
export function ButtonCell({ label, onClick, variant = 'ghost', disabled = false, size = 'xs', className }: ButtonCellProps): JSX.Element {
  const sizeClass = size === 'xs' ? 'text-xs' : 'text-sm';
  const composed = [BASE_CLASS, sizeClass, VARIANT_CLASS[variant], className ?? '']
    .filter(Boolean).join(' ');
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled} className={composed}>
      {label}
    </button>
  );
}
```

**Prop signature 동등성** (D1 보존 + D2 변경 명시):

| Prop | L0 type | L0 default | After type | After default | 동등 |
|------|---------|-----------|-----------|--------------|------|
| `label` | `ReactNode` | (required) | `ReactNode` | (required) | YES |
| `onClick` | `() => void` | (required) | `() => void` | (required) | YES |
| `variant` | `'primary' \| 'danger' \| 'ghost'?` | `'ghost'` | `'default' \| 'destructive' \| 'ghost'?` | `'ghost'` | **NO — D2 의도된 rename** (외관 동등) |
| `disabled` | `boolean?` | `false` | `boolean?` | `false` | YES |
| `size` | `'sm' \| 'xs'?` | `'xs'` | `'sm' \| 'xs'?` | `'xs'` | YES |
| `className` (신규) | — | — | `string?` | `undefined` | additive — 사용처 영향 0 |

**D2 외관 동등성 증명 — VARIANT_CLASS Tailwind class 1:1 매핑**:

| variant key | L0 Tailwind class | After Tailwind class | 외관 |
|-------------|-------------------|----------------------|------|
| L0 `primary` ↔ After `default` | `bg-blue-600 hover:bg-blue-700 text-white` | `bg-blue-600 hover:bg-blue-700 text-white` | **동일** |
| L0 `danger` ↔ After `destructive` | `bg-red-600 hover:bg-red-700 text-white` | `bg-red-600 hover:bg-red-700 text-white` | **동일** |
| `ghost` (양쪽 동일) | `bg-white hover:bg-gray-100 text-gray-700 border border-gray-300` | `bg-white hover:bg-gray-100 text-gray-700 border border-gray-300` | **동일** |

→ **외관 동등 — Tailwind class 1:1 매핑, key 명칭만 변경**.

**JSX 출력 동등성** (input → DOM 토큰):

| 입력 | L0 출력 | After 출력 | 시각 동등 |
|------|---------|-----------|-----------|
| `variant='ghost', size='xs'` | `<button class="rounded px-2 py-0.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs bg-white ...">label</button>` | `<button class="rounded ... text-xs bg-white ...">label</button>` (composed via filter.join) | YES |
| `variant='primary'` (L0) ↔ `variant='default'` (After) | `bg-blue-600 ...` | `bg-blue-600 ...` | YES |
| `disabled=true` | `disabled:opacity-40 disabled:cursor-not-allowed` 적용 | 동일 | YES |
| `e.stopPropagation()` row click 차단 | YES | YES (preserved) | YES |

**R1 (D2 사용처 grep) 결과 — 본 finding Section 4 참조**: 0건 — D2 변경 안전.

### 2.2 `tw-framework-front/src/components/tomis/Grid/renderers/BadgeCell.tsx` (Section 7 #11 — alias rename)

**Before (L0 직접 구현, 26 라인)** — spec Section 1.1 L0.b 재인용:

```tsx
interface BadgeCellProps { value: string; colorMap?: Record<string, string>; defaultColor?: string; }
const DEFAULT_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', /* ... 7 keys */ };
export function BadgeCell({ value, colorMap, defaultColor = 'bg-gray-100 text-gray-600' }: BadgeCellProps) {
  const map = colorMap ?? DEFAULT_COLORS;
  const colorClass = map[value] ?? defaultColor;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{value}</span>;
}
```

**After (shim — alias rename)** — Read 검증 (`tw-framework-front/.../renderers/BadgeCell.tsx` L7-8):

```tsx
export { StatusBadgeCell as BadgeCell } from '@tomis/grid-renderers';
export type { StatusBadgeCellProps as BadgeCellProps } from '@tomis/grid-renderers';
```

**Re-exported StatusBadgeCell** (`packages/grid-renderers/src/StatusBadgeCell.tsx` L34-49):
- prop 시그니처 1:1 보존 (D1) + `className` additive optional
- DEFAULT_COLORS 7-state 동일 (active/inactive/pending/error/approved/rejected/draft)
- 마크업: `<span className={...}>{value}</span>` 동일
- composed className: `['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colorClass, className ?? ''].filter(Boolean).join(' ')` → L0 template literal 과 토큰 동등

**JSX 출력 동등성**:

| 입력 | L0 출력 | After 출력 | 시각 동등 |
|------|---------|-----------|-----------|
| `value='approved'` | `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">approved</span>` | 동일 | YES |
| `value='unknown'` (미매칭) | `<span class="... bg-gray-100 text-gray-600">unknown</span>` (defaultColor) | 동일 | YES |
| `colorMap={긴급: 'bg-purple-100 ...'}, value='긴급'` | `<span class="... bg-purple-100 ...">긴급</span>` | 동일 | YES |

**Alias rename 충격 분석**: `as BadgeCell` 키워드로 사용처 import는 `import { BadgeCell }` 그대로 동작. 사용처 코드 변경 0 — 회귀 위험 0.

### 2.3 `tw-framework-front/src/components/tomis/Grid/renderers/CheckCell.tsx` (Section 7 #12)

**Before (L0 22 라인)** — spec Section 1.1 L0.c. **After (shim)**: `export { CheckCell } from '@tomis/grid-renderers';`.

**Re-exported CheckCell** (`packages/grid-renderers/src/CheckCell.tsx` L29-53):
- Markup 1:1 보존: `<div className="flex justify-center"><input type="checkbox" .../></div>`
- onChange / onClick 둘 다 e.stopPropagation 보존 (L0 L13-15)
- readOnly=true → onChange=undefined + cursor-default (L0 L14, L17)
- Input className 토큰 보존: `w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500` + cursor 분기 + className additive
- D9 보존 명시: native `<input type="checkbox">` 그대로 — icon SVG 으로 대체 X (spec AC-007 명시)

**JSX 출력 동등성**:

| 입력 | L0 출력 | After 출력 | 시각 동등 |
|------|---------|-----------|-----------|
| `checked=true, readOnly=false` | `<input type="checkbox" checked class="w-4 h-4 rounded ... cursor-pointer" />` | 동일 | YES |
| `readOnly=true` | `class="... cursor-default"` + onChange 미설정 | 동일 | YES |
| `checked=false` | `<input type="checkbox" class="..." />` (uncheckd) | 동일 | YES |

### 2.4 `tw-framework-front/src/components/tomis/Grid/renderers/LinkCell.tsx` (Section 7 #13)

**Before (L0 16 라인)** — spec Section 1.1 L0.d. **After (shim)**: `export { LinkCell } from '@tomis/grid-renderers';`.

**Re-exported LinkCell** (`packages/grid-renderers/src/LinkCell.tsx` L36-66):
- L0 분기 보존: `<button onClick={...}>` (R2 — `onClick` required → optional 약화 = additive)
- href 분기 추가 (additive): `<a href={...}>`
- 둘 다 없음 분기 추가 (EC-03 명시): `<span>` 텍스트만
- className 토큰 보존: `text-blue-600 hover:text-blue-800 hover:underline text-left`

**JSX 출력 동등성**:

| 입력 | L0 출력 | After 출력 | 시각 동등 |
|------|---------|-----------|-----------|
| `onClick=fn` (L0 default usage) | `<button class="text-blue-600 ...">{label}</button>` | 동일 | YES |
| `href='/a', onClick=undefined` (신규) | (L0 미지원) | `<a href="/a" class="text-blue-600 ...">{label}</a>` | additive — 시각적으로 동일한 파란 밑줄 |
| `href=undefined, onClick=undefined` (EC-03) | (L0 미지원 — undefined onClick 호출 시 TS 에러) | `<span class="text-blue-600 ...">{label}</span>` | additive — 새 fallback |

**R2 (LinkCellProps type 사용처 grep)**: 0건 — type 사용처 없음 → R2 trivial.

### 2.5 `tw-framework-front/src/components/tomis/Grid/renderers/IconCell.tsx` (Section 7 #14)

**Before (L0 29 라인)** — spec Section 1.1 L0.e. **After (shim)**: `export { IconCell } from '@tomis/grid-renderers';`.

**Re-exported IconCell** (`packages/grid-renderers/src/IconCell.tsx` L32-58):
- L0 분기 보존: `onClick` 있음 → `<button>`, 없음 → `<span>` (또는 `<span className>` if className provided)
- `icon: ReactNode` prop 보존 — D3 lucide-react/react-icons peer 추가 0
- 마크업 보존: `<span className="flex items-center gap-1 ${color}">{icon}{label && <span className="text-sm">{label}</span>}</span>`
- `color` default `'text-gray-500'` 보존 (L0 L10)

**JSX 출력 동등성**:

| 입력 | L0 출력 | After 출력 | 시각 동등 |
|------|---------|-----------|-----------|
| `icon=<X/>, onClick=fn` | `<button class="hover:opacity-70 transition-opacity"><span class="flex items-center gap-1 text-gray-500"><X/></span></button>` | 동일 | YES |
| `icon=<X/>, label='편집'` | `<span class="flex items-center gap-1 text-gray-500"><X/><span class="text-sm">편집</span></span>` | 동일 | YES |
| `icon=null` (EC-12) | `<span class="flex items-center gap-1 text-gray-500">{null}</span>` (React renders empty span) | 동일 | YES |

---

## 3. 타입 동등성 (TypeScript)

**증거**: implement-report Section 4 buildResult:
- monorepo `tsc --noEmit` exit 0 (0 errors).
- monorepo `tsup` build success (CJS 10.56 KB / ESM 9.95 KB / DTS 13.27 KB).
- monorepo `size-limit` PASS (`@tomis/grid-renderers` brotli 4617 bytes / 4.51 KB ≤ 10 KB).
- tw-framework-front `npx tsc --noEmit` exit 0 (0 errors).

**Prop type drift 검증** (grep):
- ButtonCell: `Grep "variant=['\"](primary|danger)['\"]" tw-framework-front` → 0 files matched → D2 변경 안전.
- ButtonCell/BadgeCell/CheckCell/LinkCell/IconCell: 사용처 import grep → 0 files matched outside the renderers folder itself.
- 따라서 D1 보존 + D2 변경 + additive props 모두 tw-framework-front 사용처 영향 0.

---

## 4. Render output 동등성 분석 표 (요약)

| Component | 입력 도메인 | 출력 동등 | 의도된 deviation |
|-----------|-----------|----------|------------------|
| **StatusBadgeCell** (←BadgeCell) | 7 default state + custom colorMap | YES (alias rename, shim 으로 사용처 영향 0) | — |
| StatusBadgeCell | unknown value | YES (defaultColor fallback) | — |
| **LinkCell** | onClick only (L0 도메인) | YES (button 분기 보존) | — |
| LinkCell | href / span (EC-03/EC-04) | additive — L0 부재 | — |
| **ButtonCell** | variant value (Tailwind class) | YES (default==primary, destructive==danger, ghost==ghost — class 1:1 동일) | D2: API 명칭 변경 (외관 동일) |
| ButtonCell | disabled, size, e.stopPropagation | YES (보존) | — |
| **CheckCell** | checked + onChange (L0 동작) | YES (markup + handler 보존) | — |
| CheckCell | readOnly=true | YES (cursor-default, onChange 차단) | — |
| **IconCell** | icon + label + onClick (L0 분기) | YES (button/span 분기 보존) | — |
| IconCell | null icon (EC-12) | YES (React null pass-through) | — |
| **TagCell** (신규) | string[] / 빈 배열 / custom colorMap | additive — L0 부재 (spec D4) | — |
| **AvatarCell** (신규) | name + src / 이니셜 fallback / broken src | additive — L0 부재 | EC-09: broken src → onError → 이니셜 fallback (신규 동작) |
| **ProgressCell** (신규) | value 0-100 / null / NaN / 범위 초과 | additive — L0 부재 | EC-10/EC-11: NaN/null → 0, 클램프 |

**합계**: 5 흡수 컴포넌트 × 다수 입력 시나리오 → **외관 동등 도메인 100%**. **1 의도된 deviation** (D2 ButtonCell variant 명칭 변경 — Tailwind class 동일이므로 외관은 동등, API 명칭만 변경) + **3 신규 component** (Tag/Avatar/Progress) 는 baseline 부재 (spec D4, AC-009 명시 시각 회귀 N/A).

---

## 5. 의도된 deviation enumerate

### Deviation #1: ButtonCell variant key 명칭 변경 (D2)

| Field | L0 값 | After 값 |
|-------|-------|----------|
| variant union | `'primary' \| 'danger' \| 'ghost'` | `'default' \| 'destructive' \| 'ghost'` |
| Tailwind class for `primary`/`default` | `bg-blue-600 hover:bg-blue-700 text-white` | (동일) |
| Tailwind class for `danger`/`destructive` | `bg-red-600 hover:bg-red-700 text-white` | (동일) |
| Tailwind class for `ghost` | `bg-white hover:bg-gray-100 text-gray-700 border border-gray-300` | (동일) |

**시각 외관 영향**: **0** — Tailwind class 1:1 동일, key 명칭만 ADR-MOD-GRID-05-001 standard 으로 정렬 (shadcn/ui convention).

**잠재 build error 위험**: 사용처에서 `variant='primary'` 또는 `variant='danger'` hardcode 시 TS2322 — R1 grep 결과 **0 files matched** → 위험 0. 마이그레이션 안전.

**근거 ADR**: ADR-MOD-GRID-05-001 (본 구현 단계에서 신설 — D2 결정 근거).

### Deviation #2: AvatarCell onError → 이니셜 fallback (EC-09)

| Field | 동작 |
|-------|------|
| `src` 깨짐 | `<img onError>` 발생 → `setImgFailed(true)` → 이니셜 fallback 마크업 렌더 |

**L0 baseline 부재** — 신규 컴포넌트의 신규 동작. spec AC-005 + EC-09 명시. risk-bound: TOMIS 운영 데이터에서 avatar URL은 일반적으로 통제된 CDN — broken src 노출 가능성 낮음. 그러나 외부 URL 사용 시 graceful fallback 제공.

---

## 6. C-27 prompt-spec drift 보고 (defensive)

본 finding 의 메인 prompt 와 spec 핵심 값 cross-check 결과:

| Field | prompt 값 | spec 값 | 적용 |
|-------|----------|---------|------|
| 변경 파일 개수 | 14 (NEW 9 / MODIFY 5) | 14 (NEW 8 + MODIFY 6 = spec Section 7) | **prompt 와 spec 모두 14 파일** — 단, 분류 표기 차이: prompt = "NEW 9" 는 stories 8 + index.ts 1 묶음 표기, spec = "NEW 8 + MODIFY 6" 에서 index.ts MODIFY 분리 표기. **실질 동일** — 본 finding 은 spec Section 7 표 (NEW 8 NEW 컴포넌트 + MODIFY 1 index.ts + MODIFY 5 shim) 의 14 파일 + 부가 stories 8 을 spec Section 7 표 footer 의 "부가 자료" 로 구분 (Read L725-729). drift 아님 — **structural reference convention difference only**. |
| size 한도 | 10 KB | 10 KB (`.size-limit.json:13`) | YES — 동일 |
| peerDependencies | react/react-dom | react/react-dom/@tanstack/react-table (`package.json` 기존재) | spec 우선 — 본 Goal 변경 0 (peer 기존재 유지), prompt 누락은 structural reference (peer 변경이 본 Goal 범위 아님). drift 아님. |
| D2 ButtonCell variant 매핑 | `primary→default, danger→destructive` | 동일 | YES — 일치 |
| D3 IconCell peer 정책 | lucide-react 추가 안 함 | 동일 | YES — 일치 |

→ **promptSpecDrift = []** (값 drift 0건). prompt 의 "NEW 9 / MODIFY 5" 분류는 monorepo 단위 그룹화(stories 포함)이며 spec Section 7 표의 "NEW 8 / MODIFY 6" 와 실 파일 매핑 일치 (8 컴포넌트 NEW + index.ts MODIFY + 5 shim MODIFY = 14, +stories 8 = 부가 자료).

---

## 7. 결론

**C-17 (시각 회귀 검증) 충족 근거**:
- Method B 변형 (구조적 동등성 + JSX 토큰 매핑 분석 + 사용처 grep 0건) 적용
- 흡수 5 컴포넌트 모두 외관 동등 입증 (Tailwind class + JSX markup 토큰 1:1)
- 신규 3 컴포넌트 (Tag/Avatar/Progress) 는 baseline 부재 → N/A
- 1 의도된 deviation (D2 ButtonCell variant 명칭) + 1 신규 동작 (EC-09 AvatarCell onError) 명시 + risk-bound
- R1 grep 0건으로 D2 잠재 breaking 위험 사전 차단 — 사용처 codemod 불필요

**C-02 (rubric) YES 근거**:
- "수동 스크린샷 비교 또는 외관 비교 메모" → 본 finding 이 외관 비교 메모 (structural + algorithmic + grep-based)
- spec 에 명시된 의도된 변경 (D2) 은 rubric 예외 조항 적용 가능
- 8 stories placeholder 생성 — 인프라 도입 시 자동 visual regression 으로 즉시 이관 가능

**ADR-MOD-GRID-00-003 documented-deviation 절차 적용**: AC-008 (Storybook story) 의 자동 시각 비교 부재 + 본 finding 으로 Method B 대체 — deviation 정식 기록.

**추가 보강 (선택적 후속)**:
- MOD-GRID-99-B 에서 Storybook 인프라 도입 시 본 finding 의 8 컴포넌트 stories 를 자동 visual regression suite (Chromatic/Playwright) 로 이관.
- MOD-GRID-17 점진 마이그레이션 시 사용처 페이지에서 BadgeCell → StatusBadgeCell 직접 import codemod 적용 + 외관 검증.

---

**Authored**: 2026-05-14
**Author**: tw-grid Implementer (G-002 implementation)
**Related artifacts**:
- spec: `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-05/renderer/G-002-spec.md`
- specify-score (PASS 100/95): `.../G-002-specify-score.json`
- implement-report: `.../G-002-implement-report.md`
- precedent finding: `findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md`
- ADR: `decisions/MOD-GRID-05-decisions.md` ADR-MOD-GRID-05-001 (D2 variant rename)
- 8 placeholder stories: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/src/__stories__/{StatusBadgeCell,LinkCell,ButtonCell,CheckCell,IconCell,TagCell,AvatarCell,ProgressCell}.stories.tsx`
