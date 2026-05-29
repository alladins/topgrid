# MOD-GRID-01 / G-005 — Implementer Findings

**Date**: 2026-05-14
**Goal**: G-005 (BaseGridProps 호환 alias 5종)
**Spec**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-01/wrapper/G-005-spec.md`

본 finding 은 G-005 IMPLEMENT Stage 에서 spec 본문 외 발견·결정된 항목을 기록한다.

---

## 1. D10 정합성 — nominal-only 2 사용처 no-op (spec D10)

`wrapper-goals.json` G-005 `affectedUsageFiles` 5 vs spec actual 3 차이. spec 본문 D10 결정에 따라 본 IMPLEMENT 에서 다음 2 사용처는 **no-op** 처리:

| 파일 | nominal-only 사유 |
|------|-------------------|
| `tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` | Grep `BaseGrid\|VirtualGrid\|...` 0 hit. L13 `useReactTable` from `@tanstack/react-table` 직접 사용 (raw TanStack — 5 variant 미사용) |
| `tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` | 동일 — Grep 0 hit + L14 `useReactTable` 직접 사용 |

**후속 처리**: MOD-GRID-17 27 페이지 raw TanStack → `<Grid>` 마이그레이션 영역에서 처리.

**C-19 위반 X**: 본 G-005 actual 3 사용처 import 변경 ≤5 (트리비얼 import-only 변경 — 예외 ≤10 도 충족).

---

## 2. promptSpecDrift — tsconfig.app.json paths 추가 (spec Section 7 미명시)

### 발견

Spec Section 7 표 14행에 `tw-framework-front/tsconfig.app.json` 미명시. 그러나 spec Section 12 검증 명세 + AC-007 (`pnpm --filter tw-framework-front typecheck` exit 0) 충족을 위해 다음 사실:

- `tw-framework-front/tsconfig.app.json` 에 `paths` 매핑 부재 (Read 확인)
- `tw-framework-front/package.json` 에 `@tomis/grid-core` workspace dependency 부재
- `tw-framework-front/node_modules/@tomis/` 부재 (workspace symlink 없음)
- 현재 `@tomis/grid-core` 는 `vite.config.ts` alias 만으로 해결 (Vite resolution)

→ 사용처 3 파일 import `from '@tomis/grid-core/legacy'` 변경 시 **Vite 빌드는 동작하나 `tsc -b` 가 fail** (TS2307 "Cannot find module").

### 결정 (spec authoritative — C-27 spec 우선 + spec-implicit 의존성 충족)

`tsconfig.app.json` 에 `paths` 매핑 추가 (vite.config.ts L17-19 alias 와 1:1 mirror):

```jsonc
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"],
  "@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
  "@tomis/grid-core/legacy": ["../../topvel-grid-monorepo/packages/grid-core/src/legacy"]
}
```

### 보존 입증 (C-1 / F-03)

`tsconfig.app.json` 기존 22행 (전체) 무수정. `compilerOptions` 내 `tsBuildInfoFile`/`target`/`lib`/`module`/`skipLibCheck`/`moduleResolution`/`jsx`/`strict` 등 22 옵션 모두 보존. `include: ["src"]` 보존. 본 변경은 `/* Bundler mode */` 섹션 마지막에 `baseUrl + paths` 4 키 신규 추가만.

### promptSpecDrift JSON 항목

```json
{
  "field": "spec.Section7.implementFiles",
  "promptValue": "14 files (NEW 7 + grid-core MODIFY 4 + 사용처 MODIFY 3)",
  "specValue": "동일",
  "addedByImplementer": "tw-framework-front/tsconfig.app.json (15번째 — paths mapping for @tomis/grid-core/legacy resolution)",
  "resolution": "spec-implicit dependency satisfied — AC-007 (사용처 tsc 0 error) 충족 의무 위해 추가. Vite alias 와 1:1 mirror — 외관/런타임 무영향."
}
```

---

## 3. 빌드 산출물 경로 — package.json `exports."./legacy"` 정정

### 발견

Spec Section 11.1 Step 11 `exports."./legacy"` paths 가 `./dist/legacy.{cjs,mjs,d.ts}` (flat) 로 명시. 그러나 `tsup` multi-entry 가 `entry: ['src/index.ts', 'src/legacy/index.ts']` 로 빌드 시 dist 구조는 디렉토리 mirror — `dist/legacy/index.{cjs,mjs,d.ts}`.

### 결정

`package.json` `exports."./legacy"` 를 실제 dist 구조에 맞춰 정정:

```json
"./legacy": {
  "types": "./dist/legacy/index.d.ts",
  "import": "./dist/legacy/index.mjs",
  "require": "./dist/legacy/index.cjs"
}
```

### 영향

런타임 동작 + 빌드 산출물 일치. Vite alias 기반 사용처는 빌드 결과 미경유 (직접 src 참조) — 영향 0.

---

## 4. D7 Bundle Gate — 단일 entry 유지 결정

### 측정 (post-Step 11)

```
@tomis/grid-core (brotli):
  size: 24,518 bytes (24.52 KB)
  sizeLimit: 30,000 bytes (30 KB)
  passed: true
