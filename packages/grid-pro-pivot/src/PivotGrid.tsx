/**
 * @topgrid/grid-pro-pivot — PivotGrid React component
 * MOD-GRID-18 / G-3 (render + column groups via <Grid> delegation)
 * MOD-GRID-18 / G-4 (grand-total + per-row-group subtotal rows)
 * MOD-GRID-18 / G-5 (pivotMode toggle + Pro license gate)
 *
 * PAT-001 wrapper: a headless transform (`usePivot`/`computePivot`) feeds a
 * grid-core `<Grid>`. Spike result = FULL `<Grid>` delegation — pivot output is a
 * flat `data` array of {@link PivotRow}s (synthetic subtotal/grand rows tagged via
 * `__kind`), and column dimensions become nested `ColumnDef.columns`. No own
 * `<table>`; virtualization is delegated to `<Grid enableVirtualization>` (C-001).
 */

import { useMemo, useState, type JSX } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, type RowClassNameCallback } from '@topgrid/grid-core';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

import { computePivot } from './computePivot';
import { buildPivotColumns } from './buildPivotColumns';
import { sortPivotRows, type PivotSortState } from './sortPivotRows';
import { collapsePivotRows } from './collapsePivotRows';
import { transposePivotConfig } from './transposePivotConfig';
import type { PivotConfig, PivotRow } from './types';

/**
 * Props for {@link PivotGrid}.
 *
 * @typeParam TData - Source row shape.
 */
export interface PivotGridProps<TData extends Record<string, unknown>> {
  /** Flat source rows. */
  data: TData[];
  /** Pivot configuration (row/column dimensions + value defs). */
  config: PivotConfig;
  /**
   * When `false`, the pivot transform is skipped entirely and `data` is rendered
   * as a normal grid using `passthroughColumns` (G-5). Default `true`.
   */
  pivotMode?: boolean;
  /**
   * Columns used when `pivotMode === false` (normal grid passthrough).
   * Ignored in pivot mode.
   */
  passthroughColumns?: ColumnDef<TData, unknown>[];
  /** Enable `<Grid>` virtualization (delegated — C-001, no react-virtual here). */
  enableVirtualization?: boolean;
  /**
   * Pivot 값 컬럼 정렬 활성 (MOD-GRID-31 G-1, default `false`). `true` 시 값 헤더가 클릭→그룹 내
   * 정렬(subtotal/grandTotal 앵커, grid-core enableSort 아님). 미지정=MOD-18 동작(정적 헤더).
   */
  enableSort?: boolean;
  /**
   * 행 그룹 expand/collapse 활성 (MOD-GRID-31 G-2, default `false`). `true` 시 subtotal 행 라벨이
   * 클릭(chevron ▶/▼)→그룹 하위 data 행 숨김/복원(subtotal 은 대표로 잔존). 정렬과 합성된다
   * (collapse(sort(rows))). 미지정=MOD-18 동작(정적 subtotal 라벨).
   */
  enableCollapse?: boolean;
  /**
   * 런타임 config 컨트롤 활성 (MOD-GRID-31 G-3, default `false`). `true` 시 상단 툴바([⇄ 전치],
   * [pivot 토글])가 렌더되고 PivotGrid 가 config/pivotMode 를 **내부 state 로 소유**(props.config·pivotMode 는
   * 초기값). 미지정 시 props.config 를 직접 사용(MOD-18 controlled 동작 불변). config 소비자 제어와 배타적.
   */
  enableConfigControls?: boolean;
  /** config 변경(전치 등) 시 호출 — 소비자 영속/동기화용 (MOD-GRID-31 G-3). */
  onConfigChange?: (config: PivotConfig) => void;
  /** Outer wrapper className. */
  className?: string;
}

/** Tailwind emphasis applied to synthetic subtotal / grand-total rows. */
function pivotRowClassName(row: PivotRow): string {
  if (row.__kind === 'grandTotal') return 'font-semibold bg-gray-100';
  if (row.__kind === 'subtotal') return 'font-medium bg-gray-50';
  return '';
}

/**
 * `PivotGrid` — declarative 2-D pivot table over grid-core `<Grid>`.
 *
 * @example
 * ```tsx
 * <PivotGrid
 *   data={sales}
 *   config={{
 *     rows: ['region'],
 *     columns: ['quarter'],
 *     values: [{ field: 'sales', aggregationFn: 'sum' }],
 *   }}
 * />
 * ```
 */
