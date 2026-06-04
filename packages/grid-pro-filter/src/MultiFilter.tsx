/**
 * @topgrid/grid-pro-filter — MultiFilter UI (MOD-GRID-30 G-3).
 *
 * AG compound-filter parity: **2 조건 행 + AND/OR join**(AG 기본 UI 와 동형 — N-row 동적 빌더는 over-build).
 * 순수 코어(makeMultiFilterFn)는 N-general 이므로 UI 만 2 조건 출하. 조건 입력은 **신규 thin**(operator enum/
 * 값 타입 재사용, TextFilter popover 컴포넌트 fork 안 함=LESS-005). FilterPopover(generic) 재사용.
 *
 * PAT-003: 무유효라이선스 시 `<Watermark required />` 표시(useLicenseStatus).
 * 스타일 inline(Tailwind class 는 Tailwind-less storybook 서 inert=P27-1).
 */

import { useState, useEffect } from 'react';
import type { Column } from '@tanstack/react-table';
import { FilterPopover } from '@topgrid/grid-features';
import type {
  TextFilterOperator,
  NumberFilterOperator,
  TextFilterValue,
  NumberFilterValue,
} from '@topgrid/grid-features';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';
import type { MultiFilterValue } from './makeMultiFilterFn.js';

const TEXT_OPS: { value: TextFilterOperator; label: string }[] = [
  { value: 'contains', label: '포함' },
  { value: 'equals', label: '같음' },
  { value: 'startsWith', label: '시작' },
  { value: 'endsWith', label: '끝' },
];
const NUMBER_OPS: NumberFilterOperator[] = ['=', '!=', '>', '<', '>=', '<='];

interface Cond {
  operator: string;
  value: string;
}

const ctrlStyle = {
  padding: '2px 6px',
  fontSize: '12px',
  border: '1px solid var(--topgrid-border, #d1d5db)',
  borderRadius: '4px',
  background: 'var(--topgrid-body-bg, #ffffff)',
  color: 'var(--topgrid-cell-text, #374151)',
};

/**
 * 컬럼당 복합(AND/OR) 필터 빌더 — 2 조건 행.
 *
 * @param variant - 'text'(contains 등) | 'number'(=,>,… ). column.filterFn 은 각각
 *   `multiTextFilterFn` / `multiNumberFilterFn` 으로 등록되어야 한다.
 */
export function MultiFilter<TData>({
  column,
  variant,
}: {
  column: Column<TData, unknown>;
  variant: 'text' | 'number';
}): JSX.Element {
  const lic = useLicenseStatus();
  const ops = variant === 'text' ? TEXT_OPS.map((o) => o.value) : NUMBER_OPS;
  const defaultOp = ops[0] as string;

  const [logic, setLogic] = useState<'and' | 'or'>('and');
  const [c1, setC1] = useState<Cond>({ operator: defaultOp, value: '' });
  const [c2, setC2] = useState<Cond>({ operator: defaultOp, value: '' });

  // 조건/논리 변경 → column.setFilterValue(MultiFilterValue). 빈 조건은 filterFn(autoRemove)이 무시.
  useEffect(() => {
    const toCondition = (c: Cond): TextFilterValue | NumberFilterValue =>
      variant === 'text'
        ? ({ operator: c.operator as TextFilterOperator, value: c.value } satisfies TextFilterValue)
        : // 빈 입력은 NaN(0 아님!) → numberFilterFn.autoRemove 가 비활성 조건으로 제거.
          // Number('')===0 이면 "= 0" 유효 조건으로 오인되어 전체 행이 배제된다(마운트 시 자멸).
          ({
            operator: c.operator as NumberFilterOperator,
            value: c.value.trim() === '' ? NaN : Number(c.value),
          } satisfies NumberFilterValue);
    const value: MultiFilterValue<TextFilterValue | NumberFilterValue> = {
      logic,
      conditions: [toCondition(c1), toCondition(c2)],
    };
    const t = setTimeout(() => column.setFilterValue(value), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logic, c1, c2, column, variant]);

  const isFiltered = column.getIsFiltered();

  const opSelect = (cond: Cond, set: (c: Cond) => void, idx: number) => (
    <select
      aria-label={`조건${idx} 연산자`}
      value={cond.operator}
      onChange={(e) => set({ ...cond, operator: e.target.value })}
      style={ctrlStyle}
    >
      {variant === 'text'
        ? TEXT_OPS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        : NUMBER_OPS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
    </select>
  );

  const valInput = (cond: Cond, set: (c: Cond) => void, idx: number) => (
    <input
      type={variant === 'number' ? 'number' : 'text'}
      aria-label={`조건${idx} 값`}
      value={cond.value}
      onChange={(e) => set({ ...cond, value: e.target.value })}
      placeholder="값"
      style={{ ...ctrlStyle, width: '80px' }}
    />
  );

  const trigger = (
    <button
      type="button"
      aria-label={`${column.id} 복합 필터`}
      aria-pressed={isFiltered}
      style={{
        ...ctrlStyle,
        cursor: 'pointer',
        color: isFiltered ? '#2563eb' : 'var(--topgrid-header-text, #6b7280)',
      }}
    >
      ⚭
    </button>
  );

  return (
    <FilterPopover trigger={trigger}>
      <div style={{ position: 'relative', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lic.watermarkRequired && <Watermark required />}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {opSelect(c1, setC1, 1)}
          {valInput(c1, setC1, 1)}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
          <label style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
            <input
              type="radio"
              name={`${column.id}-logic`}
              aria-label="AND"
              checked={logic === 'and'}
              onChange={() => setLogic('and')}
            />
            AND
          </label>
          <label style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
            <input
              type="radio"
              name={`${column.id}-logic`}
              aria-label="OR"
              checked={logic === 'or'}
              onChange={() => setLogic('or')}
            />
            OR
          </label>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {opSelect(c2, setC2, 2)}
          {valInput(c2, setC2, 2)}
        </div>
        <button
          type="button"
          onClick={() => {
            setC1({ operator: defaultOp, value: '' });
            setC2({ operator: defaultOp, value: '' });
            column.setFilterValue(undefined);
          }}
          style={{ ...ctrlStyle, cursor: 'pointer', fontSize: '11px' }}
        >
          초기화
        </button>
      </div>
    </FilterPopover>
  );
}
