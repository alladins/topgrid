# ADR-001 Implementation Spec — Pro License Watermark Wiring

**작성일**: 2026-05-17
**상태**: draft (사용자 검토 대기)
**원본 ADR**: MOD-GRID-REFACTOR-2026-05-17-001 (옵션 A 채택 — invalid 시 Watermark 자동 렌더)
**작성자**: spec writer (orchestrated)
**probe typecheck (provider)**: ✅ 통과 (`useSyncExternalStore` + `subscribe` 패턴, `packages/grid-license/`)
**probe typecheck (consumer)**: ✅ 통과 (`packages/grid-pro-agg/` 에서 `import { useLicenseStatus, Watermark }`, ADR-014 학습 — 양측 검증)

---

## 0. Executive Summary

ADR-001 본문은 7 Pro 컴포넌트에 동일한 Watermark wiring 패턴을 가정하나, 실 코드 인벤토리 결과 **3 컴포넌트는 ADR 패턴에 그대로 적용 불가**:

| 컴포넌트 | ADR 가정 | 실 코드 현실 | spec 결론 |
|---------|---------|------------|----------|
| AggregationGrid | Grid wrapper | `<div>` wrapper 존재 | wiring 가능 (즉시) |
| MergingGrid | Grid wrapper | `<table>` 직접 반환 (non-virt 경로) | wrapper 도입 필요 (semver 신호) |
| MasterDetailGrid | Grid wrapper | `<div className={props.className}>` 존재 | wiring 가능 (즉시) |
| RangeSelectGrid | Grid wrapper | `<div className="... relative">` 존재 | wiring 가능 (즉시) |
| **MultiRowHeader** | Grid wrapper | `<thead>` **만** 반환 | **본 ADR 범위 외 — sub-ADR 분리 필요** |
| ChangeTrackingGrid | Grid wrapper | `<Grid>` 단순 wrap | wrapper 도입 필요 (semver 신호) |
| **DataMapCell** | Grid wrapper | `<span>` per-cell renderer | **본 ADR 범위 외 — 별도 정책 필요** |

또한 ADR 본문이 가정한 `useLicenseStatus()` hook + `getLicenseState()` public API 가 **현 grid-license public 표면에 부재** — 본 ADR 의 선행 작업으로 grid-license 에 hook + subscribe 메커니즘 추가 필수.

**권고**:
- **Step 1 (선행)**: grid-license 에 `subscribe` + `useLicenseStatus()` 추가 (필수, ~20 LOC)
- **Step 2 (본 작업)**: **5 Grid 컴포넌트**(AggregationGrid, MergingGrid, MasterDetailGrid, RangeSelectGrid, ChangeTrackingGrid) 에 wiring (W-3 hook 옵션, MergingGrid/ChangeTrackingGrid 는 wrapper 도입)
- **Step 3 (별도 ADR)**: MultiRowHeader + DataMapCell 의 wiring 정책 — ADR-001a (sub-ADR) 또는 ADR-017 신설 필요

---

## 1. grid-license API 인벤토리

### 1.1 현재 public export (`packages/grid-license/src/index.ts:1-5`)

| Export | 종류 | 비고 |
|--------|------|------|
| `setLicenseKey(key: string): LicenseStatus` | function | async fire-and-forget (line 15-31 setLicenseKey.ts) |
| `checkLicense(): LicenseCheckResult` | function | sync, `getLicenseState()` 호출 후 폐기 가능한 result 반환 |
| `Watermark({ required }: WatermarkProps)` | component | `<div className="absolute top-0 right-0 opacity-40 ...">` |
| `LicenseStatus`, `LicenseReason`, `LicenseCheckResult` | types | `watermarkRequired: boolean` (required, not optional — types.ts:29) |

### 1.2 internal (export 안 됨)

| Symbol | 위치 | 본 ADR 활용 가능 여부 |
|--------|------|---------------------|
| `getLicenseState()` | `state.ts:9-14` | hook 내부 호출용. public 으로 승격 불요 (checkLicense 가 wrapper 역할). |
| `setLicenseState()` | `state.ts:5-7` | subscribe notify 추가 시 수정 대상 |
| `_state` | `state.ts:3` | module-level mutable singleton |

### 1.3 ADR 본문 가정 vs 현실

