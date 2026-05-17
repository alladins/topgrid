/**
 * EditableCell — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라(@storybook/react)는 MOD-GRID-99-B 에서 도입 예정.
 * 본 파일은 CSF3 컨벤션 (Meta default export + named Story exports) 만 유지하여
 * 인프라 도입 시 무수정 가용. 타입 import 0 — tsc strict 통과 보장.
 *
 * 시각 회귀 검증 시나리오 (spec AC-007 + AC-001):
 * - 5 editType variant: text / number / date / select / textarea
 * - cellClassName variant (Grid-level callback 주입 데모)
 * - 편집 플로우 (isEditing toggle — view ↔ edit)
 * - selectOptions 빈 배열 (EC-02/EC-03 placeholder)
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md
 * @see Spec MOD-GRID-05/G-003 Section 12.3 + AC-001 + AC-007
 */
import { EditableCell } from '../EditableCell.js';

const meta = {
  title: 'Cells/EditableCell',
  component: EditableCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

const NOOP = () => undefined;
const COMMIT_NOOP = (_v: string) => undefined;

/** Default — text editType, view mode. */
export const Default = {
  args: {
    value: 'Hello TOMIS',
    editType: 'text',
    isEditing: false,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Text editType — edit mode active. */
export const TextEditing = {
  args: {
    value: 'editable text',
    editType: 'text',
    isEditing: true,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Number editType — view mode. */
export const NumberView = {
  args: {
    value: 42,
    editType: 'number',
    isEditing: false,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Number editType — edit mode. */
export const NumberEditing = {
  args: {
    value: 42,
    editType: 'number',
    isEditing: true,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Date editType — edit mode (yyyy-mm-dd format). */
export const DateEditing = {
  args: {
    value: '2026-05-14',
    editType: 'date',
    isEditing: true,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Select editType — with options. */
export const SelectEditing = {
  args: {
    value: 'dev',
    editType: 'select',
    selectOptions: [
      { label: '개발팀', value: 'dev' },
      { label: '영업팀', value: 'sales' },
      { label: '디자인팀', value: 'design' },
    ],
    isEditing: true,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Select editType — empty options (EC-02/EC-03 placeholder fallback). */
export const SelectEmptyOptions = {
  args: {
    value: '',
    editType: 'select',
    selectOptions: [],
    isEditing: true,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Textarea editType — multi-line editing (D1 widening, EC-04 — Enter inserts newline). */
export const TextareaEditing = {
  args: {
    value: 'first line\nsecond line\nthird line',
    editType: 'textarea',
    isEditing: true,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** With cellClassName — Grid-level callback injection (D3 cell-level prop). */
export const WithCellClassName = {
  args: {
    value: 'highlighted',
    editType: 'text',
    isEditing: false,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
    cellClassName: 'bg-yellow-50 ring-1 ring-yellow-300',
  },
} as const;

/** Null value — view mode shows empty (EC-01). */
export const NullValue = {
  args: {
    value: null,
    editType: 'text',
    isEditing: false,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Undefined value — view mode shows empty (EC-01). */
export const UndefinedValue = {
  args: {
    value: undefined,
    editType: 'text',
    isEditing: false,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
  },
} as const;

/** Edit flow demo — view mode with rowIndex/columnId for debugging context. */
export const ViewWithDebugContext = {
  args: {
    value: 'click me',
    editType: 'text',
    isEditing: false,
    onStartEdit: NOOP,
    onCommit: COMMIT_NOOP,
    onCancel: NOOP,
    rowIndex: 5,
    columnId: 'name',
  },
} as const;
