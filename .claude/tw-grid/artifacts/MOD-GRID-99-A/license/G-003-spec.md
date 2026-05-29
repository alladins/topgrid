<!--
  @tomis/grid-license — G-003 Specification + Implementation Plan
  Goal: MOD-GRID-99-A / license / G-003
  Title: 각 grid-pro-* 패키지에 EULA.md + license 필드 + 자동 require 통합
  Author: tw-grid Spec Writer Agent
  Spec version: 1.0.0
  Rubric: specify-rubric.md v1.0.9 (threshold 90, impact low)
  C-35: Appendix B 자가 점검 포함
  C-36: Implementer Agent는 *-implement-score.json 작성 금지 (Coverage Verifier만 작성)
-->

# G-003 Spec — 각 grid-pro-* 패키지에 EULA.md + license 필드 + 자동 require 통합

## D# Decision Index

| D# | Title | Section |
|----|-------|---------|
| D1 | goals.json implementFiles prefix 정정 — `TOMIS/packages/` → `topvel-grid-monorepo/packages/` (C-28) | §7 |
| D2 | meta 패키지 `grid` 범위 제외 — G-003 AC-001 7개 Pro 패키지 한정; EULA.md 없는 grid는 후속 Goal로 이연 | §4 |
| D3 | 계단식 결함(Cascading Defect) 수정 방법 — Option A 채택: grid-pro-master 두 서브파일의 `verifyLicense` stale import를 제거하고 src/index.ts 모듈 레벨 `checkLicense()` 호출로 대체 | §5 |
| D4 | 릴리스 검증 스크립트 위치 — Option B 채택: monorepo 루트 `scripts/verify-license.mjs` (패키지별 중복 스크립트 금지) | §5 |
| D5 | `@tomis/grid-license` 의존성 종류 — `peerDependencies` → `dependencies` 전환 (7개 Pro 패키지 전부) | §5 |

**파일 변경 요약 (Section 7 Truth Table)**

