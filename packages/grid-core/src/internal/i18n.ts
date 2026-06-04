/**
 * Grid chrome localization + icons (MOD-GRID-29 G-1) — pure.
 *
 * ★ Spine — missing-key fallback: `resolveLocale`/`resolveIcons` MERGE a partial override over the
 * complete default, so an unknown or un-overridden key always falls back to the default string,
 * NEVER the raw key or `undefined`. A resolver that emits the key on a typo passes the happy path
 * and ships gibberish (the LESS-006 trap for i18n). The defaults are complete, so the merge can
 * never produce a hole.
 *
 * Defaults are Korean (matching the grid's existing chrome). Full localization = override the
 * relevant keys via the `localeText` / `icons` props.
 */

import { announceSortMessage, announceSelectionMessage } from './liveAnnounce';
import type { SortingState } from '@tanstack/react-table';

/** Localizable grid chrome strings. Parametrized entries are functions. */
export interface GridLocale {
  /** Empty-state default text. */
  emptyText: string;
  /** Pagination "rows per page" label. */
  rowsPerPage: string;
  /** Pagination total-count text (e.g. `전체 N건`). */
  totalCount: (count: number) => string;
  /** Pagination nav button `aria-label`s — screen-reader heard (MOD-28 audience). */
  firstPage: string;
  prevPage: string;
  nextPage: string;
  lastPage: string;
  /** Screen-reader sort-change announcement. */
  sortMessage: (sorting: SortingState, labelOf: (columnId: string) => string) => string;
  /** Screen-reader selection-change announcement. */
  selectionMessage: (count: number) => string;
}

/** Grid chrome icon glyphs (sort indicators). */
export interface GridIcons {
  sortAscending: string;
  sortDescending: string;
  sortNone: string;
}

export const defaultGridLocale: GridLocale = {
  emptyText: '데이터가 없습니다.',
  rowsPerPage: '페이지당 행 수:',
  totalCount: (count) => `전체 ${count}건`,
  firstPage: '첫 페이지',
  prevPage: '이전 페이지',
  nextPage: '다음 페이지',
  lastPage: '마지막 페이지',
  sortMessage: announceSortMessage,
  selectionMessage: announceSelectionMessage,
};

export const defaultGridIcons: GridIcons = {
  sortAscending: '▲',
  sortDescending: '▼',
  sortNone: '⇅',
};

/** Merge a partial override over the complete default locale (missing keys fall back). */
export function resolveLocale(overrides?: Partial<GridLocale>): GridLocale {
  return overrides ? { ...defaultGridLocale, ...overrides } : defaultGridLocale;
}

/** Merge a partial override over the complete default icon set (missing keys fall back). */
export function resolveIcons(overrides?: Partial<GridIcons>): GridIcons {
  return overrides ? { ...defaultGridIcons, ...overrides } : defaultGridIcons;
}
