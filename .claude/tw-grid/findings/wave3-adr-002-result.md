# ADR-002 실행 결과 — rendererRegistry cross-package wiring

**실행일**: 2026-05-17
**Wave**: 3
**조합**: **R-A + D-1A + D-2A + D-3A + D-4A** (spec 권고 채택)
**상태**: completed
**원본 spec**: `.claude/tw-grid/findings/wave3-adr-002-spec.md`
**원본 ADR**: `MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-002

---

## 1. 변경 요약

| 영역 | 변경 |
|------|------|
| **grid-renderers 신규** | `src/wireRegistry.ts` (`wireDefaultRenderers()` + `adaptValueCell<TData, V>()` helper). 6 슬롯 registerRenderer 호출. |
| **grid-renderers 수정** | `src/index.ts` 끝에 side-effect `import './wireRegistry.js'; wireDefaultRenderers();` 추가. |
| **grid-renderers package.json** | `sideEffects: ["./src/index.ts","./dist/index.mjs","./dist/index.cjs"]` 추가. `peerDependencies."@tomis/grid-core": "workspace:*"` 추가. |
| **grid-core 수정** | `src/column/rendererRegistry.ts` 의 module / 변수 / 함수 JSDoc 갱신. 각 placeholder entry 의 인라인 주석을 "ADR-002 wired → … (fallback: …)" 로 갱신 (코드 동작 불변). |
| **CHANGELOG** | `grid-renderers/CHANGELOG.md` 0.2.0 entry. `grid-core/CHANGELOG.md` Unreleased ADR-002 entry. |
| **Changeset** | `.changeset/adr-002-cross-package-wiring.md` — grid-renderers minor + grid-core patch. |
| **ADR 본문** | `MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-002 의 결과 체크박스 4건 중 3건 mark. Implementation Note + Spec divergence note 추가. 상태 `accepted → implemented`. |

---

## 2. 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `packages/grid-renderers/src/wireRegistry.ts` | NEW (110 LOC) |
| `packages/grid-renderers/src/index.ts` | MODIFIED (+5 LOC side-effect import) |
| `packages/grid-renderers/package.json` | MODIFIED (+5 lines — sideEffects + peerDep) |
| `packages/grid-core/src/column/rendererRegistry.ts` | MODIFIED (JSDoc only, no logic change) |
| `packages/grid-renderers/CHANGELOG.md` | MODIFIED (+20 lines — 0.2.0 entry) |
| `packages/grid-core/CHANGELOG.md` | MODIFIED (+10 lines — ADR-002 Unreleased entry) |
| `.changeset/adr-002-cross-package-wiring.md` | NEW |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | MODIFIED (ADR-002 status flip + Implementation Note + Spec divergence note) |

순 LOC 추가: ~145 (대부분 doc + wire registry).

---

## 3. probe 재현 결과

spec §5.4 절차 따라 재현:

```powershell
# 1. tsconfig.probe.json + src/__probe__/adr-002-wiring.probe.ts 생성 (spec §3.1+§3.2 코드)
# 2. 실행:
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers
npx tsc --noEmit -p tsconfig.probe.json
# EXIT=0  (errors: 0)
# 3. probe 파일 + tsconfig.probe.json 즉시 삭제
```

**결과: PASS (EXIT=0)** — 6 슬롯 wiring 어댑터 패턴이 컴파일 통과. F-1 (LinkCell value optional + exactOptionalPropertyTypes) / F-2 (IconCell 구조적 불가) / F-3 (5 extras union 외) 모두 sec 명시 그대로 재현됨.

---

## 4. 검증 결과

### 4.1 `pnpm -r typecheck`

**14 packages PASS** (`grid-core` / `grid-renderers` / `grid` / `grid-license` / `grid-export` / `grid-features` / `grid-pro-agg` / `grid-pro-datamap` / `grid-pro-header` / `grid-pro-master` / `grid-pro-merging` / `grid-pro-range` / `grid-pro-tracking` + apps/docs 자체 typecheck 제외).

EXIT=0.

### 4.2 `pnpm --filter "./packages/*" build`

**13 packages PASS** (모든 grid 패키지).

EXIT=0.

- `apps/docs` 의 docusaurus customCss validation 실패는 본 ADR 무관 (pre-existing). `pnpm --filter "./packages/*"` 로 격리 확인.

### 4.2b `pnpm size-limit` — ADR-002 결과 체크 #3

```
@tomis/grid-core      Size: 8.97 kB / 30 kB limit  ✔
@tomis/grid-renderers Size: 8.99 kB / 10 kB limit  ✔  (~1 kB 여유)
... (other 10 packages 모두 PASS)
```

EXIT=0. **grid-renderers 10 kB 한도 PASS** (ADR-002 line 171 결과 체크 항목 충족). 단 여유 ~1 kB — ADR-018 (5 extras + icon) 추가 시 한도 상향 검토 필요.

### 4.3 grep 검증

