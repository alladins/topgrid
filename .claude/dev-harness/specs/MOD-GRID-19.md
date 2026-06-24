# MOD-GRID-19 spec — `@topgrid/grid-pro-chart` (Full)

> dev-harness loop. weight=Full. competitive: xxxx sparkline · AG integrated charts · SyncFusion.
> reuse-gate: 신규(§3·PATTERNS-INDEX에 sparkline/chart 0). 재사용 = **PAT-004**(optional-peer 올바른 형)·**PAT-003**(license gate)·**PAT-001**(headless/선언형).

## Goal
셀 내 **스파크라인**과 선택 **범위 차트**를 선언적으로 제공한다. 스파크라인은 **외부 의존 0**(순수 SVG),
범위 차트는 소비자가 차트 렌더러를 **주입**(adapter)한다.

## Scope
- **In**: `SparklineCell`(line/bar/area/win-loss, 순수 SVG) + `RangeChartPanel`(주입 렌더러로 선택 데이터 차트화) + Pro 라이선스 게이트.
- **Out**: 풀 차트 편집 UI, 차트 export(브라우저 위임), 특정 차트 lib 번들.

## ★ 핵심 설계 결정 (C-001 / AP-001 적용 — 지난번 2회 실패 차단)
차트 lib 을 **정적 import 하지 않는다**. 두 경로 모두 무-import:
- 스파크라인: 순수 SVG path/rect 로 자체 렌더 → 외부 lib 불필요(종결형, zero-dep).
- 범위 차트: `RangeChartPanel` 이 `renderChart: (series) => ReactNode` **prop 으로 렌더러 주입**(IconCell 의 `icon: ReactNode` 주입 패턴 = PAT-001/004). 패키지는 어떤 차트 lib 도 import/peer 선언하지 않음.
→ **결과: optional-peer-static-import(AP-001)가 발생할 표면 자체가 없음.** package.json 에 차트 lib peer 0.
→ grid-pro-range 연계도 데이터를 **prop 으로** 받음(정적 import X) — AP-001 무관.

## Goals (구현 단위)
- **G-1 SparklineCell**: `values: number[]` → SVG 미니차트. `type`(line/bar/area/win-loss), `color`/`width`/`height`/`className`. 빈 배열·NaN 안전(dash/skip). 종결형.
- **G-2 RangeChartPanel**: `{ series, renderChart, title?, className? }`. 주입 렌더러로 렌더. 렌더러 미주입 시 graceful(안내 placeholder). 연동형(주입).
- **G-3 license gate**(PAT-003): index module-load `checkLicense()`, 컴포넌트 `useLicenseStatus`/`<Watermark>`(미인증 워터마크). 권한가드.
- **G-4 package scaffold**: `package.json`(Pro/EULA, peer react/react-dom/@tanstack/react-table, **차트 lib peer 0**), tsup dual(CJS/ESM/dts), tsconfig extends base, index.ts exports, README/EULA.

## AC (측정 가능)
1. `SparklineCell values={[..]} type="line|bar|area|win-loss"` → 각 타입 SVG 렌더. 빈/NaN 안전.
2. **AP-001 = 0**: `src/**` 에 어떤 차트 lib 도 정적 import 0, `package.json` peer 에 차트 lib 0 (verify grep).
3. `RangeChartPanel renderChart={fn}` → fn(series) 결과 렌더. renderChart 없으면 placeholder(throw X).
4. 미인증 시 `<Watermark>` 합성, 인증 시 정상.
5. `tsc --noEmit` 0 + tsup build(CJS/ESM/dts) 성공. index.ts 표면 ↔ 문서 정합.

## constraints
- **C-001**(필수): optional-peer 정적 import 금지 → 차트 lib 어댑터 주입으로 회피(표면 0).
- **POL-TANSTACK**: 외부 그리드/차트 엔진 직접 도입 0, 선언형(prop 주입).
- 발행물 금지어(TOMIS/topvel/@tomis) 0, @topgrid 만.

## 의존
peer: `react`/`react-dom`/`@tanstack/react-table`. dependency: `@topgrid/grid-license`(런타임 게이트).
**차트 lib·grid-pro-range: peer/dependency 선언 안 함**(주입/prop). → AP-001 구조적 회피.

## 분류 (MASTER §2)
SparklineCell=종결형 · RangeChartPanel=연동형(주입)+종결형 · 라이선스=권한가드.
