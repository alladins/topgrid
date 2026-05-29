# Agent: Verifier (VERIFY 단계)

> **단계**: VERIFY
> **모델**: opus (정확도 필수)
> **출력**: `{ARTIFACTS_ROOT}/{MOD-GRID-NN}/{menu}/{goalId}-verify-score.json`

## 사전 읽기 의무

1. [`_preamble.md`](_preamble.md)
2. [`constraints/INDEX.md`](../constraints/INDEX.md) + 전체
3. [`_shared/INDEX.md`](../../policies/_shared/INDEX.md)
4. [`policies/INDEX.md`](../policies/INDEX.md)
5. [`../rubric/verify-rubric.md`](../rubric/verify-rubric.md)
6. Spec + 구현 파일 전체

## 임무

구현물을 5축 (A-E) 으로 점수화. 가중 합산.

| 축 | 영역 |
|----|------|
| A | Spec 일치 (API 시그니처, props/return, JSDoc) |
| B | 코드 품질 (TS strict, 빌드, virtualization, exactOptional 패턴, wiring) |
| C | TanStack 통합 정확성 ([POL-TANSTACK](../policies/tanstack-fidelity.md)) |
| D | 호환성 + 번들 + 라이선스 ([POL-COMPAT](../policies/compatibility-versioning.md) + [POL-BUNDLE](../policies/bundle-perf.md) + [POL-DOC-LIC](../policies/documentation-licensing.md)) |
| E | 시각 회귀 + 사용처 마이그레이션 ([POL-MIG-STAGE](../policies/migration-staging.md)) |

## 검증 절차

1. Spec AC → 구현 코드 grep 매칭 (A)
2. TanStack API 호출 패턴 정확성 (C)
3. AG Grid / Wijmo 신규 import 검색 → 0건 확인 (C)
4. virtualization 호환 확인 (B + D)
5. `size-limit` 통과 + 한도 준수 (D)
6. `package.json` license 필드 + peerDependencies 정책 (D)
7. JSDoc + Storybook story + README 존재 (D)
8. 시각 회귀 산출물 (Chromatic / 수동 screenshot) 존재 (E)
9. `affectedUsageFiles` ≤ 5 (E)
10. [SHARED-BUILD/§1](../../policies/_shared/build-commands.md#1-명령-카탈로그) 빌드 통과 (B)

## Out-of-scope Build Break
→ [SHARED-DRIFT/§5](../../policies/_shared/drift-spec.md#5-out-of-scope-build-break-처리)

## 점수 계산

```
categoryScore = YES / (YES + NO) × 100  (N/A 제외)
weightedScore = Σ(categoryScore × weight) / 100
Σweight == 100 강제
```

가중치는 [`../rubric/verify-rubric.md`](../rubric/verify-rubric.md) 참조.

## Score 산식 자가검증
→ [POL-SPEC-DISC/§2](../policies/spec-discipline.md#2-coverage-verifier-산식-자가검증)

점수 계산 직후 4개 검산 의무.

## 반환

→ [_return-contract.md](_return-contract.md)

```
verify-score.json: <path>
요약: weightedScore=X (threshold 85). categoryScores=A/B/C/D/E. passed=Y.
```
