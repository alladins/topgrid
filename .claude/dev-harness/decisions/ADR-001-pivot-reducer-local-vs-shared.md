---
id: ADR-001
title: 피벗 값 집계 reducer — 로컬 구현 vs grid-pro-agg 공유 추출
module: MOD-GRID-18 (grid-pro-pivot)
date: 2026-06
status: accepted
related: [PAT-001, C-001, "MASTER §5.2"]
---

# ADR-001 — 피벗 값 reducer: 로컬 구현(어휘만 재사용)

## Context (검증된 소스 사실)
피벗 값 셀은 **임의 부분집합의 `number[]`** 를 집계한다(행그룹 × 열조합 교차). 재사용 후보로
`grid-pro-agg` 를 조사했으나(`src/aggregationFns.ts`·`src/types.ts` 직접 열람):
- `resolveAggregationFn(key)` 는 **TanStack-internal 키 문자열**('avg'→'mean')을 반환한다 —
  TanStack 이 `aggregationFns[key]` 로 자체 계산하도록 위임하는 용도. 피벗은 TanStack 집계
  경로를 타지 않으므로 **재사용 불가**.
- `getAggregationFn(name)` 의 커스텀 fn 은 **Row 기반·다중컬럼**(파일 내 `weightedAvg` 예시가
  `r.getValue('weight')` 와 `r.getValue(columnId)` 를 동시 참조). 단일 필드 `number[]` 로는
  먹일 수 없음 → **일반 재사용 불가**.
- 내장 5종(sum/avg/min/max/count)의 **순수 numeric reducer 는 agg 가 노출하지 않음**(TanStack
  내장에 위임). 즉 피벗이 직접 구현해도 **agg 와 중복되는 코드가 없다**.
- 실제 재사용 가능 = `AggregationFnKey`(타입) + `BUILT_IN_AGGREGATION_KEYS`(상수) = **키 어휘**.

## Decision
v1: **피벗 내부에 순수 reducer 5종**(`sum/avg/min/max/count` over `number[]`)을 직접 구현하고,
agg 의 **키 어휘(`AggregationFnKey`·`BUILT_IN_AGGREGATION_KEYS`)만 재사용**한다.
커스텀 값 집계는 피벗 **고유 계약** `(values: number[]) => number` 로 받는다(agg 의 Row 기반
레지스트리와 별개 — 의도적 분리).

## Rejected
- **(R1) grid-pro-agg 에 공유 `applyAggregation(key, number[])` 추가** — agg 자신은 TanStack 에
  위임하므로 그 reducer 를 쓰지 않는다 → 비-surgical cargo-cult SSoT(소비자 1뿐인 추상화).
  CLAUDE.md "speculative abstraction 금지" 위반.
- **(R2) 가짜 Row 객체 합성해 `getAggregationFn` 강제 재사용** — 소스가 다중컬럼 Row 를
  요구하므로 구조적으로 불가. 억지 재사용은 reused 메트릭만 부풀림.

## Trade-off
로컬 reducer = 미래에 **같은 5 reducer 를 필요로 하는 2번째 소비자**(MOD-26 sheet 수식엔진,
또는 chart-agg)가 등장하면 중복 가능성. 단 현재는 소비자 1 → 추출은 speculative.

## N=2 트리거 (추출 조건)
순수 reducer 를 필요로 하는 **2번째 소비자**가 실제로 등장하면, 그때 5 reducer 를 공유 위치
(예: `grid-core/internal` 또는 신규 `@topgrid/grid-agg-core`)로 추출하고 양쪽이 import 한다.
그 전까지 추출 금지. (하네스 promotion N=2 규칙을 코드 추상화에 동형 적용.)

## 기록 의무
MASTER §5.2 에 finding 1건: "agg 레지스트리는 Row 기반 + 내장은 TanStack 위임 → 피벗은 키
어휘만 재사용, reducer 는 신규(중복 아님)". (재사용 실패로 오분류 금지.)
