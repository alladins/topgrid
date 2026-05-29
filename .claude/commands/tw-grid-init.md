# tw-grid-init — 초기 스캐폴딩 v1.0

> **호출**: `/tw-grid init [경로]` 또는 `/tw-grid init --monorepo`
> **목적**: 새 프로젝트에서 tw-grid 하네스 사용을 위한 디렉토리/파일 자동 생성.
> **참조**: tw-mail-init / tw-harness-init 패턴

---

## 호출 방식

```
/tw-grid init                        → 기본 스캐폴딩 (.claude/tw-grid/ 디렉토리 + state.json + rubric + constraints)
/tw-grid init D:\path\to\project     → 특정 프로젝트 디렉토리에 생성
/tw-grid init --monorepo             → 모노레포 스캐폴딩까지 (packages/ + apps/ + tools/) — Phase A 준비
/tw-grid init --force                → 기존 파일 덮어쓰기
/tw-grid init --check                → 상태만 확인 (생성 안 함)
```

---

## Step I-0: 사전 점검

```
existing = {
  tw-grid 디렉토리 존재?
  state.json 존재?
  constraints.md 존재?
  rubric 3개 모두 존재?
}

IF all exist AND not --force:
  → "이미 초기화됨. --force 옵션 사용 또는 /tw-grid status로 확인"
  → 종료

IF partial exist AND not --force:
  → 누락 파일만 생성 (mode: "patch")

IF none exist:
  → 전체 생성 (mode: "fresh")
```

---

## Step I-1: 디렉토리 구조 생성

```
.claude/
├── commands/                          (이미 존재 — tw-grid*.md 6개 파일)
└── tw-grid/                           ← 신규
    ├── state.json
    ├── canonical-modules.json         ← Phase 1 산출 (비어있음 — discover 시 채워짐)
    ├── constraints.md                 (Batch 1에서 작성됨)
    │
    ├── rubric/                        (Batch 1에서 작성됨)
    │   ├── specify-rubric.md
    │   ├── implement-rubric.md
    │   └── verify-rubric.md
    │
    ├── references/                    ← Phase 1 분석 캐시 (빈 디렉토리)
    │   ├── .gitkeep
    │   └── README.md
    │
    ├── decisions/                     ← ADR (빈 디렉토리)
    │   └── .gitkeep
    │
    ├── goals/                         ← Phase 2 산출
    │   └── .gitkeep
    │
    ├── artifacts/                     ← Phase 3~5 산출
    │   └── .gitkeep
    │
    ├── findings/                      ← documented-deviations
    │   ├── auto-fixed/.gitkeep
    │   └── blocked/.gitkeep
    │
    └── tools/                         ← 자동화 스크립트
        ├── grid-state-sync.mjs
        ├── grid-monitor.mjs
        └── grid-license-issue.mjs    (Pro 채택 시)
```

---

## Step I-2: state.json 초기화

`.claude/tw-grid/state.json`:

```json
{
  "version": "1.0",
  "createdAt": "{YYYY-MM-DD}",
  "lastUpdated": "{YYYY-MM-DD}",
  "config": {
    "thresholds": {
      "high": { "specify": 95, "implement": 95, "verify": 95 },
      "medium": { "specify": 90, "implement": 90, "verify": 90 },
      "low": { "specify": 85, "implement": 85, "verify": 85 }
    },
    "maxLoopsPerStage": 3,
    "verifyCategoryWeights": {
      "high": { "A": 10, "B": 15, "C": 40, "D": 25, "E": 10 },
      "medium": { "A": 15, "B": 20, "C": 30, "D": 20, "E": 15 },
      "low": { "A": 25, "B": 25, "C": 20, "D": 15, "E": 15 }
    },
    "agentModels": {
      "high": { "specify": "opus", "implement": "opus", "verify": "opus" },
      "medium": { "specify": "sonnet", "implement": "sonnet", "verify": "opus" },
      "low": { "specify": "sonnet", "implement": "sonnet", "verify": "opus" },
      "coverageVerifier": "haiku",
      "selfReview": "opus",
      "discover": "opus",
      "goals": "opus"
    },
    "bundleSizeLimits": {
      "grid-core": "30 KB",
      "grid-renderers": "10 KB",
      "grid-virtual": "15 KB",
      "grid-pro-package": "20 KB",
      "grid-meta": "150 KB"
    },
    "monorepoRoot": null,
    "monorepoEnabled": false
  },
  "phase": "init",
  "goalsIndex": [],
  "summary": {
    "totalGoals": 0,
    "completed": 0,
    "inProgress": 0,
    "pending": 0,
    "blocked": 0,
    "byTier": { "high": 0, "medium": 0, "low": 0 },
    "byPackage": { "open": 0, "pro": 0 },
    "byPhase": { "abstraction": 0, "critical-gap": 0, "wijmo-class": 0, "enhancement": 0, "migration": 0, "infra": 0 }
  },
  "buildCache": {
    "tscResult": null,
    "viteBuildResult": null,
    "sizeLimitResult": null,
    "cachedAt": null
  }
}
```

