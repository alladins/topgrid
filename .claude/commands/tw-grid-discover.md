# tw-grid-discover — Phase 1 사용 현황 + 기능 매트릭스 도출 v1.0

> **호출**: `/tw-grid discover [옵션]`
> **목적**: tw-framework-front 23 파일(TanStack) + publish 13 파일(AG Grid) + publish 1 파일(Wijmo 근태) 분석하여 20개 모듈을 canonical-modules.json에 정의.
> **산출**: canonical-modules.json + references/*.md + 사용자 검토 게이트

---

## 호출 방식

```
/tw-grid discover                    → Phase 1 실행 (1차 분석 + 모듈 정의)
/tw-grid discover --rescan           → 1차부터 재실행 (기존 백업 후)
/tw-grid discover --approve          → 1차 결과 승인 → Phase 2(GOALS) 시작
/tw-grid discover --layers L0,L1     → 특정 레이어만 분석
```

---

## Step D-1: 5-레이어 인벤토리 수집 (병렬)

### L0: tw-framework-front 현 사용처
```
Glob: tw-framework-front/src/**/*.tsx
Grep: "useReactTable|createColumnHelper|getCoreRowModel"
→ 23 파일 식별 (기존 분석 결과 + 신규 사용처 합산)

각 파일별로 추출:
- 사용한 Grid variant (BaseGrid/EditableGrid/ChangeTrackingGrid 등)
- columnDef 패턴 (accessor / cell renderer)
- 상태 관리 (sorting/filter/selection/pagination)
- 사용 시나리오 (페이지 또는 모달)

결과: references/current-tanstack-analysis.md
```

### L1: TanStack Table v8 API 인벤토리
```
WebFetch: https://tanstack.com/table/v8/docs/api/core/table
또는 로컬 @tanstack/react-table/package.json + types.d.ts Read

결과:
- 사용 가능한 hook + utility 목록 (24개 정도)
- column features (sorting/filtering/grouping/aggregating)
- row features (selection/expanding/pinning)
- table features (pagination/virtualization)

결과: references/tanstack-api-inventory.md
```

### L2.A: publish AG Grid 패턴
```
Glob: publish/src/**/*.tsx
Grep: "AgGridReact|ag-grid-react"
→ 13 파일 식별

추출:
- columnDefs 옵션 사용 빈도 (sortable/filter/editable/cellRenderer/valueGetter)
- gridOptions / defaultColDef
- 인라인 편집 패턴 (onCellValueChanged)
- rowSelection (single/multiple)
- 테마/스타일 (alpine/quartz/legacy)

