# G-004 Spec: 복사/붙여넣기 — Ctrl+C TSV export + Ctrl+V TSV 파싱 → 셀 매트릭스 입력 (Excel 호환)

**Package**: `@tomis/grid-pro-range`  
**Goal ID**: G-004  
**Module**: MOD-GRID-11 (Cell Range Selection)  
**Spec Version**: v1.0.0  
**Date**: 2026-05-14  
**Author**: tw-grid Spec Writer  
**Status**: DRAFT

---

## Section 0: 결정 테이블 (D# Summary)

| D# | 결정 | 사유 | 트레이드오프 | ADR 참조 |
|----|------|------|------------|----------|
| D1 | `implementFiles` 경로: `topvel-grid-monorepo/packages/` 접두사 사용 | goals.json L287-290의 `TOMIS/packages/` 접두사 오류 (C-28). 실제 monorepo root = `topvel-grid-monorepo/` | — | ADR-MOD-GRID-11-001 |
| D2 | 라이선스 검증: `_verifyGridLicenseStub` inline function 패턴 | `@ts-ignore + declare const` 패턴은 C-4 위반 + 런타임 ReferenceError. inline stub = B-06 compliant (G-003 선례) | — | ADR-MOD-GRID-11-002 |
| D3 | MOD-GRID-10 의존 분리: `onPaste(cells: CellUpdate[]) => void` callback 제공 | MOD-GRID-10/G-001 pending. G-003 `onFillComplete` 와 동형 callback interface로 caller에게 위임. G-006 capstone에서 전체 통합. 트레이드오프 (1) 유연성: caller가 updateRow 직접 호출 가능; (2) 책임 분리: 클립보드 로직과 데이터 레이어 분리 | trade-off: callback 패턴은 onPaste 미제공 시 붙여넣기 무효화 위험; direct tracking import는 MOD-GRID-10 pending으로 불가. callback 채택. | ADR-MOD-GRID-11-003 |
| D4 | TSV 이스케이프 정책: RFC 4180 호환 (쌍따옴표 래핑) | goals.json L267 AC-003 `RFC 4180` 명시. Excel 직접 붙여넣기 호환. `grid-export/copyToClipboard.ts`의 공백 치환(L13-15 `replace(/[\t\r\n]/g, ' ')`)과 다른 전략: grid-export는 행 단위 복사로 데이터 손실을 허용하나, 이 Goal은 셀 범위 단위로 RFC 4180 완전 보존 필요. 향후 grid-shared 패키지에서 tsvUtils 통합 예정 (G-006 이후 out-of-scope). 트레이드오프 (1) RFC 4180: 탭/줄바꿈 포함 셀을 `"` 래핑으로 완전 보존 → Excel 완벽 호환. (2) 공백 치환: 구현 간단, 특수문자 포함 데이터 손실 발생. 완전 보존 채택. | trade-off 1: RFC 4180 구현 복잡도 ↑ (쌍따옴표 안 쌍따옴표 이스케이프 `""` 포함); trade-off 2: grid-export와 이스케이프 정책 분리로 두 TSV 구현 병존 — 향후 grid-shared로 수렴 필요. | — |
| D5 | navigator.clipboard API 우선 + document.execCommand fallback | Chrome/Edge/Firefox/Safari 모두 navigator.clipboard 지원 (HTTPS 환경). HTTP 개발 환경 또는 구형 브라우저 대응으로 execCommand fallback 포함. 트레이드오프 (1) navigator.clipboard: 비동기 Promise, 권한 요청 필요; (2) execCommand: 동기, deprecated지만 HTTP 환경에서 동작. | — | — |
| D6 | grid-export 와의 역할 분리: 자체 tsvUtils 내부 구현 | `grid-export/src/copyToClipboard.ts`에는 RFC 4180 tsvUtils 없음 (공백 치환만). tsvUtils는 `grid-pro-range/src/internal/tsvUtils.ts`에 신규 구현. grid-export는 행 단위 복사, grid-pro-range는 셀 범위 단위 복사. 중복 방지: 공유 없음 (전략 상이). 향후 grid-shared로 수렴. 트레이드오프 (1) 독립 구현: 전략 분리 명확, grid-export 변경 불필요; (2) grid-export 공유: bundle 절약 가능하나 이스케이프 정책 통일 필요로 grid-export 수정 부담 발생. 독립 구현 채택. | — | — |
| D7 | 키보드 이벤트 캡처: useClipboard hook이 `onKeyDown` 반환, G-002 useKeyboardNav와 컴포저블 결합 | G-002 useKeyboardNav가 그리드 container `<div tabIndex={0}>` onKeyDown 핸들러를 반환하는 패턴 재사용. useClipboard도 동일하게 onKeyDown 반환 → caller가 두 핸들러를 합성(chain). 트레이드오프 (1) 독립 onKeyDown: 각 hook 독립성 ↑, caller가 합성; (2) useKeyboardNav 통합 수정: 단일 onKeyDown 진입점이나 G-002 수정 필요. 독립 반환 + 합성 채택. | — | — |
| D8 | PasteResult 확장 타입 제공 (AC-002 보완): `CellUpdate[]` + 메타정보 | goals.json AC-002는 `CellUpdate[]` 반환 명시. 추가로 `PasteResult` = `{ cells: CellUpdate[]; truncated: boolean; rows: number; cols: number }` 타입 제공하여 caller가 초과 클램프 여부 인지 가능. `pasteFromClipboard`는 `Promise<PasteResult>` 반환. `onPaste(cells: CellUpdate[]) => void` callback은 AC-002 시그니처 유지. 트레이드오프 (1) 메타 제공: caller가 UI 피드백 표시 가능; (2) 단순 CellUpdate[]: API 단순. PasteResult 타입 추가하되 onPaste callback signature는 AC-002 그대로 보존. | — | — |