| 상태 | 파일 | 위치 |
|------|------|------|
| NEW | `packages/grid-pro-master/EULA.md` | topvel-grid-monorepo/ |
| NEW | `packages/grid-core/LICENSE` | topvel-grid-monorepo/ |
| NEW | `packages/grid-renderers/LICENSE` | topvel-grid-monorepo/ |
| NEW | `packages/grid-export/LICENSE` | topvel-grid-monorepo/ |
| NEW | `packages/grid-features/LICENSE` | topvel-grid-monorepo/ |
| NEW | `scripts/verify-license.mjs` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-tracking/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-range/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-datamap/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-merging/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-header/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-agg/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-master/src/index.ts` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-tracking/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-range/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-datamap/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-merging/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-header/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-agg/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-master/package.json` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-master/src/MasterDetailGrid.tsx` | topvel-grid-monorepo/ |
| MODIFY | `packages/grid-pro-master/src/ContextMenuGrid.tsx` | topvel-grid-monorepo/ |
| APPEND | `.claude/tw-grid/decisions/MOD-GRID-99-A-decisions.md` | TOMIS/ |

**총 23개 파일 (NEW 6 + MODIFY 16 + APPEND 1)**

---

## Section 1 — Goal 개요

**Goal ID**: MOD-GRID-99-A/license/G-003  
**Title**: 각 grid-pro-* 패키지에 EULA.md + license 필드 + 자동 require 통합  
**Module**: MOD-GRID-99-A ("Pro 패키지 라이선스 검증 런타임")  
**Category**: license  
**Phase**: integration  
**License Tier**: Pro (`@tomis/grid-license`)  
**Migration Impact**: low  
**Spec Threshold**: 90 (low impact 기준, specify-rubric.md v1.0.9)  
**Depends On**: G-002 (checkLicense() + Watermark 구현) — COMPLETED  
**Priority**: P0

### 목표 설명

G-002가 구현한 `checkLicense(): LicenseCheckResult` 함수를 7개 Pro 패키지(`grid-pro-tracking`, `grid-pro-range`, `grid-pro-datamap`, `grid-pro-merging`, `grid-pro-header`, `grid-pro-agg`, `grid-pro-master`) 각각의 `src/index.ts` 모듈 레벨에서 자동 호출하도록 통합한다.

추가 작업:
1. grid-pro-master의 누락된 `EULA.md` 생성
2. 4개 MIT 패키지의 누락된 `LICENSE` 파일 생성 (MIT 전문 포함)
3. 계단식 결함 수정: grid-pro-master 두 서브파일의 stale `verifyLicense` import 제거
4. 릴리스 CI 검증 스크립트 작성 (`scripts/verify-license.mjs`)
5. 7개 Pro 패키지 `package.json`의 `@tomis/grid-license` 의존성 종류를 `dependencies`로 통일

**출처**: `license-goals.json` G-003 (AC-001~AC-005)

---

## Section 2 — 범위 및 인터페이스 (Scope & Interface)

### 2.1 IN-SCOPE

| 항목 | 설명 |
|------|------|
| 7개 Pro src/index.ts 수정 | 각 패키지 모듈 레벨에서 `checkLicense()` 자동 호출 추가 |
| 7개 Pro package.json 수정 | `@tomis/grid-license`를 `dependencies`에 추가 (peerDep/devDep 제거) |
| grid-pro-master EULA.md 생성 | 번호 섹션 형식 (Template 2, grid-pro-range 스타일 참고) |
| 4개 MIT 패키지 LICENSE 생성 | MIT 전문 포함 (grid-core, grid-renderers, grid-export, grid-features) |
| 계단식 결함 수정 (D3) | MasterDetailGrid.tsx + ContextMenuGrid.tsx의 stale `verifyLicense` import + 호출 제거 |
| grid-pro-master src/index.ts | 모듈 레벨 `checkLicense()` 호출 추가 + stale JSDoc 정정 |
| 릴리스 검증 스크립트 (D4) | `scripts/verify-license.mjs` — license + EULA/LICENSE 필드 검증, 누락 시 exit(1) |
| decisions.md APPEND (ADR-005, ADR-006) | 계단식 결함 결정 + 릴리스 스크립트 위치 결정 기록 |

### 2.2 OUT-OF-SCOPE

| 항목 | 이유 |
|------|------|
| meta 패키지 `grid`의 EULA.md | AC-001 7개 Pro 패키지 명시적 목록에 `grid` 미포함; EULA.md 없는 meta는 후속 Goal 이연 (D2) |
| Watermark 컴포넌트 수정 | G-002 완료된 범위 |
| `setLicenseKey` API 변경 | G-001 완료된 범위 |
| grid-pro-master MasterDetailGrid.tsx / ContextMenuGrid.tsx의 라이선스 비즈니스 로직 추가 | 계단식 결함 제거 후 src/index.ts 모듈 레벨 호출이 커버; 서브파일에 추가 비즈니스 로직 불필요 |
| CI 파이프라인 파일 (.github/workflows/*.yml) 수정 | 스크립트 생성 범위만; CI 연결은 DevOps 범위 |

---

## Section 3 — 사용처 현황 및 패턴 분류 (Usage Dispatch Table)

실측 기반 (각 파일 직접 Read 확인). C-19: `affectedUsageFiles=[]` — 적용 없음.

| 패키지 | 현재 패턴 | EULA.md 존재 | grid-license dep 위치 | 수행 작업 |
|--------|----------|-------------|----------------------|----------|
| grid-pro-tracking | **A**: inline `verifyOrWarn` stub + 호출 | ✅ 존재 | 없음 | stub 제거 → `checkLicense()` 호출 + package.json `dependencies` 추가 |
| grid-pro-range | **B**: 라이선스 검증 없음 | ✅ 존재 | 없음 | `checkLicense()` 호출 추가 + package.json `dependencies` 추가 |
| grid-pro-datamap | **A**: inline `verifyOrWarn` stub + 호출 | ✅ 존재 | 없음 | stub 제거 → `checkLicense()` 호출 + package.json `dependencies` 추가 |
| grid-pro-merging | **B**: 라이선스 검증 없음 | ✅ 존재 | peerDep optional | `checkLicense()` 호출 추가 + peerDep 제거 → `dependencies` 이동 |
| grid-pro-header | **A**: inline `verifyOrWarn` stub + 호출 | ✅ 존재 | peerDependenciesMeta only (mismatch) | stub 제거 → `checkLicense()` 호출 + peerDependenciesMeta 제거 → `dependencies` 추가 |
| grid-pro-agg | **B**: 라이선스 검증 없음 | ✅ 존재 | 없음 | `checkLicense()` 호출 추가 + package.json `dependencies` 추가 |
| grid-pro-master | **C**: stale `verifyLicense` import (서브파일), JSDoc stale | ❌ **누락** | peerDep + devDep | EULA.md 생성 + 서브파일 stale import 제거 + index.ts `checkLicense()` 추가 + peerDep/devDep 정리 → `dependencies` |

---

## Section 4 — 범위 경계 결정 (D2: meta grid 제외)

**D2: meta 패키지 `grid` EULA.md 이연**

`license-goals.json` AC-001은 7개 Pro 패키지를 명시한다:
`tracking`, `range`, `datamap`, `merging`, `header`, `agg`, `master`

meta 패키지 `grid`(`topvel-grid-monorepo/packages/grid/package.json`)의 현재 상태:
- `license: "SEE LICENSE IN EULA"` — 필드는 설정됨
- `EULA.md` — **없음**

이 불일치는 인지되나 AC-001 목록에 `grid`는 명시되지 않았다. meta 패키지의 EULA.md 내용은 Pro 7개와 동일 텍스트를 사용하거나 통합 EULA가 될 수 있으므로 별도 검토가 필요하다. G-003 범위에서 제외하고 후속 Goal(MOD-GRID-99-A/license/G-004 또는 별도 문서화 Goal)에서 처리한다.

**documentedDeviation**: G-003 spec이 AC-001 7개 패키지 목록을 strictly 준수하므로, meta `grid` 누락은 스펙 위반이 아님.

---

## Section 5 — 기술 결정 (Technical Decisions)

### D3: 계단식 결함 수정 방법 — Option A 채택

**배경**: G-001이 `verifyLicense` 함수를 `@tomis/grid-license`에서 export 제거 시 alias 미제공. grid-pro-master 두 서브파일이 stale import를 보유:
- `packages/grid-pro-master/src/MasterDetailGrid.tsx` L36: `import { verifyLicense } from '@tomis/grid-license';`
- `packages/grid-pro-master/src/ContextMenuGrid.tsx` L33: `import { verifyLicense } from '@tomis/grid-license';`

**선택지 비교**:

| 옵션 | 설명 | 채택 여부 |
|------|------|----------|
| Option A | 서브파일 stale import + 호출 제거; 라이선스 검증은 `src/index.ts` 모듈 레벨 `checkLicense()` 단일 지점으로 통합 | **채택** |
| Option B | `verifyLicense`를 `checkLicense`의 alias로 grid-license에 다시 추가 export | 거부: G-001 ADR 결론(export surface 최소화) 위반; 이미 COMPLETED된 G-001 범위 재오픈 |
| Option C | 서브파일에서 `verifyLicense` → `checkLicense`로 직접 대체 (서브파일에서 직접 import) | 거부: 서브파일마다 중복 호출 발생; 모듈 레벨 단일 호출 원칙 위반 |

**결론**: 서브파일에서 `verifyLicense` 관련 import 및 호출 라인을 제거. grid-pro-master `src/index.ts`의 모듈 레벨 `checkLicense()` 호출이 패키지 로드 시 단일 검증 지점을 제공하므로 기능 동등성을 충족한다.

**ADR 참조**: ADR-005 (이 문서 Section 11 + decisions.md APPEND)

---

### D4: 릴리스 검증 스크립트 위치 — Option B 채택

| 옵션 | 설명 | 채택 여부 |
|------|------|----------|
| Option A | 각 Pro 패키지별 검증 스크립트 (`scripts/verify-license.mjs` × 7) | 거부: 7개 중복, 유지보수 부담 |
| Option B | monorepo 루트 `scripts/verify-license.mjs` — 단일 스크립트가 전체 패키지 순회 | **채택** |
| Option C | `package.json` prepublishOnly 훅에 인라인 셸 커맨드 | 거부: 복잡한 검증 로직을 인라인으로 표현 불가, 가독성 불량 |

**스크립트 동작**:
1. `packages/` 하위 모든 `package.json` 파일 읽기
2. `license` 필드 존재 + 비어있지 않음 검증
3. `"SEE LICENSE IN EULA"` → 해당 디렉토리에 `EULA.md` 존재 확인
4. `"MIT"` → 해당 디렉토리에 `LICENSE` 파일 존재 확인
5. 누락 시 오류 메시지 출력 + `process.exit(1)`
6. 모두 통과 시 성공 메시지 + `process.exit(0)`

**ADR 참조**: ADR-006 (이 문서 Section 11 + decisions.md APPEND)

---

### D5: `@tomis/grid-license` 의존성 종류 전환

**현재 상태 (실측)**:

| 패키지 | 현재 위치 | 문제 |
|--------|----------|------|
| grid-pro-tracking | 없음 | 런타임 누락 |
| grid-pro-range | 없음 | 런타임 누락 |
| grid-pro-datamap | 없음 | 런타임 누락 |
| grid-pro-merging | peerDependencies (optional) | 선택적 peer → 런타임 미보장 |
| grid-pro-header | peerDependenciesMeta only (peerDependencies 목록 미포함 — mismatch) | 실질적으로 없음 |
| grid-pro-agg | 없음 | 런타임 누락 |
| grid-pro-master | peerDependencies + devDependencies | peer는 설치 보장 안됨 |

**결정**: 모든 7개 Pro 패키지에서 `@tomis/grid-license`를 `dependencies` 에 `"workspace:*"`로 추가.
- 기존 `peerDependencies` / `devDependencies` / `peerDependenciesMeta` 항목 제거 (해당하는 경우)
- 근거: C-22는 `@tomis/grid-license`를 mandatory peer 목록에 열거하지 않음; Pro 패키지는 grid-license 없이 동작 불가 → peer(선택적)가 아닌 direct dep이 맞음

**트레이드오프**:

| 측면 | peerDependencies | dependencies (채택) |
|------|------------------|---------------------|
| 설치 보장 | 호스트가 제공해야 함 (보장 없음) | 항상 설치됨 |
| 중복 설치 위험 | 없음 | 모노레포 workspace:* → 단일 인스턴스로 해결됨 |
| 번들 크기 | 포함 안됨 | +약 1KB per Pro 패키지 |
| 런타임 안정성 | 낮음 (누락 가능) | 높음 |

---

## Section 6 — 수용 기준 (Acceptance Criteria)

출처: `license-goals.json` G-003 AC-001~AC-005 (verbatim 인용 후 구현 세부 추가)

### AC-001: 7개 Pro 패키지 각 src/index.ts — checkLicense() 모듈 레벨 자동 호출

**대상**: grid-pro-tracking, grid-pro-range, grid-pro-datamap, grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master

**검증**:
- 각 `src/index.ts` 파일 상단에 `import { checkLicense } from '@tomis/grid-license';` 추가
- 모든 export 선언 이전(또는 이후지만 파일 최하단 아님) 모듈 레벨에서 `checkLicense();` 호출 존재
- Pattern A 패키지(tracking, datamap, header): 기존 `verifyOrWarn` stub 함수 및 호출 라인 제거 + JSDoc 업데이트
- Pattern B 패키지(range, merging, agg): import + 호출 라인 추가
- Pattern C 패키지(master): import + 호출 라인 추가 + stale JSDoc 수정

### AC-002: grid-pro-master EULA.md 생성

**위치**: `topvel-grid-monorepo/packages/grid-pro-master/EULA.md`

**내용 요구사항**:
- Template 2 형식 (번호 섹션: 1. License Grant, 2. Permitted Use, 3. Restrictions, 4. License Validation)
- 참고: `packages/grid-pro-range/EULA.md` 구조
- 패키지명 `@tomis/grid-pro-master` 명시

### AC-003: 4개 MIT 패키지 LICENSE 파일 생성

**대상**: grid-core, grid-renderers, grid-export, grid-features

**내용 요구사항**:
- MIT License 전문 (Copyright 연도 + 저작권자 포함)
- 형식: `LICENSE` (확장자 없음)

### AC-004: 7개 Pro 패키지 package.json — `dependencies`에 `@tomis/grid-license: "workspace:*"` 추가

**검증**:
- `dependencies` 섹션에 `"@tomis/grid-license": "workspace:*"` 항목 존재
- 기존 peerDependencies/devDependencies/peerDependenciesMeta의 grid-license 항목 제거

### AC-005: 릴리스 CI 검증 — scripts/verify-license.mjs 실행 시 누락 패키지 있으면 exit(1)

**검증**:
- `topvel-grid-monorepo/scripts/verify-license.mjs` 파일 존재
- 실행: `node scripts/verify-license.mjs`
- license 필드 없는 패키지 → exit(1)
- "SEE LICENSE IN EULA" 패키지에 EULA.md 없음 → exit(1)
- "MIT" 패키지에 LICENSE 없음 → exit(1)
- 모든 패키지 통과 → exit(0)

---

## Section 7 — 구현 파일 Truth Table (C-28, C-30 준수)

> **D1 (C-28)**: goals.json의 `implementFiles` 경로는 `D:/project/topvel_project/TOMIS/packages/`를 사용하나, 실제 경로는 `D:/project/topvel_project/topvel-grid-monorepo/packages/`이다. 이하 모든 경로는 실제 경로를 사용한다.

| # | 상태 | 절대 경로 | 변경 요약 |
|---|------|----------|----------|
| 1 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/EULA.md` | Template 2 EULA 생성 |
| 2 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/LICENSE` | MIT 전문 |
| 3 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/LICENSE` | MIT 전문 |
| 4 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/LICENSE` | MIT 전문 |
| 5 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/LICENSE` | MIT 전문 |
| 6 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/scripts/verify-license.mjs` | 릴리스 검증 스크립트 |
| 7 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | verifyOrWarn stub 제거 + checkLicense() 추가 |
| 8 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/src/index.ts` | checkLicense() import + 호출 추가 |
| 9 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/index.ts` | verifyOrWarn stub 제거 + checkLicense() 추가 |
| 10 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/src/index.ts` | checkLicense() import + 호출 추가 |
| 11 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/index.ts` | verifyOrWarn stub 제거 + checkLicense() 추가 |
| 12 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` | checkLicense() import + 호출 추가 |
| 13 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/index.ts` | checkLicense() 추가 + stale JSDoc 정정 |
| 14 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/package.json` | @tomis/grid-license → dependencies |
| 15 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/package.json` | @tomis/grid-license → dependencies |
| 16 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/package.json` | @tomis/grid-license → dependencies |
| 17 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/package.json` | peerDep 제거 + dependencies 추가 |
| 18 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/package.json` | peerDependenciesMeta 제거 + dependencies 추가 |
| 19 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/package.json` | @tomis/grid-license → dependencies |
| 20 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/package.json` | peerDep/devDep 제거 + dependencies 추가 |
| 21 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx` | stale verifyLicense import + 호출 제거 |
| 22 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/src/ContextMenuGrid.tsx` | stale verifyLicense import + 호출 제거 |
| 23 | APPEND | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-99-A-decisions.md` | ADR-005 + ADR-006 추가 |

**총 23개 파일 (NEW 6 + MODIFY 16 + APPEND 1)**

---

## Section 8 — Before/After 코드 스니펫

### 8.1 Pattern A (tracking/datamap/header) Before → After

**Before** (`grid-pro-tracking/src/index.ts` 발췌):
```typescript
// G-002 will replace this stub with the real checkLicense() implementation.
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-tracking');