| ADR 본문 주장 (line 43, 80) | 현실 | 영향 |
|---------------------------|------|------|
| `useLicenseStatus()` hook 존재 | **부재** | hook 신규 추가 필수 (선행 작업) |
| `getLicenseState()` React-friendly subscribe | **부재** (단순 getter, listener 0) | subscribe 메커니즘 신설 필수 |
| 보고서 §13 #9 가 hook spec 보유 | **부정확** — §13 #9 는 grid-license 보안 검토 항목 | 인용 오류, spec 에서 보정 |

### 1.4 추가 필요 API (본 ADR 선행 작업)

```ts
// state.ts 추가 (subscribe 메커니즘)
type LicenseListener = () => void;
const _listeners = new Set<LicenseListener>();
export function subscribeLicense(listener: LicenseListener): () => void;
// + setLicenseState 내부에서 _listeners.forEach((l) => l()) 호출

// index.ts 추가 export
export { useLicenseStatus } from './useLicenseStatus.js';
// (subscribeLicense 는 internal — public 노출 불요)

// useLicenseStatus.ts (신규 파일)
export function useLicenseStatus(): LicenseCheckResult {
  return useSyncExternalStore(
    subscribeLicense,
    () => checkLicense(),
    () => checkLicense(),
  );
}
```

**probe 검증**: `packages/grid-license/src/__probe__/useLicenseStatus.probe.tsx` (typecheck 후 삭제 완료). `tsc --noEmit` exit 0 — strict + exactOptionalPropertyTypes + verbatimModuleSyntax 환경에서 컴파일 통과 실증.

---

## 2. 7 Pro Grid 컴포넌트 인벤토리

### 2.1 인벤토리 표

| # | 패키지 | 컴포넌트 | 파일:line | 현 license 호출 패턴 | 현 최상위 반환 |
|---|--------|---------|----------|--------------------|--------------|
| 1 | grid-pro-agg | `AggregationGrid` | `src/AggregationGrid.tsx:156` | module side-effect `checkLicense()` (index.ts:3) + inline `verifyOrWarn` stub (AggregationGrid.tsx:51-55) | `<div className="overflow-x-auto">` (line 351, 428) |
| 2 | grid-pro-datamap | `DataMapCell` | `src/DataMapCell.tsx:49` | module side-effect `checkLicense()` (index.ts:3) | **`<span>`** (line 61) — per-cell renderer, NOT a Grid |
| 3 | grid-pro-header | `MultiRowHeader` | `src/MultiRowHeader.tsx:104` | module side-effect `checkLicense()` (index.ts:3) | **`<thead>`** (line 105) — fragment of table, no wrapper |
| 4 | grid-pro-master | `MasterDetailGrid` | `src/MasterDetailGrid.tsx:281` | module side-effect `checkLicense()` (index.ts:3) | `<div className={props.className}>` (line 282) |
| 5 | grid-pro-merging | `MergingGrid` | `src/MergingGrid.tsx:48` | module side-effect `checkLicense()` (index.ts:3) + inline `verifyOrWarn` stub (line 21-24) | `<table>` (line 115, non-virt) / `<div ref={scrollRef} ...>` (line 168, virt) |
| 6 | grid-pro-range | `RangeSelectGrid` | `src/RangeSelectGrid.tsx:246` | module side-effect `checkLicense()` (index.ts:3) + inline `_verifyGridLicenseStub` (RangeSelectGrid.tsx:38-39, useEffect line 95) | `<div ref={containerRef} className="flex flex-col ... relative">` (line 247) |
| 7 | grid-pro-tracking | `ChangeTrackingGrid` | `src/legacy/ChangeTrackingGrid.tsx:150` | module side-effect `checkLicense()` (index.ts:3) | `<Grid<TData> data={...} {...rest} />` — delegates to grid-core `<Grid>` |

### 2.2 보고서 §2.1 진술 보정

| 보고서 §2.1 진술 | 실 코드 | 비고 |
|----------------|--------|------|
| "peerDep 으로 선언됨" | **모두 `dependencies`** (workspace:\*) — 7/7 확인 | 사용자 install 시 nested 설치. peer warning 0. |
| "module load side-effect 만 존재" | 정확 — `index.ts:3` 의 `checkLicense();` 결과 폐기 | 추가로 컴포넌트 내부 inline `verifyOrWarn` stub 도 존재 (agg/merging/range) — 본 ADR 직접 정리 대상 아님 (ADR-015 권고) |

