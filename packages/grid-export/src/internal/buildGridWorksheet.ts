import * as XLSX from 'xlsx';

/**
 * 헤더 행 + 데이터 행 + (선택) 네이티브 숫자서식·컬럼 폭 → xlsx `WorkSheet` 빌더.
 *
 * MOD-GRID-25 G-1: `exportToExcel`(단일 시트) 와 `exportSheetsToExcel`(다중 시트) 가 공유.
 * **writeFile 과 분리** — 순수하게 `WorkSheet` 만 반환하므로 node 라운드트립 검증 가능
 * (download 부작용 없음). aoa_to_sheet + merges 동작은 기존 `exportToExcel` 과 동일.
 *
 * 숫자서식: `columnFormats[colId]` 가 있으면 해당 컬럼 **데이터 셀**에 네이티브 Excel
 * number-format(`.z`)을 세팅한다. numeric 셀(`aoa_to_sheet` 가 `t:'n'` 추론)은 type 보존 —
 * `toLocaleString` 문자열 강제와 달리 Excel 안에서 numeric·정렬가능하게 유지된다.
 *
 * 폰트/배경(`.s`) 은 **의도적으로 적용하지 않는다** — community `xlsx@0.18.5` 가 write 시
 * 스트립하므로(round-trip 실측: `.s` → `{patternType:'none'}`) no-op 을 동작처럼 ship 하지
 * 않는다. README 에 한계 명시.
 */
export function buildGridWorksheet(params: {
  headerRows: unknown[][];
  merges: XLSX.Range[];
  dataRows: unknown[][];
  /** 데이터 컬럼 순서와 1:1 대응하는 leaf 컬럼 id 배열 (format/width 매핑 키) */
  leafColumnIds: string[];
  /** columnId → Excel number-format 코드 (예 '#,##0.00', 'yyyy-mm-dd') */
  columnFormats?: Record<string, string> | undefined;
  /** columnId → 컬럼 폭 (xlsx wch 단위) */
  columnWidths?: Record<string, number> | undefined;
}): XLSX.WorkSheet {
  const {
    headerRows,
    merges,
    dataRows,
    leafColumnIds,
    columnFormats,
    columnWidths,
  } = params;

  const aoa: unknown[][] = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  if (merges.length > 0) {
    ws['!merges'] = merges;
  }

  // 네이티브 숫자서식(.z) — 데이터 셀에만 (헤더 행 offset 만큼 아래)
  if (columnFormats) {
    const headerOffset = headerRows.length;
    for (let c = 0; c < leafColumnIds.length; c++) {
      const fmt = columnFormats[leafColumnIds[c]];
      if (!fmt) continue;
      for (let r = 0; r < dataRows.length; r++) {
        const addr = XLSX.utils.encode_cell({ r: headerOffset + r, c });
        const cell = ws[addr];
        // numeric 셀에만 적용 — Excel number-format 은 numeric 에서만 유효.
        // string 셀에 `.z` 를 달면 화면 변화 없는 silent no-op([[LESS-004]] 와 동형)이라 건너뛴다.
        // JS Date 는 aoa_to_sheet 가 numeric serial(`t:'n'`)로 변환하므로 날짜서식도 여기서 적용됨.
        if (cell && cell.t === 'n') {
          cell.z = fmt;
        }
      }
    }
  }

  // 컬럼 폭 → !cols (지정된 컬럼만; 미지정은 기본 폭 유지)
  if (columnWidths) {
    const hasAny = leafColumnIds.some(
      (id) => columnWidths[id] !== undefined,
    );
    if (hasAny) {
      ws['!cols'] = leafColumnIds.map((id) =>
        columnWidths[id] !== undefined ? { wch: columnWidths[id] } : {},
      );
    }
  }

  return ws;
}
