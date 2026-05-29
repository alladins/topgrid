# tw-grid 19 모듈 정정 사이클 (옵션 A → B → C → D) — 2026-05-27

**사용자 지시 sequence**:
1. "rubric v1.0.10 신설 (C-26 mechanical sub-rule)" + "다음 진행"
2. "옵션 A 즉시 + 옵션 B-D 시간 두고 단계별"
3. "B → C → D 순으로 진행"

**전체 사이클 기간**: 2026-05-27 (단일 세션)

---

## 사이클 단계

| 단계 | 작업 | 결과 |
|------|------|------|
| rubric v1.0.10 | 3 rubric (specify/implement/verify) 신설 | yesCount/naCount mechanical 재계산 sub-rule + 메타 게이트 signal 의무 |
| 19 모듈 sweep audit | Single Agent (opus) | HEADLINE 2 + corrupt 2 + Pattern A 36 + Pattern B 23 + Pattern C 123 = 186 위반 |
| 옵션 A | HEADLINE 2 + corrupt 2 = 4 파일 정정 | NO 누락 audit damage 차단, passed 유지 |
| 옵션 B | Pattern A 36 Goal goals.json 정정 | TOMIS prefix 0건, spec Section 7 entries 동기 |
| 옵션 C | Pattern B 13 그리드 Goal spec.md migrationImpact 슬롯 | 10 ADD + 3 SKIP (이미 명시) |
| 옵션 D | Pattern C 123건 score JSON 카운트 정정 | 119 정정 + 85 verify skip + 6 checks 부재 skip + 28 unchanged |
| 옵션 A 잔존 drift | G-001/G-005 implement count 정정 (2 파일) | yes 18→16, yes 22→27 (NO=0, score 무영향) |

---

## 정정 파일 합계

| 카테고리 | 파일 수 |
|----------|---------|
| rubric (specify/implement/verify) | 3 |
| goals.json (옵션 B) | 11 (13 모듈 × 1 파일 일부 공유) |
| spec.md migrationImpact 슬롯 (옵션 C) | 10 |
| score JSON 옵션 A (HEADLINE 2 + corrupt 2) | 4 |
| score JSON 옵션 A 추가 (G-001/G-005 implement count) | 2 |
| score JSON 옵션 D | 119 |
| **합계** | **149 파일** |

---

## 핵심 finding

### 1. PASS/FAIL 무변동 (0 case)
- 옵션 A HEADLINE 2건: 92.59 → 90.0, 95.45 → 90.91 (간신히 PASS 유지)
- 옵션 D 9건 미세 변동 (최대 0.59): 모두 PASS 유지
- 전체 정정 cycle 의 의사결정 영향 = **0**

### 2. NO 누락 mechanism N=3+ 도달 → rubric v1.0.10 promotion 완료
- G-003 r1 (4건 NO stale)
- MOD-GRID-06/G-005 specify (1건 NO 누락)
- MOD-GRID-15/G-004 specify (1건 NO 누락)
- → 누적 N=3 → rubric v1.0.10 sub-rule (yesCount/naCount mechanical 재계산) 도입 완료
- 본 cycle 의 옵션 A/D 정정으로 audit trail 완전화

### 3. spec ↔ goals.json 단방향 동기 누락 (Pattern A) 대규모 분포
- 13 모듈 36 Goal 영향 (전체 76 Goal 중 47%)
- spec writer 가 spec D1 (monorepo prefix) 결정 갱신 후 goals.json 측 단방향 동기 누락이 시스템적
- 옵션 B 로 일괄 정정 + 누락 entries (stories.tsx, package.json 등) 보충

### 4. Pattern C systematic offset (rubric 채점기 산식 버그)
- 119 score JSON 의 yesCount/naCount 분류 오류
- score 영향 0 (NO=0 정확 + denominator=YES count 산식)
- 메타 게이트 분리집계 (rubricMetadata.evaluableItems) 도구 부재로 발생
- 옵션 D 로 일괄 정정 + auditMetadata 추가

### 5. SKIP 카테고리 (적절성 분리)
- verify 단계 85 score JSON: categoryScores 모델로 Pattern C 비적용
- 6 score JSON: `checks` 필드 부재 (implementer self-report schema 변종)
- 비-그리드 모듈 (MOD-GRID-02 infra, 17, 99-A, 99-B): Pattern B `AG Grid` / `Wijmo` 의무 약함

### 6. 도구 산출물 (옵션 D)
Agent 가 mechanical processing 도구 4종 생성:
- `tools/option-d-audit-scan.mjs`
- `tools/option-d-apply-fixes.mjs`
- `tools/option-d-verify.mjs`
- `tools/option-d-manifest.json`

→ 향후 동일 패턴 정정 사이클 재사용 가능 (cross-harness 후보)

---

## 발견되지 않은 추가 audit damage

옵션 D sweep 결과 HEADLINE 추가 발견: **0건**. 옵션 A 정정으로 모든 NO under-reporting 완전 차단 확인.

---

## 잔존 finding (별도 cycle 권장)

### 1. MOD-GRID-04 G-002 spec ↔ goals migrationImpact drift
- spec Section 1.5: "low"
- goals.json header: "medium"
- 옵션 C 의 "기존 본문 무수정" 원칙 준수로 정정 skip
- 정정 권장: spec 또는 goals.json 어느 한쪽 통일

### 2. apps/docs (TOMIS prefix) 처리
- MOD-GRID-99-B G-001/G-004 의 apps/docs entries 는 옵션 B 범위 외로 보존
- 후속 결정 필요 (TOMIS apps/docs prefix 정상 vs monorepo apps/docs 통일)

### 3. tools/spec-goals-sync.mjs 자동 보조 도구 도입
- Pattern A 재발 차단 의무화
- 옵션 D 도구 산출물 활용 가능

---

## 다음 cycle 권장 순서 (사용자 결정 시)

1. **잔존 finding 처리** (정정 부담 작음)
   - MOD-GRID-04 G-002 drift 1건
   - apps/docs entries 정책 결정 + 정정 (필요 시)

2. **자동 보조 도구 도입** (재발 방지)
   - `tools/spec-goals-sync.mjs` 작성 + CI/pre-commit 통합
   - Coverage Verifier 에 mechanical count 자기-검증 hook

3. **cross-harness promotion**
   - rubric v1.0.10 sub-rule 을 tw-harness/tw-mail 에도 적용
   - 메모리 `[[feedback-tw-grid-spec-goals-sync]]` 의 promotion 임계 (N=3+) 검증 완료

---

**사이클 종료**: 2026-05-27. 모든 옵션 A/B/C/D 완료. 추가 cycle 은 사용자 지시 시 시작.
