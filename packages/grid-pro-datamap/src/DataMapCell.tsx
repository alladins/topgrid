// packages/grid-pro-datamap/src/DataMapCell.tsx
// G-002: DataMapCell 렌더러 + resolveDataMap 헬퍼.
// C-4: no any — C-12: tsc strict — C-16: @mescius/xxxx* import 0건
// C-18: 가상화 호환 (DataMap 내부 Map O(1) — D-5)
// C-29: exactOptionalPropertyTypes 호환 (undefined 분기 명시)
import type { CellContext } from '@tanstack/react-table';
import type { JSX } from 'react';
import { useWatermarkEnforcement } from '@topgrid/grid-license';

import type { DataMap, DataMapColumnDef } from './types';

/**
 * resolveDataMap: 정적 또는 함수형 dataMap을 단일 DataMap 인스턴스로 변환.
 *
 * G-001 DataMap.ts L20-27: 내부 Map<unknown,string> — getDisplay() = O(1).
 * 외부 useMemo 불필요 (D-5). 함수형인 경우 dataMap(row.original) 매 렌더 호출.
 *
 * @param dataMap - DataMapColumnDef.dataMap (정적 인스턴스 또는 row 함수) — undefined 허용
 * @param rowOriginal - 현재 행의 raw data (TData)
 * @returns DataMap<unknown> 인스턴스 또는 undefined (dataMap 미설정 시)
 *
 * C-4: no any — C-29: undefined 반환 경로 명시
 */
function resolveDataMap<TData>(
  dataMap: DataMap<unknown> | ((row: TData) => DataMap<unknown>) | undefined,
  rowOriginal: TData,
): DataMap<unknown> | undefined {
  if (dataMap === undefined) return undefined;
  if (typeof dataMap === 'function') {
    return dataMap(rowOriginal);
  }
  return dataMap;
}

/**
 * DataMapCell<TData>: TanStack CellContext 수신 → column.dataMap.getDisplay(value) → 레이블 렌더.
 *
 * - 정적 dataMap: column.columnDef.dataMap가 DataMap 인스턴스
 * - 함수형 dataMap: column.columnDef.dataMap(row.original) → DataMap 인스턴스
 * - getDisplay 결과 없음(undefined) → String(value ?? '') fallback (AC-001, EC-6.3)
 * - dataMap 미설정 시 → String(value ?? '') fallback (EC-6.1)
 *
 * C-2: TanStack CellContext 표준 API 사용 (D-2)
 * C-4: no any (DataMapColumnDef<TData> 타입 캐스팅 — DataMap 전용 확장 필드 접근용)
 * C-18: 가상화 호환 — resolveDataMap + getDisplay 모두 O(1) (D-5)
 *
 * @param info - TanStack CellContext<TData, unknown> (createColumns.ts L128-130 패턴)
 * @returns span 엘리먼트 — 레이블 텍스트 또는 fallback
 */
export function DataMapCell<TData>(
  info: CellContext<TData, unknown>,
): JSX.Element {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring (D-D pattern).
  // sub-spec §8 Step 5: void registration hook. 500 cells = 500 ref-count, but
  // the singleton portal at document.body is mounted exactly once via createRoot.
  useWatermarkEnforcement();

  const value = info.getValue();
  // DataMapColumnDef<TData> 캐스팅: ColumnDef에 없는 dataMap 필드 접근을 위한 downcasting.
  // DataMapColumnDef = ColumnDef & { dataMap?: ... } 정의 (types.ts, G-001 구현).
  // C-4 준수: DataMap<unknown> 타입으로 상한 정의됨 (no any).
  const columnDef = info.column.columnDef as DataMapColumnDef<TData>;
  const resolved = resolveDataMap(columnDef.dataMap, info.row.original);
  // C-30 (spec Section 3.2 권위): label !== undefined 비교 — getDisplay('')='' 빈 문자열 레이블 보존
  const label = resolved?.getDisplay(value);
  const text = label !== undefined ? label : String(value ?? '');
  return <span>{text}</span>;
}