---

## Step I-3: canonical-modules.json 초기화

`.claude/tw-grid/canonical-modules.json` (비어있는 skeleton):

```json
{
  "version": "1.0",
  "generatedAt": null,
  "phase": "not-started",
  "modules": [],
  "_note": "Phase 1 discover 명령으로 자동 채워짐. 17 모듈(또는 20개 인프라 포함) 정의."
}
```

---

## Step I-4: tools/ 스크립트 생성

### grid-state-sync.mjs

```javascript
#!/usr/bin/env node
/**
 * tw-grid state-sync — goals.json fresh read → state.json 재계산
 * tw-harness state-sync.mjs와 동일 패턴
 *
 * 호출: node .claude/tw-grid/tools/grid-state-sync.mjs
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const ROOT = '.claude/tw-grid';
const STATE_FILE = join(ROOT, 'state.json');
const GOALS_DIR = join(ROOT, 'goals');

async function main() {
  const state = JSON.parse(await readFile(STATE_FILE, 'utf-8'));

  // goals/ 전체 스캔
  const modules = await readdir(GOALS_DIR);
  const goalsIndex = [];
  const summary = {
    totalGoals: 0, completed: 0, inProgress: 0, pending: 0, blocked: 0,
    byTier: { high: 0, medium: 0, low: 0 },
    byPackage: { open: 0, pro: 0 },
    byPhase: { abstraction: 0, 'critical-gap': 0, 'wijmo-class': 0, enhancement: 0, migration: 0, infra: 0 },
  };

  for (const mod of modules) {
    if (mod.startsWith('.')) continue;
    const modDir = join(GOALS_DIR, mod);
    const goalFiles = await readdir(modDir).catch(() => []);
    for (const f of goalFiles) {
      if (!f.endsWith('-goals.json')) continue;
      const data = JSON.parse(await readFile(join(modDir, f), 'utf-8'));
      for (const goal of data.goals || []) {
        summary.totalGoals++;
        summary[goal.overallStatus === 'completed' ? 'completed' :
                goal.overallStatus === 'in_progress' ? 'inProgress' :
                goal.overallStatus === 'blocked' ? 'blocked' : 'pending']++;
        const tier = goal.migrationImpact || 'medium';
        summary.byTier[tier] = (summary.byTier[tier] || 0) + 1;
        const pkg = (goal.packageTarget || '').includes('pro') ? 'pro' : 'open';
        summary.byPackage[pkg]++;
        const phase = data.phase || 'abstraction';
        summary.byPhase[phase] = (summary.byPhase[phase] || 0) + 1;

        goalsIndex.push({
          key: `${mod}/${data.area || ''}/${goal.goalId}`,
          moduleId: mod, area: data.area, goalId: goal.goalId,
          title: goal.title, priority: goal.priority, migrationImpact: tier,
          overallStatus: goal.overallStatus,
          stages: {
            specify: goal.stages?.specify?.status,
            implement: goal.stages?.implement?.status,
            verify: goal.stages?.verify?.status,
          },
        });
      }
    }
  }

  state.goalsIndex = goalsIndex;
  state.summary = summary;
  state.lastUpdated = new Date().toISOString().slice(0, 10);

  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`[grid-state-sync] ${summary.totalGoals} goals / ${summary.completed} completed`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

### grid-monitor.mjs

```javascript
#!/usr/bin/env node
/** tw-grid monitor — 진행 현황 대시보드 (READ-ONLY) */
import { readFile } from 'fs/promises';
const state = JSON.parse(await readFile('.claude/tw-grid/state.json', 'utf-8'));
console.log(`tw-grid v${state.version} — ${state.summary.totalGoals} goals`);
console.log(`✅ ${state.summary.completed} / 🔄 ${state.summary.inProgress} / ⬜ ${state.summary.pending} / 🚫 ${state.summary.blocked}`);
console.log(`Tier: high ${state.summary.byTier.high} / medium ${state.summary.byTier.medium} / low ${state.summary.byTier.low}`);
console.log(`Pkg: open ${state.summary.byPackage.open} / pro ${state.summary.byPackage.pro}`);
```

---

## Step I-5: references/README.md 생성

```markdown
# tw-grid references/