**D# 파일 수 breakdown**: NEW 3 + MODIFY 2 = **5 files 합계**.  
NEW: `internal/tsvUtils.ts`, `useClipboard.ts`, `useClipboard.stories.tsx`.  
MODIFY: `types.ts`, `index.ts`.

---

## Section 1: 목표 개요

### 1.1 Goal 기본 정보

| 항목 | 값 |
|------|-----|
| Goal ID | G-004 |
| 제목 | 복사/붙여넣기 — Ctrl+C TSV export + Ctrl+V TSV 파싱 → 셀 매트릭스 입력 (Excel 호환) |
| Package | `@tomis/grid-pro-range` |
| Tier | Pro (EULA 라이선스) |
| migrationImpact | **medium** (goals.json L251 권위 값: `"migrationImpact": "medium"`) |
| Depends On | G-001 (CellRange 모델 + 마우스 선택), MOD-GRID-99-A/G-001 (라이선스) |
| Unblocked Deps | MOD-GRID-10/G-001 — D3으로 해소 (onPaste callback 인터페이스) |
| Blocks | G-006 (RangeSelectGrid 통합 capstone) |

### 1.2 Goal 설명

G-001에서 구현된 셀 범위 선택과 G-002 키보드 내비게이션 위에 **Excel 호환 클립보드 복사/붙여넣기** 기능을 추가한다.

- **Ctrl+C**: 현재 선택 범위의 셀 값을 RFC 4180 호환 TSV 문자열로 직렬화하여 클립보드에 기록
- **Ctrl+V**: 클립보드 TSV를 파싱하여 현재 활성 셀(activeCell)을 기준으로 셀 매트릭스에 입력. `onPaste(cells: CellUpdate[])` 콜백 호출로 caller에게 데이터 레이어 업데이트 위임 (D3)
- **TSV 이스케이프**: RFC 4180 — 탭/줄바꿈 포함 셀은 `"` 래핑 + 내부 `"` → `""` 이중 이스케이프 (D4)
- **grid-export 역할 분리**: grid-export는 행 단위 TSV(공백 치환), 이 Goal은 셀 범위 단위 RFC 4180 TSV (D6)

### 1.3 참조 출처 (Section 1 — H-01 평가 대상)

- **L0**: N/A — `affectedUsageFiles: []` (goals.json L292 원문: `"affectedUsageFiles": []`)
- **L1**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` G-004 객체 (AC-001~AC-007 소스)
- **L2 (G-001/G-003 구현)**: `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` — CellCoord, CellRange, CellUpdate 기존 타입  
  `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\internal\fillRange.ts` — G-003 구현 패턴 참조
- **L3 (패턴 카탈로그)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` ADR-MOD-GRID-11-006 (normalize-on-extend + anchor 유지 패턴)
- **R-A (AG Grid 참조)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-aggrid-analysis.md` §2 — AG Grid Clipboard API 패턴 (C-7: import 금지, 패턴 shape 참조만; publish는 AG Grid Community 사용, Clipboard는 Enterprise 전용이므로 publish 미사용 확인)
- **R-W (Wijmo 참조)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-wijmo-analysis.md` §4 — Wijmo Import/Export 목록 내 `Clipboard copy/paste` 기능 확인 (C-16: import 금지, 개념 참조만)

---

## Section 2: Acceptance Criteria

| AC# | 설명 | 소스 |
|-----|------|------|
| AC-001 | `copySelection(selection, getData)` → TSV string 생성 후 `navigator.clipboard.writeText` 호출. 선택 범위 row×col 매트릭스 직렬화. `@ts-ignore`, `as any` 금지 (C-4). HTTP 환경 fallback: document.execCommand('copy'). | C-4 (goals.json) |
| AC-002 | `pasteFromClipboard(tsvString, activeCell, options)` → `Promise<PasteResult>` — TSV 파싱 → `{ cells: CellUpdate[]; truncated: boolean; rows: number; cols: number }`. `onPaste(cells: CellUpdate[])` callback 시그니처는 별도 hook prop. | L1 (goals.json) |
| AC-003 | TSV 이스케이프: 탭(`\t`)/줄바꿈(`\n`, `\r\n`) 포함 셀은 `"` 래핑 (RFC 4180). 셀 내부 `"`는 `""` 이중 이스케이프. Excel 직접 붙여넣기 호환 (F-11-06, F-11-07). | L1 (goals.json) |
| AC-004 | MOD-GRID-06 `copyToClipboard` (행 단위 TSV, 공백 치환)와 역할 분리 명확: 이 Goal은 셀 범위 선택 단위 복사. `grid-export/src/copyToClipboard.ts`와 중복 없음. 역할 분리 근거: D6 결정. | L1 (goals.json) |
| AC-005 | `@mescius/wijmo*` import 0건 (C-16). Wijmo Clipboard 기능은 `publish-wijmo-analysis.md §4`에서 개념 참조만. | C-16 (goals.json) |
| AC-006 | C-12: `tsc --noEmit` 0 error. | C-12 (goals.json) |
| AC-007 | C-25: Storybook story 1개 (Ctrl+C 복사 시나리오 + mocked TSV string을 `pasteFromClipboard`에 직접 주입하는 Ctrl+V 시나리오). | C-25 (goals.json) |

---

## Section 3: 설계 세부사항

### 3.1 신규 타입 (types.ts MODIFY)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/types.ts 추가 내용

/**
 * 붙여넣기 결과 메타정보 (AC-002 보완 — D8).
 * cells: 파싱된 CellUpdate 배열 (onPaste callback에 전달).
 * truncated: true이면 grid 경계 초과로 일부 셀 클램프됨.
 * rows: TSV 파싱 행 수.
 * cols: TSV 파싱 열 수.
 */