결과: references/publish-aggrid-analysis.md (이미 작성됨 — 기존 분석 재사용)
```

### L2.W: publish Wijmo 패턴 (참조만, C-16 — 코드 차용 X)
```
파일: publish/src/components/common/wijmo-grid/* (5파일)
파일: publish/src/app/personal/commute-manage/organizeSchedule/page.tsx (근태관리 1파일)

추출:
- CollectionView trackChanges 패턴
- buildChangeSet (added/removed/updated 분리)
- FlexGrid 옵션 (frozenColumns/AllowMerging/SelectionMode)
- formatItem 조건부 스타일
- drag-fill + context menu

결과: references/publish-wijmo-analysis.md (이미 작성됨 — 기존 분석 재사용)
⚠️ 참조만 — packages/* 코드 차용 금지 (C-16)
```

### L3: AG Grid + Wijmo 공식 기능 매트릭스
```
WebFetch:
- https://www.ag-grid.com/javascript-data-grid/feature-overview/
- https://developer.mescius.com/wijmo/flexgrid-javascript-data-grid

추출 (각 기능 → TanStack 보유 여부 비교):
- AG Grid Community vs Enterprise 구분
- Wijmo FlexGrid 16 카테고리
- TanStack v8 미보유 기능 (gap)

결과:
- references/ag-grid-feature-matrix.md
- references/wijmo-feature-matrix.md
```

---

## Step D-2: 매칭 분석 + 갭 도출

```
gap_matrix = {
  feature_name: {
    aggrid_community: ✓|✗,
    aggrid_enterprise: ✓|✗,
    wijmo: ✓|✗,
    tanstack_v8: ✓|✗,
    tw_framework_front_현구현: ✓|partial|✗,
    publish_사용여부: ✓|✗
  }
}

도출 분류:
- Already-have: TanStack + tw-framework-front 모두 보유
- Critical-gap: AG Grid Enterprise/Wijmo는 있고 TanStack/tw-framework-front 없음 + publish 실사용
- Nice-to-have: AG Grid/Wijmo는 있지만 publish 미사용
- TanStack-only: TanStack만 보유 (강점)

결과: references/feature-gap-matrix.md
```

---

## Step D-3: 20개 모듈 정의 (canonical-modules.json 생성)

```json
{
  "version": "1.0",
  "generatedAt": "{YYYY-MM-DD}",
  "phase": "discovered",
  "modules": [
    {
      "moduleId": "MOD-GRID-00",
      "moduleName": "모노레포 + 빌드/배포 인프라",
      "category": "infra",
      "phase": "infra",
      "migrationImpact": "high",
      "thresholds": { "specify": 95, "implement": 95, "verify": 95 },
      "packageTarget": "monorepo-root",
      "affectedUsageFiles": [],
      "referenceAGGrid": [],
      "referenceWijmo": [],
      "expectedFeatures": [
        { "featureId": "F-00-01", "name": "pnpm workspaces 설정", "priority": "P0" },
        { "featureId": "F-00-02", "name": "Changeset 자동 버전", "priority": "P0" },
        { "featureId": "F-00-03", "name": "size-limit 통합", "priority": "P0" }
      ]
    },
    {
      "moduleId": "MOD-GRID-01",
      "moduleName": "공통 wrapper 컴포넌트",
      "category": "abstraction",
      "phase": "abstraction",
      "migrationImpact": "high",
      "thresholds": { "specify": 95, "implement": 95, "verify": 95 },
      "packageTarget": "packages/grid-core",
      "licenseTier": "MIT",
      "affectedUsageFiles": [
        "tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx",
        "tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx",
        "tw-framework-front/src/components/DataTable/data-table.tsx",
        "...(8 variant 전체)"
      ],
      "referenceAGGrid": ["AggridTable.tsx"],
      "referenceWijmo": ["FlexGrid"],
      "expectedFeatures": [
        { "featureId": "F-01-01", "name": "<DataGrid mode='client|server'> 통합 props", "priority": "P0" },
        { "featureId": "F-01-02", "name": "ref API (table instance 외부 접근)", "priority": "P1" },
        { "featureId": "F-01-03", "name": "Theme 토큰 (Tailwind class 기반)", "priority": "P1" }
      ]
    },
    /* ... MOD-GRID-02 ~ MOD-GRID-17 ... (17개 더) */
    {
      "moduleId": "MOD-GRID-99-A",
      "moduleName": "라이선스 검증 시스템",
      "category": "infra",
      "phase": "infra",
      "migrationImpact": "high",
      "thresholds": { "specify": 95, "implement": 95, "verify": 95 },
      "packageTarget": "packages/grid-license",
      "licenseTier": "Pro",
      "expectedFeatures": [
        { "featureId": "F-99-A-01", "name": "JWT 라이선스 키 검증", "priority": "P0" },
        { "featureId": "F-99-A-02", "name": "ed25519 서명 검증 (오프라인)", "priority": "P0" },
        { "featureId": "F-99-A-03", "name": "워터마크 UI (만료 시)", "priority": "P1" }
      ]
    },
    {
      "moduleId": "MOD-GRID-99-B",
      "moduleName": "문서/데모 사이트 + Storybook",
      "category": "infra",
      "phase": "infra",
      "migrationImpact": "medium",
      "thresholds": { "specify": 90, "implement": 90, "verify": 90 },
      "packageTarget": "apps/docs + apps/playground + apps/examples",
      "expectedFeatures": [
        { "featureId": "F-99-B-01", "name": "Docusaurus 또는 Nextra 문서", "priority": "P0" },
        { "featureId": "F-99-B-02", "name": "Vite playground (인터랙티브)", "priority": "P0" },
        { "featureId": "F-99-B-03", "name": "Storybook 시나리오", "priority": "P1" }
      ]
    }
  ]
}
```

**전체 20 모듈** (5 abstraction + 4 critical-gap + 6 wijmo-class + 1 enhancement + 1 migration + 3 infra)

---

## Step D-4: 사용자 검토 게이트 (1차)

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid Phase 1 (DISCOVER) 완료 — 사용자 검토 필요               ║
╚══════════════════════════════════════════════════════════════════╝

  분석 대상:
   - tw-framework-front: {N}개 파일 (TanStack Table 사용처)
   - publish: {M}개 파일 (AG Grid {AG}개 + Wijmo {W}개)
   - 공식 docs: AG Grid + Wijmo FlexGrid 16 카테고리

  도출된 모듈: 20개
   ┌────────────────────────────────────────────────────────────┐
   │ Phase            │ 개수 │ 대표 모듈                          │
   ├──────────────────┼──────┼─────────────────────────────────┤
   │ abstraction      │   5  │ MOD-GRID-01 공통 wrapper          │
   │ critical-gap     │   4  │ MOD-GRID-06 Excel/PDF Export      │
   │ wijmo-class      │   6  │ MOD-GRID-10 ChangeTracking 강화   │
   │ enhancement      │   1  │ MOD-GRID-16 마스터-디테일         │
   │ migration        │   1  │ MOD-GRID-17 사용처 마이그레이션   │
   │ infra            │   3  │ MOD-GRID-00 모노레포 인프라        │
   └────────────────────────────────────────────────────────────┘

  Critical 발견:
   ⭐ Wijmo 근태관리(commute-manage/organizeSchedule) 마이그레이션:
      필요 기능 5개 (DataMap/CellRange+Dragfill/Multi-row Header/Cell Merging/ChangeTracking)
      → 모두 Pro 패키지로 분류
   ⭐ AG Grid Enterprise 대비 갭 4개 (Excel/Filter UI/Multi-sort/Group)
   ⭐ MIT 정책 강화: Wijmo 도입 금지 (C-16) — 17 모듈 직접 구현

  생성된 파일:
   📋 .claude/tw-grid/canonical-modules.json
   📋 .claude/tw-grid/references/current-tanstack-analysis.md
   📋 .claude/tw-grid/references/ag-grid-feature-matrix.md
   📋 .claude/tw-grid/references/wijmo-feature-matrix.md
   📋 .claude/tw-grid/references/feature-gap-matrix.md
   📋 .claude/tw-grid/references/publish-aggrid-analysis.md
   📋 .claude/tw-grid/references/publish-wijmo-analysis.md

  ────────────────────────────────────────────────────────────────
  다음 단계 (사용자 결정):
   ✅ 위 분류 OK → /tw-grid discover --approve  (Phase 2 시작)
   🔄 조정 필요 → canonical-modules.json 직접 수정 후 --approve
   ❌ 재실행   → /tw-grid discover --rescan
```

