# MOD-GRID-14 — Architecture Decision Records

Module: `@tomis/grid-pro-header` (Multi-row Header / Column Groups, Pro, gzipped ≤ 20 KB)
Authored: 2026-05-15

---

## ADR-MOD-GRID-14-001 — createColumnGroup API 시그니처 및 렌더링 전략 (G-001 D1)

**Status**: Accepted (2026-05-15, G-001 implement)

### Context

`tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` (L0, spec Section 1.1)는
TanStack v8의 `{ header: string; columns: ColumnDef<TData>[] }` 리터럴 패턴으로 다단 헤더를
이미 올바르게 구현하고 있다. MOD-GRID-14의 목적은 이 패턴을 Pro 패키지로 격리하고
typed helper + 재사용 가능 컴포넌트로 표준화하는 것이다.

두 가지 경쟁 접근 방식을 검토하였다:
- **대안 A**: Wijmo 스타일 헤더 행 직접 조작 (`hdr.rows.push()` + `setCellData()`)
- **대안 B**: AG Grid Column Groups (Enterprise) 패턴

또한 MultiRowHeader 렌더링 전략으로 다음 두 가지를 비교하였다:
- **렌더링 전략 C**: 구현자가 rowSpan을 수동 계산하여 flat 컬럼을 전체 헤더 높이로 span
- **렌더링 전략 D**: TanStack placeholder 메커니즘 신뢰 — `isPlaceholder=true` 셀을 빈 `<th>`로 렌더

### Decision

`createColumnGroup<TData>(config: { header: string; columns: ColumnDef<TData>[] }): GroupColumnDef<TData>`
thin wrapper를 채택한다. 반환 값은 `{ header: config.header, columns: config.columns }` 그대로이며
TanStack 네이티브 `GroupColumnDef<TData>` 구조를 그대로 반환한다.

MultiRowHeader는 렌더링 전략 D(TanStack placeholder 신뢰)를 채택한다.
수동 rowSpan 계산 코드를 추가하지 않는다 (spec §11.2 명시).

### Alternatives Considered

**대안 A: Wijmo 스타일 헤더 행 직접 조작**

Wijmo(`@mescius/wijmo-grid`) 는 `hdr.rows.push(new wjGrid.Row())` + `hdr.rows[0].allowMerging = true`
+ `hdr.setCellData(0, c, '15')` 방식으로 헤더 행 구조를 명령형으로 직접 조작한다
(`publish-wijmo-analysis.md §3` 확인).

- 거부 이유 1: **C-16 절대 위반** — `@mescius/wijmo*` import는 전 패키지에서 금지.
  Wijmo 상용 라이선스 ($695+/user/year) 와 tw-framework-front MIT-only 정책 충돌.
- 거부 이유 2: TanStack `useReactTable` + `getHeaderGroups()` 와 통합 불가 — 컬럼 정의 트리 기반
  자동 행 생성 메커니즘과 명령형 DOM 조작 방식이 상호 배타적이다.
- Trade-off: 거부함으로써 Wijmo 사용자에게 친숙한 명령형 API를 포기하지만, MIT 라이선스 준수와
  TanStack 에코시스템 통합을 얻는다.

**대안 B: AG Grid Column Groups (Enterprise) 패턴**

AG Grid Community는 네이티브 Column Grouping이 없다 (`publish-aggrid-analysis.md` 확인).
Enterprise(`ag-grid-enterprise`)의 `columnGrouping` 모듈은 `columnDefs` 에서 `children` 배열로
그룹을 정의하는 패턴이다.

- 거부 이유 1: **C-7 위반** — `ag-grid-community`, `ag-grid-react`, `ag-grid-enterprise` 신규
  dependency 도입 금지. publish의 AG Grid는 기존 유지(마이그레이션 별도)이며 신규 도입 불가.
- 거부 이유 2: Enterprise 라이선스 필요 — Community 버전에는 Column Grouping 없음.
  상용 Pro 패키지에 또 다른 상용 라이브러리 dependency를 체인하는 것은 라이선스 복잡도를 높인다.
- Trade-off: 거부함으로써 AG Grid의 성숙한 Column Grouping UI 기능(드래그 그룹 재배치 등)을
  포기하지만, zero-new-runtime-dependency + MIT 에코시스템 일관성을 얻는다.

### Trade-offs

1. **thin wrapper vs no-op trade-off**: `createColumnGroup`은 로직 없는 thin wrapper이므로
   tree-shaking 이후 번들 기여분이 < 500 bytes이다. 그러나 소비자가 TanStack 네이티브 리터럴
   (`{ header, columns }`)을 직접 사용하는 것 대비 API 이름 학습 비용이 발생한다.
   채택 이유: typed generic 시그니처가 잘못된 타입의 `columns` 배열을 컴파일 타임에 차단한다.

2. **placeholder 신뢰 vs rowSpan 수동 계산 trade-off**: TanStack placeholder 메커니즘에 의존하면
   3단 이상 중첩 그룹(`EC-02`)도 `getHeaderGroups()` 자동 처리로 동작한다. 반면 rowSpan을 수동
   계산하면 flat + group 혼합 시 정확한 시각적 병합을 보장할 수 있다. 채택 이유: TanStack placeholder
   는 표준 동작이며 L0 `GroupedHeaderGrid.tsx`에서 이미 동일 패턴으로 검증되었다 (spec §1.1).
   rowSpan 수동 계산은 EC-03(hidden columns colSpan=0)과 EC-04(flat-only)에서 추가 복잡도를 유발한다.

### Consequences