export interface PasteResult<TCell = unknown> {
  cells: CellUpdate<TCell>[];
  truncated: boolean;
  rows: number;
  cols: number;
}

/**
 * useClipboard hook props.
 *
 * C-29 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
 * 전달 시 spread-skip 패턴 사용 (Section 3.4 예시 참조).
 */
export interface UseClipboardProps<TData, TCell = unknown> {
  /** 현재 선택 범위 (useCellRange의 range). null이면 Ctrl+C no-op. */
  selection: CellRange | null;
  /** 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 Ctrl+V no-op. */
  activeCell: CellCoord | null;
  /** 그리드 전체 행 수 (경계 clamp). */
  rowCount: number;
  /** 그리드 전체 열 수 (경계 clamp). */
  colCount: number;
  /** 셀 값 getter — 복사 시 매트릭스 추출용. */
  getCellValue: (row: number, col: number) => TCell;
  /** 붙여넣기 결과 콜백 (D3 MOD-GRID-10 분리). 미제공 시 붙여넣기 파싱만 수행. */
  onPaste?: (cells: CellUpdate<TCell>[]) => void;
  /** 클립보드 API 에러 핸들러 (권한 거부 등). */
  onError?: (error: Error) => void;
  /** TanStack Table 인스턴스 — 사용 안 함, 향후 확장용 optional. */
  table?: import('@tanstack/react-table').Table<TData>;
}

/** useClipboard hook 반환 타입. */
export interface UseClipboardReturn {
  /**
   * Grid container에 부착할 keydown 핸들러 (D7).
   * Ctrl+C → copyToClipboard, Ctrl+V → pasteFromClipboard 호출.
   * G-002 useKeyboardNav.handleKeyDown과 합성하여 사용.
   */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Ctrl+C 프로그래매틱 복사. navigator.clipboard 비동기. */
  copyToClipboard: () => Promise<void>;
  /** Ctrl+V 프로그래매틱 붙여넣기. 명시적 tsvString 주입 가능 (Storybook/테스트용). */
  pasteFromClipboard: (tsvString?: string) => Promise<PasteResult>;
}
```

### 3.2 `tsvUtils` 순수 함수 (internal/tsvUtils.ts NEW)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/internal/tsvUtils.ts

/**
 * RFC 4180 호환 TSV 유틸리티 (AC-003).
 *
 * stringifyTsv: 2D 값 배열 → TSV 문자열 (탭/줄바꿈 포함 셀은 " 래핑)
 * parseTsv: TSV 문자열 → 2D string 배열
 *
 * grid-export/copyToClipboard.ts의 공백 치환 escapeTsvValue와 다른 전략:
 * - grid-export: 행 단위 복사, 특수문자 → 공백 (D6 역할 분리)
 * - tsvUtils: 셀 범위 단위 복사, RFC 4180 완전 보존
 */

/**
 * 단일 셀 값을 RFC 4180 TSV 포맷으로 이스케이프.
 * - 탭(\t), 줄바꿈(\n, \r), 쌍따옴표(") 포함 시 " 래핑
 * - 셀 내부 " → "" (RFC 4180 §2.7)
 */
function escapeTsvCell(value: string): string {
  const needsQuoting = value.includes('\t') || value.includes('\n') || value.includes('\r') || value.includes('"');
  if (!needsQuoting) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

/**
 * 2D 값 배열을 RFC 4180 호환 TSV 문자열로 직렬화.
 * 행 구분: \n, 셀 구분: \t.
 *
 * @param matrix row-major 2D 배열. 빈 배열이면 빈 문자열 반환.
 */
export function stringifyTsv(matrix: readonly (readonly unknown[])[]): string {
  if (matrix.length === 0) return '';
  return matrix
    .map((row) =>
      row.map((cell) => escapeTsvCell(cell === null || cell === undefined ? '' : String(cell))).join('\t'),
    )
    .join('\n');
}

/**
 * RFC 4180 호환 TSV 문자열을 2D string 배열로 파싱.
 * - " 래핑 셀: 언래핑 + "" → " 복원
 * - 빈 문자열 또는 공백만: [['']] 반환
 *
 * @param tsv TSV 문자열 (Excel 복사 형식 포함).
 * @returns row-major 2D string 배열. 행 수 = rows, 최대 열 수 = cols.
 */
export function parseTsv(tsv: string): string[][] {
  if (tsv.trim() === '') return [['']];

  // 줄바꿈 정규화: \r\n → \n
  const normalized = tsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // 말미 \n 제거 (Excel이 마지막 행 후 \n 추가하는 경우)
  const trimmed = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;

  const rows: string[][] = [];
  const lines = trimmed.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const row: string[] = [];
    let line = lines[i];
    let col = 0;

    while (line.length > 0 || col === 0) {
      if (line.startsWith('"')) {
        // RFC 4180 쌍따옴표 래핑 셀: 다음 언이스케이프된 " 까지
        let j = 1;
        let cell = '';
        while (j < line.length) {
          if (line[j] === '"') {
            if (j + 1 < line.length && line[j + 1] === '"') {
              // "" → "
              cell += '"';
              j += 2;
            } else {
              // 닫는 "
              j++;
              break;
            }
          } else {
            cell += line[j];
            j++;
          }
        }
        row.push(cell);
        line = line.slice(j);
        // 다음 탭 또는 EOL
        if (line.startsWith('\t')) {
          line = line.slice(1);
        } else {
          break;
        }
      } else {
        // 일반 셀: 다음 탭까지
        const tabIdx = line.indexOf('\t');
        if (tabIdx === -1) {
          row.push(line);
          line = '';
          break;
        } else {
          row.push(line.slice(0, tabIdx));
          line = line.slice(tabIdx + 1);
        }
      }
      col++;
    }
    rows.push(row);
  }

  return rows;
}
```

