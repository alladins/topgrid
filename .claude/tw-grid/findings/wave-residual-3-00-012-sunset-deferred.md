# ADR-MOD-GRID-00-012 Sunset — Deferred 보고서

**실행일**: 2026-05-17
**Wave**: residual-3 (잔존 3 — ADR-012 Sunset 의존성 점검)
**상태**: deferred (의존성 미충족)
**원본 ADR**: `ADR-MOD-GRID-00-012` (`MOD-GRID-00-decisions.md:630`)
**관련 spec**: `wave5-adr-017-spec.md` §2.1 (inline stub 인벤토리 출처)

---

## Step 1 — MOD-GRID-99-A/G-002 출하 여부 점검 결과

| 점검 항목 | 기대값 | 실제값 | 판정 |
|-----------|--------|--------|------|
| `grid-license/src/index.ts` export: `verifyGridLicense` | 존재 | **0 hits** | FAIL |
| `grid-license/src/index.ts` export: `verifyOrWarn` | 존재 | **0 hits** | FAIL |
| MOD-GRID-99-A/G-002 `overallStatus` | completed | completed | PASS |

**판정: 출하 partial** — G-002 는 완료(`overallStatus: "completed"`, 2026-05-15)되었으나, 출하된 API 명칭이 ADR-012 Sunset Step 1 이 요구하는 `verifyGridLicense` / `verifyOrWarn` 와 불일치.

G-002 가 실제 출하한 `grid-license` public API (`src/index.ts` 확인):
```
export { checkLicense }          ← 기능적으로 동등한 실 구현체 (LicenseCheckResult 반환)
export { Watermark }
export { useLicenseStatus }
export { useWatermarkEnforcement }
export { subscribeLicense }
export type { LicenseStatus, LicenseReason, LicenseCheckResult }
```

`verifyGridLicense` 와 `verifyOrWarn` 은 grid-license 어디에도 존재하지 않음.

### 근본 원인 — ADR-012 명칭 불일치 (stale naming)

ADR-MOD-GRID-00-012 는 2026-05-15 (MOD-GRID-12/G-001 self-review) 작성 당시 G-002 출하 예정 API 명칭을 `verifyGridLicense` / `verifyOrWarn` 으로 예측함. G-002 는 이후 `checkLicense` (동기 호출, `LicenseCheckResult` 반환) + `useLicenseStatus` (React hook) + `useWatermarkEnforcement` (portal singleton) 로 구현 완료. 명칭 불일치는 G-002 결함이 아니라 ADR-012 선행 작성 시점의 예측 오류.

---

## 인라인 Stub 인벤토리 (ADR-012 Sunset 대상 — sweep 보류)

ADR-012 §"Empirical Evidence" + wave5-adr-017-spec.md §2.1 교차 확인 결과 **8개 인라인 no-op stub** 잔존:

| # | 패키지 | 파일 | 함수명 | 유형 |
|---|--------|------|--------|------|
| 1 | `grid-pro-agg` | `src/AggregationGrid.tsx` | `verifyOrWarn` | inline no-op |
| 2 | `grid-pro-merging` | `src/MergingGrid.tsx` | `verifyOrWarn` | inline no-op |
| 3 | `grid-pro-range` | `src/DragFillHandle.tsx` | `_verifyGridLicenseStub` | inline no-op |
| 4 | `grid-pro-range` | `src/useCellRange.ts` | `_verifyGridLicenseStub` | inline no-op |
| 5 | `grid-pro-range` | `src/useClipboard.ts` | `_verifyGridLicenseStub` | inline no-op |
| 6 | `grid-pro-range` | `src/useKeyboardEdit.ts` | `_verifyGridLicenseStub` | inline no-op |
| 7 | `grid-pro-range` | `src/useKeyboardNav.ts` | `_verifyGridLicenseStub` | inline no-op |
| 8 | `grid-pro-range` | `src/useKeyboardEdit.ts` | (중복 파일 — 인벤토리 확정 시 재확인) | inline no-op |

> **주의**: wave5-adr-017-spec.md §2.1 목록을 1차 출처로 삼음. grid-pro-range 내 정확한 파일 목록은 sweep 실행 직전 grep 재확인 필요.

### 비-sweep 대상 (잔존 아님 — 이미 기능 구현 완료)

7개 Pro 패키지 `index.ts` 의 다음 패턴은 **ADR-012 인라인 stub 범위 외**:

```typescript
import { checkLicense } from '@tomis/grid-license';
checkLicense();
```

이 패턴은 MOD-GRID-99-A/G-003 에서 구현된 **실제 기능 동작 코드** (real import, real call). no-op stub 이 아님. sweep 대상 아님.

(ADR-001 wave2-adr-001-result.md known-limit #4 에서 "ADR-015 sweep 대상"으로 언급된 것은 별도 컨텍스트 — module-load side-effect 패턴의 아키텍처 리뷰 여부, ADR-012 Sunset scope 아님.)

---

## 해결 경로 (2가지 — 선택은 사용자/다음 cycle)

### 경로 A — alias export 신설 (ADR-012 문언 보존)

새 Goal (예: MOD-GRID-99-A/G-005 또는 MOD-GRID-00 유지보수 Goal) 에서:
1. `grid-license/src/index.ts` 에 alias export 추가:
   ```typescript
   // ADR-012 Sunset compatibility alias
   export { checkLicense as verifyOrWarn } from './checkLicense.js';
   ```
2. 추가 후 ADR-012 Sunset step 1 조건 충족 → 즉시 sweep 실행 가능.

장점: ADR-012 문언 변경 없음. 기존 spec/verify 문서 보존.  
단점: alias export 추가 작업 (소규모 Goal). `verifyOrWarn` 명칭이 API 에 노출됨.

### 경로 B — ADR-012 Sunset step 재정의 (즉시 sweep 가능)

ADR-MOD-GRID-00-012 Sunset step 1 + step 3 을 현실 반영:
- Step 1 수정: "`verifyGridLicense` 또는 `verifyOrWarn`" → "`checkLicense` (또는 기능 동등 export)"
- Step 3 수정: `import { verifyOrWarn }` → `import { checkLicense }` + 호출 패턴 결정

ADR-012 amendment 후 → G-002 is considered Sunset 조건 충족 → sweep 즉시 실행 가능 (별도 Goal 불필요).

장점: 추가 Goal 없이 즉시 sweep 가능. `checkLicense` = 이미 출하 완료된 표준 API.  
단점: ADR-012 문언 변경 → audit trail 명시 필요.

---

## Sweep 시 예상 작업 (경로 A 또는 B 확정 후)

1. 8개 인라인 stub 함수 제거 (verifyOrWarn / _verifyGridLicenseStub 함수 선언 삭제)
2. 각 파일 상단에 `import { checkLicense } from '@tomis/grid-license'` 추가 (경로 B 기준)
3. `verifyOrWarn(...)` / `_verifyGridLicenseStub(...)` 호출부를 `checkLicense()` 호출로 교체
4. 해당 패키지 `package.json` `dependencies` 에 `@tomis/grid-license: workspace:*` 확인 (wave2 ADR-001 Phase 5에서 이미 검증됨 — peerDep 보정 불요 확인)
5. `pnpm -r typecheck` PASS 확인
6. `pnpm --filter "./packages/**" -r build` PASS 확인
7. ADR-012 + C-33 에 deprecated marker 추가

예상 소요: ~30 min (ADR-012 §Trade-off 추정치 일치)

---

## 다음 단계

- 사용자가 경로 A 또는 경로 B 결정 → 후속 cycle 에서 sweep 실행
- ADR-MOD-GRID-00-012 본문에 "Sunset deferred" 주석 추가 (Step 6 amendment — 본 보고서 작성 직후 실행)
- (선택) wave-residual-3-00-012-sunset-result.md 는 sweep 완료 후 작성

---

## 검증 결과 (Step 1 only)

| 검증 | 결과 |
|------|------|
| `grid-license/src/index.ts` `verifyGridLicense` export 확인 | **ABSENT** (0 hits) |
| `grid-license/src/index.ts` `verifyOrWarn` export 확인 | **ABSENT** (0 hits) |
| `grid-license/src/checkLicense.ts` 기능 동등 함수 확인 | **EXISTS** — `export function checkLicense(): LicenseCheckResult` |
| 인라인 stub 8건 존재 확인 | **CONFIRMED** (wave5-adr-017-spec §2.1) |
| 7 Pro index.ts module-load `checkLicense()` 실 구현 확인 | **CONFIRMED** (G-003 완료) |
| sweep 실행 여부 | **DEFERRED** (의존성 미충족 — 명칭 불일치) |
