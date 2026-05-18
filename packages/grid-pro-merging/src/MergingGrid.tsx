import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';
import type { JSX } from 'react';
import { useMemo, useRef } from 'react';

import { computeMergeSpans } from './computeMergeSpans';
import type { MergeRowsConfig, MergingGridProps } from './types';

/**
 * 셀 병합(rowSpan) 기능을 제공하는 Pro 그리드 컴포넌트.
 *
 * `enableMerging=false`(기본값) 시 일반 그리드와 동일하게 동작 (AC-004, C-6).
 * `enableMerging=true` 시 `meta.mergeRows`가 설정된 컬럼에서 연속 행 병합.
 * `enableVirtualization=true` 시 @tanstack/react-virtual useVirtualizer로 대규모 데이터 렌더링 (C-18).
 *
 * @typeParam TData - 행 데이터 타입 (object 필수)
 *
 * @example
 * // 기본 사용 (G-001)
 * <MergingGrid data={rows} columns={columns} enableMerging />
 *
 * @example
 * // 가상화 활성화 (G-003, 1000행+)
 * <MergingGrid data={largeRows} columns={columns} enableMerging enableVirtualization />
 *
 * @remarks
 * Known Limitation (L-01): rowSpan 시작 행이 가상화 visible window 밖으로 스크롤되면
 * 해당 병합 셀은 DOM에서 제거됩니다. skip 셀은 rowSpan=1로 truncate 렌더링됩니다.
 * virtualOverscan 값을 높이면 빈도를 줄일 수 있습니다.
 */
export function MergingGrid<TData extends object>(
  props: MergingGridProps<TData>
): JSX.Element {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring
  const _lic = useLicenseStatus();

  const {
    data,
    columns,
    enableMerging = false,
    className,
    enableVirtualization = false,
    estimatedRowHeight = 40,
    virtualOverscan = 5,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData>[],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // AC-001: 필터 변경 시 재계산 지원
  });

  const rows = table.getRowModel().rows;

  // enableMerging=true 시에만 병합 대상 컬럼 추출
  const mergeColumns = useMemo(() => {
    if (!enableMerging) return [];
    return columns
      .filter(
        (col) =>
          col.meta?.mergeRows !== undefined && col.meta.mergeRows !== false
      )
      .map((col) => ({
        id:
          col.id ??
          (col as ColumnDef<TData> & { accessorKey?: string }).accessorKey ??
          '',
        mergeRows: col.meta!.mergeRows as MergeRowsConfig<TData>,
      }));
  }, [columns, enableMerging]);

  // D3: rows 참조 변경 = sorting/filtering 완료 후 → useMemo 자동 재실행
  // C-31: computeMergeSpans import + invocation — spanMap이 rowSpan 렌더링을 구동함
  const spanMap = useMemo(() => {
    if (!enableMerging || mergeColumns.length === 0) {
      return new Map<string, number>();
    }
    return computeMergeSpans(
      rows.map((r) => r.original),
      mergeColumns
    );
  }, [rows, mergeColumns, enableMerging]);

  // 가상화 인스턴스 (훅 순서 보장 — enableVirtualization=false 시 count=0으로 항상 호출, W-1)
  const virtualizer = useVirtualizer({
    count: enableVirtualization ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: virtualOverscan,
  });

  // ---- 렌더링 분기 ----

  if (!enableVirtualization) {
    // G-001/G-002 경로 완전 보존 (EC-003)
    // ADR-001: wrapper `<div className="relative">` 도입 (사용자 §9.2=a, §9.3=b)
    return (
      <div className="relative">
        <table {...(className !== undefined && { className })}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const key = `${rowIdx}_${cell.column.id}`;
                  const span = spanMap.get(key);
                  // skip 셀: span === 0 → null 반환으로 DOM에서 제거
                  if (enableMerging && span === 0) return null;
                  // 병합 시작 셀: span > 1, 일반 셀: span === 1 또는 undefined(병합 없음)
                  const rowSpan =
                    enableMerging && span !== undefined && span > 1 ? span : 1;
                  return (
                    <td key={cell.id} rowSpan={rowSpan}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {_lic.watermarkRequired && <Watermark required />}
      </div>
    );
  }

  // 가상화 경로 (D4: flow 레이아웃 spacer, position:absolute 금지 — C-18)
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const startOffset = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const endOffset =
    totalSize -
    (virtualItems.length > 0
      ? virtualItems[virtualItems.length - 1].end
      : 0);

  // 가상화 행 인덱스 집합 (orphan 셀 판별용 — L-01)
  const virtualIndexSet = new Set(virtualItems.map((vi) => vi.index));

  return (
    <div ref={scrollRef} style={{ overflow: 'auto', position: 'relative' }}>
      <table {...(className !== undefined && { className })}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* 상단 spacer (flow 레이아웃 — position:absolute 금지, C-18) */}
          {startOffset > 0 && (
            <tr style={{ height: startOffset }}>
              <td colSpan={columns.length} />
            </tr>
          )}
          {virtualItems.map((virtualItem) => {
            const row = rows[virtualItem.index];
            const rowIdx = virtualItem.index;
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const key = `${rowIdx}_${cell.column.id}`;
                  const span = spanMap.get(key);

                  if (enableMerging && span === 0) {
                    // skip 셀 판별: 현재 rowIdx가 virtual window 내에 있으면 정상 skip
                    // 그렇지 않으면 orphan 셀 → rowSpan=1로 truncate (L-01 Limitation)
                    if (virtualIndexSet.has(rowIdx)) return null;
                    // orphan 셀 — truncate to visible (Section 10 L-01)
                  }

                  const rowSpan =
                    enableMerging && span !== undefined && span > 1 ? span : 1;
                  return (
                    <td key={cell.id} rowSpan={rowSpan}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* 하단 spacer */}
          {endOffset > 0 && (
            <tr style={{ height: endOffset }}>
              <td colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
      {_lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