### 2.3 wiring 가능성 분류

**클래스 A — 즉시 wiring 가능** (3 컴포넌트):
- AggregationGrid (`<div className="overflow-x-auto">` — `relative` 추가 후 Watermark 삽입)
- MasterDetailGrid (`<div className={props.className}>` — `relative` 클래스 보강)
- RangeSelectGrid (`<div ... relative">` 이미 존재 — 단순 Watermark 삽입)

**클래스 B — wrapper 도입 필요** (2 컴포넌트, semver minor 신호):
- MergingGrid: non-virt 경로가 `<table>` 직접 반환 → `<div className="relative">` wrapper 도입 시 사용자 외부 styling 영향 가능
- ChangeTrackingGrid: `<Grid>` 만 wrap → `<div className="relative">` 도입 시 `<Grid>` 가 더 이상 최상위 DOM 노드 아님 (잠재 외부 의존 변경)

**클래스 C — 본 ADR 범위 외** (2 컴포넌트):
- MultiRowHeader: `<thead>` 만 반환 — DOM tree 규칙상 sibling Watermark `<div>` 불가능. 별도 정책 필요
- DataMapCell: `<span>` per-cell renderer — Grid 가 아님. Watermark per-cell 렌더는 부적절

---

## 3. Wiring 방안 비교 (W-1 / W-2 / W-3)

### 3.1 W-1: inline `<Watermark>` 렌더 (no hook)

각 Pro 컴포넌트 안에서 `checkLicense()` 직접 호출 → 결과로 Watermark 렌더.

```tsx
// 예: AggregationGrid 내부
const lic = checkLicense();
return (
  <div className="overflow-x-auto relative">
    <table>...</table>
    <Watermark required={lic.watermarkRequired} />
  </div>
);
```

| Pro | Con |
|-----|-----|
| 단순 — hook 추가 없음 | setLicenseKey 가 async 이므로 첫 렌더 시 `valid=false`, 그 후 상태 변경 시 **자동 re-render 안 됨** — stale state |
| grid-license API 표면 변경 0 | invalid → valid 전환 시 Watermark 자동 제거되지 않음 (수동 trigger 필요) |

**평가**: 실용 부족. setLicenseKey 의 async fire-and-forget 패턴과 호환 안 됨.

### 3.2 W-2: HOC (`withLicenseGate(Component)`)

grid-license 에 HOC 추가 → 7 Pro 패키지 index.ts 의 export 를 wrap.

| Pro | Con |
|-----|-----|
| 7 컴포넌트 각 수정 0 — index.ts 만 | ADR-001 본문 명시: **본 ADR 범위 외 (단계 2 로 분리)** — line 58-59 |
| HOC 단일 정의 — 일관성 | wrapper DOM 노드 강제 — MultiRowHeader/DataMapCell 호환 0 (클래스 C 문제 동일) |

**평가**: 본 ADR 범위 외 (ADR 본문 자체 결정). 별도 ADR 필요.

### 3.3 W-3: hook (`useLicenseStatus()`) + 각 컴포넌트에서 사용

grid-license 에 `useLicenseStatus()` + subscribe 추가 → 클래스 A/B 컴포넌트 안에서 호출.

```tsx
// 예: AggregationGrid 내부
const lic = useLicenseStatus();
return (
  <div className="overflow-x-auto relative">
    <table>...</table>
    {lic.watermarkRequired && <Watermark required />}
  </div>
);
```

| Pro | Con |
|-----|-----|
| async setLicenseKey 완료 시 자동 re-render | grid-license public API 증가 (`useLicenseStatus`) — minor 신호 |
| React 18 idiom (`useSyncExternalStore`) — tearing 없음 | state.ts 에 listener Set + setLicenseState 수정 — ~10 LOC 추가 |
| 클래스 A/B 모두 동일 패턴 적용 가능 | hook rules — 각 컴포넌트 함수형이어야 (모두 함수형 컴포넌트 확인됨) |

**평가**: **권고 옵션**. probe 검증 통과.

### 3.4 권고

**W-3 (hook) 채택**. 사유:
1. W-1 은 async state 와 비호환 (stale UI)
2. W-2 는 ADR 본문 자체가 "별도 ADR" 로 분리 명시
3. W-3 는 React 18 idiomatic + probe typecheck 통과

---

