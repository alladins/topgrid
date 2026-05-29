# tw-grid-goals — Phase 2 Goal 자동 도출 v1.0

> **호출**: `/tw-grid discover --approve` 또는 `/tw-grid discover goals [moduleId]`
> **목적**: Phase 1 승인된 canonical-modules.json을 기반으로 20개 모듈 × N Goal을 자동 생성.
> **산출**: `.claude/tw-grid/goals/{moduleId}/{area}-goals.json` 20+ 파일

---

## 호출 방식

```
/tw-grid discover --approve            → Phase 1 승인 + 20 모듈 Goal 일괄 자동 생성
/tw-grid discover goals                → Goal 자동 생성만 재실행
/tw-grid discover goals {moduleId}     → 특정 모듈만 Goal 재도출
/tw-grid discover goals --modules MOD-GRID-01,MOD-GRID-10  → 선택 모듈만
```

---

## Step G-1: 모듈별 Goal 분해 (병렬 Agent)

각 모듈에 대해 **Goal Decomposition Agent**를 별도로 호출 (병렬 실행).

```
모듈 20개 → Agent 20번 병렬 (또는 batch 5개씩)

각 Agent 입력:
- moduleId, moduleName, expectedFeatures
- affectedUsageFiles (영향 사용처 N개)
- referenceAGGrid + referenceWijmo (패턴 참조)
- 다른 모듈과의 의존성 (예: MOD-GRID-17 마이그레이션은 다른 모든 모듈 완료 후)

Agent 동작:
1. expectedFeatures를 사용자 여정 단위 Goal로 분해
2. 각 Goal에 acceptanceCriteria 정의 (3개+, 출처 태그 포함)
3. referenceEvidence 채움 (L0~L3, R-A, R-W)
4. migrationImpact 차등 (high/medium/low)
5. dependsOn 필드 (Goal 간 의존성)
6. implementFiles 예측
7. packageTarget 명시 (grid-core MIT vs grid-pro Pro)

산출: goals/{moduleId}/{area}-goals.json
```

---

## Step G-2: Goal 객체 스키마

```json
{
  "moduleId": "MOD-GRID-02",
  "moduleName": "useGridState hook",
  "area": "useGridState",
  "phase": "abstraction",
  "licenseTier": "MIT",
  "packageTarget": "packages/grid-core",
  "description": "sorting/filter/selection/pagination state를 통합 관리하는 React hook",
  "version": "1.0",
  "createdAt": "{YYYY-MM-DD}",
  "updatedAt": "{YYYY-MM-DD}",
  "goals": [
    {
      "goalId": "G-001",
      "title": "useGridState hook API 설계 (props/return 타입)",
      "priority": "P0",
      "migrationImpact": "high",
      "dependsOn": [],
      "overallStatus": "pending",
      "userStory": "개발자가 useGridState() 한 줄로 sorting/filter/selection/pagination state를 일괄 관리",
      "userJourneySteps": [
        "1. 개발자가 useGridState({ mode, initialPageSize }) 호출",
        "2. return 객체 분해 { sorting, setSorting, filters, ... }",
        "3. useReactTable의 state prop에 전달",
        "4. table 인스턴스 사용"
      ],
      "acceptanceCriteria": [
        { "id": "AC-001", "criteria": "useGridState() return은 { sorting, setSorting, filters, setFilters, rowSelection, setRowSelection, pageIndex, setPageIndex, pageSize, setPageSize } 10개 필드", "source": "L1: TanStack v8 useReactTable state API" },
        { "id": "AC-002", "criteria": "mode='server' 시 manualPagination=true + pageCount 외부 전달", "source": "L0: DataTable.tsx 현 구현" },
        { "id": "AC-003", "criteria": "TypeScript any 사용 0건", "source": "C-4 constraints" }
      ],
      "referenceEvidence": {
        "L0": "tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx (현 useState 8개 흩어진 패턴)",
        "L1": "@tanstack/react-table v8 useReactTable signature",
        "L2": "(8 variant 공통 중복 추출)",
        "L3": "tw-framework-front 23 영향 사용처",
        "R-A": "AG Grid GridApi (참조)",
        "R-W": "Wijmo CollectionView (참조, 코드 차용 X)"
      },
      "compatibilityPolicy": {
        "breaking": false,
        "deprecationStrategy": "기존 BaseGrid props는 useGridState로 점진 마이그레이션 (MOD-GRID-17에서 처리)",
        "migrationPath": "1: useGridState 신규 hook 추가 → 2: BaseGrid 내부 useGridState 사용 (props 호환) → 3: 사용처 마이그레이션"
      },
      "implementFiles": [
        "packages/grid-core/src/hooks/useGridState.ts",
        "packages/grid-core/src/types/grid-state.ts",
        "packages/grid-core/src/index.ts (export 추가)"
      ],
      "affectedUsageFiles": [
        "tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx",
        "tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx",
        "...(8 variant)"
      ],
      "bundleImpact": {
        "expected": "+2 KB gzipped",
        "package": "grid-core",
        "limit": "30 KB"
      },
      "stages": {
        "specify": { "status": "pending", "threshold": 95, "loops": 0, "maxLoops": 3, "feedback": [] },
        "implement": { "status": "pending", "threshold": 95, "loops": 0, "maxLoops": 3, "feedback": [] },
        "verify": { "status": "pending", "threshold": 95, "loops": 0, "maxLoops": 3, "feedback": [] }
      },
      "harnessReview": null
    },
    /* G-002, G-003, ... */
  ]
}
```