### 3.3 `useClipboard` hook (useClipboard.ts NEW)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/useClipboard.ts

/**
 * D2: _verifyGridLicenseStub — inline fallback stub 패턴 (B-06 compliant).
 * D7: onKeyDown 반환 — G-002 useKeyboardNav와 컴포저블 결합.
 * D3: onPaste callback — MOD-GRID-10 분리.
 * ADR-MOD-GRID-11-006: normalize-on-extend 패턴 참조 (clipboard matrix bounds).
 */
import { useCallback, useEffect } from 'react';
import type {
  CellCoord,
  CellRange,
  CellUpdate,
  PasteResult,
  UseClipboardProps,
  UseClipboardReturn,
} from './types';
import { stringifyTsv, parseTsv } from './internal/tsvUtils';

/**
 * D2 Option A: inline license verification stub.
 * MOD-GRID-99-A/G-002 완료 후 실제 grid-license import로 교체.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _verifyGridLicenseStub(_packageName: string): void {
  /* MOD-GRID-99-A/G-002가 signature/expiry/domain 검증을 구현 예정. */
}

export function useClipboard<TData, TCell = unknown>(
  props: UseClipboardProps<TData, TCell>,
): UseClipboardReturn {
  const { selection, activeCell, rowCount, colCount, getCellValue, onPaste, onError } = props;

  // D2: 라이선스 검증 stub
  useEffect(() => {
    _verifyGridLicenseStub('@tomis/grid-pro-range');
  }, []);

  /** 선택 범위 → 2D 매트릭스 → TSV string → 클립보드 (AC-001) */
  const copyToClipboard = useCallback(async (): Promise<void> => {
    // EC-001: selection null → no-op
    if (selection === null) return;

    const { start, end } = selection;
    const matrix: TCell[][] = [];
    for (let r = start.row; r <= end.row; r++) {
      const row: TCell[] = [];
      for (let c = start.col; c <= end.col; c++) {
        row.push(getCellValue(r, c));
      }
      matrix.push(row);
    }

    const tsv = stringifyTsv(matrix as readonly (readonly unknown[])[]);

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(tsv);
      } else {
        // D5 fallback: document.execCommand (HTTP 환경)
        const textarea = document.createElement('textarea');
        textarea.value = tsv;
        textarea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!ok) throw new Error('[grid-pro-range] copyToClipboard: Clipboard API not supported');
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (onError !== undefined) {
        onError(e);
      } else {
        console.warn('[grid-pro-range] copyToClipboard error:', e.message);
      }
    }
  }, [selection, getCellValue, onError]);

  /**
   * TSV string → CellUpdate[] 파싱 후 onPaste 콜백 (AC-002, D3).
   * tsvString 미제공 시 navigator.clipboard.readText() 호출.
   * grid 경계 초과 시 clamp + truncated=true 보고 (EC-006).
   */
  const pasteFromClipboard = useCallback(
    async (tsvString?: string): Promise<PasteResult<TCell>> => {
      // EC-004: activeCell null → no-op
      if (activeCell === null) {
        return { cells: [], truncated: false, rows: 0, cols: 0 };
      }

      let tsv: string;
      if (tsvString !== undefined) {
        tsv = tsvString;
      } else {
        try {
          if (
            typeof navigator !== 'undefined' &&
            navigator.clipboard &&
            typeof navigator.clipboard.readText === 'function'
          ) {
            tsv = await navigator.clipboard.readText();
          } else {
            const err = new Error('[grid-pro-range] pasteFromClipboard: Clipboard read API not supported');
            if (onError !== undefined) onError(err);
            else console.warn(err.message);
            return { cells: [], truncated: false, rows: 0, cols: 0 };
          }
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          // EC-002: 권한 거부 → graceful no-op
          if (onError !== undefined) onError(e);
          else console.warn('[grid-pro-range] pasteFromClipboard error:', e.message);
          return { cells: [], truncated: false, rows: 0, cols: 0 };
        }
      }

      // EC-007: 빈 TSV → no-op
      if (tsv.trim() === '') {
        return { cells: [], truncated: false, rows: 0, cols: 0 };
      }

      const matrix = parseTsv(tsv);
      const pasteRows = matrix.length;
      const pasteCols = Math.max(...matrix.map((r) => r.length), 0);

      const cells: CellUpdate<TCell>[] = [];
      let truncated = false;

      for (let ri = 0; ri < pasteRows; ri++) {
        const targetRow = activeCell.row + ri;
        if (targetRow >= rowCount) {
          truncated = true;
          break;
        }
        const row = matrix[ri];
        for (let ci = 0; ci < row.length; ci++) {
          const targetCol = activeCell.col + ci;
          if (targetCol >= colCount) {
            truncated = true;
            continue;
          }
          cells.push({ row: targetRow, col: targetCol, value: row[ci] as unknown as TCell });
        }
      }

      const result: PasteResult<TCell> = { cells, truncated, rows: pasteRows, cols: pasteCols };

      if (cells.length > 0 && onPaste !== undefined) {
        onPaste(cells);
      }

      return result;
    },
    [activeCell, rowCount, colCount, onPaste, onError],
  );

  /** D7: Ctrl+C / Ctrl+V 키 캡처 (G-002 useKeyboardNav와 컴포저블 결합) */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
      if (!isCopy && !isPaste) return;

      e.preventDefault();
      if (isCopy) {
        void copyToClipboard();
      } else {
        void pasteFromClipboard();
      }
    },
    [copyToClipboard, pasteFromClipboard],
  );

  return { onKeyDown, copyToClipboard, pasteFromClipboard };
}
```

### 3.4 C-29 Optional Prop 전달 패턴 (exactOptionalPropertyTypes)

```typescript
// useClipboard hook 사용 시 optional props 전달 — spread-skip 패턴 (C-29)
const clipboardProps: UseClipboardProps<MyData, string> = {
  selection,
  activeCell,
  rowCount,
  colCount,
  getCellValue,
  ...(onPaste !== undefined ? { onPaste } : {}),
  ...(onError !== undefined ? { onError } : {}),
};
const { onKeyDown: clipboardKeyDown } = useClipboard(clipboardProps);