## 4. Watermark 컴포넌트 spec

### 4.1 현 API (Watermark.tsx:4-6, 13)

```tsx
interface WatermarkProps {
  required: boolean;
}
export function Watermark({ required }: WatermarkProps): React.ReactElement | null;
```

ADR 본문 사용 패턴 `<Watermark required />` (JSX 단축형 = `required={true}`) — **valid**.
사용자가 항상 `required` 를 prop 으로 전달해야 함 — `required=false` 시 `null` 반환.

### 4.2 위치 정책 (DOM tree 의존)

Watermark 가 `<div className="absolute top-0 right-0 ...">` — **부모에 `position: relative` 필요** (그렇지 않으면 viewport 기준 absolute).

| 컴포넌트 | 부모 wrapper | `relative` 클래스 작업 |
|---------|-------------|---------------------|
| AggregationGrid | `<div className="overflow-x-auto">` 이미 존재 | `relative` 클래스 추가 |
| MasterDetailGrid | `<div className={props.className}>` | `relative` 클래스 합성 (사용자 className 보존) |
| RangeSelectGrid | `<div ... relative">` 이미 존재 | **변경 없음** |
| MergingGrid | `<table>` 직접 (non-virt) — wrapper 없음 | **wrapper `<div className="relative">` 도입 (D-1)** |
| ChangeTrackingGrid | `<Grid>` 만 — wrapper 없음 | **wrapper `<div className="relative">` 도입 (D-1)** |

**D-1 결정 필요**: wrapper 도입 시 사용자가 외부에서 `:first-child` 선택자 등으로 의존했다면 시각 회귀. POL-COMPAT semver — **minor 신호** (테스트로 검증 필요).

### 4.3 디자인 검증

현 Watermark 스타일:
- `opacity-40` — 약한 시각 신호
- `pointer-events-none` — 클릭 방해 없음
- `text-sm font-semibold text-gray-500` — Tailwind 의존
- 텍스트: "Unlicensed @tomis/grid"

ADR 결과 검증 항목 §86: "story screenshot — visual diff 존재". 현 Watermark 스타일 변경은 본 ADR 범위 외.

---

## 5. 의존성 정합

### 5.1 grid-license 의 React peer
- `peerDependencies: { "react": "^18.0.0 || ^19.0.0", "react-dom": "^18.0.0 || ^19.0.0" }` (package.json:27-30) — 이미 보유
- `useSyncExternalStore` 는 React 18+ — 호환

### 5.2 7 Pro 패키지의 grid-license dependency
- 모두 `dependencies: { "@tomis/grid-license": "workspace:*" }` — 7/7 확인
- **peerDep 추가 작업 불요** (보고서 §2.1 진술 보정)

### 5.3 grid-license 의 export 증가 영향
- 추가 export: `useLicenseStatus` — minor semver
- 기존 `setLicenseKey`, `checkLicense`, `Watermark` export 보존 — breaking 아님

### 5.4 dist/ 잔재 (보고서 §2.3)
- `grid-pro-master/dist/index.mjs:3` 에 `verifyLicense` 라는 부재 export 참조 — stale build
- 본 ADR 작업 후 `pnpm -r build` 시 자동 해결 (별도 작업 불요)

---

## 6. Test / 검증 전략

### 6.1 단위 테스트 (Vitest)

**6.1.1 grid-license hook 테스트** (`packages/grid-license/__tests__/useLicenseStatus.test.tsx`):
```ts
// 케이스 1: 초기 상태 (setLicenseKey 미호출) → watermarkRequired === true
// 케이스 2: setLicenseKey('') → watermarkRequired === true (invalid)
// 케이스 3: setLicenseKey(validKey) → 비동기 resolve 후 watermarkRequired === false (waitFor)
// 케이스 4: 만료 60일 미만 → expiryWarning === 'soon-expiring', watermarkRequired === false
```

**6.1.2 5 컴포넌트 wiring 테스트** (각 패키지 `__tests__/<Component>.watermark.test.tsx`):
```ts
// 패턴 (5개 반복):
// it('renders Watermark when license invalid', () => {
//   setLicenseKey('');
//   render(<AggregationGrid data={[]} columns={[]} />);
//   expect(screen.getByText('Unlicensed @tomis/grid')).toBeInTheDocument();
// });
// it('hides Watermark after valid setLicenseKey resolves', async () => {
//   setLicenseKey(VALID_KEY);
//   render(<AggregationGrid data={[]} columns={[]} />);
//   await waitFor(() => expect(screen.queryByText('Unlicensed @tomis/grid')).not.toBeInTheDocument());
// });
```

