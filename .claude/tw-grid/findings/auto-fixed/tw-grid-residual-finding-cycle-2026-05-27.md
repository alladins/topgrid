# tw-grid 잔존 finding cycle — 2026-05-27

**Trigger**: 19 모듈 sweep 정정 cycle (옵션 A→B→C→D) 종료 후 잔존 finding 4건 + MOD-GRID-04 G-002 drift 1건 일괄 처리. 사용자 지시 "다음 작업을 계속 진행해야지" (2026-05-27).

**상태**: 잔존 finding 모두 완료.

---

## 처리 단계 (6 sub-task)

| # | 작업 | 결과 |
|---|------|------|
| **1** | MOD-GRID-04 G-002 spec↔goals drift | 4 파일 정정 (goals + state.json entry + state.json byTier + specify-score) |
| **2** | state.json summary -1 차이 보정 | `grid-state-sync.mjs` 실행 → totalGoals 80→79, byTier/byPackage/byPhase 모두 79 합계 일치 |
| **3** | apps/docs (TOMIS prefix) 정책 결정 + 정정 | 실 위치 `monorepo/apps/docs` 확정 + TOMIS/apps 잔존 0건 (MOD-GRID-99-B G-001/G-004 10 entries 정정) |
| **4** | `tools/spec-goals-sync.mjs` 도구 작성 | 새 도구 1 파일 (Pure Node.js, read-only audit, CI 통합 가능) |
| **5** | Cross-harness rubric promotion | tw-harness 3 rubric (v1.5/v1.4/v1.5) + tw-mail 3 rubric (v1.2.0/v1.2.0/v1.2.0) 일괄 sub-rule 추가 |
| **6** | 메모리/finding 갱신 | `feedback-tw-grid-spec-goals-sync.md` promotion 완료 marker + 본 finding 작성 |

---

## 핵심 결과

### 1. state.json summary 완전화
- 이전: totalGoals=80, byTier 합=79 (-1 차이)
- 정정 후: totalGoals=79, byTier/byPackage/byPhase 모두 79 합계 일치
- `grid-state-sync.mjs` 도구 자동 재계산 — drift 0

### 2. spec-goals-sync.mjs 첫 실행 결과
```
Total Goals: 79
Clean:       48
Drift:       31
Parse error: 0
```

**Drift 31건 breakdown** (Pattern B/C 잔존 — 본 cycle 옵션 B는 Pattern A만 해소):
- MOD-GRID-00 G-002: spec brace-expansion (`grid-{renderers,export,...}`) vs goals.json 미열거
- MOD-GRID-00 G-004: spec 12 CHANGELOG.md vs goals.json 미포함
- MOD-GRID-02 G-005/G-006: .test.ts/.stories.tsx spec에는 있고 goals.json엔 없음
- MOD-GRID-03 G-001: spec STILL `D:/project/topvel_project/TOMIS/packages/pagination/...` (spec.md 측 stale, 옵션 B는 goals.json만 정정)
- MOD-GRID-99-B G-002: spec 측 잘못된 decisions path (`monorepo/.claude/...`)
- MOD-GRID-10/11 등: affectedUsageFiles가 spec Section 7에는 있고 goals.json엔 없음

→ **별도 cycle 권장**: 본 cycle은 finding 발견 + 도구 도입까지. 정정은 다음 사이클.

### 3. Cross-harness universal promotion 완료
6 rubric 파일 sub-rule 동일 본문:
```
**★ yesCount/naCount mechanical 재계산 의무 (2026-05-27 cross-harness promotion from tw-grid)**:
- Verifier 는 점수 산정 직후 checks 객체 순회하여 result == "YES" / "N/A" mechanical count = top-level yesCount/naCount 일치 확인 의무
- 불일치 시 동일 결과 폐기 후 새 Agent 인스턴스 재호출
- 메타 게이트 별도집계 signal: score JSON 에 rubricMetadata.evaluableItems 명시 의무
```

| 하네스 | specify | implement | verify(or be-verify) |
|--------|---------|-----------|----------------------|
| tw-grid | v1.0.10 | v1.0.14 | v1.0.7 |
| tw-harness | v1.5 | v1.4 | be-verify v1.5 |
| tw-mail | v1.2.0 | v1.2.0 | v1.2.0 |

### 4. tw-mail SSoT 결정
- 옵션 A 채택 (rubric 본문 직접 추가)
- 사유: scoring discipline은 도메인 정책 아닌 verifier 절차. policies/ 의 6 도메인 정책 (TENANT/AUTH/MAIL-RES/MAIL-SEC/DRIFT/BUILD) 과 차이.
- Phase 2B "Evidence Quality Standard" 선례 동등.

---

## 변경 파일 (총 약 12 파일)

### state.json/goals.json (2 파일)
- `goals/MOD-GRID-04/column-goals.json` (G-002 migrationImpact medium→low)
- `state.json` (grid-state-sync 자동 재생성, totalGoals 80→79, summary 합계 일치)

### goals.json apps/docs 정정 (1 파일)
- `goals/MOD-GRID-99-B/docs-goals.json` (G-001 5 + G-004 5 entries TOMIS→monorepo)

### 도구 1 파일 신규
- `tools/spec-goals-sync.mjs` (~400줄, Pure Node.js)

### rubric 6 파일 promotion
- `.claude/tw-harness/rubric/specify-rubric.md` (v1.4→v1.5)
- `.claude/tw-harness/rubric/implement-rubric.md` (v1.3→v1.4)
- `.claude/tw-harness/rubric/be-verify-rubric.md` (v1.4→v1.5)
- `.claude/tw-mail/rubric/specify-rubric.md` (v1.1.0→v1.2.0)
- `.claude/tw-mail/rubric/implement-rubric.md` (v1.1.0→v1.2.0)
- `.claude/tw-mail/rubric/verify-rubric.md` (v1.1.0→v1.2.0)

### 메모리 1 파일 갱신
- `memory/feedback-tw-grid-spec-goals-sync.md` (promotion N=3+ 완료 marker + cross-harness 상태표)

### G-002 specify-score 1 파일
- `artifacts/MOD-GRID-04/column/G-002-specify-score.json` (migrationImpact medium→low)

---

## 잔존 finding (다음 cycle 권장)

| 항목 | 부담 | 비고 |
|------|------|------|
| 31 Drift (Pattern B/C, spec-goals-sync.mjs 발견) | 중간 | 각 Goal 별 spec vs goals 비교 후 정정 |
| MOD-GRID-03 G-001 spec.md 측 stale TOMIS prefix | 작음 | 단일 spec 정정 (옵션 B에서 누락) |
| MOD-GRID-99-B G-002 decisions/ 위치 spec 측 잘못 | 작음 | 단일 spec 정정 |
| MOD-GRID-10/11 affectedUsageFiles ↔ goals.json drift | 중간 | 모듈별 분리 정정 |

---

**사이클 종료**: 2026-05-27. 잔존 finding 4건 + G-002 drift 1건 모두 처리 완료. 다음 cycle 은 사용자 지시 시 시작 (31 Drift 정정 권장 우선순위).