export { TrackingGrid } from './TrackingGrid.js';
// ... (other exports)
```

**After** (`grid-pro-tracking/src/index.ts`):
```typescript
import { checkLicense } from '@tomis/grid-license';

checkLicense();

export { TrackingGrid } from './TrackingGrid.js';
// ... (other exports)
```

### 8.2 Pattern B (range/merging/agg) Before → After

**Before** (`grid-pro-range/src/index.ts` 발췌):
```typescript
export { RangeSelectionGrid } from './RangeSelectionGrid.js';
// ... (no license verification code)
```

**After** (`grid-pro-range/src/index.ts`):
```typescript
import { checkLicense } from '@tomis/grid-license';

checkLicense();

export { RangeSelectionGrid } from './RangeSelectionGrid.js';
// ... (other exports)
```

### 8.3 Pattern C (master) — 서브파일 수정 Before → After

**Before** (`grid-pro-master/src/MasterDetailGrid.tsx` L35-38 발췌):
```typescript
import { verifyLicense } from '@tomis/grid-license';  // ← STALE (G-001에서 export 제거됨)

// ...
verifyLicense('@tomis/grid-pro-master');
```

**After** (`grid-pro-master/src/MasterDetailGrid.tsx`):
```typescript
// verifyLicense import 및 호출 라인 제거됨.
// 라이선스 검증은 packages/grid-pro-master/src/index.ts 모듈 레벨 checkLicense() 단일 지점에서 수행.
```

**Before** (`grid-pro-master/src/index.ts` JSDoc 발췌):
```typescript
/**
 * @tomis/grid-pro-master
 * @see verifyLicense (called at module level in MasterDetailGrid.tsx + ContextMenuGrid.tsx)
 */
