# tw-grid 31 Drift 정정 cycle — 2026-05-27

**Trigger**: spec-goals-sync.mjs 첫 실행 결과 발견된 31 Goal Pattern B/C drift 일괄 정정. 사용자 지시 "31 Drift 정정 진행 해줘" (2026-05-27).

**상태**: drift 0 완전 해소 (79/79 clean).

---

## 사이클 단계

| # | 작업 | 결과 |
|---|------|------|
| 1 | spec-goals-sync.mjs --json 으로 31 drift 정확한 list 확보 | drift 31건 목록 + counts 추출 |
| 2 | Patcher Agent (opus) 31 Goal 자율 정정 | 24 goals.json + 9 spec.md 정정 |
| 3 | 메인 spot check — 도구 재실행 | **79/79 clean, drift=0 확정** |
| 4 | state.json 자동 재계산 | grid-state-sync.mjs → totalGoals 79 동기 |

---

## 정정 결과 (Tier 분류)

### Tier 1: 단순 spec authoritative (18건) — goals.json 에 spec entries 보충
- 옵션 B 에서 누락된 entries (test/stories/index/types 등) 일괄 보충
- spec authority C-27 원칙 적용

### Tier 2: format normalization (5건) — spec.md 정정 (path absolute 화 + 백틱 정리)
- MOD-GRID-10/tracking/G-004: decisions absolute path
- MOD-GRID-10/tracking/G-005: changeMap + types + tw-framework-front 3 + decisions absolute
- MOD-GRID-99-A/license/G-001: 영향없는 파일 백틱 제거
- MOD-GRID-99-A/license/G-002: .claude absolute + NO CHANGE 백틱 제거
- MOD-GRID-99-B/docs/G-002: `monorepo/.claude/...` → `TOMIS/.claude/...` (호출자 명시 정정)

### Tier 3: 판단 필요 케이스 (8건)
- MOD-GRID-03/pagination/G-001: spec 환각 prefix 문장 정정 + table 백틱 정리
- MOD-GRID-11/range/G-001: spec prefix 선언 추가 + EULA/tw-framework-front absolute + goals +1
- MOD-GRID-11/range/G-006: 변경없음 백틱 + .claude/tw-framework-front absolute + react-virtual 백틱
- MOD-GRID-16/enhancement/G-002: F6 행 백틱 추가 (decisions absolute)
- MOD-GRID-17/migration/G-004: goals 5→4 (MyNotificationPage 제거 — D1 deferred)
- MOD-GRID-17/migration/G-005: goals 5→1 (4 deferred Pattern B → affectedUsageFiles 보존)
- MOD-GRID-99-B/docs/G-001: goals 6→7 (.claude decisions drop + .md→.mdx + custom.css + package.json)
- MOD-GRID-99-B/docs/G-004: 5=5 (datatable.md/codemod.md → dataTable-migration.md/live-demos.md)

---

## 변경 파일 (총 약 33 파일)

### goals.json (24 파일 정정)
24 Goal × 1 goals.json (단 일부 같은 모듈 공유) = 약 17 distinct files

### spec.md (9 파일 정정) — spec 측 stale + format 정정
- `MOD-GRID-00/monorepo/G-002-spec.md` (glob 백틱)
- `MOD-GRID-03/pagination/G-001-spec.md` (환각 prefix + table 백틱)
- `MOD-GRID-10/tracking/G-004-spec.md` (decisions absolute)
- `MOD-GRID-11/range/G-001-spec.md` (prefix + EULA/tw-framework-front absolute)
- `MOD-GRID-11/range/G-006-spec.md` (백틱 + absolute + react-virtual)
- `MOD-GRID-16/enhancement/G-002-spec.md` (F6 백틱)
- `MOD-GRID-99-A/license/G-001-spec.md` (백틱 제거)
- `MOD-GRID-99-A/license/G-002-spec.md` (.claude absolute + 백틱)
- `MOD-GRID-99-B/docs/G-002-spec.md` (monorepo/.claude → TOMIS/.claude)