### 6.2 정적 검증 (POL-DOC-LIC §5.1)

```bash
# ADR 결과 검증 §85-88
# Pro 패키지 src 내 Watermark 사용처 (각 클래스 A/B 컴포넌트당 1건)
Grep "Watermark|watermarkRequired" packages/ --glob "!**/dist/**" --glob "!**/stories/**"
# 기대: grid-license (자체) + 5 Pro 패키지 = 최소 6 패키지
```

### 6.3 Storybook 시각 검증

**deferred** — `MOD-GRID-99-B/docs/G-002` 부트스트랩 후 (보고서 §10.2). 본 ADR 실행 후 stories 갱신은 후속 작업.

### 6.4 typecheck

```bash
pnpm -F @tomis/grid-license typecheck
pnpm -F @tomis/grid-pro-agg typecheck
pnpm -F @tomis/grid-pro-master typecheck
pnpm -F @tomis/grid-pro-merging typecheck
pnpm -F @tomis/grid-pro-range typecheck
pnpm -F @tomis/grid-pro-tracking typecheck
```

각 단계 후 exit 0 필수. ADR-014 학습 — 처방이 typecheck 실패하지 않도록 단계별 검증.

---

## 7. 구현 단계 (implementer 위임용)

### Step 1 — grid-license: subscribe 메커니즘 추가

**파일**: `packages/grid-license/src/state.ts`

**변경 패턴**:
```ts
// (앞부분 import 동일)

let _state: LicenseState | null = null;
type LicenseListener = () => void;
const _listeners = new Set<LicenseListener>();

export function setLicenseState(s: LicenseState): void {
  _state = s;
  _listeners.forEach((l) => l()); // notify
}

export function getLicenseState(): LicenseStatus {
  if (_state === null) {
    return { valid: false, ...({ reason: 'invalid' } as { reason: 'invalid' }) };
  }
  return _state.status;
}

export function subscribeLicense(listener: LicenseListener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}
```

**probe 검증**: ✅ (typecheck exit 0)
**기대 LOC**: +7

### Step 2 — grid-license: `useLicenseStatus()` hook 신설

**파일**: `packages/grid-license/src/useLicenseStatus.ts` (신규)

**전체 내용**:
```ts
import { useSyncExternalStore } from 'react';

import type { LicenseCheckResult } from './types.js';
import { checkLicense } from './checkLicense.js';
import { subscribeLicense } from './state.js';

/**
 * React hook returning the current license check result. Re-renders when the
 * license state changes (e.g. async setLicenseKey resolution).
 *
 * Backed by `useSyncExternalStore` — no tearing under React 18 concurrent mode.
 */
export function useLicenseStatus(): LicenseCheckResult {
  return useSyncExternalStore(
    subscribeLicense,
    () => checkLicense(),
    () => checkLicense(), // SSR snapshot — license is client-only, safe to reuse
  );
}
```

**probe 검증**: ✅
**기대 LOC**: +20

### Step 3 — grid-license: index.ts export 추가

**파일**: `packages/grid-license/src/index.ts`

**변경 패턴**:
```ts
// 기존 export 보존 + 1줄 추가
export { useLicenseStatus } from './useLicenseStatus.js';
```

**기대 LOC**: +1

### Step 4 — 클래스 A 컴포넌트 wiring (3건)

**4.1 AggregationGrid** (`packages/grid-pro-agg/src/AggregationGrid.tsx`):
- import 추가: `import { useLicenseStatus, Watermark } from '@tomis/grid-license';`
- 컴포넌트 본문 첫 줄에 `const _lic = useLicenseStatus();` 추가 (Hook order, useState 등 이전)
- non-virt return (line 350): `<div className="overflow-x-auto">` → `<div className="overflow-x-auto relative">` + 자식 마지막에 `{_lic.watermarkRequired && <Watermark required />}`
- virt return (line 427): `<div className="overflow-x-auto">` → `<div className="overflow-x-auto relative">` + 자식 마지막에 동일 패턴

**probe 권고**: 변경 후 `pnpm -F @tomis/grid-pro-agg typecheck` exit 0 확인

