# LESSONS INDEX

> capture(§3.5)가 추가. 각 lesson 은 `signature`(promotion dedup 키)를 가진다.
> 신규 capture 의 signature 가 이 표의 기존 행과 매칭되면 **N=2 → 즉시 AP/C 승격**(신규 lesson 작성 X).
> 형식: `LESS-NNN | signature | 한 줄 | 발생 | 상태`

| LESS | signature | 한 줄 | 첫 발생 | 상태 |
|------|-----------|-------|---------|------|
| LESS-001 | `public-identifier-contains-engine-substring` | 공개 export 이름에 차트/엔진/브랜드 lib 부분문자열 우연 혼입(예 `RangeChartSeries`⊃`echarts`) → 발행물 엔진 grep 신뢰도 훼손 | MOD-GRID-19 | lesson(N=1) |