Phase 1 (discover) 산출물:
- `publish-aggrid-analysis.md`     ← AG Grid 13파일 패턴
- `publish-wijmo-analysis.md`      ← Wijmo 5파일 + 근태관리 패턴 (참조만, 코드 차용 X)
- `current-tanstack-analysis.md`   ← tw-framework-front 23파일 현황
- `ag-grid-feature-matrix.md`      ← AG Grid 기능 vs TanStack 매핑
- `wijmo-feature-matrix.md`        ← Wijmo 16 카테고리 매트릭스
- `usage-inventory.json`           ← 23파일 × 기능 사용 빈도

⚠️ Wijmo 분석은 패턴 학습용. C-16 (Wijmo 비도입) 절대 준수.
```

---

## Step I-6: --monorepo 옵션 (선택)

`--monorepo` 플래그 시 추가 스캐폴딩:

```
{BASE}/topvel-grid-monorepo/   (또는 user 지정 경로)
├── package.json                ← workspaces 설정 (pnpm)
├── pnpm-workspace.yaml
├── .changeset/                 ← Changeset 자동 버전 관리
│   └── config.json
├── packages/
│   ├── grid-core/
│   ├── grid-renderers/
│   ├── grid-virtual/
│   ├── grid-tracking/           (Pro)
│   ├── grid-cell-range/         (Pro)
│   ├── grid-datamap/            (Pro)
│   ├── grid-merge/              (Pro)
│   ├── grid-multi-header/       (Pro)
│   ├── grid-aggregation/        (Pro)
│   ├── grid-export/             (Pro)
│   ├── grid-master-detail/      (Pro)
│   ├── grid-license/            (Pro 채택 시)
│   └── grid/                    (메타 — all-in-one)
├── apps/
│   ├── docs/                    (Docusaurus)
│   ├── playground/              (Vite)
│   └── examples/                (Storybook)
└── tools/
    └── grid-cli/                (scaffold + license 발급)

각 패키지는 init 시 skeleton만 생성:
- package.json (name + version 0.0.0 + license)
- tsconfig.json (extends 루트)
- src/index.ts (export 비어있음)
- README.md (Phase A 이후 작성)
```

---

## Step I-7: 헤더 출력

```
╔══════════════════════════════════════════════════════════════════╗
║  tw-grid init 완료                                                ║
║  ⚠️ 다음: /tw-grid discover (Phase 1 시작)                       ║
╚══════════════════════════════════════════════════════════════════╝

  생성된 디렉토리: .claude/tw-grid/
  생성된 파일: state.json + constraints.md + rubric 3개 + tools 2개
  모노레포: {enabled|disabled}
  
  ──────────────────────────────────────────────────────────────────
  다음 단계:
  1. /tw-grid discover           # Phase 1: 23+13 파일 분석 + canonical 생성
  2. (검토 후) discover --approve # Phase 2: Goal 자동 도출
  3. /tw-grid loop                # Phase 3~5: 자율 루프
```

---

## 예외 처리

| 상황 | 처리 |
|------|------|
| `.claude/tw-grid/` 이미 존재 + --force 없음 | "이미 초기화됨" 출력 + 종료 |
| `tw-framework-front` 디렉토리 미존재 | 경고 출력 (discover 시 필요) — 초기화는 계속 |
| `publish` 디렉토리 미존재 | 경고 (참조 소스) — 초기화는 계속 |
| Node.js 미설치 | tools/*.mjs 실행 불가 — Node 20+ 설치 안내 |
| pnpm 미설치 + --monorepo | pnpm 설치 안내 + 모노레포 생성 보류 |

---

## Output

성공 시 `state.json`에 `phase: "discovered_pending"` 기록. 다음 단계는 `/tw-grid discover`.