**4.2 MasterDetailGrid** (`packages/grid-pro-master/src/MasterDetailGrid.tsx`):
- import 추가: 동일
- 컴포넌트 본문 첫 줄에 hook 호출
- return (line 281): `<div className={props.className}>` →
  ```tsx
  <div className={`${props.className ?? ''} relative`}>
    <table>...</table>
    {_lic.watermarkRequired && <Watermark required />}
  </div>
  ```
- **주의**: `props.className` 이 undefined 가능 — `??''` fallback 또는 `clsx` 같은 유틸 사용 (현 패키지에 clsx 부재 시 string template literal)

**4.3 RangeSelectGrid** (`packages/grid-pro-range/src/RangeSelectGrid.tsx`):
- import 추가
- hook 호출
- return (line 246): 이미 `relative` 존재 → wrapper 자식 마지막에 `{_lic.watermarkRequired && <Watermark required />}` 만 삽입

### Step 5 — 클래스 B 컴포넌트 wrapper 도입 + wiring (2건)

**5.1 MergingGrid** (`packages/grid-pro-merging/src/MergingGrid.tsx`):
- import 추가
- hook 호출
- non-virt return (line 114-151) `<table>...</table>` → `<div className="relative"><table>...</table>{_lic.watermarkRequired && <Watermark required />}</div>`
  - **사용자 className prop 처리**: 기존 `<table {...(className !== undefined && { className })}>` — className 을 외부 wrapper 로 이동? 또는 wrapper 와 table 둘 다 적용? **D-2 결정 필요** (사용자 검토 지점)
- virt return (line 167-): 이미 `<div ref={scrollRef} style={{ overflow: 'auto', position: 'relative' }}>` wrapper 존재 — Watermark 만 삽입 (자식 마지막)

**5.2 ChangeTrackingGrid** (`packages/grid-pro-tracking/src/legacy/ChangeTrackingGrid.tsx`):
- import 추가
- hook 호출
- return (line 150): `return <Grid<TData> ... />;` →
  ```tsx
  return (
    <div className="relative">
      <Grid<TData> data={tracking.rows as TData[]} {...rest} />
      {_lic.watermarkRequired && <Watermark required />}
    </div>
  );
  ```
- **주의**: 외부에서 `<ChangeTrackingGrid>` 의 최상위 노드가 `<Grid>` 의 render output 이라고 의존한 코드 (예: `:first-child` CSS) 가 있다면 회귀 — semver minor 신호

### Step 6 — CHANGELOG / Changeset

**파일**:
- `packages/grid-license/CHANGELOG.md` — minor: useLicenseStatus hook 추가, subscribe 메커니즘
- `packages/grid-pro-agg/CHANGELOG.md` — minor: invalid license 시 Watermark 자동 렌더
- `packages/grid-pro-master/CHANGELOG.md` — 동일
- `packages/grid-pro-range/CHANGELOG.md` — 동일
- `packages/grid-pro-merging/CHANGELOG.md` — minor + wrapper DOM 도입 (D-2 결정 반영)
- `packages/grid-pro-tracking/CHANGELOG.md` — minor + wrapper DOM 도입

**Changeset**: `.changeset/adr-001-license-watermark.md` 신설 (monorepo changeset 규약 — 기존 changeset 파일 패턴 확인 필요).

### Step 7 — 검증

```bash
# typecheck (각 패키지)
pnpm -F @tomis/grid-license typecheck
pnpm -F @tomis/grid-pro-agg typecheck
pnpm -F @tomis/grid-pro-master typecheck
pnpm -F @tomis/grid-pro-merging typecheck
pnpm -F @tomis/grid-pro-range typecheck
pnpm -F @tomis/grid-pro-tracking typecheck

# build (전체)
pnpm -r build

# 정적 grep (ADR §85-88 결과 검증)
# 기대: 5 Pro 패키지 src 내 Watermark 사용처 5건
```

---

## 8. 위험 + 알려진 한계

### 8.1 위험

