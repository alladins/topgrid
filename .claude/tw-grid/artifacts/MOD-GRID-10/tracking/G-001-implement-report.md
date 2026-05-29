# MOD-GRID-10 / tracking / G-001 — Implement Report

**Goal**: trackChanges API 설계 — `useChangeTracking<TData>` props/return + ChangeTrackingConfig
**Module**: MOD-GRID-10 (tracking — Wijmo CollectionView 대체)
**Stage**: implement
**migrationImpact**: high → threshold 95
**Authored**: 2026-05-14
**Implementer tier**: opus (high per C-15)
**Package**: `@tomis/grid-pro-tracking` (Pro tier, brotli ≤ 20 KB)

---

## Section A — 구현 파일 매니페스트 (Section 7 권위 — C-30)

| # | 경로 | 액션 | spec ref | Read/Glob 검증 |
|---|------|------|---------|---------------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | MODIFY | Section 7 #1 | Read 완료 (pre 73 → post 101 라인, JSDoc + AC-mapping 보강) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | MODIFY | Section 7 #2 | Read 완료 (pre 48 → post 67 라인, JSDoc docstring 추가, hook body 무변경) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | MODIFY | Section 7 #3 | Read 완료 (pre 13 → post 21 라인, JSDoc + AC-005 mapping, alias 미export) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/EULA.md` | MODIFY | Section 7 #4 | Read 완료 (L20 `<!-- AC-005 — G-001 stub stage -->` 1줄 보강) |
| 5 | `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-auto-G003/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` | MODIFY (신규 ADR 추가 — directory pre-existing) | Section 7 #5 | Write 완료, ADR-MOD-GRID-10-001 추가 |

**부가 산출물** (Section 7 footer):

