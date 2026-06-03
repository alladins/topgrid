---
id: ADR-002
title: sheet 수식 함수(SUM/AVERAGE/…) — 로컬 구현 vs grid-pro-pivot reducer 공유
module: MOD-GRID-26 (grid-pro-sheet) G-1
date: 2026-06
status: accepted
related: [ADR-001, PAT-005, "MASTER §5.2", LESS-003]
---

# ADR-002 — sheet 수식 함수: 로컬 구현 (ADR-001 N=2 재독)

## Context (ADR-001 의 trigger 발동)
[[ADR-001]] 의 trade-off 가 **MOD-26 sheet 수식엔진(SUM/AVG)을 5개 순수 reducer
(sum/avg/min/max/count over `number[]`)의 잠재적 2번째 소비자**로 명시했다. MOD-26 G-1 이 SUM/AVERAGE 를
구현하므로 **N=2 trigger 발동** → 피벗의 `BUILT_IN_REDUCERS`(`packages/grid-pro-pivot/src/reducers.ts`)를
공유 추출할지 재독한다.

## Decision
**여전히 로컬 구현**(`packages/grid-pro-sheet/src/internal/functions.ts`). 추출하지 않는다.

## 판별 사실 (재사용 불가 — 추측 아님, 소스 대조)
피벗 reducer 와 sheet 함수는 **입력 계약이 다르다**:
- **피벗 reducer**: `(values: number[]) => number | null` — clean `number[]`, **null-on-empty**(피벗 셀의
  표시 선택). 에러 개념 없음.
- **sheet 함수**: `(values: CellValue[]) => CellValue` — `CellValue = number|string|boolean|CellError`,
  **error-aware**(인자 중 에러 전파), **시트 의미론**(SUM([])=`0`, AVERAGE([])=`#DIV/0!`, 비-수치 무시).
- 어휘(`AggregationFnKey`)도 안 맞음 — sheet 함수는 **parser 토큰**(SUM/AVERAGE), `AggregationFnKey` 가 아니다.

→ 같은 함수가 아니다. number[] 계약에 강제로 끼우려면 (a) 에러를 number[] 진입 전 벗겨내고 (b) null↔0/#DIV/0!
의미를 호출측에서 재매핑해야 한다 = ADR-001 이 거부한 **"억지 재사용"**(reused 메트릭만 부풀림).

## Rejected
- **(R1) grid-pro-pivot 의 reducer 를 sheet 가 import** — 입력 계약 불일치(number[] vs CellValue[]) + 의미론
  불일치(null vs 0/#DIV/0!). 래핑 어댑터 = host(pivot) 표면 위 sheet 전용 변환 → 비-surgical.
- **(R2) 공유 `@topgrid/grid-numeric` 유틸 패키지로 5 reducer 추출** — 두 소비자의 계약이 달라 공통 분모가
  `reduce((a,b)=>a+b,0)` 수준(자명). speculative 추상화(CLAUDE.md 위반). 산술 코어는 사소하고 중복이 아니다
  (피벗=number[], sheet=에러필터 후 number[] — 후자가 전자를 포함하지도 않음).

## Trade-off
sum/avg 산술 한 줄이 두 패키지에 존재(피벗 null-on-empty / sheet error-aware). 단 **계약이 달라** 진짜
중복이 아니며, 통합 시 두 의미론을 모두 떠안는 분기 함수가 되어 오히려 복잡해진다.

## 컴파운딩 데이터포인트 (하네스 학습)
**N=2 ≠ 자동 추출**. ADR-001 의 "N=2 트리거"는 *추출하라*가 아니라 *재평가하라*였고, 재평가 결과 = still local
(입력 계약이 error-aware 라 number[] 와 다름). reuse-gate 가 "어휘는 같아 보여도 계약이 다르면 신규" 를
2번째로 실증([[LESS-003]] 계열). PAT-005(getCell 주입)는 N+1 데이터포인트로 별도 누적.
