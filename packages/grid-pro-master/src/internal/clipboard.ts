/**
 * @topgrid/grid-pro-master — clipboard re-export shim (W1 Phase 0).
 * 구현(cellValueToClipboardText)은 framework-agnostic @topgrid/grid-core-headless 로 이관.
 * 기존 내부 소비처(index·makeCopyCellItem) 보존 위해 re-export.
 */
export { cellValueToClipboardText } from '@topgrid/grid-core-headless';
