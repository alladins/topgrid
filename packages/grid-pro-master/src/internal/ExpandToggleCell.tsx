/**
 * Internal expand/collapse toggle button cell for Master-Detail grid rows.
 *
 * NOT part of the public API surface — do not re-export from src/index.ts.
 *
 * @internal
 * @see G-001-spec.md Section 8.2
 */

import type { MouseEvent } from 'react';

/** Indent pixels per depth level (matches TreeGrid.tsx:17 INDENT_PX). */
const INDENT_PX = 16;

interface ExpandToggleCellProps {
  /** Whether the row is currently expanded. */
  isExpanded: boolean;
  /** Row depth (0 = root). Controls left padding indent. */
  depth: number;
  /** Toggle handler — called with the original mouse event. */
  onToggle: (e: MouseEvent) => void;
}

/**
 * Renders an expand/collapse toggle button with depth-based indentation.
 *
 * Stops click propagation to prevent row click handlers from firing on toggle.
 */
export function ExpandToggleCell({ isExpanded, depth, onToggle }: ExpandToggleCellProps) {
  return (
    <div className="flex items-center" style={{ paddingLeft: `${depth * INDENT_PX}px` }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(e);
        }}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label={isExpanded ? '접기' : '펼치기'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? '▼' : '▶'}
      </button>
    </div>
  );
}