```

**After** (`grid-pro-master/src/index.ts`):
```typescript
import { checkLicense } from '@tomis/grid-license';

checkLicense();

// export 선언들...
```

### 8.4 package.json 수정 (grid-pro-merging 예시)

**Before**:
```json
{
  "peerDependencies": {
    "@tomis/grid-license": "*"
  },
  "peerDependenciesMeta": {
    "@tomis/grid-license": { "optional": true }
  }
}
```

**After**:
```json
{
  "dependencies": {
    "@tomis/grid-license": "workspace:*"
  }
}
```
*(peerDependencies + peerDependenciesMeta의 grid-license 항목 제거)*

---

## Section 9 — 번들 영향도 (Bundle Impact)

**출처**: `license-goals.json` G-003 `bundleImpact: "+1 KB per Pro package"`

| 항목 | 영향 |
|------|------|
| `@tomis/grid-license` 추가 | +약 1KB (minified) per Pro 패키지 (grid-license 자체 크기) |
| `verifyOrWarn` stub 제거 (Pattern A 3개 패키지) | 미미한 감소 (~50B) |
| **순 영향** | Pattern A: ≈ +950B / Pattern B: ≈ +1KB / Pattern C: ≈ +1KB |

grid-license는 React를 peerDep으로 선언하므로 번들 중복 없음. `.size-limit.json`이 monorepo 루트에 존재하므로 별도 패키지 레벨 항목 추가 불필요 (grid-pro-master 포함).

---

## Section 10 — 엣지 케이스 및 제약 (Edge Cases & Constraints)

| 케이스 | 처리 방법 |
|--------|----------|
| 모듈 레벨 `checkLicense()` 중복 호출 (여러 Pro 패키지 동시 import) | `warned` 플래그가 grid-license 모듈 레벨에 위치 → 싱글턴 보장. 경고는 최대 1회. |
| SSR 환경 (`window` undefined) | G-002/G-001 결정 ADR-002에서 처리됨. checkLicense() 내부에서 domain check skip. G-003 변경 불필요. |
| pnpm workspace:* 해석 | monorepo 내에서 workspace:*는 항상 로컬 패키지를 참조. publish 전 실제 버전으로 대체됨 (pnpm의 기본 동작). |
| grid-pro-master 두 서브파일의 verifyLicense 호출 제거 후 검증 누락 | 서브파일 컴포넌트는 React 컴포넌트 — 사용자가 해당 컴포넌트를 import할 때 이미 src/index.ts가 모듈 레벨에서 checkLicense() 실행 완료됨. 기능 동등성 충족. |
| MIT LICENSE 파일 저작권자 | "Topvel Inc." 또는 프로젝트 표준 저작권자 사용. MIT 라이선스 전문 형식 준수. |
| Pattern A JSDoc 스탈링 | G-002 "replace this stub" JSDoc도 함께 제거. 새 JSDoc 없음 (불필요). |

---

## Section 11 — ADR 추가 (ADR-005, ADR-006)

아래 두 ADR을 `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-99-A-decisions.md`에 APPEND한다.

---

### ADR-005: grid-pro-master 계단식 결함 수정 방법 (G-003)

**날짜**: 2026-05-15  
**상태**: 결정됨  
**Goal**: MOD-GRID-99-A/license/G-003

**배경**

G-001이 `verifyLicense`를 grid-license에서 export 제거할 때 alias를 제공하지 않았다. grid-pro-master의 두 서브파일(`MasterDetailGrid.tsx`, `ContextMenuGrid.tsx`)이 `import { verifyLicense } from '@tomis/grid-license'`를 보유한 채 G-002 review까지 발견되지 않았다. 이를 "계단식 결함(cascading defect)"으로 분류하고 G-003에서 처리한다.

**결정**

Option A: 서브파일에서 `verifyLicense` import + 호출을 제거하고, 라이선스 검증 책임을 `grid-pro-master/src/index.ts` 모듈 레벨 `checkLicense()` 단일 호출로 통합한다.

**대안 비교**

| 옵션 | 결과 | 거부 이유 |
|------|------|----------|
| Option A (채택) | 서브파일 제거 + index.ts 단일 호출 | — |
| Option B | `verifyLicense` alias를 grid-license에 다시 추가 | G-001 COMPLETED 재오픈; export surface 최소화 ADR 위반 |
| Option C | 서브파일에서 verifyLicense → checkLicense 직접 교체 | 서브파일마다 중복 호출; 모듈 진입점 단일 책임 원칙 위반 |

**트레이드오프**

- 장점: G-001/G-002 이미 완료된 결정 존중; 코드베이스 일관성 유지; 검증 지점 단일화
- 단점: 서브파일 내 "자체 검증" 없음 — 하지만 ES 모듈 시스템상 패키지 진입점(index.ts) 로드가 서브파일보다 선행 또는 동시 보장

**결과**

MasterDetailGrid.tsx L36 + ContextMenuGrid.tsx L33의 stale import 및 관련 호출 제거. grid-pro-master/src/index.ts에 checkLicense() 추가.

---

### ADR-006: 릴리스 검증 스크립트 위치 (G-003)

**날짜**: 2026-05-15  
**상태**: 결정됨  
**Goal**: MOD-GRID-99-A/license/G-003

**배경**

AC-005는 릴리스 CI 단계에서 license + EULA/LICENSE 필드 자동 검증을 요구한다. 스크립트 위치를 결정해야 한다.

**결정**

Option B: monorepo 루트 `scripts/verify-license.mjs` — 단일 스크립트가 `packages/` 하위 전체 순회.

**대안 비교**

| 옵션 | 결과 | 거부 이유 |
|------|------|----------|
| Option A | 패키지별 스크립트 × 7 | 중복 7배; 패키지 추가 시 누락 위험 |
| Option B (채택) | 루트 단일 스크립트 | — |
| Option C | package.json prepublishOnly 인라인 | 복잡한 로직 인라인 불가; 가독성/유지보수 불량 |

**트레이드오프**

- 장점: 단일 유지보수 지점; 새 패키지 자동 포함; CI 연결 단순
- 단점: monorepo 루트에 스크립트 디렉토리 추가 (기존 `scripts/` 디렉토리 존재 여부와 무관하게 생성)

**결과**

`topvel-grid-monorepo/scripts/verify-license.mjs` 생성. CI에서 `node scripts/verify-license.mjs`로 실행.

---

## Section 12 — 구현 지시사항 (Implementation Instructions)

> **C-36**: Implementer Agent는 `*-implement-score.json` 파일을 작성해서는 안 된다. score JSON은 Coverage Verifier Agent만 작성한다.

### 12.1 구현 순서 (Dependencies 있음)

1. **decisions.md APPEND** (ADR-005, ADR-006) — 선행 조건 없음
2. **grid-pro-master EULA.md 생성** (NEW) — 선행 조건 없음
3. **4개 MIT LICENSE 파일 생성** (NEW) — 선행 조건 없음
4. **7개 Pro package.json 수정** (MODIFY) — grid-license dep 추가
5. **grid-pro-master 서브파일 수정** (MODIFY) — D3 결함 수정 (ADR-005 확인 후)
6. **7개 Pro src/index.ts 수정** (MODIFY) — package.json 수정 완료 후
7. **scripts/verify-license.mjs 생성** (NEW) — 6단계 이후 검증 실행

### 12.2 각 수정 파일별 정확한 변경 내용

#### src/index.ts 공통 패턴 (Pattern A — tracking, datamap, header)

추가:
```typescript
import { checkLicense } from '@tomis/grid-license';
checkLicense();
```

제거:
```typescript
// 아래 블록 전체 제거 (함수 선언 + 호출 + 관련 JSDoc 주석)
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-{name}');
```

#### src/index.ts 공통 패턴 (Pattern B — range, merging, agg)

추가 (파일 최상단 import 섹션):
```typescript
import { checkLicense } from '@tomis/grid-license';
```

추가 (import 다음 줄, export 선언 이전):
```typescript
checkLicense();
```

#### grid-pro-master/src/index.ts (Pattern C)

추가 (import 섹션):
```typescript
import { checkLicense } from '@tomis/grid-license';
```

추가 (module level):
```typescript
checkLicense();
```

제거: stale JSDoc (`@see verifyLicense (called at module level in MasterDetailGrid.tsx + ContextMenuGrid.tsx)`)

#### grid-pro-master/src/MasterDetailGrid.tsx

제거: `import { verifyLicense } from '@tomis/grid-license';` (L36)  
제거: `verifyLicense('@tomis/grid-pro-master');` 호출 라인 (위치 확인 후)

#### grid-pro-master/src/ContextMenuGrid.tsx

제거: `import { verifyLicense } from '@tomis/grid-license';` (L33)  
제거: `verifyLicense('@tomis/grid-pro-master');` 호출 라인 (위치 확인 후)

### 12.3 EULA.md 형식 (Template 2 — grid-pro-master)

```markdown
# End User License Agreement (EULA) — @tomis/grid-pro-master