| # | 경로 | 유형 |
|---|------|------|
| F1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/__stories__/useChangeTracking.stories.tsx` | NEW (AC-009 placeholder — CSF3, `BasicUsage` / `AdvancedUsage` / `ApiSurface` 12-member enumerate) |

총 5 MODIFY + 1 NEW (부가) = 6 파일. spec D8 breakdown (5 MODIFY + NEW 0 본문 + F1 부가) 일치.

---

## Section B — Spec ↔ Implementation 1:1 매핑

### B.1 types.ts (Section 7 #1) — JSDoc + AC mapping 보강

| Spec 항목 | 구현 위치 | 충족 |
|----------|---------|------|
| Section 2.1 L4 — `export type RowStatus = 'added' \| 'edited' \| 'deleted'` | types.ts L7-11 (JSDoc + body) | YES — AC-001 명시 |
| Section 2.1 L7 — `export type Mapping<TData>` | types.ts L13-19 | YES — AC-002 명시 |
| Section 2.1 L10 — `export type Validator<TData>` | types.ts L21-26 | YES — AC-002 명시 |
| Section 2.1 L13-20 — `CommitOptions` (method? / fetcher? / autoReset?) | types.ts L28-39 | YES — AC-003 명시 |
| Section 2.1 L23-28 — `ChangeSet` (added / updated / removed / errors) | types.ts L41-50 | YES — AC-003 명시 |
| Section 2.1 L31-44 — `ChangeTrackingConfig<TData>` 6 필드 (data / rowKey / mapping? / validator? / optimistic? / onSnapshotInit?) | types.ts L52-77 | YES — AC-002 6 필드 enumerate 일치 |
| Section 2.1 L47-72 — `ChangeTrackingAPI<TData>` 12 멤버 (rows / added / edited / deleted / addRow / updateRow / deleteRow / undoRow / hasChanges / getChangeSet / resetChanges / commitChanges) | types.ts L79-110 | YES — AC-003 12 멤버 enumerate 일치 |

### B.2 useChangeTracking.ts (Section 7 #2) — JSDoc docstring 추가, stub body 무변경

| Spec 항목 | 구현 위치 | 충족 |
|----------|---------|------|
| Section 2.1 hook signature: `useChangeTracking<TData>(config: ChangeTrackingConfig<TData>): ChangeTrackingAPI<TData>` | useChangeTracking.ts L29-31 | YES — AC-001 / AC-003 |
| Section 11.1 Step 2 — hook docstring (G-001 stub 동작 명세 — 12 멤버 분배) | useChangeTracking.ts L13-28 (JSDoc) | YES |
| Section 2.5 + Section 10.1 Step 3 — `rows` passthrough (G-001 stub) | useChangeTracking.ts L34 (`rows: config.data as ReadonlyArray<...>`) | YES |
| Section 10.1 Step 5 — `addRow/updateRow/deleteRow` throw `Error('implemented in MOD-GRID-10/G-002')` | useChangeTracking.ts L38-46 | YES — D3 intentional stub |
| Section 10.1 Step 5 — `undoRow` throw G-004 | useChangeTracking.ts L47-49 | YES |
| Section 10.1 Step 6 — `hasChanges = false`, `getChangeSet = empty ChangeSet` | useChangeTracking.ts L50-51 | YES |
| Section 10.1 Step 7 — `resetChanges` no-op | useChangeTracking.ts L52-54 | YES |
| Section 10.1 Step 8 hint — `commitChanges` reject (G-005) | useChangeTracking.ts L55-59 | YES |

### B.3 index.ts (Section 7 #3) — JSDoc + AC-005 mapping, ChangeTrackingGrid alias 미export

| Spec 항목 | 구현 위치 | 충족 |
|----------|---------|------|
| Section 11.1 Step 3 — public surface JSDoc + AC-005 mapping | index.ts L1-12 | YES |
| Section 11.1 Step 3 — `verifyOrWarn('@tomis/grid-pro-tracking')` inline stub 호출 (D4) | index.ts L14-17 | YES — AC-005 grep target |
| Section 11.1 Step 3 — `export * from './types'; export { useChangeTracking } from './useChangeTracking'` | index.ts L19-20 | YES |
| Section 3 + Section 4.2 + spec D3 — ChangeTrackingGrid alias 미export (G-005 의무) | index.ts (no alias export) | YES — alias 0 hits |

### B.4 EULA.md (Section 7 #4) — AC-005 mapping marker

EULA.md L20 기존 표현 ("In MOD-GRID-10/G-001 the verification call is a no-op fallback inline stub") 유지 + `<!-- AC-005 — G-001 stub stage -->` HTML 주석 1줄 보강. AC-005 게이트의 (b) "EULA.md 존재" 조건 충족 (기존 26 라인 → 26 라인 동일 + 인라인 주석).

### B.5 MOD-GRID-10-decisions.md (Section 7 #5) — ADR-MOD-GRID-10-001 신규

신규 ADR 1건 (~105 라인) 추가:
- Status: Accepted (2026-05-14, G-001 implement)
- Decision: 자체 React hook `useChangeTracking<TData>(config): ChangeTrackingAPI<TData>` (6-field config + 12-member API)
- Alternative (a): Wijmo CollectionView 직접 래핑 — rejected (C-16 + observable vs immutable mismatch)
- Alternative (b): zustand 외부 state 라이브러리 — rejected (global state breaks grid isolation + new peer dep)
- Trade-off / Consequence / Evidence / Related 섹션 모두 작성 (C-14 형식 일치)

### B.6 useChangeTracking.stories.tsx (F1 부가) — AC-009 placeholder

CSF3 컨벤션 (Meta default export + named Story exports `BasicUsage` / `AdvancedUsage` / `ApiSurface`). 12-member API enumerate `satisfies ReadonlyArray<keyof ChangeTrackingAPI<unknown>>` 포함. precedent: `packages/grid-renderers/src/__stories__/TextCell.stories.tsx`.

---

## Section C — AC ↔ Implementation 매핑

| AC | criteria | 구현 충족 | 증거 |
|----|---------|---------|------|
| AC-001 | hook signature + types 명시, any 0건 | YES | types.ts + useChangeTracking.ts. `Grep ': any\|<any>\|as any' src` → 0 hits |
| AC-002 | ChangeTrackingConfig 6 필드 + TanStack 병렬 동작 | YES | types.ts L52-77 6 필드 enumerate. Section 2.2 예시 2가 useReactTable 미호출 — composition 가능 입증 |
| AC-003 | ChangeTrackingAPI 12 멤버 enumerate | YES | types.ts L79-110 12 멤버 정확 일치. 스토리 `ApiSurface` 가 12 멤버 satisfies 검증 |
| AC-004 | alias 정책 = G-005 별도 Goal (G-001 변경 0) | YES | tw-framework-front/.../ChangeTrackingGrid.tsx 변경 0 (Grep 확인). index.ts ChangeTrackingGrid 미export |
| AC-005 | Pro 패키지 셋: (a) license = SEE LICENSE IN EULA, (b) EULA.md 존재, (c) verifyOrWarn 호출 | YES | (a) package.json L5 grep 1 hit (b) EULA.md 26 lines Read (c) index.ts L17 `verifyOrWarn('@tomis/grid-pro-tracking');` grep 1 hit |
| AC-006 | `@mescius/wijmo*` import 0건 | YES | `Grep '@mescius/wijmo\|from ['\"]wijmo' packages/grid-pro-tracking/src` → 0 hits |
| AC-007 | ADR-MOD-GRID-10-001 + 대안 2개+ + trade-off | YES | decisions/MOD-GRID-10-decisions.md Read 완료, 대안 a/b 명시 + trade-off + consequence |
| AC-008 | `tsc --noEmit` 0 errors (grid-pro-tracking) | YES | `npx tsc --noEmit` exit 0 (no stdout/stderr) |
| AC-009 | Storybook placeholder story 1개 + 12 API enumerate | YES | useChangeTracking.stories.tsx CSF3 placeholder, `ApiSurface.args.members` 12-member satisfies array |

