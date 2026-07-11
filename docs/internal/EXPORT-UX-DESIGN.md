# Excel 다운로드 — 발견성 + 문서 상세 설계 (EXPORT-UX)

> 작성 2026-07-09. 배경: "그리드에 Excel 다운로드가 없는 것 같다"는 문의. 실측 결과 **엔진은 완비**돼
> 있으나 ①재사용 버튼 컴포넌트와 ②손으로 쓴 가이드 문서가 없어 발견되지 않는 상태. 이 두 갭을 채운다.

## 1. 현황 (사실 확인)

| 구분 | 상태 |
|---|---|
| 엔진/기능 | ✅ 완비 — `@topgrid/grid-export`: `exportToExcel`·`exportRowsToExcel`·`exportSheetsToExcel`(다중시트)·xlsx 수식 round-trip(`sheetXlsx`)·CSV·PDF·클립보드·인쇄 |
| 범위 제어 | ✅ `scope: 'all' \| 'filtered' \| 'selected'`, 숫자서식(`columnFormats`)·컬럼폭·다중행 헤더·빈데이터 처리 |
| 눈에 보이는 버튼/툴바 | ❌ 없음 — API 함수만. 데모는 매번 버튼 손 연결 |
| 손으로 쓴 매뉴얼 페이지 | ❌ 없음 — 자동 생성 API 레퍼런스(`api/grid-export.md`)만 존재. 가이드 페이지 부재 |

결론: 기능 부재가 아니라 **버튼 컴포넌트 + 사용 가이드 부재**. 이 둘만 채운다.

## 2. 설계 목표

1. Excel이 필요한 그리드에 한 줄로 붙는 다운로드 컨트롤 제공.
2. 매뉴얼에 export 가이드 페이지 신설 + 사이드바·시작하기·비교표 링크.
3. 홈 라이브 데모에 실제 다운로드 버튼 노출(발견성).
4. grid-core 미변경 → 13패키지 lockstep 아님. `grid-export` 마이너 발행만(게이트).

## 3. 컴포넌트 설계 (2계층 — headless + styled)

기존 API를 감싸는 얇은 계층만 추가(엔진 재작성 없음).

### 3-1. Headless 훅 — `useGridExport(table, opts?)`
반환: `exportToExcel(table, …)` 등에 바인딩된 콜백 묶음.
```
const ex = useGridExport(table, { fileNameBase: '주문목록' });
ex.toExcel(opts?) · ex.toCsv(opts?) · ex.toPdf(opts?) · ex.copy(opts?) · ex.print(opts?)
ex.rowCount(scope) · ex.isEmpty(scope)   // 버튼 disabled 판단
```

### 3-2. Styled 컴포넌트 — `<GridExportButton>`
props: `table`, `formats`(1개=단일버튼/2+=드롭다운), `scope`(기본 filtered), `fileName`,
`columnFormats`, `label`, `locale`(ko|en), `onExported`.

동작 규격:
- formats 1개 → 아이콘 버튼, 2+ → 드롭다운(Excel/CSV/PDF/클립보드/인쇄).
- 빈 데이터: `isEmpty(scope)` 면 disabled + 툴팁.
- 대용량 가드: scope='all' & rowCount>10,000 이면 확인 다이얼로그(엔진 EC-05 경고를 UX 승격).
- 스타일: 기존 `button--*` 룩 재사용, 다크모드 대응. 접근성: `role="menu"` + 키보드 + `aria-label`.

### 3-3. 배치 위치
`@topgrid/grid-export` 에 `/react` 서브엔트리 추가(`react` optional peerDep). 순수 함수 소비자 무영향
(트리셰이킹 유지). export는 Community(MIT)이므로 버튼도 Community.

## 4. 문서(매뉴얼) 설계 — 핵심 갭

### 4-1. 신규 가이드 `apps/docs/docs/exporting.md`
1. 한눈에(지원 표) 2. 가장 빠른 길(`<GridExportButton>`) 3. 직접 연결(`exportToExcel`)
4. 범위(scope) 5. 서식/폭/다중행 헤더/다중 시트 6. xlsx 수식 round-trip + 한계(셀 스타일 strip)
7. 대용량 주의 8. Vue에서 쓰기.

### 4-2. 노출 연결(텍스트 수정)
sidebars.ts / getting-started.mdx / pricing.tsx feats / comparison.md / intro.md 에서 가이드 링크.

### 4-3. 홈 라이브 데모
홈 데모 그리드 상단에 `<GridExportButton>` 노출 → 방문자가 버튼을 눈으로 확인.

## 5. Vue 대응 (PTLPSM 고객 직접 관련)

- `exportToExcel` 은 `@tanstack/react-table` 결합 → Vue 직접 사용 불가.
- 단기: 프레임워크 무관 `exportRowsToExcel(rows, columns, opts)` 는 Vue 즉시 사용 가능(가이드 수록).
- 정식: `@topgrid/grid-vue` 에 `useVueGridExport` + `<VueGridExportButton>`(react 훅의 Vue 평행,
  chart-core→*-vue 선례).

## 6. 패키징·버전·테스트

- 버전: `@topgrid/grid-export` 마이너(additive). grid-core 무변경 → lockstep 없음. 발행=사용자 게이트.
- peerDep: `react`(Vue분은 `vue`) optional peer.
- 테스트: ①훅 콜백 바인딩 ②컴포넌트 렌더(formats 수→단일/드롭다운) ③0행 disabled ④대용량 확인 ⑤스토리.
  기존 export 함수 회귀 불변.

## 7. 단계별 실행 계획

| 단계 | 내용 | 위험 | 발행 |
|---|---|---|---|
| P1 | 문서 가이드 + 사이드바/링크 + 홈 데모 버튼 | 없음 | 문서 배포(자율) |
| P2 | `useGridExport` + `<GridExportButton>`(React) + 테스트 | 낮음(additive) | grid-export 마이너(게이트) |
| P3 | Vue 바인딩 + pro-panel 툴바 통합 | 낮음 | grid-vue 마이너(게이트) |

## 8. 결정 (기본값 채택)

1. 버튼 노출 = **opt-in 컴포넌트**(헤드리스 철학 유지, 문서로 안내).
2. 범위 UI = **scope prop 기본 + 선택적 scope 서브메뉴**.
3. 범위 = **P1+P2+P3 전부**.