// G-002 useKeyboardNav와 합성 (D7)
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    keyboardNavKeyDown(e);
    clipboardKeyDown(e);
  },
  [keyboardNavKeyDown, clipboardKeyDown],
);
```

### 3.5 grid-export 역할 분리 증거 (D6, AC-004)

| 항목 | grid-export/copyToClipboard | grid-pro-range/useClipboard |
|------|----------------------------|-----------------------------|
| 복사 단위 | 행 전체 (TanStack Table rows) | 셀 범위 선택 (CellRange) |
| 이스케이프 전략 | 탭/줄바꿈 → 공백 치환 (L13-15) | RFC 4180 쌍따옴표 래핑 |
| 헤더 포함 | 포함 (leafHeaders) | 미포함 (data only) |
| 주요 파일 | `grid-export/src/copyToClipboard.ts` | `grid-pro-range/src/useClipboard.ts` |
| 향후 통합 | grid-shared 패키지 (G-006 이후) | grid-shared 패키지 (G-006 이후) |

---

## Section 4: 호환성 정책

| 항목 | 값 |
|------|-----|
| breaking | no |
| deprecation | 신규 기능 — alias 불필요 |
| migrationPath | G-006 RangeSelectGrid 통합 capstone에서 자동 합성 |
| peerDeps 변경 | 없음 (기존 react, @tanstack/react-table 유지) |
| 신규 외부 deps | 없음 — navigator.clipboard은 브라우저 내장 API |

---

## Section 5: 의존성

### 5.1 직접 의존성

| 항목 | 용도 |
|------|------|
| `react` | useCallback, useEffect (peerDep — C-22) |
| `@tanstack/react-table` | Table 타입 (optional prop — C-22 peerDep) |
| `navigator.clipboard` | 브라우저 내장 Web API — 외부 dep 없음 |

### 5.2 내부 의존성 (기존 G-001/G-003 산출물)

| 파일 | 의존 항목 |
|------|----------|
| `./types` | CellCoord, CellRange, CellUpdate (G-001/G-003 타입) |
| `./internal/tsvUtils` | stringifyTsv, parseTsv (G-004 신규) |

### 5.3 migrationImpact 분석

**migrationImpact = medium** (goals.json L251 권위 값: `"migrationImpact": "medium"`)

- `affectedUsageFiles = []` (goals.json L292) — 현재 마이그레이션 파일 직접 영향 없음
- Visual Regression: medium-tier 의무 (C-17). affectedUsageFiles 0건이므로 "사용처 0개" 조건으로 N/A 처리 가능 (C-17 N/A 조건: "migrationImpact: low 또는 사용처 0개 Goal")
- bundleImpact: **+2 KB** ≤ 20 KB. 누적 예상: G-001(+4 KB) + G-002(+2 KB) + G-003(+3 KB) + G-004(+2 KB) = **11 KB**. G-005/G-006 여유 9 KB.

---

## Section 6: 엣지 케이스

| EC# | 상황 | 처리 | AC 매핑 |
|-----|------|------|---------|
| EC-001 | `selection === null` 상태에서 Ctrl+C | `copyToClipboard` → no-op (즉시 반환) | AC-001 |
| EC-002 | 클립보드 권한 거부 (`NotAllowedError`) | `pasteFromClipboard` catch → `onError?.(e)` 또는 `console.warn` → `{ cells: [], truncated: false, rows: 0, cols: 0 }` 반환 | AC-001, AC-002 |
| EC-003 | TSV 셀에 탭(`\t`) 포함 | `escapeTsvCell` → `"cell\twith\ttab"` 래핑 | AC-003 |
| EC-004 | `activeCell === null` 상태에서 Ctrl+V | `pasteFromClipboard` → no-op, 빈 PasteResult 반환 | AC-002 |
| EC-005 | 붙여넣기 시 grid 경계 초과 | row ≥ rowCount 또는 col ≥ colCount 시 clamp. `truncated: true` 보고 | AC-002 |
| EC-006 | 빈 TSV (`tsv.trim() === ''`) | `parseTsv` 호출 없이 no-op, 빈 PasteResult 반환 | AC-002 |
| EC-007 | 비-텍스트 클립보드 (이미지 등) | `navigator.clipboard.readText()` 가 non-text DataTransfer에서 빈 문자열 반환 → EC-006 처리 또는 onError | AC-002 |
| EC-008 | TSV 셀 내부 `"` 포함 (`"He said ""hi"""`) | `parseTsv`: `""` → `"` 복원 (RFC 4180 §2.7). 왕복 검증: `stringifyTsv([['"hi"']]) → '"""hi"""'` → `parseTsv` → `['"hi"']` | AC-003 |
| EC-009 | 가상화 활성 + 대용량 selection → 메모리 효율 | `stringifyTsv`는 string builder(Array.join) 패턴 사용. matrix 생성 시 row×col 루프로 순차 처리. | AC-001 |

**AC↔EC 환경의존 매핑** (E-04 권장):

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-001 (navigator.clipboard.writeText) | EC-002 (권한 거부) | HTTPS 외 환경 또는 사용자 거부 시 graceful 처리 근거 |
| AC-001 (HTTP fallback) | EC-002 | document.execCommand fallback 실패 시 onError 처리 |
| AC-002 (navigator.clipboard.readText) | EC-002, EC-007 | 비텍스트 또는 권한 거부 시 no-op |
| AC-003 (RFC 4180) | EC-003, EC-008 | 탭/줄바꿈/쌍따옴표 포함 셀 왕복 검증 |

---

## Section 7: 최종 구현 파일 목록

| # | 파일 경로 (topvel-grid-monorepo 기준) | 변경 유형 | 관련 AC | 설명 |
|---|---------------------------------------|----------|---------|------|
| 1 | `packages/grid-pro-range/src/internal/tsvUtils.ts` | **NEW** | AC-003, AC-004 | 순수 함수: `stringifyTsv`, `parseTsv` (RFC 4180 호환) |
| 2 | `packages/grid-pro-range/src/useClipboard.ts` | **NEW** | AC-001, AC-002, AC-003, AC-005 | hook: `{ onKeyDown, copyToClipboard, pasteFromClipboard }` |
| 3 | `packages/grid-pro-range/src/useClipboard.stories.tsx` | **NEW** | AC-007 | Storybook story (Ctrl+C 시나리오 + mocked Ctrl+V 시나리오) |
| 4 | `packages/grid-pro-range/src/types.ts` | **MODIFY** | AC-001, AC-002 | `PasteResult`, `UseClipboardProps`, `UseClipboardReturn` 타입 추가 |
| 5 | `packages/grid-pro-range/src/index.ts` | **MODIFY** | AC-001 | `useClipboard`, `PasteResult`, `UseClipboardProps`, `UseClipboardReturn`, `stringifyTsv`, `parseTsv` export 추가 |

**합계**: NEW 3 + MODIFY 2 = **5 files**

---

## Section 8: Pre-flight 체크리스트

### 8.1 H-01: L0/L1/L2/L3 경로 확인 (Section 1 referenceEvidence 대상만)

| 레이어 | 경로 | 상태 |
|--------|------|------|
| L0 (사용처) | N/A — affectedUsageFiles: [] | ✓ (해당 없음) |
| L1 (goals.json) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` | ✓ 실존 확인 |
| L2 (types.ts) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` | ✓ 실존 확인 |
| L2 (fillRange.ts) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\internal\fillRange.ts` | ✓ 실존 확인 |
| L3 (decisions) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` | ✓ 실존 확인 |
| R-A (aggrid ref) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-aggrid-analysis.md` | ✓ 실존 확인 |
| R-W (wijmo ref) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-wijmo-analysis.md` | ✓ 실존 확인 |

### 8.2 H-02: implementFiles 부모 디렉토리 확인

| 파일 | 부모 디렉토리 | 상태 |
|------|-------------|------|
| `internal/tsvUtils.ts` | `packages/grid-pro-range/src/internal/` | ✓ 실존 (`fillRange.ts`, `normalize.ts` 동일 위치) |
| `useClipboard.ts` | `packages/grid-pro-range/src/` | ✓ 실존 (`useCellRange.ts`, `useKeyboardNav.ts` 동일 위치) |
| `useClipboard.stories.tsx` | `packages/grid-pro-range/src/` | ✓ 실존 |
| `types.ts` (MODIFY) | `packages/grid-pro-range/src/` | ✓ 실존 |
| `index.ts` (MODIFY) | `packages/grid-pro-range/src/` | ✓ 실존 |

### 8.3 H-03: AC 소스 태그 검증

| AC# | 소스 태그 | goals.json 원문 일치 |
|-----|----------|-------------------|
| AC-001 | C-4 | ✓ |
| AC-002 | L1 | ✓ |
| AC-003 | L1 | ✓ |
| AC-004 | L1 | ✓ |
| AC-005 | C-16 | ✓ |
| AC-006 | C-12 | ✓ |
| AC-007 | C-25 | ✓ |

### 8.4 C-4 / B-06 TypeScript 준수 체크

| 체크 항목 | 결과 |
|----------|------|
| `@ts-ignore` 사용 | 없음 ✓ |
| `as any` 사용 | 없음 ✓ |
| `<any>` 제네릭 | 없음 ✓ (`<TCell = unknown>` 사용) |
| `declare const` for non-exported | 없음 ✓ |
| `_verifyGridLicenseStub` = inline function | ✓ (B-06 compliant, ADR-MOD-GRID-11-002 선례) |
| `void` 연산자로 floating promise 처리 | ✓ (`void copyToClipboard()` in onKeyDown) |

### 8.5 C-29 exactOptionalPropertyTypes 준수 체크

| Optional Prop | 패턴 |
|--------------|------|
| `onPaste?` | spread-skip: `...(onPaste !== undefined ? { onPaste } : {})` |
| `onError?` | spread-skip: `...(onError !== undefined ? { onError } : {})` |
| `table?` | spread-skip: `...(table !== undefined ? { table } : {})` |

### 8.6 Pre-flight

| 항목 | 상태 |
|------|------|
| 영향 사용처 | 0개 (신규 기능) |
| 무파괴 tsc + build | 기존 export 미제거, 타입 추가만 |
| 점진 | G-006 통합 전까지 독립 사용 가능 |
| 롤백 | index.ts export 제거 |
| 번들 | +2 KB → 누적 11 KB (≤ 20 KB, C-21 준수). G-005 +2 KB, G-006 +2 KB 예상 → 15 KB로 여유 5 KB |

---

## Section 9: 의존성 그래프

```
MOD-GRID-11/G-004 (Clipboard)
├── depends on: MOD-GRID-11/G-001 (CellRange 모델)
│   ├── types.ts: CellCoord, CellRange, CellUpdate ← G-001/G-003 export
│   └── internal/normalize.ts (직접 미사용 — G-004는 bounds만 활용)
├── depends on: MOD-GRID-99-A/G-001 (라이선스 — stub until 완료)
│   └── _verifyGridLicenseStub inline (D2, B-06)
├── MOD-GRID-10/G-001 (tracking) — D3으로 분리
│   └── onPaste(cells: CellUpdate[]) => void callback (caller 책임)
└── provides:
    ├── useClipboard hook (onKeyDown, copyToClipboard, pasteFromClipboard)
    ├── stringifyTsv + parseTsv (pure functions, RFC 4180)
    ├── PasteResult<TCell> (type)
    ├── UseClipboardProps<TData, TCell> (type)
    └── UseClipboardReturn (type)
```

---

## Section 10: 사용자 여정

### 10.1 개발자 여정

```typescript
// Grid 컴포넌트 내 useClipboard 통합 예시 (C-29 spread-skip)
const { range } = useCellRange();
const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
const { handleKeyDown: navKeyDown } = useKeyboardNav({ table, activeCell, ... });

const clipboardProps: UseClipboardProps<MyRow, string> = {
  selection: range,
  activeCell,
  rowCount: table.getRowModel().rows.length,
  colCount: table.getAllColumns().filter(c => c.getIsVisible()).length,
  getCellValue: (row, col) => String(rows[row]?.[columns[col].id] ?? ''),
  ...(handlePaste !== undefined ? { onPaste: handlePaste } : {}),
};
const { onKeyDown: clipKeyDown } = useClipboard(clipboardProps);

// D7: 두 핸들러 합성
const onKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    navKeyDown(e);
    clipKeyDown(e);
  },
  [navKeyDown, clipKeyDown],
);
```

### 10.2 최종 사용자 여정 — Ctrl+C

1. 사용자가 그리드에서 셀 범위 `[A1:C3]` 을 마우스 드래그로 선택 (G-001)
2. Ctrl+C 입력 → `copyToClipboard()` 호출
3. `stringifyTsv([[...rows...]])` → RFC 4180 TSV 문자열 생성
4. `navigator.clipboard.writeText(tsv)` → 클립보드 저장
5. Excel에 Ctrl+V → 3×3 표 그대로 붙여넣기 완료

### 10.3 최종 사용자 여정 — Ctrl+V

1. Excel에서 셀 범위 복사 → 클립보드 TSV 형식
2. 그리드의 활성 셀(A5) 클릭
3. Ctrl+V 입력 → `pasteFromClipboard()` 호출
4. `navigator.clipboard.readText()` → TSV 수신
5. `parseTsv(tsv)` → 2D 배열 파싱
6. A5 기준 오프셋 계산 → `CellUpdate[]` 생성
7. `onPaste(cells)` → caller가 `updateRow` 배치 호출
8. 그리드 데이터 반영

---

## Section 11: 구현 계획 (Before/After)

### Step 1: types.ts MODIFY

**Before** (현재 상태 — G-001/G-002/G-003 구현 후):
```typescript
// 기존 G-003까지 타입
export type FillDirection = 'up' | 'down' | 'left' | 'right';
export interface CellUpdate<TCell = unknown> { row: number; col: number; value: TCell; }
export interface DragFillHandleProps<TCell = unknown> { /* ... */ }
```

**After** (G-004 추가):
```typescript
// G-004 신규 타입
export interface PasteResult<TCell = unknown> {
  cells: CellUpdate<TCell>[];
  truncated: boolean;
  rows: number;
  cols: number;
}

export interface UseClipboardProps<TData, TCell = unknown> {
  selection: CellRange | null;
  activeCell: CellCoord | null;
  rowCount: number;
  colCount: number;
  getCellValue: (row: number, col: number) => TCell;
  onPaste?: (cells: CellUpdate<TCell>[]) => void;
  onError?: (error: Error) => void;
  table?: import('@tanstack/react-table').Table<TData>;
}

export interface UseClipboardReturn {
  onKeyDown: (e: React.KeyboardEvent) => void;
  copyToClipboard: () => Promise<void>;
  pasteFromClipboard: (tsvString?: string) => Promise<PasteResult>;
}
```

### Step 2: internal/tsvUtils.ts NEW

핵심 구현: `escapeTsvCell` (RFC 4180 이스케이프), `stringifyTsv` (2D→TSV), `parseTsv` (TSV→2D).

```typescript
// Before: 파일 없음
// After: stringifyTsv + parseTsv 순수 함수 (RFC 4180 호환)
// 왕복 검증: parseTsv(stringifyTsv(matrix)) deepEquals matrix (탭/줄바꿈/쌍따옴표 포함 케이스)
```

### Step 3: useClipboard.ts NEW

```typescript
// Before: 파일 없음

// After: useClipboard hook
import { useCallback, useEffect } from 'react';
import type { UseClipboardProps, UseClipboardReturn } from './types';
import { stringifyTsv, parseTsv } from './internal/tsvUtils';

function _verifyGridLicenseStub(_packageName: string): void { /* stub */ }

export function useClipboard<TData, TCell = unknown>(
  props: UseClipboardProps<TData, TCell>,
): UseClipboardReturn {
  // ... (Section 3.3 참조)
}
```

### Step 4: index.ts MODIFY

**Before**:
```typescript
// G-003까지 export
export { DragFillHandle } from './DragFillHandle';
export { fillRange, detectSeriesStep } from './internal/fillRange';
export type { CellUpdate, FillDirection, DragFillHandleProps } from './types';
```

**After** (G-004 추가):
```typescript
// G-004 신규 export
export { useClipboard } from './useClipboard';
export type { PasteResult, UseClipboardProps, UseClipboardReturn } from './types';
export { stringifyTsv, parseTsv } from './internal/tsvUtils';
```

### Step 5: useClipboard.stories.tsx NEW

Storybook story 2개 시나리오 (AC-007):
1. **CopyStory**: 범위 선택 후 `copyToClipboard()` 직접 호출 버튼 + 클립보드 내용 표시
2. **PasteStory**: input에 TSV 텍스트 입력 → `pasteFromClipboard(tsv)` 직접 주입 → CellUpdate[] 표시 (실제 clipboard.readText 없이 테스트 가능)

---

## Section 12: 검증 계획

### 12.1 단위 테스트

| 테스트 | 대상 | 검증 내용 |
|--------|------|----------|
| UT-001 | `escapeTsvCell('hello')` | `'hello'` (변화 없음) |
| UT-002 | `escapeTsvCell('a\tb')` | `'"a\tb"'` (탭 래핑) |
| UT-003 | `escapeTsvCell('a\nb')` | `'"a\nb"'` (줄바꿈 래핑) |
| UT-004 | `escapeTsvCell('"quoted"')` | `'"""quoted"""'` (쌍따옴표 이중 이스케이프) |
| UT-005 | `stringifyTsv([[1, 2], [3, 4]])` | `'1\t2\n3\t4'` |
| UT-006 | `stringifyTsv([['a\tb', 'c']])` | `'"a\tb"\tc'` |
| UT-007 | `parseTsv('1\t2\n3\t4')` | `[['1','2'],['3','4']]` |
| UT-008 | `parseTsv('"a\tb"\tc')` | `[['a\tb','c']]` (탭 복원) |
| UT-009 | `parseTsv('"""hi"""')` | `[['"hi"']]` (이중 따옴표 복원) |
| UT-010 | `parseTsv('')` | `[['']]` (빈 TSV) |
| UT-011 | `parseTsv(stringifyTsv(matrix))` | matrix deepEquals (왕복 검증) |
| UT-012 | `useClipboard` — selection null + Ctrl+C | no-op (clipboard.writeText 미호출) |
| UT-013 | `useClipboard` — activeCell null + Ctrl+V | no-op, `{ cells:[], truncated:false }` |
| UT-014 | `pasteFromClipboard('1\t2')` at activeCell={row:0,col:0} + rowCount=5 + colCount=5 | `{ cells:[{row:0,col:0,value:'1'},{row:0,col:1,value:'2'}], truncated:false }` |
| UT-015 | `pasteFromClipboard` grid 경계 초과 | `truncated: true` |

### 12.2 Self-review 체크리스트

- [ ] D# breakdown (Section 0) ↔ Section 7 파일 목록 100% 일치 (NEW 3 + MODIFY 2 = 5)
- [ ] Section 7 ↔ Section 11 Step 모든 파일 1:1 매핑 확인 (E-01)
- [ ] `@ts-ignore` 검색 결과 0건 (B-06)
- [ ] `as any` 검색 결과 0건 (C-4)
- [ ] `declare const` for non-exported 심볼 없음 (B-06)
- [ ] Wijmo import 검색 결과 0건 (C-16)
- [ ] AG Grid import 검색 결과 0건 (C-7)
- [ ] CSS 파일 신규 생성 없음 (C-5)
- [ ] `_verifyGridLicenseStub` inline function 패턴 (ADR-MOD-GRID-11-002)
- [ ] C-29 optional props spread-skip 패턴 (`onPaste`, `onError`, `table`)
- [ ] `PasteResult<TCell>` 제네릭 — any 미사용 (AC-002)
- [ ] goals.json L251 migrationImpact = "medium" (C-32)
- [ ] Section 7 재결정 내용 ↔ D# 테이블 100% 일치 (E-06)
- [ ] stringifyTsv/parseTsv 왕복 검증 — RFC 4180 쌍따옴표 이스케이프 (AC-003)
- [ ] `void` 연산자 floating promise 처리 (onKeyDown 내 비동기 호출)

### 12.3 빌드 검증

- `npx tsc --noEmit` → 0 errors (AC-006, C-12)
- `tsup build` → dist 생성 + +2 KB 이내 (AC 번들, C-21)
- `size-limit` → ≤ 20 KB (C-21)

### 12.4 시각 회귀

- affectedUsageFiles: 0개 → N/A (C-17 N/A 조건 충족)

---

## Section 13: 상업화 노트

### 13.1 Pro Tier 위치

`@tomis/grid-pro-range/useClipboard`는 **Pro tier** 기능이다.

- `_verifyGridLicenseStub` → MOD-GRID-99-A/G-002 완료 후 실제 EULA 라이선스 검증으로 교체
- 라이선스 없는 환경: `verifyGridLicense` 실패 시 클립보드 기능 비활성화 또는 watermark 표시 (MOD-GRID-99-A scope)
- G-001 inline stub 패턴 재사용 (ADR-MOD-GRID-11-002)

### 13.2 번들 영향

| 항목 | 수치 |
|------|------|
| G-004 예상 번들 증가 | **+2 KB** (gzip) |
| 누적 grid-pro-range | G-001(4) + G-002(2) + G-003(3) + G-004(2) = **11 KB** |
| C-21 한도 | ≤ 20 KB |
| G-005 + G-006 여유 | 9 KB (G-005 +2 KB, G-006 +2 KB 예상 → 최종 15 KB) |
| 상태 | ✓ 준수 |

### 13.3 Breaking Change 없음

- `types.ts` 추가만 (기존 타입 미변경)
- `index.ts` 추가 export만 (기존 export 미제거)
- G-001/G-002/G-003 소비자 코드 변경 불필요

### 13.4 문서화 계획 (C-25)

- Docusaurus 페이지: `@tomis/grid-pro-range/useClipboard` API reference
- Storybook: `useClipboard.stories.tsx` — CopyStory + PasteStory
- JSDoc: 모든 export 함수/타입에 JSDoc 의무 (C-25)