---

## Section D — Build / Bundle / Constraint 검증

### D.1 빌드 결과

| 명령 | 결과 |
|------|------|
| `npx tsc --noEmit` (packages/grid-pro-tracking) | exit 0, no errors |
| `npx tsup` (packages/grid-pro-tracking) | Build success. ESM 1.16 KB / CJS 1.20 KB / DTS 5.44 KB |
| `npx size-limit --json` (root) → grid-pro-tracking entry | **PASS** — `size: 3098 / sizeLimit: 20000` (brotli). 여유 16902 bytes / 84.5% headroom |

(주: size-limit root 실행 exit 1 = grid-export 패키지 한도 초과로 인한 다른 패키지 결과. grid-pro-tracking 자체는 `"passed": true`.)

### D.2 Constraint grep 결과 (C-4, C-16, C-25)

| Constraint | grep | 결과 |
|-----------|------|------|
| C-4 (any 금지) | `Grep ': any\|<any>\|as any'` on packages/grid-pro-tracking/src | 0 hits |
| C-16 (Wijmo 금지) | `Grep '@mescius/wijmo\|from ['\"]wijmo'` on packages/grid-pro-tracking/src | 0 hits |
| C-5 (CSS 신규 X) | new .css/.scss files | 0 files |
| C-25 (JSDoc on public API) | types.ts JSDoc coverage | 7/7 types/interfaces 모두 JSDoc |
| C-22 (peerDeps 정책) | package.json L27-31 peer = react / react-dom / @tanstack/react-table | unchanged (spec Section 9.1 일치) |
| C-24 (Pro 라이선스 명시) | package.json L5 `"license": "SEE LICENSE IN EULA"` + EULA.md exists | unchanged + AC-005 마커 보강 |

### D.3 C-31 Functional Wiring Audit

G-001 = types + signature + stub. spec D3 명시: "단독 유틸 함수 생성 0건" — `useChangeTracking` 은 hook (alias/wrapper 아님), `verifyOrWarn` 은 inline fallback stub (외부 module 의존성 0). C-31 면제 조건 충족. A-06 N/A 정당화.

### D.4 C-29 exactOptionalPropertyTypes 적용

`ChangeTrackingConfig<TData>` optional prop 4종 (`mapping?`/`validator?`/`optimistic?`/`onSnapshotInit?`) 은 hook 내부에서만 destructure (G-002+ 본격) — child 컴포넌트 forwarding 0. spec D6 + C-29 적용 범위 외. exactOptional 위반 가능성 0.

### D.5 tw-framework-front 사용처 영향

`Grep 'grid-pro-tracking' tw-framework-front/src` → 0 hits. 사용처 0 (spec Section 1.4 일치, alias 미생성 — G-005 의무). C-01 영향 사용처 tsc N/A 정당화.

---