```

### 누적 trajectory

- G-001: 17.44 KB
- G-001~G-003: ~18.35 KB
- G-001~G-004: 24.21 KB
- **G-001~G-005: 24.52 KB** (G-005 implement 후 실측)
- G-005 incremental: **+0.31 KB** (brotli — alias 코드가 대부분 prop 위임 패턴 → dedupe 효율적)

### D7 게이트 결정

**24.52 KB ≤ 28.5 KB → 단일 entry 유지** (D7 정책 충족).

`/legacy` sub-entry 빌드 인프라(D8 — `tsup.config.ts` multi-entry + `package.json exports."./legacy"`) 는 **사전 인프라**로 그대로 유지. 사용처는 `from '@tomis/grid-core/legacy'` 권장 (deprecation intent 명시 + 잠재적 향후 분리 트리거 시 즉시 적용 가능). 또한 main entry 에서도 동일 alias re-export 호환 유지.

### Pessimistic 추정 vs 실측

prompt 의 pessimistic 추정 +5 KB → 누적 29.21 KB 우려는 brotli compression deduplication 효과로 +0.31 KB 실측 (94% 압축률). spec D7 의 "extrapolation 금지 — measure-then-decide" 정책 적용 결과 — 정상 측정 기반 결정.

---

## 5. exactOptionalPropertyTypes spread 패턴 — Section 11.1 Step 2-6 보강

### 발견

monorepo `tsconfig.base.json` L14 `exactOptionalPropertyTypes: true`. `<Grid props>` 의 optional prop slots (`pagination?`, `rowSelection?`, `onRowClick?`, ...) 는 `undefined` 값 명시 할당이 type-error.

spec Section 2.1~2.5 alias 본문 코드 블록 (예: `pagination={props.pagination}`) 은 `props.pagination: GridPaginationOptions | undefined` 를 그대로 전달 → tsc fail (TS2375).

### 결정 (spec D# 의도 보존 + tsc 0 error 보강)

Spec D2 의 "Implementer-decided fallback" 권한 + Section 11.3 위험 표 "TreeGrid alias getSubRows undefined 시 spread `{...(props.getSubRows ? {getSubRows} : {})}` 패턴" 동일 패턴을 5 alias 의 모든 optional prop 에 일괄 적용:

```tsx
{...(props.pagination !== undefined ? { pagination: props.pagination } : {})}
{...(props.rowSelection !== undefined ? { rowSelection: props.rowSelection } : {})}
// ... 동일 패턴
```

### 영향

- 기능적 동등 (undefined 전달 vs spread skip — Grid 기본값 fallback 동일)
- `buildTableOptions.ts` L194 동일 패턴 (precedent)
- exactOptionalPropertyTypes 환경 호환

---

## 6. Grid.tsx D5 narrowing — `defaultExpanded: ExpandedState | boolean` → `useState<ExpandedState>`

### 발견

Spec Section 11.1 Step 8 코드 `useState<ExpandedState>(props.defaultExpanded ?? {})` 은 `props.defaultExpanded: ExpandedState | boolean | undefined` 의 nullish coalescing 결과 `ExpandedState | boolean` (false 포함) 를 `useState<ExpandedState>` 에 전달 → tsc fail (TS2345).

### 결정

명시적 narrowing helper:

```tsx
const initialExpanded: ExpandedState =
  props.defaultExpanded === true
    ? true
    : typeof props.defaultExpanded === 'object'
      ? props.defaultExpanded
      : {};
