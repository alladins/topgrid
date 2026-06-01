# PATTERNS INDEX

> reuse-gate(§3.1)·specify(§3.2)가 이 표를 먼저 읽는다(전수 열람 대신). 개별 파일은 상세용.
> 형식: `PAT-NNN | signature | 한 줄 | 적용 모듈`

| PAT | signature | 한 줄 | 적용/근거 |
|-----|-----------|-------|----------|
| PAT-001 | `headless-hook-plus-wrapper` | headless hook(상태·로직) + 선언형 `<Grid>` 합성 wrapper 분리. 데이터변경은 호출자 소유 | grid-pro-tracking(useChangeTracking+ChangeTrackingGrid), grid-pro-range(useCellRange+RangeSelectGrid) |
| PAT-002 | `registry-side-effect-injection` | import 시 side-effect 로 grid-core 레지스트리에 어댑터 주입(`sideEffects` 보존), `createColumns` 가 type→셀 디스패치 | grid-renderers wireDefaultRenderers → grid-core (MASTER §4) |
| PAT-003 | `license-gate` | Pro 패키지 index module-load `checkLicense()` + 컴포넌트 `useLicenseStatus`/`<Watermark>` 소프트 인포스먼트 | 전 Pro 패키지, grid-license (MASTER §3 mod-grid-99-a) |
| PAT-004 | `optional-peer-dynamic-import` | optional peer 는 정적 import 금지 — 동적 import 분리 또는 required 선언 | AP-001 의 올바른 형 |

(seed: MASTER §2 택소노미 7형 + §4 wiring + 2026-06 학습)
