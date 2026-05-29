# ADR-001 실행 결과 — 7/7 Pro License Watermark Wiring

**실행일**: 2026-05-17
**Wave**: 2 (옵션 A + 7/7 강제 (b) granularity + H-D + D-D)
**상태**: completed (Phase 1-9 모두 통과, 시각 검증 deferred)
**원본 ADR**: `ADR-MOD-GRID-REFACTOR-2026-05-17-001` (`MOD-GRID-REFACTOR-2026-05-17-decisions.md:32`)
**1차 spec**: `wave2-adr-001-spec.md` (586 lines)
**Sub-spec**: `wave2-adr-001-sub-spec.md` (767 lines)

---

## Phase 1-9 결과 요약

| Phase | 작업 | 상태 |
|-------|------|------|
| 1 | grid-license API 확장 — `useLicenseStatus`, `useWatermarkEnforcement`, `subscribeLicense`, `getCachedCheck` (Strict-Mode infinite-loop 회피) | PASS (typecheck + build) |
| 2 | 5 wrapper 컴포넌트 inline `<Watermark>` wiring (Agg, Master, Range, Merging, ChangeTracking) | PASS (각 패키지 typecheck) |
| 3 | MultiRowHeader H-D — `<thead>` 내 watermark row | PASS (typecheck) |
| 4 | DataMapCell D-D — `useWatermarkEnforcement` void hook | PASS (typecheck) |
| 5 | peerDependencies 보정 | SKIPPED (1차 spec §2.2 — 모두 `dependencies: workspace:*` 적정) |
| 6 | CHANGELOG (grid-license + 7 Pro 패키지 minor) | DONE (8 파일) |
| 7 | Changeset `.changeset/adr-001-license-wiring.md` | DONE |
| 8 | 검증 — `pnpm -r typecheck` 14/14 PASS, `pnpm --filter "./packages/**" -r build` 13/13 PASS | PASS |
| 9 | ADR 본문 amendment + 본 결과 보고서 | DONE |

---

## 변경 파일 목록 (8 패키지)

| 패키지 | 변경 파일 | 변경 유형 |
|--------|---------|----------|
| `@tomis/grid-license` | `src/state.ts` | `subscribeLicense` + listener Set + notify + **`_cachedCheck` 무효화 + `getCachedCheck()`** (Strict-Mode infinite-loop 회피, advisor 발견) |
| | `src/useLicenseStatus.ts` | 신규 — `getSnapshot` 안정화 (`getCachedCheck` 경유) |
| | `src/useWatermarkEnforcement.tsx` | 신규 (84 LOC) |
| | `src/index.ts` | 3 export 추가 |
| | `CHANGELOG.md` | 0.1.0 entry |
| `@tomis/grid-pro-agg` | `src/AggregationGrid.tsx` | import + hook + 2 return wrapper 보강 (`relative` 추가, `<Watermark>` 2회) |
| | `CHANGELOG.md` | 0.1.0 entry |
| `@tomis/grid-pro-datamap` | `src/DataMapCell.tsx` | import + `useWatermarkEnforcement()` 호출 |
| | `CHANGELOG.md` | 0.3.0 entry |
| `@tomis/grid-pro-header` | `src/MultiRowHeader.tsx` | import + hook + `<thead>` 내 watermark row prepend |
| | `CHANGELOG.md` | 0.1.0 entry |
| `@tomis/grid-pro-master` | `src/MasterDetailGrid.tsx` | import + hook + wrapper className 합성 + `<Watermark>` |
| | `CHANGELOG.md` | 0.1.0 entry |
| `@tomis/grid-pro-merging` | `src/MergingGrid.tsx` | import + hook + non-virt path wrapper `<div>` 도입 + 2 `<Watermark>` |
| | `CHANGELOG.md` | 0.1.0 entry |
| `@tomis/grid-pro-range` | `src/RangeSelectGrid.tsx` | import + hook + `<Watermark>` (wrapper 이미 `relative`) |
| | `CHANGELOG.md` | v0.3.0 entry |
| `@tomis/grid-pro-tracking` | `src/legacy/ChangeTrackingGrid.tsx` | import + hook + wrapper `<div>` 도입 + `<Watermark>` |
| | `CHANGELOG.md` | 0.1.0 entry |
| `.changeset/adr-001-license-wiring.md` | 신규 | 8 패키지 minor changeset |