## Section E — 변경 라인 카운트 (감사 추적)

| 파일 | pre | post | delta |
|-----|-----|------|-------|
| types.ts | 73 | 101 | +28 (JSDoc + AC mapping, body 무변경) |
| useChangeTracking.ts | 48 | 67 | +19 (hook docstring) |
| index.ts | 13 | 21 | +8 (JSDoc + alias 미export 주석) |
| EULA.md | 26 | 26 | +0 (인라인 주석 1줄) |
| MOD-GRID-10-decisions.md | 0 (신규) | 105 | +105 |
| useChangeTracking.stories.tsx | 0 (신규) | 64 | +64 |
| **합계** | 160 | 384 | **+224** |

모든 변경이 JSDoc / ADR 산문 / 부가 placeholder — 런타임 동작 변경 0건.

---

## Section F — Prompt ↔ Spec drift 분석 (C-27 / F-05)

메인 prompt vs spec.md cross-check 결과 — 3건 value drift 감지 + spec 우선 적용:

1. **packageScope**: prompt = `@topvel/grid-pro-tracking` (+ `@topvel/grid-core`, `@topvel/grid-license`) vs spec Section 2.4 + package.json L2 = `@tomis/grid-pro-tracking`. **spec 적용** — 모든 import/export 가 `@tomis/` 스코프 사용.
2. **peerDependencies**: prompt = "react, @tanstack/react-table, @topvel/grid-core, @topvel/grid-license 모두 peer" vs spec Section 9.1 + Section 4.4 = "react, react-dom, @tanstack/react-table 만 peer. grid-license 는 MOD-GRID-99-A/G-002 시점에 추가 (D4)". **spec 적용** — package.json L27-31 변경 0건.
3. **index.ts exports**: prompt = "ChangeTrackingGrid alias placeholder" vs spec D3 + Section 3 + Section 4.2 = "G-001 단계 alias 미생성, G-005 의무". **spec 적용** — alias export 0건.

`promptSpecDrift[]` 3건 implement-score JSON 에 기록. drift 발견 후 spec 권위 우선 적용 + 보고 의무 (C-27 / F-05) 모두 충족.

prompt 의 `package.json — license: "SEE LICENSE IN EULA"` 지시는 이미 pre-scaffold L5 에 존재하므로 unchanged. drift 아님 (spec-prompt aligned).

---

## Section G — VERIFY 단계 핵심 검증 포인트 (다음 stage)

1. **A-06 N/A 정당화**: G-001 = types + stub. 단독 유틸 함수 생성 0 (spec D3 명시). C-31 면제 조건 충족.
2. **AC-005 3-조건 grep**: (a) package.json L5 license / (b) EULA.md exists / (c) `verifyOrWarn('@tomis/grid-pro-tracking')` index.ts L17.
3. **AC-003 12-member enumerate**: types.ts L79-110 + `useChangeTracking.stories.tsx` ApiSurface.args.members 양쪽 일치 검증.
4. **F-05 promptSpecDrift[] 3건 cross-check**: package scope (`@tomis/` vs `@topvel/`) + peer 목록 (3 peers vs 5 peers) + alias 부재.
5. **C-16 grep 0 hits**: `@mescius/wijmo` on packages/grid-pro-tracking/src — 절대 위반 금지.

---

## Self-Check (Implementer 자가 검증)

- [x] spec Section 7 표 5행 모두 변경 완료
- [x] 부가 산출물 1 (Story placeholder) 작성
- [x] tsc --noEmit 0 errors (grid-pro-tracking)
- [x] tsup build success (ESM 1.16 KB)
- [x] size-limit grid-pro-tracking PASS (3098 / 20000)
- [x] C-4 any 0 hits
- [x] C-16 Wijmo 0 hits
- [x] C-22 peerDependencies 정책 유지
- [x] C-24 license + EULA 존재
- [x] C-25 JSDoc 7 types + hook docstring
- [x] C-27 / F-05 promptSpecDrift[] 3건 기록 + spec 우선 적용
- [x] ADR-MOD-GRID-10-001 작성 (대안 2개+ + trade-off)
- [x] G-001 범위 (types + signature + stub) 준수, 런타임 로직 미구현 (G-002~G-005 의무)
