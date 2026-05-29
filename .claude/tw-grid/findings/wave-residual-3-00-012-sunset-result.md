# ADR-MOD-GRID-00-012 Sunset Option B — 완료 보고서

**실행일**: 2026-05-17
**Wave**: residual-3 후속 (ADR-012 Sunset Option B 실행)
**상태**: completed
**원본 ADR**: `ADR-MOD-GRID-00-012` (`MOD-GRID-00-decisions.md`)
**선행 보고서**: `wave-residual-3-00-012-sunset-deferred.md`

---

## 채택 경로: Option B (ADR Sunset step 재정의)

ADR-MOD-GRID-00-012 Sunset step 1 조건을 `checkLicense` (기능 동등 export) 로 재정의.
`verifyGridLicense` / `verifyOrWarn` alias export 신설 없이 즉시 sweep 실행.

---

## Step 1 — Sunset 조건 재정의 (완료)

| 조건 | 내용 |
|------|------|
| G-002 실 출하 API | `checkLicense` (`LicenseCheckResult` 반환) |
| 조건 재정의 | `verifyGridLicense`/`verifyOrWarn` → `checkLicense` (기능 동등) |
| G-002 `overallStatus` | `completed` (2026-05-15 확인) |

---

## Step 2 — module-load `checkLicense()` 7건 보존 확인

아래 7개 파일은 **실 구현** (no-op stub 아님) — sweep 대상 외:

| # | 패키지 | 파일 |
|---|--------|------|
| 1 | `grid-pro-agg` | `src/index.ts` |
| 2 | `grid-pro-merging` | `src/index.ts` |
| 3 | `grid-pro-range` | `src/index.ts` |
| 4 | `grid-pro-tracking` | `src/index.ts` |
| 5 | `grid-pro-datamap` | `src/index.ts` |
| 6 | `grid-pro-header` | `src/index.ts` |
| 7 | `grid-pro-master` | `src/index.ts` |

상기 7건 모두 `import { checkLicense } from '@tomis/grid-license'; checkLicense();` 패턴 — 변경 없음.

---

## Step 3 — 인라인 stub 8건 sweep 완료

| # | 패키지 | 파일 | 제거된 stub | useEffect import |
|---|--------|------|------------|-----------------|
| 1 | `grid-pro-agg` | `src/AggregationGrid.tsx` | `verifyOrWarn` 선언 + 호출 | 유지 (L200 window event 사용) |
| 2 | `grid-pro-merging` | `src/MergingGrid.tsx` | `verifyOrWarn` 선언 + 호출 | 해당 없음 (미사용) |
| 3 | `grid-pro-range` | `src/DragFillHandle.tsx` | `_verifyGridLicenseStub` 선언 + useEffect 호출 | 유지 (L92 window event 사용) |
| 4 | `grid-pro-range` | `src/useCellRange.ts` | `_verifyGridLicenseStub` 선언 + useEffect 호출 | 제거 (미사용) |
| 5 | `grid-pro-range` | `src/useClipboard.ts` | `_verifyGridLicenseStub` 선언 + useEffect 호출 | 제거 (미사용) |
| 6 | `grid-pro-range` | `src/useKeyboardEdit.ts` | `_verifyGridLicenseStub` 선언 + useEffect 호출 | 제거 (미사용) |
| 7 | `grid-pro-range` | `src/useKeyboardNav.ts` | `_verifyGridLicenseStub` 선언 + useEffect 호출 | 제거 (미사용) |
| 8 | `grid-pro-range` | `src/RangeSelectGrid.tsx` | `_verifyGridLicenseStub` 선언 + useEffect 호출 | 제거 (미사용) |

---

## Step 4 — 검증

### pnpm -r typecheck

```
packages/grid-license typecheck: Done
packages/grid-renderers typecheck: Done
packages/grid-export typecheck: Done
packages/grid-core typecheck: Done
packages/grid-features typecheck: Done
packages/grid-pro-datamap typecheck: Done
packages/grid-pro-header typecheck: Done
packages/grid-pro-agg typecheck: Done
packages/grid-pro-master typecheck: Done
packages/grid-pro-merging typecheck: Done
packages/grid-pro-range typecheck: Done
packages/grid-pro-tracking typecheck: Done
packages/grid typecheck: Done
```

**결과: 전 패키지 PASS (0 errors)**

### pnpm --filter "./packages/**" -r build

전 패키지 `⚡️ Build success` — CJS + ESM + DTS 모두 정상 출력.

**결과: 전 패키지 PASS**

---

## Step 5 — ADR-MOD-GRID-00-012 Amendment 2

`MOD-GRID-00-decisions.md` 업데이트 내용:

| 항목 | 변경 |
|------|------|
| `상태` | `accepted (Sunset 완료, 2026-05-17)` |
| Amendment 1 | DEFERRED 보고 (기존 유지) |
| Amendment 2 (신규) | Option B 채택 + sweep 완료 + 검증 PASS 명시 |
| §적용 한계 Sunset step 1 | `verifyGridLicense`/`verifyOrWarn` → `checkLicense` 로 재정의, 완료 표기 |
| §적용 한계 Sunset step 3 | 8건 stub 제거 완료 표기 |
| §Decision 표준 패턴 코드 | `[REMOVED]` 역사적 기록 주석 추가 |
| §Cascading Risk R-1 | 해소 표기 |

---

## 검증 요약

| 항목 | 결과 |
|------|------|
| 인라인 stub 8건 제거 | PASS |
| module-load `checkLicense()` 7건 보존 | PASS (변경 없음 확인) |
| `pnpm -r typecheck` 전 패키지 | PASS (0 errors) |
| `pnpm -r build` 전 패키지 | PASS (CJS+ESM+DTS) |
| ADR-MOD-GRID-00-012 Amendment 2 | PASS (상태 → Sunset 완료) |
| git commit | 미실행 (CLAUDE.md 정책 — 사용자 수동 커밋) |

---

## 잔여 후속 작업

- `constraints.md` C-33 에 deprecated marker 추가 (소규모 — 별도 cycle)
- `wave-residual-3` 최종 종료 처리 (C-33 deprecated 후)
