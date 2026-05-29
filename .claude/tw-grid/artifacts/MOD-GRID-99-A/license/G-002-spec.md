# G-002 Specification: Pro 패키지 import 시 자동 검증 + 워터마크 + expiry 60일 경고

**Module**: MOD-GRID-99-A / license  
**Goal ID**: G-002  
**Status**: SPECIFY  
**Date**: 2026-05-15  
**Depends on**: G-001 (setLicenseKey + Ed25519 서명 검증) — COMPLETED  
**Downstream**: G-003 (grid-pro-* 7개 패키지 EULA + auto-require)

---

## Section 1. 목표 요약 (Goal Summary)

G-001이 구현한 `setLicenseKey` + `verifySignature` 파이프라인을 소비하여, Pro 패키지 사용 시점에 라이선스 상태를 **자동으로 검사**하고:

1. 미인증 또는 만료/도메인 불일치 시 → `<Watermark />` 컴포넌트 표시 (소프트 인포스먼트, 블록 없음)  
2. 만료 60일 이내 유효 라이선스 → `console.warn` 경고 1회 (중복 방지)  
3. `checkLicense()` 함수 → `LicenseCheckResult` 반환 (동기, React-free 코어)

**출처**: `license-goals.json` G-002 (AC-001~AC-005)

---

## Section 2. 범위 및 인터페이스 (Scope & Interface)

### 2.1 IN-SCOPE

| 항목 | 설명 |
|------|------|
| `checkLicense(): LicenseCheckResult` | 동기 함수. `getLicenseState()`(동기) 소비, watermarkRequired + expiryWarning 파생 |
| `<Watermark />` React 컴포넌트 | 위치: position absolute, top-right, opacity-40, 텍스트 `'Unlicensed @tomis/grid'`, Tailwind className 전용 |
| 60일 경고 `console.warn` | 단일 인스턴스 1회 발생 (warned 모듈-레벨 플래그 중복 방지) |
| `LicenseCheckResult` 타입 | `types.ts` MODIFY (신규 export) |
| `index.ts` MODIFY | `checkLicense`, `Watermark`, `LicenseCheckResult` 추가 export |
| `package.json` MODIFY | `peerDependencies` React 추가 (ADR-004) |
| `stories/License.stories.tsx` | CSF3, `setLicenseState()` mock seam |

### 2.2 OUT-OF-SCOPE

| 항목 | 사유 |
|------|------|
| `verifySignature` 변경 | G-001 완료, 이 G 범위 외 |
| `setLicenseKey` 변경 | G-001 완료, 이 G 범위 외 |
| subdomain / wildcard 도메인 | ADR-002 각하 (G-003+ 확장) |
| Storybook 툴링 설치 (`.storybook/`) | MOD-GRID-99-B 범위 |
| CLI 키 생성 | G-003 범위 |
| 라이선스 블록(렌더 중단) | C-24 소프트 인포스먼트 — 블록 없음 |
| grid-pro-* 패키지 연동 | G-003 범위 |

---

## Section 3. 수용 기준 (Acceptance Criteria)

G-001-spec.md Section 3 패턴 준수.

| ID | 기준 | 검증 방법 |
|----|------|----------|
| AC-001 | `setLicenseKey` 미호출 시 `checkLicense()` → `{ valid: false, watermarkRequired: true }` 반환 | Unit: state null → result |
| AC-002 | 유효 라이선스 + 만료 60일 초과 → `{ valid: true, watermarkRequired: false }` (expiryWarning 없음) | Unit: future Date |
| AC-003 | 유효 라이선스 + 만료 60일 이내 → `{ valid: true, watermarkRequired: false, expiryWarning: 'soon-expiring', expiresAt: Date }` + `console.warn` 1회 | Unit: near-expiry Date + warn spy |
| AC-004 | `<Watermark />` — `watermarkRequired: true` 조건에서 렌더. `watermarkRequired: false` 시 `null` | RTL snapshot |
| AC-005 | package.json peerDependencies `react: ^18.0.0 || ^19.0.0` 및 `react-dom: ^18.0.0 || ^19.0.0` 포함 | JSON 검증 |

---

