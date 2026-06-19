# ID LEDGER

신규 ID 발급 전 조회(재사용 금지, 번호 충돌 방지). 발급 시 한 줄 추가.

| 접두 | 다음 번호 | 범위 |
|------|----------|------|
| PAT- | 007 | 패턴 (PAT-001~004 시드 + PAT-005 host-capability-injection @ MOD-19/20 N=2 + PAT-006 declarative-rules-to-existing-contract-compiler @ MOD-24/23 G-1 N=2) |
| AP-  | 005 | 안티패턴 (AP-001~004 시드됨) |
| C-   | 004 | 제약 (C-001~003 시드됨) |
| POL- | — | 정책 (POL-TANSTACK 시드됨) |
| ADR- | 007 | 결정 (ADR-001 피벗 reducer 로컬 @ MOD-18; ADR-002 sheet 함수 로컬 @ MOD-26 G-1; ADR-003 엔터프라이즈 차트 ECharts thin adapter @ W2 단계②; ADR-004 Vue 차트 엔진=grid-chart-core 추출 @ W2 follow-up; ADR-005 license-core 추출 @ W2 follow-up; ADR-006 TanStack 타입 누출 축소=non-breaking adapter+1.0 연기 @ W3-4) |
| LESS-| 010 | 교훈 (LESS-001 engine-substring @ MOD-19; LESS-002 react-major-split @ MOD-18; LESS-003 inventory-before-specify @ MOD-21; LESS-004 pinned-edition-silent-noop @ MOD-25; LESS-005 reuse-gate-no-seam @ MOD-23 G-2; LESS-006 node-fallback-blind-to-browser-gated-feature @ MOD-27 G-2; LESS-007 ast-roundtrip-precedence-aware @ MOD-40 G-2; LESS-008 keyed-graph-key-namespacing @ MOD-41 G-1 →PAT-007; LESS-009 ref-keyed-dnd-avoid-datatransfer @ MOD-64 G-2 N=2) |

## ADR 목록
- **ADR-001** (MOD-GRID-18): 피벗 값 reducer = 로컬 구현 + agg 키 어휘만 재사용. 공유 추출은 N=2(소비자 2번째) 트리거. → `decisions/ADR-001-pivot-reducer-local-vs-shared.md`
- **ADR-002** (MOD-GRID-26 G-1): sheet 수식 함수 = 로컬(ADR-001 N=2 재독). 피벗 reducer 와 입력 계약 상이(number[]+null vs CellValue[] error-aware+시트의미론) → still local. **N=2 ≠ 자동 추출**(재평가하라지 추출하라 아님). → `decisions/ADR-002-sheet-functions-local-vs-shared-reducers.md`
- **ADR-003** (W2 단계②): 엔터프라이즈 차트 = `@topgrid/grid-pro-chart-enterprise` 신규 opt-in 패키지, **ECharts(Apache-2.0) thin 자작 어댑터**. 기존 `MatrixChartData` 브리지·`RangeChartPanel` 시임·license 게이트 재사용(integrate=시임 오염 아님). SVG 스파크라인은 additive 공존(C-001). echarts-for-react 기각(번들·SSR·무-의존 제어). → `decisions/ADR-003-enterprise-chart-echarts-adapter.md` · 스펙 `docs/internal/SPEC-grid-pro-chart-enterprise.md`
- **ADR-004** (W2 follow-up #2): Vue 엔터프라이즈 차트의 순수 엔진 `matrixToEChartsOption` = **framework-neutral `@topgrid/grid-chart-core` 로 추출**(extract-on-demand 5번째 발동=Vue 가 실제 비-React 소비자). React 패키지는 re-export shim(공개 표면 무변경), Vue 패키지 신규. 렌더 셸만 프레임워크별(W1 §10 일치). fork·React-결합-상속 기각. → `decisions/ADR-004-vue-enterprise-chart-engine-location.md`
- **ADR-005** (W2 follow-up #1): 라이선스 중립 코어 = **`@topgrid/grid-license-core` 추출**(state 싱글톤·checkLicense·setLicenseKey·verifySignature·types 이동, react 0). grid-license=re-export shim+React Watermark/hooks 잔류. Vue 차트 자동 워터마크 게이트. ★**발행 블래스트=2**(프레임워크 분리로 mass republish 불필요, React grid-license@0.3.0 무재발행). full chromium 130 green=byte-identical. → `decisions/ADR-005-license-core-extraction.md`