---

## Step D-5: --approve 시 Phase 2 자동 진입

```
사용자가 /tw-grid discover --approve 호출:

1. canonical-modules.json의 phase를 "approved"로 변경
2. state.json의 phase를 "goals_pending"으로
3. tw-grid-goals.md 지침으로 위임 (자동) — Phase 2 시작
```

---

## Agent 위임 (C-15 의무)

**Discover Agent 호출** (메인이 직접 분석 금지):
```
subagent_type: "general-purpose"
model: "opus"   ← 광범위 분석 (23+13 파일 + AG Grid/Wijmo 공식 docs)
prompt:
  당신은 tw-grid Discovery Agent입니다.
  constraints.md (C-1~C-25), 특히 C-15(Agent 위임)/C-16(Wijmo 비도입) 준수.

  ## 임무
  Phase 1 5-레이어 분석 수행:
  1. L0: tw-framework-front/src/**/*.tsx 23 파일 분석 (현 TanStack 사용처)
  2. L1: @tanstack/react-table v8 API 인벤토리
  3. L2.A: publish/src/**/*.tsx 13 파일 (AG Grid 패턴)
  4. L2.W: publish/src/components/common/wijmo-grid/ + 근태관리 (Wijmo 참조)
  5. L3: AG Grid + Wijmo 공식 docs (WebFetch)

  ## 산출
  - canonical-modules.json (20 모듈)
  - references/ 7개 파일

  ## 모듈 정의 기준 (5 + 4 + 6 + 1 + 1 + 3 = 20)
  - abstraction: BaseGrid 8 variant 통합 (5개)
  - critical-gap: AG Grid Enterprise 대비 갭 (4개)
  - wijmo-class: Wijmo 핵심 5 기능 + Aggregation (6개)
  - enhancement: Master-Detail (1개)
  - migration: 사용처 8 variant → 신규 wrapper (1개)
  - infra: 모노레포 + 라이선스 + 문서 (3개)

  ## 반환
  생성된 파일 경로 목록 + 모듈 카운트 + critical 발견 요약.
  파일 내용 출력 금지 (토큰 절약).
```

---

## 출력 형식 (사용자 표시)

위 Step D-4 출력 형태로 사용자에게 결과 보고. 검토 후 `--approve` 대기.