---

## Step G-3: Goal 분류 + 의존성 그래프

```
의존성 검사:
- abstraction (MOD-GRID-01~05): 의존성 없음 (병렬 가능)
- critical-gap (MOD-GRID-06~09): grid-core(MOD-01~05) 의존
- wijmo-class (MOD-GRID-10~15): grid-core 의존
- enhancement (MOD-GRID-16): wijmo-class 일부 의존
- migration (MOD-GRID-17): 모든 모듈 완료 후 (마지막)
- infra (MOD-GRID-00, 99-A, 99-B):
  - MOD-GRID-00 (모노레포): 가장 먼저 (Phase A 1주차)
  - MOD-GRID-99-A (라이선스): Pro 패키지 첫 출시 전
  - MOD-GRID-99-B (문서): 각 패키지 release 동시 진행
```

---

## Step G-4: Goal 수 추정 (모듈별)

| 모듈 | 영역 | 예상 Goal 수 |
|------|------|-----------|
| MOD-GRID-00 모노레포 | infra | 3~4 (pnpm, Changeset, size-limit, CI) |
| MOD-GRID-01 공통 wrapper | abstraction | 4~5 |
| MOD-GRID-02 useGridState | abstraction | 5~6 |
| MOD-GRID-03 페이지네이션 | abstraction | 3 |
| MOD-GRID-04 컬럼 팩토리 | abstraction | 3 |
| MOD-GRID-05 셀 렌더러 | abstraction | 7 (각 렌더러 1개) |
| MOD-GRID-06 Excel/PDF | critical-gap | 5 (Export/Import/PDF/Print/Clipboard) |
| MOD-GRID-07 컬럼 드래그 | critical-gap | 2 |
| MOD-GRID-08 다중 정렬 | critical-gap | 2 |
| MOD-GRID-09 Filter UI | critical-gap | 4 (Text/Number/Date/Select) |
| MOD-GRID-10 ChangeTracking | wijmo-class | 5 |
| MOD-GRID-11 Cell Range + Drag-fill | wijmo-class | 6 |
| MOD-GRID-12 DataMap | wijmo-class | 4 |
| MOD-GRID-13 Cell Merging | wijmo-class | 3 |
| MOD-GRID-14 Multi-row Header | wijmo-class | 3 |
| MOD-GRID-15 Aggregation | wijmo-class | 4 |
| MOD-GRID-16 Master-Detail + Context Menu | enhancement | 3 |
| MOD-GRID-17 사용처 마이그레이션 | migration | 10~15 (사용처 23개를 5개씩 그룹) |
| MOD-GRID-99-A 라이선스 | infra | 3 |
| MOD-GRID-99-B 문서/데모 | infra | 5 (Docusaurus/Playground/Storybook/예제/배포) |
| **총합** | | **약 80~95 Goal** |

