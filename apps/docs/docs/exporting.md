# 데이터 내보내기 (Excel · CSV · PDF)

topgrid는 그리드 데이터를 **Excel(.xlsx) · CSV · PDF** 로 내보내고, **클립보드 복사 · 인쇄**까지
지원합니다. 모두 **Community(MIT)** 패키지 `@topgrid/grid-export` 에 들어 있어 **무료**입니다.

두 가지 방법이 있습니다 — ①붙이면 바로 보이는 **버튼 컴포넌트**, ②원하는 UI에 직접 연결하는 **함수 API**.

## 한눈에

| 하고 싶은 것 | 방법 |
|---|---|
| 그리드에 다운로드 버튼 하나 붙이기 | `<GridExportButton>` (아래 "가장 빠른 길") |
| 내 버튼/메뉴에 직접 연결 | `exportToExcel(table, …)` 등 함수 |
| 행 배열만 있고 그리드 없음 | `exportRowsToExcel(rows, columns, …)` |
| 여러 시트를 한 파일로 | `exportSheetsToExcel([{name, table}, …])` |
| 시트 엔진 ↔ .xlsx (수식 보존) | `exportSheetCellsToXlsx` / `importXlsxToSheetCells` |
| Vue 3 / Nuxt | `<VueGridExportButton>` 또는 `exportRowsToExcel` ([Vue](#vue-3--nuxt)) |

## 설치

```bash
npm i @topgrid/grid-export
# Excel 은 xlsx, PDF 는 jspdf 를 peer 로 사용(각 기능 쓸 때만)
npm i xlsx            # Excel/CSV 용
npm i jspdf jspdf-autotable   # PDF 용(선택)
```

## 가장 빠른 길 — 버튼 컴포넌트

그리드(TanStack Table 인스턴스)만 넘기면 **다운로드 컨트롤이 그려집니다.** 형식이 2개 이상이면
드롭다운 메뉴가 됩니다.

```tsx
import { GridExportButton } from '@topgrid/grid-export/react';

function Toolbar({ table }) {
  return (
    <GridExportButton
      table={table}
      formats={['xlsx', 'csv', 'pdf']}   // 1개면 단일 버튼, 2개+면 드롭다운
      scope="filtered"                    // 'all' | 'filtered' | 'selected'
      fileName="주문목록"                  // 확장자는 자동
    />
  );
}
```

- **빈 데이터**면 버튼이 자동 비활성화됩니다.
- 대용량(`scope='all'` 이고 1만 행 초과) 시 확인 후 진행합니다(메인 스레드 블로킹 경고).
- 라벨 언어: `locale="ko"`(기본) / `locale="en"`.

> **툴바·StatusBar 에 배치**: `<GridExportButton>` 은 어디에나 들어가는 독립 컴포넌트라,
> Pro `@topgrid/grid-pro-panel` 의 StatusBar 나 직접 만든 툴바 오른쪽에 그대로 넣으면 됩니다
> (별도 연결 코드 불필요 — 그리드 인스턴스만 전달).

## 직접 연결 — 함수 API

버튼 없이 원하는 UI 이벤트에 직접 붙일 수 있습니다.

```tsx
import { exportToExcel, exportToCSV, exportToPdf } from '@topgrid/grid-export';

<button onClick={() => exportToExcel(table, { fileName: '데이터.xlsx' })}>
  Excel 다운로드
</button>
```

훅으로 콜백 묶음을 받을 수도 있습니다:

```tsx
import { useGridExport } from '@topgrid/grid-export/react';

const ex = useGridExport(table, { fileNameBase: '주문목록' });
// ex.toExcel() · ex.toCsv() · ex.toPdf() · ex.copy() · ex.print()
// ex.isEmpty('filtered') → 버튼 disabled 판단
```

## 범위(scope) — 무엇을 내보낼까

| scope | 내보내는 행 |
|---|---|
| `'filtered'` (기본) | 현재 정렬·필터가 반영된 행 |
| `'all'` | 필터를 무시한 전체 행 |
| `'selected'` | 선택된(체크된) 행만 |

```ts
exportToExcel(table, { scope: 'selected', fileName: '선택항목.xlsx' });
```

## 서식 · 컬럼 폭 · 다중행 헤더

Excel 셀이 **숫자·날짜로 유지**되도록 네이티브 number-format 을 지정할 수 있습니다.

```ts
exportToExcel(table, {
  columnFormats: { price: '#,##0', orderedAt: 'yyyy-mm-dd', rate: '0.0%' },
  columnWidths: { name: 30 },   // xlsx wch 단위
});
```

- 그룹 헤더(GroupColumnDef)는 자동으로 **다중행 헤더 + 셀 병합**으로 내보내집니다.
- 셀 폰트/배경색은 Community `xlsx` 가 write 시 미지원이라 제공하지 않습니다(아래 한계 참고).

## 여러 시트를 한 파일로

```ts
import { exportSheetsToExcel } from '@topgrid/grid-export';

exportSheetsToExcel(
  [
    { name: '주문', table: orderTable },
    { name: '고객', table: customerTable },
  ],
  { fileName: '월간보고.xlsx' },
);
```

## 시트 엔진 ↔ .xlsx (수식 보존)

스프레드시트(`@topgrid/grid-pro-sheet`)를 쓰면 **수식이 살아있는 채로** .xlsx 로 왕복할 수 있습니다.

```ts
import { exportSheetCellsToXlsx, importXlsxToSheetCells } from '@topgrid/grid-export';
```

- 수식(`=SUM(A1:A9)` 등)은 round-trip 으로 보존됩니다.
- **한계**: 셀 스타일(`.s`)은 Community `xlsx@0.18.5` 가 write 시 strip 합니다 — 값·수식·숫자서식은 유지.

## 행 배열만 있을 때 (그리드 없이)

TanStack Table 없이 순수 데이터 배열도 내보낼 수 있습니다.

```ts
import { exportRowsToExcel } from '@topgrid/grid-export';

exportRowsToExcel(
  rows,                                        // 객체 배열
  [
    { key: 'name', header: '이름', width: 20 },
    { key: 'price', header: '금액', format: 'currency' },
  ],
  { fileName: '목록.xlsx' },
);
```

## Vue 3 / Nuxt

Vue 에서도 동일하게 쓸 수 있습니다.

```vue
<script setup lang="ts">
import { VueGridExportButton } from '@topgrid/grid-vue/export';
</script>

<template>
  <VueGridExportButton :table="table" :formats="['xlsx', 'csv']" file-name="주문목록" />
</template>
```

- 훅: `useVueGridExport(table)` → `toExcel/toCsv/toPdf/copy/print` (`@topgrid/grid-vue/export`).
- 그리드 없이 행 배열만 있으면 프레임워크 무관 `exportRowsToExcel(rows, columns, opts)` 를 그대로 사용하세요.
- Nuxt SSR/SSG 안전 — 다운로드는 클라이언트에서만 실행됩니다.

## 대용량 주의

`scope='all'` 로 수만 행 이상을 내보내면 `xlsx` write 가 동기 실행되어 브라우저가 잠깐 멈출 수
있습니다. `<GridExportButton>` 은 1만 행 초과 시 확인을 받고, 직접 호출 시에는 Web Worker 래핑을
권장합니다.

## 클립보드 · 인쇄

```ts
import { copyToClipboard, printGrid } from '@topgrid/grid-export';

copyToClipboard(table, { scope: 'selected' });   // TSV 로 클립보드 복사
printGrid(table, { title: '월간 보고서', orientation: 'l' });
```

전체 함수 시그니처는 [API 레퍼런스 — grid-export](/api/grid-export) 를 참고하세요.
