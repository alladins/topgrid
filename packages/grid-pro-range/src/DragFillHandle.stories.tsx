/**
 * @tomis/grid-pro-range — DragFillHandle Storybook stories (G-003, AC-007).
 *
 * Default: 기본 핸들 표시 시나리오 (2×3 range).
 * DragFillSeries: 숫자 시리즈 [1,2,3] 소스 범위 — 드래그 시 [4,5,6] 자동 연장.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { DragFillHandle } from './DragFillHandle';
import type { CellRange, CellUpdate } from './types';

const meta: Meta<typeof DragFillHandle> = {
  title: 'grid-pro-range/DragFillHandle',
  component: DragFillHandle,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof DragFillHandle>;

export const Default: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [range] = useState<CellRange>({
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    });
    const data: (number | null)[][] = [[1, 2], [3, 4], [5, 6]];
    const getCellValue = (row: number, col: number): number | null =>
      data[row]?.[col] ?? null;
    const getCellRect = (row: number, col: number) => ({
      x: col * 80,
      y: row * 32,
      width: 80,
      height: 32,
    });
    const handleFillComplete = (cells: CellUpdate<number | null>[]) => {
      console.log('filled:', cells);
    };
    return (
      <div ref={containerRef} className="relative w-48 h-24 border border-gray-300">
        <DragFillHandle
          range={range}
          getCellValue={getCellValue}
          rowCount={3}
          colCount={2}
          containerRef={containerRef as React.RefObject<HTMLElement>}
          getCellRect={getCellRect}
          onFillComplete={handleFillComplete}
        />
      </div>
    );
  },
};

export const DragFillSeries: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [range] = useState<CellRange>({
      start: { row: 0, col: 0 },
      end: { row: 2, col: 0 },
    });
    // 숫자 시리즈 [1, 2, 3] → 드래그 시 [4, 5, 6] 자동 연장
    const data: (number | null)[][] = [[1], [2], [3], [null], [null], [null]];
    const getCellValue = (row: number, col: number): number | null =>
      data[row]?.[col] ?? null;
    const getCellRect = (row: number, col: number) => ({
      x: col * 80,
      y: row * 32,
      width: 80,
      height: 32,
    });
    const handleFillComplete = (cells: CellUpdate<number | null>[]) => {
      console.log('series filled:', cells);
    };
    return (
      <div ref={containerRef} className="relative w-24 h-48 border border-gray-300">
        <DragFillHandle
          range={range}
          getCellValue={getCellValue}
          rowCount={6}
          colCount={1}
          containerRef={containerRef as React.RefObject<HTMLElement>}
          getCellRect={getCellRect}
          onFillComplete={handleFillComplete}
        />
      </div>
    );
  },
};
