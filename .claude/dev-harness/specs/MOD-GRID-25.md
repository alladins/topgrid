# MOD-GRID-25 spec — `@topgrid/grid-export` 확장 (Lite, **MIT**)

> dev-harness loop 5번째. weight=**Lite**(간이 rubric, capture 유지). competitive: AG Grid/DevExpress Excel export(셀 서식·다중 시트), Wijmo.
> reuse-gate(LESS-003, specify 선행 인벤토리 — 아래 §인벤토리): grid-export 는 **기존 발행 패키지**(v0.3.0) 확장 → MOD-21 과 동형. 재사용 = **PAT-001**(순수 helper). **MIT** → PAT-003(라이선스 게이트) **미적용**(MOD-20 과 동일 비-Pro 경로). AP-001(optional-peer 정적 import) **vacuous**: `xlsx` 는 grid-export 의 **required** peer(`peerDependenciesMeta.xlsx.optional:false`) → 정적 import 정상(선제검출 아님). 본 모듈 scope 는 `jspdf`(optional) 미접촉.

## ★ 인벤토리 (reuse-gate — §6.2 3 AC 를 기존 표면과 대조)
specify 전 `packages/grid-export/src/*` 전수 조회 결과, §6.2 의 3 AC 가 **대부분 부분-존재 또는 외부 한계에 걸림**:

| §6.2 AC | 기존 표면 | 인벤토리 판정 |
|---------|----------|--------------|
| ①셀 배경/폰트/숫자서식 xlsx | `exportRowsToExcel` 가 `.s`(bold+회색 fill)·`!cols`·`formatValue`(JS 문자열 강제) 적용. `exportToExcel`(table) 은 서식 0 | **재정의 필요**(아래 ★증거) — 폰트/배경은 community xlsx 한계, 숫자서식은 `.z` 로 재구현 |
| ②다중 시트 | `book_append_sheet` 단일 호출(양 경로) | **진짜 신규**(작음) |
| ③클립보드 헤더 포함 | `copyToClipboard` 가 **헤더 행 무조건 포함**(L53–76) | 토글 부재 → `includeHeader?` 추가(trivial) |

## ★ 핵심 설계 결정 — community xlsx 서식 경계 (실측, 추측 아님 — P6)
`xlsx@0.18.5`(grid-export 의 pinned required peer, community edition) write→read 라운드트립 실측:

```
A2.z  (number-format '#,##0.00') → 생존 ("#,##0.00", cell t:'n' value 1234.5 numeric 유지)
!cols (width wch:22)             → 생존
A1.s  (font.bold + fill F3F4F6)  → 스트립 (read 시 {patternType:'none'} — 원 스타일 소멸)
```

→ **honest AC-1 = 네이티브 숫자서식(`.z`) + 컬럼 폭**. **폰트/배경(`.s`)은 community xlsx 가 write 시 버림 = 문서화된 한계**(no-op 을 동작처럼 숨기지 않음). "숫자서식"은 **네이티브 Excel `.z`**(셀이 numeric·정렬가능 유지)로 구현 — 기존 `exportRowsToExcel.formatValue` 의 `toLocaleString` 문자열 강제(numeric 상실)와 **다른 더 나은 산출물**.
→ 기존 `exportRowsToExcel` 의 `.s` no-op(주석↔실동작 drift)은 **본 모듈이 silent 수정하지 않음** — verify 에서 **§5.2 gap** 으로 기록(LESS/AP 후보, surgical-changes 준수).

## Goal
grid-export 를 3축 확장: (1) **네이티브 Excel 숫자서식**(`.z`, 셀 numeric 유지) + 컬럼 폭을 table 경로에 제공, (2) **다중 시트** 단일 워크북 export, (3) 클립보드 **헤더 포함 토글**. AG Grid/DevExpress Excel export 격차 해소.

## Scope
- **In**:
  - `ExcelExportOptions.columnFormats?: Record<columnId, string>` + `.columnWidths?: Record<columnId, number>` — table 경로(`exportToExcel`)에 `.z` 숫자서식·`!cols` 폭 적용.
  - `exportSheetsToExcel(sheets, options?)` — N 개 table 기반 시트 → 1 워크북.
  - `ClipboardOptions.includeHeader?: boolean`(기본 `true` — 현 동작 보존).
  - 내부 재사용 추출: `internal/buildHeaderRows.ts`(기존 private → 공유) + `internal/buildGridWorksheet.ts`(AOA+merges+`.z`+`!cols` → `WorkSheet`). verify 가 node 라운드트립 가능하도록 **빌더는 writeFile 과 분리**.
- **Out**: 폰트/배경 셀 스타일(community xlsx 한계 — 문서화만). `exportRowsToExcel` 의 기존 `.s` no-op 수정(§5.2 gap 기록만). PDF(jspdf optional, 미접촉). 수식·조건부서식(MOD-26 소관).