## Section 4. 의존성 및 제약 (Dependencies & Constraints)

### 4.1 업스트림 의존성

| 항목 | 상태 | 비고 |
|------|------|------|
| G-001: `setLicenseKey` + `verifySignature` | COMPLETED | `getLicenseState()` → `LicenseStatus` (동기) 반환 확인됨 |
| `state.ts`: `getLicenseState()`, `setLicenseState()` | G-001 구현 완료 | `setLicenseState()` = stories mock seam |
| `types.ts`: `LicenseStatus`, `LicenseReason` | G-001 구현 완료 | G-002가 `LicenseCheckResult` 추가 |

### 4.2 주요 제약

| 제약 ID | 내용 |
|---------|------|
| C-5 | Watermark: Tailwind className만 사용, inline style 금지 |
| C-14 | 외부 패키지 추가 시 trade-off 문서화 (ADR-004 — React peerDep) |
| C-20 | zero external dep 원칙 유지 (React는 peer, 번들 포함 아님) |
| C-22 | React는 반드시 `peerDependencies` (dependencies 금지) |
| C-24 | 소프트 인포스먼트: 블록 없음, watermark + console.warn only |
| C-28 | goals.json implementFiles 경로 오류 → 스펙 D1에서 정정, Section 7 정확 경로 사용 |
| C-29 | `exactOptionalPropertyTypes: true` → spread-skip 패턴 적용 |
| C-30 | Truth Table single authority → Section 7 최종 권한, Section 11은 diff만 |
| C-32 | pure helper + React shell 분리 — `checkLicense.ts` = React 의존 없음 |
| C-35 | Spec Writer Self-Check — Appendix B 완비 |

---

## Section 5. 기술 설계 (Technical Design)

### 5.1 checkLicense() 설계 원칙

`checkLicense(): LicenseCheckResult` 는 **순수 동기 함수**다.  
`getLicenseState()` (G-001 state.ts, 동기 반환) 를 소비하여 `LicenseStatus` 를 읽고, 두 가지 파생값을 계산한다:

- `watermarkRequired = !status.valid`  
- `expiryWarning`: `status.expiresAt` 존재 + `valid` + 만료 60일 이내 → `'soon-expiring'`

C-32 준수: React 의존 없음.

### 5.2 60일 경고 중복 방지

`checkLicense.ts` 모듈 최상위에 `let warned = false` 플래그 선언.  
`expiryWarning === 'soon-expiring'` 최초 감지 시 `console.warn(...)` 발생 + `warned = true`.  
이후 호출에서 `warned === true` 이면 `console.warn` 미실행.

### 5.3 Executable 인터페이스 명세

```typescript
// checkLicense.ts
import type { LicenseCheckResult } from './types.js';
import { getLicenseState } from './state.js';

const SIXTY_DAYS_MS = 60 * 24 * 3600 * 1000;
let warned = false;

export function checkLicense(): LicenseCheckResult {
  const status = getLicenseState(); // LicenseStatus (sync)
  const watermarkRequired = !status.valid;

  if (!status.valid) {
    // reason, expiresAt 있으면 포함 (exactOptionalPropertyTypes: spread-skip)
    const result: LicenseCheckResult = { valid: false, watermarkRequired: true };
    if (status.reason !== undefined) result.reason = status.reason;
    if (status.expiresAt !== undefined) result.expiresAt = status.expiresAt;
    return result;
  }

  // valid === true — expiry 60일 체크
  if (status.expiresAt !== undefined) {
    const msLeft = status.expiresAt.getTime() - Date.now();
    if (msLeft < SIXTY_DAYS_MS) {
      if (!warned) {
        console.warn(
          `[grid-license] 라이선스가 ${Math.ceil(msLeft / (24 * 3600 * 1000))}일 후 만료됩니다.`
        );
        warned = true;
      }
      return {
        valid: true,
        watermarkRequired: false,
        expiryWarning: 'soon-expiring',
        expiresAt: status.expiresAt,
      };
    }
  }

  return { valid: true, watermarkRequired: false };
}
```