const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);
```

### 영향

- 기능적 동등: `true` → 전체 펼침, `Record<string, boolean>` → 특정 row 펼침, `false`/`undefined` → `{}` (전체 접힘 — AS-IS TreeGrid.tsx:35 동일)
- types.ts `defaultExpanded?: ExpandedState | boolean` 시그니처 유지 (D5 + AS-IS 호환)

---

## 7. 사전 발견 — 무관 빌드 에러 (PayReal01EditModal.tsx — G-005 무관)

`tw-framework-front/src/pages/tomis/payroll/components/PayReal01EditModal.tsx` L83 의 JSDoc 주석 `/** LIST001 행에서 a*/b* 항목값 prefill 용 */` 에 `*/` 가 코멘트 종료로 파싱 → 7개 syntax error 발생.

**G-005 무관** (Read 확인 — payroll 디렉토리 무수정). 본 IMPLEMENT 범위 외이므로 surgical changes 원칙(C-1 + 사용자 CLAUDE.md L65) 준수 — 미수정. MOD-GRID-17 영역 또는 별도 hot-fix Goal.

본 에러는 G-005 사용처 3 파일 (SlipListPage/AdminSlipEditPage/MenuManagePage) 의 import 경로 변경 검증과 무관 — Spec AC-007 충족 판정 시 이 에러는 계산에서 제외.

---

## 8. C-13 시각 회귀 baseline — 환경 deferred

### 결정 (D9)

본 G-005 첫 사용처 마이그레이션 + migrationImpact: high → C-17 시각 회귀 baseline 의무.

**현 환경 상태**:
- Storybook 미설치 (`packages/grid-core/src/__stories__/` 디렉토리 부재 — Glob 확인)
- Chromatic 미설정 (CI 통합 없음)
- 수동 스크린샷 도구 미가용 (CI 환경 외)

**1차 보증 (정적)**:
- 코드 정적 분석: 5 alias 의 `<Grid {...mapped}>` props 매핑이 AS-IS BaseGrid/VirtualGrid/.../TreeGrid 와 시그니처 동치 (D11)
- VirtualGrid defaults `40/500` 보존 명시 (Grid `36/400` 와 다름 — C-13 의무)
- TreeGrid `expandAll={true}` → `defaultExpanded={true}` D5 매핑 (외관 보존)
- ColumnPinGrid filter 미wiring (BaseGrid 와 다름) AS-IS 동등
- tsc 0 error (사용처 3 파일)

**2차 보증 (런타임 검증 deferred)**: Section 12 시각 회귀 stories 9개 + 3 사용처 baseline 스크린샷은 후속 별도 작업 필요 (도구 셋업 미완료). 본 환경 deviation 은 EC-10 와 동일 패턴.

---

## 산출 (NEW 7 + grid-core MODIFY 4 + 사용처 MODIFY 3 + tsconfig.app.json MODIFY = 15 파일)

| 분류 | 파일 |
|------|------|
| NEW (7 — `legacy/` 디렉토리) | `legacy/BaseGrid.tsx`, `legacy/VirtualGrid.tsx`, `legacy/ColumnPinGrid.tsx`, `legacy/GroupedHeaderGrid.tsx`, `legacy/TreeGrid.tsx`, `legacy/index.ts`, `legacy/useDeprecationWarn.ts` |
| MODIFY grid-core (4) | `src/Grid.tsx` (D5 6줄 narrowing), `src/types.ts` (D5 + D11 — `ExpandedState` import + `defaultExpanded` prop + `BaseGridProps` interface), `src/index.ts` (D8 — 5 alias + `BaseGridProps` re-export), `package.json` (D8 — `exports."./legacy"`), `tsup.config.ts` (D13 — multi-entry) |
| MODIFY 사용처 (3) | `SlipListPage.tsx` L21, `AdminSlipEditPage.tsx` L15, `MenuManagePage.tsx` L7 |
| MODIFY tw-framework-front (1 — promptSpecDrift) | `tsconfig.app.json` (paths mapping 4줄 추가) |

**합계 16 파일** (spec 14 + tsup.config.ts 별도 행 + tsconfig.app.json 추가).

---

## 누적 wrapper 모듈 5/5 Goal 완료

| Goal | Status | Score |
|------|--------|-------|
| G-001 | completed | 100/100/100 |
| G-002 | completed | 100/100/100 |
| G-003 | completed | 100/100/100 |
| G-004 | completed | 100/100/100 |
| **G-005** | **implement 완료 (verify 대기)** | **TBD** |

**MOD-GRID-01 wrapper 모듈 종결** — 5 Goal 5/5 IMPLEMENT 완료. Coverage Verifier + Self-Review 후 100% 완료.
