# PATTERNS INDEX

> reuse-gate(§3.1)·specify(§3.2)가 이 표를 먼저 읽는다(전수 열람 대신). 개별 파일은 상세용.
> 형식: `PAT-NNN | signature | 한 줄 | 적용 모듈`

| PAT | signature | 한 줄 | 적용/근거 |
|-----|-----------|-------|----------|
| PAT-001 | `headless-hook-plus-wrapper` | headless hook(상태·로직) + 선언형 `<Grid>` 합성 wrapper 분리. 데이터변경은 호출자 소유 | grid-pro-tracking(useChangeTracking+ChangeTrackingGrid), grid-pro-range(useCellRange+RangeSelectGrid) |
| PAT-002 | `registry-side-effect-injection` | import 시 side-effect 로 grid-core 레지스트리에 어댑터 주입(`sideEffects` 보존), `createColumns` 가 type→셀 디스패치 | grid-renderers wireDefaultRenderers → grid-core (MASTER §4) |
| PAT-003 | `license-gate` | Pro 패키지 index module-load `checkLicense()` + 컴포넌트 `useLicenseStatus`/`<Watermark>` 소프트 인포스먼트 | 전 Pro 패키지, grid-license (MASTER §3 mod-grid-99-a) |
| PAT-004 | `optional-peer-dynamic-import` | optional peer 는 정적 import 금지 — 동적 import 분리 또는 required 선언 | AP-001 의 올바른 형 |
| PAT-005 | `host-capability-injection` | host/환경 전용 능력(차트 렌더·텍스트 측정 등)을 **함수 prop 으로 주입** → 패키지 코어는 순수·무의존·해당 host 없이 테스트가능 | **N=2 = 주입 코어**: chart `renderChart:(series)=>ReactNode`(MOD-19) + sizing `measureText:(text)=>number`(MOD-20). **부속(SSR-guard 기본 팩토리, 예 `createCanvasMeasureText`)은 N=1**(sizing 만; chart 는 기본값 없음) — 코어만 N=2 로 단정. 효과: MOD-20 은 측정 주입으로 DOM 마운트 벽([[LESS-002]])이 없었음 |

| PAT-006 | `declarative-rules-to-existing-contract-compiler` | 신기능을 **새 메커니즘이 아니라** "선언적 룰 배열 → host 의 *기존* 계약(콜백/validator) 으로 컴파일하는 순수 helper" 로 짓는다. host 가 이미 그 계약을 wiring 하므로 커밋차단·스타일적용 등 *메커니즘은 재사용*되고 신규 표면은 thin·pure·node-verifiable. 룰 형태: `{ predicate, output, ...meta }[]` → `(hostArg) => 기존계약반환`. **N=2 = `buildRowClassName`/`buildCellClassName`(MOD-24 G-1 → grid-core `Row/CellClassNameCallback`) + `buildValidator`(MOD-23 G-1 → grid-pro-tracking `Validator`)·`buildValidationCellClass`(→ grid-core `CellClassNameCallback`)** | MOD-GRID-24 G-1, MOD-GRID-23 G-1. 관련 [[LESS-003]](인벤토리가 '기존 계약' 을 드러냄) |

| PAT-007 | `stable-reader-key-fold-new-dimension` | 순수 리더(evaluate/extractRefs 류)가 보는 **키/입력 표현을 불변**으로 두고, 새 차원·속성은 **키에 폴딩**(조회 신원을 바꾸면, 예 시트→qualified key)하거나 **키 밖 optional 메타**(조회와 무관하면, 예 절대성 플래그)로 뺀다 → keyed 그래프 알고리즘(순환/topo/recalc) 재증명 0·byte-identical. 기본/레거시 차원은 무접두(특성회귀 가드). 폴딩 전 표현(serialize/translate)은 별도 처리. **N=2 = sheet→qualified key(MOD-41 `qualifyAst`/`keyOf`) + 절대성→키 밖 플래그(MOD-40 ref 노드)** | MOD-GRID-41 G-1, MOD-GRID-40. 관련 [[LESS-008]] |

(seed: MASTER §2 택소노미 7형 + §4 wiring + 2026-06 학습; PAT-005 = MOD-19/20 N=2 승격; PAT-006 = MOD-24/23 G-1 N=2 승격; PAT-007 = MOD-41/40 N=2 승격)