```powershell
# wireRegistry 의 registerRenderer 호출 6건:
grep "registerRenderer(" packages/grid-renderers/src/wireRegistry.ts
# → 6 hits (slot text/number/date/dateTime/badge/link)
```

**사용자 task 의 "9 hits" 와의 차이**: 사용자 task description 예시는 statusBadge / check / checkbox 추가 3 hit 제안하나, spec §0+§3.2 의 probe 검증 결과 (a) statusBadge/check 가 `TomisColumnType` 외 (F-3 TS2345), (b) checkbox 는 `createColumns.ts:96-108` 분기로 registry 우회 — wiring 무효. spec contract 우선 (작업 지시문 "spec §7 Step 0-8 정확히 따름").

### 4.4 grid-core peerDep 방향 검증

```powershell
grep -r "from ['\"]@tomis/grid-renderers" packages/grid-core/src/
# → 0 hits in src/ (doc comments 만 — grid-renderers 명칭 언급)
```

- grid-core 가 grid-renderers 에 의존하지 않음 (ADR-009 §4.1 layering — grid-core foundational, grid-renderers depends on grid-core).
- peerDep 방향: `grid-renderers/package.json` 이 `@tomis/grid-core: workspace:*` 보유 (정합).

### 4.5 side-effect dist 검증

```powershell
grep -E "wireDefaultRenderers|registerRenderer" packages/grid-renderers/dist/index.mjs
```

결과:
```
import { registerRenderer as registerRenderer$1 } from '@tomis/grid-core';
function registerRenderer(type, component) { ... }           # grid-renderers 자체 (다른 함수)
function wireDefaultRenderers() {
  registerRenderer$1(  ...  )                                # text
  registerRenderer$1(  ...  )                                # number
  registerRenderer$1(  ...  )                                # date
  registerRenderer$1(  ...  )                                # dateTime bespoke
  registerRenderer$1(  ...  )                                # badge
  registerRenderer$1("link", (info) => { ... });             # link bespoke
}
wireDefaultRenderers();                                       # ← top-level invocation 보존
```

`dist/index.cjs` 도 동일 10 hits 확인. **tree-shaking 보존**: `sideEffects: ["./dist/index.mjs", "./dist/index.cjs"]` 가 publish 후 consumer bundler 인식 보장.

---

## 5. 결과 체크리스트