## Goals (Lite — gated, 각 골 후 `tsc --noEmit`)
- **G-1 내부 빌더 추출 + 숫자서식/폭(table 경로)**: `buildHeaderRows` 를 `internal/` 로 이동(동작 동일). 신규 `buildGridWorksheet({ headerRows, merges, dataRows, leafColumnIds, columnFormats?, columnWidths? }) => WorkSheet`: `aoa_to_sheet` + merges + 각 데이터 셀에 `columnFormats[colId]` 있으면 `.z` 세팅(numeric 셀 type 보존) + `columnWidths` → `!cols`. `exportToExcel` 가 이 빌더 사용(+ 신규 옵션 통과). **기존 헤더/merge/scope 동작 불변**. 종결형+연결형.
- **G-2 다중 시트**: `exportSheetsToExcel(sheets: ExcelSheet[], options?: MultiSheetOptions): void`. `ExcelSheet = { name: string; table: Table<any>; scope?: ExportScope; columnFormats?; columnWidths? }`. 각 시트 = getRowsByScope + buildHeaderRows + buildGridWorksheet, `book_append_sheet` N회. `fileName` 옵션. 빈 sheets 배열 → warn+return. 종결형+출력형.
- **G-3 클립보드 헤더 토글**: `copyToClipboard` 에 `includeHeader`(기본 true) — false 시 헤더 행 생략(데이터만 TSV). 기존 동작 = 기본값으로 보존. 트리거+출력형.
- **G-4 표면 정합 + README**: `index.ts` 신규 export(`exportSheetsToExcel`, 타입 `ExcelSheet`/`MultiSheetOptions`), types.ts 신규 옵션 필드, README 에 숫자서식·다중시트·클립보드 토글 + **community xlsx 폰트/배경 한계 명시**. AP-004(README↔index 시그니처) 실행. 출력형.

## AC (측정 가능 — node 라운드트립 검증)
1. **숫자서식 `.z`(table)**: `exportToExcel(table, { columnFormats: { price: '#,##0.00' } })` → 빌더 산출 ws 의 price 컬럼 데이터 셀이 `.z==='#,##0.00'` 且 `.t==='n'`(numeric 보존). write→read 라운드트립 후 `.z` 생존.
2. **컬럼 폭**: `columnWidths: { name: 30 }` → `ws['!cols']` 해당 인덱스 `wch===30`, 라운드트립 생존.
3. **다중 시트**: `exportSheetsToExcel([{name:'A',table:t1},{name:'B',table:t2}])` 빌더 워크북 → `wb.SheetNames === ['A','B']`, 각 시트 헤더+데이터 행 정확.
4. **클립보드 토글**: `includeHeader:false` → TSV 첫 줄이 데이터(헤더 아님); 미지정/`true` → 첫 줄 헤더(현 동작).
5. **기존 동작 불변(회귀 0)**: 기존 `exportToExcel`(옵션 無)·`copyToClipboard`(옵션 無) 산출이 추출 전과 동일(헤더/merge/scope/TSV).
6. **폰트/배경 한계 문서화**: README 에 community xlsx 가 `.s`(font/fill) 미지원임을 명시(round-trip 근거). `exportToExcel`/`exportSheetsToExcel` 가 폰트/배경 `.s` 를 **주장하지 않음**(silent no-op 0).
7. **MIT/표면 정합**: `license:"MIT"` 유지, src 에 `checkLicense`/`Watermark`/`@topgrid/grid-license` **0**. 신규 export ↔ index.ts 정합. `tsc` 0 + tsup build(CJS/ESM/dts).

## constraints
- **POL-TANSTACK**: 행 결정은 TanStack 표준 API(`getRowsByScope` 공유 헬퍼)만 — 외부 그리드 엔진 0.
- **C-003**: 주석/README/JSDoc ↔ 소스 동기. 폰트/배경 한계를 정확히 기술(stale "지원" 주장 금지). 하드코딩 카운트 금지.
- **C-001/AP-001**: optional peer 정적 import 금지 — 본 scope 는 `xlsx`(required) 만, `jspdf`(optional) 미접촉 → 위반 없음(vacuous 명시).
- **MIT 경계**: Pro/라이선스 코드 미혼입.
- 발행물 금지어(TOMIS/topvel/@tomis) 0.

## 의존
peer: 기존 유지(`xlsx` required, `jspdf`/`jspdf-autotable` optional, `@tanstack/react-table`/react/react-dom). **신규 dependency 0**. grid-license 없음(MIT).

## 분류 (MASTER §2)
buildGridWorksheet/숫자서식=종결형 · 다중시트 export=출력형 · 클립보드 토글=트리거+출력형 · 빌더 추출(내부 재사용)=연결형.

## 수확 예상 (capture 시 검증)
reuse = PAT-001(순수 helper) + 기존 `getRowsByScope`/`buildHeaderRows` 재사용(MOD-21 류 컴포넌트/헬퍼 재사용 N+1). **MIT/Lite 2번째 데이터포인트**(MOD-20 후). 신규 LESS 후보 = **"pinned-edition 기능 silent no-op"**(community xlsx `.s` 미지원을 동작처럼 ship → 주석 drift; AP-003/004 친족). verify 가 §5.2 gap 기록 후 LESS-004 또는 AP-005 승격 판정. ADR 후보: 숫자서식 = 네이티브 `.z` vs 문자열 강제(trade-off) — Lite 라 lesson 로 충분 시 ADR 생략 가능.