```typescript
// Watermark.tsx
import React from 'react';

interface WatermarkProps {
  required: boolean;
}

export function Watermark({ required }: WatermarkProps): React.ReactElement | null {
  if (!required) return null;
  return (
    <div className="absolute top-0 right-0 opacity-40 pointer-events-none select-none text-sm font-semibold text-gray-500 p-2">
      Unlicensed @tomis/grid
    </div>
  );
}
```

```typescript
// types.ts 추가분 (MODIFY — 기존 LicenseStatus, LicenseReason, LicenseState 유지)
export type ExpiryWarning = 'soon-expiring';

export interface LicenseCheckResult {
  valid: boolean;
  watermarkRequired: boolean;
  expiryWarning?: ExpiryWarning;
  expiresAt?: Date;
  reason?: LicenseReason;
}
```

```typescript
// index.ts 추가분 (MODIFY)
export { checkLicense } from './checkLicense.js';
export { Watermark } from './Watermark.js';
export type { LicenseCheckResult } from './types.js';
```

```typescript
// stories/License.stories.tsx (NEW — CSF3)
import type { Meta, StoryObj } from '@storybook/react';
import { Watermark } from '../src/Watermark.js';
import { setLicenseState } from '../src/state.js';
import { checkLicense } from '../src/checkLicense.js';

const meta: Meta<typeof Watermark> = {
  title: 'grid-license/Watermark',
  component: Watermark,
};
export default meta;
type Story = StoryObj<typeof Watermark>;

// Mock: setLicenseState as seam (Ed25519 없이 상태 직접 주입)
export const Unlicensed: Story = {
  beforeEach() {
    // state null → getLicenseState → {valid:false}
  },
  render: () => {
    const result = checkLicense();
    return <Watermark required={result.watermarkRequired} />;
  },
};

export const Licensed: Story = {
  beforeEach() {
    setLicenseState({
      status: { valid: true, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
      rawKey: 'mock-key',
      setAt: Date.now(),
    });
  },
  render: () => {
    const result = checkLicense();
    return <Watermark required={result.watermarkRequired} />;
  },
};

export const SoonExpiring: Story = {
  beforeEach() {
    setLicenseState({
      status: { valid: true, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      rawKey: 'mock-key',
      setAt: Date.now(),
    });
  },
  render: () => {
    const result = checkLicense();
    return <Watermark required={result.watermarkRequired} />;
  },
};
```

---

## Section 6. 엣지 케이스 (Edge Cases)

| ID | 상황 | 기대 동작 | 비고 |
|----|------|----------|------|
| EC-01 | `setLicenseKey` 미호출 | `getLicenseState()` → `{valid:false, reason:'invalid'}`, `watermarkRequired:true` | G-001 D6 |
| EC-02 | async Ed25519 완료 전 Pro grid mount | `getLicenseState()` → `{valid:false}` → watermark 순간 노출 (~2ms) | **설계상 허용** — G-001 ADR-003 fire-and-forget 결정 상속. 버그 아님. |
| EC-03 | `expiresAt` undefined + valid:true | `expiryWarning` 없음, `watermarkRequired:false` | 영구 유효 라이선스 |
| EC-04 | 만료 정확히 60일 = `SIXTY_DAYS_MS` ms | `msLeft === SIXTY_DAYS_MS` → 경고 **미**발생 (strict `<`) | 경계값 |
| EC-05 | 만료 60일 이내 `checkLicense()` 2회+ 호출 | console.warn 최초 1회만 | `warned` 플래그 중복 방지 |
| EC-06 | `valid:false` + `expiresAt` 있음 (만료됨) | `watermarkRequired:true`, `expiresAt` 포함 반환, `expiryWarning` 없음 | 만료 라이선스 = 워터마크 우선 |
| EC-07 | SSR 환경에서 `<Watermark />` 렌더 | React 서버 사이드 렌더링 정상 동작 (Tailwind 클래스 의존 없음, SSR safe) | `null` or div 반환 |
| EC-08 | `checkLicense()` 호출 후 `setLicenseKey` 재호출 | 새 state 갱신됨. 다음 `checkLicense()` 호출 시 최신 결과 반환. `warned` 플래그는 유지 (EC-11 설계) | 정상 |