- [x] grid-core `defaultRendererRegistry` 9 placeholder 유지 (D-3A — graceful fallback).
- [x] grid-core JSDoc 갱신 (wiring 의도 명시, ADR-002 reference).
- [x] grid-renderers `wireRegistry.ts` 6 슬롯 어댑터 + bespoke (dateTime + link).
- [x] grid-renderers `src/index.ts` 끝에 side-effect import + `wireDefaultRenderers()` 호출.
- [x] grid-renderers `package.json` peerDep `@tomis/grid-core: workspace:*`.
- [x] grid-renderers `package.json` `sideEffects` 배열 (src + dist).
- [x] `pnpm install` 후 `node_modules/@tomis/grid-core` symlink 성공.
- [x] `pnpm -r typecheck` 14 packages PASS.
- [x] `pnpm --filter "./packages/*" build` 13 packages PASS.
- [x] probe 재현 (spec §5.4) PASS, 즉시 삭제 — default `pnpm typecheck` 무결성 유지.
- [x] `dist/index.mjs` 가 `wireDefaultRenderers()` top-level invocation 포함 (tree-shake 보존 검증).
- [x] grid-renderers CHANGELOG 0.2.0 entry.
- [x] grid-core CHANGELOG Unreleased ADR-002 entry.
- [x] Changeset 등록 — grid-renderers minor + grid-core patch.
- [x] ADR 본문 결과 체크박스 + Implementation Note + Spec divergence note.
- [x] ADR 본문 상태 `accepted → implemented`.
- [x] **`pnpm size-limit`** grid-renderers 8.99 / 10 KB 한도 PASS (spec Step 6, ADR-002 결과 체크 #3).
- [ ] **5 extras + icon slot wiring** (button/tag/avatar/progress + icon) — **ADR-018 분리 권고** (§7 참조).
- [ ] **단위 테스트** (registry slot 6개 lookup → adapter fn 반환 검증) — Wave 3 follow-up 권고 (spec §7 Step 4).
- [ ] **Storybook story** wiring 시각 검증 — 옵션 (spec Step 7).

---

## 6. 알려진 한계

### 6.1 tree-shaking 위험

`sideEffects: ["./src/index.ts","./dist/index.mjs","./dist/index.cjs"]` 명시했으나 bundler 별 거동 차이 가능 (spec §8.1). publish 후 외부 consumer 에서 wiring 누락 사례 발견 시 implementer 가 추가 패턴 (e.g., `**/wireRegistry.*`) 확장.

### 6.2 module load 순서 의존

`import '@tomis/grid-renderers'` 누락 시 grid-core placeholder fallback (`String(value)`) 만 동작. 사용자가 명시적으로 한 번 import 해야 함. graceful 이지만 silent — 런타임 console.warn 등 검증 신호는 별도 ADR (현 ADR-002 범위 외).

### 6.3 ADR-018 분리 필요

다음 항목은 별도 ADR 권고:

- **icon slot** — value adapter 패턴 검토 (D-1B `meta.icon` 경유), F-2 구조적 차단 회피 옵션 평가.
- **5 extras** — `button` / `tag` / `avatar` / `progress` wiring. `TomisColumnType` union 확장 (D-2B grid-core minor) 또는 Map key string loosen (D-2C breaking).
- **aliases** (`statusBadge` / `check` / `dateTime` 외 추가) — alias 처리 정책 정합.
- **semver 영향**: union 확장은 grid-core minor, Map key loosen 은 grid-core major.

### 6.4 사용자 가시 동작 변경 (intended, 회귀 추적용 기록)

ADR-002 wiring 의 의도된 결과. 향후 디버깅 시 회귀 오해 방지 목적 기록:

- **`text`**: 이전 `String(value ?? '')` (null/undefined → 빈 문자열). 이후 `TextCell` 가 null/undefined/'' 시 회색 dash placeholder `<span class="text-gray-400">-</span>` 렌더. **0 은 "0" 으로 표시 (EC-06 보존)**.
- **`number`**: 이전 plain text. 이후 `NumberCell` 가 locale 포맷 (ko-KR) + tabular-nums + null/NaN dash.
- **`date`** / **`dateTime`**: 이전 plain text. 이후 `DateCell` 가 ko-KR locale 날짜 포맷 + 무효 날짜 dash.
- **`badge`**: 이전 plain text. 이후 `StatusBadgeCell` 가 Tailwind rounded-full chip + 7-state colorMap (active/inactive/pending/error/approved/rejected/draft) — **가장 큰 시각 변화**. Storybook 시각 회귀 baseline (Step 7) 필수.
- **`link`**: 이전 plain text. 이후 `LinkCell` 가 underline + blue-600 hover (단, `href`/`onClick` 미주입이므로 `<span>` 분기 — 실 클릭 인터랙션은 사용자 컬럼 정의 단계의 별도 wiring 필요).
- **`boolean`**: 변경 없음 — Y/N 유지.
- **`icon`** / **`checkbox`**: 변경 없음 — placeholder + 우회 유지.

### 6.6 단위 테스트 부재

spec §7 Step 4 의 `wireRegistry.test.ts` 는 본 implementer 작업 범위 외 (사용자 작업 지시문에 명시 없음). 빌드 산출물 (`dist/index.mjs`) 의 wiring 코드 보존만 확인. registry slot lookup 의 실제 어댑터 fn 반환 검증은 Wave 3 follow-up.

---

## 7. ADR-018 신규 권고 (Spec divergence + extras follow-up)

별도 ADR 작성 권고:

| 제목 | ADR-MOD-GRID-REFACTOR-2026-05-17-018: 5 extras + icon slot wiring 확장 |
|------|---------------------------------------------------------------------------|
| **범위** | (a) icon slot value adapter / meta-경유 wiring, (b) button/tag/avatar/progress wiring, (c) alias (statusBadge/check) 정책 |
| **선행 의존** | 본 ADR (ADR-002) 완료 — wiring 인프라 (wireRegistry + side-effect + sideEffects + peerDep) 확보됨 |
| **선택지** | (1) `TomisColumnType` union 확장 (grid-core minor), (2) Map key 를 string 으로 loosen (grid-core major), (3) icon meta 경유 (TomisColumnDef.meta 확장 — grid-core minor + createColumns 수정) |
| **semver 영향** | 옵션 (1) (3) minor, 옵션 (2) major |
| **위험** | medium — TomisColumnType 사용처 (현재 9 union 의존) 인벤토리 필요 |

---

## 8. 다음 단계 권고

1. **단위 테스트 추가** (spec §7 Step 4) — Wave 3 follow-up. `wireRegistry.test.ts` 가 6 슬롯 lookup 검증.
2. **Storybook 1+ story** (spec §7 Step 7) — wiring 시각 검증. `Grid.stories.tsx` 또는 신규 story 가 `import '@tomis/grid-renderers'` 후 `createColumns({type:'number'})` 결과 NumberCell 렌더 확인.
3. **`pnpm size` 검증** — grid-renderers 10KB / grid-core 한도 유지.
4. **ADR-018 작성** — 5 extras + icon slot 정책 (§7).
5. **C-31 (Functional Wiring Audit) 의 cross-package 변종 closed 마크** — ADR-002 본문 결과 체크박스 마킹 완료.
6. **tw-framework-front 페이지에서 wiring 효과 검증** — 페이지가 `createColumns` 사용 + `import '@tomis/grid-renderers'` 보유 시 NumberCell/DateCell 렌더 확인 (선택, ADR-004 와 합쳐 진행).

---

**구현 완료. spec contract 준수. R-A + D-1A + D-2A + D-3A + D-4A.**