This End User License Agreement ("Agreement") governs your use of the @tomis/grid-pro-master package.

## 1. License Grant

Subject to the terms of this Agreement and a valid license key issued by Topvel Inc., you are granted a non-exclusive, non-transferable license to use @tomis/grid-pro-master in your applications.

## 2. Permitted Use

You may use this software to build internal or commercial applications, provided that a valid license key is activated via `setLicenseKey()` from `@tomis/grid-license`.

## 3. Restrictions

You may not:
- Redistribute or sublicense this package without written permission from Topvel Inc.
- Remove or alter license verification logic or watermark display.
- Use this package without a valid license key in production environments.

## 4. License Validation

This package automatically validates your license key at module load time using `@tomis/grid-license`. Invalid or expired keys result in a watermark being displayed.

For license inquiries, contact: license@topvel.io
```

### 12.4 MIT LICENSE 파일 형식 (4개 패키지 동일)

```
MIT License

Copyright (c) 2024 Topvel Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 12.5 scripts/verify-license.mjs 구조

```javascript
#!/usr/bin/env node
// scripts/verify-license.mjs
// 릴리스 검증: 모든 패키지의 license 필드 + EULA.md/LICENSE 파일 존재 확인
// Usage: node scripts/verify-license.mjs
// Exit 0: 모두 통과 | Exit 1: 누락 발견

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '..', 'packages');

// 패키지 순회
const packages = readdirSync(packagesDir).filter(name => {
  const pkgPath = join(packagesDir, name, 'package.json');
  return existsSync(pkgPath) && statSync(join(packagesDir, name)).isDirectory();
});

let errors = [];

for (const pkgName of packages) {
  const pkgDir = join(packagesDir, pkgName);
  const pkgJsonPath = join(pkgDir, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

  // license 필드 확인
  if (!pkgJson.license) {
    errors.push(`[MISSING license field] ${pkgJson.name ?? pkgName}`);
    continue;
  }

  // SEE LICENSE IN EULA → EULA.md 확인
  if (pkgJson.license === 'SEE LICENSE IN EULA') {
    if (!existsSync(join(pkgDir, 'EULA.md'))) {
      errors.push(`[MISSING EULA.md] ${pkgJson.name ?? pkgName}`);
    }
  }

  // MIT → LICENSE 확인
  if (pkgJson.license === 'MIT') {
    if (!existsSync(join(pkgDir, 'LICENSE'))) {
      errors.push(`[MISSING LICENSE] ${pkgJson.name ?? pkgName}`);
    }
  }
}

if (errors.length > 0) {
  console.error('[verify-license] FAILED:');
  errors.forEach(e => console.error(' ', e));
  process.exit(1);
} else {
  console.log(`[verify-license] PASSED: ${packages.length} packages OK`);
  process.exit(0);
}
```

