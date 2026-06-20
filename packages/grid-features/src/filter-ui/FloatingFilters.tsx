/**
 * @topgrid/grid-features — floating 필터 입력 (MOD-GRID-30 G-1).
 *
 * AG "floating filter"(헤더 아래 always-visible 인라인 입력)의 topgrid 대응. grid-core 의
 * `renderFloatingFilter={(column) => …}` 슬롯에 컬럼 타입별로 반환한다.
 *
 * ★ reuse-gate(LESS-005): popover 컴포넌트(`TextFilter` 등)는 연산자+값+디바운스 로직이 `FilterPopover`
 * 렌더와 얽혀 추출 시 출하 컴포넌트 수정 → 대신 **안정 계약(값 타입 + filterFns)을 재사용한 신규 thin
 * always-visible primitive**. 같은 `column.setFilterValue` 로 같은 값 shape 를 쓰므로 popover 와 **동일
 * state 의 다른 표현**(평행 필터 아님 — 한쪽 set 이 다른쪽에 반영).
 *
 * 스타일은 inline(테스트 대상) — Tailwind class 는 Tailwind-less storybook(유일 browser 게이트)에서
 * inert(MOD-29 P27-1).
 */

import { useState, useEffect } from 'react';
import type { GridFilterColumn } from '@topgrid/grid-core';
import type { TextFilterValue, NumberFilterValue } from './types';

const DEBOUNCE_MS = 300;

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '2px 6px',
  fontSize: '12px',
  fontWeight: 400,
  border: '1px solid var(--topgrid-border, #d1d5db)',
  borderRadius: '4px',
  color: 'var(--topgrid-cell-text, #374151)',
  background: 'var(--topgrid-body-bg, #ffffff)',
};

/**
 * 텍스트 floating 필터 — always-visible 입력 1개. 연산자 `contains` 고정(기존 값의 연산자는 보존),
 * 300ms 디바운스 후 `TextFilterValue` set(빈 값=해제). `filterFn: textFilterFn` 컬럼에 사용.
 */
export function TextFloatingFilter({
  column,
  placeholder,
  label,
}: {
  column: GridFilterColumn;
  placeholder?: string;
  /** SR 라벨용 컬럼명. 미지정 시 `column.id` 로 fallback(컬럼별 고유 보장 — 동일 라벨 모호성 방지). */
  label?: string;
}): JSX.Element {
  const current = column.value as TextFilterValue | undefined;
  const [value, setValue] = useState<string>(current?.value ?? '');
  // 외부(popover/reset)에서 값이 바뀌면 입력에 반영 — 동일 state 의 다른 표현(shared-state).
  useEffect(() => {
    setValue(current?.value ?? '');
  }, [current?.value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (value.trim() === '') column.setValue(undefined);
      else
        column.setValue({
          operator: current?.operator ?? 'contains',
          value,
        } satisfies TextFilterValue);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // current?.operator 는 set 직후 동기화되므로 의존성 제외(루프 방지) — value 변경만 트리거.
    // ★column 은 GridFilterColumn(렌더마다 새 객체) → 식별자 churn 방지 위해 안정 `column.id` 로 의존(ADR-006 D3).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, column.id]);

  return (
    <input
      type="text"
      aria-label={`${label ?? column.id} 필터`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder ?? '필터…'}
      style={inputStyle}
    />
  );
}

/**
 * 숫자 floating 필터 — always-visible 입력 1개. 연산자 `=`(정확히 일치) 고정, 300ms 디바운스 후
 * `NumberFilterValue` set(빈 값=해제). `filterFn: numberFilterFn` 컬럼에 사용.
 */
export function NumberFloatingFilter({
  column,
  placeholder,
  label,
}: {
  column: GridFilterColumn;
  placeholder?: string;
  /** SR 라벨용 컬럼명. 미지정 시 `column.id` fallback(컬럼별 고유 보장). */
  label?: string;
}): JSX.Element {
  const current = column.value as NumberFilterValue | undefined;
  const [value, setValue] = useState<string>(
    current?.value !== undefined ? String(current.value) : '',
  );
  useEffect(() => {
    setValue(current?.value !== undefined ? String(current.value) : '');
  }, [current?.value]);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = value.trim();
      const num = Number(trimmed);
      if (trimmed === '' || Number.isNaN(num)) column.setValue(undefined);
      else column.setValue({ operator: '=', value: num } satisfies NumberFilterValue);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // ★column.id 안정 의존(GridFilterColumn=렌더마다 새 객체, ADR-006 D3).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, column.id]);

  return (
    <input
      type="number"
      aria-label={`${label ?? column.id} 숫자 필터`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder ?? '= 값'}
      style={inputStyle}
    />
  );
}