- `createColumnGroup` + `MultiRowHeader`는 G-001 신규 패키지 코드만 담당한다.
- `GroupedHeaderGrid.tsx` alias 재작성은 G-003으로 위임 (spec §8.1 + §11.3).
- Grid.tsx에 MultiRowHeader를 통합하는 작업은 G-002(sticky/frozen 통합)와 함께 처리한다 (spec §11.3).
- 3단+ 중첩 그룹(EC-02)은 별도 구현 없이 TanStack 자동 처리로 동작한다.

### References

- Spec: `artifacts/MOD-GRID-14/header/G-001-spec.md` Sections 2, 5.1, 5.2, 11.2, 11.3.
- Constraints: C-2 (TanStack v8), C-4 (no any), C-5 (Tailwind only), C-7 (AG Grid 금지),
  C-16 (Wijmo 금지), C-22 (peerDeps), C-24 (EULA + verifyOrWarn).
- L0 증거: `GroupedHeaderGrid.tsx` L75-117 (동일 패턴 선행 구현).
- References analysis: `references/publish-wijmo-analysis.md §3`, `references/publish-aggrid-analysis.md`.

---

## ADR-MOD-GRID-14-002 — grid-license 인라인 stub 사용 (G-001 환경 제약)

**Status**: Accepted (2026-05-15, G-001 implement)

### Context

spec §5.4는 `import { verifyOrWarn } from '@tomis/grid-license'` 를 명시하고
package.json에 `"@tomis/grid-license": "workspace:*"` 추가를 요구한다.
그러나 다음 두 환경 제약이 동시 발생:

1. `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-license/src/index.ts`가
   `export {};` stub 상태 — MOD-GRID-99-A/G-002 미완료. `verifyOrWarn` 미export.
2. namespace import 시 TS2307 "Cannot find module '@tomis/grid-license'" 발생 가능
   (pnpm workspace symlink 부재 환경).

C-24 Pattern Catalog Note (constraints.md L252-285)는 이 상황에 대한 인라인 stub fallback
패턴을 명시하며, `grid-pro-tracking/src/index.ts`(1st occurrence)와
`grid-pro-merging/src/MergingGrid.tsx` ADR-MOD-GRID-13-002(2nd occurrence)가 선행 사례이다.

### Decision

인라인 stub 패턴 적용:
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-header');
```

`package.json`에는 `"@tomis/grid-license"` 를 `dependencies`가 아닌
`peerDependenciesMeta.optional = true`로 선언하여 pnpm 미설치 환경 대응.

### Replacement Obligation

MOD-GRID-99-A/G-002 완료 후 `src/index.ts` 상단 인라인 stub을 다음으로 교체:
```typescript
import { verifyOrWarn } from '@tomis/grid-license';
```
이 교체 의무는 MOD-GRID-99-A/G-002 담당 Implementer에게 전달된다.

### Alternatives Considered

**대안 A: `@ts-ignore`로 namespace import 강제**
- 거부 이유: C-4 (`// @ts-ignore` 금지) + C-24 Pattern Catalog Note 금지 항목 명시.

**대안 B: package.json `dependencies`에 workspace:* 추가 후 conditional import**
- 거부 이유: pnpm install 미실행 환경에서 TS2307 런타임 에러 발생.
  `export {};` stub 상태에서 named import 시 "does not provide an export named" 런타임 오류.

### Trade-offs

1. 인라인 stub 채택 시 MOD-GRID-99-A/G-002 미완료 중에도 tsc 0 errors + 런타임 정상 동작.
   단, 실제 라이선스 검증(서명/만료/도메인 체크)은 실행되지 않는다.
2. MOD-GRID-99-A/G-002 완료 후 교체 작업이 별도 PR로 필요하다 (1 extra Goal). 그러나 이 작업은
   3rd occurrence 시 C-24 Pattern Catalog Note 정책으로 자동 포함될 예정이다.

### References

- Constraints: C-24 Pattern Catalog Note (constraints.md L252-285).
- Precedent: `grid-pro-tracking/src/index.ts` (1st), ADR-MOD-GRID-13-002 (2nd).
- Spec: `artifacts/MOD-GRID-14/header/G-001-spec.md` §5.4 + AC-005.

---

## Prompt-Spec Drift 보고 (C-27 / F-05)

| field | promptValue | specValue | resolution |
|-------|-------------|-----------|------------|
| GroupedHeaderGrid.tsx scope | "UPDATE — alias 매핑, C-6" | "G-001에서 변경 없음, alias 작업은 G-003 범위" (spec §8.1) | spec applied — GroupedHeaderGrid.tsx not modified |
| MOD-GRID-14-decisions.md path | worktree `.claude/worktrees/tw-grid-mod14-g001/.claude/tw-grid/decisions/MOD-GRID-14-decisions.md` | main `.claude/tw-grid/decisions/MOD-GRID-14-decisions.md` (spec Section 7 row 7) | spec applied — written to main path |

**근거 (GroupedHeaderGrid.tsx)**: spec Section 7 final implementFiles 표 7건에 GroupedHeaderGrid.tsx 미포함.
spec §8.1: "G-001에서 이 파일의 실제 변경은 없음 — G-001은 신규 패키지 생성이 주 목적이며, alias 재작성은 G-003이 담당." C-27 + C-33 + F-02에 따라 spec 우선 적용.

**근거 (decisions.md path)**: spec Section 7 row 7은 main 경로를 명시.
prompt는 worktree 경로를 지정했으나, C-27/C-33 원칙에 따라 spec 우선 적용.
main 경로에 decisions.md 작성 완료.