---

## Section 13 — 참조 증거 (Reference Evidence)

> H-01: 아래 경로는 실측 확인된 실존 파일이다.

| 참조 | 실제 경로 | 용도 |
|------|----------|------|
| checkLicense() 함수 시그니처 | `topvel-grid-monorepo/packages/grid-license/src/checkLicense.ts` | AC-001 구현 기반 |
| grid-license index.ts (export 목록) | `topvel-grid-monorepo/packages/grid-license/src/index.ts` | verifyLicense 미export 확인 |
| verifyOrWarn stub (Pattern A) | `topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | Before/After 기준 |
| stale import (MasterDetailGrid) | `topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx` L36 | D3 cascading defect |
| stale import (ContextMenuGrid) | `topvel-grid-monorepo/packages/grid-pro-master/src/ContextMenuGrid.tsx` L33 | D3 cascading defect |
| EULA Template 2 | `topvel-grid-monorepo/packages/grid-pro-range/EULA.md` | grid-pro-master EULA 형식 참고 |
| goals.json G-003 정의 | `TOMIS/.claude/tw-grid/goals/MOD-GRID-99-A/license-goals.json` | AC-001~005, implementFiles, bundleImpact |
| 선행 ADR | `TOMIS/.claude/tw-grid/decisions/MOD-GRID-99-A-decisions.md` | ADR-001~004 |
| specify-rubric.md v1.0.9 | `TOMIS/.claude/tw-grid/rubric/specify-rubric.md` | 평가 기준 |
| constraints.md C-1~C-36 | `TOMIS/.claude/tw-grid/constraints.md` | 모든 제약사항 |

---

## Appendix A — 구현 후 검증 체크리스트

Implementer Agent가 완료 선언 전 확인해야 할 항목:

- [ ] 7개 Pro src/index.ts 각각에 `import { checkLicense } from '@tomis/grid-license'` + `checkLicense()` 호출 존재
- [ ] Pattern A 3개 파일에서 `verifyOrWarn` 함수 선언 + 호출 + 관련 JSDoc 제거
- [ ] grid-pro-master/src/index.ts의 stale JSDoc(`@see verifyLicense ...`) 제거
- [ ] MasterDetailGrid.tsx L36 `import { verifyLicense }` 제거 확인
- [ ] ContextMenuGrid.tsx L33 `import { verifyLicense }` 제거 확인
- [ ] 7개 Pro package.json에 `"@tomis/grid-license": "workspace:*"` in `dependencies`
- [ ] grid-pro-merging, grid-pro-header, grid-pro-master의 기존 peerDep/devDep grid-license 항목 제거
- [ ] grid-pro-master/EULA.md 생성 (Template 2 형식)
- [ ] grid-core/LICENSE, grid-renderers/LICENSE, grid-export/LICENSE, grid-features/LICENSE 생성 (MIT 전문)
- [ ] scripts/verify-license.mjs 생성 + 실행 시 exit(0) 확인
- [ ] decisions.md에 ADR-005 + ADR-006 APPEND 확인
- [ ] **C-36 준수**: *-implement-score.json 파일 미작성 (Coverage Verifier 전담)

---

## Appendix B — C-35 Spec Writer 자가 점검

**C-35 의무**: 동일 함수 시그니처 스캔 + import 사용 스캔을 통해 stale 참조가 없음을 확인한다.

### B-1. checkLicense() 시그니처 스캔

실측 확인 (`grid-license/src/checkLicense.ts`):

```typescript
export function checkLicense(): LicenseCheckResult
```

G-003 스펙이 참조하는 호출 방식: `checkLicense()` (인수 없음, 반환값 무시)

일치 여부: ✅ 시그니처 일치. `verifyOrWarn(_packageName: string)` 패턴을 `checkLicense()`로 교체할 때 인수 불일치 없음.

### B-2. verifyLicense import 사용 스캔

grid-license `src/index.ts` 실측 export 목록:
- `setLicenseKey` ✅
- `checkLicense` ✅
- `Watermark` ✅
- `LicenseStatus`, `LicenseReason`, `LicenseCheckResult` (type) ✅
- `verifyLicense` ❌ **미export**

G-003 스펙이 제거를 지시하는 stale import:
- MasterDetailGrid.tsx L36: `import { verifyLicense } from '@tomis/grid-license'` → **제거 지시** ✅
- ContextMenuGrid.tsx L33: `import { verifyLicense } from '@tomis/grid-license'` → **제거 지시** ✅

G-003 스펙이 새로 추가하는 import: `import { checkLicense } from '@tomis/grid-license'` → grid-license가 export하므로 ✅

### B-3. peerDep→dep 이행 일관성 스캔

스펙 내 모든 package.json 수정 지시가 `"@tomis/grid-license": "workspace:*"`를 `dependencies`에 추가하고 기존 peerDependencies/devDependencies 항목을 제거하는 방향으로 일관됨 ✅

### B-4. Truth Table vs Section 3 일관성 (C-30)

Section 3 패턴 분류 7개 패키지 × Section 7 Truth Table 파일 수 대조:

| 패키지 | Section 3 작업 | Section 7 src/index.ts | Section 7 package.json |
|--------|--------------|----------------------|----------------------|
| tracking | stub 제거 + checkLicense() | #7 ✅ | #14 ✅ |
| range | checkLicense() 추가 | #8 ✅ | #15 ✅ |
| datamap | stub 제거 + checkLicense() | #9 ✅ | #16 ✅ |
| merging | checkLicense() 추가 | #10 ✅ | #17 ✅ |
| header | stub 제거 + checkLicense() | #11 ✅ | #18 ✅ |
| agg | checkLicense() 추가 | #12 ✅ | #19 ✅ |
| master | checkLicense() + stale 수정 | #13 ✅ | #20 ✅ |

Section 3 서브파일 수정 → Section 7 #21 MasterDetailGrid.tsx, #22 ContextMenuGrid.tsx ✅

**자가 점검 결과**: TBD/TODO 없음, stale import 제거 지시 일관, 시그니처 일치, Truth Table = 23개 ✅
