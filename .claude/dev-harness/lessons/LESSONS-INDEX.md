# LESSONS INDEX

> capture(§3.5)가 추가. 각 lesson 은 `signature`(promotion dedup 키)를 가진다.
> 신규 capture 의 signature 가 이 표의 기존 행과 매칭되면 **N=2 → 즉시 AP/C 승격**(신규 lesson 작성 X).
> 형식: `LESS-NNN | signature | 한 줄 | 발생 | 상태`

| LESS | signature | 한 줄 | 첫 발생 | 상태 |
|------|-----------|-------|---------|------|
| LESS-001 | `public-identifier-contains-engine-substring` | 공개 export 이름에 차트/엔진/브랜드 lib 부분문자열 우연 혼입(예 `RangeChartSeries`⊃`echarts`) → 발행물 엔진 grep 신뢰도 훼손 | MOD-GRID-19 | lesson(N=1) |
| LESS-002 | `cross-package-react-major-split-blocks-dom-render` | workspace 가 react 18/19 동시 설치 → 다른 패키지(grid-core/agg) 합성 모듈의 node DOM 마운트가 "Invalid hook call". **마운트 경로 = storybook 단일-react 하네스**(node 아님) | MOD-GRID-18 | lesson(N=2, MOD-21 RowGroupPanel 재확인) |
| LESS-003 | `inventory-before-specify-collapses-scope` | specify 전 기존 표면 인벤토리 → 'Full' 모듈이 대부분-재사용으로 축소(MOD-21: 3중 2 기존). 건너뛰면 에이전트가 있는 걸 재구현 | MOD-GRID-21 | lesson(N=1) |
| LESS-004 | `pinned-dep-edition-feature-silent-noop` | pinned 의존성 edition 미지원 기능 호출 → throw 없이 산출물 미반영(silent no-op). "limited" 주석에 속지 말고 write→read 라운드트립으로 경계 확정·생존하는 것만 주장 (xlsx community `.s` strip, `.z`/`!cols` 생존 실측) | MOD-GRID-25 | lesson(N=1) |
