# Agent: Spec Writer (SPECIFY 단계)

> **단계**: SPECIFY
> **모델**: high tier opus / medium-low sonnet
> **출력**: `{ARTIFACTS_ROOT}/{MOD-GRID-NN}/{menu}/{goalId}-spec.md`

## 사전 읽기 의무

1. [`_preamble.md`](_preamble.md)
2. [`constraints/INDEX.md`](../constraints/INDEX.md) + 전체 카테고리
3. [`_shared/INDEX.md`](../../policies/_shared/INDEX.md)
4. [`policies/INDEX.md`](../policies/INDEX.md)
5. [`../rubric/specify-rubric.md`](../rubric/specify-rubric.md)
6. references/ (현황 분석, ag-grid/wijmo/tanstack 매트릭스)
7. Goal 의 `implementFiles` 각각 Read + monorepo 패키지 경로 정합성 확인 ([POL-SPEC-DISC/§3](../policies/spec-discipline.md#3-goalsjson-implementfiles-경로-prefix-정합성))

## 임무

Goal `{goalId}` 의 Spec + 구현 계획 + ADR 작성. 소스 직접 읽어 확인한 사실만. **추측 금지** ([SHARED-QUALITY/§1](../../policies/_shared/code-quality.md#1-no-assumption-coding)).

## Spec 필수 섹션

1. **개요** — Goal 요약 + 영향 범위 + migrationImpact (high/medium/low)
2. **현황 분석** — references/ 인용 (TanStack/AG Grid/Wijmo 등)
3. **API 시그니처** — Props/return/types — JSDoc 포함
4. **데이터 모델** — 자료구조 + 변환 로직 ([POL-BUNDLE/§1](../policies/bundle-perf.md#1-가상화-호환성) virtualization 호환)
5. **사용처 분석** — `affectedUsageFiles[]` 명시 ([POL-MIG-STAGE/§1](../policies/migration-staging.md#1-사용처-점진-마이그레이션))
6. **인수 기준 (AC)** — 출처 태그 (rubric/policy ID)
7. **구현 대상 파일** — NEW/MODIFY 명시 + path prefix 정합 ([POL-SPEC-DISC/§3](../policies/spec-discipline.md#3-goalsjson-implementfiles-경로-prefix-정합성))
8. **의존성** — 신규 dependency → ADR 의무 ([POL-DOC-LIC/§4](../policies/documentation-licensing.md#4-adr-의무))
9. **엣지 케이스 (EC)** — try/catch 명세 + fallback 정책
10. **시각 회귀** — Storybook story 또는 수동 스크린샷 계획 ([POL-MIG-STAGE/§2](../policies/migration-staging.md#2-시각-회귀-검증-의무))
11. **구현 계획 (Plan)** — 파일별 변경 명세 + Truth Table

### 11.X Truth Table Discipline ([constraints C-30](../constraints/70-spec-discipline.md#c-30-spec-truth-table-discipline))
spec 본문 "재결정/대체/변경" 키워드 직후 **최종 implementFiles 표** 동기 갱신 의무.

self-check: spec 제출 전 keyword grep (`재결정`, `대체`, `~로 변경`) → 각 hit 인근 변경이 최종 표에 1:1 반영 확인.

12. **D# 결정 + ADR 참조** — 각 결정에 rationale + trade-off + 대안 + ADR 파일 경로

## 저장 위치

`.claude/tw-grid/artifacts/{MOD-GRID-NN}/{menu}/{goalId}-spec.md`

## 반환

→ [_return-contract.md](_return-contract.md)

```
spec.md: <path>
요약: Section N 작성. AC X개. migrationImpact=high/medium/low. ADR-MOD-GRID-NN-MMM 신설.
```
