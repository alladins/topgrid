# MOD-GRID-20 spec — `@topgrid/grid-sizing` (Lite, **MIT**)

> dev-harness loop. weight=**Lite**(부분 루프 — 가벼운 rubric, capture 유지). competitive: 전 그리드 기본(AG column auto-size·star sizing · xxxx).
> reuse-gate: 신규. 재사용 = **PAT-001**(headless 순수 helper). **첫 MIT 모듈** → PAT-003(라이선스 게이트) **미적용**(MIT 무료, checkLicense/Watermark/EULA 없음) — 하네스의 첫 비-Pro 데이터포인트.

## Goal
컬럼 너비 편의 3종을 **선언형·순수**로 제공: 내용 맞춤 **auto-size**, **star/flex 비율**(`'*'`/`'2*'`) 너비, 컨테이너 맞춤 **sizeToFit**. 결과는 grid-core 의 `columnSizing` 상태(px 맵)로 흘려보낸다(명령형 DOM 조작 X — POL-TANSTACK).

## ★ 핵심 설계 결정 (측정 주입 — verify DOM 벽 회피)
텍스트 폭 측정은 브라우저 전용(`canvas.measureText`)이라 node/SSR 에서 부재. → **측정 함수를 주입**한다:
`MeasureText = (text: string, font?: string) => number`. auto-size 의 **수학은 순수**(주입된 측정값으로 계산),
브라우저 측정기는 `createCanvasMeasureText()` 팩토리로 분리(SSR 시 fallback, throw X).
→ chart `renderChart` 주입과 **동일 메타패턴**(host-only 능력 주입 → 코어는 순수·테스트가능). capture 시 **PAT-005 후보**(N=2) 점검.
→ verify 는 **mock measureText**(예 `(t)=>t.length*8`)로 수학 검증 — live canvas 미사용([[LESS-002]] 류 벽 선제 회피).

## Scope
- **In**: `parseColumnWidth`(star/fixed 파싱) + `distributeStarWidths`(잔여폭 비율 분배) + `sizeToFit`(컨테이너 맞춤) + `autoSizeColumn(s)`(주입 측정) + `createCanvasMeasureText`(브라우저 측정기, SSR-guard).
- **Out**: 가로(컬럼) 가상화(→MOD-24), 행 높이 auto-size, 드래그 리사이즈 UI(grid-core `columnResizeMode` 소관).

## Goals (Lite — gated, 각 골 후 `tsc --noEmit`)
- **G-1 width 파싱 + star 분배(순수)**: `parseColumnWidth(spec: string|number) => {kind:'star',factor}|{kind:'fixed',px}`(`'*'`→factor 1·`'2*'`→2·`120`/`'120px'`→fixed). `distributeStarWidths({columns:{id,spec,min?}[], totalWidth}) => Record<id,px>`: fixed 우선 차감 후 잔여를 star factor 비율로 분배, `min` 하한 준수. 종결형.
- **G-2 sizeToFit(순수)**: `sizeToFit({columns:{id,width}[], containerWidth}) => Record<id,px>`: 현재 폭 합을 컨테이너폭에 비례 스케일(합 == containerWidth, ±반올림). 종결형.
- **G-3 auto-size(측정 주입)**: `autoSizeColumn({columnId, header, cellValues:string[], measureText, padding?, min?, max?}) => px` = `max(measure(header), ...measure(cell)) + padding`, `[min,max]` clamp. `autoSizeColumns(...)` 다중. `createCanvasMeasureText(): MeasureText`(브라우저 canvas, `document` 부재 시 fallback 추정 `text.length * approxCharPx`, throw X). 종결형 + 연동형(주입).
- **G-4 scaffold(MIT)**: `package.json`(**license MIT**, `publishConfig.access public`, peer `react`/`react-dom`/`@tanstack/react-table`/`@topgrid/grid-core`, **dependencies 외부 0·grid-license 없음**), tsup dual(CJS/ESM/dts), tsconfig extends base, index.ts exports, **README(MIT, EULA 없음)**. **checkLicense/Watermark 없음**(MIT). 출력형.

## AC (측정 가능)
1. `parseColumnWidth`: `'*'`→`{star,1}`, `'3*'`→`{star,3}`, `120`→`{fixed,120}`, `'120px'`→`{fixed,120}`.
2. `distributeStarWidths`: 컨테이너 600·fixed 200·star `1*`+`2*` → 잔여 400 → 133.33/266.67(±). `min` 하한 시 재분배.
3. `sizeToFit`: 결과 px 합 == containerWidth(±반올림 오차).
4. `autoSizeColumn`: **mock measureText**(`(t)=>t.length*8`)로 header/cell 최대폭+padding, `[min,max]` clamp 검증.
5. `createCanvasMeasureText`: `document` 부재(node)에서 fallback 반환(throw X) — SSR-guard 실행 확인.
6. **MIT**: `license:"MIT"`, src 에 `checkLicense`/`Watermark`/`@topgrid/grid-license` **0**, EULA.md 없음. peer 만, 외부 dependency 0. `tsc` 0 + tsup build(CJS/ESM/dts).

## constraints
- **POL-TANSTACK**: 너비는 `columnSizing` px 맵(선언형)으로 산출 — 명령형 `<th>.style.width` 직접 조작 X. 측정만 canvas read(비-변형).
- **C-003**: 하드코딩 카운트/stale 시그니처 금지(approxCharPx 등 상수는 명명).
- **MIT 경계**: Pro 전용 코드(라이선스 게이트) 미혼입 — MIT 소비자가 Pro 코드 0.
- 발행물 금지어(TOMIS/topvel/@tomis) 0.
- 외부 lib(차트/virtual/측정 lib) import 0 — 측정은 표준 canvas API 만.

## 의존
peer: `react`/`react-dom`/`@tanstack/react-table`/`@topgrid/grid-core`. **dependency: 없음**(grid-license 없음 — MIT).

## 분류 (MASTER §2)
parse/distribute/sizeToFit/autoSize=종결형(순수) · measureText 주입=연동형(주입) · canvas 측정기=연동형(host).

## 수확 예상 (capture 시 검증)
reuse = PAT-001(headless 순수). **신규 후보** = PAT-005 `host-capability-injection`(measureText 주입 = chart renderChart 주입의 N=2 → 승격 점검). **첫 MIT/Lite 데이터포인트**(부분 루프 경로·PAT-003 부재 검증). verify = mock 측정(canvas 벽 회피).