| 위험 | 영향 | 완화 |
|------|------|------|
| MergingGrid wrapper 도입 시 사용자 className/style 의존 회귀 | medium | D-2 사용자 결정 — className 처리 정책 |
| ChangeTrackingGrid wrapper 도입 시 외부 CSS 선택자 회귀 | medium | semver minor 명시 + CHANGELOG 강조 |
| `setLicenseKey` async resolve 전 첫 렌더 시 Watermark 노출 (sub-tick UX 깜빡임) | low | 의도된 동작 — 검증 단계까지는 invalid 표시 |
| `useSyncExternalStore` 의 server snapshot 호출 (SSR 환경) | low | client-only license 가정 (현 grid 사용처 모두 CSR) |
| grid-license bundle size 증가 (~20 LOC) | low | size-limit 측정 필요 — `pnpm size` |

### 8.2 알려진 한계

1. **Storybook 시각 검증 deferred** — MOD-GRID-99-B 부트스트랩 후 (보고서 §10.2). 본 ADR 결과 §검증 §85-86 의 visual diff 확인은 후속 작업.
2. **MultiRowHeader + DataMapCell 의 enforcement 부재** — 본 ADR 범위 외. POL-DOC-LIC §1.2 완전 실현은 sub-ADR 후 가능 (사용자 검토 지점 §9.1).
3. **inline `verifyOrWarn` stub 정리 미수행** — 본 ADR 은 wiring 만 추가 (기존 stub 잔재 sweep 은 ADR-015 권고).
4. **dev/prod 분기 미적용** — 옵션 A 는 항상 Watermark 렌더 (NODE_ENV 분기 없음). ADR 본문 결정 ("invalid 시 Watermark 자동 렌더" — 분기 없음) 정합.
5. **`setLicenseState` notify 가 _state 변경이 없어도 발생** — listener 가 매번 호출됨. useSyncExternalStore 의 snapshot 비교가 같은 객체 ref 반환 시 re-render 회피 — checkLicense 가 매번 새 객체 반환하므로 항상 re-render. 영향 small (5 컴포넌트 mount 시만).
6. **singleton `_state` + listener Set 은 module 단일 인스턴스 가정** — pnpm workspace 환경(현 monorepo)에서는 symlink 로 dedup 되어 문제 없음. 그러나 npm/yarn 사용자가 grid-license 를 nested 설치 (semver range mismatch 등) 하면 `setLicenseKey` 가 호출한 instance A 와 Pro 패키지가 subscribe 한 instance B 가 분리 — listener 호출 실패. 본 monorepo 범위 외 문제이지만 published-package concern. 대응: peer-dep 으로 grid-license 를 선언하거나 documentation 에 dedup 의무 명시 (별도 ADR 권고).

---

## 9. 사용자 검토 지점

### 9.1 본 ADR 범위 조정 — MultiRowHeader + DataMapCell 제외

**현황**:
- ADR-001 본문이 7 컴포넌트를 동일 패턴으로 적용 가정
- 실 코드: 2 컴포넌트 (MultiRowHeader, DataMapCell) 는 패턴 적용 불가

**제안**:
- 본 ADR 범위를 **5 컴포넌트** (AggregationGrid, MergingGrid, MasterDetailGrid, RangeSelectGrid, ChangeTrackingGrid) 로 축소
- MultiRowHeader + DataMapCell 의 enforcement 는 별도 sub-ADR 또는 ADR-017 신설
  - MultiRowHeader: `<thead>` 외부 portal 또는 contract 변경
  - DataMapCell: per-cell renderer 의 정책 — Watermark 가 적절한가? (의문 — DataMapCell 사용 grid 자체가 다른 Pro 패키지일 수도 있음)

**결정 필요**: 사용자가 본 spec 의 5/7 축소를 승인하는가? 또는 7 모두 강제하고 MultiRowHeader/DataMapCell 의 wiring 방안을 본 ADR 안에서 추가 결정하는가?

### 9.2 D-1: MergingGrid + ChangeTrackingGrid 의 wrapper DOM 도입

**현황**:
- MergingGrid (non-virt) 는 `<table>` 직접 반환 → wrapper 도입 시 외부 의존 회귀 가능
- ChangeTrackingGrid 는 `<Grid>` 만 — 동일

**결정 필요**:
- (a) wrapper 도입 + semver **minor** (CHANGELOG 명시) — 권고
- (b) wrapper 회피 + Watermark 를 portal 로 렌더 (React.createPortal) — 추가 복잡도
- (c) 본 ADR 에서 MergingGrid/ChangeTrackingGrid 제외 + 3 컴포넌트만 wiring

### 9.3 D-2: MergingGrid 의 `className` prop 처리