export function PivotGrid<TData extends Record<string, unknown>>({
  data,
  config,
  pivotMode = true,
  passthroughColumns,
  enableVirtualization,
  enableSort,
  enableCollapse,
  enableConfigControls,
  onConfigChange,
  className,
}: PivotGridProps<TData>): JSX.Element {
  const lic = useLicenseStatus();

  // MOD-GRID-31 G-1: 정렬 state(값 leafKey + 방향). 클릭 cycle asc→desc→해제.
  const [sort, setSort] = useState<PivotSortState | null>(null);
  const onSort = (leafKey: string): void =>
    setSort((prev) => {
      if (!prev || prev.leafKey !== leafKey) return { leafKey, dir: 'asc' };
      if (prev.dir === 'asc') return { leafKey, dir: 'desc' };
      return null; // desc → 해제
    });

  // MOD-GRID-31 G-2: collapse 된 subtotal __id 집합. 토글 = 추가/제거.
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());
  const onToggleCollapse = (id: string): void =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // MOD-GRID-31 G-3: 런타임 config 컨트롤. controls 활성 시 PivotGrid 가 config/pivotMode 를 내부 소유
  // (props 는 초기값). 미활성 시 props 직접 사용(MOD-18 controlled 불변, 두 모드 배타적=동기화 footgun 회피).
  const controls = enableConfigControls === true;
  const [effConfig, setEffConfig] = useState<PivotConfig>(config);
  const [effPivotMode, setEffPivotMode] = useState<boolean>(pivotMode);
  const activeConfig = controls ? effConfig : config;
  const activePivotMode = controls ? effPivotMode : pivotMode;

  // ★ config 변경 → computePivot 재실행 → __id 재배정·leafKey 변경 → sort/collapse state 반드시 리셋
  // (아니면 stale id 가 엉뚱한 그룹을 숨김 — advisor). pivotMode 토글은 config 불변(같은 __id)이라 미리셋.
  const applyConfig = (next: PivotConfig): void => {
    setEffConfig(next);
    setSort(null);
    setCollapsedIds(new Set());
    onConfigChange?.(next);
  };
  const onTranspose = (): void => applyConfig(transposePivotConfig(effConfig));
  const onTogglePivotMode = (): void => setEffPivotMode((p) => !p);

  // G-1/G-4: headless pivot model (memoised). Skipped entirely when pivotMode=false.
  const model = useMemo(
    () => (activePivotMode ? computePivot(data, activeConfig) : null),
    [activePivotMode, data, activeConfig],
  );

  const pivotColumns = useMemo(
    () =>
      model
        ? buildPivotColumns(
            model,
            enableSort === true ? { active: sort, onSort } : undefined,
            enableCollapse === true ? { collapsedIds, onToggle: onToggleCollapse } : undefined,
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, enableSort, sort, enableCollapse, collapsedIds],
  );

  // MOD-GRID-31 G-1+G-2: 정렬(그룹 내 재정렬, subtotal 앵커) → collapse(후손 숨김) 합성. 둘 다 순수
  // 변환이고 collapse 는 id 필터라 순서 무관(생존 행 상대순서 불변). enableX 미지정 시 해당 단계 skip.
  const displayRows = useMemo(() => {
    if (!model) return [];
    const sorted =
      enableSort === true && sort ? sortPivotRows(model, sort.leafKey, sort.dir) : model.rows;
    return enableCollapse === true ? collapsePivotRows(sorted, collapsedIds) : sorted;
  }, [model, enableSort, sort, enableCollapse, collapsedIds]);

  const rootClassName = ['relative', className ?? ''].filter(Boolean).join(' ');

  // MOD-GRID-31 G-3: 런타임 config 툴바(controls 활성 시). pivot/passthrough 양쪽에 렌더(off 상태서 재토글).
  const configToolbar = controls ? (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
      <button
        type="button"
        aria-label="행/열 전치"
        onClick={onTranspose}
        style={{ cursor: 'pointer', padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff' }}
      >
        ⇄ 전치
      </button>
      <button
        type="button"
        aria-label="pivot 모드 토글"
        aria-pressed={activePivotMode}
        onClick={onTogglePivotMode}
        style={{ cursor: 'pointer', padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff' }}
      >
        pivot {activePivotMode ? 'ON' : 'OFF'}
      </button>
    </div>
  ) : null;

  // G-5: pivotMode=false → normal grid passthrough (NO pivot transform).
  if (!activePivotMode) {
    return (
      <div className={rootClassName}>
        {configToolbar}
        <Grid<TData>
          data={data}
          columns={passthroughColumns ?? []}
          {...(enableVirtualization !== undefined ? { enableVirtualization } : {})}
        />
        {lic.watermarkRequired && <Watermark required />}
      </div>
    );
  }

  const rowClassName: RowClassNameCallback<PivotRow> = (row) =>
    pivotRowClassName(row.original);

  return (
    <div className={rootClassName}>
      {configToolbar}
      <Grid<PivotRow>
        data={displayRows}
        columns={pivotColumns}
        rowClassName={rowClassName}
        {...(enableVirtualization !== undefined ? { enableVirtualization } : {})}
      />
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