(tw-mail 137 Goal, tw-harness 137+ Goal과 동급 규모)

---

## Step G-5: 사용자 검토 게이트 (2차)

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid Phase 2 (GOALS) 완료 — 사용자 검토                      ║
╚══════════════════════════════════════════════════════════════════╝

  생성된 Goals: {총 N개}
   ┌──────────────────────────────────────────────────────────┐
   │ Phase            │ Goals │ tier(high/med/low)  │ Pkg     │
   ├──────────────────┼───────┼────────────────────┼────────┤
   │ infra            │  10   │  10 / 0 / 0        │ -       │
   │ abstraction      │  20   │  18 / 2 / 0        │ MIT     │
   │ critical-gap     │  12   │   0 / 8 / 4        │ MIT/Pro │
   │ wijmo-class      │  25   │   5 / 18 / 2       │ Pro     │
   │ enhancement      │   3   │   0 / 2 / 1        │ Pro     │
   │ migration        │  12   │  12 / 0 / 0        │ -       │
   └──────────────────────────────────────────────────────────┘

  의존성 그래프:
   infra → abstraction → critical-gap + wijmo-class → enhancement → migration

  Critical Path:
   1. MOD-GRID-00 (모노레포) ─┐
                              ├→ MOD-GRID-01~05 (abstraction)
   2. MOD-GRID-99-A 라이선스 ─┘    │
                                    ├→ MOD-GRID-06~15 (gap + wijmo-class)
   3. MOD-GRID-99-B 문서/데모 (병렬)│
                                    └→ MOD-GRID-16 → 17

  생성된 파일: goals/MOD-GRID-XX/{area}-goals.json (20개)

  ────────────────────────────────────────────────────────────────
  다음 단계 (사용자 결정):
   ✅ Goal 목록 OK → /tw-grid 또는 /tw-grid --auto    (Phase 3~5 자율 루프)
   🔄 일부 모듈만 → /tw-grid loop MOD-GRID-XX           (특정 모듈)
   ❌ Goal 재도출 → /tw-grid discover goals [moduleId]
```

---

## Agent 위임 (C-15)

**Goal Decomposition Agent 호출** (모듈별 병렬):

```
subagent_type: "general-purpose"
model: "opus"   ← 도메인 지식 + 의존성 추론
prompt:
  당신은 tw-grid Goal Decomposition Agent입니다.
  constraints.md 사전 읽기 의무.

  ## 임무
  모듈 {moduleId}의 expectedFeatures를 사용자 여정 단위 Goal로 분해.

  ## 사전 읽기
  1. canonical-modules.json의 {moduleId} 정의
  2. references/{관련 분석} (예: MOD-GRID-10이면 publish-wijmo-analysis.md)
  3. 영향 사용처 N개 파일 (Read)

  ## Goal 분해 원칙
  - 사용자 여정 단위 (CRUD 동사가 아닌 클릭/입력/응답)
  - Goal 간 의존성 명시 (dependsOn)
  - migrationImpact 차등 (high/medium/low)
  - C-19 점진 마이그레이션 (Goal당 사용처 ≤ 5개)
  - acceptanceCriteria 3개+ (출처 태그 필수)

  ## 산출
  goals/{moduleId}/{area}-goals.json (Goal 객체 배열)

  ## 반환
  파일 경로 + Goal 카운트 + tier 분포.
```

---

## State Sync (자동)

```
Phase 2 완료 후:
node .claude/tw-grid/tools/grid-state-sync.mjs

→ goalsIndex 갱신 (모든 Goal 등록)
→ summary 갱신 (총 80~95 Goal, tier별 분포 등)
```