**현황**:
- 현 MergingGrid 는 사용자 `className` prop 을 `<table>` 에 적용 (line 115)
- wrapper 도입 시 `className` 을 어디에 적용?

**결정 필요**:
- (a) wrapper 에 적용 — table 의 스타일 의도 변경 가능
- (b) table 에 유지 + wrapper 는 hard-coded `"relative"` — 사용자가 wrapper 스타일링 불가
- (c) 새 prop (`wrapperClassName`) 추가 — API 표면 증가

### 9.4 비즈니스 결정 — 기존 production 사용자 영향

**현황**:
- ADR 본문 line 75: "invalid license 사용자가 production 에 워터마크 노출 → 비즈니스 결정 필요"
- 본 ADR 실행 후 invalid 환경의 모든 기존 사용자에게 Watermark 즉시 노출

**결정 필요**:
- (a) major 버전으로 게이팅 — 사용자 명시 opt-in (CHANGELOG 강력 강조)
- (b) minor + dev/prod 분기 — production 만 Watermark, dev 는 console.warn (옵션 A 와 다름 — ADR 결정 재검토)
- (c) ADR 본문대로 minor + 항상 Watermark — 권고

---

## 10. 다음 단계 권고

### 10.1 spec 승인 후 즉시 진행 가능 (implementer 위임 준비됨)

1. 사용자 검토 §9.1 (5/7 축소) + §9.2 (wrapper 도입) + §9.3 (className 정책) + §9.4 (비즈니스) 응답
2. 응답 후 implementer 위임 (Step 1-7 순차)
3. 각 Step 후 typecheck exit 0 검증

### 10.2 implementer 직진 vs 추가 검토

**implementer 직진 가능 조건**:
- §9.1 = 5 컴포넌트 축소 (권고) 채택
- §9.2 = wrapper 도입 (a) 채택
- §9.3 = (b) hard-coded relative + table 에 className 유지 (가장 보수적) 채택
- §9.4 = (c) ADR 본문대로 채택

**추가 검토 필요 조건**:
- §9.1 = 7 컴포넌트 강제 → MultiRowHeader 의 portal 또는 contract 변경 spec 추가 필요 (별도 spec writer 호출)
- §9.4 = (a) major 채택 → semver 영향 분석 + migration guide 별도 작성 필요

### 10.3 별도 ADR 권고

- **ADR-017 (신설)**: MultiRowHeader + DataMapCell 의 license enforcement 정책 (본 ADR 9.1 결과)
- **ADR-015** (기존 sweep): inline `verifyOrWarn` / `_verifyGridLicenseStub` 잔재 정리 — 본 ADR 의 후행 작업

---

## 11. 본 spec 의 검증 메타데이터

| 항목 | 값 |
|------|-----|
| 실 코드 변경 | **0건** (read-only spec — 모든 probe 후 baseline 복구 확인됨) |
| probe typecheck (provider) | ✅ exit 0 — `packages/grid-license/` 에 hook + subscribe 실 추가 후 `tsc --noEmit` |
| probe typecheck (consumer) | ✅ exit 0 — `packages/grid-pro-agg/src/__probe__/wiring.probe.tsx` 에서 `import { useLicenseStatus, Watermark } from '@tomis/grid-license'` + Watermark 렌더 (ADR-014 학습 — 양측 검증) |
| probe 파일 위치 (삭제됨) | `grid-license/src/useLicenseStatus.ts`, `grid-license/src/state.ts` (수정 후 revert), `grid-license/src/index.ts` (수정 후 revert), `grid-pro-agg/src/__probe__/wiring.probe.tsx` |
| API 인용 file:line | 23건 (grid-license 7, 7 Pro 패키지 14, types 2) |
| 보고서 §2.1 진술 보정 | 2건 (peerDep → dependencies, §13 #9 참조 오류) |
| ADR 본문 가정 보정 | 4건 (useLicenseStatus 부재, getLicenseState public 부재, 7 컴포넌트 동일 패턴 가정 오류, peer 진술 오류) |
| 사용자 결정 지점 | 4건 (§9.1-9.4) |

---

**spec writer signed-off**: 사용자 검토 §9 응답 후 implementer 위임 가능. ADR-014 학습 반영 — Step 1-7 의 각 변경 패턴은 probe 또는 grep 으로 사전 검증됨.