### state.json (1 파일 자동 재계산)
grid-state-sync.mjs 실행 — totalGoals 79 유지, summary 합계 일치 보존

---

## 핵심 메타 finding

### 1. affectedUsageFiles 분리 처리 (MOD-GRID-17 케이스)
migration Goal 에서는 affectedUsageFiles (사용처) 가 spec Section 7 에 enumerate 되어 있는 경우가 있음. goals.json 의 `implementFiles` vs `affectedUsageFiles` 분리 의무:
- spec Section 7 = NEW/MODIFY 파일 (implementFiles)
- spec 별도 = 사용처 (affectedUsageFiles)

### 2. Deferred entry 보존 패턴 (MOD-GRID-17 G-004/G-005)
D# 결정에서 "deferred" 처리한 entry 는 goals.json `implementFiles` 에서 제거 + `affectedUsageFiles` 또는 audit trail 보존. spec scope reduction 원칙 (ADR-MOD-GRID-17-005) 적용.

### 3. .claude/ vs monorepo path 일관성
- decisions/ ADR: `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/...` (TOMIS root)
- monorepo packages: `D:/project/topvel_project/topvel-grid-monorepo/packages/...`
- monorepo apps/docs: `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/...`
- tw-framework-front 사용처: `D:/project/topvel_project/TOMIS/tw-framework-front/...`

### 4. spec.md 측 stale (옵션 B 범위 외) 발견
옵션 B 는 goals.json TOMIS prefix 만 정정. 본 cycle 에서 spec.md 측 잔존 stale path 9건 추가 정정.

---

## 검증 (도구 재실행 결과)

```
[spec-goals-sync] Scanning 79 goals...
Summary:
  Total Goals:    79
  Clean:          79  ✓ (전체)
  Drift:          0   ✓ (완전 해소)
  Spec missing:   0
  Parse error:    0
```

→ **drift 0** 완전 해소 확정. 메인 spot check 통과.

---

## 잔존 finding (별도 cycle 권장 — 본 사이클 외)

### 1. score JSON schema drift (grid-state-sync.mjs 보고)
- 250 files missing required keys (moduleId/tier/runAt/verifierModel/yesCount 등)
- 6 invalid stage value (예: "IMPLEMENT" 대문자)
- 230/254 short goalId
- 1 corrupt JSON whitelisted (옵션 A 에서 정정했으나 도구 whitelist stale)

→ score JSON schema 통일 cycle 권장 (옵션 D 도구 활용 가능)

### 2. tw-mail / tw-harness score JSON 동일 패턴 audit
- cross-harness universal sub-rule 도입 완료
- 단 기존 score JSON 들의 retroactive sweep 미수행

---

**사이클 종료**: 2026-05-27. spec-goals-sync.mjs 발견 31 drift 모두 해소. Pattern A/B/C 통합 정리 완료.

### Cumulative cycle 통계 (2026-05-23 ~ 2026-05-27)

| 사이클 | 정정 파일 | 결과 |
|--------|----------|------|
| MOD-GRID-09 audit + 정정 | 10 | G-003 r3 PASS, process bug + retroactive policy finding |
| 19 모듈 sweep audit | (read-only) | HEADLINE 2 + corrupt 2 + Pattern A 36 + Pattern B 23 + Pattern C 123 = 186 위반 |
| 옵션 A → B → C → D | 149 | passed 변동 0건 |
| 잔존 finding (state-sync/apps/도구/promotion/memory) | 12 | 6 rubric cross-harness promotion 완료 |
| MOD-GRID-04 G-002 drift | 4 | spec authority C-27 정렬 |
| **31 Drift 정정 (본 사이클)** | **약 33** | **drift 0 완전 해소** |

**전체 cumulative**: 약 200+ 파일 정정, **PASS/FAIL 변동 0건**, audit trail 완전화, cross-harness promotion 완료.
