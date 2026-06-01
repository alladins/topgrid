---
id: LESS-001
signature: public-identifier-contains-engine-substring
first_seen: MOD-GRID-19 (grid-pro-chart) 2026-06
status: lesson (N=1) — N=2 시 AP-005 로 승격
related: [AP-001, C-001, PAT-004]
---

# LESS-001 — 공개 식별자에 차트/엔진 lib 부분문자열이 우연히 혼입

## 증상 (검증 가능 사실)
`grid-pro-chart` 의 범위 차트 시리즈 타입을 처음 `RangeChartSeries` 로 명명했다.
소문자화하면 `rang`**`echarts`**`eries` — 즉 차트 엔진 `echarts` 를 부분문자열로 포함한다.
이 타입은 `index.d.ts` 로 **발행**되므로, verify 의 발행물 스캔(`dist .d.ts` 금지어/엔진명 grep,
예: `rg -i 'echarts|highcharts|...'`)이 **false-positive** 로 잡거나, 반대로 "엔진이 실제로
번들에 샜는지" 를 보려는 신호를 **정상 식별자가 가린다**.

## 왜 중요한가
이 패키지의 핵심 계약은 "차트 lib 0 import"(C-001/AP-001). 그 불변식을 **기계적으로** 지키는
수단이 발행물 엔진명 grep 인데, 공개 API 이름에 엔진 부분문자열이 있으면 그 grep 의 신뢰도가
깨진다(잡음 ↔ 누락 양방향). 브랜드 금지어 스캔(TOMIS/topvel)도 같은 함정을 공유한다.

## 올바른 형 (how to apply)
공개 export(타입·컴포넌트·함수)의 이름에 **차트/엔진/벤더 lib 부분문자열을 넣지 않는다**:
`echarts`·`highcharts`·`recharts`·`d3`·`apex`·`victory`·`nivo`·`chartjs`, 브랜드 `tomis`·`topvel`.
- 적용: `RangeChartSeries → RangeSeries` 로 개명(이번 implement 에서 수행, `echarts` 제거).
- 일반화: "Chart" 접미사 자체는 무해하나, 잘라보면 엔진명이 되는 합성(`...Echarts...`,
  `...D3...`, `...Apex...`)을 피한다. 의심되면 `소문자(식별자)` 에 엔진목록 부분문자열 대조.

## 탐지 grep (승격 시 AP-005 후보)
```
# 공개 표면(index.ts re-export 식별자)을 추출해 소문자화 후 엔진/브랜드 부분문자열 포함 검사
rg -o "(?:export (?:type )?\{)[^}]+" packages/*/src/index.ts \
  | rg -io "[A-Za-z][A-Za-z0-9]+" \
  | rg -i "echarts|highcharts|recharts|apexcharts|victory|nivo|chartjs|tomis|topvel"
```
신규 모듈에서 **2번째** 발생 시 → [[AP-001]] 옆 `AP-005` 로 승격(ANTIPATTERNS-INDEX 행 추가),
본 lesson 은 그 근거로 남긴다.

## 출처
MOD-GRID-19 implement 단계. spec `.claude/dev-harness/specs/MOD-GRID-19.md`,
구현 `packages/grid-pro-chart/src/RangeChartPanel.tsx` (`RangeSeries`).