---

## 검증 결과

| 검증 | 결과 |
|------|------|
| `pnpm -r typecheck` | **PASS** — 14/14 packages (grid + 4 MIT + grid-license + 7 Pro + grid-features) 0 errors |
| `pnpm --filter "./packages/**" -r build` | **PASS** — 13/13 packages (ESM + CJS + DTS 모두 build 성공) |
| `grep "useLicenseStatus" packages/ --src` | **8 위치** — grid-license 정의 1 + export 1 + state.ts JSDoc 1 + useLicenseStatus.ts JSDoc 1 + 5 Pro wrapper 컴포넌트 import 5 + 5 wrapper 컴포넌트 hook 호출 5 = **6 패키지 source touch (grid-license + 5 Pro wrapper)** |
| `grep "useWatermarkEnforcement" packages/ --src` | **2 패키지** — grid-license (정의 + export + state.ts JSDoc + useWatermarkEnforcement.tsx 자체) + grid-pro-datamap (import + 호출) |
| `grep "<Watermark required" packages/ --src` (excl. stories/__probe__) | grid-license 자체 (useLicenseStatus JSDoc + useWatermarkEnforcement) + 6 Pro 패키지 = **7 Pro 패키지 모두 enforcement wiring 보유** (DataMapCell 은 portal 경유) |
| `grep "checkLicense();" packages/*/src/index.ts` | 7 hits 잔존 — **ADR-015 sweep 대상** (본 ADR 범위 외, 의도된 유지) |
| `pnpm size-limit` | 미실행 (요구 사항 외) |
| Storybook 시각 검증 | **deferred** (MOD-GRID-99-B 부트스트랩 후) |

---

## 결과 체크리스트 (1차 spec + sub-spec)

- [x] grid-license `useLicenseStatus` 추가
- [x] grid-license `subscribeLicense` 추가
- [x] grid-license `useWatermarkEnforcement` 추가 (singleton portal + ref-count)
- [x] AggregationGrid wiring (2 returns: virt + non-virt)
- [x] MasterDetailGrid wiring (className 안전 합성)
- [x] RangeSelectGrid wiring (기존 `relative` 활용)
- [x] MergingGrid wiring (non-virt wrapper 도입 + 2 returns)
- [x] ChangeTrackingGrid wiring (wrapper 도입)
- [x] MultiRowHeader H-D — 추가 `<tr><th colSpan>` row + sticky 정책 (a)
- [x] DataMapCell D-D — `useWatermarkEnforcement()` void hook
- [x] peerDependencies — 1차 spec §2.2 검증으로 보정 불요 확인
- [x] CHANGELOG 8 패키지 minor entry
- [x] Changeset `.changeset/adr-001-license-wiring.md`
- [x] `pnpm -r typecheck` PASS
- [x] `pnpm --filter "./packages/**" -r build` PASS
- [ ] Storybook 시각 검증 (MOD-GRID-99-B 부트스트랩 후 — deferred)
- [ ] 단위 테스트 (vitest 인프라 부재 — 후속 cycle)

---

## 알려진 한계