---

## Section 7. 구현 파일 진실표 (Truth Table — C-28 + C-30)

> **D1 — 경로 정정 (C-28)**: `license-goals.json` G-002 `implementFiles` 의 모든 경로가  
> `D:/project/topvel_project/TOMIS/packages/...` (오류) 로 기재되어 있음.  
> 정확한 경로는 **외부 저장소 (topvel-grid-monorepo) — TOMIS git 외부, ADR-MOD-GRID-00-001 상속** 경로이다:  
> `D:/project/topvel_project/topvel-grid-monorepo/packages/...`  
> 이 스펙의 모든 경로는 수정된 경로를 사용한다. (H-02 anchor)

| 상태 | 파일 경로 (수정 완료) | 역할 |
|------|--------------------|------|
| **NEW** | `topvel-grid-monorepo/packages/grid-license/src/checkLicense.ts` | `checkLicense(): LicenseCheckResult` 동기 함수 |
| **NEW** | `topvel-grid-monorepo/packages/grid-license/src/Watermark.tsx` | React 컴포넌트, Tailwind 전용 |
| **NEW** | `topvel-grid-monorepo/packages/grid-license/stories/License.stories.tsx` | CSF3 stories, setLicenseState mock seam |
| **MODIFY** | `topvel-grid-monorepo/packages/grid-license/src/types.ts` | `LicenseCheckResult`, `ExpiryWarning` 타입 추가 |
| **MODIFY** | `topvel-grid-monorepo/packages/grid-license/src/index.ts` | `checkLicense`, `Watermark`, `LicenseCheckResult` export 추가 |
| **MODIFY** | `topvel-grid-monorepo/packages/grid-license/package.json` | `peerDependencies` React 추가 (ADR-004) |
| **APPEND** | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-99-A-decisions.md` | ADR-004 추가 |
| **NO CHANGE** | topvel-grid-monorepo/packages/grid-license/tsup.config.ts | 이미 `external: ['react', 'react-dom']` 포함. JSX는 tsconfig.base.json `jsx: "react-jsx"` 처리. 수정 불필요. |

---

## Section 8. 패키지 설정 변경 (Package Config)

### 8.1 package.json MODIFY

G-001 후 현재 상태:
```json
{
  "name": "@tomis/grid-license",
  "version": "0.0.0",
  "type": "module",
  "license": "SEE LICENSE IN EULA"
}
```

G-002 후 (MODIFY):
```json
{
  "name": "@tomis/grid-license",
  "version": "0.0.0",
  "type": "module",
  "license": "SEE LICENSE IN EULA",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

**참조**: `grid-core/package.json` 패턴 (peerDependenciesMeta 없음 — mandatory peer).  
**ADR-004 참조**: React peer를 optional로 처리하지 않는 이유 → Section 10 ADR-004.

---

## Section 9. 테스트 계획 (Test Plan)

| 테스트 ID | 유형 | 파일 | 검증 대상 |
|----------|------|------|----------|
| T-001 | Unit | `checkLicense.test.ts` | AC-001: state null → `{valid:false, watermarkRequired:true}` |
| T-002 | Unit | `checkLicense.test.ts` | AC-002: 미래 expiresAt → `{valid:true, watermarkRequired:false}` |
| T-003 | Unit | `checkLicense.test.ts` | AC-003: 30일 후 expiresAt → `{valid:true, watermarkRequired:false, expiryWarning:'soon-expiring'}` + warn 1회 |
| T-004 | Unit | `checkLicense.test.ts` | EC-05: warn 중복 방지 (2회 호출 → console.warn 1회) |
| T-005 | Unit | `checkLicense.test.ts` | EC-04: `msLeft === SIXTY_DAYS_MS` → expiryWarning 없음 |
| T-006 | RTL | `Watermark.test.tsx` | AC-004: `required:true` 렌더 검증, `required:false` → null |
| T-007 | Snapshot | `Watermark.test.tsx` | 텍스트 `'Unlicensed @tomis/grid'`, Tailwind className 포함 |
| T-008 | JSON | CI/lint | AC-005: package.json peerDependencies 구조 검증 |

---

## Section 10. 아키텍처 결정 (ADR)

### ADR-MOD-GRID-99-A-004: React peerDependency 추가

**결정일**: 2026-05-15 (G-002 specify)  
**상태**: accepted  
**연관 Goal**: MOD-GRID-99-A/license/G-002  
**연관 constraint**: C-14 (외부 패키지 trade-off 문서화), C-20 (zero external dep), C-22 (React = peer)

**결정**  
`@tomis/grid-license` package.json에 React `peerDependencies` 추가:
```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```
`peerDependenciesMeta` 없음 (mandatory).

**사유**  
- G-002 `<Watermark />` React 컴포넌트 도입으로 runtime React 의존성 발생.  
- grid-core 패턴 동일 적용 — mandatory peer (peerDependenciesMeta 없음): Pro 패키지 소비자는 React를 항상 보유.  
- C-20: React를 `dependencies`에 넣으면 번들에 중복 포함 위험 → peer로 선언하여 소비자 React 재사용.  
- C-22: React는 peerDependencies 강제.

**대안**

1. **dependencies에 React 추가**: 번들에 React 중복 포함 → C-20 위반, 번들 크기 급증. 각하.
2. **peerDependenciesMeta optional: true**: `grid-license`가 React 없는 환경에서도 동작한다는 의미. `<Watermark />`는 React 필수이므로 optional 부적합. 각하.
3. **Watermark를 별도 패키지로 분리**: 추가 패키지 관리 오버헤드. G-002 scope 내 단순화 우선. 각하.

**Trade-off**

| Pro | Con |
|-----|-----|
| bundle 내 React 중복 없음 — C-20 완전 준수 | 소비자가 React 별도 설치 필요 (사실상 항상 설치됨) |
| grid-core 패턴 일관성 | peerDependencies 버전 충돌 시 소비자 resolve 필요 |
| React 18/19 모두 지원 | |

**결과**  
`package.json` peerDependencies 추가. `tsup.config.ts` 기존 `external: ['react', 'react-dom']` 이미 포함 — NO CHANGE.

---

## Section 11. 구현 전/후 비교 (Before/After)

### 11.1 types.ts

**Before (G-001 완료 상태)**:
```typescript
export type LicenseReason = 'invalid' | 'expired' | 'domain-mismatch';
export interface LicenseStatus { valid: boolean; reason?: LicenseReason; expiresAt?: Date; domain?: string; }
export interface LicenseState { status: LicenseStatus; rawKey: string; setAt: number; }
```

**After (G-002 MODIFY)**:
```typescript
export type LicenseReason = 'invalid' | 'expired' | 'domain-mismatch';
export interface LicenseStatus { valid: boolean; reason?: LicenseReason; expiresAt?: Date; domain?: string; }
export interface LicenseState { status: LicenseStatus; rawKey: string; setAt: number; }
// G-002 추가
export type ExpiryWarning = 'soon-expiring';
export interface LicenseCheckResult {
  valid: boolean;
  watermarkRequired: boolean;
  expiryWarning?: ExpiryWarning;
  expiresAt?: Date;
  reason?: LicenseReason;
}
```

### 11.2 index.ts

**Before**:
```typescript
export { setLicenseKey } from './setLicenseKey.js';
export type { LicenseStatus, LicenseReason } from './types.js';
```

**After**:
```typescript
export { setLicenseKey } from './setLicenseKey.js';
export { checkLicense } from './checkLicense.js';
export { Watermark } from './Watermark.js';
export type { LicenseStatus, LicenseReason, LicenseCheckResult } from './types.js';
```

### 11.3 package.json

**Before**: peerDependencies 없음  
**After**: Section 8.1 참조 (react + react-dom mandatory peer)

### 11.4 checkLicense.ts (NEW)

**Before**: 파일 없음  
**After**: Section 5.3 전체 구현

### 11.5 Watermark.tsx (NEW)

**Before**: 파일 없음  
**After**: Section 5.3 전체 구현

### 11.6 stories/License.stories.tsx (NEW)

**Before**: `stories/` 디렉토리 없음  
**After**: Section 5.3 CSF3 stories 구현

---

## Section 12. 검증 카테고리 처리 (Verify Category Handling)

### 12.1 카테고리 A (Unit/Integration 검증)

적용. Section 9 T-001~T-008 테스트 계획 완비.

### 12.2 카테고리 B (grid-component 동작 검증)

**N/A** — `checkLicense()` 및 `<Watermark />`는 그리드 컴포넌트가 아닌 **라이선스 런타임 유틸리티**다.  
TanStack Table / grid-core / grid-pro 그리드 렌더링 동작과 무관.  
`affectedUsageFiles: []` (goals.json AC-005 — 그리드 소비자 파일 변경 없음).  
카테고리 B 검증 항목(컬럼 렌더, 행 선택, 정렬 등)은 이 Goal과 관련 없음.

### 12.3 카테고리 C (affectedUsageFiles 소비자 영향)

**N/A** — `license-goals.json` G-002 `affectedUsageFiles: []`.  
기존 소비자 코드 변경 없음. `checkLicense`/`Watermark`는 신규 API이며 기존 호출자 없음.  
카테고리 C의 "기존 소비자 API 호환성" 검증 대상이 없음.

### 12.4 카테고리 D (신규 API 소비자 통합)

**N/A** — G-002는 API를 **신규 추가**하지만, 해당 API의 소비자 통합은 **G-003 범위**다.  
G-003이 grid-pro-* 패키지에서 `checkLicense()` + `<Watermark />`를 auto-require 방식으로 연동한다.  
G-002 단독 검증 시점에서 G-003 소비자 코드가 존재하지 않으므로 카테고리 D 검증 불가 + 불필요.

---

## Section 13. 구현자 지시사항 (Implementer Instructions)

### 13.1 구현 순서

1. `types.ts` MODIFY → `LicenseCheckResult`, `ExpiryWarning` 추가
2. `checkLicense.ts` NEW → Section 5.3 코드 그대로 구현
3. `Watermark.tsx` NEW → Section 5.3 코드 그대로 구현
4. `index.ts` MODIFY → Section 11.2 After 상태로 갱신
5. `package.json` MODIFY → Section 8.1 After 상태로 갱신
6. `stories/License.stories.tsx` NEW → Section 5.3 코드 구현
7. 단위 테스트 작성 (T-001~T-008)
8. `decisions.md` APPEND → Section 10 ADR-004 내용 추가

### 13.2 주의사항

- `checkLicense()` 는 **반드시 동기**. `Promise` / `async` 사용 금지.
- `warned` 플래그는 모듈 레벨 (`let warned = false`). 클래스나 closure 내부 아님.
- `exactOptionalPropertyTypes: true` — optional 프로퍼티 spread 시 undefined 직접 할당 금지. spread-skip 패턴 사용.
- `Watermark.tsx`에서 `import React from 'react'` 필요 (`react-jsx` transform이어도 JSX 타입 추론을 위해 명시).
- `tsup.config.ts` 변경 불필요 — react/react-dom 이미 external.
- `stories/` 디렉토리 신규 생성 필요 (`packages/grid-license/stories/`).

### 13.3 EC-02 처리 지침

async 검증 완료 전 Watermark 순간 노출은 **버그 아님**. G-001 ADR-003 (fire-and-forget) 설계 결정으로 수용됨.  
EC-02 관련 방어 코드 추가 금지.

---

## Appendix A. 관련 파일 참조

| 파일 | 역할 |
|------|------|
| `G-001-spec.md` | 선행 Goal 스펙 (setLicenseKey, verifySignature, state.ts 설계) |
| `MOD-GRID-99-A-decisions.md` | D1~D8, ADR-001~003 (G-001), ADR-004 (G-002 추가 예정) |
| `license-goals.json` | AC-001~005 원문 (G-002 객체) |
| `constraints.md` | C-1~C-35 전체 |
| `specify-rubric.md` | v1.0.9 채점 기준 |

---

## Appendix B. C-35 Spec Writer Self-Check

### B.1 동일 함수 시그니처 스캔 (checkLicense)

전체 spec에서 `checkLicense` 시그니처 출현 위치 및 일치 여부:

| 위치 | 시그니처 | 일치 |
|------|---------|------|
| Section 2.1 IN-SCOPE 표 | `checkLicense(): LicenseCheckResult` (동기) | ✓ |
| Section 4.1 업스트림 비고 | (직접 시그니처 기재 없음, 설계 원칙 기술) | N/A |
| Section 5.1 설계 원칙 | `checkLicense(): LicenseCheckResult` 는 순수 동기 함수 | ✓ |
| Section 5.3 Executable | `export function checkLicense(): LicenseCheckResult` | ✓ |
| Section 7 Truth Table | `checkLicense(): LicenseCheckResult` 동기 함수 | ✓ |
| Section 11.2 After | `export { checkLicense } from './checkLicense.js'` (타입 아님, export) | ✓ |
| Appendix B.1 본 표 | `checkLicense(): LicenseCheckResult` | ✓ |

**결론**: 모든 출현 위치에서 `checkLicense(): LicenseCheckResult` (동기, Promise 없음) 일관. 드리프트 없음.

### B.2 Import Usage 스캔 (코드 블록별)

#### checkLicense.ts (Section 5.3)

| Import | 사용 위치 | 사용 여부 |
|--------|----------|----------|
| `import type { LicenseCheckResult } from './types.js'` | 함수 반환 타입 `): LicenseCheckResult`, 변수 타입 `const result: LicenseCheckResult` | ✓ 사용 |
| `import { getLicenseState } from './state.js'` | 함수 본문 `const status = getLicenseState()` | ✓ 사용 |

미사용 import: **없음**. `LicenseStatus`, `LicenseState`, `LicenseReason` import 없음 (불필요).

#### Watermark.tsx (Section 5.3)

| Import | 사용 위치 | 사용 여부 |
|--------|----------|----------|
| `import React from 'react'` | JSX 변환 (`React.ReactElement` 반환 타입, JSX 런타임) | ✓ 사용 |

`./types.js` import 없음 — `WatermarkProps`는 파일 내 정의. 미사용 import 없음.

#### stories/License.stories.tsx (Section 5.3)

| Import | 사용 위치 | 사용 여부 |
|--------|----------|----------|
| `import type { Meta, StoryObj } from '@storybook/react'` | `Meta<typeof Watermark>`, `StoryObj<typeof Watermark>` | ✓ 사용 |
| `import { Watermark } from '../src/Watermark.js'` | `component: Watermark`, `Meta<typeof Watermark>`, JSX `<Watermark ...>` | ✓ 사용 |
| `import { setLicenseState } from '../src/state.js'` | `Licensed.beforeEach`, `SoonExpiring.beforeEach` | ✓ 사용 |
| `import { checkLicense } from '../src/checkLicense.js'` | `Unlicensed.render`, `Licensed.render`, `SoonExpiring.render` | ✓ 사용 |

미사용 import: **없음**.

#### types.ts After (Section 11.1)

| 신규 타입 | 사용 위치 | 검증 |
|----------|----------|------|
| `ExpiryWarning` | `LicenseCheckResult.expiryWarning?: ExpiryWarning` | ✓ 사용 |
| `LicenseCheckResult` | 타입 export (소비자 사용) | ✓ export됨 |
| `LicenseReason` | `LicenseCheckResult.reason?: LicenseReason` | ✓ 사용 (기존 타입 재사용) |

미사용 타입: **없음**.

### B.3 naCategoryHandling 명시 확인

| 카테고리 | 섹션 | N/A 명시 | 사유 기술 |
|---------|------|---------|---------|
| B (grid-component) | Section 12.2 | ✓ | 라이선스 런타임 유틸리티, 그리드 컴포넌트 아님 |
| C (affectedUsageFiles) | Section 12.3 | ✓ | `affectedUsageFiles: []`, 기존 소비자 없음 |
| D (신규 API 소비자) | Section 12.4 | ✓ | G-003 범위, 현재 소비자 코드 없음 |

**결론**: B/C/D 카테고리 N/A 사유 각각 명시 완료.

### B.4 Self-Check 최종 결과

13섹션 완비, C-35 self-check 통과, naCategoryHandling (B/C/D) 명시.
