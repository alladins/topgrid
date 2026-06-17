/**
 * @topgrid/grid-features — filter-ui 타입 정의.
 *
 * MOD-GRID-09 G-001: TextFilter, FilterPopover, FilterIndicator 공유 타입.
 *
 * 모든 Props 인터페이스는 index.ts export + Section 9 re-export 계획에 따라
 * 이 단일 파일에 통합. (C-4: no any, C-29: optional prop 명시)
 *
 * @remarks
 * `verbatimModuleSyntax: true` 환경 — import type 필수.
 * `exactOptionalPropertyTypes: true` 환경 — optional prop 전달 시
 * C-29 spread-skip 패턴 사용 (Section 4.6).
 */

import type * as React from 'react';
import type { Column, Table } from '@tanstack/react-table';
// W1 Phase 0: 순수 filter 값/연산자 타입은 framework-agnostic @topgrid/grid-core-headless 로 이관.
// 내부 prop 타입 사용(import) + 기존 소비처(index·grid-pro-filter=패키지 루트 경유) 보존(re-export).
import type {
  TextFilterOperator,
  TextFilterValue,
  NumberFilterOperator,
  NumberFilterValue,
  DateFilterValue,
} from '@topgrid/grid-core-headless';
export type {
  TextFilterOperator,
  TextFilterValue,
  NumberFilterOperator,
  NumberFilterValue,
  DateFilterValue,
};

// ---------------------------------------------------------------------------
// FilterPopover Props (Section 8)
// ---------------------------------------------------------------------------

/**
 * FilterPopover 컴포넌트 Props.
 *
 * 네이티브 div position:absolute 기반 팝오버 (D2: @radix-ui 없음).
 * 외부클릭(mousedown) / Escape 해제 / 포커스 관리 포함 (D4).
 */
export interface FilterPopoverProps {
  /** 팝오버 트리거 요소 렌더 함수 */
  trigger: React.ReactNode;
  /** 팝오버 내용 */
  children: React.ReactNode;
  /**
   * 정렬 방향 — 기본 'left'.
   * C-29: optional prop — 하위 전달 시 spread-skip 패턴 사용 (Section 4.6).
   */
  align?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// FilterIndicator Props (Section 8)
// ---------------------------------------------------------------------------

/**
 * FilterIndicator 컴포넌트 Props.
 * `column.getIsFiltered()` 결과값을 그대로 전달.
 */
export interface FilterIndicatorProps {
  /** column.getIsFiltered() 결과값 */
  isFiltered: boolean;
}

// ---------------------------------------------------------------------------
// TextFilter Props (Section 8)
// ---------------------------------------------------------------------------

/**
 * TextFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 *
 * C-4: Column<TData, unknown> — unknown cellValue로 any 방지.
 * C-29: optional prop (defaultOperator, popoverAlign) — spread-skip 패턴 사용처.
 */
export interface TextFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown> — cell value 타입 unknown (C-4). */
  column: Column<TData, unknown>;
  /**
   * 기본 연산자 — 기본 'contains'.
   * C-29: optional prop.
   */
  defaultOperator?: TextFilterOperator;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// NumberFilter 값 타입 (MOD-GRID-09 G-002)
// ---------------------------------------------------------------------------

// (NumberFilterOperator/NumberFilterValue 는 상단 @topgrid/grid-core-headless import+re-export.)

/**
 * NumberFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Column<TData, unknown> — cell value 타입 unknown (any 방지).
 * C-29: optional prop spread-skip 패턴 적용 (defaultOperator, popoverAlign).
 */
export interface NumberFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown>. */
  column: Column<TData, unknown>;
  /**
   * 기본 연산자 — 기본 '='.
   * C-29: optional prop.
   */
  defaultOperator?: NumberFilterOperator;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// DateFilter 값 타입 (MOD-GRID-09 G-003)
// ---------------------------------------------------------------------------

// (DateFilterValue 는 상단 @topgrid/grid-core-headless import+re-export.)

/**
 * DateFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Column<TData, unknown> — cell value 타입 unknown (any 방지).
 * C-29: optional prop spread-skip 패턴 적용 (popoverAlign).
 */
export interface DateFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown>. */
  column: Column<TData, unknown>;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// SelectFilter Props (MOD-GRID-09 G-004)
// ---------------------------------------------------------------------------

/**
 * SelectFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Column<TData, unknown> — cell value 타입 unknown (any 방지).
 * C-29: optional prop (searchThreshold, popoverAlign) — spread-skip 패턴 적용.
 *
 * 주의: consumer useReactTable options에
 * `getFacetedRowModel: getFacetedRowModel()` 와
 * `getFacetedUniqueValues: getFacetedUniqueValues()` 등록 필수 (D3).
 */
export interface SelectFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown>. */
  column: Column<TData, unknown>;
  /**
   * 내부 검색 표시 임계값 — 기본 50.
   * 옵션 수 >= searchThreshold 시 검색 input 자동 노출.
   * C-29: optional prop.
   */
  searchThreshold?: number;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// GlobalSearchInput Props (MOD-GRID-09 G-004)
// ---------------------------------------------------------------------------

/**
 * GlobalSearchInput 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Table<TData> — table 인스턴스 직접 수신.
 * C-29: optional prop (debounceMs, placeholder) — spread-skip 패턴 적용.
 *
 * 주의: consumer useReactTable options에 globalFilter state 등록 필요.
 */
export interface GlobalSearchInputProps<TData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * 디바운스 ms — 기본 300.
   * C-29: optional prop.
   */
  debounceMs?: number;
  /**
   * 입력 placeholder — 기본 'Search all columns…'.
   * C-29: optional prop.
   */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// FilterResetButton Props (MOD-GRID-09 G-004)
// ---------------------------------------------------------------------------

/**
 * FilterResetButton 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Table<TData>.
 * C-29: children optional.
 */
export interface FilterResetButtonProps<TData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * 버튼 레이블 — 기본 'Reset Filters'.
   * C-29: optional prop.
   */
  children?: React.ReactNode;
}