0. **Strict-Mode infinite-loop 회피 — 캐시 패턴 적용**. `useSyncExternalStore` 의 `getSnapshot` 이 매 호출마다 새 객체를 반환하면 React Strict Mode 에서 무한 렌더 루프 (React 공식 invariant). `state.ts` 에 `_cachedCheck` + `getCachedCheck()` 도입, `setLicenseState` 호출 시에만 cache 무효화. 단위 smoke 테스트 (`<StrictMode>` 안에서 `useLicenseStatus()` 호출) 는 **vitest 인프라 부재로 deferred** — 후속 cycle 에서 검증 권고. advisor 발견 (typecheck + build PASS 만으로는 runtime invariant 검출 불가).
1. **단위 테스트 부재** — grid-license `test` 스크립트가 `echo TODO`. 회귀 위험 존재. 후속 cycle 에서 vitest 인프라 추가 필요.
2. **Storybook 시각 검증 deferred** — `MOD-GRID-99-B/docs/G-002` 부트스트랩 후 회귀 확인. 본 PR 에서는 코드 wiring 만 검증.
3. **D-D singleton 패턴의 SSR 환경 검증 미수행** — `typeof document === 'undefined'` guard 는 보유. Next.js 등 SSR 환경에서의 hydration 동작은 미검증 (본 ADR 범위 외, CSR 가정).
4. **inline stub 잔재** — 7 Pro 패키지의 `index.ts:3 checkLicense();` (side-effect 호출, 결과 폐기) + agg/merging/range 의 inline `verifyOrWarn` / `_verifyGridLicenseStub` 함수 — 본 ADR 범위 외, **ADR-015 sweep 대상**.
5. **concurrent rendering ref-count race** — React 18 concurrent mode 에서 mount/unmount 순서 비결정성 가능. 본 구현은 atomic counter 사용 (race window 작음). 정밀 검증은 후속 작업.
6. **MergingGrid + ChangeTrackingGrid wrapper DOM 도입에 따른 시각 회귀 가능성** — 외부 CSS 의존 코드가 있다면 발생. CHANGELOG `### Changed` 섹션에 명시.
7. **MultiRowHeader watermark row의 `enableStickyHeader === true` 시 sticky 동작** — 기존 row 0 의 sticky 위치 (top-0) 와 watermark row 가 동일 위치 사용 — 기존 헤더 row 0 이 watermark row 아래로 밀림 (`thead > tr:nth-child(2)` 부터 일반 헤더). 시각 검증은 Storybook 후.
8. **DataMapCell stories 호환** — `<DataMapCell {...mockCtx} />` JSX 형태로 호출되는 stories 는 정상 (hook OK). 함수 직접 호출 (`DataMapCell(mockCtx)`) 형태가 어느 외부 코드에 있다면 'Invalid hook call' 오류 — 모노레포 내부에는 없음을 확인 (sub-spec §2.2).
9. **번들 사이즈 영향 미측정** — `pnpm size-limit` 미실행. grid-license 가 dist 6.12KB → ESM 측정 시 약 +1KB 추정 (createRoot import + portal pseudocode).
10. **D-3 sticky 옵션 (a) 선택 — 시각 보정 미세 조정 deferred** — H-D 의 watermark row 가 `enableStickyHeader === true` 일 때 row 0 위치 차지 → 기존 헤더 위로 24px 추가. CSS variable `--grid-header-row-height` 보정은 별도 작업.

---

## SSR 호환 검증 결과

- `useWatermarkEnforcement.tsx` 의 `mountPortal()` / `unmountPortal()` 모두 `typeof document === 'undefined'` guard 보유.
- `useLicenseStatus.ts` 의 `useSyncExternalStore` server snapshot 은 `() => checkLicense()` — 동일 함수 사용 (client-only license 가정).
- Next.js 등 SSR 환경 실 부트스트랩 검증은 본 monorepo 범위 외 (모든 grid 사용처 CSR 가정 — 1차 spec §8.1 #4).

---

## 다음 단계

- **Wave 3 — ADR-015 후반부**: license enforcement 신 정책의 진입점으로 본 ADR 결과 활용. 7 Pro 패키지 `index.ts` 의 module-load side-effect `checkLicense();` + inline `verifyOrWarn` / `_verifyGridLicenseStub` 잔재 sweep (별도 ADR).
- **MOD-GRID-99-B Storybook 부트스트랩 후**: 시각 회귀 baseline + invalid/valid license diff 스크린샷.
- **vitest 인프라 도입**: `grid-license/__tests__/useLicenseStatus.test.tsx` + 5 wrapper 컴포넌트 watermark 테스트 (1차 spec §6.1 시나리오).
